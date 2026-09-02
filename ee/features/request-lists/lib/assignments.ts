/**
 * Assignment matching for request-list tasks.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. The rule is reconstructed from the TaskAssignment model
 * (prisma/schema/dataroom.prisma), which documents that exactly one of
 * viewerId / groupId / linkId / email is set per row; a viewer is assigned
 * when any row matches their identity. Callers use this to authorize viewer
 * uploads (pages/api/file/tus-viewer), so an empty assignment list denies
 * the upload rather than allowing it.
 */
type TaskAssignmentMatch = {
  viewerId: string | null;
  groupId: string | null;
  linkId: string | null;
  email: string | null;
};

type ViewerIdentity = {
  viewerId: string;
  email: string | null;
  linkId: string;
  groupIds: Set<string>;
};

export const isViewerAssigned = (
  assignments: TaskAssignmentMatch[],
  viewer: ViewerIdentity,
): boolean => {
  return assignments.some((assignment) => {
    if (assignment.viewerId) return assignment.viewerId === viewer.viewerId;
    if (assignment.groupId) return viewer.groupIds.has(assignment.groupId);
    if (assignment.linkId) return assignment.linkId === viewer.linkId;
    if (assignment.email) {
      return (
        !!viewer.email &&
        assignment.email.toLowerCase() === viewer.email.toLowerCase()
      );
    }
    return false;
  });
};
