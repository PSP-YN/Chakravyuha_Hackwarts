# Krishi Connect 360 — UX audit and design system

**Release branch:** `feature/complete-platform`  
**Design direction:** Field Journal, with Harvest Signal treatment for sensor, alert and telemetry states  
**Language priority:** Kannada, with a persistent English alternative  
**Scope:** Landing, workspace, Storage Guardian, simulator, authentication, legal pages, market/forms and shared interaction surfaces

## 1. Direction selected

Three visual directions were considered:

1. **Field Journal** — warm ivory background, deep evergreen navigation, leaf-green accents and harvest ochre. Practical and approachable for farmers, cooperatives and buyers.
2. **Harvest Signal** — dark pine operations console with high-contrast sensor and event states. Useful for technical monitoring, but too dominant for the entire marketplace.
3. **Mandi Ledger** — light trade-desk interface with table-first comparisons and terracotta/ochre accents. Strong for transactions, weaker as a single system for hardware workflows.

Field Journal is the system-wide direction. Harvest Signal is used selectively where fast status recognition matters.

## 2. Baseline audit

The production experience already contained meaningful workflows and a recognisable green/cream identity. The audit found refinement opportunities rather than a need to replace the application:

- Landing, workspace, storage and simulator screens used several generations of component styling.
- Supporting labels and sensor metadata were frequently too small, particularly in storage and hardware views.
- Kannada headings inherited tight tracking designed for Latin typography.
- Mobile landing navigation competed for space between language, audio and account actions.
- Simulator checkboxes were below the preferred touch target size.
- Two audio-guide actions in the simulator header had indistinguishable labels.
- Technical states needed consistent semantics while retaining explicit distinctions between physical, simulated and unavailable telemetry.

## 3. Design tokens

| Role | Token / value | Intended use |
|---|---|---|
| Primary ink | `#1B2A20` | Main text and headings |
| Secondary ink | `#34483A` | Supporting headings |
| Muted text | `#56665A` | Body copy and metadata |
| Paper | `#F5F4ED` | Main application canvas |
| Raised surface | `#FFFFFF` | Cards, forms and data panels |
| Soft surface | `#EDF2E9` | Grouped panels and selected areas |
| Primary forest | `#1D4A35` | Primary actions and brand controls |
| Deep forest | `#143A29` | Desktop navigation and emphasis |
| Leaf | `#446B3D` | Positive actions and agricultural accent |
| Harvest ochre | `#7B4C0C` on `#FFF4DB` | Watch / caution |
| Clay | `#8C4729` on `#FFF0E8` | Action required |
| Critical | `#8B3028` on `#FFF0ED` | Urgent / fault |
| Information | `#2D6175` on `#EEF5F8` | Informational context |
| Focus | `#9B6B1F` | Keyboard focus outline |
| Harvest lime | `#D8ED75` | High-priority CTA fill with dark text |

Contrast ratios calculated for representative foreground/background pairs:

| Pair | Ratio |
|---|---:|
| `#1B2A20` / `#F5F4ED` | 13.62:1 |
| `#56665A` / `#F5F4ED` | 5.53:1 |
| `#1D4A35` / `#FFFFFF` | 10.08:1 |
| `#7B4C0C` / `#FFF4DB` | 6.67:1 |
| `#A33D32` / `#FFF0ED` | 5.79:1 |
| `#2D6175` / `#EEF5F8` | 6.19:1 |
| `#446B3D` / `#EDF5E9` | 5.51:1 |
| `#173A29` / `#D8ED75` | 9.73:1 |

These are token-pair calculations, not a substitute for testing every rendered component state. Statuses retain text labels and are not communicated by color alone.

## 4. Typography and layout

- Kannada: Noto Sans Kannada, regular/semibold/bold weights.
- Latin interface: DM Sans.
- Technical values, identifiers and timestamps: DM Mono.
- Kannada headings use open tracking and additional line height; Latin display headings may use tighter tracking.
- Primary page headings use responsive sizing; supporting body copy is kept comfortably readable.
- Page content is capped to a consistent maximum width.
- Desktop uses a persistent navigation rail/sidebar; compact layouts use the existing bottom-navigation pattern.
- Layout adapts at 1150, 900, 640 and 420 CSS-pixel breakpoints.
- Cards use a shared radius, neutral border and restrained elevation; gradients are restricted to selected brand surfaces.

## 5. Interaction and accessibility conventions

- Primary controls generally target 44–50 px minimum height.
- Checkbox targets in simulator and consent controls are 24 × 24 CSS px.
- Keyboard focus has a visible 3 px outline with offset.
- Reduced-motion preferences suppress decorative animation and transitions.
- Inputs have visible labels, borders and focus treatment.
- State treatments distinguish normal, watch, action, urgent/fault, information, loading and empty states; state text remains visible.
- Language switching remains persistent and available in Kannada and English.
- Audio controls have specific names so different guides are distinguishable.
- Table containers scroll horizontally when necessary rather than forcing page overflow.

## 6. Preserved product behavior

This release changes shared presentation and two accessibility/label details. It does not replace or mock the existing business logic:

- Supabase authentication and role-based workspace
- Marketplace search, filters, listing and offer flows
- Storage Guardian device registration and telemetry
- Krishi Guard scenario controls and environmental model
- ESP32 input/output presentation and Wokwi bridge
- Event journal, historical chart and data source labels
- Legal routes and Kannada/English language switching

Synthetic simulator data continues to be labelled as simulated. The condition index remains advisory; it is not a grain-quality certification or a replacement for inspection/testing.

## 7. Validation performed

- `npm test`: 19/19 passing
- `npm run typecheck`: passing
- `npm run build`: successful; Next.js generated all 15 app routes
- `npm audit --audit-level=high`: 0 reported vulnerabilities
- `git diff --check`: clean
- Preview route audit at 390 px and 1440 px: no horizontal overflow on `/`, `/workspace`, `/workspace/storage-guardian`, `/krishi-guard-simulator`, `/login`, `/signup`, `/privacy` or `/terms`
- One primary H1 and one main landmark per audited route
- No images missing an `alt` attribute in the audited routes
- Mobile interactive-target scan: no controls below 24 × 24 px after refinements
- Kannada → English → Kannada switching verified
- Heavy-rain scenario verified to change simulated rain/ADC and condition-state output
- Preview visually checked at desktop and mobile widths

## 8. Remaining validation boundaries

The current review is a code- and browser-based audit, not a moderated field study. Real farmers, cooperative operators and storage managers should test the terminology and task flows before broader rollout. The following require authorised real accounts or physical equipment and were not established by the visual redesign:

- End-to-end authentication email delivery and authenticated account workflows
- Authenticated cloud telemetry with a real registered device
- Electrical/firmware validation on physical ESP32 and sensors
- Wokwi's embedded third-party interface localization and accessibility
- Validation of advisory thresholds against local crop and storage conditions

## 9. Reference standards

- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Nielsen Norman Group — 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2 target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Apple HIG layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout)
