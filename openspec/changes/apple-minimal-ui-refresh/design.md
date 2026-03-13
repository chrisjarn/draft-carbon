## Context

The app currently uses a shadcn/ui base-maia style with zinc+indigo theming. The visual system relies on near-white backgrounds (`oklch(0.985...)`), white card surfaces differentiated by background contrast alone, ring-style fake-border shadows, and explicit borders on all interactive elements. The dark sidebar anchors the layout. Tailwind CSS v4 is used with CSS custom properties defined in `index.css`. All UI primitives live in `apps/web/src/components/ui/`.

The goal is to shift toward an Apple-inspired minimal aesthetic while preserving all component APIs and existing functionality.

## Goals / Non-Goals

**Goals:**
- Establish a warm gray canvas background that creates clear surface hierarchy
- Replace border-dependent separation with shadow-based elevation
- Create a cohesive borderless component language across buttons, inputs, cards, and tabs
- Increase border-radius across interactive elements for a squircle/rounded feel
- Maintain the dark sidebar as a contrast anchor
- Keep all component APIs backward-compatible (zero breaking changes)

**Non-Goals:**
- Redesigning the sidebar (keep current dark inverted style)
- Changing the layout structure or routing
- Introducing new components or removing existing ones
- Adding dark mode support
- Changing the icon system or typography
- Introducing CSS superellipse/squircle (browser support too limited)

## Decisions

### 1. Background canvas color: `#f5f5f7` (Apple system gray)

**Choice**: Use `oklch(0.97 0.001 264)` (~`#f5f5f7`) as `--background`.

**Alternatives considered**:
- Keep current `oklch(0.985...)` — too close to white, insufficient contrast with card surfaces
- Use a warmer beige — doesn't fit the professional/tech aesthetic

**Rationale**: Apple's `#f5f5f7` is the canonical "gray canvas" — it provides enough contrast against white surfaces without feeling dark, and reads as intentionally designed rather than "slightly off-white."

### 2. Shadow system: Three-tier soft diffuse shadows

**Choice**: Replace the current ring-style shadows (`0px 0px 0px 1px rgba(0,0,0,0.06), ...`) with soft diffuse shadows:
- `--shadow-sm`: `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` — subtle lift for buttons
- `--shadow-md`: `0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` — cards and surfaces
- `--shadow-lg`: `0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` — floating elements (popovers, dialogs)

**Rationale**: Ring-style shadows mimic borders — the opposite of what we want. Apple uses large-radius, low-opacity shadows that create depth without edges.

### 3. Border removal strategy: Graduated approach

**Choice**: Remove borders in priority order:
1. **Cards** — already borderless, add `shadow-md`
2. **Buttons** — remove `border`, use fill colors + `shadow-sm` for default/outline variants
3. **Inputs** — replace `border border-input` with `bg-muted` fill (gray background, no border)
4. **Tabs** — already close, ensure no border artifacts
5. **Keep borders on**: Separators (explicit dividers), table cells, sidebar edge

**Alternatives considered**:
- Remove ALL borders everywhere — too aggressive, tables and separators need structure
- Border → box-shadow everywhere — unnecessary complexity for elements that work fine with fill

**Rationale**: Apple removes borders where shadow or fill provides sufficient affordance, but retains structural lines in data-dense contexts (which this workforce planner has).

### 4. Radius scale: Push up one tier

**Choice**:
- Cards: `rounded-2xl` → `rounded-3xl` (24px)
- Buttons/inputs: `rounded-lg` → `rounded-xl` (16px)
- Badges: `rounded-sm` → `rounded-lg` (8px)
- `--radius` token: `0.625rem` → `0.75rem` (12px base)

**Rationale**: Larger radii create the "squircle" feel without needing actual superellipse math. The one-tier bump is enough to shift perception without looking cartoonish in a data-heavy app.

### 5. Input treatment: Filled background instead of bordered

**Choice**: Inputs get `bg-muted` (the `black/4%` token) with no border, and `bg-card` on focus with a subtle ring.

**Rationale**: This is the iOS/macOS input pattern — filled gray at rest, white on focus. Reduces visual noise in form-heavy pages (which this app has many of).

### 6. Button treatment: Fill + subtle shadow

**Choice**:
- **Default (primary)**: Keep `bg-primary`, remove border, add `shadow-sm`
- **Outline → "Surface"**: `bg-card` (white) with `shadow-sm`, no border. Hover: slight shadow increase
- **Ghost**: No change (already borderless, hover bg only)
- **Destructive**: Same as default but with destructive color

**Rationale**: Apple's button language is fill-based — primary actions use solid color, secondary actions use white/gray fill with shadow for affordance.

## Risks / Trade-offs

- **Reduced affordance on inputs** → Mitigated by clear focus states and consistent fill pattern. Users learn the pattern quickly in a daily-use internal tool.
- **Shadow performance on large lists** → Mitigated by using CSS box-shadow (GPU-composited). The shadow values are simple enough to not cause paint issues.
- **Borderless buttons may reduce click-target clarity** → Mitigated by keeping shadow on surface-variant buttons and maintaining hover states.
- **Gray background may reduce perceived brightness** → The shift is subtle (3% darker than current). Monitor user feedback after rollout.
