# VANTA — Phase 2 Full Build Prompt
**Builds on:** Phase 1 (physics sandbox, clay objects, hand tracking)  
**Deploy:** Vercel (free tier)  
**New dependencies:** Web Audio API (browser-native), Groq SDK, trie-search (npm)

---

## 0. Agent Rules (Same as Phase 1, Read Anyway)

- One commit per feature. Format: `type(scope): description`
- Confirm every "done when" condition before proceeding to the next
- Never batch changes across features
- Free tier only
- Design system from Phase 1 applies everywhere. No new colors or fonts without explicit instruction.

---

## CRITICAL PHASE 1 CORRECTION — FIX THIS FIRST

**The room builder flow was wrong. Remove it entirely.**

The original Phase 1 design had a forced room-builder sequence on first load (spread hands → set width → set height → confirm). This is gone. Do not reference it. Do not keep it as an optional flow. Delete it.

**What replaces it:**

Page lands → camera turns on → user is immediately in the experience. No setup. No configuration. No gates.

The room exists implicitly — there is always a default world space active (5m × 4m × 3m, standard gravity). The user never has to think about it. Physics just works from the first second.

The room dimension feature is not removed from the product — it moves to a Settings panel (Phase 3+). For now: default room, always on, invisible.

Remove these files/components entirely:
- `components/room/RoomBuilder.tsx`
- `components/room/RoomPhysics.tsx` — keep the colliders logic but move it to `lib/physics/defaultRoom.ts`, initialized automatically on app mount, no user interaction required

The wireframe visual is also gone from default view. Floor grid only (0.04 opacity, --border color). The space should feel open, not caged.

---

## 1. Phase 2 Overview

Phase 2 adds three major systems on top of the Phase 1 physics sandbox:

1. **Onboarding** — contextual teaching for new users, skippable, never forced
2. **Air Typing** — pinch-to-type with ghost-text prediction, letters rendered in 3D space
3. **Voice Typography** — speak and the words appear, volume and intensity shape how they look
4. **Word Themes** — detected trigger words transform into styled visual moments
5. **Two new materials** — strings and sticks (alongside existing clay)
6. **PDF export** — second share format

---

## 2. Onboarding System

### 2.1 Philosophy

VANTA teaches by doing, not by explaining. New users are never stopped, never gated, never shown a slideshow. The experience starts immediately. Hints appear contextually — only when relevant, only once, only if the user hasn't done that action before.

Returning users see nothing. Just the experience.

### 2.2 New User Detection

```typescript
// lib/onboarding/userState.ts
const ONBOARDING_KEY = 'vanta_onboarding_v1'

type OnboardingState = {
  hasSeenHints: string[]   // list of hint IDs already shown/dismissed
  isReturning: boolean
  completedTutorial: boolean
}

// On app mount: read from localStorage
// If key doesn't exist: new user, show hints
// If key exists: returning user, no hints
```

### 2.3 Contextual Hint System

Hints are floating text labels that appear near the relevant interaction area. They are NOT modals, NOT tooltips, NOT overlays.

**Hint anatomy:**
```
[small animated hand/gesture icon — 16px SVG]
[hint text — DM Sans, 13px, --ghost color, weight 300]
```
No background. No border. No card. Just text + icon floating in space, slight fade-in (400ms), positioned at the relevant screen region.

**Auto-dismiss rules:**
- User performs the hinted action → hint fades out (300ms), never shown again
- User ignores for 8 seconds → hint fades out quietly, shown again next session max once more
- After that: never shown again regardless

**Hint sequence (shown one at a time, in order, as user enters each context):**

| Hint ID | Trigger Condition | Position | Text |
|---|---|---|---|
| `hint_pinch` | Hands detected, no action for 3s | Center screen | "Pinch to place" |
| `hint_draw` | First pinch detected | Near right hand | "Draw a shape to create an object" |
| `hint_throw` | First object created | Bottom center | "Grip it. Throw it." |
| `hint_voice` | User has been in experience 30s | Top center | "Try speaking" |
| `hint_type` | User has been in experience 60s | Center | "Pinch letters to type in the air" |

Maximum 5 hints total in a session. After all 5 shown (or dismissed), hints system is fully silent.

### 2.4 Tutorial Button

Always visible in top-right corner (alongside tracking status), low opacity (0.3) until hovered (1.0).

