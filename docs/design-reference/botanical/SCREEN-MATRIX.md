# Avocado Screen Matrix

Source of truth: `DESIGN.md`, `implementation-plan.md`, existing Botanical prototypes, `tokens/tokens.css`, `styles.css`, `app.js`, `src/components.tsx`, and `src/components.css`.

Production direction: Botanical only. Original prototypes are reference-only. This document is planning-only and does not change existing screens, tokens, or application code.

## Matrix Legend

- Scope: Current MVP means required by the implemented routes and features listed by product; Next Development means design before the next feature build; Future Concept means long-term and should not be mixed into the current app.
- Priority: P0 blocks a complete MVP user journey; P1 supports reliable daily use; P2 is helpful but not required before the MVP is coherent.
- State codes: L loading, SK skeleton, E empty, P populated, PD partial data, V validation error, API API failure, OFF offline, PERM permission denied, S success, D disabled, C confirmation, U undo, SE session expired, NF 404, RO read-only or archived.
- Responsive baseline for every Current MVP screen: mobile-first at 360, 390, and 430px with bottom navigation where authenticated; 600-834px uses wider sheets and two-column cards where useful; 1024px+ uses RTL side navigation and split panes only when they improve scanning.
- RTL/accessibility baseline for every screen: `<html lang="fa" dir="rtl">`, Kalameh for Persian UI, visible labels, 44px minimum touch targets, focus-visible treatment, no positive tabindex, keyboard completion, live-region feedback for async state, `dir="ltr"` or `<bdi dir="auto">` for phone, OTP, file names, IDs, calorie values, and mixed text.
- Safety baseline: no diagnosis, no shame language, no red/green-only status, no medical promises. AI wording appears only where AI-assisted suggestions are actually present.

## A. Current MVP

These screens and states are required for the currently implemented routes and features.

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Landing | آووکادو | `/` | P0 | `index-botanical.html` | Partial: marketing page exists, needs route-aware MVP entry | Revise | Start login | Learn product promise | L, P, API, SE | Must lead to `/login`; Botanical brand, no Original toggle. |
| AUTH-02 | Phone number entry | ورود یا ساخت حساب | `/login` | P0 | `auth-botanical.html` | Good visual reference; validate against implemented auth | Revise lightly | Request OTP | Back to landing | L, V, API, D, S | Phone field LTR, numeric keyboard, visible privacy/auth notice. |
| AUTH-03 | Invalid phone number | ورود یا ساخت حساب | `/login` | P0 | `auth-botanical.html` | Partial | Revise | Correct phone | Clear input | V, D | Error copy non-accusatory; preserve entered value. |
| AUTH-04 | Request loading | ورود یا ساخت حساب | `/login` | P0 | `auth-botanical.html` | Partial | Revise | Wait for OTP request | Cancel/back if safe | L, D, API | Button keeps accessible name with `aria-busy`; no spinner-only feedback. |
| AUTH-05 | OTP entry | کد تایید | `/login` | P0 | `otp-botanical.html` | Good visual reference | Revise lightly | Verify code | Edit phone, resend | L, V, API, D, S | OTP cells LTR, paste support, autocomplete one-time-code. |
| AUTH-06 | Incorrect OTP | کد تایید | `/login` | P0 | `otp-botanical.html` | Partial | Revise | Re-enter OTP | Resend | V, API | Copy: «کد درست نیست؛ دوباره بررسی کنید.» |
| AUTH-07 | Expired OTP | کد تایید | `/login` | P0 | `otp-botanical.html` | Partial | Revise | Request new code | Edit phone | V, API, D | Expiry text announced; old code remains visible until user edits. |
| AUTH-08 | Resend cooldown | ارسال دوباره کد | `/login` | P1 | `otp-botanical.html` | Partial | Revise | Wait or resend | Edit phone | L, D, S | Cooldown textual, not motion-only. |
| AUTH-09 | Verification loading | کد تایید | `/login` | P0 | `otp-botanical.html` | Partial | Revise | Wait for verification | None while submitting | L, D, API, S | Prevent duplicate submit; preserve OTP on failure. |
| AUTH-10 | Session expired | نشست منقضی شد | Global auth guard | P0 | None | Missing | New | Log in again | Return to last safe page after login | SE, C, L, API | Modal/screen must explain without blame and not expose token details. |
| AUTH-11 | First-login welcome | خوش آمدید | `/onboarding` or post-login redirect | P0 | `welcome-botanical.html` | Partial: prototype welcome exists | Revise | Start onboarding | Skip only if profile complete | L, P, S | Keep concise; do not create separate marketing page after auth. |

