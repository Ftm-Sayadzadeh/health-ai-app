# Avocado Design System — آووکادو

**Version:** 1.1  
**Product:** Persian daily health companion  
**Primary surface:** mobile-first responsive web application  
**Language and flow:** Persian (`fa-IR`), right-to-left  
**Accessibility target:** WCAG 2.2 AA

## 1. Selected concept: «دو مسیر، یک همراه»

Avocado is a friendly daily companion, not a judge and not a clinic. Its identity pairs a smiling avocado character with two rigorously separate product tracks:

- **Outlined track — intention:** meal and workout plans describe what a person intends to do.
- **Solid track — lived reality:** the daily log describes what the person actually ate or completed.

The brand mark is a simplified smiling avocado paired with a custom Persian wordmark. The character makes everyday repetition feel lighter; credibility comes from calm language, accessible interaction, and explicit separation between intention and lived reality. Character moments stay selective so the product feels warm rather than childish.

The signature line is:

> **برنامه روشن، ثبت واقعی**  
> Clear plans, honest records.

### Why this fits Avocado

1. It turns the product’s most important information-architecture distinction into a visual and behavioral rule.
2. It supports fast, non-judgmental daily use: “record what happened” is always more prominent than “perform perfectly.”
3. The simplified face scales from favicon to welcome moments, while food illustrations provide a flexible visual family for future empty and success states.
4. It is contemporary and Persian-first, warm enough for repeated use, and avoids clinical or fitness-gym conventions.

## 2. Experience principles

### 2.1 Today before the archive

On opening, show the date, unfinished profile or questionnaire work, the next useful action, what has been logged today, and the active plans. Historical analysis is secondary.

### 2.2 Record before optimize

The primary food action is always **«ثبت خوراک»**. Never shame, score, or color a day red because a plan was not followed. Reports describe patterns; they do not diagnose.

### 2.3 Intention and reality never collapse

“Plan” and “log” are separate domain objects, screens, headings, colors, and icons. A planned meal can be copied into today’s log only through **«ثبت بر اساس برنامه»**, followed by quantity confirmation. This creates a new log entry and never mutates the source plan.

### 2.4 Reuse reduces burden

Recent and saved foods appear before broad search results. Repeat actions preserve the last quantity but keep it editable. Successful logging returns the user to the previous context with a short confirmation.

### 2.5 Calm credibility

Avoid streak anxiety, moral labels such as «خوب/بد», medical promises, body imagery, and invented precision. Use plain labels, transparent sources, editable values, and qualified language.

## 3. Brand identity

### 3.1 Mark

The core mark contains a dark forest outline, pale lime flesh, a solid lime pit, one leaf, and a minimal two-eye smile. The smile is deliberately quiet: no limbs, props, blush, or exaggerated expression in the core logo. The custom Persian wordmark must always preserve the exact spelling «آووکادو» and a clearly recognizable «آ».

**Clear space:** half the symbol width on every side.  
**Minimum digital size:** 24px simplified symbol, 96px full Persian lockup.  
**Prohibited:** gradients or shadows inside the core mark, changing the facial expression between product screens, adding medical symbols, placing the mark inside an unrelated container, or stretching the supplied PNG assets. Use the supplied color, white, and one-color exports rather than recoloring them ad hoc.

**Production assets:** `1-2.png` is the primary color lockup, `2-2.png` is the dark-surface lockup, and `4-2.png` is the standalone mark and favicon. These files are already tightly cropped; render them with `contain` and never reconstruct the lockup from separate pieces.

### 3.2 Color posture

The palette is **Mineral / Jade / Indigo / Citron**:

| Role | Token | Purpose |
|---|---|---|
| Canvas | `--av-color-canvas` | cool, low-chroma mineral page ground |
| Surface | `--av-color-surface` | cards, inputs, sheets |
| Ink | `--av-color-ink-strong` | primary text and icon strokes |
| Jade | `--av-color-primary` | actual logging, core product actions and primary controls |
| Indigo | `--av-color-plan` | intended plans only |
| Citron | `--av-color-pulse` | selected state and tiny celebratory highlights; never body text or a large surface |
| Semantic statuses | success/warning/danger/info | feedback with icon + language, never color alone |

