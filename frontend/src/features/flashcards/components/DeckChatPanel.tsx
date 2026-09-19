import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDeckChat } from '../hooks/useDeckChat'
import type { FlashcardDeckDetail } from '../types/flashcard'

interface DeckChatPanelProps {
    deck: FlashcardDeckDetail
}

/**
 * "Ask Mochi" — a free-form Q&A panel beside the flip-card view in
 * FlashcardViewer, so a student can ask about the topic a deck was
 * generated from without leaving the study screen.
 * <p>
 * Visual language deliberately mirrors
 * components/community/ChatPanel.tsx (same bubble shapes, same design
 * tokens) so it reads as part of the same app rather than a bolted-on
 * widget — the two just differ in who's on "the other side" (Mochi/AI
 * here, other students there).
 */
function DeckChatPanel({ deck }: DeckChatPanelProps) {
    const { messages, sending, error, ask, dismissError, reset } = useDeckChat(deck.id)
    const [draft, setDraft] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)
    const stickToBottomRef = useRef(true)

    useEffect(() => {
        if (stickToBottomRef.current) {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        }
    }, [messages])

    const handleScroll = () => {
        const el = scrollRef.current
        if (!el) return
        stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        const trimmed = draft.trim()
        if (!trimmed || sending) return
        setDraft('')
        stickToBottomRef.current = true
        await ask(trimmed)
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/50 shadow-[0_18px_50px_-20px_rgba(168,106,138,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 border-b border-white/50 bg-white/40 px-5 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">💬</span>
                    <div>
                        <p className="font-body text-xs font-semibold text-ink/70">Ask Mochi</p>
                        <p className="font-body text-[11px] text-ink/40">Questions about {deck.title}</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={reset}
                        className="shrink-0 font-body text-[11px] font-semibold text-taro-dark/60 hover:text-taro-dark"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div ref={scrollRef} onScroll={handleScroll} className="flex h-80 flex-col gap-3 overflow-y-auto px-5 py-4 sm:h-96">
                {messages.length === 0 && (
                    <div className="m-auto flex flex-col items-center gap-1.5 px-4 text-center">
                        <span className="text-2xl opacity-60">🧠✦</span>
                        <p className="font-body text-sm text-ink/40">
                            Stuck on something in "{deck.title}"? Ask away — Mochi answers using this deck's material.
                        </p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((message) => {
                        const isUser = message.role === 'user'
                        return (
                            <motion.div
                                key={message.id}
                                layout
                                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div
                                    aria-hidden="true"
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-body text-[11px] font-bold ${
                                        isUser
                                            ? 'bg-gradient-to-br from-taro-light to-blush-light text-taro-dark'
                                            : 'bg-gradient-to-br from-blush to-rosegold text-white'
                                    }`}
                                >
                                    {isUser ? 'You' : '✦'}
                                </div>
                                <div className={`flex max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl px-3.5 py-2 font-body text-sm leading-relaxed whitespace-pre-wrap ${
                                            isUser
                                                ? 'rounded-br-md bg-taro text-white shadow-sm shadow-taro/30'
                                                : 'rounded-bl-md bg-white/85 text-ink shadow-sm'
                                        }`}
                                    >
                                        {message.pending ? <TypingDots /> : message.content}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {error && (
                <div className="border-t border-white/40 bg-berry/5 px-5 py-2 font-body text-xs text-berry">
                    {error}{' '}
                    <button type="button" onClick={dismissError} className="font-semibold underline">
                        dismiss
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/50 bg-white/30 p-4">
                <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask about this topic…"
                    maxLength={800}
                    aria-label="Ask Mochi a question about this deck"
                    className="w-full rounded-full border border-white/70 bg-white/80 px-4 py-2.5 font-body text-sm text-ink shadow-sm outline-none transition-shadow placeholder:text-ink/35 focus:border-taro focus:shadow-md focus:shadow-taro/10"
                />
                <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="shrink-0 rounded-full bg-taro px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm shadow-taro/30 transition-colors hover:bg-taro-dark disabled:opacity-50 disabled:shadow-none"
                >
                    {sending ? '…' : 'Ask'}
                </button>
            </form>
        </div>
    )
}

/** Three softly-pulsing dots in place of an answer while it's in flight — the assistant-bubble equivalent of a "typing…" indicator. */
function TypingDots() {
    return (
        <span className="flex items-center gap-1 py-0.5">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink/30"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </span>
    )
}

export default DeckChatPanel