### Onboarding and Profile

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PROF-01 | Onboarding introduction | تکمیل اطلاعات | `/onboarding` | P0 | `onboarding-botanical.html` | Partial: broad 11-step flow exists | Revise | Begin profile | Save and exit | L, P, PD, API | Explain why data is requested; no diagnosis language. |
| PROF-02 | Basic information | اطلاعات پایه | `/onboarding` | P0 | `onboarding-botanical.html` | Partial | Revise | Continue | Back, save exit | V, API, PD, S | Mixed numbers isolated; labels stay visible. |
| PROF-03 | Measurements | وزن و اندازه‌ها | `/onboarding`, `/profile` | P0 | `onboarding-botanical.html`, `body-botanical.html` | Partial: body page is Next Dev, not exact MVP profile edit | Revise | Save measurements | Back | V, API, PD, S | Weight values LTR or isolated; neutral language only. |
| PROF-04 | Goal and activity | هدف و فعالیت | `/onboarding`, `/profile` | P0 | `onboarding-botanical.html` | Partial | Revise | Choose goal/activity | Back, save exit | V, PD, S | No outcome guarantees. |
| PROF-05 | Food preferences | ترجیح‌های غذایی | `/onboarding`, `/profile` | P0 | `onboarding-botanical.html` | Partial | Revise | Select preferences | Add free text | V, PD, S | Use checkboxes/chips with text, not color-only selection. |
| PROF-06 | Food restrictions | محدودیت‌های غذایی | `/onboarding`, `/profile` | P0 | `onboarding-botanical.html` | Partial | Revise | Select restrictions | Add note | V, PD, S | Sensitive and allergy data need explanatory copy. |
| PROF-07 | Optional sensitive information | اطلاعات اختیاری حساس | `/onboarding`, `/profile` | P1 | `onboarding-botanical.html`, `profile-botanical.html` | Partial | Revise | Save optional data | Skip | V, PD, S | Make optionality explicit; never infer risk from incomplete data. |
| PROF-08 | Progress state | پیشرفت تکمیل اطلاعات | `/onboarding`, `/profile` | P0 | `onboarding-botanical.html`, `profile-botanical.html` | Partial | Revise | Continue next section | Save and exit | L, PD, S | Percentage is completeness only, not health score. |
| PROF-09 | Save and exit | ذخیره و خروج | `/onboarding` | P0 | `onboarding-botanical.html` | Partial | Revise | Save draft | Continue | L, API, S, D | Must preserve answers locally/server-side before exit. |
| PROF-10 | Resume progress | ادامه تکمیل اطلاعات | `/dashboard`, `/onboarding` | P0 | `dashboard-botanical.html`, `onboarding-botanical.html` | Partial | Revise | Resume step | Dismiss only if allowed | L, PD, API | Dashboard continue card required when incomplete. |
| PROF-11 | Review answers | مرور پاسخ‌ها | `/onboarding` | P0 | `onboarding-botanical.html` | Partial | Revise | Submit profile | Edit section, save exit | L, V, API, S | Group answers with edit links; no hidden required sections. |
| PROF-12 | Completed profile | پروفایل تکمیل شد | `/profile` | P0 | `profile-botanical.html`, `settings-botanical.html` | Partial | Revise | View profile | Edit | L, P, API | Show profile completeness as completed, not wellness score. |
| PROF-13 | Profile overview | پروفایل | `/profile` | P0 | `profile-botanical.html`, `settings-botanical.html` | Partial: split between two prototypes | Revise | Review profile | Edit, open plans/intakes | L, E, P, PD, API, SE | Current route is `/profile`; settings-only content should not dominate. |
| PROF-14 | Profile edit | ویرایش پروفایل | `/profile` | P0 | `profile-botanical.html`, `settings-botanical.html` | Partial | Revise | Save changes | Cancel/back | L, V, API, S, D | Preserve values on errors. |
| PROF-15 | Validation and save errors | خطای ذخیره اطلاعات | `/profile`, `/onboarding` | P0 | Partial across forms | Partial | Revise | Fix fields/retry | Save exit | V, API, D | Error summary plus field-level errors. |
| PROF-16 | Successful save | اطلاعات ذخیره شد | `/profile`, `/onboarding` | P0 | Toast patterns exist | Partial | Revise | Continue | Back/dashboard | S | Toast or panel must name saved object and destination. |

### Dashboard

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DASH-01 | Incomplete profile | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | Continue profile | View later | L, PD, API | ContinueCard must be prominent. |
| DASH-02 | Completed profile | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | ثبت خوراک | View plans/profile | L, P, API | Today before archive. |
| DASH-03 | No food logged today | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | ثبت خوراک | View plan | E, P | Empty copy: «هنوز چیزی برای امروز ثبت نشده است.» |
| DASH-04 | Food already logged today | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | Add another food | Edit nutrition | P, S, API | Show actual logs with Jade solid semantic. |
| DASH-05 | No plans | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | Create plan | Complete intake | E, PD | Do not show fake plan data. |
| DASH-06 | Active nutrition plan | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | View nutrition plan | Log based on planned item | P, API | Planned content uses Indigo outline and explicit «برنامه غذایی». |
| DASH-07 | Active workout plan | امروز | `/dashboard` | P1 | `dashboard-botanical.html` | Partial | Revise | View workout plan | Continue intake | P, API | Workout is plan management in MVP, not full execution unless implemented. |
| DASH-08 | Unfinished intake questionnaire | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | Resume intake | View drafts | PD, API | Nutrition/workout intake cards need exact next step. |
| DASH-09 | Clear primary daily action | امروز | `/dashboard` | P0 | `dashboard-botanical.html` | Partial | Revise | ثبت خوراک | Create/view plans | P, D | Primary CTA must be Jade and not compete with Indigo plan action. |

