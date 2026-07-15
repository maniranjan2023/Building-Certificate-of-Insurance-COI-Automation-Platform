import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

/** Vercel / serverless duration budget for durable COI processing. */
export const maxDuration = 300;

/**
 * Official Next.js App Router serve handler.
 * @see https://www.inngest.com/docs/learn/serving-inngest-functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
