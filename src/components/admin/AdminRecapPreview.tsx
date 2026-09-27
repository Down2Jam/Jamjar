"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Card, Input, Text, Vstack } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import { usePathname, useRouter, useSearchParams } from "@/compat/next-navigation";
import { useSearchUsers } from "@/hooks/queries";
import Recap from "@/components/recap";

export default function AdminRecapPreview() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedSlug = params.get("user") ?? "";
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const { data: users = [], isFetching, isError } = useSearchUsers(search);

  const selectUser = (slug: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("user", slug);
    router.replace(`${pathname}?${next.toString()}`);
    setQuery("");
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="2xl" weight="bold">{t("AppStrings.RecapPreview")}</Text>
          <Input
            aria-label={t("AppStrings.SearchUsers")}
            placeholder={t("AppStrings.SearchUsers")}
            value={query}
            onValueChange={setQuery}
            fullWidth
          />
          {query.trim() && (
            <Vstack align="stretch" gap={1}>
              {isFetching || search !== query.trim() ? (
                <Text role="status">{t("AppStrings.LoadingRecap")}</Text>
              ) : isError ? (
                <Text role="alert">{t("AppStrings.UserSearchFailed")}</Text>
              ) : users.length === 0 ? (
                <Text role="status">{t("AppStrings.NoUsersFound")}</Text>
              ) : users.map((user) => (
                <Button key={user.id} variant="ghost" onClick={() => selectUser(user.slug)} className="justify-start">
                  <Avatar size={24} src={user.profilePicture || "/images/D2J_Icon.png"} />
                  {user.name || user.slug} (@{user.slug})
                </Button>
              ))}
            </Vstack>
          )}
        </Vstack>
      </Card>
      {selectedSlug && <Recap key={selectedSlug} targetUserSlug={selectedSlug} preview />}
    </div>
  );
}
