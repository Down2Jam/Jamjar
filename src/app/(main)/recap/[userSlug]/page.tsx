import Recap from "@/components/recap";
import { Suspense } from "react";

export default async function PublicRecapPage({
  params,
}: {
  params: Promise<{ userSlug: string }>;
}) {
  const { userSlug } = await params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Recap targetUserSlug={userSlug} />
    </Suspense>
  );
}
