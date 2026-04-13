import ClientTrackEditPage from "./ClientTrackEditPage";
import { PageVersion } from "@/types/GameType";

export default function TrackEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackSlug: string }>;
  searchParams: Promise<{ pageVersion?: PageVersion }>;
}) {
  return <ClientTrackEditPage params={params} searchParams={searchParams} />;
}
