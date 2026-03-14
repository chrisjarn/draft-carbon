## Why

The current UI uses a shadcn/ui base-maia style with zinc+indigo theming — functional but visually generic. As an internal workforce planning tool for a professional services firm, the interface should feel purposeful, calm, and premium. An Apple-inspired minimal aesthetic (gray canvas, white surfaces, borderless elements, generous squircle radii) will reduce visual noise, improve scannability of dense planning data, and give the app a distinctive identity that matches the caliber of work Carbon Group does.

## What Changes

- **Background canvas**: Shift from near-white (`oklch(0.985...)`) to a deliberate warm gray (`#f5f5f7`-family) as the page background
- **Surface treatment**: White cards/panels remain but gain soft diffuse shadows instead of relying solely on background contrast — creating a "floating" feel
- **Border removal**: Strip borders from buttons (use fill + shadow instead), soften input borders (filled gray background approach), remove remaining divider lines where contrast suffices
- **Border radius**: Push interactive elements toward squircle radii — `rounded-2xl`/`rounded-3xl` on cards, `rounded-xl` on buttons/inputs (up from `rounded-lg`)
- **Color refinement**: Maintain indigo primary but warm the neutral palette slightly; ensure the dark sidebar still anchors the layout
- **Shadow system**: Introduce a layered shadow scale (sm/md/lg) with soft, diffuse properties — replacing the current ring-style fake-border shadows
- **Component updates**: Revise button, input, card, tabs, badge, and page layout primitives to match the new visual language

## Capabilities

### New Capabilities
- `apple-minimal-theme`: Design token and CSS custom property changes for the new color scheme, shadow system, radius scale, and surface treatments
- `borderless-components`: Component-level updates to buttons, inputs, cards, tabs, badges, and layout primitives removing borders and adopting fill+shadow patterns

### Modified Capabilities

## Impact

- **CSS**: `apps/web/src/index.css` — theme tokens, shadow definitions, radius scale
- **UI primitives**: `apps/web/src/components/ui/` — card, button, input, tabs, badge, separator
- **Layout**: `apps/web/src/components/templates/page.tsx`, `page-header.tsx` — background and surface changes
- **Molecules**: Form fields, date picker, dialogs/sheets — inherit new token values
- **No API/backend changes** — purely frontend visual layer
- **No breaking changes** — all existing component APIs preserved, only visual output changes
