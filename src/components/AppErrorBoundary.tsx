import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[AppErrorBoundary]", error, info);
  }

  private resetAndReload = () => {
    try {
      // Drop only auth + cached query state. Keep the cart so the customer
      // doesn't lose their order if the crash was unrelated.
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") || k.includes("supabase.auth.token") || k.startsWith("rq-")) {
          localStorage.removeItem(k);
        }
      });
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  private hardReset = () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.replace(window.location.origin);
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ fontFamily: "system-ui", padding: 32, maxWidth: 560, margin: "40px auto", color: "#111" }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ marginBottom: 16, color: "#444" }}>
          The page hit an unexpected error. You can try reloading, or fully reset the app's local data if the problem keeps happening.
        </p>
        <pre style={{ background: "#f5f5f5", padding: 12, fontSize: 12, overflow: "auto", marginBottom: 16 }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => window.location.reload()} style={{ padding: "8px 14px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>Reload</button>
          <button onClick={this.resetAndReload} style={{ padding: "8px 14px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>Sign out & reload</button>
          <button onClick={this.hardReset} style={{ padding: "8px 14px", border: "1px solid #c00", background: "#c00", color: "#fff", cursor: "pointer" }}>Reset app data</button>
        </div>
      </div>
    );
  }
}
