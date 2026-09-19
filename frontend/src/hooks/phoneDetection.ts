import type { ObjectDetector } from '@mediapipe/tasks-vision'

/**
 * Phone-in-hand detection helpers, kept free of React and of any live
 * MediaPipe state so they can be unit-tested with plain stubs.
 *
 * Two ideas live here:
 *
 *  1. Detect on a crop around each hand, not on the whole frame.
 *     EfficientDet-Lite0 always sees a 320x320 input. A phone that is
 *     ~100px wide in a 640x480 webcam frame ends up ~50px wide after
 *     the full-frame downscale — small enough that a phone held flat
 *     or tilted (a thin, oblique shape) is routinely missed. Cropping a
 *     square around the hand and upscaling it to the model's input
 *     size gives the detector the phone at roughly native resolution,
 *     and also means the detector only runs when a hand is actually
 *     in frame (the corroboration we require anyway).
 *
 *  2. Accumulate evidence over a short time window instead of demanding
 *     a long unbroken streak. Real-world phone detections are sparse
 *     (angle, blur, fingers covering the body), so "several confident
 *     hits in a row for 3+ seconds" almost never completes. Instead:
 *     a couple of hits inside a window — or one very confident hit —
 *     switches PHONE on quickly, and it only switches off after a
 *     short stretch with no hits at all (hysteresis), so it doesn't
 *     flicker between frames either.
 */

/** One hand's landmarks — only x/y (normalized 0-1) are used here. */
export type HandPoints = { x: number; y: number }[]

/** A bounding box in pixels, same origin/width/height shape MediaPipe returns. */
export type PixelBox = { originX: number; originY: number; width: number; height: number }

/** A square region of the source frame, in pixels. */
export interface CropRect {
  x: number
  y: number
  side: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Square crop, in frame pixels, centred on the hand's landmark extent
 * and `scale` times its longest side. Never smaller than
 * `minSideFraction` of the frame's short side (a far-away hand would
 * otherwise produce a uselessly tiny crop) and never larger than the
 * short side itself; always fully inside the frame.
 */
export function handCropRect(
    hand: HandPoints,
    frameW: number,
    frameH: number,
    scale: number,
    minSideFraction: number,
): CropRect {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of hand) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const shortSide = Math.min(frameW, frameH)
  const handSpan = Math.max((maxX - minX) * frameW, (maxY - minY) * frameH)
  const side = clamp(handSpan * scale, minSideFraction * shortSide, shortSide)
  const centerX = ((minX + maxX) / 2) * frameW
  const centerY = ((minY + maxY) / 2) * frameH
  return {
    x: clamp(centerX - side / 2, 0, frameW - side),
    y: clamp(centerY - side / 2, 0, frameH - side),
    side,
  }
}

/** Map a box the detector reported in crop-input coordinates back into full-frame pixels. */
export function cropBoxToFrame(box: PixelBox, crop: CropRect, inputSize: number): PixelBox {
  const k = crop.side / inputSize
  return {
    originX: crop.x + box.originX * k,
    originY: crop.y + box.originY * k,
    width: box.width * k,
    height: box.height * k,
  }
}

/**
 * Is any detected hand actually at/near this box — i.e. plausibly
 * holding the object it belongs to — rather than the object just
 * existing somewhere in frame (a phone lying on the desk in the
 * background shouldn't count as "phone in hand"). Landmark 9
 * (middle-finger MCP) is a stable palm-center point. `paddingFraction`
 * widens the box since a held phone is often partly covered by the
 * hand holding it, shrinking its own detected box.
 */
export function handNearBox(
    hands: HandPoints[],
    box: PixelBox,
    frameW: number,
    frameH: number,
    paddingFraction: number,
): boolean {
  const boxCenterX = (box.originX + box.width / 2) / frameW
  const boxCenterY = (box.originY + box.height / 2) / frameH
  const boxRadius = Math.max(box.width / frameW, box.height / frameH) / 2 + paddingFraction
  for (const hand of hands) {
    const palm = hand[9]
    if (!palm) continue
    const dx = palm.x - boxCenterX
    const dy = palm.y - boxCenterY
    if (Math.sqrt(dx * dx + dy * dy) <= boxRadius) return true
  }
  return false
}

