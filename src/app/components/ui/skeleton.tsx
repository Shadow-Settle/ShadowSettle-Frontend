import { cn } from "./utils";

/**
 * Base skeleton for dark theme: subtle muted placeholder that pulses while content loads.
 * Use for layout mimicry (cards, lines, circles) — only visible when data is loading.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted/50 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
