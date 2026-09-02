import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Brand picker on the team branding page: select, rename, create, set default
 * and delete a team brand.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. It is implemented rather than stubbed out because it is the only way to
 * reach a team's non-default brands — rendering nothing would strand them.
 * Props mirror the call site in pages/branding.tsx.
 */

/** Sentinel id for a brand being composed but not yet saved. */
export const DRAFT_TEAM_BRAND_ID = "__draft__";

/** Picks an unused "Brand N" name for a newly created brand. */
export const nextTeamBrandName = (brands: { name: string }[]): string => {
  const taken = new Set(brands.map((brand) => brand.name));
  let index = brands.length + 1;
  while (taken.has(`Brand ${index}`)) index += 1;
  return `Brand ${index}`;
};

export function TeamBrandSwitcher({
  brands,
  selectedBrandId,
  defaultBrandId,
  brandName,
  onBrandNameChange,
  onSelect,
  onCreate,
  onSetDefault,
  onDelete,
  disabled,
}: {
  brands: { id: string; name: string }[];
  selectedBrandId: string | null;
  defaultBrandId: string | null;
  brandName: string;
  onBrandNameChange: Dispatch<SetStateAction<string>>;
  onSelect: Dispatch<SetStateAction<string | null>>;
  onCreate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const isDraft = selectedBrandId === DRAFT_TEAM_BRAND_ID;
  const isDefault = !!selectedBrandId && selectedBrandId === defaultBrandId;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="team-brand-select">Brand</Label>
        <Select
          value={selectedBrandId ?? undefined}
          onValueChange={onSelect}
          disabled={disabled}
        >
          <SelectTrigger id="team-brand-select" className="w-56">
            <SelectValue placeholder="Select a brand" />
          </SelectTrigger>
          <SelectContent>
            {isDraft ? (
              <SelectItem value={DRAFT_TEAM_BRAND_ID}>
                {brandName || "New brand"} (unsaved)
              </SelectItem>
            ) : null}
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
                {brand.id === defaultBrandId ? " (default)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="team-brand-name">Name</Label>
        <Input
          id="team-brand-name"
          value={brandName}
          onChange={(event) => onBrandNameChange(event.target.value)}
          disabled={disabled}
          className="w-56"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCreate}
          disabled={disabled}
        >
          New brand
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSetDefault}
          disabled={disabled || isDraft || isDefault}
        >
          Set as default
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          disabled={disabled || isDraft}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default TeamBrandSwitcher;