Jade anchors repeated actions without turning the whole interface green. Indigo remains a semantic drafting color for future intent. Citron is a brief pulse, limited to one selection, one metric, or one celebratory detail per view.

Do not place primary Jade and Plan Indigo as competing calls to action in the same group. Primary actions use Jade; plan actions use Indigo only inside a clearly labelled plan context.

Two production themes share these semantic roles: **Original** uses the cool mineral canvas from the first direction and is the default; **Botanical** uses the warmer logo-aligned green foundation. The theme changes tokens only—content, component hierarchy, interactions, and the distinction between plan and actual remain identical.

### 3.3 Typography

#### Product typeface — Kalameh

Use the locally supplied Kalameh family for the wordmark, marketing, product headlines, controls, forms, navigation, values, and all Persian interface content. Regular, Medium, SemiBold, and Bold carry most interface work; ExtraBold and Black are reserved for selective display moments.

- Display 3XL: `clamp(32px, 1.5rem + 2vw, 52px)`, weight 780, line-height 1.25
- Display 2XL: `clamp(26px, 1.35rem + 1vw, 34px)`, weight 760, line-height 1.3
- Title XL: 22px, weight 700, line-height 1.45
- Title LG: 18px, weight 650, line-height 1.55

#### Interface weights

Use Kalameh Regular for body text, Medium for compact supporting labels, SemiBold for controls and section headings, and Bold for product titles. Avoid Thin, ExtraLight, and Light in small Persian text.

- Body: 16px / 1.75, weight 400
- Body compact: 14px / 1.7, weight 400
- Label: 14px / 1.55, weight 600
- Caption: 12px / 1.65, weight 500
- Buttons: 15px / 1, weight 650

#### Technical runs

Phone numbers, OTP codes, file names, IDs, calorie values, dates with Latin separators, and technical identifiers use `dir="ltr"`, `unicode-bidi: isolate`, tabular numerals, and Kalameh with system fallbacks. Do not change typeface for Persian prose or controls.

#### Persian typography rules

- Use Persian ی and ک, not Arabic ي and ك.
- Use the نیم‌فاصله (ZWNJ) correctly: `می‌خواهم`, `خورده‌شده`, `واردشده`.
- Avoid full justification; use start alignment and natural rag.
- Never add Latin-style letter spacing to Persian text.
- Headings may tighten vertical rhythm through line-height, not tracking.
- Keep units attached to values with a non-breaking space where possible: `۲۵۰ کیلوکالری`.
- Use Persian digits in prose and summary metrics. Preserve Latin digits exactly in OTP, phone, file, URL, and external identifier fields.

### 3.4 Iconography

Icons use a 24px grid, 2px rounded strokes, open counters, and square optical bounds. Use filled shapes only for selected navigation or the “actual” semantic marker. Plan icons contain one outlined or dashed internal segment. Directional icons mirror in RTL; universal symbols such as play, check, plus, warning, and file type do not mirror unless meaning changes.

Never use an icon without a visible label in primary navigation. Icon-only controls require an accessible name and a 44px minimum target.

### 3.5 Illustration and imagery

The system uses the supplied transparent food cut-outs and the smiling avocado character. Illustrations have soft painted volume, crisp silhouettes, saturated natural colors, and transparent edges. Use one hero-scale character or one bowl per composition, with at most two small food accents. Avoid generic lifestyle photography, idealized bodies, before/after imagery, medical equipment, visual calorie judgments, or turning every food item into a character.

Photography, if introduced later, should show ordinary Iranian daily contexts and real food portions from an overhead or table-level perspective. It must not imply guaranteed outcomes.

### 3.6 Motion

Motion explains state and continuity:

