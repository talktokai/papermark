import AppLayout from "@/components/layouts/app";

/**
 * Dataroom-level analytics dashboard.
 *
 * Stub replacement: the upstream repository re-exports this page from
 * pages/datarooms/[id]/analytics/index.tsx but does not publish it.
 * Per-document analytics are unaffected and remain available from each
 * document's page.
 */
export default function DataroomAnalyticsPage() {
  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:p-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dataroom analytics are not available in this build. Per-document
          analytics are still available from each document&apos;s page.
        </p>
      </main>
    </AppLayout>
  );
}
