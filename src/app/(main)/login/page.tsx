"use client";

import { Button } from "@/framework/Button";
import { Card } from "@/framework/Card";
import Icon from "@/framework/Icon";
import { Input } from "@/framework/Input";
import { Link } from "@/framework/Link";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { login } from "@/requests/auth";
import { addToast, Form } from "@heroui/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Cookies from "js-cookie";

export default function UserPage() {
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
              title: "Please enter a valid username and password",
            });
            return;
          }

          if (!username) {
            addToast({
              title: "Please enter a valid username",
            });
            return;
          }

          if (!password) {
            addToast({
              title: "Please enter a valid password",
            });
            return;
          }

          const response = await login(username, password);

          if (response.status == 401) {
            addToast({
              title: "Invalid username or password",
            });
            setPassword("");
            return;
          }

          const { user } = await response.json();
          const token = response.headers.get("Authorization");

          if (!token) {
            addToast({
              title: "Failed to retrieve access token",
            });
            setPassword("");
            return;
          }

          document.cookie = `token=${token}`;
          document.cookie = `user=${user.slug}`;
          Cookies.set("hasLoggedIn", "true", { expires: 36500 });

          addToast({
            title: "Successfully logged in",
          });

          redirect("/");
        }}
      >
        <Card>
          <Vstack align="start">
            <Hstack>
              <Icon name="login" />
              <Text size="xl" weight="semibold" color="text">
                Log In
              </Text>
            </Hstack>
            <Text size="sm" color="textFaded">
              Log into an existing account on the site
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start">
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
              required
              label="Password"
              labelPlacement="outside"
              name="password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onValueChange={setPassword}
            />

            <div className="flex gap-2">
              <Button color="blue" type="submit" icon="login">
                Submit
              </Button>
              <Button type="reset" icon="rotateccw">
                Reset
              </Button>
            </div>
          </Vstack>
        </Card>
        <Card>
          <Text color="text">
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </Text>
        </Card>
        <Card>
          <Link href="/forgot-password">Forgot Password?</Link>
        </Card>
      </Form>
    </div>
  );
}
