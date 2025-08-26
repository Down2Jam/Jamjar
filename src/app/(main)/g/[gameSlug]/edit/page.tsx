import ClientGameEditPage from "./ClientGameEditPage";

export default function GameEditPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  return <ClientGameEditPage params={params} />;
}
