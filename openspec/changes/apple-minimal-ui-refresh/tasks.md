## 1. Theme Tokens

- [ ] 1.1 Update `--background` to `oklch(0.97 0.001 264)` in `apps/web/src/index.css`
- [ ] 1.2 Update `--radius` from `0.625rem` to `0.75rem` in `apps/web/src/index.css`
- [ ] 1.3 Replace ring-style `--shadow` definitions with three-tier soft diffuse shadows (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) in `apps/web/src/index.css`
- [ ] 1.4 Adjust `--muted` from `black/4%` to `black/6%` for contrast on darker canvas
- [ ] 1.5 Adjust `--secondary` and `--accent` tokens if needed to maintain contrast hierarchy

## 2. Card Component

- [ ] 2.1 Update `card.tsx` base radius from `rounded-2xl` to `rounded-3xl`
- [ ] 2.2 Update `size="sm"` variant from `rounded-xl` to `rounded-2xl`
- [ ] 2.3 Add `shadow-md` to Card base class for floating elevation

## 3. Button Component

- [ ] 3.1 Remove `border` from Button base class in `button.tsx`
- [ ] 3.2 Update default variant: remove border, add `shadow-sm`
- [ ] 3.3 Update outline variant: `bg-card` fill, `shadow-sm`, no border, shadow increase on hover
- [ ] 3.4 Update destructive variant: remove border, add `shadow-sm`
- [ ] 3.5 Update base radius from `rounded-lg` to `rounded-xl`

## 4. Input Component

- [ ] 4.1 Replace `border border-input` with `bg-muted` fill on Input wrapper in `input.tsx`
- [ ] 4.2 Add focus state: transition to `bg-card` with focus ring
- [ ] 4.3 Update radius from `rounded-lg` to `rounded-xl`

## 5. Tabs Component

- [ ] 5.1 Update default variant tab indicator from `rounded-md` to `rounded-lg` in `tabs.tsx`

## 6. Badge Component

- [ ] 6.1 Update Badge base radius from `rounded-sm` to `rounded-lg` in `badge.tsx`

## 7. Floating Elements

- [ ] 7.1 Remove explicit borders from dropdown/select content panels, apply `shadow-lg`
- [ ] 7.2 Remove explicit borders from Dialog/Sheet panels, apply `shadow-lg`
- [ ] 7.3 Remove explicit borders from Popover content, apply `shadow-lg`

## 8. Layout Updates

- [ ] 8.1 Update `PageBody` padded variant in `page.tsx` — replace `bg-muted/30` with canvas background
- [ ] 8.2 Verify `PageHeader` remains borderless and renders correctly on new canvas

## 9. Verification

- [ ] 9.1 Run `bun run check-types` to ensure no TypeScript errors
- [ ] 9.2 Run `bun run check` to ensure Biome lint/format passes
- [ ] 9.3 Visual review of key pages: dashboard, capacity-plan, carbonites, admin
