"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useRouter } from "@/compat/next-navigation";
import { useEffect } from "react";
import { logout as logoutUser } from "@/requests/auth";
import { addToast } from "bioloom-ui";

export default function UserPage() {
  const uiText = useUiTranslations();
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      const response = await logoutUser();

      if (response.ok) {
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        addToast({
          title: uiText("AppStrings.SuccessfullyLoggedOut"),
        });
        router.replace("/");
        router.refresh();
      } else {
        addToast({
          title: uiText("AppStrings.ErrorWhileTryingToLogOut"),
        });
      }
    }

    logout();
  }, [router]);

  return (
    <div className="absolute flex items-center justify-center top-0 left-0 w-screen h-screen">
      <p>{uiText("AppStrings.LoggingOut")}</p>
    </div>
  );
}
