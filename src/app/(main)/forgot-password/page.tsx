import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";

export default function ForgotPage() {
  const uiText = useUiTranslations();
  return (
    <Vstack>
      <Card>
        <Vstack>
          <Hstack>
            <Icon name="circlehelp" />
            <Text size="xl">{uiText("AppStrings.ForgotPassword")}</Text>
          </Hstack>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.ResettingYourAccountPassword")} </Text>
        </Vstack>
      </Card>
      <Card className="max-w-96">
        <Text color="textFaded">
           {uiText("AppStrings.TheAutomaticPasswordResetSystemIsStillBeing")}{" "}
          <Link href="https://discord.d2jam.com">{uiText("AppStrings.DiscordServer")}</Link>  {uiText("AppStrings.PingInAChannelOrDmWithContext")} </Text>
      </Card>
    </Vstack>
  );
}
