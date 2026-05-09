# VANTA — Phase 1 Full Build Prompt
**Temp Name:** VANTA  
**Slogan:** "Shape the air."  
**Target:** Desktop web only (Chrome/Edge, webcam required)  
**Deploy:** Vercel (free tier)  
**Stack:** Next.js 14 (App Router), TypeScript, Three.js, Rapier WASM, MediaPipe Hands, Tailwind CSS  

---

## 0. Agent Rules (Read Before Any Code)

- One commit per feature. Format: `type(scope): description`
- Confirm every phase's "done when" condition before proceeding to the next
- Never batch changes across phases
- Free tier only — no paid APIs, no credit card services
- Ask before making architectural decisions not covered in this document
- Design is the product. Every UI decision must match the design system exactly.

---

## 1. Product Overview

VANTA is a browser-based AR physics sandbox. Users open their webcam, define a 3D room with hand gestures, create clay objects (by drawing in air or importing), interact with them using real physics (squeeze, throw, punch, two-hand stretch), and watch objects collide with walls and return. No installation. No sign-in. Pure experience.

Phase 1 is purely frontend — no backend, no auth, no database.

---

## 2. Design System (NON-NEGOTIABLE)

This is the most critical section. Every pixel must match this system.

### 2.1 Philosophy
**Aesthetic direction: Spatial Void**  
The UI is almost invisible. The space is everything. VANTA's interface should feel like you are floating in deep space, reaching into it with your hands. The 3D canvas is the hero — UI chrome is minimal, dark, and purposeful. Nothing should compete with the experience.

When people first open VANTA, they should feel like they stepped into something, not logged into something.

### 2.2 Color Palette
```
--void:        #050507   /* near-black background, slight blue undertone */
--surface:     #0D0D12   /* card/panel backgrounds */
--border:      #1A1A24   /* subtle borders */
--muted:       #2A2A38   /* inactive elements */
--fog:         #4A4A6A   /* secondary text, hints */
--ghost:       #7A7A9A   /* ghost text, predictions */
--bone:        #E8E8F0   /* primary text */
--pure:        #FFFFFF   /* highlight text only */

/* Accent — clay material color, warm */
--clay:        #C17A4A   /* warm terracotta */
--clay-light:  #E8A87C   /* highlight on clay */
--clay-deep:   #7A3F1E   /* shadow on clay */

/* System accents */
--pulse:       #4AF0C8   /* active/tracking state — mint */
--warn:        #F0824A   /* warning, boundary exceeded */
--snap:        #FFFFFF   /* snap/confirm flash */
```

### 2.3 Typography
```
Display font:    'Bebas Neue' (Google Fonts) — headlines, feature labels, room dimensions
Body font:       'DM Sans' (Google Fonts) — UI copy, instructions, tooltips
Mono font:       'JetBrains Mono' (Google Fonts) — technical values, coordinates
```

Usage rules:
- No font below 11px anywhere
- Headlines: Bebas Neue, tracked wide (letter-spacing: 0.08em)
- All UI labels: DM Sans, weight 300-400 only. Never bold UI labels.
- Dimension readouts: JetBrains Mono

### 2.4 UI Principles
- **Invisible until needed.** Controls fade in on hover near edges. Default state = blank dark canvas + webcam feed + 3D scene.
- **No floating panels.** Everything is edge-anchored or gesture-triggered.
- **Micro-feedback everywhere.** Every gesture recognition gets a subtle visual pulse. Not loud. Present.
- **No modals.** No popups. No overlays that block the experience.
- **Status lives at the bottom edge.** A single 24px strip at bottom center shows current mode text in Bebas Neue, fog color, low opacity.

### 2.5 The Canvas Layout
```
Full viewport: 100vw × 100vh
├── WebGL canvas (Three.js): absolute, fills entire viewport, z-index: 0
├── Video feed (webcam): absolute, fills viewport, z-index: 1, opacity: 0.15, mix-blend-mode: screen
├── Landmark overlay (canvas 2D): absolute, fills viewport, z-index: 2
├── UI layer: absolute, fills viewport, z-index: 3, pointer-events: none for non-interactive parts
│   ├── Top-left: VANTA wordmark (Bebas Neue, 18px, bone, opacity 0.4)
│   ├── Top-right: Connection status dot + "TRACKING" label
│   ├── Bottom-center: Mode label strip
│   └── Bottom-right: Share button (appears only when objects exist)
```

