import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { CSSProperties, useState } from "react";
import { Button, Input, Textarea, Vstack, Hstack, Text } from "bioloom-ui";
import { Bug, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/providers/useSiteTheme";
import { hasCookie } from "@/helpers/cookie";
import { submitBug } from "@/requests/bugs";
import EditorFooter from "@/components/game-editing-form/EditorFooter";
import "@/components/game-editing-form/game-editor.css";
import "@/components/form-editor.css";

export default function BugReportPage() {
  const uiText = useUiTranslations();
  const { colors, siteTheme } = useTheme();
  const [title, setTitle] = useState("");
  const [page, setPage] = useState(() => new URLSearchParams(window.location.search).get("page")?.slice(0, 300) ?? "");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const signedIn = hasCookie("token");
  const details = `Page: ${page.trim() || "Not specified"}\n\nSteps to reproduce:\n${steps.trim()}\n\nExpected:\n${expected.trim()}\n\nActual:\n${actual.trim()}`;

  const fields = [
    { id: "bug-summary", label: "AppStrings.Summary", value: title, setValue: setTitle, maxLength: 200, minLength: 3, placeholder: "AppStrings.WhatWentWrong" },
    { id: "bug-page", label: "AppStrings.AffectedPage", value: page, setValue: setPage, maxLength: 300, optional: true, placeholder: "AppStrings.GamesOrAPageURL" },
    { id: "bug-steps", label: "AppStrings.StepsToReproduce", value: steps, setValue: setSteps, maxLength: 1000, rows: 4, placeholder: "AppStrings.1OpenThePage102Click" },
    { id: "bug-expected", label: "AppStrings.WhatDidYouExpect", value: expected, setValue: setExpected, maxLength: 600, rows: 2 },
    { id: "bug-actual", label: "AppStrings.WhatHappenedInstead", value: actual, setValue: setActual, maxLength: 600, rows: 3 },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4" style={{
      "--editor-surface": colors.mantle,
      "--editor-text": colors.text,
      color: colors.text,
    } as CSSProperties}>
      <header className="py-2 text-center" style={{ textShadow: siteTheme.type === "Light" ? "none" : "0 1px 5px rgba(0, 0, 0, 0.75)" }}>
        <h1 className="text-3xl font-semibold">{uiText("AppStrings.ReportABug")}</h1>
        <p className="mt-1 text-sm opacity-[0.82]">{uiText("AppStrings.SomethingNotWorkingHelpUsTrackItDown")}</p>
      </header>

      {reportId !== null ? (
        <section className="form-editor-panel settings-editor-panel" role="status">
          <Vstack className="py-8" gap={4}>
            <CheckCircle2 size={32} />
            <h2 className="text-xl font-semibold">{uiText("AppStrings.Report")} {reportId} {uiText("AppStrings.Received")}</h2>
            <Text color="textFaded">{uiText("AppStrings.YourReportIsInTheAdminReviewQueueThanksForHelpingImproveTheSite")}</Text>
            <Button href="/games" variant="ghost">{uiText("AppStrings.BackToGames")}</Button>
          </Vstack>
        </section>
      ) : !signedIn ? (
        <section className="form-editor-panel settings-editor-panel">
          <Vstack className="py-8" gap={4}>
            <Text>{uiText("AppStrings.SignInToSubmitABugReport")}</Text>
            <Button href="/login">{uiText("AppStrings.SignIn")}</Button>
          </Vstack>
        </section>
      ) : (
        <form onSubmit={async (event) => {
          event.preventDefault();
          if (saving) return;
          if (details.length > 2000) { setError(uiText("AppStrings.PleaseShortenTheReportTo2000Characters")); return; }
          setSaving(true); setError("");
          try { const report = await submitBug(title.trim(), details); setReportId(report.id); }
          catch (error) { setError(error instanceof Error ? error.message : uiText("AppStrings.CouldNotSubmitReport2")); }
          finally { setSaving(false); }
        }}>
          <fieldset disabled={saving} className="form-editor-panel settings-editor-panel">
            <div className="game-editor-panel-heading">
              <Hstack gap={3}>
                <Bug size={28} />
                <h2 className="text-2xl font-bold">{uiText("AppStrings.ReportABug")}</h2>
              </Hstack>
            </div>
            {fields.map((field) => (
              <div key={field.id} className="game-editor-row">
                <Vstack align="start">
                  <div>
                    <label htmlFor={field.id} className="font-semibold">{uiText(field.label)}</label>
                    {field.optional && <Text color="textFaded" size="xs">{uiText("AppStrings.Optional2")}</Text>}
                  </div>
                  {field.rows ? (
                    <Textarea id={field.id} fullWidth required rows={field.rows} maxLength={field.maxLength} value={field.value} onValueChange={field.setValue} placeholder={field.placeholder ? uiText(field.placeholder) : undefined} />
                  ) : (
                    <Input id={field.id} fullWidth required={!field.optional} minLength={field.minLength} maxLength={field.maxLength} value={field.value} onValueChange={field.setValue} placeholder={field.placeholder ? uiText(field.placeholder) : undefined} />
                  )}
                </Vstack>
              </div>
            ))}
          </fieldset>
          {error && <p role="alert" className="mt-4 text-sm" style={{ color: colors.red }}>{error}</p>}
          <EditorFooter floating={false} status={uiText("AppStrings.SubmitBugReport")} description={
            <span style={{ color: details.length > 2000 ? colors.red : undefined }}>{details.length} {uiText("AppStrings.2000Characters")}</span>
          }>
            <Button type="submit" icon="bug" disabled={saving || details.length > 2000} aria-busy={saving}>{saving ? uiText("AppStrings.Submitting") : uiText("AppStrings.SubmitBugReport")}</Button>
          </EditorFooter>
        </form>
      )}

    </div>
  );
}
