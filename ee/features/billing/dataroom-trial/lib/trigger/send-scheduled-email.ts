import { logger, task } from "@trigger.dev/sdk";

/**
 * Delayed dataroom-trial lifecycle emails.
 *
 * Stub replacement: the upstream repository imports these tasks but does not
 * publish them. Call sites schedule them with `.trigger(payload, { delay })`
 * and persist the returned run ids (see
 * pages/api/teams/[teamId]/datarooms/trial.ts), so real task objects are
 * required — a plain function would break that flow.
 *
 * The bodies are no-ops: trials still start and expire normally, but the
 * informational, reminder and expiry emails are not sent.
 */
export const sendDataroomTrialInfoEmailTask = task({
  id: "send-dataroom-trial-info-email",
  run: async (payload: { to: string; useCase?: string; name?: string }) => {
    logger.warn("dataroom trial info email is not available in this build", {
      to: payload.to,
    });
    return { status: "skipped" as const };
  },
});

export const sendDataroomTrial24hReminderEmailTask = task({
  id: "send-dataroom-trial-24h-reminder-email",
  run: async (payload: { to: string; name?: string; teamId: string }) => {
    logger.warn(
      "dataroom trial reminder email is not available in this build",
      { teamId: payload.teamId },
    );
    return { status: "skipped" as const };
  },
});

export const sendDataroomTrialExpiredEmailTask = task({
  id: "send-dataroom-trial-expired-email",
  run: async (payload: { to: string; name?: string; teamId: string }) => {
    logger.warn("dataroom trial expiry email is not available in this build", {
      teamId: payload.teamId,
    });
    return { status: "skipped" as const };
  },
});
