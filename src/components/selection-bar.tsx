import { WaButton, WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

interface SelectionBarProps {
  readonly count: number;
  readonly pending: boolean;
  readonly cooldown: number;
  readonly error: unknown;
  readonly onDownload: () => void;
}

/** Sticky footer bar that bundles the ticked skills into a zip. */
export function SelectionBar({ count, pending, cooldown, error, onDownload }: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {count} selected
          {error ? (
            <span className="block text-destructive">
              {error instanceof Error ? error.message : "Download failed."}
            </span>
          ) : null}
        </div>
        <WaButton variant="brand" disabled={pending || cooldown > 0} onClick={onDownload}>
          <WaIcon
            name={pending ? "spinner" : "download"}
            animation={pending ? "spin" : undefined}
          />
          {cooldown > 0 ? `Retry in ${cooldown}s` : "Download zip"}
        </WaButton>
      </div>
    </div>
  );
}
