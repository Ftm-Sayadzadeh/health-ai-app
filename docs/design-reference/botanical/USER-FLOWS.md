# Avocado User Flows

Source of truth: `DESIGN.md`, `implementation-plan.md`, existing Botanical prototypes, implemented routes/features, and current token/component files.

Production direction: Botanical only. Original prototypes are reference-only. This document is planning-only.

## Shared Flow Rules

- Every authenticated flow preserves Botanical shell behavior: mobile bottom navigation, desktop RTL side navigation, visible labels, 44px targets, and focus-visible states.
- Planned intent and actual consumption never collapse. Planned food only pre-fills the add-food form; actual logging happens only after user review and confirmation.
- All user-entered mixed-direction content uses `dir="auto"` or `<bdi>`. Phone, OTP, file names, IDs, and Latin calorie units are isolated LTR where needed.
- Errors preserve entered data. Offline states preserve local edits and show synchronization status.
- Success feedback names the object and destination, for example: «میان‌وعده به ثبت امروز اضافه شد».
- Safety language remains non-medical, non-judgmental, and non-promissory.

## 1. First Login and Onboarding

- Entry point: `/` landing or direct `/login`.
- Steps: open landing; choose login/start; enter phone; request OTP; enter OTP; verify; if first login, route to first-login welcome; start `/onboarding`; complete required profile steps; review answers; submit; arrive at `/dashboard`.
- User decisions: edit phone, resend OTP, save and exit onboarding, skip only optional sensitive fields, review/edit previous answers.
- Validation: phone format, OTP length/expiry, required profile fields, valid numeric measurements.
- Loading feedback: request OTP button loading; verification loading; onboarding submit loading; profile completion progress.
- Error behavior: invalid phone inline; incorrect OTP inline; expired OTP requires resend; API failure preserves entered data; session expiry sends user back to login with return intent.
- Cancel and back behavior: landing returns to public page; OTP can return to phone entry; onboarding back moves one step; save and exit returns to dashboard/profile prompt if authenticated.
- Data preserved: phone until verification, OTP until failure correction, onboarding partial answers, return destination after auth.
- Success destination: `/dashboard` with completed or partial profile state.
- Accessibility considerations: OTP paste support, LTR code cells, visible labels, keyboard step navigation, focus moves to first invalid field or next step title.

## 2. Returning User Login

- Entry point: `/login` after logout, session expiry, or direct route guard.
- Steps: enter phone; request OTP; enter OTP; verify; app refreshes/persists JWT session; return to originally requested protected route or `/dashboard`.
- User decisions: edit phone, resend code, abandon login.
- Validation: phone format, OTP required and six digits.
- Loading feedback: separate request and verification loading states.
- Error behavior: incorrect/expired OTP shown without clearing all cells; API failure offers retry; repeated failures do not shame user.
- Cancel and back behavior: back to landing from phone screen; back to phone from OTP screen.
- Data preserved: requested destination, phone value, cooldown state.
- Success destination: requested route or `/dashboard`.
- Accessibility considerations: `autocomplete="tel"` and `autocomplete="one-time-code"`, live countdown text, no motion-only cooldown.

## 3. Completing and Editing Health Profile

- Entry point: first-login onboarding, dashboard incomplete-profile card, or `/profile`.
- Steps: open profile/onboarding; complete basic information; add measurements; choose goal/activity; add preferences/restrictions; optionally add sensitive information; review; save.
- User decisions: continue now, save and exit, edit a previous section, leave optional fields blank.
- Validation: required text/select/numeric fields; valid ranges; no hidden required fields.
- Loading feedback: save button loading; profile overview skeleton while loading.
- Error behavior: field-level errors plus summary; API save error preserves values.
- Cancel and back behavior: cancel returns to previous route; save and exit stores partial progress.
- Data preserved: all completed sections, partial step, dirty form values after errors.
- Success destination: `/profile` for edits, `/dashboard` or `/plans/intake` after onboarding depending on product state.
- Accessibility considerations: grouped fieldsets, clear required labels, sensitive-field explanations, mixed values isolated.

