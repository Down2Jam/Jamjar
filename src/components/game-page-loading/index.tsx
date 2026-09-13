import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Card, getNeutralBorderColor } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";

export default function GamePageLoading() {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const borderColor = getNeutralBorderColor(colors);
  const placeholderColor = `color-mix(in srgb, ${colors.text} 6%, ${colors.mantle})`;
  const placeholder = (className: string) => (
    <div className={`rounded-md ${className}`} style={{ backgroundColor: placeholderColor }} />
  );

  return (
    <div role="status" aria-label={uiText("AppStrings.LoadingGame")} aria-busy="true">
      <Card shadow="none" padding={0} className="overflow-hidden !rounded-none !border-0 lg:!rounded-xl lg:!border">
        <div aria-hidden="true" className="motion-safe:animate-pulse">
          <div className="h-60" style={{ backgroundColor: placeholderColor }} />
          <div className="grid gap-6 border-t p-4 md:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,962px)_minmax(360px,1fr)]" style={{ borderColor }}>
            <div className="min-w-0">
              {placeholder("h-9 w-2/5")}
              {placeholder("mt-3 h-4 w-1/4")}
              <div className="mt-6 flex gap-3">
                {placeholder("h-24 w-1/3")}
                {placeholder("h-24 w-1/3")}
              </div>
              <div className="mt-8 space-y-3 pb-8">
                {placeholder("h-4 w-full")}
                {placeholder("h-4 w-11/12")}
                {placeholder("h-4 w-3/4")}
              </div>
            </div>
            <div className="space-y-4">
              <Card shadow="none">
                {placeholder("h-3 w-20")}
                <div className="mt-3 flex gap-2">
                  {placeholder("h-6 w-20")}
                  {placeholder("h-6 w-24")}
                </div>
              </Card>
              <Card shadow="none">
                {placeholder("h-3 w-16")}
                {placeholder("mt-3 aspect-video w-full")}
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
