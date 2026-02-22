# Backend Integration Plan — Session Planner Steps

## Overview

The Football Drill Planner is a graphical tool that lets a coach attach a step-by-step tactical plan to an existing **Session**. The session already exists in the backend (see `sessionSchema`). All we need to store is the collection of **planner steps** that belong to that session.

Each step contains:
1. **Step metadata** (title, objective, ground type, field type, dimensions) — set in `CreateStepPage`
2. **Canvas data** (pitch elements and drawn paths) — set in `DrillDesignerPage`

The cleanest approach is a **dedicated `SessionPlannerStep` collection** with `sessionId` as a foreign key. Steps are ordered by `stepNumber` (auto-incremented serial). Each step stores its entire canvas payload as a single embedded object so a single document fetch reconstructs the full designer state.

---

## 1. New Collection: `SessionPlannerStep`

### 1.1 Sub-Schemas

```js
// A single placed element on the pitch (player, equipment, shape, line, marker, icon)
const pitchElementSchema = new Schema(
  {
    instanceId: { type: Number, required: true },  // client-side timestamp id
    id:         { type: String, required: true },  // asset id e.g. 'player', 'cone', 'square'
    type: {
      type: String,
      enum: ['player', 'icon', 'shape', 'equipment', 'marker', 'line'],
      required: true,
    },
    x:        { type: Number, required: true },   // % position on pitch (0-100)
    y:        { type: Number, required: true },   // % position on pitch (0-100)
    width:    { type: Number },
    height:   { type: Number },
    rotation: { type: Number, default: 0 },
    color:    { type: String },
    label:    { type: String },
    isGK:     { type: Boolean, default: false },
    isDefender: { type: Boolean, default: false },
    icon:     { type: String },       // emoji for icon type (e.g. '⚽')
    variant:  { type: String },       // 'cone' | 'marker' | 'pole' | 'square' | 'circle' | 'rect' | ...
    dashed:   { type: Boolean, default: false },
    shaded:   { type: Boolean, default: false },
    fixedColor: { type: Boolean, default: false },
    // Line-specific
    points: [{ x: { type: Number }, y: { type: Number } }],
    lineStyle: { type: String, enum: ['solid', 'dotted', 'dribble'] },
    drawMode:  { type: String, enum: ['straight', 'freehand'] },
  },
  { _id: false }
);

// A freehand drawing path (legacy paths array kept separate from elements)
const drawingPathSchema = new Schema(
  {
    id:     { type: Number, required: true },
    points: [{ x: { type: Number }, y: { type: Number } }],
    color:  { type: String, required: true },
    dashed: { type: Boolean, default: false },
  },
  { _id: false }
);

// All canvas state for one step
const canvasDataSchema = new Schema(
  {
    elements: [pitchElementSchema],
    paths:    [drawingPathSchema],
  },
  { _id: false }
);
```

### 1.2 Main Step Schema

```js
const sessionPlannerStepSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID is required'],
      index: true,
    },

    stepNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // --- Step metadata (from CreateStepPage) ---
    title: {
      type: String,
      required: [true, 'Step title is required'],
      trim: true,
      maxlength: 200,
    },

    objective: {
      type: String,
      default: '',
    },

    groundType: {
      type: String,
      enum: ['full', 'half'],
      required: true,
      default: 'full',
    },

    fieldType: {
      type: String,
      enum: ['7v7', '11v11'],
      required: true,
      default: '7v7',
    },

    fieldMeasurement: {
      type: String,
      enum: ['default', 'custom'],
      required: true,
      default: 'default',
    },

    // Only present when fieldMeasurement === 'custom'
    unit:   { type: String, enum: ['meter', 'yard'] },
    width:  { type: Number, min: 1 },
    height: { type: Number, min: 1 },

    // --- Canvas data (from DrillDesignerPage) ---
    canvasData: {
      type: canvasDataSchema,
      default: () => ({ elements: [], paths: [] }),
    },
  },
  {
    strict: true,
    timestamps: true,
    versionKey: false,
  }
);

// Compound unique index: a session cannot have two steps with the same number
sessionPlannerStepSchema.index({ sessionId: 1, stepNumber: 1 }, { unique: true });
```

> **Why a separate collection instead of embedding in `sessionSchema`?**
> The session already has `sessionPlanner: { type: String }` as a placeholder. Keeping steps as a
> separate collection avoids giant session documents, allows independent pagination, and lets the 
> designer load/save steps without touching the session document at all.

---

## 2. Connecting to the Existing `sessionSchema`

The existing field `sessionPlanner: { type: String }` in `sessionSchema` is the hook point.
**No schema change needed.** We use `sessionId` as the FK in the new collection.

When the user opens the Session Planner tab in the Next.js app:
1. The frontend already knows `session._id` from the session detail page.
2. It passes `sessionId` to all planner-step API calls.

---

## 3. API Endpoints

All routes are prefixed under `/api/v1/sessions/:sessionId/planner-steps`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/sessions/:sessionId/planner-steps` | Fetch all steps for a session, sorted by `stepNumber` |
| `POST` | `/api/v1/sessions/:sessionId/planner-steps` | Create a new step (auto-assigns next `stepNumber`) |
| `GET` | `/api/v1/sessions/:sessionId/planner-steps/:stepId` | Fetch a single step by its `_id` |
| `PUT` | `/api/v1/sessions/:sessionId/planner-steps/:stepId` | Full update (metadata + canvasData) |
| `PATCH` | `/api/v1/sessions/:sessionId/planner-steps/:stepId/canvas` | Update only `canvasData` (called on Save from DrillDesignerPage) |
| `DELETE` | `/api/v1/sessions/:sessionId/planner-steps/:stepId` | Delete a step and re-sequence `stepNumber` for the rest |
| `PATCH` | `/api/v1/sessions/:sessionId/planner-steps/reorder` | Reorder steps (body: `[{ stepId, stepNumber }]`) |

### Auto-assigning `stepNumber` on Create

```js
// Inside the POST controller
const lastStep = await SessionPlannerStep
  .findOne({ sessionId })
  .sort({ stepNumber: -1 })
  .select('stepNumber');