## 4. Logging Food Manually

- Entry point: `/nutrition`, dashboard primary CTA «ثبت خوراک», or empty meal group add action.
- Steps: open add-food sheet; choose meal selector; choose manual tab; enter food name, quantity, unit, and user-entered calories; optionally save for later; submit.
- User decisions: choose meal, save custom food for later, cancel sheet, correct values.
- Validation: food name required, meal required, amount/calories valid where required.
- Loading feedback: submit area loading and disabled duplicate submit.
- Error behavior: validation errors inline; API failure keeps sheet open and preserves form.
- Cancel and back behavior: close sheet returns to current day without changing data.
- Data preserved: selected meal, manual form draft until submit/cancel decision.
- Success destination: `/nutrition` current day, selected meal group populated/updated.
- Accessibility considerations: one meal selector, one tab selector, only manual tab content, one submit area; focus returns to opener after close.

## 5. Logging from Recent Foods

- Entry point: `/nutrition` add-food sheet.
- Steps: open sheet; choose meal; choose recent tab; wait for recent foods; select recent food; review quantity/calories; submit.
- User decisions: change meal, edit amount/calories, switch tab, cancel.
- Validation: selected recent food and meal required; quantity/calories editable.
- Loading feedback: recent-list skeleton.
- Error behavior: empty recent state points to manual entry; API failure preserves selected food.
- Cancel and back behavior: close sheet returns to nutrition day.
- Data preserved: selected food, last quantity prefill, selected meal.
- Success destination: `/nutrition` with actual log in selected meal.
- Accessibility considerations: recent foods are actual previous logs; list item buttons have clear labels; selection is not color-only.

## 6. Logging from Saved Foods

- Entry point: `/nutrition` add-food sheet or `/nutrition/foods`.
- Steps: open sheet; choose meal; choose saved tab; select saved/custom food; review quantity/calories; submit.
- User decisions: edit amount/calories, create/edit saved food, switch tab, cancel.
- Validation: saved item and meal required; editable values validated.
- Loading feedback: saved-list skeleton.
- Error behavior: empty saved state offers create custom food or manual entry; API failure preserves selection.
- Cancel and back behavior: close sheet without logging.
- Data preserved: selected meal, saved item, editable quantity/calorie fields.
- Success destination: `/nutrition`.
- Accessibility considerations: use term «خوراک‌های ذخیره‌شده»; isolate numeric values; selection state includes text/shape.

## 7. Creating a Custom Food

- Entry point: `/nutrition/foods` or add-food sheet saved/manual area.
- Steps: open custom food form; enter name, default unit, default calories, optional notes; save; optionally log it.
- User decisions: save only, save and log, cancel, delete existing custom food.
- Validation: required name/unit/calories if product requires; numeric values valid.
- Loading feedback: save button loading.
- Error behavior: inline validation; API error preserves draft.
- Cancel and back behavior: cancel returns to saved foods list or sheet tab.
- Data preserved: draft values and source context.
- Success destination: `/nutrition/foods` populated list or add-food sheet with new item selected.
- Accessibility considerations: saving custom food must not automatically create an actual log; confirmation copy distinguishes saved object from logged entry.

## 8. Creating a Nutrition Plan

- Entry point: `/plans`, `/plans/new`, or dashboard no-plan card.
- Steps: open plans; choose new plan; select nutrition plan; complete/attach source or intake as required; create draft; open `/plans/[id]`.
- User decisions: use intake, upload attachment, save draft, cancel.
- Validation: plan name/type required; required intake fields if starting from questionnaire.
- Loading feedback: create-plan loading and plan-detail skeleton.
- Error behavior: API failure preserves draft form; validation errors inline.
- Cancel and back behavior: back to `/plans`; unsaved changes confirmation if needed.
- Data preserved: draft plan fields, attachment metadata, intake progress.
- Success destination: `/plans/[id]` draft nutrition plan.
- Accessibility considerations: plan cards use Indigo outline plus explicit «برنامه غذایی» label.

## 9. Creating a Workout Plan

