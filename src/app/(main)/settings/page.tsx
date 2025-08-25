"use client";

import Editor from "@/components/editor";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { UserType } from "@/types/UserType";
import { addToast, Avatar, Form } from "@heroui/react";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSelf, updateUser } from "@/requests/user";
import { sanitize } from "@/helpers/sanitize";
import { getTeamRoles } from "@/requests/team";
import { RoleType } from "@/types/RoleType";
import { Input } from "@/framework/Input";
import { Button } from "@/framework/Button";
import Text from "@/framework/Text";
import { Hstack, Stack, Vstack } from "@/framework/Stack";
import Icon from "@/framework/Icon";
import { Card } from "@/framework/Card";
import { Spinner } from "@/framework/Spinner";
import Dropdown from "@/framework/Dropdown";
import { useTheme } from "@/providers/SiteThemeProvider";

export default function UserPage() {
  const [user, setUser] = useState<UserType>();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bannerPicture, setBannerPicture] = useState<string | null>(null);
  const [short, setShort] = useState("");
  const [bio, setBio] = useState("");
  const [errors] = useState({});
  const pathname = usePathname();
  const [waitingSave, setWaitingSave] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [primaryRoles, setPrimaryRoles] = useState<Set<string>>(new Set());
  const [secondaryRoles, setSecondaryRoles] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<RoleType[]>([]);
  const { colors } = useTheme();
  const [defaultPfps, setDefaultPfps] = useState<string[]>([]);

  useEffect(() => {
    fetch(
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/pfps"
        : "http://localhost:3005/api/v1/pfps"
    )
      .then((res) => res.json())
      .then((data) => setDefaultPfps(data.data))
      .catch((err) => console.error("Failed to load pfps", err));
  }, []);

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
          setShort(data.short ?? "");
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setPrimaryRoles(
            new Set(data.primaryRoles.map((role: RoleType) => role.slug)) ??
              new Set()
          );
          setSecondaryRoles(
            new Set(data.secondaryRoles.map((role: RoleType) => role.slug)) ??
              new Set()
          );
        } else {
          setUser(undefined);
        }

        const rolesResponse = await getTeamRoles();

        if (rolesResponse.status == 200) {
          const data = await rolesResponse.json();
          setRoles(data.data);
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [pathname]);

  if (!user) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading settings...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4"
        validationErrors={errors}
        onReset={() => {
          setProfilePicture(user.profilePicture ?? "");
          setBannerPicture(user.bannerPicture ?? "");
          setBio(user.bio ?? "");
          setShort(user.short ?? "");
          setName(user.name ?? "");
          setPrimaryRoles(
            new Set(user.primaryRoles.map((role) => role.slug)) ?? new Set()
          );
          setSecondaryRoles(
            new Set(user.secondaryRoles.map((role) => role.slug)) ?? new Set()
          );
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          const sanitizedBio = sanitize(bio);

          if (!name) {
            addToast({
              title: "You need to enter a name",
            });
            return;
          }

          setWaitingSave(true);

          const response = await updateUser(
            user.slug,
            name,
            sanitizedBio,
            short,
            profilePicture,
            bannerPicture,
            Array.from(primaryRoles),
            Array.from(secondaryRoles)
          );

          if (response.ok) {
            addToast({ title: "Changed settings" });
            setUser((await response.json()).data);
            setWaitingSave(false);
          } else {
            addToast({ title: "Failed to update settings" });
            setWaitingSave(false);
          }
        }}
      >
        <Card>
          <Vstack align="start">
            <Hstack>
              <Icon name="cog" color="text" />
              <Text size="xl" color="text" weight="semibold">
                Settings
              </Text>
            </Hstack>
            <Text size="sm" color="textFaded">
              Manage your preferences
            </Text>
          </Vstack>
        </Card>

        <Stack align="stretch" className="flex-col lg:flex-row">
          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.Name.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.Name.Description
                </Text>
              </div>
              <Input
                value={name}
                onValueChange={setName}
                name="name"
                placeholder="Enter a name"
                type="text"
              />
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.Email.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.Email.Description
                </Text>
              </div>
              {showEmail && (
                <Input
                  value={email}
                  onValueChange={setEmail}
                  name="email"
                  placeholder="Enter an email"
                  type="text"
                />
              )}
              <Button size="sm" onClick={() => setShowEmail(!showEmail)}>
                {showEmail ? "Settings.Email.Hide" : "Settings.Email.Show"}
              </Button>
            </Vstack>
          </Card>
        </Stack>

        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Settings.Bio.Title</Text>
              <Text color="textFaded" size="xs">
                Settings.Bio.Description
              </Text>
            </div>
            <Editor content={bio} setContent={setBio} />
          </Vstack>
        </Card>

        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Settings.Short.Title</Text>
              <Text color="textFaded" size="xs">
                Settings.Short.Description
              </Text>
            </div>
            <Input
              value={short}
              onValueChange={setShort}
              name="short"
              placeholder="Enter a short bio"
              type="text"
              maxLength={32}
            />
          </Vstack>
        </Card>

        <Card>
          <Hstack>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.ProfilePicture.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.ProfilePicture.Description
                </Text>
              </div>
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
                      addToast({
                        title: data.message,
                      });
                    } else {
                      addToast({
                        title: "Failed to upload image",
                      });
                    }
                  } catch (error) {
                    console.error(error);
                    addToast({
                      title: "Error uploading image",
                    });
                  }
                }}
              />
              <Text size="sm" color="textFaded">
                Or choose a default profile picture:
              </Text>
              <div className="flex flex-wrap gap-2">
                {defaultPfps.map((src, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setProfilePicture(src)}
                    className={`relative w-16 h-16 rounded-full border-2 duration-300`}
                    style={{
                      borderColor:
                        profilePicture === src ? colors["blue"] : "transparent",
                    }}
                  >
                    <Image
                      src={src}
                      alt={`Default pfp ${index + 1}`}
                      className="rounded-full object-cover"
                      fill
                    />
                  </button>
                ))}
              </div>
            </Vstack>
            {profilePicture && (
              <Vstack>
                <Avatar src={profilePicture} />
              </Vstack>
            )}
          </Hstack>
        </Card>

        <Card>
          <Hstack>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.BannerPicture.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.BannerPicture.Description
                </Text>
              </div>
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
                      addToast({
                        title: data.message,
                      });
                    } else {
                      addToast({
                        title: "Failed to upload image",
                      });
                    }
                  } catch (error) {
                    console.error(error);
                    addToast({
                      title: "Error uploading image",
                    });
                  }
                }}
              />
            </Vstack>

            {bannerPicture && (
              <Vstack>
                <div className="bg-[#222222] h-28 w-full relative mb-3">
                  <Image
                    src={bannerPicture}
                    alt={`${user.name}'s profile banner`}
                    className="object-cover"
                    fill
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setBannerPicture(null);
                  }}
                >
                  Remove
                </Button>
              </Vstack>
            )}
          </Hstack>
        </Card>
        <Hstack>
          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.PrimaryRoles.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.PrimaryRoles.Description
                </Text>
              </div>
              <Dropdown
                multiple
                selectedValues={primaryRoles}
                onSelectionChange={(selection) => {
                  setPrimaryRoles(selection as Set<string>);
                }}
                position="top"
                trigger={
                  <Button size="sm">
                    {primaryRoles.size > 0
                      ? Array.from(primaryRoles)
                          .map(
                            (role) =>
                              roles.find((findrole) => findrole.slug == role)
                                ?.name || "Unknown"
                          )
                          .join(", ")
                      : "No Roles"}
                  </Button>
                }
              >
                {roles.map((primaryRole) => (
                  <Dropdown.Item
                    key={primaryRole.slug}
                    value={primaryRole.slug}
                    description={primaryRole.description}
                  >
                    {primaryRole.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.SecondaryRoles.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.SecondaryRoles.Description
                </Text>
              </div>
              <Dropdown
                position="top"
                multiple
                selectedValues={secondaryRoles}
                onSelectionChange={(selection) => {
                  setSecondaryRoles(selection as Set<string>);
                }}
                trigger={
                  <Button size="sm">
                    {secondaryRoles.size > 0
                      ? Array.from(secondaryRoles)
                          .map(
                            (role) =>
                              roles.find((findrole) => findrole.slug == role)
                                ?.name || "Unknown"
                          )
                          .join(", ")
                      : "No Roles"}
                  </Button>
                }
              >
                {roles.map((secondaryRole) => (
                  <Dropdown.Item
                    key={secondaryRole.slug}
                    value={secondaryRole.slug}
                    description={secondaryRole.description}
                  >
                    {secondaryRole.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </Vstack>
          </Card>
        </Hstack>

        <div className="flex gap-2 mb-4">
          {waitingSave ? (
            <Spinner />
          ) : (
            <>
              <Button type="submit" color="blue" icon="save">
                Save
              </Button>
              <Button type="reset" icon="rotateccw">
                Reset
              </Button>
            </>
          )}
        </div>
      </Form>
    </div>
  );
}