Label: "TUTORIAL" — Bebas Neue, 11px, --fog, letter-spacing 0.1em

On click: opens a full-screen guided walkthrough. This is the ONLY place a full-screen overlay is acceptable in VANTA.

Tutorial walkthrough design:
- Dark overlay (--void at 0.95 opacity)
- Steps shown one at a time
- Each step: large gesture illustration (SVG, custom drawn — no stock icons), one line of instruction text (DM Sans, 18px, --bone)
- User performs the action to advance (not a button click — the system detects the gesture)
- Step counter bottom-center: "2 / 7" — JetBrains Mono, 12px, --fog
- Skip button: top-right, "SKIP" text, --fog
- On complete or skip: overlay closes, `completedTutorial: true` saved to localStorage

Tutorial steps:
1. Pinch gesture — "Pinch your index finger and thumb to interact"
2. Draw a circle — "Draw a shape in the air to create a clay ball"
3. Grab and throw — "Grip the ball. Open your palm to throw."
4. Wall bounce — "Watch it come back." (passive, triggered by first wall collision)
5. Voice — "Say anything. Speak louder to make it bigger."
6. Air type — "Pinch letters to type in the air"
7. Share — "Tap the share icon when you've made something worth keeping"

---

## 3. Air Typing System

### 3.1 Overview

The user air-types by pinching letter keys on a virtual keyboard that floats in 3D space in front of them. As they type, letters appear in 3D world space at a comfortable reading position. A ghost-text prediction shows the predicted word completion in dim styling alongside the typed characters.

### 3.2 Virtual Keyboard Layout

Rendered in Three.js as a flat plane at z = -1.5m from user (mid-room depth), y = 0.8m (comfortable arm height).

Standard QWERTY layout. Each key:
- Size: 0.08m × 0.08m
- Gap: 0.01m between keys
- Visual: `THREE.PlaneGeometry` with custom shader
  - Default state: --surface color, --border edge, key label in --fog
  - Hover state (hand within 0.03m): key brightens, --ghost label color, subtle white edge glow
  - Press state (pinch detected within key bounds): key flashes --snap for 80ms, letter emits upward

Keyboard appears/disappears:
- Appears: when user holds open palm facing forward for 1.2 seconds ("summon keyboard")
- Disappears: same gesture held for 1.2s again, or automatically after 10s of no typing

Keyboard opacity when not in use: 0 (fully hidden). Does not clutter the space.

### 3.3 Typed Text Rendering

Letters appear in 3D world space above the keyboard (y +0.4m from keyboard plane).

