"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { hasCookie } from "@/helpers/cookie";
import { getSelf } from "@/requests/user";
import { readItem } from "@/requests/helpers";
import type { UserType } from "@/types/UserType";
import { Button, Card, Hstack, Icon, Spinner, Text, Vstack } from "bioloom-ui";

type GateStatus = "loading" | "unauthenticated" | "unauthorized" | "error";

export default function AdminGate({
  children,
}: {
  children: ReactNode;
}) {
  const uiText = useUiTranslations();
  const [status, setStatus] = useState<GateStatus | "ready">("loading");
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      if (!hasCookie("token")) {
        if (active) setStatus("unauthenticated");
        return;
      }

      try {
        const response = await getSelf();
        if (!response.ok) {
          if (active) setStatus("unauthenticated");
          return;
        }

        const data = await readItem<UserType>(response);
        if (!active) return;
        setUser(data);
        setStatus(data?.admin ? "ready" : "unauthorized");
      } catch (error) {
        console.error("Failed to validate admin session", error);
        if (active) setStatus("error");
      }
    };

    checkAccess();
    return () => {
      active = false;
    };
  }, []);

  if (status === "ready") return <>{children}</>;

  if (status === "loading") {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">{uiText("AppStrings.CheckingAdminAccess")}</Text>
            </Hstack>
            <Text color="textFaded">
               {uiText("AppStrings.VerifyingYourAccountPermissions")} </Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">{uiText("AppStrings.SignInRequired")}</Text>
              </Hstack>
              <Text color="textFaded">
                 {uiText("AppStrings.YouNeedToSignInBeforeAccessingAdmin")} </Text>
            </Vstack>
            <Hstack>
              <Button href="/login" color="blue" icon="login">
                 {uiText("AppStrings.SignIn")} </Button>
              <Button href="/signup" icon="userplus">
                 {uiText("AppStrings.CreateAccount")} </Button>
            </Hstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (status === "unauthorized") {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="shieldx" />
                <Text size="xl">{uiText("AppStrings.AdminOnly")}</Text>
              </Hstack>
              <Text color="textFaded">
                {user?.name || uiText("AppStrings.ThisAccount")}  {uiText("AppStrings.DoesNotHaveAdminAccess")} </Text>
            </Vstack>
            <Button href="/home" icon="arrowleft">
               {uiText("AppStrings.ReturnHome")} </Button>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack>
      <Card className="max-w-96">
        <Vstack>
          <Vstack gap={0}>
            <Hstack>
                <Icon name="circlealert" />
              <Text size="xl">{uiText("AppStrings.AccessCheckFailed")}</Text>
            </Hstack>
            <Text color="textFaded">
               {uiText("AppStrings.SomethingWentWrongWhileCheckingYourAdminSession")} </Text>
          </Vstack>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            icon="rotateccw"
          >
             {uiText("AppStrings.Retry")} </Button>
        </Vstack>
      </Card>
    </Vstack>
  );
}
