import { Card } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";

export default function TrackPageLoading() {
  const { colors } = useTheme();
  const placeholderColor = `color-mix(in srgb, ${colors.text} 6%, ${colors.mantle})`;
  const placeholder = (className: string) => (
    <div className={`rounded-md ${className}`} style={{ backgroundColor: placeholderColor }} />
  );

  return (
    <div role="status" aria-label="Loading track" aria-busy="true">
      <Card shadow="none" padding={0} className="mb-6 overflow-hidden !rounded-none !border-0 lg:!rounded-xl lg:!border">
        <div aria-hidden="true" className="motion-safe:animate-pulse p-4 md:p-6">
              {placeholder("h-3 w-24")}
              {placeholder("mt-4 h-9 w-2/5")}
              {placeholder("mt-3 h-4 w-1/4")}
              <Card shadow="none" className="mt-6">
                <div className="flex items-center gap-3">
                  {placeholder("h-12 w-12 shrink-0")}
                  {placeholder("h-4 w-1/3")}
                </div>
                {placeholder("mt-4 h-24 w-full")}
                <div className="mt-3 flex justify-between">
                  {placeholder("h-3 w-10")}
                  {placeholder("h-3 w-10")}
                </div>
              </Card>
        </div>
      </Card>
      <Card shadow="none" padding={0} className="overflow-hidden !rounded-none !border-0 lg:!rounded-xl lg:!border">
        <div aria-hidden="true" className="motion-safe:animate-pulse">
          <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,962px)_minmax(360px,1fr)]">
            <div className="min-w-0">
              <div className="space-y-3 pb-8">
                {placeholder("h-6 w-1/3")}
                {placeholder("h-4 w-full")}
                {placeholder("h-4 w-11/12")}
                {placeholder("h-4 w-3/4")}
              </div>
            </div>
            <div className="space-y-4">
              {[3, 2, 1, 2].map((rows, index) => (
                <Card key={index} shadow="none">
                  {placeholder("h-3 w-20")}
                  {Array.from({ length: rows }, (_, row) => (
                    <div key={row} className="mt-3 flex gap-2">
                      {placeholder("h-6 w-20")}
                      {placeholder("h-6 w-24")}
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
