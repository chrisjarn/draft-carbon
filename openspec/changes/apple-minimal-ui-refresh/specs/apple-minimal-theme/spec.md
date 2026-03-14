## ADDED Requirements

### Requirement: Warm gray canvas background
The `--background` CSS custom property SHALL be set to `oklch(0.97 0.001 264)` (~`#f5f5f7`) to provide a deliberate warm gray canvas that creates clear visual separation from white card surfaces.

#### Scenario: Page background renders as warm gray
- **WHEN** any page loads within the app shell
- **THEN** the `<main>` background SHALL render as the warm gray canvas color, visually distinct from white card surfaces

### Requirement: Three-tier shadow system
The theme SHALL define three shadow tiers as CSS custom properties:
- `--shadow-sm`: Subtle lift for interactive elements (`0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)`)
- `--shadow-md`: Surface elevation for cards and panels (`0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)`)
- `--shadow-lg`: Floating element elevation for popovers and dialogs (`0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)`)

#### Scenario: Shadow tiers are available as Tailwind utilities
- **WHEN** a developer uses `shadow-sm`, `shadow-md`, or `shadow-lg` classes
- **THEN** the corresponding soft diffuse shadow SHALL be applied, replacing the previous ring-style shadows

### Requirement: Increased base radius
The `--radius` CSS custom property SHALL be set to `0.75rem` (12px), increasing from the previous `0.625rem` (10px).

#### Scenario: Default border-radius is larger
- **WHEN** any component uses the `--radius` token for its border-radius
- **THEN** the computed radius SHALL be 12px (0.75rem)

### Requirement: Card surface elevation
Cards SHALL use `shadow-md` to create floating elevation above the warm gray canvas. The `bg-card` token SHALL remain pure white (`oklch(1 0 0)`).

#### Scenario: Cards appear elevated on gray canvas
- **WHEN** a Card component renders on a page
- **THEN** it SHALL have a soft diffuse shadow creating a floating appearance against the gray background

### Requirement: Muted background tint adjustment
The `--muted` token SHALL be adjusted to `black/6%` (from `black/4%`) to maintain sufficient contrast against the new darker background.

#### Scenario: Muted backgrounds are visible on gray canvas
- **WHEN** a `bg-muted` element renders within the gray canvas
- **THEN** the muted tint SHALL be visually distinguishable from the canvas background

### Requirement: PageBody padded background
The `PageBody` component with `padded` variant SHALL use the canvas `--background` color instead of `bg-muted/30`, since the canvas itself now provides the gray tint.

#### Scenario: Padded page body uses canvas color
- **WHEN** `PageBody` renders with `padded={true}`
- **THEN** the background SHALL match the canvas gray, with padding but no additional tint overlay
