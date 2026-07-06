import type { EmailPlaceholder } from "@/lib/constants/email-templates";
import { getEnv } from "@/lib/env";

export function getEmailSignatoryVariables(): Pick<
  Record<EmailPlaceholder, string>,
  "signatory_name" | "signatory_title" | "company_name" | "property_name"
> {
  const env = getEnv();
  return {
    signatory_name: env.EMAIL_SIGNATORY_NAME,
    signatory_title: env.EMAIL_SIGNATORY_TITLE,
    company_name: env.EMAIL_COMPANY_NAME,
    property_name: env.EMAIL_PROPERTY_NAME,
  };
}
