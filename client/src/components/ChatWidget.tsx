import React, { useState, useRef, useEffect } from "react";
import "../styles/chatWidget.css";

type ChatMessage = {
  sender: "user" | "assistant";
  text: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: "Hi! I’m your Let's Ride Canada assistant. Ask me anything about browsing, bidding, or your account.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 🔁 Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isLoading]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { sender: "user", text: trimmed };

    // Optimistically add the user message
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Convert to backend format: { role, content }
      const payloadMessages = newMessages.map((m) => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      const resp = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();

      const assistantMessage: ChatMessage = {
        sender: "assistant",
        text:
          data.reply ||
          "Sorry, I had trouble answering that. Please try again in a moment.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Assistant request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Oops! Something went wrong talking to the assistant.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget-panel">
          <header className="chat-widget-header">
            <div className="chat-header-title">
              <span className="chat-logo-circle">LRC</span>
              <div>
                <h2>Let's Ride Canada Assistant</h2>
                <p>Here to help with your marketplace questions.</p>
              </div>
            </div>

            {/* top-right close button */}
            <button className="chat-close-btn" onClick={toggleOpen}>
              ×
            </button>
          </header>

          <div className="chat-widget-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message-row ${
                  msg.sender === "user" ? "from-user" : "from-assistant"
                }`}
              >
                {msg.sender === "assistant" && (
                  <div className="avatar assistant-avatar">LRC</div>
                )}

                <div
                  className={`chat-bubble ${
                    msg.sender === "user" ? "bubble-user" : "bubble-assistant"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === "user" && (
                  <div className="avatar user-avatar">You</div>
                )}
              </div>
            ))}

            {/* Typing indicator bubble while waiting for Gemini */}
            {isLoading && (
              <div className="chat-message-row from-assistant">
                <div className="avatar assistant-avatar">LRC</div>
                <div className="chat-bubble bubble-assistant typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-widget-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask something about Let's Ride Canada…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M4.5 20.25L19.5 12 4.5 3.75 4.5 10.5 13.5 12 4.5 13.5z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Only show the round button when closed */}
      {!isOpen && (
        <button
          className="chat-widget-toggle"
          onClick={toggleOpen}
          aria-label="Open assistant"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M4.5 20.25L19.5 12 4.5 3.75 4.5 10.5 13.5 12 4.5 13.5z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