Typography of typed letters in 3D:
- Font: rendered as `THREE.TextGeometry` using a loaded FontLoader font (use Helvetiker from Three.js examples — included in the package, no external load needed)
- Default size: 0.12m per character
- Color: `--bone` (#E8E8F0) as emissive material, slight glow
- Letter spacing: 0.02m gap
- Letters animate in: scale from 0 → 1 over 120ms, slight forward Z pop (+0.02m) then settle

Words are separated by a spacebar key. Each word is a separate `THREE.Group` so word-theme transforms apply per-word.

Backspace: left swipe gesture while in typing mode removes last letter. Letter plays a "dissolve" animation (opacity 0 → scale 0, 150ms).

### 3.4 Ghost Text Prediction

**Visual:**
Typed so far: `ap` rendered solid (--bone, full opacity)  
Prediction: `[ple]` rendered immediately after, same font/size, --ghost color (#7A7A9A), opacity 0.35, slight italic slant (transform)

This looks like: **ap**`ple` where the `ple` is barely visible.

**Prediction tiers:**

Tier 1 — Local Trie (instant, zero latency):
```typescript
// lib/typing/localDictionary.ts
// Build a trie from a curated 5000-word English dictionary (bundled as JSON, ~40KB)
// On each keystroke: query trie for top prediction
// Returns: string (most likely completion) or null
```

Tier 2 — Groq API (contextual, async):
```typescript
// lib/typing/contextPredictor.ts
// Sends: full sentence typed so far + current partial word
// Model: llama3-8b-8192 (Groq free tier)
// Prompt: "Complete only the last word in this sentence. Return only the completed word, nothing else: '{sentence}'"
// On response: update ghost text if still on same partial word
// Debounce: only fires after 400ms of no new keypresses
// Abort: if user types new character before response arrives, cancel request
```

Ghost text updates in real-time from Tier 1. Quietly upgrades to Tier 2 result when it arrives.

**Acceptance gesture:**
- Swipe right (index finger extended, fast rightward motion) → ghost word accepted, letters fill in with "snap" animation: ghost color transitions to --bone over 200ms, opacity 0.35 → 1.0
- Continue typing (any key press) → ghost rejected silently, new ghost generated

**Alternate predictions:**
- Swipe up: cycle to next prediction (up to 3 alternatives from Trie)
- Ghost text briefly shows the new prediction with a quick crossfade (150ms)

### 3.5 Env Variable
```
NEXT_PUBLIC_GROQ_API_KEY=your_key_here
```
Add to `.env.local`. Add to Vercel environment variables. Groq free tier is sufficient for Phase 2.

---

## 4. Voice Typography

### 4.1 Overview

User speaks. Their words appear in 3D space. The way they speak shapes how those words look — volume controls size, intensity controls weight, speech rhythm controls letter appearance timing. The voice isn't just input. It is direction.

### 4.2 Audio Setup

```typescript
// lib/voice/audioAnalyser.ts
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 256
const source = audioContext.createMediaStreamSource(stream)
source.connect(analyser)

// Per-frame: read RMS amplitude
const dataArray = new Uint8Array(analyser.frequencyBinCount)
analyser.getByteFrequencyData(dataArray)
const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length)
```

Camera audio and system audio must be separate. Voice recognition uses `SpeechRecognition` API. Audio analyser reads raw amplitude. These are two separate streams.

### 4.3 Speech Recognition

```typescript
// lib/voice/speechRecognition.ts
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.continuous = true
recognition.interimResults = true   // get partial results while speaking
recognition.lang = 'en-US'
```

On interim result: show ghost text of current spoken word (same ghost system as air typing)
On final result: commit word(s) to 3D scene with full styling

### 4.4 Volume → Typography Mapping

Per word, at the moment it is finalized:

```
RMS amplitude at word-end moment → font size:
  RMS 0–20   → size 0.06m  (whisper)
  RMS 20–60  → size 0.10m  (normal)  
  RMS 60–100 → size 0.16m  (raised voice)
  RMS 100+   → size 0.26m  (loud)
  RMS 180+   → size 0.45m  (shout/scream)
```

Peak amplitude during word (not just end moment) is used — so a word screamed and then trailed off still reads as screamed.

Additionally:
```
Low RMS (whisper):    font weight thin, letter-spacing +0.04em
Normal RMS:           font weight regular, letter-spacing default  
High RMS:             font weight bold equivalent (emissive intensity +0.4)
Scream:               full emissive, slight chromatic aberration shader effect on letters
                      screen briefly shakes (camera shake: 0.02m random offset, 3 frames)
```

**The Avengers example:**
User says "Avengers" (normal voice) → 0.10m letters, regular weight, bone color  
User screams "ASSEMBLE" → 0.45m letters, full emissive, screen shake, "AVENGERS" automatically repositions (scales down to 0.06m, shifts left) to make room for "ASSEMBLE" dominating the canvas

This repositioning logic:
- On new large word incoming: check if it overlaps existing words
- If yes: push existing words outward (lerp their position away from center over 400ms)
- New dominant word lands at center

### 4.5 Voice Mode Activation

Voice typing is a separate mode from air typing. User doesn't do both simultaneously.

Mode switcher: two small icons in bottom-left corner (only visible on hover):
- Keyboard icon → air typing mode
- Microphone icon → voice mode

Active mode: icon is --pulse colored. Inactive: --muted.

Default mode on first load: neither active. Both off. User activates by hovering and clicking.

---

## 5. Word Theme System

### 5.1 Overview

When a trigger word is typed or spoken, the word's 3D text transforms into a themed visual style. The transformation is the moment — it should feel like a reveal.

### 5.2 Trigger Words — Phase 2 Launch Set (10 themes)

| Trigger Word | Theme Name | Visual Treatment |
|---|---|---|
| `gossip` | Gossip Girl | Didone serif (load via FontLoader), gold color (#C9A84C), italic, "XOXO" particle trail floats off the word |
| `assemble` | Avengers | Heavy slab font, deep red → silver gradient, scale pulse on land, electric spark particles |
| `spell` | Wizardry | Uncial font style, deep purple (#5B2D8E), floating ink droplets, parchment glow behind word |
| `fire` | Inferno | Letters combust — each letter gains upward orange-red particle stream, slight char at base |
| `love` | Romance | Thin cursive style, rose pink (#E8739A), small hearts (♥ Unicode, 8px, --pulse) float off and fade |
| `glitch` | Corrupted | Letters randomly swap characters, RGB channel offset shader, flicker at 12fps |
| `ghost` | Phantom | Letters go translucent (opacity 0.2), slight float up-down oscillation, faint echo copies behind them |
| `ocean` | Depths | Teal blue color, letters slowly wave (sinusoidal Y offset per letter, staggered phase), bubble particles |
| `king` | Throne | Bold condensed, gold with crown emoji (👑) appearing above the word, royal purple shadow |
| `chaos` | Entropy | Each letter gets random rotation, random size (±40%), random drift velocity, slowly disperses |

### 5.3 Theme Application Logic

```typescript
// lib/themes/wordThemes.ts
type WordTheme = {
  triggerId: string
  fontStyle: 'serif' | 'slab' | 'cursive' | 'condensed' | 'default'
  color: string
  emissiveIntensity: number
  particleEffect: ParticleEffectType | null
  ongoingAnimation: AnimationCallback | null
  transformDuration: number  // ms
}

// On word commit (typed or spoken):
// 1. Normalize word to lowercase, strip punctuation
// 2. Check against triggerWords map
// 3. If match: play theme transition
//    - Current letters play exit animation (scale down 200ms)
//    - Theme font replaces them (scale up 250ms with slight overshoot)
//    - Color transitions over 300ms
//    - Particle effect fires immediately
// 4. If no match: standard rendering
```

Theme transition should feel like the word "became" something. Not just recolored — transformed.

### 5.4 Pre-loading Themes

The 10 theme fonts are loaded at app init in the background (not blocking). Until loaded, trigger words use the default font with only color/animation transforms. This means no blank moment if user types a trigger word before fonts finish loading.

Progress tracked per font in a `Map<string, boolean>`. On theme trigger, check if font loaded. If not: apply color + particles only, add font on next trigger of same word.

---

## 6. New Materials: Strings and Sticks

### 6.1 Strings

A string object is a chain of connected physics bodies simulating a flexible rope/yarn.

**Visual:** `THREE.TubeGeometry` following a catenary curve. Color is user-selectable at creation (cycle through 5 preset colors with a thumb-up gesture during draw).

Colors: Electric Blue #4A9EFF, Coral #FF6B6B, Mint #3DFFA0, Gold #F5C842, Soft Purple #A78BFA

**Physics:** 10 Rapier rigid bodies connected by `SphericalJointParams`. Each body: small sphere collider, low mass, high damping. Chain hangs realistically under gravity. Endpoints fixed to last interaction point or free-hanging.

**Interactions:**
- Grab one end: hold and wave → string trails behind hand like a ribbon
- Grab middle: string forms a V shape from gravity
- Throw: string flies through air, drapes over objects on contact
- Punch: string whips away, oscillates
- Two-hand pull: string goes taut, snaps if pulled beyond 3× natural length → two shorter strings spawn

**Creation:** Draw a line (not closed shape). System detects non-closed path → creates string. Default length = drawn path length.

### 6.2 Sticks

A stick object is a rigid rod that can be joined with other sticks at endpoints.

**Visual:** `THREE.CylinderGeometry`, radius 0.012m. Color: warm bone white (#E8E4D8) with a slight wood-grain procedural texture in the shader (just noise — no actual texture file needed).

**Physics:** Single Rapier rigid body, `CuboidCollider` (elongated). Medium mass, medium restitution (0.4).

**Interactions:**
- Grab anywhere on stick: pick up and reposition
- Throw: flies and tumbles with realistic angular momentum
- Punch: whips away, rolls on floor
- Two-hand grab (each hand grabs an end): bend — apply torques at both endpoints. Stick has a "bend limit" — beyond ~30° it snaps into two shorter sticks

**Stick joining:**
- Bring two sticks close to each other (endpoint within 0.04m of another endpoint) → they snap together
- Joint shown as a small sphere node at connection point (--clay color, 0.02m radius)
- Users can build scaffold structures: this is a slow-burn interaction, discovered not taught
- Structures have emergent physics — a badly balanced frame will topple

**Creation:** Draw a straight line (non-curved path, less than 30° total arc). System detects straight path → creates stick. Length = drawn path length, min 0.1m, max 1.5m.

**How system distinguishes drawn shapes:**
- Closed path → clay ball
- Open + curved path → string
- Open + straight path → stick

---

## 7. PDF Export

On share button click, user now sees two options (replaces direct share in Phase 1):

```
[SHARE AS IMAGE]    [SHARE AS PDF]    [COPY LINK — disabled, Phase 3]
```

Displayed as three ghost buttons in a row, bottom-center, appearing on share click.
Style: Bebas Neue, 12px, --fog, 1px --border border. Active options: hover brings to --bone + --pulse border.

**PDF generation (client-side, no server):**

```typescript
// Using: jspdf (npm install jspdf)
import jsPDF from 'jspdf'

// 1. Capture Three.js canvas as base64 PNG (same as image share)
// 2. Create PDF: A4 landscape
// 3. Add image centered, maintaining aspect ratio with padding
// 4. Add footer: "Made with VANTA — vanta.vercel.app" — small, right-aligned
// 5. Save: doc.save('vanta-scene.pdf')
```

No VANTA branding beyond the footer line. The art is the user's — not ours.

New dependency:
```
npm install jspdf
```

---

## 8. Updated File Structure (additions to Phase 1)

```
components/
├── onboarding/
│   ├── HintSystem.tsx        # Contextual floating hints
│   ├── TutorialOverlay.tsx   # Full-screen guided walkthrough
│   └── ModeToggle.tsx        # Keyboard/mic mode switcher icons
├── typing/
│   ├── VirtualKeyboard.tsx   # 3D keyboard in Three.js scene
│   ├── LetterRenderer.tsx    # 3D TextGeometry letter management
│   └── GhostText.tsx         # Ghost prediction overlay on typed text
├── voice/
│   ├── VoiceListener.tsx     # SpeechRecognition + AudioAnalyser setup
│   └── VolumeMapper.tsx      # RMS → typography property mapping
├── themes/
│   ├── WordThemeEngine.tsx   # Trigger detection + theme application
│   └── themes/               # One file per theme (10 files)
├── materials/
│   ├── StringObject.tsx      # String physics + visual
│   └── StickObject.tsx       # Stick physics + visual
└── share/
    └── ShareSheet.tsx        # Updated: image + PDF options

lib/
├── onboarding/
│   └── userState.ts
├── typing/
│   ├── trieBuilder.ts        # Build trie from dictionary JSON
│   ├── localDictionary.ts    # Trie query interface
│   ├── contextPredictor.ts   # Groq API call with abort
│   └── dictionary.json       # 5000-word curated list (~40KB)
├── voice/
│   ├── audioAnalyser.ts
│   └── speechRecognition.ts
├── themes/
│   └── wordThemes.ts         # Theme definitions map
└── physics/
    ├── defaultRoom.ts        # Auto-initialized room (moved from RoomBuilder)
    ├── stringBody.ts         # Verlet chain physics
    └── stickBody.ts          # Stick + joint physics
```

---

## 9. Design Notes for Phase 2

### 9.1 Mode Indicator Updates

Bottom-center mode label (from Phase 1) now shows:

| State | Label |
|---|---|
| Default (no mode) | "READY" |
| Air typing active | "AIR TYPE" |
| Voice active | "LISTENING" |
| Object selected | "SELECTED" |
| Tutorial active | "TUTORIAL" |
| Drawing path | "DRAWING" |

All: Bebas Neue, 14px, --fog, opacity 0.5. Active modes: opacity 0.9, --pulse color.

### 9.2 Material Selector

When user is about to draw (motion toward drawing detected — slow pinch drag):
Three small material icons appear near the drawing hand:
- Circle (clay) — --clay color
- Wave line (string) — --pulse color  
- Straight line (stick) — --bone color

User continues drawing in the direction of their chosen material to select it. Or just starts drawing and system auto-detects shape.

Icons: 18px SVG, ghost opacity (0.4) until hand moves toward one, then that one highlights.

### 9.3 Ghost Text Visual Consistency

Air typing ghost and voice ghost use identical visual treatment — same color (--ghost), same opacity (0.35), same italic slant. This consistency makes the system feel unified.

---

## 10. Performance Targets (Phase 2)

| Metric | Target |
|---|---|
| FPS with all systems active | ≥28fps (slight budget used by new systems) |
| Groq prediction latency | <800ms (acceptable ghost text upgrade time) |
| Speech recognition lag | <300ms to interim result |
| Theme transition | 60fps during animation (GPU-bound, not CPU) |
| Trie query time | <1ms per keystroke |

If FPS drops below 24: auto-disable particle effects (not physics, not tracking). Never sacrifice interaction for visuals.

---

## 11. Done-When Conditions (Phase 2)

- [ ] **P2.0** Phase 1 room builder fully removed. Default room auto-initializes silently. Physics works identically.
- [ ] **P2.1** New user sees first hint ("Pinch to place") within 3s of hands being detected. Hint dismisses on pinch action.
- [ ] **P2.2** All 5 hints shown in correct order, each dismissed by correct action. None appear to returning users.
- [ ] **P2.3** Tutorial button visible. Tutorial overlay opens, guides through 7 steps via gesture detection. Completion saves to localStorage.
- [ ] **P2.4** Keyboard summoned by open palm (1.2s hold). Keys visible in 3D space at correct position and scale.
- [ ] **P2.5** Pinching a key registers the letter. Letter appears in 3D space above keyboard. Backspace removes last letter.
- [ ] **P2.6** Trie prediction shows ghost text within 16ms of keystroke. Ghost is visually correct (dim, italic, correct position).
- [ ] **P2.7** Groq prediction upgrades ghost text within 800ms. Upgrade is seamless (no flash or jump).
- [ ] **P2.8** Swipe-right accepts ghost word. Letters fill in with snap animation.
- [ ] **P2.9** Voice mode activates on microphone icon click. Spoken words appear in 3D space.
- [ ] **P2.10** Whisper vs scream produces clearly different font sizes (at least 3× difference in rendered size).
- [ ] **P2.11** "ASSEMBLE" screamed after "Avengers" typed normally: ASSEMBLE dominates, Avengers repositions.
- [ ] **P2.12** All 10 trigger words tested: each applies correct theme, color, font, particle effect.
- [ ] **P2.13** String creation: draw open curved path → string object with correct physics (hangs, drapes, whips).
- [ ] **P2.14** Stick creation: draw straight path → stick with correct physics (tumbles, angular momentum on throw).
- [ ] **P2.15** Two sticks brought together at endpoints snap into a joint. Structure has emergent physics.
- [ ] **P2.16** Share sheet shows two options (Image, PDF). Both produce correct output.
- [ ] **P2.17** PDF export: correct A4 landscape, scene image centered, footer present.
- [ ] **P2.18** Mode indicator updates correctly for all states.
- [ ] **P2.19** FPS ≥28 with voice active + 3 objects + typing mode simultaneously.

---

## 12. Commit Sequence

```
fix(room): remove room builder flow, auto-initialize default room
feat(onboarding): contextual hint system with localStorage tracking
feat(onboarding): tutorial overlay with gesture-based step progression
feat(ui): mode toggle for air typing and voice modes
feat(typing): virtual 3D keyboard with summon/dismiss gesture
feat(typing): letter rendering in 3D space with TextGeometry
feat(typing): local trie dictionary and ghost text prediction
feat(typing): groq contextual prediction with abort signal
feat(typing): swipe-right word acceptance animation
feat(voice): speech recognition integration with interim results
feat(voice): audio analyser and rms to typography mapping
feat(voice): dominant word repositioning system
feat(themes): word theme engine with trigger detection
feat(themes): all 10 theme implementations
feat(materials): string object with verlet chain physics
feat(materials): stick object with snap joint system
feat(share): updated share sheet with image and pdf options
feat(share): pdf export via jspdf
```

---

## 13. Env Variables

```bash
# .env.local
NEXT_PUBLIC_GROQ_API_KEY=your_groq_key_here
```

Groq free tier: 14,400 requests/day, 30 requests/minute. For Phase 2 this is sufficient — predictions are debounced to fire max once per 400ms of typing pause.

---

*VANTA Phase 2 — "Shape the air."*  
*The space already exists. Now give it something to say.*
