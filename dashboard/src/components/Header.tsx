interface HeaderProps {
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

/**
 * Top header bar with the dashboard title, a live-polling indicator,
 * last-updated timestamp, and a manual refresh button with spinner.
 */
export default function Header({
  loading,
  lastUpdated,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      {/* Left: title + subtitle */}
      <div>
        <div className="flex items-center gap-3">
          {/* Shield icon */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-indigo)" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Fleet Safety Dashboard
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Real-time driver drowsiness monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Right: status + refresh */}
      <div className="flex items-center gap-4">
        {/* Auto-poll indicator */}
        <div className="flex items-center gap-2">
          <span className="dot dot-live" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Auto-refresh 10s
          </span>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <span className="hidden text-xs sm:inline" style={{ color: "var(--text-muted)" }}>
            Updated{" "}
            {lastUpdated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <>
              {/* Spinner */}
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path
                  d="M12 2a10 10 0 019.95 9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Refreshing…
            </>
          ) : (
            <>
              {/* Refresh icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>
    </header>
  );
}
