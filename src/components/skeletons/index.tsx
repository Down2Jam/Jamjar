import { useTranslations } from "@/compat/next-intl";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function UserProfileSkeleton() {
  const uiText = useTranslations();

  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">{uiText("AppStrings.Loading")}</span>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
        <Skeleton className="aspect-11/1 min-h-24 w-full rounded-none" />
        <div className="relative px-4 pb-6 pt-4 sm:px-8 sm:pb-8">
          <Skeleton className="absolute -top-12 left-4 h-24 w-24 rounded-full sm:left-16" />
          <div className="ml-28 space-y-3 sm:ml-44">
            <Skeleton className="h-8 w-48 max-w-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {["w-28", "w-24", "w-32", "w-20"].map((width) => (
              <Skeleton key={width} className={`h-8 ${width}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function PostListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="mb-3 h-7 w-2/3 max-w-[520px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-9 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarCardSkeleton({
  lines = 3,
  media = false,
  className = "",
}: SkeletonProps & { lines?: number; media?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.035] p-4 ${className}`}>
      {media && <Skeleton className="mb-4 aspect-video w-full rounded-xl" />}
      <Skeleton className="mb-4 h-6 w-1/2" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
