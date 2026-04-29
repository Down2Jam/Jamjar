"use client";

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
              <Text size="xl">Checking admin access</Text>
            </Hstack>
            <Text color="textFaded">
              Verifying your account permissions.
            </Text>
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
                <Text size="xl">Sign in required</Text>
              </Hstack>
              <Text color="textFaded">
                You need to sign in before accessing admin tools.
              </Text>
            </Vstack>
            <Hstack>
              <Button href="/login" color="blue" icon="login">
                Sign in
              </Button>
              <Button href="/signup" icon="userplus">
                Create account
              </Button>
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
                <Text size="xl">Admin only</Text>
              </Hstack>
              <Text color="textFaded">
                {user?.name || "This account"} does not have admin access.
              </Text>
            </Vstack>
            <Button href="/home" icon="arrowleft">
              Return home
            </Button>
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
              <Text size="xl">Access check failed</Text>
            </Hstack>
            <Text color="textFaded">
              Something went wrong while checking your admin session.
            </Text>
          </Vstack>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            icon="rotateccw"
          >
            Retry
          </Button>
        </Vstack>
      </Card>
    </Vstack>
  );
}