### Daily Nutrition

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NUTR-01 | Empty day | تغذیه امروز | `/nutrition` | P0 | `food-log-botanical.html` | Partial: route and sheet structure differ | Revise | Add food | Change date | L, E, API, OFF | Empty day must show meal groups without fake entries. |
| NUTR-02 | Populated day | تغذیه امروز | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Add/edit food | Delete, change date | L, P, API, OFF, U | Totals based only on user-entered calories. |
| NUTR-03 | Previous day | تغذیه روز قبل | `/nutrition?date=...` | P0 | `food-log-botanical.html` | Missing exact state | New/revise | View/edit day | Next/today | L, E, P, API | Date controls must not assume calendar without implementation confirmation. |
| NUTR-04 | Today | تغذیه امروز | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Add food | Previous/next | L, E, P, API | Today is default and easiest to return to. |
| NUTR-05 | Next day | تغذیه روز بعد | `/nutrition?date=...` | P1 | None exact | New | View planned/empty day | Back/today | L, E, API, D | Future actual logging may be disabled if implementation disallows. |
| NUTR-06 | Breakfast group | صبحانه | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Add breakfast food | Edit/delete entries | E, P, V, API | Meal group heading, count, subtotal if data exists. |
| NUTR-07 | Lunch group | ناهار | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Add lunch food | Edit/delete entries | E, P, V, API | Same MealGroup pattern. |
| NUTR-08 | Dinner group | شام | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Add dinner food | Edit/delete entries | E, P, V, API | Same MealGroup pattern. |
| NUTR-09 | Snack group | میان‌وعده | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Add snack | Edit/delete entries | E, P, V, API | Success copy can name snack destination. |
| NUTR-10 | Other group | سایر | `/nutrition` | P0 | None exact | New | Add other food | Edit/delete entries | E, P, V, API | Required by implemented meal groups. |
| NUTR-11 | Add food | افزودن خوراک | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial: current prototype includes extra barcode/photo modules | Revise | Submit food | Save custom, cancel | L, V, API, S, D | Sheet must use exact structure defined below. |
| NUTR-12 | Edit food | ویرایش خوراک | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Save changes | Cancel/delete | L, V, API, S, D | Preserve existing values; calories user-entered. |
| NUTR-13 | Delete food | حذف خوراک | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Delete | Cancel | C, API, U | Routine delete should use undo, not blocking dialog unless multi-entry. |
| NUTR-14 | Delete with undo | خوراک حذف شد | `/nutrition` | P0 | Toast pattern exists | Partial | Revise | Undo | Dismiss | U, S, API | Toast must be live region and not sole record of API failure. |
| NUTR-15 | Entry success | خوراک ثبت شد | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Continue logging | Return dashboard | S | Copy names object and destination. |
| NUTR-16 | Field validation errors | خطای فرم خوراک | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Fix fields | Cancel | V, D | Required fields: name/source if manual, meal, quantity, calories as applicable. |
| NUTR-17 | API errors | خطای ثبت خوراک | `/nutrition` | P0 | `food-log-botanical.html` | Partial | Revise | Retry | Preserve draft | API, OFF, PD | Preserve food form values. |

### Add Food Sheet

The add-food sheet must contain exactly one meal selector, one tab selector, only the selected tab content, and one submit area. It must not show recent, saved, and manual panels simultaneously.

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FOOD-01 | Sheet shell with one meal selector | افزودن خوراک | `/nutrition` sheet | P0 | `food-log-botanical.html` | Does not exactly match required structure | Revise | Choose meal | Close | L, V, D | Meal selector includes breakfast/lunch/dinner/snack/other. |
| FOOD-02 | One tab selector | افزودن خوراک | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Pick recent/saved/manual | Close | P, D | Use segmented control with accessible selected state. |
| FOOD-03 | Recent foods tab | خوراک‌های اخیر | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Select recent food | Search/filter if implemented | L, E, P, API | Recent means actually logged foods, not suggestions. |
| FOOD-04 | Saved foods tab | خوراک‌های ذخیره‌شده | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Select saved food | Create custom food | L, E, P, API | Saved means user-curated reusable foods. |
| FOOD-05 | Manual entry tab | ورود دستی | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Fill manual form | Save for later | V, API, S | Visible labels, calories user-entered. |
| FOOD-06 | Selected meal | وعده انتخاب‌شده | `/nutrition` sheet | P0 | None exact | New/revise | Confirm meal | Change meal | P, V | Selected meal applies to all tabs. |
| FOOD-07 | Loading recent foods | خوراک‌های اخیر | `/nutrition` sheet | P0 | Partial state panels | Revise | Wait | Switch tab | L, SK, API | Skeleton preserves list layout. |
| FOOD-08 | Empty recent foods | خوراک‌های اخیر | `/nutrition` sheet | P0 | Partial | Revise | Enter manually | Switch saved/manual | E | Empty explains recent foods appear after logging. |
| FOOD-09 | Loading saved foods | خوراک‌های ذخیره‌شده | `/nutrition` sheet | P0 | Partial | Revise | Wait | Switch tab | L, SK, API | Same sheet height behavior. |
| FOOD-10 | Empty saved foods | خوراک‌های ذخیره‌شده | `/nutrition` sheet | P0 | Partial | Revise | Create custom food | Enter manually | E | Avoid calling saved foods favorites if ambiguous. |
| FOOD-11 | Custom food selection | انتخاب خوراک ذخیره‌شده | `/nutrition` sheet | P0 | Partial | Revise | Select item | Edit custom food | P, API | Selection pre-fills form, does not submit until user confirms. |
| FOOD-12 | Manual form | ورود دستی خوراک | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Submit food | Save for later | V, API, S, D | Name, quantity, unit, calories, meal. |
| FOOD-13 | Save for later | ذخیره برای دفعات بعد | `/nutrition/foods` and sheet | P0 | `food-log-botanical.html` | Partial | Revise | Save custom food | Submit actual log | L, V, API, S | Saving custom food alone must not log food automatically. |
| FOOD-14 | Submit loading/error/success | افزودن به ثبت امروز | `/nutrition` sheet | P0 | `food-log-botanical.html` | Partial | Revise | Submit | Retry/cancel | L, API, S, D | One submit area only; success closes sheet or returns to day. |

