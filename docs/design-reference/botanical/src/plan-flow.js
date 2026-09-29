(function () {
  "use strict";

  const PAGE = document.body?.dataset.page || "";
  if (!["plans", "plan-detail", "plan-editor"].includes(PAGE)) return;

  const STORAGE_KEY = "avocado:plan-flow-v1";
  const DATE_API = window.AvocadoDate || null;
  const TODAY = DATE_API?.dateOnlyLocal?.() || todayLocal();
  let memoryState = null;

  function todayLocal() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function parseDateOnly(value) {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (![year, month, day].every(Number.isFinite)) return null;
    return new Date(year, month - 1, day);
  }

  function compareDateOnly(a, b) {
    return String(a || "").localeCompare(String(b || ""));
  }

  function addDays(date, offset) {
    const parsed = parseDateOnly(date) || new Date();
    parsed.setDate(parsed.getDate() + offset);
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (parsed) {
        memoryState = parsed;
        return normalizeState(parsed);
      }
    } catch (_) {}
    if (memoryState) return normalizeState(memoryState);
    const fallback = defaultState();
    memoryState = fallback;
    return normalizeState(fallback);
  }

  function writeState(nextState) {
    const normalized = normalizeState(nextState);
    memoryState = normalized;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (_) {}
    return normalized;
  }

  function normalizeState(input) {
    const base = defaultState();
    return {
      ...base,
      ...input,
      plans: Array.isArray(input?.plans) ? input.plans.map(normalizePlan) : base.plans,
      draftNotes: input?.draftNotes || {},
    };
  }

  function normalizePlan(plan) {
    const normalized = {
      id: plan.id || uid("plan"),
      name: plan.name || "برنامه بدون نام",
      type: plan.type || "nutrition",
      source: plan.source || "self",
      status: plan.status || "draft",
      startDate: plan.startDate || TODAY,
      endDate: plan.endDate || addDays(TODAY, 28),
      goal: plan.goal || "",
      description: plan.description || "",
      notes: {
        coach: plan?.notes?.coach || "",
        personal: plan?.notes?.personal || "",
        plan: plan?.notes?.plan || "",
      },
      rules: Array.isArray(plan.rules) ? plan.rules : [],
      restrictions: Array.isArray(plan.restrictions) ? plan.restrictions : [],
      adherence: Number(plan.adherence) || 0,
      progress: Number(plan.progress) || 0,
      createdBy: plan.createdBy || "سارا",
      isEditable: plan.isEditable ?? (plan.source === "self" || plan.source === "imported"),
      schedule: plan.schedule || {},
    };
    return normalized;
  }

  function defaultState() {
    return {
      plans: [
        {
          id: "plan-nutrition-balance",
          name: "تعادل تغذیه هفتگی",
          type: "nutrition",
          source: "self",
          status: "active",
          startDate: addDays(TODAY, -6),
          endDate: addDays(TODAY, 21),
          goal: "تنظیم وعده‌های روزانه با تمرکز روی ثبات انرژی",
          description: "برنامه غذایی ملایم برای روزهای کاری و تمرین سبک.",
          rules: ["هر روز حداقل سه وعده اصلی", "میان‌وعده سبک بین ناهار و شام"],
          adherence: 78,
          progress: 42,
          schedule: {
            days: {
              sat: { meals: sampleMeals("شنبه") },
              sun: { meals: sampleMeals("یکشنبه") },
              mon: { meals: sampleMeals("دوشنبه") },
            },
          },
          notes: {
            plan: "روی ثبات کالری و پخش متعادل ماکروها تمرکز دارد.",
            coach: "",
            personal: "",
          },
        },
        {
          id: "plan-workout-base",
          name: "قدرت پایه چهارروزه",
          type: "workout",
          source: "coach",
          status: "active",
          startDate: addDays(TODAY, -13),
          endDate: addDays(TODAY, 14),
          goal: "بازگشت تدریجی به تمرین منظم بدون فشار اضافه",
          description: "جلسه‌های کوتاه و قابل‌پیگیری برای هفته‌های شروع.",
          rules: ["بین جلسه‌ها یک روز فاصله بگذار", "شدت را با حال روزت تنظیم کن"],
          adherence: 64,
          progress: 55,
          isEditable: false,
          schedule: {
            days: {
              sat: { kind: "workout", session: sampleWorkout("فشار بالاتنه") },
              mon: { kind: "workout", session: sampleWorkout("پا و مرکز بدن") },
              wed: { kind: "workout", session: sampleWorkout("کشش و پایداری") },
            },
          },
          notes: {
            plan: "تمرین‌ها برنامه‌ریزی‌شده‌اند و فقط بعد از اجرا ثبت واقعی می‌شوند.",
            coach: "اگر خواب کمتر از ۶ ساعت بود، جلسه را سبک‌تر پیش ببر.",
            personal: "",
          },
        },
        {
          id: "plan-hybrid-reset",
          name: "بازتنظیم سبک زندگی",
          type: "hybrid",
          source: "avocado",
          status: "draft",
          startDate: TODAY,
          endDate: addDays(TODAY, 30),
          goal: "هماهنگ‌کردن خواب، آب و وعده‌ها در یک ریتم قابل‌دوام",
          description: "پیشنهاد ترکیبی آووکادو برای ماه آینده.",
          rules: ["هر شب مرور کوتاه برنامه", "ثبت واقعی فقط با اقدام خودت"],
          adherence: 0,
          progress: 0,
          isEditable: false,
          schedule: {
            days: {
              sat: { meals: sampleMeals("شنبه"), kind: "workout", session: sampleWorkout("راه‌اندازی ملایم") },
            },
          },
          notes: {
            plan: "پیشنهاد اولیه است و قبل از فعال‌سازی می‌توانی نسخه شخصی بسازی.",
            coach: "",
            personal: "",
          },
        },
      ],
      draftNotes: {},
    };
  }

  function sampleMeals(dayLabel) {
    return {
      breakfast: [{ id: uid("food"), name: `صبحانه ${dayLabel}`, amount: "۱", unit: "وعده", calories: 320, protein: 18, carbs: 34, fat: 11 }],
      lunch: [{ id: uid("food"), name: `ناهار ${dayLabel}`, amount: "۱", unit: "بشقاب", calories: 510, protein: 28, carbs: 52, fat: 16 }],
      dinner: [{ id: uid("food"), name: `شام ${dayLabel}`, amount: "۱", unit: "وعده", calories: 430, protein: 24, carbs: 30, fat: 18 }],
    };
  }

  function sampleWorkout(name) {
    return {
      name,
      duration: 35,
      intensity: "متوسط",
      goal: "پیش‌برد تدریجی جلسه",
      exercises: [
        { id: uid("exercise"), name: "اسکات وزن بدن", sets: 3, reps: 12, weight: "", rest: 60 },
        { id: uid("exercise"), name: "پرس سینه دمبل", sets: 3, reps: 10, weight: "۶", rest: 75 },
      ],
    };
  }

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return [...root.querySelectorAll(selector)];
  }

  function fmtDate(value) {
    const parsed = parseDateOnly(value);
    if (!parsed) return "—";
    if (DATE_API?.formatPersianDate) return DATE_API.formatPersianDate(value);
    return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
  }

  function num(value) {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  }

  function typeLabel(type) {
    return { nutrition: "غذایی", workout: "تمرینی", hybrid: "ترکیبی" }[type] || "برنامه";
  }

  function sourceLabel(source) {
    return { self: "ساخته‌شده توسط من", coach: "مربی", avocado: "آووکادو", imported: "فایل واردشده" }[source] || "برنامه";
  }

  function statusLabel(status) {
    return { draft: "پیش‌نویس", active: "فعال", paused: "متوقف‌شده", finished: "پایان‌یافته", archived: "بایگانی‌شده" }[status] || status;
  }

  function planTone(plan) {
    return plan.source === "coach" ? "plan" : "actual";
  }

  function getPlan(state, id) {
    return state.plans.find((plan) => plan.id === id) || null;
  }

  function query() {
    return new URLSearchParams(window.location.search);
  }

  function todayDestination(plan) {
    return plan.type === "workout" ? "workout-weekly-botanical.html" : "meal-plan-botanical.html";
  }

  function canDeletePlan(plan) {
    return plan?.source === "self" || plan?.source === "imported";
  }

  function findActivePeer(state, type, ignoreId) {
    return state.plans.find((plan) => plan.id !== ignoreId && plan.type === type && plan.status === "active") || null;
  }

  function readStorageList(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function ensurePlanDialog() {
    let dialog = qs("#plan-flow-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "plan-flow-dialog";
    dialog.className = "plan-flow-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="plan-flow-dialog__body">
        <div class="plan-flow-dialog__copy">
          <strong id="plan-flow-dialog-title">تأیید</strong>
          <p id="plan-flow-dialog-message">—</p>
        </div>
        <div class="plan-flow-dialog__actions" id="plan-flow-dialog-actions"></div>
      </form>
    `;
    document.body.appendChild(dialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close("cancel");
    });
    return dialog;
  }

  function openPlanDialog({ title, message, actions }) {
    const dialog = ensurePlanDialog();
    qs("#plan-flow-dialog-title", dialog).textContent = title;
    qs("#plan-flow-dialog-message", dialog).textContent = message;
    const actionsRoot = qs("#plan-flow-dialog-actions", dialog);
    actionsRoot.innerHTML = actions.map((action) => `
      <button class="button ${action.tone === "primary" ? "button--primary" : action.tone === "danger" ? "button--danger" : "button--secondary"}" type="button" data-dialog-action="${action.key}">${action.label}</button>
    `).join("");
    return new Promise((resolve) => {
      actionsRoot.querySelectorAll("[data-dialog-action]").forEach((button) => {
        button.addEventListener("click", () => {
          dialog.close(button.dataset.dialogAction);
        }, { once: true });
      });
      dialog.addEventListener("close", () => resolve(dialog.returnValue || "cancel"), { once: true });
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
  }

  async function confirmActivation(plan, ignoreId) {
    const state = readState();
    const activePeer = findActivePeer(state, plan.type, ignoreId);
    if (!activePeer) return { approved: true, state, activePeer: null };
    const choice = await openPlanDialog({
      title: "فعال‌سازی برنامه",
      message: "با فعال‌کردن این برنامه، برنامه فعال فعلی متوقف می‌شود.",
      actions: [
        { key: "confirm", label: "ادامه", tone: "primary" },
        { key: "cancel", label: "انصراف", tone: "secondary" },
      ],
    });
    return { approved: choice === "confirm", state, activePeer };
  }

  function mealTotals(items) {
    return (items || []).reduce((sum, item) => ({
      calories: sum.calories + Number(item.calories || 0),
      protein: sum.protein + Number(item.protein || 0),
      carbs: sum.carbs + Number(item.carbs || 0),
      fat: sum.fat + Number(item.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  function dayTotals(day) {
    return Object.values(day?.meals || {}).reduce((sum, items) => {
      const totals = mealTotals(items);
      return {
        calories: sum.calories + totals.calories,
        protein: sum.protein + totals.protein,
        carbs: sum.carbs + totals.carbs,
        fat: sum.fat + totals.fat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  function nutritionDeltaCopy(day) {
    const totals = dayTotals(day);
    const targets = { calories: 1800, protein: 120, carbs: 180, fat: 60 };
    const calorieDiff = totals.calories - targets.calories;
    if (!totals.calories) return "هنوز برای این روز خوراکی برنامه‌ریزی نشده است.";
    return `${num(totals.calories)} کالری · پروتئین ${num(totals.protein)} · کربوهیدرات ${num(totals.carbs)} · چربی ${num(totals.fat)} · ${calorieDiff === 0 ? "هم‌راستا با هدف روز" : calorieDiff > 0 ? `${num(calorieDiff)} کالری بیشتر از هدف` : `${num(Math.abs(calorieDiff))} کالری کمتر از هدف`}`;
  }

  function planFoodFromEntry(entry) {
    const nutrition = entry?.nutrition || {};
    return {
      id: uid("food"),
      name: entry.name || "خوراک انتخاب‌شده",
      amount: String(entry.amount ?? entry.quantity ?? 1),
      unit: entry.unit || "واحد",
      calories: Number(entry.calories ?? nutrition.calories ?? 0),
      protein: Number(entry.protein ?? nutrition.protein ?? 0),
      carbs: Number(entry.carbs ?? nutrition.carbs ?? 0),
      fat: Number(entry.fat ?? nutrition.fat ?? 0),
      suggestedTime: entry.time || "",
      alternative: "",
      planned: true,
    };
  }

  function renderPlansPage() {
    const state = readState();
    const grid = qs(".plans-grid");
    const archive = qs("#plans-archive");
    if (grid) {
      const activePlans = state.plans.filter((plan) => !["archived", "finished"].includes(plan.status));
      grid.innerHTML = activePlans.length
        ? activePlans.map(planCardMarkup).join("")
        : `<section class="plan-empty" data-od-id="plans-empty"><h2>هنوز برنامه فعالی نداری</h2><p>می‌توانی یک برنامه تازه بسازی یا فایل برنامه‌ات را وارد کنی.</p></section>`;
    }
    if (archive) {
      const archived = state.plans.filter((plan) => ["archived", "finished"].includes(plan.status));
      archive.innerHTML = `
        <div class="plans-archive__meta">
          <h2>برنامه‌های قبلی</h2>
          <p>برنامه‌های پایان‌یافته و بایگانی‌شده را می‌توانی برای مرور نگه داری.</p>
        </div>
        <div class="plans-archive__meta" style="justify-items:end;">
          <strong class="plans-archive__count">${num(archived.length)}</strong>
          <a class="button button--quiet" href="plan-detail-botanical.html?id=${archived[0]?.id || state.plans[0].id}">مشاهده جزئیات</a>
        </div>
      `;
    }
    wirePlansPage();
  }

  function planCardMarkup(plan) {
    const canEdit = plan.isEditable;
    const primaryHref = `plan-detail-botanical.html?id=${plan.id}`;
    return `
      <article class="plan-hub-card ${plan.type === "workout" ? "plan-hub-card--workout" : "plan-hub-card--food"}" data-plan-id="${plan.id}">
        <div class="plan-hub-head">
          <span class="plan-hub-label"><i aria-hidden="true"></i>برنامه ${typeLabel(plan.type)}</span>
          <span class="plan-hub-status">${statusLabel(plan.status)}</span>
        </div>
        <div class="plan-hub-title">
          <h2>${plan.name}</h2>
          <p>${plan.description}</p>
        </div>
        <div class="plan-hub-primary">
          <div class="plan-hub-primary__value">${plan.goal}</div>
          <div class="plan-hub-primary__meta">
            <span>منبع: ${sourceLabel(plan.source)}</span>
            <span>${fmtDate(plan.startDate)} تا ${fmtDate(plan.endDate)}</span>
          </div>
        </div>
        <div class="plan-progress" style="--progress:${Math.max(0, Math.min(100, plan.progress))}%;">
          <div class="plan-progress__head">
            <span>پیشرفت</span>
            <strong>${num(plan.progress)}٪</strong>
          </div>
          <div class="plan-progress__bar"><span class="plan-progress__fill"></span></div>
        </div>
        <div class="plan-hub-facts">
          <div class="plan-fact"><span>نوع</span><strong>${typeLabel(plan.type)}</strong></div>
          <div class="plan-fact"><span>پایبندی</span><strong>${num(plan.adherence)}٪</strong></div>
        </div>
        <div class="plan-hub-source">
          <span class="plan-source-pill" data-source="${plan.source}">${sourceLabel(plan.source)}</span>
          <details class="community-more">
            <summary class="community-ghost-button" aria-label="گزینه‌های برنامه">⋯</summary>
            <div class="community-menu">
              <a href="${primaryHref}">مشاهده جزئیات</a>
              ${canEdit ? `<a href="plan-editor-botanical.html?mode=edit&id=${plan.id}">ویرایش</a>` : ""}
              ${plan.source !== "self" ? `<button type="button" data-plan-copy="${plan.id}">ساخت نسخه شخصی</button>` : `<button type="button" data-plan-copy="${plan.id}">کپی برنامه</button>`}
              <button type="button" data-plan-toggle="${plan.id}">${plan.status === "active" ? "توقف" : "فعال‌سازی"}</button>
              <button type="button" data-plan-archive="${plan.id}">بایگانی</button>
              ${plan.source === "self" || plan.source === "imported" ? `<button type="button" data-plan-delete="${plan.id}">حذف</button>` : ""}
            </div>
          </details>
        </div>
        <div class="plan-hub-actions">
          <a class="button button--primary" href="${primaryHref}">مشاهده جزئیات</a>
          ${
            plan.source === "coach"
              ? `<button class="button button--hub-outline" type="button" data-plan-copy="${plan.id}">ساخت نسخه شخصی</button>`
              : `<a class="button button--hub-outline" href="${plan.type === "workout" ? "workout-weekly-botanical.html" : "meal-plan-botanical.html"}">مشاهده امروز</a>`
          }
        </div>
      </article>
    `;
  }

  function wirePlansPage() {
    const picker = qs("#plan-picker-dialog");
    const pickerOptions = picker?.querySelector(".plan-picker__options");
    if (pickerOptions) {
      pickerOptions.innerHTML = `
        <section class="plan-upload-option">
          <div><strong>ساخت برنامه غذایی</strong><p>یک برنامه غذایی جدید بساز و بعداً آن را فعال کن.</p></div>
          <div class="plan-upload-option__actions"><a class="button button--primary" href="plan-editor-botanical.html?mode=create&type=nutrition">شروع ساخت</a></div>
        </section>
        <section class="plan-upload-option plan-upload-option--workout">
          <div><strong>ساخت برنامه تمرینی</strong><p>جلسه‌ها و حرکت‌ها را برای روزهای فعال تعریف کن.</p></div>
          <div class="plan-upload-option__actions"><a class="button button--primary" href="plan-editor-botanical.html?mode=create&type=workout">شروع ساخت</a></div>
        </section>
        <section class="plan-upload-option">
          <div><strong>واردکردن فایل برنامه</strong><p>اگر فایل آماده داری، آن را برای مرور و تبدیل به برنامه وارد کن.</p></div>
          <div class="plan-upload-option__actions"><label class="button button--secondary" for="plan-import-file">انتخاب فایل</label><input id="plan-import-file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" hidden /></div>
        </section>
      `;
      qs("#plan-import-file", pickerOptions)?.addEventListener("change", (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        showToast("فایل برنامه برای بررسی آماده شد.");
        if (picker.open && typeof picker.close === "function") picker.close();
      });
    }
    qsa("[data-plan-copy]").forEach((button) => button.addEventListener("click", () => {
      const state = readState();
      const plan = getPlan(state, button.dataset.planCopy);
      if (!plan) return;
      state.plans.unshift({
        ...clone(plan),
        id: uid("plan"),
        name: `${plan.name} · نسخه شخصی`,
        source: "self",
        isEditable: true,
        status: "draft",
      });
      writeState(state);
      showToast("نسخه شخصی برنامه ساخته شد.");
      renderPlansPage();
    }));
    qsa("[data-plan-toggle]").forEach((button) => button.addEventListener("click", async () => {
      const state = readState();
      const plan = getPlan(state, button.dataset.planToggle);
      if (!plan) return;
      if (plan.status !== "active") {
        const { approved, activePeer } = await confirmActivation(plan, plan.id);
        if (!approved) return;
        if (activePeer) activePeer.status = "paused";
      }
      plan.status = plan.status === "active" ? "paused" : "active";
      writeState(state);
      renderPlansPage();
      showToast(plan.status === "active" ? "برنامه فعال شد." : "برنامه متوقف شد.");
    }));
    qsa("[data-plan-archive]").forEach((button) => button.addEventListener("click", () => {
      const state = readState();
      const plan = getPlan(state, button.dataset.planArchive);
      if (!plan) return;
      plan.status = "archived";
      writeState(state);
      renderPlansPage();
      showToast("برنامه بایگانی شد.");
    }));
    qsa("[data-plan-delete]").forEach((button) => button.addEventListener("click", async () => {
      const state = readState();
      const index = state.plans.findIndex((plan) => plan.id === button.dataset.planDelete);
      if (index < 0) return;
      const plan = state.plans[index];
      if (!canDeletePlan(plan)) return;
      const choice = await openPlanDialog({
        title: "حذف برنامه",
        message: "این برنامه حذف می‌شود. اگر مطمئن هستی ادامه بده.",
        actions: [
          { key: "delete", label: "حذف برنامه", tone: "danger" },
          { key: "cancel", label: "انصراف", tone: "secondary" },
        ],
      });
      if (choice !== "delete") return;
      const [removed] = state.plans.splice(index, 1);
      writeState(state);
      renderPlansPage();
      showToast("برنامه حذف شد.", {
        label: "بازگردانی",
        onAction: () => {
          const restored = readState();
          restored.plans.splice(Math.min(index, restored.plans.length), 0, removed);
          writeState(restored);
          renderPlansPage();
          showToast("برنامه برگردانده شد.");
        },
      });
    }));
  }

  function renderPlanDetailPage() {
    const root = qs("#plan-detail-root");
    if (!root) return;
    const state = readState();
    const id = query().get("id");
    const plan = id ? getPlan(state, id) : null;
    if (!plan) {
      root.innerHTML = `<section class="plan-empty" data-od-id="plan-detail-empty"><h2>برنامه‌ای با این شناسه پیدا نشد.</h2><p>می‌توانی به فهرست برنامه‌ها برگردی یا یک برنامه تازه بسازی.</p><div class="plan-inline-actions"><a class="button button--secondary" href="plans-botanical.html">بازگشت به برنامه‌ها</a><a class="button button--primary" href="plan-editor-botanical.html?mode=create&type=nutrition">ساخت برنامه تازه</a></div></section>`;
      return;
    }
    root.innerHTML = `
      <section class="plan-shell-card">
        <div class="plan-hero">
          <div class="plan-hero__copy">
            <div class="plan-meta-list">
              <span class="plan-source-pill" data-source="${plan.source}">${sourceLabel(plan.source)}</span>
              <span class="plan-status-pill" data-tone="${planTone(plan)}">${statusLabel(plan.status)}</span>
            </div>
            <h1>${plan.name}</h1>
            <p>${plan.description}</p>
            <div class="plan-inline-actions">
              <a class="button button--secondary" href="plans-botanical.html">بازگشت</a>
              ${plan.status === "active"
                ? `<a class="button button--primary" href="${todayDestination(plan)}">مشاهده امروز</a>`
                : `<button class="button button--primary" type="button" data-plan-detail-activate="${plan.id}">${plan.status === "paused" ? "فعال‌سازی دوباره" : "شروع برنامه"}</button>`}
            </div>
          </div>
        </div>
      </section>
      <div class="plan-detail-layout">
        <div class="plan-page">
          <section class="plan-shell-card">
            <div class="plan-tabbar" role="tablist">
              <button type="button" aria-selected="true" data-plan-tab="overview">نمای کلی</button>
              <button type="button" aria-selected="false" data-plan-tab="program">برنامه</button>
              <button type="button" aria-selected="false" data-plan-tab="progress">پیشرفت</button>
              <button type="button" aria-selected="false" data-plan-tab="notes">یادداشت‌ها</button>
            </div>
          </section>
          <section class="plan-tab-panel" data-plan-panel="overview">
            <article class="plan-shell-card">
              <div class="plan-notes-stack">
                <div class="plan-note-card"><strong>هدف برنامه</strong><p>${plan.goal}</p></div>
                <div class="plan-note-card"><strong>قوانین</strong><p>${plan.rules.join(" · ") || "—"}</p></div>
                <div class="plan-note-card"><strong>تنظیم‌کننده برنامه</strong><p>${sourceLabel(plan.source)}</p></div>
              </div>
            </article>
          </section>
          <section class="plan-tab-panel" data-plan-panel="program" hidden>
            <article class="plan-shell-card">${programMarkup(plan)}</article>
          </section>
          <section class="plan-tab-panel" data-plan-panel="progress" hidden>
            <article class="plan-shell-card">
              <div class="plan-progress" style="--progress:${plan.progress}%;">
                <div class="plan-inline-actions"><strong>پیشرفت کلی</strong><span>${num(plan.progress)}٪</span></div>
                <div class="plan-progress__track"><span class="plan-progress__fill"></span></div>
              </div>
              <div class="plan-summary-grid">
                <div class="plan-summary-card"><span>پایبندی</span><strong>${num(plan.adherence)}٪</strong></div>
                <div class="plan-summary-card"><span>روزهای گذشته</span><strong>${num(daysBetween(plan.startDate, TODAY))}</strong></div>
                <div class="plan-summary-card"><span>وضعیت</span><strong>${statusLabel(plan.status)}</strong></div>
                <div class="plan-summary-card"><span>منبع</span><strong>${sourceLabel(plan.source)}</strong></div>
              </div>
            </article>
          </section>
          <section class="plan-tab-panel" data-plan-panel="notes" hidden>
            <article class="plan-shell-card">
              <div class="plan-notes-stack">
                <div class="plan-note-card"><strong>یادداشت برنامه</strong><p>${plan.notes.plan || "—"}</p></div>
                <div class="plan-note-card"><strong>یادداشت مربی</strong><p>${plan.notes.coach || "—"}</p></div>
                <label class="field field--full"><span class="field__label">یادداشت شخصی</span><textarea id="plan-personal-note">${plan.notes.personal || ""}</textarea></label>
                <div class="plan-inline-actions"><button class="button button--primary" type="button" id="save-plan-note">ذخیره یادداشت شخصی</button></div>
              </div>
            </article>
          </section>
        </div>
        <aside class="plan-sticky-side">
          <section class="plan-shell-card">
            <div class="plan-summary-grid">
              <div class="plan-summary-card"><span>نوع</span><strong>${typeLabel(plan.type)}</strong></div>
              <div class="plan-summary-card"><span>منبع</span><strong>${sourceLabel(plan.source)}</strong></div>
              <div class="plan-summary-card"><span>شروع</span><strong>${fmtDate(plan.startDate)}</strong></div>
              <div class="plan-summary-card"><span>پایان</span><strong>${fmtDate(plan.endDate)}</strong></div>
            </div>
          </section>
        </aside>
      </div>
    `;
    wirePlanDetailPage(plan.id);
  }

  function daysBetween(startDate, endDate) {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 0;
    return Math.max(0, Math.floor((end - start) / 86400000));
  }

  function programMarkup(plan) {
    if (plan.type === "nutrition") {
      const days = Object.entries(plan.schedule.days || {});
      return `
        <div class="plan-day-stack">
          ${days.map(([key, day]) => `
            <article class="plan-day-card">
              <div class="plan-day-head"><strong>${weekdayLabel(key)}</strong><span class="plan-status-pill" data-tone="plan">برنامه‌ریزی‌شده</span></div>
              ${Object.entries(day.meals || {}).map(([mealKey, items]) => `
                <div class="plan-list-card">
                  <strong>${mealLabel(mealKey)}</strong>
                  <p>${items.map((item) => `${item.name} · ${item.amount} ${item.unit}`).join("، ")}</p>
                </div>
              `).join("")}
              <a class="button button--secondary" href="meal-plan-botanical.html">مشاهده برنامه امروز</a>
            </article>
          `).join("")}
        </div>
      `;
    }
    if (plan.type === "workout") {
      const days = Object.entries(plan.schedule.days || {});
      return `
        <div class="plan-day-stack">
          ${days.map(([key, day]) => `
            <article class="plan-day-card">
              <div class="plan-day-head"><strong>${weekdayLabel(key)}</strong><span class="plan-status-pill" data-tone="plan">${day.kind === "rest" ? "استراحت" : "جلسه تمرین"}</span></div>
              ${day.session ? `<p>${day.session.name} · ${num(day.session.duration)} دقیقه · ${day.session.exercises.length} حرکت</p>` : `<p>روز استراحت</p>`}
              <a class="button button--secondary" href="workout-weekly-botanical.html">مشاهده برنامه هفتگی</a>
            </article>
          `).join("")}
        </div>
      `;
    }
    return `
      <div class="plan-day-stack">
        <div class="plan-note-card"><strong>بخش تغذیه</strong><p>وعده‌های برنامه‌ریزی‌شده را اینجا می‌بینی و ثبت واقعی همچنان جدا می‌ماند.</p></div>
        <div class="plan-note-card"><strong>بخش تمرین</strong><p>جلسه‌های برنامه‌ریزی‌شده آماده مرور هستند و اجرای واقعی به صفحه تمرین می‌رود.</p></div>
      </div>
    `;
  }

  function weekdayLabel(key) {
    return { sat: "شنبه", sun: "یکشنبه", mon: "دوشنبه", tue: "سه‌شنبه", wed: "چهارشنبه", thu: "پنج‌شنبه", fri: "جمعه" }[key] || key;
  }

  function mealLabel(key) {
    return { breakfast: "صبحانه", lunch: "ناهار", dinner: "شام", snack: "میان‌وعده", other: "سایر" }[key] || key;
  }

  function wirePlanDetailPage(planId) {
    qsa("[data-plan-tab]").forEach((button) => button.addEventListener("click", () => {
      qsa("[data-plan-tab]").forEach((node) => node.setAttribute("aria-selected", String(node === button)));
      qsa("[data-plan-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.planPanel !== button.dataset.planTab;
      });
    }));
    qs("#save-plan-note")?.addEventListener("click", () => {
      const state = readState();
      const plan = getPlan(state, planId);
      if (!plan) return;
      plan.notes.personal = qs("#plan-personal-note")?.value || "";
      writeState(state);
      showToast("یادداشت شخصی ذخیره شد.");
    });
    qs("[data-plan-detail-activate]")?.addEventListener("click", async () => {
      const state = readState();
      const plan = getPlan(state, planId);
      if (!plan) return;
      const { approved, activePeer } = await confirmActivation(plan, plan.id);
      if (!approved) return;
      if (activePeer) activePeer.status = "paused";
      plan.status = "active";
      writeState(state);
      showToast("برنامه فعال شد.");
      window.location.href = `plan-detail-botanical.html?id=${plan.id}`;
    });
  }

  function renderPlanEditorPage() {
    const root = qs("#plan-editor-root");
    if (!root) return;
    const params = query();
    const mode = params.get("mode") || "create";
    const existing = mode === "edit" ? getPlan(readState(), params.get("id")) : null;
    if (mode === "edit" && !existing) {
      root.innerHTML = `<section class="plan-empty" data-od-id="plan-editor-missing"><h2>برنامه‌ای برای ویرایش پیدا نشد</h2><p>ممکن است این برنامه حذف شده باشد یا شناسه آن تغییر کرده باشد.</p><div class="plan-inline-actions"><a class="button button--secondary" href="plans-botanical.html">بازگشت به برنامه‌ها</a><a class="button button--primary" href="plan-editor-botanical.html?mode=create&type=nutrition">ساخت برنامه تازه</a></div></section>`;
      return;
    }
    const draft = existing ? clone(existing) : freshPlan(params.get("type") || "nutrition");
    root.innerHTML = editorMarkup(draft, mode);
    wirePlanEditorPage(draft, mode, existing?.id || null);
  }

  function freshPlan(type) {
    return normalizePlan({
      id: uid("plan"),
      type,
      source: "self",
      status: "draft",
      name: "",
      description: "",
      goal: "",
      startDate: TODAY,
      endDate: addDays(TODAY, 28),
      rules: [""],
      schedule: { days: {} },
      notes: { plan: "", coach: "", personal: "" },
    });
  }

  function editorMarkup(plan, mode) {
    return `
      <section class="plan-shell-card">
        <div class="plan-hero">
          <div class="plan-hero__copy">
            <div class="plan-inline-actions">
              <a class="button button--secondary" href="${mode === "edit" ? `plan-detail-botanical.html?id=${plan.id}` : "plans-botanical.html"}" data-plan-back>بازگشت</a>
              <span class="plan-readonly-note" id="plan-unsaved-state">همه تغییرات ذخیره شده‌اند.</span>
            </div>
            <h1>${mode === "edit" ? "ویرایش برنامه" : plan.type === "workout" ? "ساخت برنامه تمرینی" : "ساخت برنامه غذایی"}</h1>
            <p>خوراک‌ها و جلسه‌های برنامه‌ریزی‌شده فقط داخل همین برنامه می‌مانند و به ثبت واقعی منتقل نمی‌شوند.</p>
          </div>
        </div>
      </section>
      <form class="plan-page" id="plan-editor-form">
        <section class="plan-form-card">
          <div class="plan-form-grid">
            <label class="field"><span class="field__label">نام برنامه</span><input name="name" value="${escapeHtml(plan.name)}" required /><small class="field__error" data-error-for="name"></small></label>
            <div class="plan-note-card"><strong>نوع و منبع</strong><p>${typeLabel(plan.type)} · ${sourceLabel(plan.source)}</p></div>
            <label class="field field--full"><span class="field__label">توضیح کوتاه</span><textarea name="description">${escapeHtml(plan.description)}</textarea></label>
            <label class="field"><span class="field__label">هدف برنامه</span><input name="goal" value="${escapeHtml(plan.goal)}" /></label>
            <label class="field"><span class="field__label">تاریخ شروع</span><input type="date" name="startDate" value="${plan.startDate}" required /><small class="field__error" data-error-for="startDate"></small></label>
            <label class="field"><span class="field__label">تاریخ پایان</span><input type="date" name="endDate" value="${plan.endDate}" required /><small class="field__error" data-error-for="endDate"></small></label>
            <label class="field field--full"><span class="field__label">یادداشت برنامه</span><textarea name="planNote">${escapeHtml(plan.notes.plan || "")}</textarea></label>
            <fieldset class="community-fieldset plan-weekday-grid">
              <legend>روزهای فعال هفته</legend>
              ${["sat","sun","mon","tue","wed","thu","fri"].map((dayKey) => `<label><input type="checkbox" name="activeDay" value="${dayKey}" ${plan.schedule.days?.[dayKey] ? "checked" : ""} /><span>${weekdayLabel(dayKey)}</span></label>`).join("")}
              <small class="field__error" data-error-for="activeDay"></small>
            </fieldset>
          </div>
        </section>
        <section class="plan-form-card plan-type-builder" id="plan-type-builder"></section>
        <section class="plan-form-card">
          <div class="plan-editor-actions">
            <button class="button button--secondary" type="button" id="save-plan-draft" disabled>ذخیره پیش‌نویس</button>
            <button class="button button--primary" type="button" id="save-plan-activate" disabled>ذخیره و فعال‌سازی</button>
          </div>
        </section>
      </form>
    `;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function wirePlanEditorPage(draft, mode, existingId) {
    const form = qs("#plan-editor-form");
    const builder = qs("#plan-type-builder");
    const unsaved = qs("#plan-unsaved-state");
    const draftButton = qs("#save-plan-draft");
    const activateButton = qs("#save-plan-activate");
    let dirty = false;
    let ignoreNextPop = false;

    function setDirty(next) {
      dirty = next;
      if (unsaved) unsaved.textContent = dirty ? "تغییرات ذخیره نشده‌اند." : "همه تغییرات ذخیره شده‌اند.";
      if (draftButton) draftButton.disabled = !dirty;
      if (activateButton) activateButton.disabled = !dirty;
    }

    function ensureMeal(dayKey, mealKey) {
      draft.schedule.days[dayKey] ||= { meals: {} };
      draft.schedule.days[dayKey].meals ||= {};
      draft.schedule.days[dayKey].meals[mealKey] ||= [];
      return draft.schedule.days[dayKey].meals[mealKey];
    }

    function openMealPicker(dayKey, mealKey, flowTab) {
      const picker = window.AvocadoFoodFlow?.openFoodPicker;
      if (typeof picker !== "function") {
        showToast("انتخاب‌گر خوراک در این صفحه در دسترس نیست.");
        return;
      }
      picker({
        meal: mealKey === "snack" ? "snack" : mealKey,
        flowTab,
        onPick: (entries) => {
          entries.forEach((entry) => ensureMeal(dayKey, mealKey).push(planFoodFromEntry(entry)));
          setDirty(true);
          renderBuilder();
          showToast("خوراک فقط به برنامه اضافه شد و وارد ثبت واقعی نشد.");
        },
      });
    }

    function duplicateDay(dayKey) {
      const activeDays = qsa('input[name="activeDay"]:checked', form).map((input) => input.value).filter((value) => value !== dayKey);
      if (!activeDays.length || !draft.schedule.days[dayKey]) return;
      activeDays.forEach((targetKey) => {
        draft.schedule.days[targetKey] = clone(draft.schedule.days[dayKey]);
      });
      setDirty(true);
      renderBuilder();
    }

    function clearDay(dayKey) {
      draft.schedule.days[dayKey] = draft.type === "workout" ? { kind: "off", session: sampleWorkout(weekdayLabel(dayKey)) } : { meals: {} };
      setDirty(true);
      renderBuilder();
    }

    function addComboMeal(dayKey, mealKey) {
      const comboMeals = readStorageList("avocado-combo-meals");
      if (!comboMeals.length) {
        showToast("هنوز وعده ترکیبی ذخیره‌شده‌ای نداری.");
        return;
      }
      const combo = comboMeals[0];
      const items = Array.isArray(combo.items) ? combo.items : [combo];
      items.forEach((item) => ensureMeal(dayKey, mealKey).push(planFoodFromEntry(item)));
      setDirty(true);
      renderBuilder();
    }

    function renderBuilder() {
      const activeDays = qsa('input[name="activeDay"]:checked', form).map((input) => input.value);
      builder.innerHTML = draft.type === "workout" ? workoutBuilderMarkup(activeDays, draft) : nutritionBuilderMarkup(activeDays, draft);
      bindBuilderActions();
    }

    function nutritionBuilderMarkup(activeDays, plan) {
      return `
        <div class="plan-builder-head"><h2>روزهای برنامه غذایی</h2><button class="button button--secondary" type="button" data-copy-first-day>اعمال روز اول به همه</button></div>
        <div class="plan-day-stack">
          ${activeDays.map((dayKey) => {
            const day = plan.schedule.days?.[dayKey] || { meals: {} };
            return `<article class="plan-day-card" data-day-key="${dayKey}">
              <div class="plan-day-head"><strong>${weekdayLabel(dayKey)}</strong><div class="plan-inline-actions"><span class="plan-status-pill" data-tone="plan">برنامه‌ریزی‌شده</span><button class="button button--quiet" type="button" data-copy-day="${dayKey}">کپی روز</button><button class="button button--quiet" type="button" data-clear-day="${dayKey}">پاک‌کردن روز</button></div></div>
              ${["breakfast","lunch","dinner","snack","other"].map((mealKey) => `
                <section class="plan-list-card" data-meal-key="${mealKey}">
                  <div class="plan-builder-head"><h3>${mealLabel(mealKey)}</h3><div class="plan-inline-actions"><button class="button button--quiet" type="button" data-open-food-picker="${dayKey}:${mealKey}:search">جست‌وجو</button><button class="button button--quiet" type="button" data-open-food-picker="${dayKey}:${mealKey}:saved">خوراک‌های ذخیره‌شده</button><button class="button button--quiet" type="button" data-open-food-picker="${dayKey}:${mealKey}:ai">ثبت با هوش مصنوعی</button><button class="button button--quiet" type="button" data-add-combo="${dayKey}:${mealKey}">وعده ترکیبی</button><button class="button button--quiet" type="button" data-clear-meal="${dayKey}:${mealKey}">پاک‌کردن وعده</button></div></div>
                  <div class="plan-items">
                    ${(day.meals?.[mealKey] || []).map((item) => nutritionRowMarkup(dayKey, mealKey, item)).join("") || `<p class="plan-readonly-note">هنوز خوراکی برای این وعده تعریف نشده است.</p>`}
                  </div>
                </section>
              `).join("")}
              <p class="plan-readonly-note">${nutritionDeltaCopy(day)}</p>
            </article>`;
          }).join("")}
        </div>
      `;
    }

    function nutritionRowMarkup(dayKey, mealKey, item) {
      return `<div class="plan-item-row" data-item-id="${item.id}">
        <label class="field"><span class="field__label">خوراک</span><input data-bind="name" value="${escapeHtml(item.name)}" /></label>
        <label class="field field--sm"><span class="field__label">مقدار</span><input data-bind="amount" value="${escapeHtml(item.amount)}" /></label>
        <label class="field field--sm"><span class="field__label">واحد</span><input data-bind="unit" value="${escapeHtml(item.unit)}" /></label>
        <label class="field field--sm"><span class="field__label">کالری</span><input data-bind="calories" type="number" min="0" value="${item.calories || 0}" /></label>
        <label class="field field--sm"><span class="field__label">پروتئین</span><input data-bind="protein" type="number" min="0" value="${item.protein || 0}" /></label>
        <label class="field field--sm"><span class="field__label">کربوهیدرات</span><input data-bind="carbs" type="number" min="0" value="${item.carbs || 0}" /></label>
        <label class="field field--sm"><span class="field__label">چربی</span><input data-bind="fat" type="number" min="0" value="${item.fat || 0}" /></label>
        <label class="field"><span class="field__label">ساعت پیشنهادی</span><input data-bind="suggestedTime" type="time" value="${escapeHtml(item.suggestedTime || "")}" /></label>
        <label class="field"><span class="field__label">جایگزین</span><input data-bind="alternative" value="${escapeHtml(item.alternative || "")}" /></label>
        <div class="plan-inline-actions"><span class="plan-status-pill" data-tone="plan">برنامه‌ریزی‌شده</span></div>
        <button class="button button--quiet" type="button" data-remove-item="${dayKey}:${mealKey}:${item.id}">حذف</button>
      </div>`;
    }

    function workoutBuilderMarkup(activeDays, plan) {
      return `
        <div class="plan-builder-head"><h2>روزهای برنامه تمرینی</h2></div>
        <div class="plan-day-stack">
          ${activeDays.map((dayKey) => {
            const day = plan.schedule.days?.[dayKey] || { kind: "workout", session: sampleWorkout(weekdayLabel(dayKey)) };
            const exercises = day.session?.exercises || [];
            return `<article class="plan-day-card" data-day-key="${dayKey}">
              <div class="plan-day-head"><strong>${weekdayLabel(dayKey)}</strong><div class="plan-inline-actions"><button class="button button--quiet" type="button" data-copy-day="${dayKey}">کپی جلسه</button><button class="button button--quiet" type="button" data-clear-day="${dayKey}">پاک‌کردن روز</button></div></div>
              <div class="plan-form-grid">
                <label class="field"><span class="field__label">وضعیت روز</span><select data-day-kind><option value="workout" ${day.kind !== "rest" && day.kind !== "off" ? "selected" : ""}>جلسه تمرین</option><option value="rest" ${day.kind === "rest" ? "selected" : ""}>روز استراحت</option><option value="off" ${day.kind === "off" ? "selected" : ""}>بدون برنامه</option></select></label>
                <label class="field"><span class="field__label">نام جلسه</span><input data-session-bind="name" value="${escapeHtml(day.session?.name || "")}" /></label>
                <label class="field"><span class="field__label">مدت تقریبی</span><input data-session-bind="duration" type="number" min="1" value="${day.session?.duration || 30}" /></label>
                <label class="field"><span class="field__label">شدت</span><input data-session-bind="intensity" value="${escapeHtml(day.session?.intensity || "متوسط")}" /></label>
                <label class="field field--full"><span class="field__label">هدف جلسه</span><input data-session-bind="goal" value="${escapeHtml(day.session?.goal || "")}" /></label>
              </div>
              ${day.kind === "rest" ? `<p class="plan-readonly-note">این روز به‌عنوان استراحت ثبت می‌شود.</p>` : day.kind === "off" ? `<p class="plan-readonly-note">برای این روز برنامه‌ای تعریف نشده است.</p>` : `<div class="plan-builder-head"><strong>حرکت‌ها</strong><button class="button button--quiet" type="button" data-add-exercise="${dayKey}">افزودن حرکت</button></div>`}
              <div class="plan-items">
                ${day.kind === "workout" ? exercises.map((exercise, index) => `<div class="plan-item-row" data-item-id="${exercise.id}">
                  <label class="field"><span class="field__label">حرکت</span><input data-bind="name" value="${escapeHtml(exercise.name)}" /></label>
                  <label class="field field--sm"><span class="field__label">ست</span><input data-bind="sets" type="number" min="1" value="${exercise.sets || 1}" /></label>
                  <label class="field field--sm"><span class="field__label">تکرار</span><input data-bind="reps" type="number" min="0" value="${exercise.reps || 0}" /></label>
                  <label class="field field--sm"><span class="field__label">وزن</span><input data-bind="weight" value="${escapeHtml(exercise.weight || "")}" /></label>
                  <label class="field field--sm"><span class="field__label">زمان</span><input data-bind="seconds" type="number" min="0" value="${exercise.seconds || 0}" /></label>
                  <label class="field field--sm"><span class="field__label">مسافت</span><input data-bind="distance" value="${escapeHtml(exercise.distance || "")}" /></label>
                  <label class="field field--sm"><span class="field__label">استراحت</span><input data-bind="rest" type="number" min="0" value="${exercise.rest || 60}" /></label>
                  <label class="field"><span class="field__label">یادداشت</span><input data-bind="note" value="${escapeHtml(exercise.note || "")}" /></label>
                  <label class="field"><span class="field__label">حرکت جایگزین</span><input data-bind="alternative" value="${escapeHtml(exercise.alternative || "")}" /></label>
                  <div class="plan-inline-actions"><button class="button button--quiet" type="button" data-move-exercise="${dayKey}:${exercise.id}:up" ${index === 0 ? "disabled" : ""}>بالا</button><button class="button button--quiet" type="button" data-move-exercise="${dayKey}:${exercise.id}:down" ${index === exercises.length - 1 ? "disabled" : ""}>پایین</button></div>
                  <button class="button button--quiet" type="button" data-remove-exercise="${dayKey}:${exercise.id}">حذف</button>
                </div>`).join("") : ""}
              </div>
            </article>`;
          }).join("")}
        </div>
      `;
    }

    function moveExercise(value) {
      const [dayKey, itemId, direction] = value.split(":");
      const items = draft.schedule.days[dayKey]?.session?.exercises || [];
      const index = items.findIndex((item) => item.id === itemId);
      if (index < 0) return;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= items.length) return;
      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
      setDirty(true);
      renderBuilder();
    }

    function bindBuilderActions() {
      qsa("[data-open-food-picker]").forEach((button) => button.addEventListener("click", () => {
        const [dayKey, mealKey, flowTab] = button.dataset.openFoodPicker.split(":");
        openMealPicker(dayKey, mealKey, flowTab);
      }));
      qsa("[data-add-combo]").forEach((button) => button.addEventListener("click", () => {
        const [dayKey, mealKey] = button.dataset.addCombo.split(":");
        addComboMeal(dayKey, mealKey);
      }));
      qsa("[data-remove-item]").forEach((button) => button.addEventListener("click", () => {
        const [dayKey, mealKey, itemId] = button.dataset.removeItem.split(":");
        draft.schedule.days[dayKey].meals[mealKey] = (draft.schedule.days[dayKey].meals[mealKey] || []).filter((item) => item.id !== itemId);
        setDirty(true);
        renderBuilder();
      }));
      qsa("[data-copy-day]").forEach((button) => button.addEventListener("click", () => duplicateDay(button.dataset.copyDay)));
      qsa("[data-clear-day]").forEach((button) => button.addEventListener("click", () => clearDay(button.dataset.clearDay)));
      qsa("[data-clear-meal]").forEach((button) => button.addEventListener("click", () => {
        const [dayKey, mealKey] = button.dataset.clearMeal.split(":");
        ensureMeal(dayKey, mealKey).length = 0;
        setDirty(true);
        renderBuilder();
      }));
      qsa("[data-add-exercise]").forEach((button) => button.addEventListener("click", () => {
        const dayKey = button.dataset.addExercise;
        draft.schedule.days[dayKey] ||= { kind: "workout", session: sampleWorkout(weekdayLabel(dayKey)) };
        draft.schedule.days[dayKey].kind = "workout";
        draft.schedule.days[dayKey].session.exercises.push({ id: uid("exercise"), name: "حرکت جدید", sets: 3, reps: 10, weight: "", seconds: 0, distance: "", rest: 60, note: "", alternative: "" });
        setDirty(true);
        renderBuilder();
      }));
      qsa("[data-remove-exercise]").forEach((button) => button.addEventListener("click", () => {
        const [dayKey, itemId] = button.dataset.removeExercise.split(":");
        draft.schedule.days[dayKey].session.exercises = draft.schedule.days[dayKey].session.exercises.filter((item) => item.id !== itemId);
        setDirty(true);
        renderBuilder();
      }));
      qsa("[data-move-exercise]").forEach((button) => button.addEventListener("click", () => moveExercise(button.dataset.moveExercise)));
      qsa(".plan-item-row input, .plan-day-card [data-session-bind]", builder).forEach((input) => input.addEventListener("input", syncDraftFromBuilder));
      qsa("[data-day-kind]", builder).forEach((input) => input.addEventListener("change", syncDraftFromBuilder));
      qsa("[data-copy-first-day]").forEach((button) => button.addEventListener("click", () => {
        const activeDays = qsa('input[name="activeDay"]:checked', form).map((input) => input.value);
        const first = activeDays[0];
        if (!first || !draft.schedule.days[first]) return;
        activeDays.slice(1).forEach((dayKey) => {
          draft.schedule.days[dayKey] = clone(draft.schedule.days[first]);
        });
        setDirty(true);
        renderBuilder();
      }));
    }

    function syncDraftFromBuilder() {
      qsa(".plan-day-card", builder).forEach((card) => {
        const dayKey = card.dataset.dayKey;
        draft.schedule.days[dayKey] ||= draft.type === "workout" ? { kind: "workout", session: sampleWorkout(weekdayLabel(dayKey)) } : { meals: {} };
        if (draft.type === "workout") {
          draft.schedule.days[dayKey].kind = qs("[data-day-kind]", card)?.value || "workout";
          const session = draft.schedule.days[dayKey].session;
          qsa("[data-session-bind]", card).forEach((input) => {
            session[input.dataset.sessionBind] = input.type === "number" ? Number(input.value || 0) : input.value;
          });
          if (draft.schedule.days[dayKey].kind !== "workout") return;
          session.exercises = qsa(".plan-item-row", card).map((row) => ({
            id: row.dataset.itemId,
            name: qs('[data-bind="name"]', row)?.value || "",
            sets: Number(qs('[data-bind="sets"]', row)?.value || 0),
            reps: Number(qs('[data-bind="reps"]', row)?.value || 0),
            weight: qs('[data-bind="weight"]', row)?.value || "",
            seconds: Number(qs('[data-bind="seconds"]', row)?.value || 0),
            distance: qs('[data-bind="distance"]', row)?.value || "",
            rest: Number(qs('[data-bind="rest"]', row)?.value || 0),
            note: qs('[data-bind="note"]', row)?.value || "",
            alternative: qs('[data-bind="alternative"]', row)?.value || "",
          }));
        } else {
          draft.schedule.days[dayKey].meals ||= {};
          qsa("[data-meal-key]", card).forEach((section) => {
            const mealKey = section.dataset.mealKey;
            draft.schedule.days[dayKey].meals[mealKey] = qsa(".plan-item-row", section).map((row) => ({
              id: row.dataset.itemId,
              name: qs('[data-bind="name"]', row)?.value || "",
              amount: qs('[data-bind="amount"]', row)?.value || "",
              unit: qs('[data-bind="unit"]', row)?.value || "",
              calories: Number(qs('[data-bind="calories"]', row)?.value || 0),
              protein: Number(qs('[data-bind="protein"]', row)?.value || 0),
              carbs: Number(qs('[data-bind="carbs"]', row)?.value || 0),
              fat: Number(qs('[data-bind="fat"]', row)?.value || 0),
              suggestedTime: qs('[data-bind="suggestedTime"]', row)?.value || "",
              alternative: qs('[data-bind="alternative"]', row)?.value || "",
              planned: true,
            }));
          });
        }
      });
      setDirty(true);
    }

    function validate() {
      form.querySelectorAll(".field__error").forEach((node) => { node.textContent = ""; });
      const values = Object.fromEntries(new FormData(form).entries());
      const activeDays = qsa('input[name="activeDay"]:checked', form).map((input) => input.value);
      let valid = true;
      const setError = (name, message) => {
        const node = qs(`[data-error-for="${name}"]`, form);
        if (node) node.textContent = message;
        valid = false;
      };
      if (!values.name?.trim()) setError("name", "نام برنامه الزامی است.");
      if (values.startDate && values.endDate && compareDateOnly(values.endDate, values.startDate) < 0) setError("endDate", "تاریخ پایان نباید قبل از تاریخ شروع باشد.");
      if (!activeDays.length) setError("activeDay", "حداقل یک روز فعال لازم است.");
      syncDraftFromBuilder();
      if (draft.type === "nutrition") {
        const hasMeal = activeDays.some((dayKey) => Object.values(draft.schedule.days[dayKey]?.meals || {}).some((items) => items.length));
        if (!hasMeal) setError("activeDay", "برنامه غذایی باید حداقل یک وعده داشته باشد.");
      } else {
        const hasWorkout = activeDays.some((dayKey) => draft.schedule.days[dayKey]?.kind === "workout" && draft.schedule.days[dayKey]?.session?.exercises?.length);
        if (!hasWorkout) setError("activeDay", "برنامه تمرینی باید حداقل یک جلسه و یک حرکت داشته باشد.");
      }
      return { valid, values, activeDays };
    }

    qsa("input, textarea", form).forEach((field) => field.addEventListener("input", () => setDirty(true)));
    qsa('input[name="activeDay"]', form).forEach((field) => field.addEventListener("change", () => {
      setDirty(true);
      renderBuilder();
    }));

    qs("#save-plan-draft")?.addEventListener("click", () => save("draft"));
    qs("#save-plan-activate")?.addEventListener("click", () => save("active"));

    async function save(nextStatus, redirectHref = null) {
      const { valid, values, activeDays } = validate();
      if (!valid) return;
      const state = readState();
      if (nextStatus === "active") {
        const { approved, activePeer } = await confirmActivation(draft, existingId);
        if (!approved) return;
        if (activePeer) activePeer.status = "paused";
      }
      draft.name = values.name.trim();
      draft.description = values.description || "";
      draft.goal = values.goal || "";
      draft.startDate = values.startDate;
      draft.endDate = values.endDate;
      draft.status = nextStatus;
      draft.notes.plan = values.planNote || "";
      Object.keys(draft.schedule.days).forEach((dayKey) => {
        if (!activeDays.includes(dayKey)) delete draft.schedule.days[dayKey];
      });
      activeDays.forEach((dayKey) => {
        if (!draft.schedule.days[dayKey]) {
          draft.schedule.days[dayKey] = draft.type === "workout" ? { kind: "off", session: sampleWorkout(weekdayLabel(dayKey)) } : { meals: {} };
        }
      });
      if (existingId) {
        const target = state.plans.find((plan) => plan.id === existingId);
        if (target) Object.assign(target, clone(draft));
      } else {
        state.plans.unshift(clone(draft));
      }
      writeState(state);
      setDirty(false);
      showToast(nextStatus === "active" ? "برنامه ذخیره و فعال شد." : "پیش‌نویس برنامه ذخیره شد.");
      window.location.href = redirectHref || `plan-detail-botanical.html?id=${existingId || draft.id}`;
    }

    async function maybeConfirmLeave(nextHref = null, viaHistory = false) {
      if (!dirty) {
        if (viaHistory) {
          ignoreNextPop = true;
          window.history.back();
        } else if (nextHref) {
          window.location.href = nextHref;
        }
        return;
      }
      const choice = await openPlanDialog({
        title: "تغییرات ذخیره‌نشده",
        message: "می‌توانی پیش‌نویس را ذخیره کنی، بدون ذخیره خارج شوی یا به ویرایش ادامه بدهی.",
        actions: [
          { key: "save", label: "ذخیره پیش‌نویس", tone: "primary" },
          { key: "discard", label: "خروج بدون ذخیره", tone: "danger" },
          { key: "stay", label: "ادامه ویرایش", tone: "secondary" },
        ],
      });
      if (choice === "save") {
        await save("draft", nextHref);
      } else if (choice === "discard") {
        setDirty(false);
        if (viaHistory) {
          ignoreNextPop = true;
          window.history.back();
        } else if (nextHref) {
          window.location.href = nextHref;
        }
      }
    }

    qs("[data-plan-back]")?.addEventListener("click", (event) => {
      if (!dirty) return;
      event.preventDefault();
      maybeConfirmLeave(event.currentTarget.getAttribute("href"));
    });

    window.addEventListener("beforeunload", (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });

    window.addEventListener("popstate", () => {
      if (ignoreNextPop) {
        ignoreNextPop = false;
        return;
      }
      if (!dirty) return;
      window.history.pushState({ ...(window.history.state || {}), planEditorGuard: true }, "");
      maybeConfirmLeave(null, true);
    });

    renderBuilder();
    setDirty(false);
  }

  function showToast(message, action = null) {
    let toast = qs("#plan-flow-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "plan-flow-toast";
      toast.className = "toast";
      toast.hidden = true;
      toast.innerHTML = `<span class="toast__check" aria-hidden="true">✓</span><span id="plan-flow-toast-message"></span><button type="button" class="button button--quiet" id="plan-flow-toast-action" hidden></button>`;
      document.body.appendChild(toast);
    }
    qs("#plan-flow-toast-message").textContent = message;
    const actionButton = qs("#plan-flow-toast-action");
    if (action?.label && typeof action?.onAction === "function") {
      actionButton.hidden = false;
      actionButton.textContent = action.label;
      actionButton.onclick = () => {
        action.onAction();
        actionButton.hidden = true;
      };
    } else if (actionButton) {
      actionButton.hidden = true;
      actionButton.onclick = null;
    }
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.hidden = true;
      if (actionButton) {
        actionButton.hidden = true;
        actionButton.onclick = null;
      }
    }, 3200);
  }

  if (PAGE === "plans") renderPlansPage();
  if (PAGE === "plan-detail") renderPlanDetailPage();
  if (PAGE === "plan-editor") renderPlanEditorPage();
})();
