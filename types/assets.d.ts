/**
 * Static image imports.
 *
 * Next.js resolves `import Logo from "@/public/....svg"` to a StaticImageData
 * object at build time, but the project ships no ambient declaration for it,
 * so `tsc` cannot type those imports (see app/(auth)/register/page-client.tsx
 * and pages/notification-preferences.tsx, which pass the result to
 * `next/image`).
 */
declare module "*.svg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}