export interface PhoneScanOptions {
  /** Minimum "cell phone" score to count a detection. */
  minScore: number
  /** Crop side as a multiple of the hand's longest landmark span. */
  cropScale: number
  /** Crop side never smaller than this fraction of the frame's short side. */
  minSideFraction: number
  /** Square input size (px) the crop is drawn at — the detector's native input size. */
  inputSize: number
  /** At most this many hands are scanned per tick. */
  maxHands: number
  /** Padding (fraction of frame) for the phone-box-to-palm proximity check. */
  handProximityPadding: number
}

/**
 * Run the object detector on a crop around each detected hand and
 * return the best "cell phone" score for a phone that sits at/near a
 * hand, or null when there's none. `canvas` is a reusable scratch
 * canvas (kept by the caller so we don't allocate one per tick).
 *
 * The detector is expected to be in IMAGE mode: crops from different
 * places in the frame aren't a video sequence, so there's no timestamp
 * to keep monotonic and no tracking state to confuse.
 */
export function detectPhoneInHands(
    detector: Pick<ObjectDetector, 'detect'>,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    hands: HandPoints[],
    frameW: number,
    frameH: number,
    options: PhoneScanOptions,
): number | null {
  const usable = hands.filter((hand) => hand.length > 0)
  if (usable.length === 0) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  if (canvas.width !== options.inputSize) canvas.width = options.inputSize
  if (canvas.height !== options.inputSize) canvas.height = options.inputSize

  let best: number | null = null
  for (const hand of usable.slice(0, options.maxHands)) {
    const crop = handCropRect(hand, frameW, frameH, options.cropScale, options.minSideFraction)
    ctx.drawImage(video, crop.x, crop.y, crop.side, crop.side, 0, 0, options.inputSize, options.inputSize)
    const result = detector.detect(canvas)
    for (const detection of result.detections ?? []) {
      const category = detection.categories?.[0]
      if (category?.categoryName !== 'cell phone') continue
      const score = category.score ?? 0
      if (score < options.minScore || !detection.boundingBox) continue
      const frameBox = cropBoxToFrame(detection.boundingBox, crop, options.inputSize)
      if (!handNearBox(usable, frameBox, frameW, frameH, options.handProximityPadding)) continue
      if (best === null || score > best) best = score
    }
  }
  return best
}

export interface PhoneEvidenceConfig {
  /** Hits older than this stop counting toward activation. */
  windowMs: number
  /** This many hits inside the window switch PHONE on. */
  minHits: number
  /** A single hit at/above this score switches PHONE on by itself. */
  strongScore: number
  /** PHONE stays on until this long has passed with no hit at all. */
  releaseMs: number
}

export interface PhoneEvidence {
  /** Feed one tick's best phone score (null = no phone-in-hand this tick); returns whether PHONE is currently on. */
  update(now: number, bestScore: number | null): boolean
  reset(): void
}

export function createPhoneEvidence(config: PhoneEvidenceConfig): PhoneEvidence {
  let hits: { t: number; score: number }[] = []
  let active = false
  let lastHitAt = -Infinity

  return {
    update(now, bestScore) {
      if (bestScore !== null) {
        hits.push({ t: now, score: bestScore })
        lastHitAt = now
      }
      hits = hits.filter((hit) => now - hit.t <= config.windowMs)

      if (!active) {
        const strong = hits.some((hit) => hit.score >= config.strongScore)
        if (strong || hits.length >= config.minHits) active = true
      } else if (now - lastHitAt >= config.releaseMs) {
        active = false
        hits = []
      }
      return active
    },
    reset() {
      hits = []
      active = false
      lastHitAt = -Infinity
    },
  }
}
