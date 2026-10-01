# MVP Design Foundation

Source of truth: `DESIGN.md`, `SCREEN-MATRIX.md`, `USER-FLOWS.md`, `implementation-plan.md`, `tokens/tokens.css`, `styles.css`, `src/components.tsx`, `src/components.css`, and existing Botanical prototypes.

This document defines the canonical MVP UI foundation. It is design-only and does not modify production code, `DESIGN.md`, or token files.

## 1. Final Botanical Visual Direction

Botanical is the only production direction.

The MVP interface should feel Persian-first, RTL-first, calm, warm, mature, friendly, daily-use, and wellness-oriented. It must not feel childish, clinical, corporate, admin-dashboard-like, or generic SaaS. Avocado branding stays restrained: use the mark or wordmark selectively, avoid repeated mascot moments, avoid excessive lime, avoid giant glows, and avoid random decorative blobs.

Original prototypes are reference-only and must not be used as the active visual direction.

## 2. Color Semantics

Use existing Botanical token values from `tokens/tokens.css`.

- Canvas: warm botanical mineral background through `--av-color-canvas`.
- Surface: cards, fields, sheets, and dialogs through `--av-color-surface`.
- Ink: primary Persian text through `--av-color-ink-strong` and regular copy through `--av-color-ink`.
- Muted ink: supporting copy through `--av-color-ink-muted`.
- Jade primary: actual logging and core repeated product actions through `--av-color-primary`.
- Indigo plan: planned/intended data only through `--av-color-plan`.
- Citron pulse: selected detail, small celebratory highlight, or active nav marker only. Never use it for body text or large surfaces.
- Semantic status colors: success, warning, danger, and info must always be paired with text, icon, shape, or line style.

Do not add unrelated colors. Do not use green as decoration everywhere. Jade and Indigo should not appear as competing primary CTAs in one control group.

## 3. Typography Hierarchy

Use Kalameh for all Persian UI.

- Page display: 26-34px equivalent, weight around 760-780, line-height 1.3.
- Page title: 22-28px, weight 700-780, line-height 1.35-1.45.
- Section title: 18-22px, weight 650-700.
- Body: 16px, weight 400, line-height around 1.75.
- Compact body: 14px, weight 400-500, line-height around 1.7.
- Label: 14px, weight 600-650.
- Caption: 12px, weight 500.
- Button: 15px, weight 650.

Rules:

- No Latin letter spacing on Persian text.
- Use Persian digits in prose and summary metrics.
- Use LTR isolation for phone, OTP, file names, IDs, URLs, and technical calorie values when needed.
- Use correct Persian ی and ک.
- Preserve ZWNJ in words such as `می‌خواهم`, `ثبت‌شده`, and `خوراک‌های`.

## 4. Spacing Rules

Use the 4px base system already present in tokens.

- Mobile gutters: 16px at 360-430px.
- Small tablet gutters: 20px around 600-744px.
- Tablet gutters: 24px around 768-834px.
- Desktop gutters: 32px at 1280px and above.
- Cards: 16-24px padding depending on density.
- Form groups: 12-16px vertical rhythm.
- Repeated list items: 10-14px internal gaps.
- Main authenticated content max width: approximately 72-76rem.
- Reading content max width: approximately 42rem.

Mobile pages are one decisive column. Desktop may use split panes only when the secondary pane has real purpose.

## 5. Radius Rules

Use the existing Botanical asymmetry carefully.

- Inputs and compact controls: 10-16px.
- Cards and list items: about 14-18px, with subtle asymmetric lower corner when useful.
- Sheets: 24-28px at top corners, square at viewport edge on mobile.
- Dialogs: 22-26px.
- Pills: only for filters, statuses, and compact quantities. Do not turn every component into a pill.
- Avocado mark container: small rounded square/soft asymmetric shape only when the mark needs a container.

## 6. Shadow Rules

Permanent content should use border and surface shifts, not heavy shadows.

