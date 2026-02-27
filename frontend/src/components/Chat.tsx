"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { chatCompletion } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await chatCompletion([...messages, userMessage]);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "Empty response received from server" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: could not reach the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "1rem",
          minHeight: 400,
          maxHeight: 600,
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        {messages.length === 0 && (
          <p style={{ opacity: 0.5, textAlign: "center", marginTop: "8rem" }}>
            Start a conversation with Dragon AI…
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background:
                  msg.role === "user" ? "var(--color-accent)" : "#333",
                padding: "0.5rem 1rem",
                borderRadius: 12,
                maxWidth: "80%",
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ opacity: 0.5 }}>Dragon is thinking…</div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-card)",
            color: "var(--color-text)",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            background: "var(--color-accent)",
            color: "var(--color-text)",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
