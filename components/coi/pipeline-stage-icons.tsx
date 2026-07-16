import type { ReactNode } from "react";
import {
  BadgeCheck,
  ClipboardList,
  CloudDownload,
  Cog,
  FileSearch,
  FileText,
  ListOrdered,
  ScanText,
  ShieldAlert,
  TextCursorInput,
} from "lucide-react";

const ICON_CLASS = "size-3.5";

/** Stage-specific icons for the COI processing pipeline. */
export function pipelineStageIcon(stageId: string): ReactNode {
  switch (stageId) {
    case "queued":
      return <ListOrdered className={ICON_CLASS} />;
    case "worker":
      return <Cog className={ICON_CLASS} />;
    case "downloading":
      return <CloudDownload className={ICON_CLASS} />;
    case "llamaparse":
      return <ScanText className={ICON_CLASS} />;
    case "document-agent":
      return <FileSearch className={ICON_CLASS} />;
    case "extraction-agent":
      return <TextCursorInput className={ICON_CLASS} />;
    case "checklist-agent":
      return <ClipboardList className={ICON_CLASS} />;
    case "risk-agent":
      return <ShieldAlert className={ICON_CLASS} />;
    case "report-agent":
      return <FileText className={ICON_CLASS} />;
    case "ready":
      return <BadgeCheck className={ICON_CLASS} />;
    default:
      return <FileText className={ICON_CLASS} />;
  }
}
