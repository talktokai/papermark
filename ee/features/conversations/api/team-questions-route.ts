import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Team-side dataroom questions API.
 *
 * Stub replacement: the upstream repository imports this handler but does not
 * publish it. Responding 501 keeps the route mounted and predictable rather
 * than crashing the request.
 */
export const handleRoute = async (
  _req: NextApiRequest,
  res: NextApiResponse,
) => {
  return res
    .status(501)
    .json({ error: "Dataroom questions are not available in this build." });
};
