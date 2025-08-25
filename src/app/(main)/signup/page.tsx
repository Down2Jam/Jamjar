"use client";

import { Button } from "@/framework/Button";
import { Input } from "@/framework/Input";
import { Link } from "@/framework/Link";
import { useTheme } from "@/providers/SiteThemeProvider";
import { signup } from "@/requests/auth";
import { addToast, Form } from "@heroui/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Cookies from "js-cookie";

export default function UserPage() {
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

          const { token, user } = await response.json();
          document.cookie = `token=${token}`;
          document.cookie = `user=${user.slug}`;
          Cookies.set("hasLoggedIn", "true", { expires: 36500 });

          addToast({
            title: "Successfully signed up",
          });

          redirect("/");
        }}
      >
        <Input
          required
          label="Username"
          labelPlacement="outside"
          name="username"
          placeholder="Enter your username"
          type="text"
          value={username}
          onValueChange={setUsername}
        />

        <Input
          label="Email"
          labelPlacement="outside"
          name="email"
          placeholder="Optional"
          type="text"
          value={email}
          onValueChange={setEmail}
        />

        <Input
          required
          label="Password"
          labelPlacement="outside"
          name="password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onValueChange={setPassword}
          autoComplete="new-password"
        />
        <Input
          required
          label="Password Confirmation"
          labelPlacement="outside"
          name="password2"
          placeholder="Reenter your password"
          type="password"
          value={password2}
          onValueChange={setPassword2}
          autoComplete="new-password"
        />
        <div className="flex gap-2">
          <Button type="submit" color="blue">
            Submit
          </Button>
          <Button type="reset">Reset</Button>
        </div>
        <p
          className="transition-color duration-250"
          style={{
            color: siteTheme.colors["text"],
          }}
        >
          Already have an account? <Link href="/login">Log In</Link>
        </p>
      </Form>
    </div>
  );
}
