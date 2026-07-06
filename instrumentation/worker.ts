import { configureLogfire } from "@/lib/observability/configure-logfire.node";
import { getEnv, shouldSendToLogfire } from "@/lib/env";

if (shouldSendToLogfire()) {
  const env = getEnv();
  configureLogfire({ serviceName: `${env.LOGFIRE_SERVICE_NAME}-worker` });
}
