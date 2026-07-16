import { DocsGuide } from "@/components/docs/docs-guide";
import { getEnv } from "@/lib/env";

export default function DocsPage() {
  const inboxEmail = getEnv().INBOX_ID;

  return <DocsGuide inboxEmail={inboxEmail} />;
}
