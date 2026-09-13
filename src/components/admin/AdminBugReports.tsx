import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Chip, Textarea } from "bioloom-ui";
import { Bug } from "lucide-react";
import { useTheme } from "@/providers/useSiteTheme";
import { listBugs, updateBug, type BugReport, type BugStatus } from "@/requests/bugs";

const statuses: (BugStatus | "all")[] = ["open", "triaged", "resolved", "dismissed", "all"];
const labels = { open: "Open", triaged: "In progress", resolved: "Resolved", dismissed: "Dismissed", all: "All reports" };

function ReportDetail({ report, onSaved }: { report: BugReport; onSaved: (report: BugReport) => void }) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const [status, setStatus] = useState(report.status);
  const [priority, setPriority] = useState(report.priority);
  const [resolution, setResolution] = useState(report.resolution ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const selectStyle = { backgroundColor: colors.mantle, color: colors.text, borderColor: `color-mix(in srgb, ${colors.text} 15%, ${colors.mantle})` };
  return <section className="min-w-0 space-y-5" aria-label={uiText("AppStrings.ReportValue0", { value0: report.id })}>
    <div><p className="mb-2 text-xs" style={{ color: colors.textFaded }}>{uiText("AppStrings.BUG")}{report.id}</p><h2 className="break-words text-2xl font-semibold">{report.reason}</h2><p className="mt-2 text-sm" style={{ color: colors.textFaded }}>{uiText("PostCard.By")} {report.reporterName} · {new Date(report.createdAt).toLocaleString()}</p></div>
    <div className="whitespace-pre-wrap break-words rounded-lg p-4 text-sm leading-relaxed" style={{ backgroundColor: colors.crust }}>{report.details}</div>
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault(); if (saving) return;
      setSaving(true); setError(""); setSaved(false);
      try { const updated = await updateBug(report.id, { status, priority, resolution: resolution.trim() || null }); onSaved({ ...report, ...updated }); setSaved(true); }
      catch (error) { setError(error instanceof Error ? error.message : uiText("AppStrings.CouldNotSaveChanges")); }
      finally { setSaving(false); }
    }}>
      <fieldset disabled={saving} className="space-y-4" onChange={() => setSaved(false)}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2 text-sm"><span>{uiText("AppStrings.Status")}</span><select className="block w-full rounded-md border p-2" style={selectStyle} value={status} onChange={(event) => setStatus(event.target.value as BugStatus)}>{statuses.filter((value) => value !== "all").map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
          <label className="space-y-2 text-sm"><span>{uiText("AppStrings.Priority")}</span><select className="block w-full rounded-md border p-2" style={selectStyle} value={priority} onChange={(event) => setPriority(event.target.value as BugReport["priority"])}>{["low", "normal", "high", "urgent"].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        </div>
        <label className="block space-y-2 text-sm"><span>{uiText("AppStrings.ResolutionReviewNotes")}</span><Textarea fullWidth rows={4} maxLength={2000} value={resolution} onValueChange={setResolution} placeholder={uiText("AppStrings.DescribeTheFixInvestigationOrReasonForDismissal")} /></label>
      </fieldset>
      {error && <p role="alert" className="text-sm" style={{ color: colors.red }}>{error}</p>}
      {saved && <p role="status" className="text-sm" style={{ color: colors.green }}>{uiText("AppStrings.ChangesSaved")}</p>}
      <Button type="submit" color="blue" disabled={saving} aria-busy={saving}>{saving ? uiText("AppStrings.Saving") : uiText("AppStrings.SaveChanges2")}</Button>
    </form>
  </section>;
}

export default function AdminBugReports() {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const [status, setStatus] = useState<BugStatus | "all">("open");
  const [reports, setReports] = useState<BugReport[]>([]);
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async (beforeId?: number) => {
    const request = ++generation.current;
    setLoading(true); setError("");
    try {
      const rows = await listBugs(status, beforeId);
      if (request !== generation.current) return;
      setReports((previous) => beforeId ? [...previous, ...rows] : rows);
      setHasMore(rows.length === 25);
    } catch (error) {
      if (request === generation.current) setError(error instanceof Error ? error.message : uiText("AppStrings.CouldNotLoadReports"));
    } finally { if (request === generation.current) setLoading(false); }
  }, [status]);
  useEffect(() => { setReports([]); setSelected(null); void load(); return () => { generation.current++; }; }, [load]);

  return <Card padding={0} shadow="none" className="!rounded-xl">
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-3"><Bug size={28} /><h1 className="text-3xl font-semibold">{uiText("AppStrings.BugReports")}</h1></div><p className="mt-2 text-sm" style={{ color: colors.textFaded }}>{uiText("AppStrings.ReviewIssuesTrackProgressAndRecordFixes")}</p></div><Button href="/admin" variant="ghost" size="sm" icon="arrowleft">{uiText("AppStrings.AdminOverview")}</Button></div>
      <div className="mb-6 flex flex-wrap gap-2" aria-label={uiText("AppStrings.FilterReportsByStatus")}>{statuses.map((value) => <Button key={value} size="sm" variant="ghost" color={status === value ? "blue" : "default"} aria-pressed={status === value} onClick={() => setStatus(value)}>{labels[value]}</Button>)}</div>
      {error && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3"><p style={{ color: colors.red }}>{error}</p><Button size="sm" onClick={() => void load()}>{uiText("AppStrings.Retry")}</Button></div>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="min-w-0 space-y-3" aria-label={uiText("AppStrings.BugReportQueue")} aria-busy={loading}>
          {reports.map((report) => <button key={report.id} className="block w-full rounded-lg border p-4 text-left transition-colors" style={{ backgroundColor: selected?.id === report.id ? colors.base : colors.mantle, borderColor: selected?.id === report.id ? colors.blue : `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }} aria-pressed={selected?.id === report.id} onClick={() => setSelected(report)}>
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs" style={{ color: colors.textFaded }}>#{report.id}</span><Chip className="post-tag-chip">{labels[report.status]}</Chip><Chip className="post-tag-chip" color={report.priority === "urgent" || report.priority === "high" ? "red" : "default"}>{report.priority}</Chip></div>
            <p className="break-words text-sm font-semibold">{report.reason}</p><p className="mt-2 text-xs" style={{ color: colors.textFaded }}>{report.reporterName} · {new Date(report.createdAt).toLocaleDateString()}</p>
          </button>)}
          {loading && <p role="status" className="motion-safe:animate-pulse text-sm">{uiText("AppStrings.LoadingReports")}</p>}
          {!loading && !error && reports.length === 0 && <p className="text-sm" style={{ color: colors.textFaded }}>{uiText("AppStrings.No")} {status === "all" ? uiText("AppStrings.Bug") : labels[status].toLowerCase()}  {uiText("AppStrings.Reports")}</p>}
          {hasMore && <Button variant="ghost" disabled={loading} onClick={() => void load(reports.at(-1)?.id)}>{uiText("AppStrings.LoadMore")}</Button>}
        </aside>
        <Card shadow="none">{selected ? <ReportDetail key={selected.id} report={selected} onSaved={(updated) => {
          setSelected(updated);
          setReports((current) => current.map((report) => report.id === updated.id ? updated : report).filter((report) => status === "all" || report.status === status));
        }} /> : <div className="py-12 text-center text-sm" style={{ color: colors.textFaded }}>{uiText("AppStrings.SelectAReportToReviewItsDetails")}</div>}</Card>
      </div>
    </div>
  </Card>;
}
