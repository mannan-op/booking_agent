"use client"

import { FormEvent, useState } from "react"
import { ArrowUp, Bot, Loader2, RotateCcw, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Message = { role: "assistant" | "user"; content: string }

function responseText(value: unknown) {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    for (const key of ["reply", "message", "response", "text", "output"]) {
      if (typeof record[key] === "string") return record[key] as string
    }
    return JSON.stringify(value, null, 2)
  }
  return "The workflow completed without a response."
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello. Tell me the battery model you need, or upload a product image to begin.",
    },
  ])
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = text.trim()
    if (!message || isSending) return

    setText("")
    setError("")
    setMessages((current) => [...current, { role: "user", content: message }])
    setIsSending(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "web",
          from: "voltops-dashboard",
          message_id: `web-${Date.now()}`,
          text: message,
          image_url: "",
          content_type: "text",
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "The workflow returned an error.")
      setMessages((current) => [
        ...current,
        { role: "assistant", content: responseText(body) },
      ])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.")
    } finally {
      setIsSending(false)
    }
  }

  function resetConversation() {
    setMessages([
      { role: "assistant", content: "Conversation reset. What battery can I help you find?" },
    ])
    setError("")
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-5xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live workflow</p>
          <h1 className="text-2xl font-semibold tracking-tight">Customer chat</h1>
          <p className="mt-1 text-sm text-muted-foreground">Test the n8n battery sales intake from the operations workspace.</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetConversation} title="Reset conversation">
          <RotateCcw />
          Reset
        </Button>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? <Bot className="mt-1 size-5 shrink-0 text-primary" /> : null}
              <div className={`max-w-[min(85%,38rem)] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {message.content}
              </div>
              {message.role === "user" ? <UserRound className="mt-1 size-5 shrink-0 text-muted-foreground" /> : null}
            </div>
          ))}
          {isSending ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Waiting for n8n...</div> : null}
        </div>
        <div className="border-t border-border bg-muted/30 p-4">
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          <form className="flex items-end gap-3" onSubmit={sendMessage}>
            <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask about a battery model or availability..." rows={2} disabled={isSending} />
            <Button type="submit" size="icon-lg" disabled={isSending || !text.trim()} title="Send message"><ArrowUp /></Button>
          </form>
        </div>
      </section>
    </main>
  )
}