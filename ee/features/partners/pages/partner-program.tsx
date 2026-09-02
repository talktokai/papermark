import AppLayout from "@/components/layouts/app";

/**
 * Partner / referral program page.
 *
 * Stub replacement: the upstream repository re-exports this page from
 * pages/partners.tsx but does not publish it. The sidebar entry that links
 * here is hidden by the referrals feature gate.
 */
export default function PartnerProgramPage() {
  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:p-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Partner program
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The partner program is not available in this build.
        </p>
      </main>
    </AppLayout>
  );
}
