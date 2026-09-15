import type { HTMLAttributes, Ref } from "react";
import { cx, sortCx } from "@/utils/cx";

/**
 * Figma source: Board UI → dashboard 1 status dropdown dots (node 3731:3266).
 *
 * 12×12 status indicator: a 6px solid dot centered on a tinted halo.
 * Color pairs from Figma variables:
 *   green  → halo color/green/100,  dot color/green/500
 *   yellow → halo color/yellow/200, dot color/yellow/500
 *   indigo → halo color/indigo/100, dot color/indigo/500
 * In dark mode only the halo drops to 40% opacity; the center dot stays solid.
 */

type StatusDotColor = "green" | "yellow" | "indigo" | "red" | "gray";

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StatusDotColor;
  status?: "online" | "maintenance" | "offline";
  ref?: Ref<HTMLSpanElement>;
}

const styles = sortCx({
  base: "inline-flex size-3 shrink-0 items-center justify-center rounded-full",
  halo: {
    green: "bg-emerald-500/20",
    yellow: "bg-yellow-500/20",
    indigo: "bg-indigo-500/20",
    red: "bg-red-500/20",
    gray: "bg-neutral-500/20",
  },
  dot: {
    green: "bg-emerald-500",
    yellow: "bg-yellow-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
    gray: "bg-neutral-400",
  },
});

export function StatusDot({ color, status, className, ref, ...props }: StatusDotProps) {
  const resolvedColor: StatusDotColor =
    color ??
    (status === "online" ? "green" : status === "maintenance" ? "yellow" : status === "offline" ? "red" : "green");

  return (
    <span
      ref={ref}
      aria-hidden
      className={cx(styles.base, styles.halo[resolvedColor], className)}
      {...props}
    >
      <span className={cx("size-1.5 rounded-full", styles.dot[resolvedColor])} />
    </span>
  );
}
