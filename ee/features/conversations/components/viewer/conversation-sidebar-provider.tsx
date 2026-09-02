import type { ReactNode } from "react";

/**
 * Context wiring for the viewer-side conversation (Q&A) sidebar.
 *
 * Stub replacement: the upstream repository imports these but does not
 * publish them. The provider and layout render their children unchanged, and
 * the "safe" hook returns null — the shape consumers already handle, since
 * they read it as `conversationSidebar?.isOpen` for components mounted
 * outside the provider.
 */
export type ConversationSidebarContextValue = {
  isOpen: boolean;
};

export function ConversationSidebarProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function ConversationSidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useConversationSidebarSafe(): ConversationSidebarContextValue | null {
  return null;
}
