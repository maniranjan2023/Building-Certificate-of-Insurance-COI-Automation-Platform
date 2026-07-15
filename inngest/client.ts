import { Inngest } from "inngest";

/**
 * Official Inngest client. Env vars (from Inngest docs):
 * INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, INNGEST_DEV, INNGEST_BASE_URL, etc.
 * @see https://www.inngest.com/docs/sdk/environment-variables
 */
export const inngest = new Inngest({
  id: "coi-platform",
  name: "COI Compliance Platform",
});
