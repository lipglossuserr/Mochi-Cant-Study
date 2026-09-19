import { useCallback, useRef, useState } from 'react'
import { chatWithDeck } from '../api/flashcardService'
import type { ChatMessage, ChatTurn } from '../types/flashcard'
import { friendlyMessage } from '@/features/pet/utils/apiErrors'

/** Only recent turns are sent back as context — mirrors the server-side cap in FlashcardChatService, keeping the request small from this end too. */
const MAX_HISTORY_TURNS = 8

let nextId = 0
function newMessageId(): string {
    nextId += 1
    return `msg-${Date.now()}-${nextId}`
}

/**
 * Drives the "Ask Mochi" panel beside a studied deck
 * (DeckChatPanel). The conversation lives only in this hook's state —
 * nothing is persisted server-side (see FlashcardChatService's
 * javadoc) — so it naturally resets when the panel unmounts, e.g. on
 * leaving the deck. Same error-handling shape as useDeckGeneration
 * (friendlyMessage + a dismissable error) rather than a new
 * convention.
 */
export function useDeckChat(deckId: number) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Read inside ask() via ref rather than closing over `messages` directly,
    // so ask() doesn't need to be recreated (and re-passed to children) every
    // time a new message lands — only when deckId/sending actually change.
    const messagesRef = useRef<ChatMessage[]>([])
    messagesRef.current = messages

    const ask = useCallback(
        async (question: string) => {
            const trimmed = question.trim()
            if (!trimmed || sending) return

            const history: ChatTurn[] = messagesRef.current
                .filter((message) => !message.pending)
                .slice(-MAX_HISTORY_TURNS)
                .map(({ role, content }) => ({ role, content }))

            const userMessage: ChatMessage = { id: newMessageId(), role: 'user', content: trimmed }
            const pendingId = newMessageId()
            const pendingMessage: ChatMessage = { id: pendingId, role: 'assistant', content: '', pending: true }

            setError(null)
            setSending(true)
            setMessages((current) => [...current, userMessage, pendingMessage])

            try {
                const response = await chatWithDeck(deckId, trimmed, history)
                const answer = response.data.data.answer
                setMessages((current) =>
                    current.map((message) =>
                        message.id === pendingId ? { ...message, content: answer, pending: false } : message,
                    ),
                )
            } catch (err) {
                // Drop the pending bubble on failure rather than leaving a permanent
                // empty one — the error banner explains what happened, and the
                // student's own question stays visible so they can just try again.
                setMessages((current) => current.filter((message) => message.id !== pendingId))
                setError(friendlyMessage(err, "Mochi couldn't answer that right now — please try again."))
            } finally {
                setSending(false)
            }
        },
        [deckId, sending],
    )

    const reset = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    return { messages, sending, error, ask, dismissError: () => setError(null), reset }
}