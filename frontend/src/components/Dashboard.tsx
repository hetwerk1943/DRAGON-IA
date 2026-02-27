"use client";

interface DashboardProps {
  role: "admin" | "user" | "team";
}

export default function Dashboard({ role }: DashboardProps) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "1.5rem",
      }}
    >
      <h2 style={{ color: "var(--color-heading)", marginBottom: "1rem" }}>
        Dashboard – {role}
      </h2>
      {role === "admin" && (
        <div>
          <h3>Admin Panel</h3>
          <ul>
            <li>System monitoring</li>
            <li>User management</li>
            <li>API key management</li>
            <li>Audit logs</li>
          </ul>
        </div>
      )}
      {role === "team" && (
        <div>
          <h3>Team Workspace</h3>
          <ul>
            <li>Shared conversations</li>
            <li>Team API keys</li>
            <li>Usage statistics</li>
          </ul>
        </div>
      )}
      {role === "user" && (
        <div>
          <h3>My Account</h3>
          <ul>
            <li>Chat history</li>
            <li>API usage</li>
            <li>Subscription</li>
          </ul>
        </div>
      )}
    </div>
  );
}
