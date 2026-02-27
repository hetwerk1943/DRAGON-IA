import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ color: "var(--color-heading)", fontSize: "2.5rem" }}>
          🐉 DRAGON-IA
        </h1>
        <p style={{ color: "var(--color-text)", opacity: 0.8 }}>
          The Autonomous Intelligence Platform
        </p>
      </header>
      <Chat />
    </main>
  );
}
