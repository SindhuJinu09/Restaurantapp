export default function StatCard({
  title,
  value,
  change,
  icon,
  footer,
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/60">
            {title}
          </p>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {value}
          </div>
          {change && <div className="mt-1 text-xs text-accent">{change}</div>}
        </div>
        {icon && (
          <div className="h-10 w-10 inline-grid place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-border/60 text-primary">
            {icon}
          </div>
        )}
      </div>
      {footer && (
        <div className="mt-3 text-xs text-foreground/70">{footer}</div>
      )}
    </div>
  );
}