### Saved and Custom Foods

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CUST-01 | Empty list | خوراک‌های ذخیره‌شده | `/nutrition/foods` | P0 | None exact | Missing | New | Create custom food | Back to nutrition | L, E, API | Explain saved foods are reusable user items. |
| CUST-02 | Populated list | خوراک‌های ذخیره‌شده | `/nutrition/foods` | P0 | Partial in `food-log-botanical.html` | Partial | New/revise | Select/edit food | Delete, create | L, P, API, OFF | List items isolate calories/units. |
| CUST-03 | Create custom food | خوراک سفارشی جدید | `/nutrition/foods` | P0 | `food-log-botanical.html` sheet | Partial | New/revise | Save food | Cancel | L, V, API, S, D | Creating custom food should not log actual consumption unless user chooses log action. |
| CUST-04 | Edit custom food | ویرایش خوراک سفارشی | `/nutrition/foods` | P0 | None exact | Missing | New | Save changes | Cancel/delete | L, V, API, S, D | Preserve values on validation/API failure. |
| CUST-05 | Delete confirmation | حذف خوراک ذخیره‌شده | `/nutrition/foods` | P0 | None exact | Missing | New | Confirm delete | Cancel | C, API, S, D | Blocking confirmation is appropriate for reusable saved object. |
| CUST-06 | Save success | خوراک ذخیره شد | `/nutrition/foods` | P0 | Toast pattern exists | Partial | New/revise | Continue | Log this food | S | Names saved object. |
| CUST-07 | Validation error | خطای خوراک سفارشی | `/nutrition/foods` | P0 | Partial | New/revise | Fix fields | Cancel | V, D | Field-level and summary errors. |

### Plans

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLAN-01 | Empty plans list | برنامه‌ها | `/plans` | P0 | `plans-botanical.html` | Partial | Revise | Create plan | Complete intake | L, E, API | Do not show AI suggestion modules in MVP unless implemented. |
| PLAN-02 | Populated plans list | برنامه‌ها | `/plans` | P0 | `plans-botanical.html` | Partial | Revise | Open plan | Filter active/draft/archived | L, P, API | Separate nutrition and workout sections. |
| PLAN-03 | Nutrition plan section | برنامه‌های غذایی | `/plans` | P0 | `plans-botanical.html`, `meal-plan-botanical.html` | Partial | Revise | Open nutrition plan | New nutrition plan | E, P, API | Indigo outlined plan semantic. |
| PLAN-04 | Workout plan section | برنامه‌های تمرینی | `/plans` | P0 | `plans-botanical.html`, `workout-botanical.html` | Partial | Revise | Open workout plan | New workout plan | E, P, API | Workout execution screen is Next Development. |
| PLAN-05 | Plan type selection | نوع برنامه | `/plans/new` | P0 | None exact | Missing | New | Choose nutrition/workout | Back | L, P | Use two clear options; no generated-design controls. |
| PLAN-06 | New nutrition plan | برنامه غذایی جدید | `/plans/new` | P0 | `meal-plan-botanical.html` | Partial | New/revise | Create draft | Upload attachment, intake | L, V, API, S, D | AI generation not part of MVP. |
| PLAN-07 | New workout plan | برنامه تمرینی جدید | `/plans/new` | P0 | `workout-botanical.html` | Partial | New/revise | Create draft | Upload attachment, intake | L, V, API, S, D | No exercise timer unless in Next Development. |
| PLAN-08 | Plan detail | جزئیات برنامه | `/plans/[id]` | P0 | `meal-plan-botanical.html`, `workout-botanical.html` | Partial | Revise | Review plan | Edit, activate, archive | L, E, P, API, RO | Route handles both nutrition/workout. |
| PLAN-09 | Edit plan | ویرایش برنامه | `/plans/[id]` | P0 | Partial | Missing exact | New/revise | Save changes | Cancel | L, V, API, S, D, RO | Archived plans read-only unless reactivated. |
| PLAN-10 | Activate plan | فعال‌سازی برنامه | `/plans/[id]` | P0 | `plans-botanical.html` | Partial | Revise | Activate | Cancel | L, API, S, C, D | Confirm replacement if another active plan exists. |
| PLAN-11 | Archive plan | بایگانی برنامه | `/plans/[id]` | P0 | `plans-botanical.html` | Partial | Revise | Archive | Cancel | L, API, S, C, D | Confirmation should explain effect. |
| PLAN-12 | Reactivate plan | فعال‌سازی دوباره | `/plans/[id]` | P0 | None exact | Missing | New | Reactivate | Cancel | L, API, S, C, D | Archived becomes active/draft per implementation rule. |
| PLAN-13 | Active state | برنامه فعال | `/plans`, `/plans/[id]` | P0 | `plans-botanical.html` | Partial | Revise | View active plan | Archive/replace | P, API | Badge text plus shape/color; not color alone. |
| PLAN-14 | Draft state | پیش‌نویس برنامه | `/plans`, `/plans/[id]` | P0 | Partial | Missing exact | New/revise | Continue editing | Activate/archive | PD, API | Draft must preserve incomplete structured data. |
| PLAN-15 | Archived read-only state | برنامه بایگانی‌شده | `/plans`, `/plans/[id]` | P0 | None exact | Missing | New | Reactivate | View attachment/download | RO, API, C | Inputs disabled with nearby explanation. |

