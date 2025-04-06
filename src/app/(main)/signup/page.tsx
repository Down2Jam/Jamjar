"use client";

import { signup } from "@/requests/auth";
import { Button, Form, Input, Link } from "@heroui/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function UserPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState("");

  return (
    <div className="absolute flex items-center justify-center top-0 left-0 w-screen h-screen">
      <Form
        className="w-full max-w-xs flex flex-col gap-4"
        validationErrors={errors}
        onReset={() => {
          setUsername("");
          setPassword("");
          setPassword2("");
          setEmail("");
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!password || !username || !password2) {
            const localErrors: Record<string, string> = {};

            if (password && password.length < 8) {
              setPassword2("");
              setErrors({ password: "Password must be minimum 8 characters" });
              return;
            }

            if (!password) {
              localErrors["password"] = "Please enter a valid password";
            }

            if (!password2) {
              localErrors["password2"] = "Please reenter your password";
            }

            if (!username) {
              localErrors["username"] = "Please enter a valid username";
            }
            setErrors(localErrors);
            return;
          }

          if (username.length > 32) {
            setPassword2("");
            setErrors({ password: "Usernames can be maximum 32 characters" });
            return;
          }

          if (password.length < 8) {
            setPassword2("");
            setErrors({ password: "Password must be minimum 8 characters" });
            return;
          }

          if (password != password2) {
            setPassword2("");
            setErrors({ password2: "Passwords do not match" });
            return;
          }

          const response = await signup(username, password, email);

          if (response.status == 409) {
            setErrors({ username: "User already exists" });
            setPassword2("");
            return;
          }

          const { token, user } = await response.json();
          document.cookie = `token=${token}`;
          document.cookie = `user=${user.slug}`;

          toast.success("Successfully signed up");

          redirect("/");
        }}
      >
        <Input
          isRequired
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
          isRequired
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
          isRequired
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
          <Button color="primary" type="submit">
            Submit
          </Button>
          <Button type="reset" variant="flat">
            Reset
          </Button>
        </div>
        <p className="text-[#333] dark:text-white transition-color duration-250">
          Already have an account? <Link href="/login">Log In</Link>
        </p>
      </Form>
    </div>
  );
}
