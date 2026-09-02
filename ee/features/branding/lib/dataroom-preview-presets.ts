import type { DataroomFolder } from "@prisma/client";

import type { DocumentVersion } from "@/components/view/viewer/dataroom-viewer";

/**
 * Static sample dataroom used by the branding preview.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The shapes are pinned by pages/room_ppreview_demo.tsx, which feeds these
 * rows straight into the real viewer components — so folders must satisfy
 * Prisma's `DataroomFolder` and each document's versions `DocumentVersion`.
 * The contents are illustrative only; nothing here is read by the live viewer.
 */
export type PreviewFolder = DataroomFolder;

export type PreviewDocument = {
  id: string;
  name: string;
  dataroomDocumentId: string;
  folderName: string | null;
  downloadOnly: boolean;
  canDownload: boolean;
  hierarchicalIndex: string | null;
  versions: DocumentVersion[];
};

export type DataroomPreviewDataset = {
  folders: PreviewFolder[];
  documents: PreviewDocument[];
};

const PREVIEW_DATAROOM_ID = "preview-dataroom";
const NOW = new Date(0);

const folder = (
  id: string,
  name: string,
  orderIndex: number,
): PreviewFolder => ({
  id,
  name,
  path: `/${name.toLowerCase()}`,
  parentId: null,
  dataroomId: PREVIEW_DATAROOM_ID,
  icon: null,
  color: null,
  orderIndex,
  hierarchicalIndex: String(orderIndex + 1),
  createdAt: NOW,
  updatedAt: NOW,
});

const version = (documentId: string): DocumentVersion[] => [
  {
    id: `${documentId}-v1`,
    type: "pdf",
    versionNumber: 1,
    hasPages: true,
    isVertical: true,
    updatedAt: NOW,
    fileSize: null,
  },
];

const document = (
  id: string,
  name: string,
  folderName: string | null,
  hierarchicalIndex: string,
): PreviewDocument => ({
  id,
  name,
  dataroomDocumentId: `${id}-dd`,
  folderName,
  downloadOnly: false,
  canDownload: true,
  hierarchicalIndex,
  versions: version(id),
});

export const getDataroomPreviewDataset = (): DataroomPreviewDataset => ({
  folders: [
    folder("preview-folder-financials", "Financials", 0),
    folder("preview-folder-legal", "Legal", 1),
    folder("preview-folder-product", "Product", 2),
  ],
  documents: [
    document("preview-doc-overview", "Company Overview.pdf", null, "1"),
    document("preview-doc-model", "Financial Model.xlsx", "Financials", "1.1"),
    document("preview-doc-cap-table", "Cap Table.pdf", "Financials", "1.2"),
    document(
      "preview-doc-incorporation",
      "Articles of Incorporation.pdf",
      "Legal",
      "2.1",
    ),
    document("preview-doc-roadmap", "Product Roadmap.pdf", "Product", "3.1"),
  ],
});
