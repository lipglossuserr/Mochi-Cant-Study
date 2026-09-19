import type { RefObject } from 'react'
import { useDraggableSprite } from '@/hooks/useDraggableSprite'
import type { InventoryEntry } from '@/features/shop'
import { overlapsAnyOtherItem } from '../utils/roomCollision'
import PlacedItemSprite from './PlacedItemSprite'

interface InventoryTrayProps {
    entries: InventoryEntry[]
    roomRef: RefObject<HTMLElement | null>
    /**
     * Mochi's own bounding element — same drop zone Feed's
     * FoodInventoryTray already hit-tests against. SKIN entries
     * (coats/colors) equip onto Mochi herself rather than being placed
     * at a room x/y, so they need this ref instead of `roomRef`; see
     * `InventoryTrayTile` below.
     */
    mochiDropZoneRef: RefObject<HTMLElement | null>
    onPlace: (inventoryEntryId: number, x: number, y: number) => void
    isPlacing: (inventoryEntryId: number) => boolean
    /** Called instead of `onPlace` when the drop would overlap another placed item or fall outside the room. */
    onInvalidPlacement?: () => void
    /**
     * Equips a SKIN item onto Mochi (Shop v1.1) — PATCH /api/pet/skin
     * via PetContext's `equipPetSkin`. Fired when a SKIN tile is
     * dropped on Mochi herself. Never routed through `onPlace`: the
     * backend's RoomLayoutService explicitly rejects SKIN-category
     * items ("Items of category SKIN cannot be placed in the room"),
     * so sending one through the furniture-placement endpoint always
     * 400s and never changes her color.
     */
    onEquipSkin: (itemKey: string) => void
    isEquippingSkin: (itemKey: string) => boolean
    /** The pet's currently-equipped skin itemKey, so its tile can show a "worn" ring instead of sitting in the tray indistinguishably from the others. */
    equippedSkinKey?: string | null
}

function InventoryTray({
                           entries,
                           roomRef,
                           mochiDropZoneRef,
                           onPlace,
                           isPlacing,
                           onInvalidPlacement,
                           onEquipSkin,
                           isEquippingSkin,
                           equippedSkinKey,
                       }: InventoryTrayProps) {
    if (entries.length === 0) {
        return <p className="text-center font-body text-[11px] text-ink/40">Nothing to place yet — buy furniture, toys, or decor from the Shop.</p>
    }

    const hasSkins = entries.some((entry) => entry.item.category === 'SKIN')

    return (
        <div className="flex flex-col items-center gap-2">
            <p className="font-body text-[11px] text-ink/40">
                {hasSkins ? 'drag a coat onto Mochi to wear it, or drag furniture into the room to place it' : 'drag into the room to place'}
            </p>
            <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-5">
                {entries.map((entry) => (
                    <InventoryTrayTile
                        key={entry.id}
                        entry={entry}
                        roomRef={roomRef}
                        mochiDropZoneRef={mochiDropZoneRef}
                        onPlace={onPlace}
                        pending={isPlacing(entry.id)}
                        onInvalidPlacement={onInvalidPlacement}
                        onEquipSkin={onEquipSkin}
                        equipping={isEquippingSkin(entry.item.itemKey)}
                        isWorn={entry.item.category === 'SKIN' && entry.item.itemKey === equippedSkinKey}
                    />
                ))}
            </div>
        </div>
    )
}

interface InventoryTrayTileProps {
    entry: InventoryEntry
    roomRef: RefObject<HTMLElement | null>
    mochiDropZoneRef: RefObject<HTMLElement | null>
    onPlace: (inventoryEntryId: number, x: number, y: number) => void
    pending: boolean
    onInvalidPlacement?: () => void
    onEquipSkin: (itemKey: string) => void
    equipping: boolean
    isWorn: boolean
}

function InventoryTrayTile({
                               entry,
                               roomRef,
                               mochiDropZoneRef,
                               onPlace,
                               pending,
                               onInvalidPlacement,
                               onEquipSkin,
                               equipping,
                               isWorn,
                           }: InventoryTrayTileProps) {
    // SKIN items (coats/colors) have no room position — they equip
    // onto Mochi herself, so a SKIN tile's drop zone is her bounding
    // box, not the whole room. Everything else (furniture/toys/decor)
    // keeps hit-testing against the room, exactly as before.
    const isSkin = entry.item.category === 'SKIN'
    const busy = pending || equipping

    const { isDragging, dragStyle, handlers } = useDraggableSprite({
        dropZoneRef: isSkin ? mochiDropZoneRef : roomRef,
        disabled: busy,
        onDrop: (info) => {
            if (isSkin) {
                // A miss (dropped anywhere that isn't Mochi) just
                // leaves the coat in the tray — same "no-op, snap
                // back" behavior a furniture miss already has below.
                if (!info.hit) return
                onEquipSkin(entry.item.itemKey)
                return
            }

            const room = roomRef.current
            // A genuine miss (dropped nowhere near the room at all)
            // just leaves the item in the tray — that's correct,
            // expected behavior for a fresh unplaced item, unlike a
            // reposition of something already IN the room.
            if (!info.hit || !room) return

            const rect = room.getBoundingClientRect()
            const x = clampPercent(((info.clientX - rect.left) / rect.width) * 100)
            const y = clampPercent(((info.clientY - rect.top) / rect.height) * 100)

            // Only a real overlap with an already-placed item blocks
            // the drop — no "must be 100% inside the room" requirement,
            // since x/y above is already clamped into the room's bounds.
            if (overlapsAnyOtherItem(room, info.rect)) {
                onInvalidPlacement?.()
                return
            }

            onPlace(entry.id, x, y)
        },
    })

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                {...handlers}
                style={dragStyle}
                role="button"
                tabIndex={0}
                aria-label={
                    isSkin
                        ? `Drag ${entry.item.name} onto Mochi to wear it`
                        : `Drag ${entry.item.name} into the room to place it`
                }
                aria-disabled={busy}
                className={`relative flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border bg-gradient-to-b from-butter/70 to-blush-light/60 shadow-[0_12px_24px_-10px_rgba(224,112,158,0.5)] backdrop-blur-xl sm:h-[4.5rem] sm:w-[4.5rem] ${
                    isWorn ? 'border-taro ring-2 ring-taro/70' : 'border-white/60'
                } ${isDragging ? 'shadow-xl' : ''} ${busy ? 'pointer-events-none opacity-45' : ''}`}
            >
                <PlacedItemSprite item={entry.item} />
            </div>
            <span className="max-w-[4.5rem] truncate font-body text-[11px] font-medium text-ink/50 sm:text-xs">
                {entry.item.name}
                {isWorn ? ' ✓' : ''}
            </span>
        </div>
    )
}

function clampPercent(value: number): number {
    return Math.min(100, Math.max(0, value))
}

export default InventoryTray