- No shadow for ordinary cards.
- Use Shadow 1 only for raised actionable cards or sticky CTA.
- Use Shadow 2 only for sheets, dialogs, and toasts.
- Avoid large glows.
- Avoid decorative gradients behind content.

## 7. App Shell Behavior

The shell has these canonical regions:

- Public page header for logged-out pages.
- Authenticated app header for protected routes.
- Page title region with optional back action.
- Supporting text under the page title.
- Main content container.
- Controlled desktop content width.
- Mobile safe-area bottom spacing.
- Mobile bottom navigation.
- Desktop RTL side navigation.
- Sticky action area.
- Bottom sheet.
- Desktop modal.
- Toast.
- Confirmation dialog.
- Offline banner.
- Session-expired state.

Authenticated pages should never expose design controls, viewport controls, theme controls, or generated metadata as product UI.

## 8. Mobile Navigation

Mobile navigation is fixed to four destinations:

1. امروز
2. ثبت غذا
3. برنامه‌ها
4. من

Requirements:

- Labels always visible.
- Minimum target 44px.
- Safe-area padding included.
- Active state uses background, text color, and weight; not color alone.
- Navigation must not cover inputs or sticky submit areas.
- Primary action remains reachable above the nav.

## 9. Desktop Navigation

Desktop navigation uses an RTL side rail only when useful, generally from 1024px and above.

Requirements:

- Same destination labels and order as mobile.
- Clear active state.
- Calm and compact.
- Product-like, not admin-dashboard-like.
- No excessive icon decoration.
- Side rail should not force excessive empty content width.

## 10. Planned-Versus-Actual Contract

This is a permanent design-system rule.

- Planned food means intention.
- Logged food means actual consumption.
- Planned food uses Indigo outlined styling.
- Actual food uses Jade solid styling.
- Never rely on color alone.
- Use explicit Persian labels such as «برنامه غذایی», «برنامه تمرینی», «ثبت‌شده امروز», and «ثبت خوراک امروز».
- Planned food may prefill a logging form.
- Planned food must never appear as automatically consumed.
- The user must review quantity and calories before creating an actual food log.
- A planned item copied into the food form creates a new actual log only after user confirmation.
- Plan screens must not display actual-log totals as if they are part of the plan.
- Comparison visuals use dashed/outlined plan and solid actual with direct labels.

## 11. Button Hierarchy

- Primary button: Jade, for core actual product actions such as «ثبت خوراک», «افزودن به ثبت امروز», and save/continue where it completes the current task.
- Secondary button: bordered surface, for navigation, view, edit, or lower-emphasis continuation.
- Ghost button: transparent Jade text, for low-impact actions inside dense UI.
- Destructive button: danger token, only for destructive confirmation.
- Plan button: Indigo only inside a clearly labelled plan context. Do not place it beside a Jade primary in a way that creates equal competing CTAs.
- Disabled button: explain nearby why the action is unavailable.
- Loading button: keep accessible name and expose busy state.

## 12. Card Hierarchy

- Basic card: stable content, border, white surface, no heavy elevation.
- Action card: one clear action, short supporting copy, touch target area.
- List item: compact repeated row, optional leading glyph, text, value/action.
- Meal group: heading, item count, subtotal only if source data exists, add action.
- Plan card: Indigo outlined semantic, plan type label, source/status, active/draft/archived state.
- State card: empty/loading/error/success panel with one relevant next action.

Cards should not be nested inside cards. Section bands and page backgrounds should remain unframed unless the element is a real repeated item or modal-like layer.

## 13. Form Behavior

- Labels are always visible.
- Placeholders are hints only, never labels.
- Preserve values after validation and API errors.
- Errors appear at field level and in a form summary when multiple fields fail.
- Required fields are identified in text.
- `aria-invalid` and `aria-describedby` are required for invalid fields.
- Phone fields are LTR inside a Persian labelled control.
- OTP inputs are LTR, paste-capable, and support one-time-code autocomplete.
- Numeric values use tabular numerals where useful.
- Forms are single-column on mobile.
- Desktop may use two columns only for related short fields.
- Sticky footer/submit area must not cover fields.

