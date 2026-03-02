# Data Table Upgrade — Staff Tab

## Checklist

- [x] **Step 0**: Install `motion` package
- [x] **Step 1**: Create `components/data-table/` — adapted from diff-comps
  - [x] `config/data-table.ts`
  - [x] `types/data-table.ts`
  - [x] `lib/data-table.ts`
  - [x] `lib/format.ts`
  - [x] `data-table.tsx`
  - [x] `data-table-column-header.tsx` (lucide → Hugeicons)
  - [x] `data-table-pagination.tsx` (lucide → Hugeicons)
  - [x] `data-table-toolbar.tsx` (lucide → Hugeicons, remove date/slider refs)
  - [x] `data-table-faceted-filter.tsx` (lucide → Hugeicons)
  - [x] `data-table-view-options.tsx` (lucide → Hugeicons)
  - [x] `data-table-action-bar.tsx` (lucide → Hugeicons, uses motion/react)
  - [x] `data-table-skeleton.tsx`
- [x] **Step 2**: Create `components/capacity-plan/staff-table-columns.tsx`
- [x] **Step 3**: Create `components/capacity-plan/use-staff-data-table.ts`
- [x] **Step 4**: Rewrite `staff-tab.tsx` to use new data table
- [x] **Step 5**: Type check + verify
- [ ] **Step 6**: Commit

## Icon Mapping (lucide → Hugeicons)

| lucide | Hugeicons |
|---|---|
| `ChevronDown` | `ArrowDown01Icon` |
| `ChevronUp` | `ArrowUp01Icon` |
| `ChevronsUpDown` | `SortingIcon` |
| `ChevronLeft` | `ArrowLeft01Icon` |
| `ChevronRight` | `ArrowRight01Icon` |
| `ChevronsLeft` | `ArrowLeftDoubleIcon` |
| `ChevronsRight` | `ArrowRightDoubleIcon` |
| `Check` / `CheckIcon` | `Tick01Icon` |
| `PlusCircle` | `PlusSignCircleIcon` |
| `XCircle` / `XIcon` | `CancelCircleIcon` |
| `X` | `Cancel01Icon` |
| `EyeOff` | `ViewOffIcon` |
| `Settings2Icon` | `Settings01Icon` |
| `LoaderIcon` | `Loading01Icon` |

## Architecture

- All data-table primitives in `components/data-table/` — write once, import everywhere
- Domain columns in `components/capacity-plan/staff-table-columns.tsx`
- Table hook in `components/capacity-plan/use-staff-data-table.ts`
- Staff tab consumes hook + primitives
