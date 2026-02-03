import React, { useEffect, useMemo, useState } from "react";
import { User, Shield, Settings, Accessibility, Lock, Info, Car, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

type TabKey = "profile" | "settings" | "accessibility" | "security" | "information" | "listings";

export const AccountPage: React.FC = () => {
  const { user, isGuest, isLoggedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<TabKey>("profile");

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehLoading, setVehLoading] = useState(false);
  const [vehError, setVehError] = useState<string | null>(null);

  useEffect(() => {
    // Lightweight fetch for the account dashboard cards.
    // The endpoint is public in guest mode, and also works for authenticated users.
    const run = async () => {
      try {
        setVehLoading(true);
        setVehError(null);
        const res = await fetch("http://localhost:8080/api/vehicles", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        const data = await res.json();
        setVehicles(Array.isArray(data?.vehicles) ? data.vehicles : []);
      } catch (e: any) {
        setVehError(e?.message ?? "Failed to fetch vehicles");
      } finally {
        setVehLoading(false);
      }
    };
    run();
  }, []);

  const email = isGuest ? "guest@powerbidz" : user?.email ?? "";
  const displayName = useMemo(() => {
    if (!email) return "—";
    const left = email.split("@")[0] || "";
    const parts = left.split(/[._-]+/).filter(Boolean);
    const titled = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    return titled.join(" ") || left;
  }, [email]);

  const role = isGuest ? "Guest" : (user?.role ?? "Buyer");
  const memberSince = useMemo(() => {
    // No created_at on the auth payload right now; keep it deterministic for demo.
    return isGuest ? "—" : "2026";
  }, [isGuest]);

  const PanelCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>{title}</div>
      <div style={{ marginTop: "0.5rem" }}>{children}</div>
    </div>
  );

  const items = useMemo(
    () => [
      { key: "profile" as const, label: "Profile", icon: User, hint: "name & email" },
      { key: "settings" as const, label: "Settings", icon: Settings, hint: "preferences" },
      { key: "accessibility" as const, label: "Accessibility", icon: Accessibility, hint: "comfort" },
      { key: "security" as const, label: "Login & Security", icon: Lock, hint: "password" },
      { key: "information" as const, label: "Information", icon: Info, hint: "about" },
      { key: "listings" as const, label: "My Listings", icon: Car, hint: "seller" },
    ],
    []
  );

  return (
    <section className="account-page">
      <div className="account-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Account</h2>
            <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              {isGuest
                ? "Guest mode: browse freely. Sign in to manage your profile and create listings."
                : isLoggedIn
                ? `Signed in as ${user?.email ?? ""}`
                : "Sign in to manage your profile and your seller settings."}
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.7rem",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--card2)",
              backdropFilter: "var(--backdrop)",
            }}
          >
            <Shield size={16} />
            <span style={{ fontSize: "0.85rem" }}>{isGuest ? "Guest" : "Authenticated"}</span>
          </div>
        </div>

        <div className="account-grid">
          <aside className="account-sidebar">
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
              Navigation
            </div>
            <ul className="account-menu">
              {items.map((it) => {
                const Icon = it.icon;
                const active = tab === it.key;
                return (
                  <li key={it.key} style={{ borderBottom: "1px solid var(--border)" }}>
                    <button
                      onClick={() => setTab(it.key)}
                      className={active ? "btn btn-primary" : "btn btn-ghost"}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.9rem",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <Icon size={18} />
                        {it.label}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>{it.hint}</span>
                        <ChevronRight size={16} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="account-panel">
            {tab === "profile" && (
              <div>
                <h3 style={{ marginTop: 0 }}>Profile</h3>
                <p style={{ color: "var(--muted)" }}>
                  {isGuest
                    ? "You’re browsing in Guest mode. You can explore the marketplace and analytics, but actions like creating listings are disabled."
                    : "Manage your profile, preferences, and seller settings from one place."}
                </p>
                <div
                  style={{
                    marginTop: "1rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  <PanelCard title="Name">
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{displayName}</div>
                  </PanelCard>
                  <PanelCard title="Email">
                    <div style={{ fontWeight: 600 }}>{email || "—"}</div>
                  </PanelCard>
                  <PanelCard title="Role">
                    <div style={{ fontWeight: 600 }}>{role}</div>
                  </PanelCard>
                  <PanelCard title="Member since">
                    <div style={{ fontWeight: 600 }}>{memberSince}</div>
                  </PanelCard>
                  <PanelCard title="Status">
                    <div style={{ fontWeight: 600 }}>{isGuest ? "Read-only" : "Full access"}</div>
                  </PanelCard>
                  <PanelCard title="Garage">
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                      {vehLoading ? "Loading vehicles…" : vehError ? vehError : `${vehicles.length} vehicles available`}
                    </div>
                  </PanelCard>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div>
                <h3 style={{ marginTop: 0 }}>Settings</h3>
                <p style={{ color: "var(--muted)" }}>
                  Customize your experience. These settings are stored locally for demo reliability.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                  <PanelCard title="Theme">
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button className={theme === "light" ? "btn btn-primary" : "btn btn-outline"} onClick={() => setTheme("light")}>
                        Light
                      </button>
                      <button className={theme === "dark" ? "btn btn-primary" : "btn btn-outline"} onClick={() => setTheme("dark")}>
                        Dark
                      </button>
                    </div>
                    <div style={{ marginTop: "0.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
                      Current: <b>{theme}</b>
                    </div>
                  </PanelCard>
                  <PanelCard title="Notifications">
                    <div style={{ color: "var(--muted)", fontSize: "0.92rem" }}>
                      Email + in-app notifications can be wired to the backend later.
                    </div>
                    <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span className="pill">Outbid alerts</span>
                      <span className="pill">Auction ending</span>
                      <span className="pill">New listings</span>
                    </div>
                  </PanelCard>
                </div>
              </div>
            )}

            {tab === "accessibility" && (
              <div>
                <h3 style={{ marginTop: 0 }}>Accessibility</h3>
                <p style={{ color: "var(--muted)" }}>
                  Built to be readable and usable in both themes.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                  <PanelCard title="Contrast">
                    <div style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Theme tokens keep contrast consistent across the app.</div>
                  </PanelCard>
                  <PanelCard title="Motion">
                    <div style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Subtle hover motion only (no heavy animation spam).</div>
                  </PanelCard>
                </div>
              </div>
            )}

            {tab === "security" && (
              <div>
                <h3 style={{ marginTop: 0 }}>Login &amp; Security</h3>
                <p style={{ color: "var(--muted)" }}>
                  {isGuest ? "Guest mode does not store credentials." : "Account security options for demo."}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                  <PanelCard title="Session">
                    <div style={{ fontWeight: 700 }}>{isGuest ? "Guest session" : "Authenticated"}</div>
                    <div style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.92rem" }}>
                      Cookie-based session (credentials included in requests).
                    </div>
                  </PanelCard>
                  <PanelCard title="Password">
                    <div style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Password reset flow can be added later (email + token).</div>
                  </PanelCard>
                </div>
              </div>
            )}

            {tab === "information" && (
              <div>
                <h3 style={{ marginTop: 0 }}>Information</h3>
                <p style={{ color: "var(--muted)" }}>
                  Power BIDZ is an AI-enhanced vehicle auction marketplace. This panel is designed for sponsor-facing demos.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                  <PanelCard title="Support">
                    <div style={{ color: "var(--muted)", fontSize: "0.92rem" }}>For issues, contact the team via the capstone sponsor channel.</div>
                  </PanelCard>
                  <PanelCard title="Version">
                    <div style={{ fontWeight: 700 }}>Demo build</div>
                    <div style={{ marginTop: "0.35rem", color: "var(--muted)", fontSize: "0.92rem" }}>UI: Openlane-inspired marketplace + analytics.</div>
                  </PanelCard>
                </div>
              </div>
            )}

            {tab === "listings" && (
              <div>
                <h3 style={{ marginTop: 0 }}>My Listings</h3>
                <p style={{ color: "var(--muted)" }}>
                  {isGuest
                    ? "Sign in to create and manage listings."
                    : "For the demo, this shows the latest vehicles available in the marketplace."}
                </p>

                <div style={{ marginTop: "1rem", display: "grid", gap: "0.6rem" }}>
                  {vehLoading && <div className="card">Loading…</div>}
                  {vehError && <div className="card">{vehError}</div>}
                  {!vehLoading && !vehError && vehicles.length === 0 && (
                    <div className="card">No listings found.</div>
                  )}
                  {!vehLoading && !vehError && vehicles.slice(0, 8).map((v) => (
                    <div key={v.id} className="card" style={{ padding: "0.9rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{v.year} {v.make} {v.model}</div>
                          <div style={{ marginTop: "0.2rem", color: "var(--muted)", fontSize: "0.92rem" }}>
                            {v.location ?? "Unknown"} · {v.status ?? "—"}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800 }}>${Number(v.price ?? 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
