import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Background job sending "you were mentioned" conversation notifications.
 *
 * Stub replacement: the upstream repository imports this handler but does not
 * publish it. The job acknowledges the request so queued callbacks are not
 * retried forever; no notification is sent.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  return res.status(200).json({ skipped: true });
}
