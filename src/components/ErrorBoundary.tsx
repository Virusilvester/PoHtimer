import React from "react";

interface Props {
  children: React.ReactNode;
  /** Optional fallback. Defaults to a friendly inline error card. */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches render errors in any child view and shows a recovery UI instead of
 * leaving the whole window blank. Wrap the view router with this in App.tsx.
 *
 * Usage:
 *   <ViewErrorBoundary>
 *     {renderCurrentView()}
 *   </ViewErrorBoundary>
 */
export class ViewErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // In production you could send this to Sentry / Tauri log
    console.error("[ViewErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36 }}>⚠</div>
        <div
          style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}
        >
          Something went wrong
        </div>
        {this.state.message && (
          <div
            style={{
              fontSize: 12,
              color: "var(--danger)",
              background: "var(--danger-dim)",
              border: "1px solid var(--danger)30",
              borderRadius: "var(--radius-md)",
              padding: "8px 14px",
              maxWidth: 420,
              wordBreak: "break-word",
              fontFamily: "var(--font-mono)",
            }}
          >
            {this.state.message}
          </div>
        )}
        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 360 }}>
          This view crashed. You can try reloading it, or reset your app state
          if the problem persists (Settings → Reset).
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={this.handleReset}
            style={{
              padding: "8px 18px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-dim)",
              border: "1px solid var(--border-accent)",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ↺ Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 18px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
