import { describe, expect, it, vi } from 'vitest'
import type { ObjectDetector } from '@mediapipe/tasks-vision'
import {
  createPhoneEvidence,
  cropBoxToFrame,
  detectPhoneInHands,
  handCropRect,
  handNearBox,
} from '@/hooks/phoneDetection'
import type { HandPoints, PhoneScanOptions } from '@/hooks/phoneDetection'

/** 21 landmarks spread over a rectangle, palm center (index 9) at the middle. */
function makeHand(cx: number, cy: number, halfW = 0.05, halfH = 0.05): HandPoints {
  const pts: HandPoints = []
  for (let i = 0; i < 21; i++) {
    const t = i / 20
    pts.push({ x: cx - halfW + 2 * halfW * t, y: cy - halfH + 2 * halfH * (i % 2 === 0 ? t : 1 - t) })
  }
  pts[9] = { x: cx, y: cy }
  return pts
}

describe('handCropRect', () => {
  it('centres a square crop on the hand, scaled from its span', () => {
    // hand spans 0.1 * 640 = 64px wide, 0.1 * 480 = 48px tall → span 64
    const crop = handCropRect(makeHand(0.5, 0.5), 640, 480, 4, 0)
    expect(crop.side).toBeCloseTo(256, 0)
    expect(crop.x + crop.side / 2).toBeCloseTo(320, 0)
    expect(crop.y + crop.side / 2).toBeCloseTo(240, 0)
  })

  it('never goes below the minimum fraction of the short side', () => {
    const crop = handCropRect(makeHand(0.5, 0.5, 0.005, 0.005), 640, 480, 2.4, 0.35)
    expect(crop.side).toBeCloseTo(0.35 * 480, 5)
  })

  it('never exceeds the short side', () => {
    const crop = handCropRect(makeHand(0.5, 0.5, 0.4, 0.4), 640, 480, 3, 0.35)
    expect(crop.side).toBe(480)
  })

  it('stays fully inside the frame for a hand at the bottom edge (flat-phone case)', () => {
    const crop = handCropRect(makeHand(0.5, 0.95), 640, 480, 2.4, 0.35)
    expect(crop.y + crop.side).toBeLessThanOrEqual(480 + 1e-9)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.side).toBeLessThanOrEqual(640 + 1e-9)
  })
})

describe('cropBoxToFrame', () => {
  it('maps crop-input coordinates back to full-frame pixels', () => {
    const box = cropBoxToFrame({ originX: 160, originY: 80, width: 40, height: 100 }, { x: 100, y: 50, side: 640 }, 320)
    expect(box).toEqual({ originX: 420, originY: 210, width: 80, height: 200 })
  })
})

describe('handNearBox', () => {
  const box = { originX: 300, originY: 200, width: 60, height: 100 } // centre (330, 250) in a 640x480 frame
  it('is true when a palm sits inside/near the box', () => {
    expect(handNearBox([makeHand(330 / 640, 250 / 480)], box, 640, 480, 0.08)).toBe(true)
  })
  it('is false when the only hand is far from the box (phone on the desk)', () => {
    expect(handNearBox([makeHand(0.05, 0.05)], box, 640, 480, 0.08)).toBe(false)
  })
})

