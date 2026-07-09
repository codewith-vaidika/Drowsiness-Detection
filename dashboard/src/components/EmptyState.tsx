/**
 * Empty state shown when there are no alerts in the database.
 * Displays a friendly green checkmark with an "All Drivers Safe" message.
 */
export default function EmptyState() {
  return (
    <div className="glass-card animate-fade-in-up flex flex-col items-center justify-center px-8 py-20">
      {/* Animated green checkmark circle */}
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{
          background: "rgba(52, 211, 153, 0.1)",
          boxShadow: "0 0 40px rgba(52, 211, 153, 0.15)",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-emerald)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h2
        className="mb-2 text-2xl font-bold"
        style={{ color: "var(--accent-emerald)" }}
      >
        All Drivers Safe
      </h2>

      <p
        className="max-w-sm text-center text-sm leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        No drowsiness alerts have been recorded. The system is actively
        monitoring all connected vehicles in real time.
      </p>

      {/* Subtle pulse ring */}
      <div className="mt-8 flex items-center gap-2">
        <span className="dot dot-live" />
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          System monitoring active
        </span>
      </div>
    </div>
  );
}
