"use client";

import { Button } from "@/framework/Button";
import { Input } from "@/framework/Input";
import Text from "@/framework/Text";
import { login } from "@/requests/auth";
import { Form, Link } from "@heroui/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function UserPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  return (
    <div className="absolute flex items-center justify-center top-0 left-0 w-screen h-screen">
      <Form
        className="w-full max-w-xs flex flex-col gap-4"
        validationErrors={errors}
        onReset={() => {
          setUsername("");
          setPassword("");
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!username && !password) {
            setErrors({
              username: "Please enter a valid username",
              password: "Please enter a valid password",
            });
            return;
          }

          if (!username) {
            setErrors({ username: "Please enter a valid username" });
            return;
          }

          if (!password) {
            setErrors({ password: "Please enter a valid password" });
            return;
          }

          const response = await login(username, password);

          if (response.status == 401) {
            setErrors({ password: "Invalid username or password" });
            setPassword("");
            return;
          }

          const { user } = await response.json();
          const token = response.headers.get("Authorization");

          if (!token) {
            toast.error("Failed to retreive access token");
            setPassword("");
            return;
          }

          document.cookie = `token=${token}`;
          document.cookie = `user=${user.slug}`;

          toast.success("Successfully logged in");

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
          <Button color="blue" type="submit">
            Submit
          </Button>
          <Button type="reset">Reset</Button>
        </div>
        <Text color="text">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </Text>
      </Form>
    </div>
  );
}
