"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chip } from "@/framework/Chip";
import { BASE_URL } from "@/requests/config";

type TeamGame = { game?: { published?: boolean } | null } | null;
type User = {
  id: number;
  name: string | null;
  slug: string;
  profilePicture?: string | null;
  teams?: TeamGame[] | null;
};

type ApiResponse = {
  message: string;
  data: User[];
};

type TrackStyle = React.CSSProperties & { ["--dur"]?: string };

function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function UserTicker() {
  const [users, setUsers] = useState<User[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState<number>(12);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users`, { cache: "no-store" });
        if (!res.ok) return;
        const json: ApiResponse = await res.json();
        setUsers(Array.isArray(json?.data) ? json.data : []);
      } catch {}
    };
    load();
  }, []);

  const baseUsers = useMemo(() => {
    const filtered = (users ?? []).filter(
      (u) =>
        u?.teams &&
        u.teams.length > 0 &&
        u.teams.some((t) => t?.game?.published)
    );
    return shuffle(filtered);
  }, [users]);

  const MIN_CHIPS = 30;
  const repeatedUsers = useMemo(() => {
    const reps = Math.ceil(MIN_CHIPS / Math.max(1, baseUsers.length));
    const out: User[] = [];
    for (let i = 0; i < reps; i++) out.push(...baseUsers);
    return out.slice(0, Math.max(MIN_CHIPS, baseUsers.length));
  }, [baseUsers]);

  const trackStyle: TrackStyle = useMemo(
    () => ({ "--dur": `${duration}s` }),
    [duration]
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const SPEED = 120;
      const w = el.scrollWidth;
      if (w > 0) setDuration(w / SPEED);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, [repeatedUsers]);

  const TrackContent = ({ prefix = "" }: { prefix?: string }) => (
    <>
      {repeatedUsers.map((user, idx) => (
        <div
          className="shrink-0 mr-4 last:mr-0 flex"
          key={`${prefix}${user.slug}-${idx}`}
        >
          <Chip
            href={`/u/${user.slug}`}
            avatarSrc={user.profilePicture || undefined}
          >
            {user.name ?? user.slug}
          </Chip>
        </div>
      ))}
      {/* Gap before next loop */}
      <div className="shrink-0 w-32" />
    </>
  );

  if (baseUsers.length === 0) return null;

  return (
    <>
      {/* Fixed bottom bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none bg-gradient-to-t from-[rgba(10,10,14,0.85)] to-[rgba(10,10,14,0.35)]"
        aria-hidden="false"
      >
        <div className="relative mx-auto max-w-screen-2xl overflow-hidden py-2">
          <div className="marquee pointer-events-auto">
            <div className="marquee__track" style={trackStyle} ref={trackRef}>
              <TrackContent />
            </div>
            <div
              className="marquee__track"
              aria-hidden="true"
              style={trackStyle}
            >
              <TrackContent prefix="dup-" />
            </div>
          </div>

          {/* Soft edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[rgba(10,10,14,0.85)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[rgba(10,10,14,0.85)] to-transparent" />
        </div>
      </div>

      <style jsx>{`
        .marquee {
          display: flex;
          overflow: hidden;
          position: relative;
          gap: 0; /* tracks sit side-by-side */
        }
        .marquee__track {
          display: flex;
          align-items: center;
          flex: none;
          animation: scroll var(--dur, 12s) linear infinite;
        }

        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .marquee__track {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
