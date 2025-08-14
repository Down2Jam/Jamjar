"use client";

import Editor from "@/components/editor";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { UserType } from "@/types/UserType";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Spacer,
} from "@heroui/react";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { getSelf, updateUser } from "@/requests/user";
import { sanitize } from "@/helpers/sanitize";
import { getTeamRoles } from "@/requests/team";
import { RoleType } from "@/types/RoleType";
import { getIcon } from "@/helpers/icon";
import { Input } from "@/framework/Input";
import { Button } from "@/framework/Button";
import Text from "@/framework/Text";
import { Hstack, Vstack } from "@/framework/Stack";
import Icon from "@/framework/Icon";
import { Card } from "@/framework/Card";

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
  const [primaryRoles, setPrimaryRoles] = useState<Set<string>>(new Set());
  const [secondaryRoles, setSecondaryRoles] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<RoleType[]>([]);

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

  return (
    <div className="flex items-center justify-center">
      {!user ? (
        <Text>Loading settings...</Text>
      ) : (
        <Form
          className="w-full max-w-2xl flex flex-col gap-4"
          validationErrors={errors}
          onReset={() => {
            setProfilePicture(user.profilePicture ?? "");
            setBannerPicture(user.bannerPicture ?? "");
            setBio(user.bio ?? "");
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
              toast.error("You need to enter a name");
              return;
            }

            setWaitingSave(true);

            const response = await updateUser(
              user.slug,
              name,
              sanitizedBio,
              profilePicture,
              bannerPicture,
              Array.from(primaryRoles),
              Array.from(secondaryRoles)
            );

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

          <Hstack align="start">
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
          </Hstack>

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
              </Vstack>
              {profilePicture && (
                <Vstack>
                  <Avatar src={profilePicture} />
                  <Button
                    size="sm"
                    onClick={() => {
                      setProfilePicture(null);
                    }}
                  >
                    Remove
                  </Button>
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
              </Vstack>

              {bannerPicture && (
                <Vstack>
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
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
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
                  </DropdownTrigger>
                  <DropdownMenu
                    selectionMode="multiple"
                    className="text-[#333] dark:text-white"
                    selectedKeys={primaryRoles}
                    onSelectionChange={(selection) => {
                      setPrimaryRoles(selection as Set<string>);
                    }}
                  >
                    {roles.map((primaryRole) => (
                      <DropdownItem
                        key={primaryRole.slug}
                        startContent={getIcon(primaryRole.icon)}
                        description={primaryRole.description}
                      >
                        {primaryRole.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
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
                <Dropdown backdrop="opaque">
                  <DropdownTrigger>
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
                  </DropdownTrigger>
                  <DropdownMenu
                    selectionMode="multiple"
                    className="text-[#333] dark:text-white"
                    selectedKeys={secondaryRoles}
                    onSelectionChange={(selection) => {
                      setSecondaryRoles(selection as Set<string>);
                    }}
                  >
                    {roles.map((secondaryRole) => (
                      <DropdownItem
                        key={secondaryRole.slug}
                        startContent={getIcon(secondaryRole.icon)}
                        description={secondaryRole.description}
                      >
                        {secondaryRole.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </Vstack>
            </Card>
          </Hstack>

          <div className="flex gap-2">
            <Button type="submit">
              {waitingSave ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>Save</p>
              )}
            </Button>
            <Button type="reset">Reset</Button>
          </div>
        </Form>
      )}
    </div>
  );
}