- Entry point: `/plans`, `/plans/new`, or dashboard no workout plan state.
- Steps: open new plan; choose workout plan; complete workout intake or create draft manually; save; open plan detail.
- User decisions: intake vs manual draft, upload attachment, save and exit.
- Validation: plan type/title and required workout fields.
- Loading feedback: create loading, skeleton for plan detail.
- Error behavior: preserve draft on validation/API failure.
- Cancel and back behavior: cancel returns to plans list.
- Data preserved: workout draft, intake answers, attachment status.
- Success destination: `/plans/[id]` draft or active workout plan.
- Accessibility considerations: qualified safety note; no implication of medical/training authority.

## 10. Uploading a Plan Attachment

- Entry point: `/plans/[id]` attachment section.
- Steps: select PDF/image; validate type/size; upload; show progress; show uploaded file; allow view/download/replace/remove.
- User decisions: retry failed upload, replace, remove, continue without attachment.
- Validation: accepted file type, size limit, file presence.
- Loading feedback: uploading progress with filename and percent/status where available.
- Error behavior: upload failure says file is preserved and retry is available.
- Cancel and back behavior: cancel upload if supported; otherwise keep page usable.
- Data preserved: selected file metadata, plan draft, previous attachment until replacement succeeds.
- Success destination: same plan detail with attachment visible.
- Accessibility considerations: file names in `<bdi dir="auto">`; progress announced; remove/replace confirmation named by file.

## 11. Structuring Nutrition Plan Meals

- Entry point: `/plans/[id]` nutrition plan detail.
- Steps: open structured meals; add meal groups/items; enter planned food, amount, calories if known; move/edit/delete items; save.
- User decisions: add item, edit item, move item, delete item, leave missing calorie as unknown if allowed.
- Validation: planned item name and meal group required; calorie missing state shown honestly.
- Loading feedback: save/loading state per form or section.
- Error behavior: API failure preserves structured draft; validation shows exact field.
- Cancel and back behavior: cancel item edit returns to plan detail.
- Data preserved: draft structured meals, order, missing calorie markers.
- Success destination: `/plans/[id]` populated structured nutrition plan.
- Accessibility considerations: planned items use Indigo outlined semantic and explicit «برنامه» noun; no actual-log totals inside plan.

## 12. Logging Food Based on a Planned Item

- Entry point: `/nutrition` planned meals section or `/plans/[id]` planned item action.
- Steps: user chooses «ثبت بر اساس برنامه»; add-food sheet opens; planned item pre-fills food name/quantity/calories; user reviews and edits; user selects/confirm meal/date; submit creates actual log.
- User decisions: accept prefilled values, edit quantity/calories, cancel, change meal/date if supported.
- Validation: same as add-food manual/selected item; user confirmation required.
- Loading feedback: submit loading only after confirmation.
- Error behavior: API error preserves prefilled draft.
- Cancel and back behavior: cancel returns to source plan/nutrition page without logging.
- Data preserved: source planned item id, edited quantity/calories, destination date/meal.
- Success destination: `/nutrition` destination day with actual Jade log.
- Accessibility considerations: visual and copy distinction must be explicit: planned intention is Indigo outline; actual log is Jade solid. Planned item never logs automatically.

## 13. Completing Nutrition Intake

- Entry point: `/plans/intake` or `/plans/intake/nutrition`.
- Steps: choose nutrition intake; answer steps; save progress as needed; review answers; submit; create/update nutrition plan draft.
- User decisions: back, save exit, edit previous answers, submit.
- Validation: required answers per step; text fields valid.
- Loading feedback: step transition minimal; submit loading; saved progress toast.
- Error behavior: validation summary; API failure preserves answers.
- Cancel and back behavior: save exit returns to plans or dashboard with resume card.
- Data preserved: all answers, current step, linked draft plan.
- Success destination: `/plans/[id]` nutrition draft or `/plans`.
- Accessibility considerations: progress announced; selected/unselected choices visible beyond color.

## 14. Completing Workout Intake

