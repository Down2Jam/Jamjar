import { useEffect, useRef } from "react";
import { hasCookie } from "@/helpers/cookie";
import { useSelf } from "@/hooks/queries";
import { useLanguageSelection } from "@/hooks/useLanguageSelection";
import { useLanguagePreview } from "./LanguagePreviewProvider";

export default function LanguageAccountSync() {
  const { data: user } = useSelf(hasCookie("token"));
  const { selectedLocale, setSelectedLocale } = useLanguagePreview();
  const { mutate } = useLanguageSelection();
  const syncedUser = useRef<number | null>(null);
  useEffect(() => {
    if (!user) { syncedUser.current = null; return; }
    if (syncedUser.current === user.id) return;
    syncedUser.current = user.id;
    if (user.locale) setSelectedLocale(user.locale);
    else mutate(selectedLocale);
  }, [user, selectedLocale, setSelectedLocale, mutate]);
  return null;
}