### Plan Attachments

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ATT-01 | No attachment | فایل برنامه | `/plans/[id]` | P0 | `profile-botanical.html`, `settings-botanical.html` | Partial, not plan-specific | New/revise | Upload file | Continue without file | E, API | Attachment belongs to plan detail. |
| ATT-02 | Upload | بارگذاری فایل | `/plans/[id]` | P0 | Component `FileUpload` exists | Partial | New/revise | Select file | Cancel | V, API, D | Accepted PDF/image, size limit, privacy note. |
| ATT-03 | Uploading progress | در حال بارگذاری | `/plans/[id]` | P0 | None exact | Missing | New | Wait | Cancel if supported | L, D, API | File name isolated with `<bdi>`. |
| ATT-04 | Upload failure | بارگذاری کامل نشد | `/plans/[id]` | P0 | None exact | Missing | New | Retry | Remove file | API, V | Copy from DESIGN: file preserved, retry. |
| ATT-05 | Retry | تلاش دوباره | `/plans/[id]` | P0 | None exact | Missing | New | Retry upload | Cancel | L, API, D | Preserve selected file metadata. |
| ATT-06 | View | مشاهده فایل | `/plans/[id]` | P1 | None exact | Missing | New | View attachment | Download/replace/remove | L, P, API | Do not claim OCR accuracy. |
| ATT-07 | Download | دریافت فایل | `/plans/[id]` | P1 | None exact | Missing | New | Download | Back | L, API, S | Filename LTR/auto isolated. |
| ATT-08 | Replace | جایگزینی فایل | `/plans/[id]` | P1 | None exact | Missing | New | Replace file | Cancel | C, L, API, S | Confirm replacement if destructive. |
| ATT-09 | Remove confirmation | حذف فایل | `/plans/[id]` | P0 | None exact | Missing | New | Confirm remove | Cancel | C, API, S | Confirmation names attachment. |

### Structured Nutrition Plan

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| STRUCT-01 | Empty structured meals | ساختار وعده‌ها | `/plans/[id]` | P0 | `meal-plan-botanical.html` | Partial | Revise | Add planned item | Upload/reference attachment | E, API, RO | Empty is plan intention, not actual log. |
| STRUCT-02 | Populated meal groups | وعده‌های برنامه | `/plans/[id]` | P0 | `meal-plan-botanical.html` | Partial | Revise | Edit planned item | Move/delete/log based on plan | L, P, API, RO | Groups: breakfast/lunch/dinner/snack/other if implemented. |
| STRUCT-03 | Add planned item | افزودن آیتم برنامه | `/plans/[id]` | P0 | `meal-plan-botanical.html` | Partial | New/revise | Save planned item | Cancel | L, V, API, S, D | Indigo outline, explicit «برنامه غذایی». |
| STRUCT-04 | Edit planned item | ویرایش آیتم برنامه | `/plans/[id]` | P0 | `meal-plan-botanical.html` | Partial | New/revise | Save changes | Cancel/delete | L, V, API, S, D, RO | No actual-log totals inside plan. |
| STRUCT-05 | Move planned item | جابه‌جایی آیتم برنامه | `/plans/[id]` | P1 | None exact | Missing | New | Move meal/day | Cancel | L, API, S, RO | Provide buttons; dragging not only operation. |
| STRUCT-06 | Delete planned item | حذف آیتم برنامه | `/plans/[id]` | P0 | None exact | Missing | New | Confirm/delete | Cancel | C, API, S, RO | Deleting planned item never deletes logged food. |
| STRUCT-07 | Missing calorie | کالری وارد نشده | `/plans/[id]` | P0 | None exact | Missing | New | Add calorie or save without if allowed | Continue | V, PD | Missing value shown as unknown, not invented. |
| STRUCT-08 | Archived read-only structure | ساختار بایگانی‌شده | `/plans/[id]` | P0 | None exact | Missing | New | View | Reactivate | RO, D | Disabled controls explain archive state. |

