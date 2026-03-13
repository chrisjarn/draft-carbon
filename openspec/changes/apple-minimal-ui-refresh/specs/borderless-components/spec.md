## ADDED Requirements

### Requirement: Borderless buttons with shadow affordance
All button variants SHALL remove explicit `border` styling:
- **Default (primary)**: `bg-primary` fill with `shadow-sm`, no border
- **Outline → Surface**: Renamed conceptually — `bg-card` (white) fill with `shadow-sm`, no border. Hover increases shadow
- **Ghost**: No border (already borderless), no change
- **Destructive**: `bg-destructive` fill with `shadow-sm`, no border

#### Scenario: Primary button has no visible border
- **WHEN** a Button with `variant="default"` renders
- **THEN** it SHALL have no CSS border and SHALL display a subtle shadow for depth

#### Scenario: Outline button renders as white surface with shadow
- **WHEN** a Button with `variant="outline"` renders
- **THEN** it SHALL have a white background, no border, and a subtle shadow
- **AND** on hover, the shadow SHALL increase slightly for feedback

#### Scenario: Ghost button remains borderless
- **WHEN** a Button with `variant="ghost"` renders
- **THEN** it SHALL have no border and no shadow, with only a background change on hover

### Requirement: Filled inputs without borders
Input elements SHALL use a filled background (`bg-muted`) at rest instead of `border border-input`. On focus, inputs SHALL transition to `bg-card` (white) with a focus ring.

#### Scenario: Input at rest shows filled gray background
- **WHEN** an Input component renders without focus
- **THEN** it SHALL display a gray filled background (`bg-muted`) with no visible border

#### Scenario: Input on focus transitions to white with ring
- **WHEN** an Input component receives focus
- **THEN** the background SHALL change to white (`bg-card`)
- **AND** a focus ring SHALL appear using `--ring` color

### Requirement: Increased button border-radius
Buttons SHALL use `rounded-xl` (16px) instead of the current `rounded-lg`.

#### Scenario: Button renders with larger radius
- **WHEN** any Button variant renders
- **THEN** the border-radius SHALL be `rounded-xl` (16px)

### Requirement: Increased input border-radius
Input elements SHALL use `rounded-xl` (16px) instead of the current `rounded-lg`.

#### Scenario: Input renders with larger radius
- **WHEN** an Input component renders
- **THEN** the border-radius SHALL be `rounded-xl` (16px)

### Requirement: Card border-radius increase
Cards SHALL use `rounded-3xl` (24px) instead of the current `rounded-2xl`. The `size="sm"` variant SHALL use `rounded-2xl`.

#### Scenario: Default card has 24px radius
- **WHEN** a Card component renders without size prop
- **THEN** the border-radius SHALL be `rounded-3xl` (24px)

#### Scenario: Small card has 16px radius
- **WHEN** a Card component renders with `size="sm"`
- **THEN** the border-radius SHALL be `rounded-2xl` (16px)

### Requirement: Badge radius increase
Badge elements SHALL use `rounded-lg` (8px) instead of the current `rounded-sm`.

#### Scenario: Badge renders with larger radius
- **WHEN** a Badge component renders
- **THEN** the border-radius SHALL be `rounded-lg` (8px)

### Requirement: Tab indicator radius consistency
Tab indicators SHALL use `rounded-lg` for default variant (up from `rounded-md`) to match the increased radius scale.

#### Scenario: Default tab indicator has increased radius
- **WHEN** a Tabs component renders with default variant
- **THEN** the active tab indicator SHALL have `rounded-lg` border-radius

### Requirement: Select and dropdown border removal
Select triggers, dropdown menus, and popover containers SHALL remove explicit borders and use `shadow-md` or `shadow-lg` for floating elevation.

#### Scenario: Dropdown menu renders without border
- **WHEN** a DropdownMenu or Select content panel opens
- **THEN** it SHALL have no visible border and SHALL use shadow for elevation

### Requirement: Dialog and sheet border softening
Dialog and Sheet overlays SHALL remove explicit border styling and rely on `shadow-lg` for elevation against the backdrop.

#### Scenario: Dialog renders with shadow elevation only
- **WHEN** a Dialog opens
- **THEN** the dialog panel SHALL have no visible border and SHALL use `shadow-lg` for floating depth
