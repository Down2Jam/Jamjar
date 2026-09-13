"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Button } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Input } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { login } from "@/requests/auth";
import { addToast, Form } from "bioloom-ui";
import { useState } from "react";
import Cookies from "js-cookie";

const SESSION_DURATION_DAYS = 14;

export default function UserPage() {
  const uiText = useUiTranslations();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="absolute flex items-center justify-center top-0 left-0 w-screen h-screen">
      <Form
        className="w-full max-w-xs flex flex-col gap-4"
        onReset={() => {
          setUsername("");
          setPassword("");
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!username && !password) {
            addToast({
              title: uiText("AppStrings.PleaseEnterAValidUsernameAndPassword"),
            });
            return;
          }

          if (!username) {
            addToast({
              title: uiText("AppStrings.PleaseEnterAValidUsername"),
            });
            return;
          }

          if (!password) {
            addToast({
              title: uiText("AppStrings.PleaseEnterAValidPassword"),
            });
            return;
          }

          const response = await login(username, password);

          if (response.status == 401) {
            addToast({
              title: uiText("AppStrings.InvalidUsernameOrPassword"),
            });
            setPassword("");
            return;
          }

          const json = await response.json();
          const session = json?.data ?? json;
          const user = session?.user;
          const token = response.headers.get("Authorization") ?? session?.token;

          if (!token || !user?.slug) {
            addToast({
              title: uiText("AppStrings.FailedToRetrieveLoginSession"),
            });
            setPassword("");
            return;
          }

          Cookies.set("token", token, { expires: SESSION_DURATION_DAYS, path: "/" });
          Cookies.set("user", user.slug, {
            expires: SESSION_DURATION_DAYS,
            path: "/",
          });
          Cookies.set("hasLoggedIn", "true", { expires: 36500 });

          addToast({
            title: uiText("AppStrings.SuccessfullyLoggedIn"),
          });

          window.location.replace("/");
        }}
      >
        <Card>
          <Vstack align="start">
            <Hstack>
              <Icon name="login" />
              <Text size="xl" weight="semibold" color="text">
                 {uiText("AppStrings.LogIn")} </Text>
            </Hstack>
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.LogIntoAnExistingAccountOnTheSite")} </Text>
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start">
            <Input
              required
              label={uiText("AppStrings.Username")}
              labelPlacement="outside"
              name="username"
              placeholder={uiText("AppStrings.EnterYourUsername")}
              type="text"
              value={username}
              onValueChange={setUsername}
            />

            <Input
              required
              label={uiText("AppStrings.Password")}
              labelPlacement="outside"
              name="password"
              placeholder={uiText("AppStrings.EnterYourPassword")}
              type="password"
              value={password}
              onValueChange={setPassword}
            />

            <div className="flex gap-2">
              <Button color="blue" type="submit" icon="login">
                 {uiText("AppStrings.Submit")} </Button>
              <Button type="reset" icon="rotateccw">
                 {uiText("Settings.Reset.Title")} </Button>
            </div>
          </Vstack>
        </Card>
        <Card>
          <Text color="text">
             {uiText("AppStrings.DonAndAposTHaveAnAccount")} <Link href="/signup">{uiText("Themes.Signup")}</Link>
          </Text>
        </Card>
        <Card>
          <Link href="/forgot-password">{uiText("AppStrings.ForgotPassword2")}</Link>
        </Card>
      </Form>
    </div>
  );
}
