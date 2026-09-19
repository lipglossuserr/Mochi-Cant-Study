/**
 * Every focus-detection threshold lives here — mirrored by the backend's
 * FocusPolicy class. Nothing in the hooks or components hardcodes a number.
 */
export const focusConfig = {
  /** Minimum selectable study duration (backend re-validates this). */
  MIN_DURATION_MINUTES: 5,

  /** How often the UI clock re-renders (display only, not timekeeping). */
  UI_TICK_MS: 250,

  /** Face detection sampling rate: ~1.4 detections per second (MVP). */
  SAMPLE_INTERVAL_MS: 700,
  /** Minimum idle time between the end of one sample tick and the start of the next, so a slow tick can't starve the main thread. */
  SAMPLE_MIN_GAP_MS: 50,

  /** Aggregated focus batches are flushed roughly every 15 seconds. */
  BATCH_FLUSH_INTERVAL_MS: 15_000,

  /** Minimum detector confidence to accept a face at all. */
  MIN_DETECTION_CONFIDENCE: 0.5,

  /**
   * Central region: the face center must sit inside the middle portion of
   * the frame. 0.7 means the central 70% horizontally and vertically.
   */
  CENTRAL_REGION_FRACTION: 0.7,

  /**
   * The face must occupy at least this fraction of frame width to count
   * as "reasonably in front of the camera".
   */
  MIN_FACE_WIDTH_FRACTION: 0.1,

  /** Being off-center or turned away is forgiven briefly before DISTRACTED. */
  DISTRACTED_GRACE_MS: 1_500,

  /**
   * Reading/writing heuristic: how many confident head-pose readings at
   * the start of a session establish the "this is what looking at the
   * screen looks like" baseline nose-drop ratio — same pattern and same
   * starting-position assumption as the posture baseline further below.
   */
  READING_BASELINE_SAMPLES: 8,
  /**
   * Looking-down trigger: the nose has dropped to at least this multiple
   * of the calibrated baseline drop below the eye line. A multiple of
   * the baseline, not an absolute angle, so it adapts to camera
   * placement and sitting posture rather than assuming everyone's
   * webcam sits in the same spot.
   */
  READING_PITCH_RATIO_THRESHOLD: 1.6,
  /** Must read as head-down continuously this long before READING — a brief glance down at the keyboard shouldn't trip it. */
  READING_GRACE_MS: 1_800,

  /**
   * Head-turn detection (yaw), from detector keypoints: how far the nose
   * tip may drift sideways from the midpoint between the eyes, as a
   * fraction of the eye-to-eye distance. Facing the camera this is ~0;
   * a clear left/right head turn pushes it past ~0.35.
   */
  HEAD_TURN_NOSE_OFFSET_RATIO: 0.35,

  /** A missing face is forgiven for this long before NO_FACE. */
  NO_FACE_GRACE_MS: 2_000,

  /**
   * A second confident face detection is forgiven for this long before
   * MULTIPLE_FACES — same debounce treatment as every other state here.
   * Without it, a single flickery extra detection (a raised hand or
   * phone near the face can momentarily look like a second face to the
   * lightweight BlazeFace model) would instantly override an otherwise
   * correct PHONE/DROWSY/FOCUSED read for that tick.
   */
  MULTIPLE_FACES_GRACE_MS: 1_500,

  /**
   * Eyes-closed blendshape score (0-1, from FaceLandmarker's
   * outputFaceBlendshapes — eyeBlinkLeft/eyeBlinkRight) above which an
   * eye counts as "closed" for this sample. A single closed-eye sample
   * is just a blink; DROWSY_GRACE_MS below is what turns sustained
   * closure into an actual drowsy signal, so this threshold itself can
   * stay simple.
   */
  EYE_CLOSED_BLENDSHAPE_THRESHOLD: 0.45,

  /** Eyes must read as closed continuously for this long before DROWSY — long enough that a normal blink (~100-400ms) never trips it, short enough that actually dozing off gets caught quickly. */
  DROWSY_GRACE_MS: 1_500,

  /**
   * How many recent per-tick samples must agree before the noisiest raw
   * signals (hand-near-face, eyes-closed, head-turn) are trusted — a
   * simple majority-vote smoother. At the 700ms sample rate a window of
   * 3 is about two seconds of "outvoting" a single bad frame, with no
   * perceptible added lag.
   */
  SMOOTHING_WINDOW_SAMPLES: 3,

  /**
   * PERCLOS (percentage of eyelid closure) rolling window, in ms — the
   * standard drowsiness-research metric. Independent of and faster to
   * fire than the continuous-closure check above: it catches heavy,
   * frequent blinking/fluttering that never holds shut long enough on
   * its own, which is exactly what real drowsiness tends to look like.
   */
  PERCLOS_WINDOW_MS: 12_000,
  /** Fraction of the PERCLOS window that must read as closed to count as drowsy on its own. */
  PERCLOS_THRESHOLD: 0.5,
  /** Minimum samples collected before PERCLOS is trusted — otherwise an early, still-filling window (e.g. 1 closed sample out of 1 so far) would read as 100% closed. */
  PERCLOS_MIN_SAMPLES: 6,

  /** Mouth-open (jawOpen) blendshape score above which the mouth counts as "open" for yawn detection. */
  YAWN_BLENDSHAPE_THRESHOLD: 0.5,
  /** Mouth must read as open continuously this long before it counts as an actual yawn rather than talking — a sustained yawn is itself a strong, standalone drowsiness signal, firing DROWSY immediately once held this long. */
  YAWN_GRACE_MS: 1_200,

  /**
   * Phone-pickup heuristic: a detected hand landmark point counts as
   * "near the face" when it falls within this fraction of the frame's
   * diagonal from the face center. Deliberately generous — the goal is
   * "a hand is up near head height", not precise phone-shape
   * recognition, which MediaPipe's hand landmarker can't do anyway (it
   * locates hands, not objects held in them). Used only as the fallback
   * heuristic when the real object-detector model below fails to load.
   */
  HAND_NEAR_FACE_DISTANCE_FRACTION: 0.35,

  /**
   * FALLBACK PATH ONLY (object-detector model failed to load): a hand must
   * read as near-face continuously for this long before PHONE — brief
   * hand-near-face (adjusting glasses, hair) shouldn't trip it. The real
   * phone detector uses the evidence window below instead.
   */
  PHONE_GRACE_MS: 2_000,

  /**
   * Where the phone-detection object model is fetched from (CDN).
   * EfficientDet-Lite0, trained on the 80-class COCO dataset, which
   * includes "cell phone" — this is real object detection, not a hand-
   * position proxy. Restricted to that one category via
   * categoryAllowlist when the detector is created.
   */
  OBJECT_DETECTOR_MODEL_URL:
      'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
  /**
   * Minimum "cell phone" score for one detection to count as a hit. Low on
   * purpose: a phone held flat/tilted often scores only 0.3-0.5. Hits are
   * corroborated by a nearby hand and by the evidence window below, so a
   * single stray low score can't fire PHONE on its own. If you see false
   * PHONE states (a mouse or a mug being read as a phone), raise this first
   * — set PHONE_DEBUG_LOG to true to watch the actual scores.
   */
  PHONE_OBJECT_CONFIDENCE: 0.35,
  /** A single hit at/above this score switches PHONE on by itself. */
  PHONE_STRONG_CONFIDENCE: 0.6,
  /** Otherwise this many hits inside PHONE_EVIDENCE_WINDOW_MS switch PHONE on (~2 of the last 3-4 ticks). */
  PHONE_MIN_HITS: 2,
  PHONE_EVIDENCE_WINDOW_MS: 2_500,
  /** PHONE stays on until this long has passed with no hit — hysteresis so a missed frame doesn't flicker the state. */
  PHONE_RELEASE_MS: 1_500,
  /**
   * A detected phone box only counts as "being held" if a hand landmark
   * falls within this padded distance (as a fraction of frame size) of
   * the phone's own bounding box — a phone visible on the desk in the
   * background shouldn't count as phone-in-hand. Padded outward since a
   * held phone is often partly covered by the hand holding it, shrinking
   * its own detected box.
   */
  PHONE_HAND_PROXIMITY_FRACTION: 0.08,
  /**
   * The phone detector runs on a square crop around each hand rather than
   * on the whole frame (see phoneDetection.ts): the crop side is this
   * multiple of the hand's landmark span, never below
   * PHONE_CROP_MIN_SIDE_FRACTION of the frame's short side. The crop is
   * drawn at PHONE_CROP_INPUT_SIZE px, EfficientDet-Lite0's native input.
   */
  PHONE_CROP_SCALE: 2.4,
  PHONE_CROP_MIN_SIDE_FRACTION: 0.35,
  PHONE_CROP_INPUT_SIZE: 320,
  /** At most this many hands are scanned per tick (each scan is one detector run). */
  PHONE_CROP_MAX_HANDS: 2,
  /** Log the per-tick phone score to the console while tuning thresholds. */
  PHONE_DEBUG_LOG: false,

  /**
   * Run the heavier models (hand, object, face-landmarker, pose) on the GPU
   * via WebGL. Each is verified with one throwaway inference at load and
   * silently falls back to CPU if that fails. The primary FaceDetector stays
   * on CPU (it is tiny, and it is the one detector that must never regress).
   * Set to false to force CPU everywhere.
   */
  PREFER_GPU_DELEGATE: true,

  /** Camera resolution requested when this hook opens the camera itself (ideal, not exact — the browser picks the closest). Higher than 640x480 gives the hand crop more real pixels to work with. */
  CAMERA_IDEAL_WIDTH: 960,
  CAMERA_IDEAL_HEIGHT: 720,

  /** Where the MediaPipe runtime and model are fetched from (CDN). */
  // Must match the installed @mediapipe/tasks-vision version (package-lock.json
  // resolves 0.10.35) — the JS bundle and its WASM runtime are released in lockstep.
  MEDIAPIPE_WASM_URL:
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
  FACE_MODEL_URL:
      'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  /** FaceLandmarker, used only for its blendshape output (eyeBlinkLeft/Right) — drowsy detection. Not used for face presence/position, which stays on the lighter FaceDetector above. */
  FACE_LANDMARKER_MODEL_URL:
      'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  /** HandLandmarker, used only for "is a hand near the face" (phone-pickup) and gesture-shortcut recognition below. */
  HAND_LANDMARKER_MODEL_URL:
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

  /**
   * PoseLandmarker, used only for the posture nudge (shoulder/ear
   * tracking, session-local — see useFocusTracker.ts's posture-nudge
   * section). Never used for focus/presence classification, which stays
   * on FaceDetector above.
   */
  POSE_LANDMARKER_MODEL_URL:
      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',

  // ---- Gesture shortcuts (thumbs-up = end session, open palm = pause/resume) ----
  // Both reuse the same HandLandmarker output already computed for the
  // phone-pickup heuristic above — no extra model, no extra per-tick cost.

  /** A recognized gesture shape must hold steady this long before it fires — long enough that passing through the pose on the way to something else never triggers it. */
  GESTURE_HOLD_MS: 900,
  /** After a gesture fires, this long must pass (with the hand out of that shape at least once) before the same gesture can fire again — a deliberate one-shot-per-hold design, not a repeat-fire while held. */
  GESTURE_RETRIGGER_COOLDOWN_MS: 2_000,

  // ---- Posture nudge (session-local only; never sent to the backend, never affects the focus score) ----

  /** How many confident pose samples at the start of a session establish the "this is what good posture looks like for this person, in this seat" baseline. */
  POSTURE_BASELINE_SAMPLES: 8,
  /**
   * Slouch trigger: current ear-to-shoulder vertical gap (normalized by
   * shoulder width, so it's distance-from-camera independent) has
   * shrunk to this fraction of the calibrated baseline gap. 0.75 means
   * "the head has dropped/craned forward by roughly a quarter of the
   * original neck-to-shoulder distance."
   */
  SLOUCH_RATIO_THRESHOLD: 0.75,
  /** Must read as slouched continuously this long before nudging — a brief lean to grab a pen shouldn't trigger it. */
  SLOUCH_GRACE_MS: 12_000,
  /** Minimum time between posture nudges, so a sustained slouch doesn't nag every time the grace period re-elapses. */
  POSTURE_NUDGE_COOLDOWN_MS: 5 * 60_000,
} as const