## 14. Sheet and Dialog Behavior

Bottom sheets:

- Used for mobile task flows such as add-food.
- Full-width with safe margins on mobile.
- Reasonable max width on tablet/desktop.
- Visible close button.
- Escape/cancel behavior.
- Focus trap and focus return.
- Drag handle decorative only.

Dialogs/modals:

- Used for confirmation, file details, and high-impact decisions.
- Must stay readable on desktop and not become oversized.
- Destructive confirmations name the object and consequence.
- Routine food deletion should use undo instead of a blocking confirmation unless deleting multiple entries.

## 15. File Upload Behavior

- Accepted file types and size limit are visible.
- File name is isolated using `<bdi dir="auto">`.
- Upload progress is text/perceivable, not only motion.
- Upload failure preserves the selected file and offers retry.
- Replace/remove actions require confirmation when destructive.
- OCR or extraction should not be implied unless that feature is implemented.
- Do not claim perfect recognition of uploaded files.

## 16. Loading, Empty, Error, and Success Behavior

Loading:

- Preserve layout.
- Announce once.
- Use skeleton when it communicates structure.
- Avoid indefinite decorative spinners when a skeleton is better.

Empty:

- State what is empty.
- Offer one relevant action.
- Avoid blame or motivation-heavy copy.

Partial:

- Show saved progress.
- Name the exact next step.

Error:

- Explain what failed.
- Preserve user input.
- Offer retry or alternative.
- Distinguish validation, API, offline, permission, and session errors.

Success:

- Confirm object and destination.
- Use toast or panel.
- Offer undo when the action is routinely reversible.

## 17. RTL Rules

- Root is `lang="fa"` and `dir="rtl"`.
- Use logical CSS properties for directional layout.
- Directional icons mirror only when meaning changes.
- Universal icons such as plus, check, warning, play, and file type do not mirror by default.
- Phone, OTP, URL, email, file extension, IDs, and technical values use LTR isolation.
- User-generated mixed text and filenames use `dir="auto"` or `<bdi>`.
- Focus order follows DOM and RTL reading order.
- Do not repair visual order with positive tabindex.

## 18. Accessibility Rules

- All primary and icon-only actions are at least 44x44px.
- Icon-only buttons require accessible names.
- Primary navigation always has visible labels.
- Keyboard-only completion must work.
- Focus-visible treatment must be obvious.
- Toasts and async feedback use polite live regions.
- Errors use role alert or described-by links as appropriate.
- Status is never communicated only by color.
- Reduced motion collapses transforms and long animations.
- 200% zoom must not introduce horizontal scroll.
- Contrast targets WCAG 2.2 AA.

## 19. Future Page Design Rules

Every future MVP page must follow these rules:

1. Use Botanical only.
2. Reuse the shell, navigation, form, card, overlay, and state patterns from the foundation files.
3. Keep one primary action per screen.
4. Keep plan and actual semantics separate with noun plus shape plus color.
5. Group states into the relevant screen artifact; do not create separate pages for every loading/error/empty state.
6. Do not mix Next Development or Future Concept features into Current MVP pages.
7. Do not add new colors, fonts, decorative blobs, mascot repetition, or SaaS-dashboard chrome.
8. Do not invent metrics, health claims, AI capabilities, OCR behavior, or food database results.
9. Use honest placeholders when source data is not available.
10. Preserve Persian copy quality, ZWNJ, RTL layout, and mixed-direction isolation.
11. Preserve user-entered data after errors.
12. Include loading, empty, error, success, disabled, offline, and partial states where the screen can reach them.
13. Use route-accurate labels and navigation.
14. Keep desktop layout useful but restrained; no excessive empty space.
15. Keep mobile screens usable at 360, 390, and 430px before widening.
