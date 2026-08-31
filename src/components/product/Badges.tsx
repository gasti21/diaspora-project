import { cn, categoryStyle, STAGE_STYLES, NEED_STYLES, STATUS_META } from "@/lib/utils";

export function CategoryBadge({ name, slug, className }: { name?: string; slug?: string; className?: string }) {
  if (!name) return null;
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-semibold",
        categoryStyle(slug),
        className
      )}
    >
      {name}
    </span>
  );
}

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-semibold",
        STAGE_STYLES[stage] ?? "bg-gray-100 text-gray-700",
        className
      )}
    >
      {stage}
    </span>
  );
}

export function NeedTag({ need, className }: { need: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2.5 py-1 text-xs font-medium",
        NEED_STYLES[need] ?? "bg-gray-100 text-gray-700",
        className
      )}
    >
      {need}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as keyof typeof STATUS_META];
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        meta.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