- **Log confirmation:** solid track fills from inline-start to inline-end in 240ms; no confetti.
- **Plan to log:** outlined item duplicates, moves into the actual lane, then becomes solid in 360ms.
- **Sheet:** translate from block-end with opacity, 240ms emphasized easing.
- **Accordion:** animate grid rows or height and opacity, 160ms.
- **Loading:** restrained opacity pulse; avoid infinite spinning where a skeleton communicates structure.
- **Reduced motion:** all transforms collapse to 1ms state changes; progress remains perceivable through text and shape.

No decorative motion loops. No motion triggered solely by scrolling.

## 4. Information architecture

### 4.1 Primary navigation

1. **امروز** — relevance now, quick log, current status, unfinished work.
2. **ثبت** — food logging; recent, saved, search, meal grouping.
3. **برنامه‌ها** — meal plans and workout plans; intended future actions.
4. **من** — health profile, questionnaires, uploads, reports, privacy, settings.

On larger viewports the same destinations move from bottom navigation to an RTL side rail; order and labels remain stable.

### 4.2 Domain vocabulary

| Canonical Persian term | Meaning | Do not substitute |
|---|---|---|
| ثبت خوراک امروز | actual consumed food entries for a date | برنامه غذایی |
| برنامه غذایی | intended meals and quantities | گزارش خوراک |
| برنامه تمرینی | intended workouts | فعالیت ثبت‌شده |
| خوراک‌های اخیر | recently logged actual foods | پیشنهادها |
| خوراک‌های ذخیره‌شده | user-curated reusable foods | علاقه‌مندی‌ها when ambiguity matters |
| ثبت بر اساس برنامه | copy a planned item into today’s actual log | انجام شد without quantity confirmation |
| تکمیل اطلاعات | resume an incomplete profile/questionnaire | خطا or هشدار |

### 4.3 Plan versus log contract

Every component displaying these concepts must provide at least two of the following three cues:

1. explicit noun: «برنامه» or «ثبت‌شده»;
2. shape: outline for plan, solid for actual;
3. color: indigo for plan, jade for actual.

Color alone is insufficient. Comparison charts use dashed plan lines and solid actual lines with direct labels.

## 5. Layout and responsive system

### 5.1 Grid

- 4px base unit.
- Page gutters: 16px at 360–430, 20px at 600–744, 24px at 768–1180, 32px at 1280+.
- Mobile content is one decisive column.
- Cards use 12–16px internal gaps and 16–24px padding.
- Reading width caps at 42rem; showcase/application shells cap at 76rem.

### 5.2 Semantic breakpoints

| Range | Product behavior |
|---|---|
| 360–430 | bottom nav; full-width sheets; stacked summaries; primary action within thumb reach |
| 600–744 | two-column reusable-food grid; wider sheet with safe margins |
| 768–834 | dashboard summary + active plan split; bottom nav remains if touch-first |
| 1024–1180 | persistent RTL rail; content/detail split panes for plans and profile |
| 1280–1536 | 3-column component catalog or 2-column product workspace |
| 1920 | content remains capped; additional whitespace, never stretched controls |

Use container queries for cards that may appear in dashboard, sheet, or split pane contexts. No user-facing viewport labels or device selectors belong inside the product.

### 5.3 Shape and elevation

- Inputs and compact controls: 10px radius.
- Cards and grouped modules: 14px radius.
- Sheets and major temporary layers: 24px radius at block-start corners; square at viewport edges on mobile.
- Pills are reserved for filters, statuses, and compact quantities.
- Permanent content uses borders and surface shifts, not shadows.
- Shadow 1 is for actionable raised cards; Shadow 2 is only for sheets/dialogs.

## 6. Component architecture

React components should be semantic, composable, controlled where state matters, and use `forwardRef` for focusable primitives. Public props must use product vocabulary rather than visual vocabulary (`kind="plan"`, not `color="indigo"`).

### 6.1 Foundations

- `AvocadoProvider`: direction, locale, reduced-motion and portal root.
- `DirectionIsolate`: renders `bdi` or an element with explicit `dir`; required for user-generated and mixed-direction values.
- `Icon`: size 16/20/24, mirrored behavior declared per glyph.
- `VisuallyHidden`: accessible labels and announcements.
- `FocusRing`: shared focus-visible contract.
- `Stack`, `Inline`, `Cluster`, `Grid`: logical-property layout primitives.