- Entry point: `/plans/intake` or `/plans/intake/workout`.
- Steps: choose workout intake; answer activity/equipment/limitations/preferences; review; submit; create/update workout plan draft.
- User decisions: skip optional, save exit, edit previous answers.
- Validation: required answers and safe numeric/text input.
- Loading feedback: submit loading; saved progress confirmation.
- Error behavior: validation and API errors preserve answers.
- Cancel and back behavior: save exit returns to plans/dashboard resume card.
- Data preserved: current step, answers, linked workout draft.
- Success destination: `/plans/[id]` workout draft or `/plans`.
- Accessibility considerations: safety wording says plans are not a substitute for qualified professional advice.

## 15. Activating, Archiving, and Reactivating a Plan

- Entry point: `/plans` list or `/plans/[id]`.
- Steps: open plan; choose activate/archive/reactivate; show confirmation if action changes active plan or destructive visibility; submit; update plan state.
- User decisions: confirm, cancel, choose replacement behavior if another active plan exists.
- Validation: plan must be eligible; archived plans are read-only before reactivation.
- Loading feedback: action button loading; disabled duplicate action.
- Error behavior: API failure keeps previous plan state and offers retry.
- Cancel and back behavior: confirmation cancel returns to unchanged plan detail.
- Data preserved: previous active plan, draft/archived content, attachments.
- Success destination: same plan detail or `/plans` with updated active/draft/archived badge.
- Accessibility considerations: state badges use text plus shape/color; disabled controls explain archived state.

## 16. Handling Validation Errors

- Entry point: any form: auth, onboarding, profile, nutrition, foods, plans, attachments, intake.
- Steps: user submits invalid form; show summary if multiple fields; focus first invalid field; keep values; user fixes; resubmits.
- User decisions: fix now, cancel, save exit when allowed.
- Validation: field-level requirements; mixed-direction and numeric constraints.
- Loading feedback: no loading if client validation fails; server validation returns API/field state.
- Error behavior: non-accusatory copy; no hidden errors.
- Cancel and back behavior: cancel discards only after confirmation if dirty.
- Data preserved: all entered values until user confirms discard.
- Success destination: intended next step after valid submit.
- Accessibility considerations: `aria-invalid`, `aria-describedby`, error summary with links/focus.

## 17. Handling Offline Mode

- Entry point: any authenticated route while network is unavailable or API request fails due to connectivity.
- Steps: show offline banner/state; preserve local edits where possible; disable unsafe destructive remote actions; allow read of cached content; retry sync when online.
- User decisions: keep editing locally, retry, cancel/discard local draft.
- Validation: local form validation still applies.
- Loading feedback: sync pending indicator, not infinite spinner.
- Error behavior: distinguish offline from server/API failure.
- Cancel and back behavior: navigating away warns if unsynced edits may be lost.
- Data preserved: food draft, profile edits, intake answers, plan draft, attachment metadata if selected.
- Success destination: original route with synced data and success toast.
- Accessibility considerations: offline banner is announced; controls explain disabled state nearby.

## 18. Handling an Expired Session

- Entry point: protected route receives auth failure or JWT refresh fails.
- Steps: show session expired state/modal; preserve attempted route and unsaved local draft if possible; send user to `/login`; complete OTP login; return to preserved route.
- User decisions: log in again, go to public landing, discard local draft if necessary.
- Validation: standard login validation.
- Loading feedback: refresh attempt loading should be brief; login request/verification loading as in auth flow.
- Error behavior: do not expose token details; repeated auth failure stays on login.
- Cancel and back behavior: cancel returns to public landing or locked route explanation.
- Data preserved: return URL, safe local drafts, entered form values when possible.
- Success destination: original protected route or `/dashboard`.
- Accessibility considerations: modal/screen has clear heading, focus trap if modal, and focus returns after reauth where possible.

## Recommended Flow Design Order

1. Auth and session expiry.
2. Dashboard MVP states.
3. Daily nutrition and exact add-food sheet.
4. Saved/custom foods.
5. Plans list, new plan, and plan detail states.
6. Attachments and structured nutrition plan.
7. Intake questionnaires.
8. Profile/onboarding reconciliation.
9. Offline and global error polish across all MVP flows.
