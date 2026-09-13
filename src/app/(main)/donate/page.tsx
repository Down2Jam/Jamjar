import { useTranslations as useUiTranslations } from "@/compat/next-intl";
export default function RSSPage() {
  const uiText = useUiTranslations();
  return <p>{uiText("AppStrings.DonationPageAndAWayToDonateComing")}</p>;
}