### Planned vs Actual Food Contract

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CONTRACT-01 | Planned vs actual food | برنامه و ثبت واقعی | `/nutrition`, `/plans/[id]` | P0 | `dashboard-botanical.html`, `meal-plan-botanical.html`, `food-log-botanical.html` | Partial | Revise across MVP | Prefill food form from planned item | Confirm quantity/calories | P, V, API, S, C | Planned food means intention; logged food means actual consumption. Planned items use Indigo outlined semantic. Actual logs use Jade solid semantic. Planned items may only prefill the food form and must never log automatically. User must review and confirm quantity and calories. |

### Intake Questionnaires

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| INT-01 | Intake home | پرسش‌نامه برنامه | `/plans/intake` | P0 | `onboarding-botanical.html`, `plans-botanical.html` | Missing exact route | New | Choose nutrition/workout intake | Back to plans | L, E, P, API | Separate profile onboarding from plan intake. |
| INT-02 | Nutrition questionnaire steps | پرسش‌نامه تغذیه | `/plans/intake/nutrition` | P0 | `onboarding-botanical.html` | Partial | New/revise | Continue | Back, save exit | L, V, PD, API, S | Nutrition intake creates/updates plan draft, not profile alone. |
| INT-03 | Workout questionnaire steps | پرسش‌نامه تمرین | `/plans/intake/workout` | P0 | `onboarding-botanical.html` | Partial | New/revise | Continue | Back, save exit | L, V, PD, API, S | Include qualified safety note; no medical authority. |
| INT-04 | Selected/unselected choices | انتخاب گزینه‌ها | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Select answer | Clear/change | V, D | Pressed/checked state must be visible beyond color. |
| INT-05 | Progress state | پیشرفت پرسش‌نامه | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Continue next step | Save exit | PD, L, API | Step count and saved status. |
| INT-06 | Text field state | پاسخ متنی | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Enter text | Skip if optional | V, D | Preserve mixed text with `dir="auto"`. |
| INT-07 | Validation error | خطای پرسش‌نامه | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Fix answer | Save exit | V, API | Summary and field-level feedback. |
| INT-08 | Save and exit | ذخیره و خروج | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Save progress | Continue | L, API, S, D | Preserve partial answers. |
| INT-09 | Resume | ادامه پرسش‌نامه | `/plans/intake`, dashboard | P0 | `dashboard-botanical.html` | Partial | Revise | Resume exact step | Restart if allowed | PD, API | Dashboard/plans card must name questionnaire type. |
| INT-10 | Review answers | مرور پاسخ‌ها | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Submit intake | Edit step | L, V, API, S | Review grouped by nutrition/workout domain. |
| INT-11 | Completed state | پرسش‌نامه کامل شد | Intake routes | P0 | `onboarding-botanical.html` | Partial | Revise | Continue to plan draft | Back to plans | S, API | Destination should be new or updated plan. |

### Global MVP States and Navigation

| ID | Screen or flow | Persian page title | Route | Priority | Existing prototype | Existing match | New/revised design | Primary action | Secondary actions | Required states | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GLOB-01 | Loading | در حال بارگذاری | Global | P0 | `system-states-botanical.html` | Partial | Revise/use | Wait | None | L, SK | Preserve layout; announce once. |
| GLOB-02 | Skeleton | در حال آماده‌سازی | Global | P0 | `system-states-botanical.html` | Partial | Revise/use | Wait | None | SK | No duplicate accessible content. |
| GLOB-03 | Empty | موردی وجود ندارد | Global | P0 | `system-states-botanical.html` | Partial | Revise/use | Relevant next action | Back | E | State what is empty. |
| GLOB-04 | Partial data | اطلاعات ناقص | Global | P0 | `dashboard-botanical.html` | Partial | Revise/use | Continue | Save exit | PD | Name exact next step. |
| GLOB-05 | Success | انجام شد | Global | P0 | Toast pattern | Partial | Revise/use | Continue | Undo when relevant | S, U | Confirm object and destination. |
| GLOB-06 | Validation error | خطای ورودی | Global forms | P0 | Forms partial | Partial | Revise/use | Fix fields | Cancel | V | Preserve entered values. |
| GLOB-07 | API failure | خطای ارتباط | Global | P0 | `system-states-botanical.html` | Partial | Revise/use | Retry | Back | API, OFF | Non-accusatory, no data loss. |
| GLOB-08 | Offline | آفلاین | Global | P0 | `system-states-botanical.html` | Partial | Revise/use | Keep local edits | Retry sync | OFF, PD | Preserve local edits and sync state. |
| GLOB-09 | Permission denied | دسترسی داده نشد | Global | P1 | `system-states-botanical.html` | Partial | Use later | Open settings/choose alternative | Back | PERM | Needed for upload/camera later; MVP mainly file upload. |
| GLOB-10 | Session expired | نشست منقضی شد | Global | P0 | None | Missing | New | Log in | Cancel to public page | SE, C | Return after successful auth. |
| GLOB-11 | 404 | صفحه پیدا نشد | Global | P1 | `system-states-botanical.html` | Partial | Revise/use | Return dashboard | Go landing | NF | Product-safe route recovery. |
| GLOB-12 | Confirmation dialog | تایید عملیات | Global | P0 | Dialog patterns | Partial | Revise/use | Confirm | Cancel | C, D | Only destructive/high-impact actions. |
| GLOB-13 | Toast | پیام کوتاه | Global | P0 | Toast pattern | Partial | Revise/use | Dismiss/undo | None | S, U, API | Polite live region. |
| GLOB-14 | Undo | بازگردانی | Global | P0 | Toast pattern | Partial | Revise/use | Undo | Dismiss | U, API | Required for routine food delete. |
| GLOB-15 | Mobile bottom navigation | ناوبری اصلی | Authenticated routes | P0 | Existing prototypes | Partial | Revise/use | Navigate | None | P, D | Four labels visible: امروز، ثبت/تغذیه، برنامه‌ها، من. |
| GLOB-16 | Desktop RTL navigation | ناوبری کناری | Authenticated routes | P0 | Existing prototypes | Partial | Revise/use | Navigate | None | P, D | Same order and labels, RTL side rail. |