### 2.6 Hand Landmark Rendering
- 21 landmarks per hand rendered as **2px radius circles**, color `--pulse`, opacity 0.6
- Connections between landmarks rendered as **1px lines**, color `--pulse`, opacity 0.3
- On pinch detection: landmark 4 (thumb tip) and 8 (index tip) flash white for 80ms
- No labels on landmarks. No numbers. Clean.

### 2.7 Room Wireframe Visual
When room is being defined:
- Room wireframe rendered in Three.js as `LineSegments`
- Color: `--pulse` (#4AF0C8), opacity 0.2
- Animated: edges pulse slowly (opacity 0.1 → 0.3, 2s loop)
- Dimension labels float at each axis midpoint: JetBrains Mono, 13px, `--ghost`

After room is confirmed:
- Wireframe fades to opacity 0.04 — barely visible, like a ghost of the space
- Floor plane renders as a very subtle grid: 0.5px lines, `--border` color, 1m spacing

### 2.8 Loading / Permission Screen
Full viewport. Background `--void`. Centered content:
```
[VANTA wordmark — Bebas Neue, 72px, bone, letter-spacing 0.12em]
[Slogan — DM Sans, 16px, fog, weight 300]
[2px horizontal rule — muted, 120px wide, centered]
[Status text — DM Sans, 13px, ghost — "Requesting camera access..."]
```
Camera icon: simple SVG, 24px, fog color, slow pulse animation.
No buttons. Access is requested automatically on load.

---

## 3. Tech Stack Details

### 3.1 Dependencies
```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "18.x",
    "react-dom": "18.x",
    "three": "^0.165.0",
    "@dimforge/rapier3d-compat": "^0.12.0",
    "@mediapipe/hands": "^0.4.1675469240",
    "@mediapipe/camera_utils": "^0.3.1675466862",
    "tailwindcss": "^3.4.x",
    "typescript": "^5.x"
  }
}
```

### 3.2 Why These Choices
- **Rapier WASM**: Only physics engine fast enough for real-time soft body + rigid body on mid-range laptops. WASM runs off the main thread concern — use it synchronously in the render loop for Phase 1.
- **MediaPipe Hands**: Runs entirely in browser, no server round-trip, 21 landmarks at 30fps on integrated GPU.
- **Three.js r165+**: GLTFExporter built in (needed Phase 3), good WebGL2 support, mature ecosystem.
- **No physics worker in Phase 1**: Keep it simple. If frame drops become an issue, worker migration is Phase 2 performance task.

---

## 4. File Structure

```
vanta/
├── app/
│   ├── layout.tsx          # Root layout, font imports, metadata
│   ├── page.tsx            # Entry — renders <VantaApp />
│   └── globals.css         # CSS variables, reset, font declarations
├── components/
│   ├── VantaApp.tsx         # Root orchestrator, manages all state
│   ├── canvas/
│   │   ├── ThreeScene.tsx   # Three.js scene init, render loop, ref-based
│   │   ├── PhysicsWorld.tsx # Rapier world init, step, body management
│   │   └── ClayObject.tsx   # Clay mesh + physics body pair, deformation logic
│   ├── tracking/
│   │   ├── HandTracker.tsx  # MediaPipe Hands init, landmark stream
│   │   ├── GestureEngine.tsx # Gesture classification from landmarks
│   │   └── LandmarkOverlay.tsx # 2D canvas overlay rendering landmarks
│   ├── room/
│   │   ├── RoomBuilder.tsx  # Room definition flow, gesture-based sizing
│   │   └── RoomPhysics.tsx  # Six wall colliders, floor grid visual
│   ├── ui/
│   │   ├── LoadScreen.tsx   # Camera permission + loading state
│   │   ├── ModeLabel.tsx    # Bottom-center mode indicator
│   │   ├── TrackingStatus.tsx # Top-right status dot
│   │   └── ShareButton.tsx  # Bottom-right share trigger
│   └── share/
│       └── SnapshotShare.tsx # Canvas capture + share sheet
├── hooks/
│   ├── useHandTracking.ts   # MediaPipe hook, returns landmark stream
│   ├── useGestures.ts       # Processes landmarks → gesture events
│   ├── usePhysicsWorld.ts   # Rapier world lifecycle hook
│   └── useThreeScene.ts     # Three.js scene/camera/renderer hook
├── lib/
│   ├── gestures/
│   │   ├── pinch.ts         # Pinch detection (landmarks 4+8 distance)
│   │   ├── grip.ts          # Full grip (all fingers curled)
│   │   ├── palm.ts          # Open palm detection
│   │   ├── twoHand.ts       # Two-hand gesture combos
│   │   └── throw.ts         # Throw detection (velocity vector on release)
│   ├── physics/
│   │   ├── clayBody.ts      # Clay soft-body approximation using compound shapes
│   │   ├── roomColliders.ts # Six-wall collider setup
│   │   └── forceApply.ts    # Map hand position delta → physics force
│   ├── materials/
│   │   └── clayMaterial.ts  # Three.js MeshStandardMaterial config for clay
│   └── utils/
│       ├── coordinates.ts   # Screen ↔ 3D world coordinate mapping
│       └── snapshot.ts      # Canvas merge + blob export
├── types/
│   └── index.ts             # Shared TypeScript types
└── public/
    └── fonts/               # Self-hosted fallbacks if needed
```

---

## 5. Feature Specifications

### 5.1 App Bootstrap Sequence
```
1. Show LoadScreen (permission state)
2. Request camera via getUserMedia({ video: { width: 1280, height: 720 } })
3. On grant → initialize MediaPipe Hands
4. On first landmark detection → hide LoadScreen (fade 600ms)
5. Show RoomBuilder flow
6. On room confirm → show full experience
```

Error states:
- Camera denied → show clear message: "VANTA needs your camera to work. No data is stored or transmitted." with retry button.
- MediaPipe load fail → "Couldn't load hand tracking. Try refreshing."

### 5.2 Hand Tracking (useHandTracking.ts)
```typescript
// MediaPipe Hands config
{
  maxNumHands: 2,
  modelComplexity: 1,       // 0=lite, 1=full — use full for accuracy
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.6
}
```
- Run at camera FPS (target 30fps)
- Output: `HandLandmarks[]` — array of up to 2 hands, each 21 `{x, y, z}` normalized points
- x, y are normalized 0-1 relative to video frame. z is relative depth.
- Mirror the video feed horizontally (selfie mode). Apply same mirror to landmark x: `mirroredX = 1 - x`

### 5.3 Gesture Engine (useGestures.ts)

**Gestures to detect in Phase 1:**

| Gesture | Detection Logic | Action |
|---|---|---|
| Pinch | Distance(landmark4, landmark8) < 0.04 for 80ms | Select / place object |
| Grip | All finger tips within 0.08 of palm center | Grab held object |
| Open Palm | All fingers extended, spread | Release / throw |
| Two-hand Grip | Both hands gripping same object | Stretch mode |
| Punch | Grip → rapid forward Z velocity > threshold | Punch force |
| Swipe Right | Index extended, fast rightward velocity | (Reserved Phase 2) |

All gestures use a **debounce + hold threshold** — no action fires on a single frame. Minimum 3 consecutive frames for any gesture state change.

Velocity calculation: delta position between current and previous frame × FPS. Store last 5 frames for smoothing.

### 5.4 Room Builder (RoomBuilder.tsx)

**Flow:**
```
State 1: GUIDE
  Show centered text (Bebas Neue, 32px):
  "SPREAD YOUR HANDS TO SET THE ROOM WIDTH"
  Animated hand icon below text.
  
State 2: WIDTH_SETTING
  Triggered when both hands detected
  Room width = distance between left wrist (landmark 0) and right wrist (landmark 0)
  Mapped: hand distance 0.3–0.9 normalized → room width 2m–8m
  Show live dimension readout: "WIDTH: 4.2M" — JetBrains Mono, bottom-center
  Room wireframe updates in real-time

State 3: HEIGHT_SETTING  
  Triggered when user pinches with right hand
  Right hand Y position maps to ceiling height: 1.5 normalized → 2m ceiling, 0.1 → 4m ceiling
  Show: "HEIGHT: 3.1M" readout

State 4: CONFIRM
  Open palm (both hands) for 1 second → confirm
  Confirmation: room wireframe flashes white once, then fades to ghost opacity
  Transition to main experience
```

Default/recommended room: 5m × 4m × 3m  
Minimum: 2m × 2m × 2m  
Maximum: 10m × 8m × 5m  

### 5.5 Physics World Setup (PhysicsWorld.tsx)

```typescript
// Rapier world
gravity: { x: 0, y: -9.81, z: 0 }
timestep: 1/60  // fixed timestep

// Six wall colliders (after room defined)
// Each wall: ColliderDesc.cuboid(halfWidth, halfHeight, 0.05)
// floor, ceiling, left, right, front, back
// All: restitution: 0.6, friction: 0.4
```

Physics step runs in the Three.js animation loop (requestAnimationFrame).  
After each step: sync Three.js mesh positions with Rapier rigid body positions.

### 5.6 Clay Object System (ClayObject.tsx)

**Clay approximation strategy (no true soft body in Phase 1):**  
True soft body physics in WASM is Phase 2. Phase 1 uses a **compound collider** approach that *looks* like clay deformation.

Clay object = 7 overlapping sphere colliders arranged in a cluster, connected to a central rigid body. When force is applied, spheres can shift position slightly within their joint limits — giving a "squish" appearance.

Visually: single `THREE.SphereGeometry` with a custom `MeshStandardMaterial`:
```typescript
{
  color: '#C17A4A',        // --clay
  roughness: 0.85,
  metalness: 0.0,
  envMapIntensity: 0.3,
}
```

On squeeze (grip gesture with hand overlapping object):
- Scale object by 0.85 on grip axis over 150ms (CSS-style spring easing)
- On release: spring back to original scale over 400ms
- Play subtle "squish" particle burst: 8 tiny clay-colored dots emit from contact point, fade in 300ms

On punch:
- Apply impulse force in direction of hand velocity vector
- Object velocity capped at 15 m/s
- On wall collision: brief squash deformation (scale 0.7 on collision axis, spring back 200ms)

On two-hand stretch:
- While both hands grip: scale object uniformly based on hand separation distance
- Release: if stretched >2.5x original size, object "tears" — current object destroys, two smaller spheres spawn with outward velocity
- If <2.5x: spring back

**Object creation (Phase 1 — draw mode only):**  
User pinches and draws a closed shape in air with one finger.  
Path is tracked as 2D normalized coords.  
On shape close (end point within 0.05 of start point):  
→ Bounding box calculated → sphere of diameter = bounding box diagonal / 2  
→ Clay sphere spawns at drawing centroid  
→ Brief "materialize" animation: scale from 0 → 1 over 300ms with slight overshoot (spring)

### 5.7 Coordinate Mapping (coordinates.ts)

MediaPipe landmarks are normalized screen-space (0-1).  
Three.js scene uses world-space meters.  

```typescript
// Map normalized landmark to 3D world position
function landmarkToWorld(lm: {x, y, z}, room: RoomDimensions, camera: THREE.Camera): THREE.Vector3 {
  // x: 0→1 maps to -roomWidth/2 → roomWidth/2
  // y: 0→1 maps to roomHeight → 0 (inverted, top of screen = top of room)
  // z: use landmark.z as relative depth, scaled by room depth factor
}
```

The user's hand space maps to the front half of the room (z: 0 → roomDepth/2).  
Objects can travel into the back half via physics forces.

### 5.8 Share System (SnapshotShare.tsx)

On share button click:
1. Pause physics world (one frame freeze)
2. Capture Three.js WebGL canvas: `renderer.domElement.toDataURL('image/png')`
3. Overlay VANTA watermark bottom-right: "VANTA — vanta.vercel.app" — DM Sans, 12px, bone, 50% opacity
4. Trigger native Web Share API: `navigator.share({ files: [imageFile], title: 'Made with VANTA' })`
5. Fallback (if Share API unavailable): download as `vanta-scene.png`
6. Resume physics

Share button appearance:
- Only visible when ≥1 object exists in scene
- Bottom-right corner, 12px margin from edges
- Icon: simple share SVG (24px, bone)
- Label: "SHARE" — Bebas Neue, 11px, letter-spacing 0.1em
- Hover: border appears (1px, --pulse), icon color shifts to --pulse
- No background. Ghost until hovered.

---

## 6. Performance Targets

| Metric | Target |
|---|---|
| FPS | ≥30fps on mid-range laptop (Intel Iris Xe or equivalent) |
| Hand tracking latency | <50ms landmark to render |
| Physics timestep | Fixed 60Hz, visual interpolation if needed |
| Initial load | <4s on fast connection |
| MediaPipe model load | Show progress, don't block UI |

Optimizations:
- Three.js renderer: `antialias: false` on <1440p displays, `powerPreference: 'high-performance'`
- Rapier: only active rigid bodies simulated (sleeping bodies paused)
- Landmark overlay: separate 2D canvas, not WebGL — cheaper to clear/redraw
- MediaPipe: run on `<video>` element hidden off-screen, not displayed directly

---

## 7. Responsive / Browser Notes

- **Supported:** Chrome 112+, Edge 112+ on desktop/laptop
- **Not supported:** Firefox (WebGL2 quirks with MediaPipe), Safari (camera API issues), any mobile browser
- On unsupported browser: show static page — VANTA wordmark, slogan, "Best experienced in Chrome or Edge on a laptop." No error. No apology. Just clarity.
- Minimum viewport: 1024px wide. Below that: show same unsupported message.

---

## 8. No-Backend Constraints

- Zero API calls in Phase 1
- No analytics, no tracking, no cookies
- Camera feed: never leaves the browser. MediaPipe runs entirely client-side.
- Add a single line to the loading screen (small, fog color): "Your camera never leaves your device."

---

## 9. Next.js Config Notes

```javascript
// next.config.js
const nextConfig = {
  webpack: (config) => {
    // Required for Rapier WASM
    config.experiments = { asyncWebAssembly: true, layers: true }
    return config
  }
}
```

Rapier must be initialized asynchronously:
```typescript
import('@dimforge/rapier3d-compat').then(RAPIER => {
  await RAPIER.init()
  // create world
})
```

MediaPipe packages load via CDN script tags in `layout.tsx` — do not bundle them through webpack (too large, causes issues).

---

## 10. Done-When Conditions (Phase 1)

Agent must confirm each before proceeding to next:

- [ ] **P1.1** Camera permission flow works. Denial shows correct message. Grant shows loading → experience.
- [ ] **P1.2** Hand landmarks render correctly on overlay canvas, mirrored, at 30fps.
- [ ] **P1.3** All 6 gestures detected correctly with debounce. Console logs gesture name on detection.
- [ ] **P1.4** Room builder flow completes: width → height → confirm. Room wireframe visible and matches dimensions.
- [ ] **P1.5** Room physics colliders active. A spawned sphere falls, hits floor, bounces.
- [ ] **P1.6** Draw gesture creates a clay sphere at correct world position.
- [ ] **P1.7** Clay ball can be grabbed (grip) and thrown (open palm release with velocity).
- [ ] **P1.8** Thrown ball collides with at least one wall and returns toward user with correct restitution.
- [ ] **P1.9** Squeeze deformation: grip on ball triggers scale squish, releases with spring-back.
- [ ] **P1.10** Two-hand stretch: grab from both sides, object scales. Tear at >2.5x.
- [ ] **P1.11** Punch: rapid Z-forward velocity applies impulse. Ball moves convincingly.
- [ ] **P1.12** Share: button appears when object exists. Click captures canvas, triggers share/download.
- [ ] **P1.13** Unsupported browser/mobile shows correct fallback page.
- [ ] **P1.14** 30fps maintained with one clay object and both hands tracked simultaneously on test machine.
- [ ] **P1.15** Design system fully implemented: correct colors, fonts, layout, UI chrome opacity.

---

## 11. Commit Sequence

```
feat(bootstrap): camera permission flow and loading screen
feat(tracking): mediapipe hands integration and landmark overlay
feat(gestures): gesture engine with pinch, grip, palm, two-hand detection
feat(room): room builder flow with gesture-based dimension setting
feat(physics): rapier world init with six-wall room colliders
feat(clay): clay object creation via air drawing
feat(interact): grab, throw, squeeze interactions
feat(interact): two-hand stretch and tear mechanic
feat(interact): punch impulse force application
feat(share): snapshot capture and web share api integration
feat(compat): unsupported browser and mobile fallback page
perf(render): performance audit and optimization pass
```

---

## 12. Vercel Deployment

- Framework preset: Next.js
- Build command: `next build`
- Output directory: `.next`
- Environment variables: none in Phase 1
- WASM files: ensure `Content-Type: application/wasm` header — add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*).wasm",
      "headers": [{ "key": "Content-Type", "value": "application/wasm" }]
    }
  ]
}
```

---

*VANTA Phase 1 — "Shape the air."*  
*Build the world. Physics does the rest.*
