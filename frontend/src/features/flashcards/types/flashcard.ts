export type DeckMode = 'KEY_CONCEPT' | 'QA' | 'DEFINITION' | 'EXAM_PREP' | 'FORMULA'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type Focus = 'ENTIRE_DOCUMENT' | 'IMPORTANT_TOPICS_ONLY'

export interface Flashcard {
    id: number
    position: number
    front: string
    back: string
}

/** One row in the deck library — GET /api/flashcard-decks. */
export interface FlashcardDeckSummary {
    id: number
    title: string
    sourceFileName: string | null
    mode: DeckMode
    difficulty: Difficulty
    focus: Focus
    cardCount: number
    completed: boolean
    createdAt: string
}

/** Full deck with every card — GET /api/flashcard-decks/:id and the response of generating one. */
export interface FlashcardDeckDetail {
    id: number
    title: string
    sourceFileName: string | null
    mode: DeckMode
    difficulty: Difficulty
    focus: Focus
    aiSummary: string
    completed: boolean
    createdAt: string
    cards: Flashcard[]
}

export interface GenerateDeckOptions {
    mode: DeckMode
    difficulty: Difficulty
    focus: Focus
    cardCount: number
}
/** "Ask Mochi" chat, beside the flip-card view — nothing here is persisted server-side; it lives only for the current study session. */
export type ChatRole = 'user' | 'assistant'

/** One turn as sent to/from the backend — the wire shape, no UI-only fields. */
export interface ChatTurn {
    role: ChatRole
    content: string
}

/** One message as rendered in the panel — a ChatTurn plus local UI bookkeeping. */
export interface ChatMessage extends ChatTurn {
    id: string
    /** True only for the assistant bubble while its answer is still in flight. */
    pending?: boolean
}