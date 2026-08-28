#!/usr/bin/env bash
set -Eeuo pipefail

deploy_root="${1:?Usage: deploy-production.sh DEPLOY_ROOT}"
deploy_root="$(cd "$deploy_root" && pwd -P)"
core_dir="$deploy_root/jamcore"
jar_dir="$deploy_root/jamjar"
backup_dir="$deploy_root/.deploy-backups"

for repo_dir in "$core_dir" "$jar_dir"; do
  if [[ ! -d "$repo_dir/.git" ]]; then
    echo "Expected a Git repository at $repo_dir" >&2
    exit 1
  fi
done

exec 9>"${TMPDIR:-/tmp}/down2jam-production-deploy.lock"
if ! flock -w 1800 9; then
  echo "Timed out waiting for another production deployment to finish." >&2
  exit 1
fi

if docker info >/dev/null 2>&1; then
  docker_cmd=(docker)
elif sudo -n docker info >/dev/null 2>&1; then
  docker_cmd=(sudo docker)
else
  echo "Docker is unavailable. Give the deploy user Docker access or passwordless sudo for Docker." >&2
  exit 1
fi

compose() {
  local project_dir="$1"
  shift
  (cd "$project_dir" && "${docker_cmd[@]}" compose "$@")
}

update_repo() {
  local repo_dir="$1"
  local name="$2"

  if [[ "$(git -C "$repo_dir" branch --show-current)" != "main" ]]; then
    echo "$name must be checked out on the main branch." >&2
    exit 1
  fi

  if ! git -C "$repo_dir" diff --quiet || ! git -C "$repo_dir" diff --cached --quiet; then
    echo "$name has modified tracked files; refusing to overwrite them." >&2
    exit 1
  fi

  echo "Updating $name..."
  git -C "$repo_dir" fetch origin main
  local current_commit
  local target_commit
  current_commit="$(git -C "$repo_dir" rev-parse HEAD)"
  target_commit="$(git -C "$repo_dir" rev-parse origin/main)"

  if ! git -C "$repo_dir" merge-base --is-ancestor "$current_commit" "$target_commit"; then
    echo "$name is ahead of or diverged from origin/main; refusing a destructive reset." >&2
    exit 1
  fi

  git -C "$repo_dir" merge --ff-only "$target_commit"
}

wait_for_health() {
  local project_dir="$1"
  local service="$2"
  local attempts=60

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    local container_id
    local state
    container_id="$(compose "$project_dir" ps -q "$service")"
    if [[ -n "$container_id" ]]; then
      state="$("${docker_cmd[@]}" inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
      if [[ "$state" == "healthy" || "$state" == "running" ]]; then
        echo "$service is $state."
        return 0
      fi
      if [[ "$state" == "unhealthy" || "$state" == "exited" || "$state" == "dead" ]]; then
        echo "$service entered state: $state" >&2
        compose "$project_dir" logs --tail=100 "$service" >&2
        return 1
      fi
    fi
    sleep 5
  done

  echo "Timed out waiting for $service to become healthy." >&2
  compose "$project_dir" logs --tail=100 "$service" >&2
  return 1
}

update_repo "$core_dir" jamcore
update_repo "$jar_dir" jamjar

echo "Building production images while the current services stay online..."
compose "$core_dir" build jamcore
compose "$jar_dir" build jamjar

install -d -m 700 "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
database_backup="$backup_dir/jamcore-postgres-$timestamp.sql.gz"
uploads_backup="$backup_dir/jamcore-uploads-$timestamp.tar.gz"

if [[ -n "$(compose "$core_dir" ps --status running -q postgres)" ]]; then
  echo "Backing up PostgreSQL..."
  compose "$core_dir" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip -c >"$database_backup"
  test -s "$database_backup"
else
  echo "PostgreSQL is not running; treating this as an initial deployment."
  database_backup=""
fi

if [[ -n "$(compose "$core_dir" ps --status running -q jamcore)" ]]; then
  echo "Backing up local image and music uploads..."
  compose "$core_dir" exec -T jamcore sh -c '
    cd /usr/src/app/public
    paths=""
    for path in images music; do
      if [ -d "$path" ]; then paths="$paths $path"; fi
    done
    if [ -n "$paths" ]; then tar -czf - $paths; fi
  ' >"$uploads_backup"
  if [[ ! -s "$uploads_backup" ]]; then
    rm -f "$uploads_backup"
    uploads_backup=""
  fi
else
  uploads_backup=""
fi

# This also performs the one-time migration of music uploaded before its named
# volume was introduced. Existing files are restored before the new app starts.
if [[ -n "$uploads_backup" ]]; then
  echo "Restoring uploads into persistent volumes..."
  compose "$core_dir" run --rm -T --no-deps --entrypoint sh jamcore \
    -c 'tar -xzf - -C /usr/src/app/public' <"$uploads_backup"
fi

echo "Starting Jamcore and applying checked Prisma migrations..."
compose "$core_dir" up -d --no-build postgres jamcore
wait_for_health "$core_dir" jamcore

echo "Starting Jamjar..."
compose "$jar_dir" up -d --no-build jamjar
wait_for_health "$jar_dir" jamjar

echo "Deployment completed successfully."
if [[ -n "$database_backup" ]]; then echo "Database backup: $database_backup"; fi
if [[ -n "$uploads_backup" ]]; then echo "Uploads backup: $uploads_backup"; fi