## B. Next Development

These should be designed before implementing the next product features. They should not be treated as Current MVP unless the product implementation expands.

| Screen or flow | Persian page title | Route if likely | Priority | Existing prototype | Existing match | Design requirement |
|---|---|---|---|---|---|---|
| Weekly nutrition reports | گزارش هفتگی تغذیه | `/reports` | P1 | `reports-botanical.html` | Partial | Revise when report APIs exist; include data completeness and no adherence shaming. |
| Weight history | روند وزن | TBD | P1 | `body-botanical.html`, `reports-botanical.html` | Partial | Keep neutral, no body judgement. |
| Body measurements | اندازه‌های بدن | TBD | P1 | `body-botanical.html` | Partial | Include dates, notes, incomplete data. |
| Water tracking | آب امروز | TBD | P1 | `water-botanical.html` | Good concept | Keep for next, not current MVP. |
| Sleep tracking | خواب | TBD | P2 | Dashboard modules only | Missing | New. |
| Activity tracking | فعالیت | TBD | P2 | Dashboard modules only | Missing | New; avoid fitness-gym tone. |
| Habits | عادت‌ها | TBD | P2 | None | Missing | New; avoid streak anxiety. |
| Body Mood | حال بدن | TBD | P2 | None | Missing | New; clarify non-medical mood/body note. |
| Workout execution and workout logs | اجرای تمرین | TBD | P1 | `workout-botanical.html` | Partial | Revise when execution is implemented; separate planned workout from completed activity. |
| Reminders | یادآورها | TBD | P1 | `notifications-botanical.html`, `water-botanical.html` | Partial | Include permission, disabled, quiet hours. |
| Notification preferences | تنظیمات اعلان‌ها | TBD | P1 | `settings-botanical.html`, `notifications-botanical.html` | Partial | New settings details. |
| Privacy settings | حریم خصوصی | TBD | P1 | `settings-botanical.html` | Partial | Detailed consent and data handling screens. |
| Account deletion | حذف حساب | TBD | P1 | `settings-botanical.html` | Partial | Strong confirmation and consequences. |
| Data export | خروجی داده‌ها | TBD | P1 | None | Missing | New; file generation/loading/error states. |
| OCR plan import | وارد کردن برنامه از فایل | TBD | P1 | Plan attachment/upload concepts | Missing | New; must not claim perfect recognition. |
| OCR review and correction | بازبینی برنامه استخراج‌شده | TBD | P1 | None | Missing | New; correction-first workflow. |
| Coach/student relationship | ارتباط مربی و دانشجو | TBD | P2 | `messages-botanical.html` | Partial concept | Needs role model before UI. |
| Specialist access | دسترسی متخصص | TBD | P2 | `messages-botanical.html` | Partial concept | Requires permissions, audit, privacy model. |

## C. Future Concept

These are long-term ideas. Do not mix them into Current MVP screens unless the product implementation explicitly includes them.

| Concept | Persian page title | Priority | Existing prototype overlap | Planning note |
|---|---|---|---|---|
| AI assistant | دستیار هوشمند | P2 | None | Needs safety, scope, escalation model. |
| AI nutrition-plan generation | ساخت برنامه غذایی هوشمند | P2 | `plans-botanical.html` mentions AI suggestions | Remove from MVP designs unless implemented. |
| AI workout-plan generation | ساخت برنامه تمرینی هوشمند | P2 | `plans-botanical.html` concept | Future only. |
| Food image analysis | تحلیل عکس غذا | P2 | `food-log-botanical.html` barcode/photo module | Future; current MVP should not imply image analysis. |
| Voice food logging | ثبت خوراک با صدا | P2 | None | Future accessibility/voice model needed. |
| Barcode and label scanning | اسکن بارکد و برچسب | P2 | `food-log-botanical.html` concept | Future; remove from MVP add-food sheet. |
| Persian food database | پایگاه خوراک ایرانی | P2 | None | Data/source governance needed. |
| Apple Health | اتصال Apple Health | P2 | None | Native integration and consent required. |
| Health Connect / Google Fit | اتصال Health Connect | P2 | None | Native integration and consent required. |
| Coach portal | پنل مربی | P2 | `messages-botanical.html` related | Separate product surface. |
| Specialist portal | پنل متخصص | P2 | `messages-botanical.html` related | Separate product surface with access controls. |
| Admin panel | پنل مدیریت | P2 | None | Separate internal tool, not app UI. |
| Educational content | محتوای آموزشی | P2 | None | Avoid medical advice claims. |
| Challenges | چالش‌ها | P2 | None | Risk of streak anxiety; future only. |
| Commercial partners | همکاری تجاری | P2 | None | Must not compromise health trust. |

