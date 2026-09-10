"use client";

import { useEffect, useState } from "react";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Icon,
  Input,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import { hasCookie } from "@/helpers/cookie";
import { redirect, useSearchParams } from "@/compat/next-navigation";
import { getSelf } from "@/requests/user";
import { approveDeviceCode, denyDeviceCode } from "@/requests/auth";
import { readItem } from "@/requests/helpers";
import { UserType } from "@/types/UserType";

type LinkStatus = "idle" | "approving" | "denying" | "approved" | "denied";

export default function LinkDevicePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserType>();
  const [userCode, setUserCode] = useState(searchParams.get("code") ?? "");
  const [status, setStatus] = useState<LinkStatus>("idle");

  useEffect(() => {
    async function loadUser() {
      if (!hasCookie("token")) {
        redirect("/login");
        return;
      }

      const response = await getSelf();
      if (response.status === 200) {
        setUser((await readItem<UserType>(response)) ?? undefined);
      } else {
        redirect("/login");
      }
    }

    loadUser();
  }, []);

  const normalizedCode = userCode.trim().toUpperCase();

  async function handleApprove() {
    if (!normalizedCode) {
      addToast({ title: "Enter the code shown in the game" });
      return;
    }
    setStatus("approving");
    try {
      const response = await approveDeviceCode(normalizedCode);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.error?.message ?? "Failed to approve device" });
        setStatus("idle");
        return;
      }
      setStatus("approved");
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to approve device" });
      setStatus("idle");
    }
  }

  async function handleDeny() {
    if (!normalizedCode) {
      addToast({ title: "Enter the code shown in the game" });
      return;
    }
    setStatus("denying");
    try {
      const response = await denyDeviceCode(normalizedCode);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.error?.message ?? "Failed to deny device" });
        setStatus("idle");
        return;
      }
      setStatus("denied");
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to deny device" });
      setStatus("idle");
    }
  }

  if (!user) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Hstack>
            <Spinner />
            <Text size="xl">Loading</Text>
          </Hstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack>
      <Card className="max-w-md">
        <Vstack align="start" className="gap-4">
          <Hstack>
            <Icon name="gamepad2" />
            <Text size="xl" weight="semibold" color="text">
              Link a Game
            </Text>
          </Hstack>

          {status === "approved" ? (
            <Text color="textFaded">
              Device linked. You can close this window and return to the game.
            </Text>
          ) : status === "denied" ? (
            <Text color="textFaded">
              Request denied. You can close this window.
            </Text>
          ) : (
            <>
              <Text size="sm" color="textFaded">
                A game is requesting to link to your account as{" "}
                <span className="font-semibold">{user.name}</span>. This will
                let the game submit scores and achievements on your behalf.
              </Text>
              <Input
                label="Code"
                labelPlacement="outside"
                placeholder="ABCD-1234"
                value={userCode}
                onValueChange={(value) => setUserCode(value.toUpperCase())}
              />
              <Hstack>
                <Button
                  color="red"
                  variant="ghost"
                  loading={status === "denying"}
                  onClick={handleDeny}
                >
                  Deny
                </Button>
                <Button
                  color="blue"
                  loading={status === "approving"}
                  onClick={handleApprove}
                >
                  Approve
                </Button>
              </Hstack>
            </>
          )}
        </Vstack>
      </Card>
    </Vstack>
  );
}
