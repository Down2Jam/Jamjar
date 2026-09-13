"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { createReport } from "@/requests/api";
import { addToast, Button, Card, Hstack, Input, Text, Vstack } from "bioloom-ui";
import { useState } from "react";

const targetTypes = ["user", "post", "comment", "game", "collection_comment"] as const;

export default function ReportsPage() {
  const uiText = useUiTranslations();
  const [targetType, setTargetType] =
    useState<(typeof targetTypes)[number]>("post");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Vstack align="stretch">
      <Button href="/report-bug" icon="bug" variant="ghost">{uiText("AppStrings.LookingToReportABug")}</Button>
      <Card>
        <Vstack align="start">
          <Hstack>
            <Text size="xl" weight="semibold" color="text">
               {uiText("AppStrings.ReportContent")} </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.SendAReportToTheModerationQueue")} </Text>
        </Vstack>
      </Card>

      <Card>
        <form
          className="flex w-full max-w-xl flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!targetId.trim()) return;
            setSubmitting(true);
            const response = await createReport({
              targetType,
              targetId:
                targetType === "collection_comment" ? targetId : Number(targetId),
              reason,
              details,
            });
            setSubmitting(false);
            addToast({
              title: response.ok ? uiText("AppStrings.ReportSubmitted") : uiText("AppStrings.CouldNotSubmitReport"),
            });
            if (response.ok) {
              setTargetId("");
              setReason("");
              setDetails("");
            }
          }}
        >
          <label className="flex flex-col gap-1">
            <Text color="text">{uiText("AppStrings.TargetType")}</Text>
            <select
              className="rounded-md border border-white/10 bg-black/30 p-2 text-white"
              value={targetType}
              onChange={(event) =>
                setTargetType(event.target.value as typeof targetType)
              }
            >
              {targetTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <Text color="text">{uiText("AppStrings.TargetId")}</Text>
            <Input
              value={targetId}
              onValueChange={setTargetId}
              placeholder={uiText("AppStrings.IdOfTheUserPostCommentGameOr")}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <Text color="text">{uiText("AppStrings.Reason")}</Text>
            <Input
              value={reason}
              onValueChange={setReason}
              placeholder={uiText("AppStrings.ShortReason")}
            />
          </label>
          <textarea
            className="min-h-32 rounded-md border border-white/10 bg-black/30 p-3 text-white"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={uiText("AppStrings.ExtraDetails")}
          />
          <Button color="red" icon="shieldalert" type="submit" disabled={submitting}>
             {uiText("AppStrings.SubmitReport")} </Button>
        </form>
      </Card>
    </Vstack>
  );
}
