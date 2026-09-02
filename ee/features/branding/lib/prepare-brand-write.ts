import { Prisma } from "@prisma/client";
import { z } from "zod";

import { validateRedirectUrl } from "@/lib/api/domains/validate-redirect-url";
import {
  teamPlanAllowsCustomWelcomeAndCta,
  teamPlanAllowsLayoutCustomization,
  teamPlanAllowsVisitorLanguage,
} from "@/lib/billing/team-plan-custom-messaging";

import {
  DataroomCardLayoutSchema,
  DataroomViewerHeaderStyleSchema,
} from "./dataroom-viewer-layout";

/**
 * Validates and plan-gates a brand create/update payload.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The contract is taken from its two call sites
 * (pages/api/teams/[teamId]/brands/index.ts and .../brands/[brandId]/index.ts),
 * which branch on `prepared.ok`, read `status` / `message` / `errors` on
 * failure and spread `prepared.data` straight into a Prisma write on success.
 *
 * Plan gating mirrors pages/api/teams/[teamId]/branding.ts: fields the team's
 * plan does not include are dropped rather than rejected, so a downgraded
 * team can still save the rest of its branding.
 */
const brandBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  logo: z.string().nullable().optional(),
  hideLogo: z.boolean().optional(),
  banner: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  accentButtonColor: z.string().nullable().optional(),
  applyAccentColorToDataroomView: z.boolean().optional(),
  welcomeMessage: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  privacyPolicyUrl: z.string().nullable().optional(),
  customLinkPreviewEnabled: z.boolean().optional(),
  linkPreviewTitle: z.string().nullable().optional(),
  linkPreviewDescription: z.string().nullable().optional(),
  linkPreviewImage: z.string().nullable().optional(),
  linkPreviewFavicon: z.string().nullable().optional(),
  cardLayout: DataroomCardLayoutSchema.optional(),
  showFolderTree: z.boolean().optional(),
  viewerHeaderStyle: DataroomViewerHeaderStyleSchema.optional(),
  hideFolderIconsInMain: z.boolean().optional(),
  defaultLanguage: z.string().optional(),
});

export type PreparedBrandWrite =
  | {
      ok: true;
      data: Omit<Prisma.BrandUncheckedCreateInput, "teamId">;
    }
  | {
      ok: false;
      status: number;
      message: string;
      errors?: unknown;
    };

export const prepareBrandWrite = async ({
  body,
  teamId,
  plan,
  nameRequired = false,
}: {
  body: unknown;
  teamId: string;
  plan: string | null | undefined;
  nameRequired?: boolean;
}): Promise<PreparedBrandWrite> => {
  const parsed = brandBodySchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: "Invalid brand payload",
      errors: parsed.error.flatten(),
    };
  }

  const input = parsed.data;

  if (nameRequired && !input.name) {
    return { ok: false, status: 400, message: "Brand name is required" };
  }

  const messagingAllowed = teamPlanAllowsCustomWelcomeAndCta(plan);
  const layoutAllowed = teamPlanAllowsLayoutCustomization(plan);
  const languageAllowed = teamPlanAllowsVisitorLanguage(plan);

  // CTA and privacy links are user-supplied URLs that end up in the viewer,
  // so they go through the same redirect validation the branding route uses.
  for (const field of ["ctaUrl", "privacyPolicyUrl"] as const) {
    const value = input[field];
    if (messagingAllowed && typeof value === "string" && value.trim()) {
      const result = await validateRedirectUrl(value, teamId);
      if (!result.valid) {
        return {
          ok: false,
          status: 400,
          message: result.message ?? `Invalid ${field}`,
        };
      }
    }
  }

  const data: Record<string, unknown> = {
    name: input.name ?? "Default",
    logo: input.logo,
    hideLogo: input.hideLogo,
    banner: input.banner,
    brandColor: input.brandColor,
    accentColor: input.accentColor,
    accentButtonColor: input.accentButtonColor,
    applyAccentColorToDataroomView: input.applyAccentColorToDataroomView,
  };

  if (messagingAllowed) {
    data.welcomeMessage = input.welcomeMessage;
    data.ctaLabel = input.ctaLabel;
    data.ctaUrl = input.ctaUrl;
    data.privacyPolicyUrl = input.privacyPolicyUrl;
    data.customLinkPreviewEnabled = input.customLinkPreviewEnabled;
    data.linkPreviewTitle = input.linkPreviewTitle;
    data.linkPreviewDescription = input.linkPreviewDescription;
    data.linkPreviewImage = input.linkPreviewImage;
    data.linkPreviewFavicon = input.linkPreviewFavicon;
  }

  if (layoutAllowed) {
    data.cardLayout = input.cardLayout;
    data.showFolderTree = input.showFolderTree;
    data.viewerHeaderStyle = input.viewerHeaderStyle;
    data.hideFolderIconsInMain = input.hideFolderIconsInMain;
  }

  if (languageAllowed && input.defaultLanguage) {
    data.defaultLanguage = input.defaultLanguage;
  }

  // Drop keys the caller never sent so a PATCH doesn't null out stored values.
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }

  return {
    ok: true,
    data: data as Omit<Prisma.BrandUncheckedCreateInput, "teamId">,
  };
};
