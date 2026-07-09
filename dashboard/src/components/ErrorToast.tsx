import { useEffect, useState } from "react";

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

/**
 * A top-right error notification toast that auto-dismisses after 8 seconds.
 * Slides in from the right with a red accent border.
 */
export default function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border-l-4 px-5 py-4 shadow-2xl transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--accent-rose)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(100%)",
      }}
    >
      {/* Error icon */}
      <svg
        className="mt-0.5 shrink-0"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent-rose)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>

      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--accent-rose)" }}>
          Connection Error
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="shrink-0 cursor-pointer rounded-md p-1 transition-colors hover:bg-white/10"
        style={{ color: "var(--text-muted)", background: "none", border: "none" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
