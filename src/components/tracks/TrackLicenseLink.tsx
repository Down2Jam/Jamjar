import { getTrackLicense } from "@/helpers/trackLicense";

export default function TrackLicenseLink({
  license,
  className,
}: {
  license?: string | null;
  className?: string;
}) {
  if (!license) return null;

  const definition = getTrackLicense(license);
  const external = definition.url.startsWith("http");

  return (
    <a
      href={definition.url}
      className={["text-inherit no-underline", className].filter(Boolean).join(" ")}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      {definition.label}
    </a>
  );
}
