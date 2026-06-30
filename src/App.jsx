import { useState, useRef, useEffect } from "react";

const TOPICS = [
  {
    id: "cells",
    label: "Cells & Life",
    icon: "🔬",
    color: "#059669",
    light: "#ECFDF5",
    description: "Cell structure, organisation & life processes",
    topics: ["Animal & plant cells", "Cell organisation", "Microscopy", "Life processes (MRS GREN)"],
  },
  {
    id: "particles",
    label: "Particles & Matter",
    icon: "⚗️",
    color: "#7C3AED",
    light: "#F5F3FF",
    description: "States of matter, atoms & intro to chemistry",
    topics: ["States of matter", "Particle model", "Elements & compounds", "Physical vs chemical changes"],
  },
  {
    id: "forces",
    label: "Forces & Motion",
    icon: "🚀",
    color: "#DC2626",
    light: "#FEF2F2",
    description: "Forces, speed, gravity & energy",
    topics: ["Types of forces", "Speed & distance", "Gravity & weight", "Balanced & unbalanced forces"],
  },
  {
    id: "energy",
    label: "Energy",
    icon: "⚡",
    color: "#D97706",
    light: "#FFFBEB",
    description: "Energy stores, transfers & resources",
    topics: ["Energy stores", "Energy transfers", "Renewable energy", "Conservation of energy"],
  },
  {
    id: "reproduction",
    label: "Reproduction",
    icon: "🌱",
    color: "#DB2777",
    light: "#FDF2F8",
    description: "Human & plant reproduction",
    topics: ["Human reproductive system", "Puberty & adolescence", "Plant reproduction & pollination", "Fertilisation & pregnancy"],
  },
  {
    id: "acids",
    label: "Acids & Alkalis",
    icon: "🧪",
    color: "#0891B2",
    light: "#ECFEFF",
    description: "pH, neutralisation & indicators",
    topics: ["The pH scale", "Acids, alkalis & neutralisation", "Indicators", "Everyday acids & alkalis"],
  },
  {
    id: "mixtures",
    label: "Mixtures & Separation",
    icon: "🧫",
    color: "#65A30D",
    light: "#F7FEE7",
    description: "Pure substances & separating mixtures",
    topics: ["Mixtures vs pure substances", "Filtration & evaporation", "Distillation", "Chromatography"],
  },
  {
    id: "waves",
    label: "Light & Sound",
    icon: "💡",
    color: "#2563EB",
    light: "#EFF6FF",
    description: "Light, reflection, sound & hearing",
    topics: ["How light travels & reflection", "Refraction & colour", "How sound travels", "Hearing, pitch & volume"],
  },
  {
    id: "electricity",
    label: "Electricity & Magnetism",
    icon: "🔌",
    color: "#4F46E5",
    light: "#EEF2FF",
    description: "Circuits, current & magnets",
    topics: ["Circuits (series & parallel)", "Current & voltage", "Magnets & magnetic fields", "Electromagnets"],
  },
  {
    id: "space",
    label: "Space & Earth",
    icon: "🪐",
    color: "#475569",
    light: "#F1F5F9",
    description: "Solar system, seasons & rocks",
    topics: ["The solar system", "Day, night & seasons", "The Moon & its phases", "Rocks & the rock cycle"],
  },
];

const SYSTEM_PROMPT = `You are a friendly, enthusiastic KS3 Science tutor for a Year 7 student at a British curriculum school.

Your job:
1. Generate practice questions for the specific science topic.
2. Use KS3 Science vocabulary accurately (British spelling).
3. Correct answers with clear scientific explanations.
4. Connect concepts to real life where possible — it makes science click!
5. Be encouraging and fun. Use relevant emojis.

When generating questions:
- Give ONE question at a time (vary between recall, application and analysis). After the student answers, give feedback, then ask the next.
- Number them clearly: 1. 2. 3.
- Add 💡 Hint section at the end (one hint per question)

When correcting:
- Mark ✅ or ❌ per answer
- Give full scientific explanation for wrong answers
- Reward good scientific vocabulary with extra praise
- End with a fun science fact related to the topic

IMPORTANT FORMATTING RULE: Never use markdown. No asterisks, no hashtags, no backticks. Plain text only. Use numbered lists and emoji where helpful.`;

export default function ScienceApp() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("home");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startPractice = async (topic, subtopic) => {
    setActiveTopic(topic);
    setActiveSubtopic(subtopic);
    setMessages([]);
    setMode("chat");
    setLoading(true);

    const initMessage = `Generate 1 KS3 Science question for the topic: "${subtopic}" (${topic.label}). Level: start of Y7, bright student who loves science.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: initMessage }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong. Try again!";
      setMessages([{ role: "assistant", content: reply }]);
    } catch {
      setMessages([{ role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const userMsg = (typeof text === "string" ? text : input).trim();
    if (!userMsg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
    apiMessages[0] = {
      role: "user",
      content: `Science topic: ${activeTopic?.label} — Subtopic: ${activeSubtopic}\n\n${apiMessages[0].content}`,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error." }]);
    }
    setLoading(false);
  };

  if (mode === "home") {
    return (
      <div style={{ minHeight: "100vh", background: "#F0FDF4", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔬</div>
            <a href="https://y7-hub.vercel.app/" style={{ position: "fixed", top: 12, left: 12, zIndex: 50, background: "#fff", color: "#475569", textDecoration: "none", fontWeight: 700, fontSize: 13, padding: "6px 12px", borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }}>← Hub</a>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#14532D", margin: 0 }}>Science Y7</h1>
            <p style={{ color: "#6B7280", marginTop: 6, fontSize: 15 }}>Explore KS3 Science with your AI tutor</p>
          </div>

          {TOPICS.map((topic) => (
            <div key={topic.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 16, border: `2px solid ${topic.light}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ background: topic.light, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{topic.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: topic.color }}>{topic.label}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{topic.description}</div>
                </div>
              </div>
              <div style={{ padding: "12px 20px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {topic.topics.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => startPractice(topic, sub)}
                    style={{ background: topic.color, color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F0FDF4", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: activeTopic.color, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => setMode("home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>← Back</button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{activeTopic.label}</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{activeSubtopic}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 16, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: activeTopic.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                {activeTopic.icon}
              </div>
            )}
            <div style={{ background: msg.role === "user" ? activeTopic.color : "#fff", color: msg.role === "user" ? "#fff" : "#1F2937", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", maxWidth: "80%", fontSize: 14, lineHeight: 1.6, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: activeTopic.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{activeTopic.icon}</div>
            <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: activeTopic.color, animation: "bounce 1s infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "8px 16px 0", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["More questions", "Explain the concept", "Hint", "Give me a challenge"].map((q) => (
          <button key={q} onClick={() => sendMessage(q)} style={{ background: activeTopic.light, color: activeTopic.color, border: `1px solid ${activeTopic.color}30`, borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}</button>
        ))}
      </div>

      <div style={{ padding: "12px 16px 20px", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type your answers or ask a question..." style={{ flex: 1, border: "2px solid #E5E7EB", borderRadius: 24, padding: "10px 18px", fontSize: 14, outline: "none", fontFamily: "inherit" }} onFocus={(e) => (e.target.style.borderColor = activeTopic.color)} onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: activeTopic.color, color: "#fff", border: "none", borderRadius: "50%", width: 44, height: 44, fontSize: 20, cursor: loading ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0 }}>↑</button>
      </div>
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>
    </div>
  );
}