## Final Planning Report

### 1. Total Current MVP screens and states

- Current MVP matrix items: 134.
- Count basis: 11 auth, 16 onboarding/profile, 9 dashboard, 17 daily nutrition, 14 add-food sheet, 7 saved/custom foods, 15 plans, 9 attachments, 8 structured nutrition plan, 1 planned-vs-actual contract, 11 intake questionnaire, 16 global state/navigation items.

### 2. Existing prototypes that can be kept

- `index-botanical.html` as landing visual reference, after route and content tightening.
- `auth-botanical.html` and `otp-botanical.html` as auth visual foundations.
- `onboarding-botanical.html` as questionnaire interaction reference.
- `dashboard-botanical.html` as Botanical shell/dashboard reference.
- `food-log-botanical.html` as nutrition UI reference, after reducing scope to MVP.
- `meal-plan-botanical.html` as nutrition plan visual reference.
- `plans-botanical.html` as plan card/state reference.
- `profile-botanical.html` and `settings-botanical.html` as profile/settings component references.
- `system-states-botanical.html` as global state visual reference.

### 3. Existing prototypes that need revision

- `dashboard-botanical.html`: includes broader modules and links that exceed current MVP.
- `food-log-botanical.html`: add-food sheet must be simplified to exactly one meal selector, one tab selector, selected tab content only, and one submit area; barcode/photo concepts are Future Concept.
- `plans-botanical.html`: AI suggestion content and old route assumptions need removal/rewrite for MVP.
- `meal-plan-botanical.html`: align to `/plans/[id]`, structured meals, draft/active/archived states, and prefill-only planned food behavior.
- `workout-botanical.html`: should be Next Development until workout execution/logging is implemented.
- `settings-botanical.html`: privacy, account deletion, notification preferences are Next Development except profile editing pieces.
- `profile-botanical.html`: should be reconciled with actual `/profile` route and current profile editing.
- `onboarding-botanical.html`: split profile onboarding from plan intake questionnaires.

### 4. Missing Current MVP artifacts

- Route-accurate `/nutrition` daily nutrition screen with five meal groups including other.
- Route-accurate `/nutrition/foods` saved/custom foods management.
- Exact MVP add-food sheet structure.
- `/plans/new` plan type selection and new plan flow.
- `/plans/[id]` plan detail with active/draft/archived states.
- Plan attachment states tied to plan detail.
- Structured nutrition plan editor states.
- `/plans/intake`, `/plans/intake/nutrition`, and `/plans/intake/workout` route-specific designs.
- Session expired global state.
- Archived read-only and reactivation states.

### 5. Existing Botanical prototypes that belong only to Next Development or Future Concept

- `water-botanical.html`: Next Development.
- `body-botanical.html`: Next Development, except measurement patterns can inform profile fields.
- `reports-botanical.html`: Next Development.
- `workout-botanical.html`: Next Development for execution/logs; MVP can reuse only plan-management visuals.
- `messages-botanical.html`: Next Development/Future Concept depending on coach/specialist model.
- `notifications-botanical.html`: Next Development.
- Barcode/photo sections in `food-log-botanical.html`: Future Concept.
- AI suggestion sections in `plans-botanical.html`: Future Concept.

### 6. Conflicts between current prototypes and the real implemented product

- Some Botanical links still point to Original filenames or old static routes instead of product routes.
- Existing pages include Next/Future features that are not in the implemented feature list: water, body history, reports, messages, notifications, workout execution, barcode/photo capture, AI suggestions.
- `food-log-botanical.html` is richer than the specified add-food sheet and risks showing multiple content areas at once.
- Profile, settings, and onboarding are split across prototypes, while the implemented product has route-specific `/profile`, `/onboarding`, and plan-intake routes.
- Plan prototypes do not yet fully represent active, draft, archived, archived read-only, reactivation, and attachment states.
- Planned items and actual logs need a stricter visual and interaction contract across nutrition and plan screens.

### 7. Recommended order for designing missing screens

1. Global shell and state patterns for Botanical MVP.
2. Auth/session expired states.
3. `/dashboard` MVP state set.
4. `/nutrition` daily nutrition with meal groups.
5. Exact add-food sheet.
6. `/nutrition/foods` saved/custom foods.
7. `/plans` list and `/plans/new`.
8. `/plans/[id]` detail with active/draft/archived/read-only behavior.
9. Plan attachments.
10. Structured nutrition plan editor.
11. Plan intake routes.
12. Profile/onboarding reconciliation.