### 6.2 Controls

- `Button`: primary, secondary, quiet, danger; small/default/large; idle/loading/success/disabled.
- `IconButton`: always requires `aria-label`; 44px minimum target.
- `TextField`, `TextArea`, `SelectField`: label, hint, required marker, error, loading, success.
- `SearchField`: clear action, recent query support, result count announcement.
- `SegmentedControl`: 2–4 exclusive options; arrow-key navigation.
- `FilterChip`: pressed state via `aria-pressed`; never color-only.
- `Checkbox`, `Radio`, `Switch`: entire label is clickable; switch only for immediate binary settings.
- `Stepper`: plus/minus buttons, editable numeric input, localized unit.
- `DateControl`: Persian display label with machine-readable Gregorian value; never assume one calendar without product confirmation.

### 6.3 Mobile authentication

- `PhoneField`: country prefix and number are isolated LTR; visible Persian label; numeric keypad hint.
- `OtpInput`: one logical input or six coordinated cells; LTR order; paste support; auto-advance; backspace recovery; expiry announcement.
- `AuthNotice`: states that verification is for access, not consent to health advice.
- `ResendCode`: cooldown is textual and announced, never motion-only.

Use autocomplete (`tel`, `one-time-code`) and never impose a memory/puzzle authentication step. Error copy: **«کد درست نیست؛ دوباره بررسی کنید.»**

### 6.4 Daily dashboard

- `TodayHeader`: Persian date, greeting, profile/resume status.
- `QuickLogAction`: strongest action in the view: **«ثبت خوراک»**.
- `ActualSummary`: solid-track marker, meals logged, honest neutral language.
- `ActivePlanPreview`: outlined-track marker, next planned meal/workout, explicit **«برنامه فعال»** label.
- `ContinueCard`: resumes incomplete profile, upload, or questionnaire with saved progress.
- `DailyNotice`: compact safety or system notice; never a motivational lecture.

### 6.5 Food logging

- `MealGroup`: breakfast/lunch/dinner/snack heading, item count, subtotal if source data exists, add action.
- `FoodEntryRow`: food name, amount, unit, optional calories, edit/remove overflow.
- `RecentFoodList`: recency label and one-tap repeat; amount remains editable.
- `SavedFoodList`: saved marker, folders/tags only if user-created.
- `FoodSearchResults`: exact matches before suggestions; source and units visible.
- `QuickLogSheet`: search → recent/saved → amount confirmation → success.
- `CopyFromPlan`: identifies source plan and destination date, then requests amount confirmation.

Deleting a food entry requires undo for routine mistakes; a blocking confirmation dialog is reserved for destructive multi-entry actions.

### 6.6 Plans

- `PlanCard`: plan type, author/source, active dates, completion of questionnaire prerequisites, status.
- `MealPlanDay`: planned meals with outlined markers; no actual-log totals inside the plan.
- `WorkoutPlanDay`: movement, sets/time, equipment, qualified safety note when provided.
- `PlanSourceBadge`: specialist, uploaded, user-created, or AI-assisted; never implies medical authority.
- `PlanActions`: view, replace active plan, archive, and **«ثبت بر اساس برنامه»** where appropriate.

AI-assisted plans must display: **«این پیشنهاد جایگزین نظر پزشک، متخصص تغذیه یا مربی واجد صلاحیت نیست.»**

### 6.7 Health profile and questionnaires

- `ProfileCompleteness`: descriptive percentage and remaining sections; not a wellness score.
- `ProfileSection`: identity, goals, dietary context, activity context, limitations, consent/privacy.
- `Questionnaire`: one clear question group per step, progress text, back/continue, save-and-exit.
- `SensitiveField`: explains why information is requested and whether it is optional.
- `ReviewAnswers`: grouped summary before submission with edit links.

Never infer diagnosis, risk, or suitability from incomplete answers in presentation-layer components.

### 6.8 File upload

