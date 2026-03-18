import { useState, useCallback, useRef } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ─── API helpers ─────────────────────────────────────────────────────────────
const api = {
  upload: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/documents/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },
  list: async () => {
    const res = await fetch(`${API_URL}/api/documents`);
    return res.json();
  },
  query: async (document_id, question) => {
    const res = await fetch(`${API_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id, question }),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },
  deleteDoc: async (id) => {
    await fetch(`${API_URL}/api/documents/${id}`, { method: "DELETE" });
  },
};

// ─── Icons (SVG inline) ──────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const DocIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const BrainIcon = () => (
  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.16z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.16z"/>
  </svg>
);

// ─── Components ──────────────────────────────────────────────────────────────
function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "background:#dbeafe;color:#1e40af",
    green: "background:#dcfce7;color:#166534",
    yellow: "background:#fef9c3;color:#854d0e",
    red: "background:#fee2e2;color:#991b1b",
    purple: "background:#f3e8ff;color:#6b21a8",
  };
  return (
    <span style={{
      ...Object.fromEntries(colors[color].split(";").map(s => s.split(":"))),
      padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600
    }}>
      {children}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
        <span>Confidence</span><span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "#e5e7eb", borderRadius: 9999 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9999, transition: "width .5s" }} />
      </div>
    </div>
  );
}

function UploadZone({ onUpload, uploading }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${drag ? "#6366f1" : "#c7d2fe"}`,
        borderRadius: 16, padding: "40px 24px", textAlign: "center",
        cursor: uploading ? "not-allowed" : "pointer",
        background: drag ? "#eef2ff" : "#f8f9ff",
        transition: "all .2s", userSelect: "none"
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt,.md" hidden
        onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
      <div style={{ color: "#6366f1", marginBottom: 12, display: "flex", justifyContent: "center" }}>
        <UploadIcon />
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>
        {uploading ? "Processing document..." : "Drop your document here"}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
        PDF, TXT, or Markdown — up to 50MB
      </p>
      {uploading && (
        <div style={{ marginTop: 16, display: "flex", gap: 6, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%", background: "#6366f1",
              animation: `bounce 1s ${i * 0.15}s infinite`
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef();

  const handleUpload = async (file) => {
    setUploading(true); setError("");
    try {
      const doc = await api.upload(file);
      setDocuments(prev => [doc, ...prev]);
      setSelectedDoc(doc);
      setMessages([{
        role: "system",
        text: `Document "${doc.filename}" loaded! ${doc.chunk_count} chunks indexed. Ask me anything about it.`,
        meta: { pages: doc.page_count, chunks: doc.chunk_count }
      }]);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const handleQuery = async () => {
    if (!question.trim() || !selectedDoc || querying) return;
    const q = question.trim(); setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setQuerying(true);
    try {
      const result = await api.query(selectedDoc.id, q);
      setMessages(prev => [...prev, {
        role: "assistant", text: result.answer,
        sources: result.sources, confidence: result.confidence
      }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setMessages(prev => [...prev, { role: "error", text: e.message }]);
    } finally { setQuerying(false); }
  };

  const handleDelete = async (id) => {
    await api.deleteDoc(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDoc?.id === id) { setSelectedDoc(null); setMessages([]); }
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Summarize the key points in 3 bullets",
    "What conclusions does the document reach?",
    "Are there any statistics or numbers mentioned?",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#f1f1f1} ::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:3px}
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ color: "#fff", display: "flex" }}><BrainIcon /></div>
        <div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
            SmartDoc AI
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,.7)", fontSize: 12 }}>
            AI-Powered Document Analyzer · RAG + LLM · by Gowtham M.C.
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Badge color="blue">FastAPI</Badge>
          <Badge color="purple">LangChain</Badge>
          <Badge color="green">PostgreSQL</Badge>
          <Badge color="yellow">AWS + Azure</Badge>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 0, height: "calc(100vh - 72px)" }}>

        {/* Sidebar */}
        <div style={{ background: "#fff", borderRadius: "16px 0 0 0", padding: 20, overflowY: "auto", borderRight: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>
            Documents
          </h3>
          <UploadZone onUpload={handleUpload} uploading={uploading} />
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: 10, fontSize: 13, color: "#991b1b" }}>
              {error}
            </div>
          )}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => { setSelectedDoc(doc); setMessages([]); }}
                style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  background: selectedDoc?.id === doc.id ? "#eef2ff" : "#f9fafb",
                  border: `1px solid ${selectedDoc?.id === doc.id ? "#a5b4fc" : "#e5e7eb"}`,
                  transition: "all .15s", animation: "fadeIn .3s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#6366f1" }}><DocIcon /></span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", wordBreak: "break-word" }}>
                        {doc.filename.length > 22 ? doc.filename.slice(0,22)+"…" : doc.filename}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                        {doc.page_count} pages · {doc.chunk_count} chunks
                      </p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4 }}>
                    <TrashIcon />
                  </button>
                </div>
                <Badge color={doc.status === "ready" ? "green" : "yellow"}>{doc.status}</Badge>
              </div>
            ))}
            {documents.length === 0 && (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 16 }}>
                No documents yet. Upload one above!
              </p>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div style={{ background: "#f8f9ff", borderRadius: "0 16px 0 0", display: "flex", flexDirection: "column" }}>
          {!selectedDoc ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ fontSize: 64 }}>🧠</div>
              <h2 style={{ margin: 0, color: "#374151", fontWeight: 700 }}>Upload a document to get started</h2>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: 15 }}>
                Supports PDF, TXT, and Markdown. Powered by RAG + LLM pipeline.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 500, marginTop: 8 }}>
                {["Upload your resume", "Analyze a research paper", "Query a legal document", "Extract data from reports"].map(t => (
                  <span key={t} style={{ padding: "8px 16px", background: "#fff", borderRadius: 9999, fontSize: 13, color: "#6366f1", border: "1px solid #e0e7ff", fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Document header */}
              <div style={{ padding: "14px 24px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#6366f1" }}><DocIcon /></span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>{selectedDoc.filename}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                    {selectedDoc.page_count} pages · {selectedDoc.chunk_count} chunks · RAG pipeline active
                  </p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Badge color="green">Ready</Badge>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ animation: "fadeIn .3s ease" }}>
                    {msg.role === "user" && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ maxWidth: "70%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", fontSize: 14 }}>
                          {msg.text}
                        </div>
                      </div>
                    )}
                    {msg.role === "assistant" && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>🧠</div>
                        <div style={{ maxWidth: "75%" }}>
                          <div style={{ background: "#fff", padding: "14px 18px", borderRadius: "4px 18px 18px 18px", fontSize: 14, color: "#111827", lineHeight: 1.6, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                            {msg.text}
                          </div>
                          <ConfidenceBar value={msg.confidence} />
                          {msg.sources?.length > 0 && (
                            <details style={{ marginTop: 8 }}>
                              <summary style={{ fontSize: 12, color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>
                                {msg.sources.length} source chunks
                              </summary>
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                                {msg.sources.map((s, j) => (
                                  <div key={j} style={{ padding: "8px 12px", background: "#f0f4ff", borderRadius: 8, fontSize: 12, color: "#4b5563", borderLeft: "3px solid #6366f1" }}>
                                    {s}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                    {msg.role === "system" && (
                      <div style={{ textAlign: "center", padding: "10px 20px", background: "#ecfdf5", borderRadius: 12, fontSize: 13, color: "#166534", border: "1px solid #bbf7d0" }}>
                        ✅ {msg.text}
                      </div>
                    )}
                    {msg.role === "error" && (
                      <div style={{ textAlign: "center", padding: "10px 20px", background: "#fee2e2", borderRadius: 12, fontSize: 13, color: "#991b1b" }}>
                        ❌ {msg.text}
                      </div>
                    )}
                  </div>
                ))}
                {querying && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center" }}>🧠</div>
                    <div style={{ background: "#fff", padding: "14px 18px", borderRadius: "4px 18px 18px 18px", display: "flex", gap: 6, alignItems: "center" }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: `bounce 1s ${i*0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested questions */}
              {messages.length <= 1 && (
                <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {suggestedQuestions.map(q => (
                    <button key={q} onClick={() => setQuestion(q)}
                      style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e0e7ff", borderRadius: 9999, fontSize: 12, color: "#6366f1", cursor: "pointer", fontWeight: 500 }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: "12px 24px 20px", background: "#fff", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
                    placeholder="Ask anything about this document... (Enter to send)"
                    rows={1}
                    style={{
                      flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e0e7ff",
                      fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit",
                      background: "#f8f9ff", color: "#111827"
                    }}
                  />
                  <button onClick={handleQuery} disabled={!question.trim() || querying}
                    style={{
                      padding: "12px 20px", borderRadius: 12, border: "none",
                      background: question.trim() && !querying ? "linear-gradient(135deg,#667eea,#764ba2)" : "#e5e7eb",
                      color: question.trim() && !querying ? "#fff" : "#9ca3af",
                      cursor: question.trim() && !querying ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 14
                    }}>
                    <SendIcon /> Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
