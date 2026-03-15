import Navbar from "../../components/navbar";
import PageBackground from "./PageBackground";
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCurrentJam } from "@/helpers/jam";
import { queryKeys } from "@/hooks/queries/queryKeys";

// import Footer from "@/components/footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.jam.current(),
    queryFn: getCurrentJam,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageBackground>
      <Navbar />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="mt-4 max-w-6xl xl:max-w-7xl 2xl:max-w-[96em] mx-auto grow w-full px-2 sm:px-8 z-10">
          {children}
        </div>
      </HydrationBoundary>
    </PageBackground>
  );
}