- `FileUpload`: browse button plus drag/drop enhancement, accepted PDF/image types, size limit, privacy note.
- `UploadItem`: isolated filename, type, size, progress, cancel/retry/remove.
- `UploadReview`: page/image preview count and extraction status without claiming perfect recognition.

Mixed filenames use `<bdi dir="auto">`. File extensions and byte values stay LTR.

### 6.9 Reports

- `MetricSummary`: label, value, unit, comparison period, data completeness.
- `TrendChart`: direct labels, visible data table alternative, plan dashed / actual solid.
- `ReportEmptyState`: explains the minimum data needed without blaming the user.
- `InsightNotice`: distinguishes observation, suggestion, and professional advice.

Charts never use red/green alone and never label adherence as failure. If source data is incomplete, show **«داده کافی نیست»** rather than extrapolating.

### 6.10 Navigation and overlays

- `BottomNavigation`: four stable destinations, labels always visible, safe-area padding.
- `SideNavigation`: same order and destinations at large widths.
- `BottomSheet`: focus trap, labelled title, Escape close, drag handle is decorative only; a visible close button remains.
- `Dialog`: alert dialog only for irreversible or high-impact confirmation.
- `Toast`: polite live region, short confirmation, optional undo, never the only record of an error.
- `Menu`: roving focus, Escape close, returns focus to trigger.

### 6.11 System states

Every data component defines:

| State | Requirement |
|---|---|
| Loading | preserve layout; announce once; skeleton has no accessible duplicate content |
| Empty | state what is empty and offer one relevant next action |
| Error | explain what failed, preserve input, offer retry or alternative |
| Disabled | only when action is unavailable; explain why nearby |
| Offline | preserve local edits, show synchronization state |
| Success | confirm the object and destination: «میان‌وعده به ثبت امروز اضافه شد» |
| Partial | show saved progress and exact next step |

## 7. Voice and UX writing

### 7.1 Personality

Avocado is **clear, respectful, steady, and observant**. It does not cheerlead, diagnose, scold, or perform intimacy.

### 7.2 Writing rules

- Prefer direct verbs: «ثبت کنید», «ادامه دهید», «ویرایش کنید».
- Name the object: «برنامه غذایی» instead of ambiguous «برنامه» when context is mixed.
- Button labels describe the result: «افزودن به ثبت امروز», not «تأیید».
- Use conversational standard Persian, not bureaucratic Persian and not slang.
- Keep error messages non-accusatory: **«بارگذاری کامل نشد. فایل شما محفوظ است؛ دوباره تلاش کنید.»**
- Use «شما» sparingly; omit pronouns when the verb is clear.
- Do not call food clean, dirty, good, bad, forbidden, or guilty.
- Do not promise outcomes or use «قطعی», «تضمینی», «درمان» for plans or AI insights.

### 7.3 Representative microcopy

| Context | Copy |
|---|---|
| Empty daily log | «هنوز چیزی برای امروز ثبت نشده است.» |
| Quick action | «ثبت خوراک» |
| Copy planned meal | «ثبت بر اساس برنامه» |
| Saved progress | «پاسخ‌های شما ذخیره شد؛ هر زمان آماده بودید ادامه دهید.» |
| Upload processing | «فایل در حال بررسی است. می‌توانید از این صفحه خارج شوید.» |
| Report insufficient data | «برای نمایش روند، چند روز دیگر ثبت لازم است.» |
| AI safety | «پیشنهادهای هوشمند جایگزین نظر متخصص نیستند.» |

## 8. Accessibility and RTL contract

### 8.1 Document and language

- Root: `<html lang="fa" dir="rtl">`.
- Use semantic landmarks, sequential headings, and native controls first.
- Set user-generated text to `dir="auto"` and isolate it.
- Use `<bdi>` for names, filenames, and externally supplied inline values.
- Use `dir="ltr"` on phone, OTP, URL, email, file extension, and technical ID controls.

### 8.2 Keyboard and focus

