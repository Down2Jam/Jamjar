"use client";

import Editor from "@/components/editor";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { UserType } from "@/types/UserType";
import { Avatar, Button, Form, Input, Spacer } from "@nextui-org/react";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { getSelf, updateUser } from "@/requests/user";
import { sanitize } from "@/helpers/sanitize";

export default function UserPage() {
  const [user, setUser] = useState<UserType>();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bannerPicture, setBannerPicture] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [errors] = useState({});
  const pathname = usePathname();
  const [waitingSave, setWaitingSave] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    loadUser();
    async function loadUser() {
      try {
      if (!hasCookie("token")) {
        setUser(undefined);
        redirect("/");
        return;
      }

      const response = await getSelf();

      if (response.status == 200) {
        const data = await response.json();
        setUser(data);

        setProfilePicture(data.profilePicture ?? "");
        setBannerPicture(data.bannerPicture ?? "");
        setBio(data.bio ?? "");
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      } else {
        setUser(undefined);
      }      
    } catch (error) {
      // TODO: Do something with error
    }
    }
  }, [pathname]);

  return (
    <div className="flex items-center justify-center">
      {!user ? (
        "Loading settings..."
      ) : (
        <Form
          className="w-full max-w-2xl flex flex-col gap-4"
          validationErrors={errors}
          onReset={() => {
            setProfilePicture(user.profilePicture ?? "");
            setBannerPicture(user.bannerPicture ?? "");
            setBio(user.bio ?? "");
            setName(user.name ?? "");
          }}
          onSubmit={async (e) => {
            e.preventDefault();

            const sanitizedBio = sanitize(bio);

            if (!name) {
              toast.error("You need to enter a name");
              return;
            }

            setWaitingSave(true);

            const response = await updateUser(user.slug, name, sanitizedBio, profilePicture, bannerPicture); 

            if (response.ok) {
              toast.success("Changed settings");
              setUser((await response.json()).data);
              setWaitingSave(false);
            } else {
              toast.error("Failed to update settings");
              setWaitingSave(false);
            }
          }}
        >
          <p className="text-3xl">Settings</p>

          <Input
            label="Name"
            labelPlacement="outside"
            name="name"
            placeholder="Enter a name"
            type="text"
            value={name}
            onValueChange={setName}
          />

          <p>Email</p>
          {showEmail && (
            <Input
              label="Email"
              name="email"
              placeholder="Enter an email"
              type="text"
              value={email}
              onValueChange={setEmail}
            />
          )}
          <Button size="sm" onPress={() => setShowEmail(!showEmail)}>
            {showEmail ? "Hide Email" : "Show Email"}
          </Button>

          <p>Bio</p>
          <Editor content={bio} setContent={setBio} />

          <p>Profile Picture</p>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append("upload", file);

              try {
                const response = await fetch(
                  process.env.NEXT_PUBLIC_MODE === "PROD"
                    ? "https://d2jam.com/api/v1/image"
                    : "http://localhost:3005/api/v1/image",
                  {
                    method: "POST",
                    body: formData,
                    headers: {
                      authorization: `Bearer ${getCookie("token")}`,
                    },
                    credentials: "include",
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  setProfilePicture(data.data);
                  toast.success(data.message);
                } else {
                  toast.error("Failed to upload image");
                }
              } catch (error) {
                console.error(error);
                toast.error("Error uploading image");
              }
            }}
          />

          {profilePicture && (
            <div>
              <Avatar src={profilePicture} />
              <Spacer y={3} />
              <Button
                color="danger"
                size="sm"
                onPress={() => {
                  setProfilePicture(null);
                }}
              >
                Remove Profile Picture
              </Button>
            </div>
          )}

          <p>Banner Picture</p>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append("upload", file);

              try {
                const response = await fetch(
                  process.env.NEXT_PUBLIC_MODE === "PROD"
                    ? "https://d2jam.com/api/v1/image"
                    : "http://localhost:3005/api/v1/image",
                  {
                    method: "POST",
                    body: formData,
                    headers: {
                      authorization: `Bearer ${getCookie("token")}`,
                    },
                    credentials: "include",
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  setBannerPicture(data.data);
                  toast.success(data.message);
                } else {
                  toast.error("Failed to upload image");
                }
              } catch (error) {
                console.error(error);
                toast.error("Error uploading image");
              }
            }}
          />

          {bannerPicture && (
            <div className="w-full">
              <div className="bg-[#222222] h-28 w-full relative">
                <Image
                  src={bannerPicture}
                  alt={`${user.name}'s profile banner`}
                  className="object-cover"
                  fill
                />
              </div>
              <Spacer y={3} />
              <Button
                color="danger"
                size="sm"
                onPress={() => {
                  setBannerPicture(null);
                }}
              >
                Remove Banner Picture
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button color="primary" type="submit">
              {waitingSave ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>Save</p>
              )}
            </Button>
            <Button type="reset" variant="flat">
              Reset
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
