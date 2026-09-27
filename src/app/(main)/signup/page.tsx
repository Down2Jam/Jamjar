"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Button } from "bioloom-ui";
import { Input } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { signup } from "@/requests/auth";
import { addToast, Form } from "bioloom-ui";
import { useState } from "react";
import Cookies from "js-cookie";
import { synchronizeSession } from "@/requests/sessionState";

const SESSION_DURATION_DAYS = 30;

export default function UserPage() {
  const uiText = useUiTranslations();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [email, setEmail] = useState("");
  const { siteTheme } = useTheme();
  return (
    <div className="absolute flex items-center justify-center top-0 left-0 w-screen h-screen">
      <Form
        className="w-full max-w-xs flex flex-col gap-4"
        onReset={() => {
          setUsername("");
          setPassword("");
          setPassword2("");
          setEmail("");
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          const showError = (message: string) => {
            addToast({ title: message });
          };

          if (!password || !username || !password2) {
            if (password && password.length < 8) {
              setPassword2("");
              showError("Password must be minimum 8 characters");
              return;
            }

            if (!password) {
              showError("Please enter a valid password");
            }

            if (!password2) {
              showError("Please reenter your password");
            }

            if (!username) {
              showError("Please enter a valid username");
            }
            return;
          }

          if (username.length > 32) {
            setPassword2("");
            showError("Usernames can be maximum 32 characters");
            return;
          }

          if (password.length < 8) {
            setPassword2("");
            showError("Password must be minimum 8 characters");
            return;
          }

          if (password != password2) {
            setPassword2("");
            showError("Passwords do not match");
            return;
          }

          const response = await signup(username, password, email);

          if (response.status == 409) {
            showError("User already exists");
            setPassword2("");
            return;
          }

          const json = await response.json();
          const session = json?.data ?? json;
          const token = response.headers.get("Authorization") ?? session?.token;
          const user = session?.user;

          if (!token || !user?.slug) {
            showError("Failed to retrieve login session");
            setPassword2("");
            return;
          }

          Cookies.set("token", token, { expires: SESSION_DURATION_DAYS, path: "/", sameSite: "strict", secure: location.protocol === "https:" });
          Cookies.set("user", user.slug, {
            expires: SESSION_DURATION_DAYS,
            path: "/",
          });
          Cookies.set("hasLoggedIn", "true", { expires: 36500 });
          synchronizeSession(true);

          addToast({
            title: uiText("AppStrings.SuccessfullySignedUp"),
          });

          window.location.replace("/");
        }}
      >
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
          label={uiText("Settings.Email.Title")}
          labelPlacement="outside"
          name="email"
          placeholder={uiText("AppStrings.Optional")}
          type="text"
          value={email}
          onValueChange={setEmail}
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
          autoComplete="new-password"
        />
        <Input
          required
          label={uiText("AppStrings.PasswordConfirmation")}
          labelPlacement="outside"
          name="password2"
          placeholder={uiText("AppStrings.ReenterYourPassword")}
          type="password"
          value={password2}
          onValueChange={setPassword2}
          autoComplete="new-password"
        />
        <div className="flex gap-2">
          <Button type="submit" color="blue">
             {uiText("AppStrings.Submit")} </Button>
          <Button type="reset">{uiText("Settings.Reset.Title")}</Button>
        </div>
        <p
          className="transition-color duration-250"
          style={{
            color: siteTheme.colors["text"],
          }}
        >
           {uiText("AppStrings.AlreadyHaveAnAccount")} <Link href="/login">{uiText("AppStrings.LogIn")}</Link>
        </p>
      </Form>
    </div>
  );
}
