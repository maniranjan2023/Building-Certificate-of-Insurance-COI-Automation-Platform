interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SkeletonPageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
