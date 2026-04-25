"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { api, getAuthToken } from "@/lib/api";

interface Msg { role: "user" | "assistant"; content: string; }

export default function ChatPage() {
  return <Suspense fallback={<div className="py-16 text-center text-ink-500">Loading chat…</div>}><ChatInner /></Suspense>;
}

function ChatInner() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const params = useSearchParams();
  const wordId = params.get("wordId") ?? undefined;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What Korean words should I learn first?",
    "Explain 감사하다 with hanja breakdown",
    "How does spaced repetition work?",
    "Give me a mnemonic for 병원",
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMsgs: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setLoading(true);

    const res = await api.post<{ content: string; suggestions?: string[] }>("/chat", {
      message: msg,
      wordId,
      history: newMsgs.slice(-10),
    });

    if (res.ok && res.data) {
      setMessages([...newMsgs, { role: "assistant", content: res.data.content }]);
      if (res.data.suggestions) setSuggestions(res.data.suggestions);
    } else {
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, I couldn't respond. Please try again." }]);
    }
    setLoading(false);
  }, [input, loading, messages, wordId]);

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <h1 className="py-3 text-xl font-bold text-ink-900">AI Korean Tutor</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-5xl">🤖</div>
            <h2 className="mt-3 text-lg font-bold text-ink-900">Ask me anything about Korean!</h2>
            <p className="mt-1 text-sm text-ink-500">Vocabulary, grammar, pronunciation, hanja, mnemonics…</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-ink-700 hover:border-brand-300 hover:bg-brand-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === "user"
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-ink-900"
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-ink-500">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 py-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about a Korean word…"
            className="inp flex-1"
            disabled={loading}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-primary disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
