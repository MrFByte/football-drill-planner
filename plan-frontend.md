# Frontend Integration Plan — Session Planner in Next.js (Revised)

## Core Strategy: Embed as a Self-Contained Sub-App

Instead of restructuring every page into Next.js conventions, the drill planner is kept as a **self-contained React Router sub-application** and embedded whole inside the Next.js session detail page. When the user clicks the "Session Planner" tab, the Next.js page mounts the planner's `BrowserRouter` subtree at a catch-all route.

**Only one file changes its data layer: `DrillContext.tsx`.**
Everything else (all pages, components, routing, canvas logic) is copied as-is.

---

## 1. What Currently Exists (Standalone App)

### localStorage keys

| Key | Contents |
|-----|----------|
| `currentDrill` | Active drill object being edited |
| `allDrills` | All saved drills |

### Current data shape

```ts
Drill {
  id: string          // Date.now() — client-generated
  title: string
  date: string
  steps: DrillStep[]  // ordered by array position
}

DrillStep {
  id: string          // Date.now() — client-generated
  title, objective, groundType, fieldType,
  fieldMeasurement, unit?, width?, height?,
  canvasData?: { elements: PitchElement[], paths: DrawingPath[] }
}
```

### What writes to localStorage

| File | Operation |
|------|-----------|
| `CreateDrillPage` | `saveDrill()` → writes `allDrills` + `currentDrill` |
| `DrillCategoriesPage` | `setCurrentDrill()` → writes `currentDrill` |
| `CreateStepPage` | `addStep()` → updates `currentDrill.steps` |
| `DrillDesignerPage` | `updateStep(id, {canvasData})` → updates `currentDrill.steps` |
| `DrillStepsListPage` | `deleteStep()` → updates `currentDrill.steps` |

---

## 2. Revised Integration Approach

### What stays exactly the same
- All 5 page components (`DrillCategoriesPage`, `CreateDrillPage`, `DrillStepsListPage`, `CreateStepPage`, `DrillDesignerPage`)
- The React Router setup in `App.tsx`
- All canvas logic, SVG rendering, drag/drop, touch handling
- All UI components, assets and COLORS definitions
- The `PitchElement` / `DrawingPath` types

### What changes
Only **`DrillContext.tsx`** — the data layer is swapped from `localStorage` to API calls.

### How mounting works in Next.js

The Next.js session page has a "Session Planner" tab. When that tab is active, it renders the entire drill planner as a sub-app with the `DrillProvider` already knowing the `sessionId`:

```tsx
// In Next.js: pages/sessions/[sessionId].tsx (or app router equivalent)
import { DrillProvider } from '@/planner/context/DrillContext'
import PlannerSubApp from '@/planner/PlannerSubApp'  // the current App.tsx

// Inside the Session Planner tab:
<DrillProvider sessionId={session._id}>
  <PlannerSubApp />
</DrillProvider>
```

`PlannerSubApp` is the current `App.tsx` (renamed), which keeps all its React Router routes intact. Since Next.js's own router handles the outer `/sessions/[id]` page, the inner `BrowserRouter` handles the planner's sub-routes cleanly under a base path.

> **Note**: React Router's `BrowserRouter` inside a Next.js page works fine for client-rendered tabs. The planner routes (`/drill-steps`, `/create-step`, `/drill-designer/:stepId`) operate independently inside the BrowserRouter subtree.

---

## 3. The Only Real Change: `DrillContext.tsx`

### What changes in the context

1. **`DrillProvider` accepts `sessionId` as a prop** — passed in from the Next.js session page
2. **`localStorage` → API calls** — reads and writes go to the backend
3. **`currentDrill` is pre-populated** from the session data (no need to "create" a drill separately)
4. **`allDrills` is removed** — session listing lives in Next.js, not in this context

### Concept mapping inside the context

| Old (localStorage) | New (API) |
|--------------------|-----------|
| `Drill.id` | `session._id` from props |
| `Drill.title` | `session.title` from props |
| `Drill.date` | `session.date` from props |
| `Drill.steps[]` | `SessionPlannerStep[]` from `GET /planner-steps` |
| `DrillStep.id` | `SessionPlannerStep._id` (returned by backend) |
| `Date.now()` step id | Backend-generated `_id` |
| Array index → step number | `stepNumber` field |
| `saveDrill()` | Not needed — session already exists |
| `deleteDrill()` | Not needed — handled elsewhere |
| `addStep()` | `POST /sessions/:sessionId/planner-steps` |
| `updateStep()` | `PATCH /sessions/:sessionId/planner-steps/:stepId/canvas` |
| `deleteStep()` | `DELETE /sessions/:sessionId/planner-steps/:stepId` |

### New `DrillContext.tsx` sketch