const nextNumber = lastStep ? lastStep.stepNumber + 1 : 1;
const step = await SessionPlannerStep.create({ ...body, sessionId, stepNumber: nextNumber });
```

### Fetch All Steps (used to render `DrillStepsListPage` equivalent)

```js
// GET /api/v1/sessions/:sessionId/planner-steps
const steps = await SessionPlannerStep
  .find({ sessionId })
  .sort({ stepNumber: 1 })
  .select('-canvasData'); // omit heavy canvas blob from list view
```

> `canvasData` is excluded from list queries — only fetched when the user opens
> a specific step in the designer, keeping list payloads tiny.

### Fetch Single Step (opens DrillDesignerPage)

```js
// GET /api/v1/sessions/:sessionId/planner-steps/:stepId
const step = await SessionPlannerStep.findOne({ _id: stepId, sessionId });
// Returns full document including canvasData
```

### Save Canvas (called when user taps "Save" in the designer)

```js
// PATCH /api/v1/sessions/:sessionId/planner-steps/:stepId/canvas
// Body: { elements: [...], paths: [...] }
const step = await SessionPlannerStep.findOneAndUpdate(
  { _id: stepId, sessionId },
  { $set: { canvasData: req.body } },
  { new: true, runValidators: true }
);
```

---

## 4. Frontend Integration Flow (Next.js)

```
Session Detail Page
  └─ "Session Planner" tab
       ├─ GET /planner-steps  → renders step list (stepNumber, title, groundType, fieldType)
       ├─ "Create New Step" button
       │     └─ POST /planner-steps  (title, objective, groundType, fieldType, fieldMeasurement, …)
       │         → on success, navigate to DrillDesigner with returned _id
       │
       └─ click a step card
             └─ GET /planner-steps/:stepId  (full doc with canvasData)
                 → mount DrillDesignerPage with canvasData pre-loaded
                 → on "Save": PATCH /planner-steps/:stepId/canvas { elements, paths }
                 → on "Delete": DELETE /planner-steps/:stepId
```

### What the Next.js Planner Tab Already Has (from Session context)
- `session._id` → used as `sessionId`
- `session.title` → shown in the planner header
- `session.coachId` → for access control
- `session.ageGroupOrTeam` → for display
- `session.date`, `session.startTime`, `session.endTime` → shown alongside each step

### What the Planner Tab Needs from the New Collection
- Array of `SessionPlannerStep` sorted by `stepNumber`
- Full `canvasData` on demand per step

---

## 5. TypeScript Interfaces (Frontend)

```ts
// Matches the MongoDB document for list view
export interface PlannerStepSummary {
  _id: string;
  sessionId: string;
  stepNumber: number;
  title: string;
  objective?: string;
  groundType: 'full' | 'half';
  fieldType: '7v7' | '11v11';
  fieldMeasurement: 'default' | 'custom';
  unit?: 'meter' | 'yard';
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

// Extended version with canvas (single step fetch)
export interface PlannerStep extends PlannerStepSummary {
  canvasData: {
    elements: PitchElement[];
    paths: DrawingPath[];
  };
}

// These already exist in DrillDesignerPage.tsx
export interface PitchElement {
  instanceId: number;
  id: string;
  type: 'player' | 'icon' | 'shape' | 'equipment' | 'marker' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  label?: string;
  isGK?: boolean;
  isDefender?: boolean;
  icon?: string;
  variant?: string;
  dashed?: boolean;
  shaded?: boolean;
  fixedColor?: boolean;
  points?: { x: number; y: number }[];
  lineStyle?: 'solid' | 'dotted' | 'dribble';
  drawMode?: 'straight' | 'freehand';
}

export interface DrawingPath {
  id: number;
  points: { x: number; y: number }[];
  color: string;
  dashed: boolean;
}
```

---

## 6. Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| Separate collection, not embedded in `sessionSchema` | Avoids oversized session documents; canvas blobs can be MBs each |
| `stepNumber` as integer, not array index | Survives deletion and reordering; compound unique index prevents duplicates |
| `canvasData` excluded from list queries | List endpoint stays lightweight; canvas only loaded on demand |
| Single `canvasData` object per step | One document fetch reconstructs the entire designer — no N+1 queries |
| PATCH `/canvas` separate from PUT | Save from designer only touches canvas; step metadata edit is a separate UX |
| `sessionId` as FK with index | Efficient lookup of all steps for a session; enables cascade delete |

---

## 7. Cascade Delete

When a Session is deleted, all its planner steps should be cleaned up.

```js
// In the Session delete controller (or via a Mongoose pre-remove hook)
sessionSchema.pre('findOneAndDelete', async function () {
  const session = await this.model.findOne(this.getFilter());
  if (session) {
    await SessionPlannerStep.deleteMany({ sessionId: session._id });
  }
});
```

---

## 8. Validation Rules

- `sessionId`: must reference an existing, non-deleted Session
- `stepNumber`: auto-generated server-side; clients cannot set it manually on create
- `title`: required, max 200 chars
- `width` / `height`: required only when `fieldMeasurement === 'custom'`; validated as `> 0`
- `canvasData.elements[].x` and `y`: floats 0–100 (percentage positions)
- `canvasData.elements[].points`: only validated for non-empty when `type === 'line'`
- Max step count per session: recommend soft limit of **50 steps** at the API layer
