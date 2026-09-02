import { logger, task } from "@trigger.dev/sdk";

import {
  convertFilesToPdfQueue,
  convertKeynoteToPdfQueue,
} from "@/lib/trigger/queues";

/**
 * Office/Keynote to PDF conversion tasks.
 *
 * Stub replacement: the upstream repository imports these tasks but does not
 * publish them — the conversion pipeline they drive is not part of the public
 * source. Most call sites only `import type` them to type `tasks.trigger<>`;
 * the task ids and payload shapes below match those call sites (see
 * lib/api/documents/process-document.ts and
 * pages/api/teams/[teamId]/documents/agreement.ts).
 *
 * The task bodies are no-ops: uploaded .docx/.pptx/.key files are stored and
 * downloadable but are not converted to a viewable PDF. Native PDFs, images
 * and video are unaffected — they never go through this path.
 */
type ConvertPayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
};

export const convertFilesToPdfTask = task({
  id: "convert-files-to-pdf",
  queue: convertFilesToPdfQueue,
  run: async (payload: ConvertPayload) => {
    logger.warn(
      "convert-files-to-pdf is not available in this build; skipping conversion",
      { documentVersionId: payload.documentVersionId },
    );
    return { status: "skipped" as const, reason: "conversion-unavailable" };
  },
});

export const convertKeynoteToPdfTask = task({
  id: "convert-keynote-to-pdf",
  queue: convertKeynoteToPdfQueue,
  run: async (payload: ConvertPayload) => {
    logger.warn(
      "convert-keynote-to-pdf is not available in this build; skipping conversion",
      { documentVersionId: payload.documentVersionId },
    );
    return { status: "skipped" as const, reason: "conversion-unavailable" };
  },
});