```ts
interface DrillProviderProps {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  children: ReactNode;
}

export function DrillProvider({ sessionId, sessionTitle, sessionDate, children }: DrillProviderProps) {
  // currentDrill is pre-seeded from session props — no "Create Drill" step needed
  const [currentDrill, setCurrentDrill] = useState<Drill | null>({
    id: sessionId,
    title: sessionTitle,
    date: sessionDate,
    steps: [],  // populated by fetchSteps() below
  });

  const [loading, setLoading] = useState(true);

  // On mount, fetch all steps from the backend
  useEffect(() => {
    fetch(`/api/v1/sessions/${sessionId}/planner-steps`)
      .then(r => r.json())
      .then((steps: DrillStep[]) => {
        setCurrentDrill(prev => prev ? { ...prev, steps } : null);
        setLoading(false);
      });
  }, [sessionId]);

  // addStep → POST to backend, then push returned step into local state
  const addStep = async (stepData: Omit<DrillStep, 'id'>) => {
    const res = await fetch(`/api/v1/sessions/${sessionId}/planner-steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stepData),
    });
    const newStep: DrillStep = await res.json();
    // Map _id → id for backward compatibility with pages
    const mapped = { ...newStep, id: newStep._id };
    setCurrentDrill(prev => prev ? { ...prev, steps: [...prev.steps, mapped] } : null);
    return mapped;  // caller uses this to navigate to /drill-designer/:id
  };

  // updateStep → PATCH canvas only
  const updateStep = async (stepId: string, updates: Partial<DrillStep>) => {
    if (updates.canvasData) {
      await fetch(`/api/v1/sessions/${sessionId}/planner-steps/${stepId}/canvas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates.canvasData),
      });
    }
    setCurrentDrill(prev => prev ? {
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    } : null);
  };

  // deleteStep → DELETE from backend
  const deleteStep = async (stepId: string) => {
    await fetch(`/api/v1/sessions/${sessionId}/planner-steps/${stepId}`, {
      method: 'DELETE',
    });
    setCurrentDrill(prev => prev ? {
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    } : null);
  };

  // saveDrill / deleteDrill / allDrills not needed — kept as no-ops or removed
}
```

> **The key trick**: map `_id → id` on every step returned from the API so all existing pages continue to work with `step.id` without any changes.

---

## 4. Minor Changes Needed in Pages

Even though the pages are kept as-is, two small things need adjusting:

### `CreateStepPage.tsx`
- Currently generates `id: Date.now().toString()` then calls `addStep(newStep)` synchronously
- After the change, `addStep()` is async and returns the backend step (with the real `_id`)
- **Change**: make `handleSubmit` async, `await addStep(...)`, use the returned step's `id` to navigate

```ts
// Before
const newStep = { id: Date.now().toString(), ...fields }
addStep(newStep)
navigate(`/drill-designer/${newStep.id}`)

// After
const payload = { ...fields }  // no id — backend assigns it
const created = await addStep(payload)
navigate(`/drill-designer/${created.id}`)
```

### `DrillCategoriesPage.tsx` (optional — can be repurposed or hidden)
- Currently shows `allDrills` list — this page won't be the entry point in Next.js
- In the Next.js integration, the user enters the planner from the session tab, landing directly on `DrillStepsListPage`
- `DrillCategoriesPage` can be **kept as-is but not routed to** — or its route `/` can redirect straight to `/drill-steps`

```tsx
// In PlannerSubApp (App.tsx), change the root route:
<Route path="/" element={<Navigate to="/drill-steps" replace />} />
```

### `CreateDrillPage.tsx`
- Not needed in the Next.js flow (session already exists)
- Remove the `/create-drill` route from `App.tsx`
- Keep the file if desired — it just won't be used

---

## 5. How to Add to Next.js — Step by Step

```
1. Copy the entire /src folder from this project into the Next.js app
   e.g., nextjs-app/components/planner/

2. In DrillContext.tsx:
   - Accept sessionId, sessionTitle, sessionDate as props
   - Replace localStorage with API calls (see section 3)
   - Map _id → id on steps from API

3. In App.tsx (rename to PlannerSubApp.tsx):
   - Remove CreateDrillPage and DrillCategoriesPage routes
   - Change root "/" to redirect to "/drill-steps"

4. In CreateStepPage.tsx:
   - Make handleSubmit async
   - Use returned id from addStep() for navigation

5. In the Next.js session detail page, add a "Session Planner" tab:
   <DrillProvider sessionId={session._id} sessionTitle={session.title} sessionDate={session.date}>
     <PlannerSubApp />
   </DrillProvider>
```

---

## 6. Summary: Files and Their Required Changes

| File | Change Required |
|------|----------------|
| `DrillContext.tsx` | ✏️ **Rewrite data layer** — props in, API calls out, `_id→id` mapping |
| `App.tsx` → `PlannerSubApp.tsx` | ✏️ Remove 2 routes, add redirect on `/` |
| `CreateStepPage.tsx` | ✏️ Make `handleSubmit` async, use returned `id` for navigation |
| `DrillCategoriesPage.tsx` | 🔇 Not routed to (keep file, remove route) |
| `CreateDrillPage.tsx` | 🔇 Remove route (keep file) |
| `DrillStepsListPage.tsx` | ✅ **No change** |
| `DrillDesignerPage.tsx` | ✅ **No change** |
| All canvas/SVG/UI components | ✅ **No change** |

**3 files change. 2 routes removed. Everything else is a straight copy.**
