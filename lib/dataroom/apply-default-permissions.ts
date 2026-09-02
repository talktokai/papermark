import { DefaultPermissionStrategy, RootItemAccess } from "@prisma/client";

import prisma from "@/lib/prisma";

/**
 * Seeds access-control rows for newly attached dataroom documents.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. The behaviour is reconstructed from the Prisma schema, whose
 * comments define both enums:
 *
 *   - INHERIT_FROM_PARENT — copy the permissions of the parent folder; for a
 *     root-level document there is no parent, so the dataroom's configured
 *     RootItemAccess applies.
 *   - ASK_EVERY_TIME      — grant nothing; the operator decides per document.
 *   - HIDDEN_BY_DEFAULT   — grant nothing, so the document stays hidden.
 *
 * Only INHERIT_FROM_PARENT creates rows. The other two strategies are
 * deliberately no-ops: absent rows mean "no access", which is the
 * conservative reading and matches what their names promise. A viewer never
 * gains access to a document the operator has not granted.
 */
type AttachedDocument = {
  id: string;
  folderId: string | null;
};

const accessFlags = (access: RootItemAccess) => ({
  canView: access !== "HIDDEN",
  canDownload: access === "VIEW_AND_DOWNLOAD",
});

/**
 * Applies the dataroom's default strategies to the given documents, for both
 * viewer groups and permission groups (links).
 */
export const applyDataroomDocumentPermissionDefaults = async ({
  dataroomId,
  dataroomDocuments,
  groupStrategy,
  groupRootItemAccess,
  linkStrategy,
  linkRootItemAccess,
}: {
  dataroomId: string;
  dataroomDocuments: AttachedDocument[];
  groupStrategy: DefaultPermissionStrategy;
  groupRootItemAccess: RootItemAccess;
  linkStrategy: DefaultPermissionStrategy;
  linkRootItemAccess: RootItemAccess;
}): Promise<void> => {
  if (dataroomDocuments.length === 0) return;

  const inheritForGroups = groupStrategy === "INHERIT_FROM_PARENT";
  const inheritForLinks = linkStrategy === "INHERIT_FROM_PARENT";
  if (!inheritForGroups && !inheritForLinks) return;

  const [viewerGroups, permissionGroups] = await Promise.all([
    inheritForGroups
      ? prisma.viewerGroup.findMany({
          where: { dataroomId },
          select: { id: true },
        })
      : Promise.resolve([]),
    inheritForLinks
      ? prisma.permissionGroup.findMany({
          where: { dataroomId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (viewerGroups.length === 0 && permissionGroups.length === 0) return;

  const folderIds = Array.from(
    new Set(
      dataroomDocuments
        .map((doc) => doc.folderId)
        .filter((id): id is string => !!id),
    ),
  );

  // Parent-folder permissions, per group, so each document can inherit the
  // access its containing folder already grants.
  const [viewerFolderRules, permissionFolderRules] = await Promise.all([
    viewerGroups.length && folderIds.length
      ? prisma.viewerGroupAccessControls.findMany({
          where: {
            groupId: { in: viewerGroups.map((g) => g.id) },
            itemId: { in: folderIds },
            itemType: "DATAROOM_FOLDER",
          },
          select: {
            groupId: true,
            itemId: true,
            canView: true,
            canDownload: true,
          },
        })
      : Promise.resolve([]),
    permissionGroups.length && folderIds.length
      ? prisma.permissionGroupAccessControls.findMany({
          where: {
            groupId: { in: permissionGroups.map((g) => g.id) },
            itemId: { in: folderIds },
            itemType: "DATAROOM_FOLDER",
          },
          select: {
            groupId: true,
            itemId: true,
            canView: true,
            canDownload: true,
            canDownloadOriginal: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const viewerByKey = new Map(
    viewerFolderRules.map((rule) => [`${rule.groupId}:${rule.itemId}`, rule]),
  );
  const permissionByKey = new Map(
    permissionFolderRules.map((rule) => [
      `${rule.groupId}:${rule.itemId}`,
      rule,
    ]),
  );

  const viewerRows = viewerGroups.flatMap((group) =>
    dataroomDocuments.map((doc) => {
      const parent = doc.folderId
        ? viewerByKey.get(`${group.id}:${doc.folderId}`)
        : undefined;
      const flags = parent
        ? { canView: parent.canView, canDownload: parent.canDownload }
        : accessFlags(groupRootItemAccess);
      return {
        groupId: group.id,
        itemId: doc.id,
        itemType: "DATAROOM_DOCUMENT" as const,
        ...flags,
      };
    }),
  );

  const permissionRows = permissionGroups.flatMap((group) =>
    dataroomDocuments.map((doc) => {
      const parent = doc.folderId
        ? permissionByKey.get(`${group.id}:${doc.folderId}`)
        : undefined;
      const flags = parent
        ? {
            canView: parent.canView,
            canDownload: parent.canDownload,
            canDownloadOriginal: parent.canDownloadOriginal,
          }
        : {
            ...accessFlags(linkRootItemAccess),
            canDownloadOriginal: false,
          };
      return {
        groupId: group.id,
        itemId: doc.id,
        itemType: "DATAROOM_DOCUMENT" as const,
        ...flags,
      };
    }),
  );

  // skipDuplicates keeps re-attaching a document from clobbering permissions
  // an operator has already tuned by hand ([groupId, itemId] is unique).
  await prisma.$transaction([
    ...(viewerRows.length
      ? [
          prisma.viewerGroupAccessControls.createMany({
            data: viewerRows,
            skipDuplicates: true,
          }),
        ]
      : []),
    ...(permissionRows.length
      ? [
          prisma.permissionGroupAccessControls.createMany({
            data: permissionRows,
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
};

/**
 * Called right after documents are attached to a dataroom. Reads the
 * dataroom's stored defaults and applies them, optionally off the request
 * path via the caller's `schedule` (waitUntil).
 */
export const onDataroomDocumentsAttached = async ({
  dataroomId,
  dataroomDocuments,
  schedule,
}: {
  dataroomId: string;
  dataroomDocuments: AttachedDocument[];
  schedule?: (promise: Promise<unknown>) => void;
}): Promise<void> => {
  if (dataroomDocuments.length === 0) return;

  const dataroom = await prisma.dataroom.findUnique({
    where: { id: dataroomId },
    select: {
      defaultPermissionStrategy: true,
      defaultGroupPermissionStrategy: true,
      defaultRootItemAccess: true,
      defaultGroupRootItemAccess: true,
    },
  });

  if (!dataroom) return;

  const work = applyDataroomDocumentPermissionDefaults({
    dataroomId,
    dataroomDocuments,
    groupStrategy: dataroom.defaultGroupPermissionStrategy,
    groupRootItemAccess: dataroom.defaultGroupRootItemAccess,
    linkStrategy: dataroom.defaultPermissionStrategy,
    linkRootItemAccess: dataroom.defaultRootItemAccess,
  });

  if (schedule) {
    schedule(work);
    return;
  }
  await work;
};
