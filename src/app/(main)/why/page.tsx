import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Link } from "bioloom-ui";

export default function WhyPage() {
  const uiText = useUiTranslations();
  return (
    <p>
       {uiText("AppStrings.PageComingSoonInTheMeantimeTheresSome")}{" "}
      <Link href="https://www.youtube.com/watch?v=-Bs6EO_Co7Q">
        https://www.youtube.com/watch?v=-Bs6EO_Co7Q
      </Link>
    </p>
  );
}
