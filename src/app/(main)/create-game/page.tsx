import GameEditingForm from "@/components/game-editing-form/GameEditingForm";
import PageCard from "@/components/PageCard";
import { Gamepad2 } from "lucide-react";
import { useTranslations } from "@/compat/next-intl";

export default function CreateGamePage() {
  const t = useTranslations();

  return (
    <PageCard hasTabs icon={Gamepad2} title={t("CreateGame.Create.Title")} description={t("CreateGame.Create.Description")}>
      <div className="min-w-0 [&_.game-editor-tabs]:w-full [&_.game-editor-tabs>[role=tablist]]:justify-start! [&_.game-editor-tabs>[role=tablist]]:flex-wrap [&_.game-editor-tabs>[role=tabpanel]]:border-0! [&_.game-editor-tabs>[role=tabpanel]]:rounded-none! [&_.game-editor-tabs>[role=tabpanel]]:bg-transparent! [&_.game-editor-tabs>[role=tabpanel]]:px-2! sm:[&_.game-editor-tabs>[role=tabpanel]]:px-3! max-[700px]:[&_.game-editor-tabs>[role=tabpanel]]:px-0!">
        <GameEditingForm hideHeading />
      </div>
    </PageCard>
  );
}
