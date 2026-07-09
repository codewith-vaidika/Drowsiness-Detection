interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  animationDelay?: number;
}

/**
 * A single KPI metric card with an icon, value, and gradient accent bar.
 */
export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: KpiCardProps) {
  return (
    <div className="glass-card animate-fade-in-up relative overflow-hidden p-6">
      {/* Gradient accent bar at the top */}
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: gradient }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon container */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: gradient,
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
