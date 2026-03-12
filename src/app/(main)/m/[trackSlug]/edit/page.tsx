import ClientTrackEditPage from "./ClientTrackEditPage";

export default function TrackEditPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  return <ClientTrackEditPage params={params} />;
}