- All actions are reachable and operable by keyboard.
- Focus order follows the RTL reading and DOM sequence; do not repair visual ordering with positive `tabindex`.
- `:focus-visible` uses a 3px outer focus treatment with at least 3:1 non-text contrast.
- Sticky headers, bottom navigation, sheets, and toasts must not obscure the focused element.
- Closing sheets/dialogs returns focus to the invoking control.

### 8.3 Touch

- Minimum implementation target: 44×44 CSS px for all primary and icon-only controls.
- Maintain at least 8px between adjacent compact targets.
- Dragging is never the only operation; provide buttons for reorder, dismiss, or adjustment.

### 8.4 Contrast and perception

- Body text and labels target 4.5:1; large text targets 3:1.
- Controls, focus indicators, chart lines, and state boundaries target 3:1 against adjacent colors.
- Status always combines color with text and/or icon/line style.
- Skeletons and disabled states remain visible but are removed from the interaction order.

### 8.5 Authentication and forms

- Labels remain visible; placeholders never replace them.
- Errors are linked with `aria-describedby` and summarized at submission when multiple fields fail.
- Previously entered values survive validation errors.
- OTP supports paste, platform autofill, and a single-field fallback.
- Required information is identified in text, not only with an asterisk.

## 9. Data visualization

- Default chart is a line, bar, or paired-track comparison—never a decorative radial gauge.
- Actual is a solid jade line; planned is a dashed indigo line; both are directly labelled.
- Values use tabular numerals and an accessible HTML table or equivalent text summary.
- Zero, missing, and not-applicable are distinct states.
- Scales start at zero for bars; line-chart truncation must be disclosed.
- Trend language is descriptive: «در ۵ روز از ۷ روز ثبت انجام شده» rather than «عملکرد ضعیف».

## 10. Implementation handoff

### Token sources

- `tokens/tokens.css` — CSS custom properties.
- `tokens/tokens.json` — Design Tokens Community Group-shaped JSON.
- `tokens/tokens.ts` — typed TypeScript constants.

### React contract

- All interactive primitives accept native element props and forward refs.
- Controlled state: `open/onOpenChange`, `value/onValueChange`, `selected/onSelectedChange`.
- Visual variants use semantic names: `tone="actual" | "plan" | "neutral" | "danger"`.
- Loading buttons expose `aria-busy` and retain their accessible name.
- Portalled content inherits `dir="rtl"` and the token scope.
- Components use CSS logical properties (`margin-inline`, `padding-block`, `inset-inline`, `border-start-start-radius`) exclusively for directional layout.
- No component assumes Western digit order from the page direction.

## 11. Quality gate

Before release, every component must pass:

1. Persian copy review for glyphs, ZWNJ, tone, and object naming.
2. RTL layout review at 360, 390, 430, 600, 768, 820, 1024, 1366, 1440, and 1920px.
3. Mixed-direction fixtures: `0912 345 6789`, `482913`, `plan-1405-04.pdf`, `AVO-7F31`, `۲۵۰ kcal`.
4. Keyboard-only completion and visible focus review.
5. Screen-reader labels, state announcements, and modal focus return.
6. 200% zoom and text reflow without horizontal scrolling.
7. Reduced-motion behavior.
8. Loading, empty, offline, error, disabled, partial, and success states.
9. Plan/log distinction using noun + shape, not color alone.
10. Medical and AI language review.

## 12. Research basis

- [W3C Arabic & Persian Layout Requirements](https://www.w3.org/International/alreq/) — RTL page structure and LTR number runs.
- [Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) — directional isolation and mixed-script behavior.
- [W3C inline bidi markup](https://www.w3.org/International/articles/inline-bidi-markup/bidi_examples.en.html) — `dir="auto"` and `<bdi>` patterns.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — focus, target size, authentication, input, and reflow requirements.
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) and [Estedad](https://github.com/aminabedi68/Estedad) — Persian/Arabic variable font coverage and OFL licensing.
- [Mobile dietary self-monitoring adherence research](https://pmc.ncbi.nlm.nih.gov/articles/PMC7156825/) — logging effort and adherence decline reinforce reuse and low-friction entry.
