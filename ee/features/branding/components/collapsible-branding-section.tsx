import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Collapsible wrapper around a group of branding settings.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. Unlike the other branding stubs this one must render its children —
 * it wraps real, working settings cards on the branding pages, so returning
 * null would hide functionality that is otherwise intact.
 */
export function CollapsibleBrandingSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
        aria-expanded={open}
      >
        {title}
        <span
          aria-hidden
          className={cn(
            "text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        >
          ›
        </span>
      </button>
      {open ? children : null}
    </div>
  );
}

export default CollapsibleBrandingSection;