describe('detectPhoneInHands', () => {
  const options: PhoneScanOptions = {
    minScore: 0.35,
    cropScale: 2.4,
    minSideFraction: 0.35,
    inputSize: 320,
    maxHands: 2,
    handProximityPadding: 0.08,
  }

  function harness(detections: { score: number; box?: { originX: number; originY: number; width: number; height: number }; name?: string }[]) {
    const drawImage = vi.fn()
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }) } as unknown as HTMLCanvasElement
    const detect = vi.fn(() => ({
      detections: detections.map((d) => ({
        categories: [{ categoryName: d.name ?? 'cell phone', score: d.score }],
        boundingBox: d.box,
      })),
    }))
    const detector = { detect } as unknown as Pick<ObjectDetector, 'detect'>
    const video = {} as HTMLVideoElement
    return { drawImage, canvas, detect, detector, video }
  }

  it('returns null and does no work without a hand', () => {
    const h = harness([{ score: 0.9, box: { originX: 0, originY: 0, width: 50, height: 50 } }])
    expect(detectPhoneInHands(h.detector, h.video, h.canvas, [], 640, 480, options)).toBeNull()
    expect(h.detect).not.toHaveBeenCalled()
  })

  it('sizes the scratch canvas to the model input and crops around the hand', () => {
    const h = harness([])
    detectPhoneInHands(h.detector, h.video, h.canvas, [makeHand(0.5, 0.5)], 640, 480, options)
    expect(h.canvas.width).toBe(320)
    expect(h.canvas.height).toBe(320)
    expect(h.drawImage).toHaveBeenCalledTimes(1)
    const args = h.drawImage.mock.calls[0]
    expect(args.slice(5)).toEqual([0, 0, 320, 320])
  })

  it('reports the score of a phone that sits at the hand', () => {
    // hand centred at frame centre → crop centred there; a box in the middle of the crop maps to the middle of the frame
    const h = harness([{ score: 0.42, box: { originX: 130, originY: 110, width: 60, height: 100 } }])
    expect(detectPhoneInHands(h.detector, h.video, h.canvas, [makeHand(0.5, 0.5)], 640, 480, options)).toBeCloseTo(0.42, 5)
  })

  it('ignores scores below the minimum', () => {
    const h = harness([{ score: 0.2, box: { originX: 130, originY: 110, width: 60, height: 100 } }])
    expect(detectPhoneInHands(h.detector, h.video, h.canvas, [makeHand(0.5, 0.5)], 640, 480, options)).toBeNull()
  })

  it('ignores other categories', () => {
    const h = harness([{ score: 0.9, name: 'remote', box: { originX: 130, originY: 110, width: 60, height: 100 } }])
    expect(detectPhoneInHands(h.detector, h.video, h.canvas, [makeHand(0.5, 0.5)], 640, 480, options)).toBeNull()
  })

  it('ignores a phone in the crop that is nowhere near any palm (phone resting on the desk)', () => {
    // A big hand on the left gives a big crop (~460px) reaching well to its right;
    // the phone sits at frame (440, 240), far from the palm at (128, 240).
    const hand = makeHand(0.2, 0.5, 0.15, 0.15)
    const crop = handCropRect(hand, 640, 480, options.cropScale, options.minSideFraction)
    const k = options.inputSize / crop.side
    const box = { originX: (425 - crop.x) * k, originY: (215 - crop.y) * k, width: 30 * k, height: 50 * k }
    const h = harness([{ score: 0.9, box }])
    expect(detectPhoneInHands(h.detector, h.video, h.canvas, [hand], 640, 480, options)).toBeNull()
  })

  it('takes the best score across hands and never scans more than maxHands', () => {
    const h = harness([])
    detectPhoneInHands(h.detector, h.video, h.canvas, [makeHand(0.2, 0.5), makeHand(0.5, 0.5), makeHand(0.8, 0.5)], 640, 480, options)
    expect(h.detect).toHaveBeenCalledTimes(2)
  })
})

describe('createPhoneEvidence', () => {
  const cfg = { windowMs: 2500, minHits: 2, strongScore: 0.6, releaseMs: 1500 }

  it('does not fire on a single weak hit', () => {
    const e = createPhoneEvidence(cfg)
    expect(e.update(0, 0.4)).toBe(false)
    expect(e.update(700, null)).toBe(false)
  })

  it('fires on two weak hits inside the window, even with a miss between them', () => {
    const e = createPhoneEvidence(cfg)
    e.update(0, 0.4)
    e.update(700, null)
    expect(e.update(1400, 0.38)).toBe(true)
  })

  it('does not count hits that have aged out of the window', () => {
    const e = createPhoneEvidence(cfg)
    e.update(0, 0.4)
    expect(e.update(3000, 0.4)).toBe(false)
  })

  it('fires immediately on one strong hit', () => {
    const e = createPhoneEvidence(cfg)
    expect(e.update(0, 0.7)).toBe(true)
  })

  it('holds through short gaps and releases after releaseMs with no hit', () => {
    const e = createPhoneEvidence(cfg)
    e.update(0, 0.7)
    expect(e.update(700, null)).toBe(true)
    expect(e.update(1400, null)).toBe(true)
    expect(e.update(1500, null)).toBe(false)
  })

  it('needs fresh evidence again after releasing', () => {
    const e = createPhoneEvidence(cfg)
    e.update(0, 0.7)
    e.update(2000, null)
    expect(e.update(2100, 0.4)).toBe(false)
    expect(e.update(2800, 0.4)).toBe(true)
  })

  it('reset() clears everything', () => {
    const e = createPhoneEvidence(cfg)
    e.update(0, 0.7)
    e.reset()
    expect(e.update(100, null)).toBe(false)
  })
})
