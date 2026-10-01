(function () {
  "use strict";

  const PAGE = document.body?.dataset.page || "";
  if (!["coach-space", "coach-permissions", "settings", "dashboard", "messages", "plans"].includes(PAGE)) {
    return;
  }

  const STORAGE_KEY = "avocado:coach-flow-v2";
  const SCENARIO = new URLSearchParams(window.location.search).get("scenario") || "";
  const MODE = new URLSearchParams(window.location.search).get("mode") || "";
  const ENTRY = new URLSearchParams(window.location.search).get("entry") || "";

  const PERMISSION_DEFS = [
    { id: "nutritionLogs", title: "خوراک و کالری", summaryText: "مربی مجموع کالری، ماکروها و میزان پایبندی روزانه را می‌بیند، اما جزئیات غذاها نمایش داده نمی‌شود.", fullText: "مربی نام خوراک‌ها، مقدار، وعده، یادداشت و خلاصه روزانه را می‌بیند." },
    { id: "mealPlans", title: "برنامه غذایی", summaryText: "ساختار برنامه، وعده‌های فعال و وضعیت کلی اجرای برنامه دیده می‌شود.", fullText: "مربی جزئیات هر وعده، یادداشت برنامه و تغییرات نسخه‌های فعال را می‌بیند." },
    { id: "workouts", title: "تمرین و فعالیت", summaryText: "وضعیت انجام جلسه‌ها، تعداد تمرین‌ها و نتیجه کلی هفته دیده می‌شود.", fullText: "مربی جزئیات جلسه‌ها، حرکات، ست‌ها، زمان و توضیح‌های هر ثبت را می‌بیند." },
    { id: "bodyMetrics", title: "وزن و اندازه‌های بدن", summaryText: "وزن، روند کلی و آخرین تغییرات نمایش داده می‌شود.", fullText: "مربی وزن، اندازه‌ها، یادداشت ثبت و مقایسه کامل دوره‌ها را می‌بیند." },
    { id: "reports", title: "گزارش‌ها و روندها", summaryText: "خلاصه روندها و نمودارهای سطح بالا در دسترس است.", fullText: "مربی ریز گزارش‌ها، فیلترها، بازه‌ها و مقایسه کامل روندها را می‌بیند." },
    { id: "files", title: "فایل‌ها", summaryText: "فقط فایل‌های انتخابی و خلاصه وضعیت آن‌ها قابل مشاهده است.", fullText: "فقط فایل‌های انتخاب‌شده و جزئیات کامل هر فایل قابل مشاهده است؛ فایل‌های آینده خودکار اضافه نمی‌شوند." },
    { id: "wellbeing", title: "خواب و حال بدن", note: "در صورت فعال‌بودن", summaryText: "امتیاز کلی خواب، انرژی و حال بدن دیده می‌شود.", fullText: "مربی جزئیات خواب، حال بدن، یادداشت‌های روزانه و روند کامل آن‌ها را می‌بیند." },
    { id: "medications", title: "داروها و مکمل‌ها", note: "اطلاعات حساس", sensitive: true, summaryText: "فقط دسته داروها و وضعیت پیگیری نمایش داده می‌شود.", fullText: "مربی نام داروها و مکمل‌ها، زمان مصرف و یادداشت‌های مرتبط را می‌بیند." },
  ];

  const LEVEL_LABELS = {
    none: "بدون دسترسی",
    summary: "فقط خلاصه",
    full: "جزئیات کامل",
  };

  const FILE_OPTIONS = [
    { id: "lab-spring", name: "آزمایش بهار", kind: "PDF", date: "2026-07-18", href: "image-17.png" },
    { id: "checkin-week2", name: "چک‌این هفته دوم", kind: "فرم", date: "2026-07-21", href: "tmp/food-log-export.png" },
    { id: "meal-photos", name: "گزارش تصویری وعده‌ها", kind: "ZIP", date: "2026-07-23", href: "tmp/saved-foods-export.png" },
  ];

  const INVITATIONS = {
    "AVA-COACH-1405": {
      id: "coach-nazanin",
      threadId: "nazanin",
      name: "نازنین رستگار",
      avatar: "ن",
      specialty: "تغذیه و پایش روزانه",
      clinic: "کلینیک هم‌راه تندرستی",
      bio: "با تمرکز روی نظم وعده‌ها، چک‌این هفتگی و هماهنگی برنامه تمرین و خوراک همراهت می‌ماند.",
    },
    "https://avocado.app/invite/nazanin": {
      id: "coach-nazanin",
      threadId: "nazanin",
      name: "نازنین رستگار",
      avatar: "ن",
      specialty: "تغذیه و پایش روزانه",
      clinic: "کلینیک هم‌راه تندرستی",
      bio: "با تمرکز روی نظم وعده‌ها، چک‌این هفتگی و هماهنگی برنامه تمرین و خوراک همراهت می‌ماند.",
    },
  };

  let memoryState = null;
  let storageError = false;
  let toastTimer = null;
  const focusReturnMap = new WeakMap();

  function todayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  function parseDateOnly(value) {
    if (!value) return null;
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function compareDateOnly(a, b) {
    if (!a || !b) return 0;
    return a.localeCompare(b);
  }

  function persianDate(value) {
    if (!value) return "—";
    const parsed = parseDateOnly(value) || new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
  }

  function persianDateTime(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(parsed);
  }

  function defaultPermissions() {
    return Object.fromEntries(PERMISSION_DEFS.map((item) => [item.id, "none"]));
  }

  function buildCoachRoute(state, extraEntry = "coach-space") {
    const threadId = state.coach?.threadId || state.pendingCoach?.threadId || state.inviteDraft?.threadId;
    if (!threadId) return "messages-botanical.html";
    return `messages-botanical.html?thread=${encodeURIComponent(threadId)}&entry=${encodeURIComponent(extraEntry)}`;
  }

  function defaultState() {
    return {
      connectionStatus: "none",
      coach: null,
      pendingCoach: null,
      inviteDraft: null,
      access: {
        status: "inactive",
        startedAt: "",
        endMode: "none",
        endDate: "",
      },
      permissionSnapshot: null,
      permissions: defaultPermissions(),
      selectedFiles: [],
      sharedPrograms: [
        { id: "nutrition-plan", title: "برنامه متعادل چهارهفته‌ای", type: "غذایی", status: "فعال", startDate: "2026-07-09", endDate: "2026-08-06", progress: 34, href: "plans-botanical.html" },
        { id: "workout-plan", title: "قدرت پایه · جلسه ۳", type: "تمرینی", status: "فعال", startDate: "2026-07-11", endDate: "2026-08-15", progress: 42, href: "workout-weekly-botanical.html" },
      ],
      weeklyTasks: [
        { id: "nutrition", title: "ثبت خوراک", due: "2026-07-25", status: "done", actionLabel: "مرور ثبت‌ها", href: "food-log-botanical.html" },
        { id: "workout", title: "انجام جلسه تمرین", due: "2026-07-26", status: "todo", actionLabel: "شروع جلسه", href: "workout-botanical.html" },
        { id: "weight", title: "ثبت وزن", due: "2026-07-27", status: "todo", actionLabel: "ثبت وزن", href: "body-botanical.html" },
        { id: "checkin", title: "تکمیل Check-in", due: "2026-07-28", status: "todo", actionLabel: "ارسال چک‌این", href: "" },
      ],
      latestFeedback: {
        date: "2026-07-24",
        topic: "پایبندی به وعده عصر",
        text: "ثبت وعده عصر منظم‌تر شده و حالا بهتر است روی آب عصرها و جمع‌بندی آخر شب تمرکز کنی.",
        details: "در سه روز گذشته ثبت عصرانه منظم‌تر شده است. برای ادامه، آب عصرها، جمع‌بندی آخر شب و ثبت به‌موقع روز تمرین را در اولویت نگه دار.",
      },
      nextCheckIn: "2026-07-29T18:30:00",
      sharedFiles: [
        { id: "f1", name: "آزمایش دوره‌ای", sender: "کاربر", date: "2026-07-18", type: "PDF", href: "image-17.png" },
        { id: "f2", name: "خلاصه چک‌این هفته", sender: "مربی", date: "2026-07-21", type: "فرم", href: "tmp/food-log-export.png" },
        { id: "f3", name: "بازخورد وعده‌ها", sender: "مربی", date: "2026-07-23", type: "یادداشت", href: "" },
      ],
      changeLog: [],
      endReason: "",
    };
  }

  function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeState(input) {
    const base = defaultState();
    const merged = {
      ...base,
      ...(input || {}),
      access: { ...base.access, ...((input && input.access) || {}) },
      permissions: { ...base.permissions, ...((input && input.permissions) || {}) },
      selectedFiles: Array.isArray(input?.selectedFiles) ? input.selectedFiles : [],
      sharedPrograms: Array.isArray(input?.sharedPrograms) ? input.sharedPrograms : base.sharedPrograms,
      weeklyTasks: Array.isArray(input?.weeklyTasks) ? input.weeklyTasks : base.weeklyTasks,
      sharedFiles: Array.isArray(input?.sharedFiles) ? input.sharedFiles : base.sharedFiles,
      changeLog: Array.isArray(input?.changeLog) ? input.changeLog : [],
    };
    merged.weeklyTasks = merged.weeklyTasks.map((task) => (
      task.id === "checkin" ? { ...task, href: buildCoachRoute(merged) } : task
    ));
    merged.sharedFiles = merged.sharedFiles.map((file) => (
      file.href ? file : { ...file, href: buildCoachRoute(merged) }
    ));
    return merged;
  }

  function readState() {
    if (!memoryState) memoryState = defaultState();
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return normalizeState(memoryState);
      const parsed = normalizeState(JSON.parse(raw));
      memoryState = cloneState(parsed);
      storageError = false;
      return parsed;
    } catch (_) {
      storageError = true;
      return normalizeState(memoryState || defaultState());
    }
  }

  function writeState(state) {
    memoryState = cloneState(normalizeState(state));
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      storageError = false;
      return true;
    } catch (_) {
      storageError = true;
      return false;
    }
  }

  function inviteLookup(value) {
    const trimmed = value.trim();
    if (!trimmed) return { status: "empty" };
    if (trimmed === "EXPIRED" || trimmed === "AVA-COACH-EXPIRED") return { status: "expired" };
    return INVITATIONS[trimmed] ? { status: "success", coach: cloneState(INVITATIONS[trimmed]) } : { status: "invalid" };
  }

  function accessCount(permissions) {
    return Object.values(permissions || {}).filter((value) => value !== "none").length;
  }

  function permissionSummary(permissions) {
    return PERMISSION_DEFS.filter((item) => permissions[item.id] !== "none").map((item) => item.title);
  }

  function effectivePermissions(state) {
    if (state.connectionStatus === "ended" || state.access.status === "revoked") {
      return defaultPermissions();
    }
    return state.permissions;
  }

  function computeAccessStatus(access, permissions) {
    const today = todayLocal();
    if (access.status === "revoked") return "revoked";
    if (access.startedAt && compareDateOnly(access.startedAt, today) > 0) return "scheduled";
    if (access.endMode === "date" && access.endDate && compareDateOnly(access.endDate, today) < 0) return "expired";
    if (accessCount(permissions) === 0) return "inactive";
    return "active";
  }

  function accessStatusLabel(status) {
    return {
      active: "فعال",
      inactive: "بدون دسترسی فعال",
      scheduled: "شروع در آینده",
      expired: "منقضی‌شده",
      revoked: "قطع‌شده",
    }[status] || "نامشخص";
  }

  function connectionStatusLabel(status) {
    return {
      none: "بدون مربی",
      pending: "در انتظار تأیید مربی",
      active: "همکاری فعال",
      rejected: "درخواست رد شده",
      ended: "همکاری پایان‌یافته",
    }[status] || "وضعیت نامشخص";
  }

  function makeToast() {
    let toast = document.getElementById("coach-toast");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "coach-toast";
    toast.hidden = true;
    toast.innerHTML = '<span aria-hidden="true">•</span><span id="coach-toast-message">ذخیره شد.</span><button class="button button--quiet button--sm" type="button">بستن</button>';
    document.body.appendChild(toast);
    toast.querySelector("button")?.addEventListener("click", () => {
      toast.hidden = true;
    });
    return toast;
  }

  function showToast(message) {
    const toast = makeToast();
    const label = toast.querySelector("#coach-toast-message");
    if (!label) return;
    label.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function ensureLiveRegion() {
    let region = document.getElementById("coach-aria-live");
    if (!region) {
      region = document.createElement("div");
      region.id = "coach-aria-live";
      region.className = "sr-only";
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }

  function announce(message) {
    const region = ensureLiveRegion();
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  function openDialog(dialog, opener) {
    if (!dialog) return;
    focusReturnMap.set(dialog, opener || document.activeElement);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    const focusTarget = focusReturnMap.get(dialog);
    if (focusTarget && typeof focusTarget.focus === "function") {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  function bindDialogDismiss(dialog) {
    if (!dialog) return;
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  }

  function getScenarioState() {
    const base = normalizeState(readState());
    if (!SCENARIO) return { mode: "normal", state: base };
    if (SCENARIO === "loading") return { mode: "loading", state: base };
    if (SCENARIO === "error") return { mode: "error", state: base };
    if (SCENARIO === "no-coach") return { mode: "normal", state: defaultState() };
    if (SCENARIO === "invite-valid") {
      base.inviteDraft = cloneState(INVITATIONS["AVA-COACH-1405"]);
      return { mode: "normal", state: base };
    }
    if (SCENARIO === "invite-invalid") return { mode: "invalid", state: base };
    if (SCENARIO === "pending") {
      base.pendingCoach = cloneState(INVITATIONS["AVA-COACH-1405"]);
      base.connectionStatus = "pending";
      return { mode: "normal", state: base };
    }
    if (SCENARIO === "active") {
      base.coach = cloneState(INVITATIONS["AVA-COACH-1405"]);
      base.connectionStatus = "active";
      base.access.startedAt = "2026-07-12";
      base.permissions = { ...defaultPermissions(), nutritionLogs: "summary", mealPlans: "full", workouts: "full", bodyMetrics: "summary", reports: "summary" };
      base.access.status = computeAccessStatus(base.access, base.permissions);
      return { mode: "normal", state: base };
    }
    if (SCENARIO === "inactive") {
      base.coach = cloneState(INVITATIONS["AVA-COACH-1405"]);
      base.connectionStatus = "active";
      base.permissions = defaultPermissions();
      base.access.status = "inactive";
      return { mode: "normal", state: base };
    }
    if (SCENARIO === "expired") {
      base.coach = cloneState(INVITATIONS["AVA-COACH-1405"]);
      base.connectionStatus = "active";
      base.access.startedAt = "2026-07-01";
      base.access.endMode = "date";
      base.access.endDate = "2026-07-24";
      base.permissions = { ...defaultPermissions(), nutritionLogs: "summary", workouts: "summary" };
      base.access.status = "expired";
      return { mode: "normal", state: base };
    }
    if (SCENARIO === "rejected") {
      base.pendingCoach = cloneState(INVITATIONS["AVA-COACH-1405"]);
      base.connectionStatus = "rejected";
      return { mode: "normal", state: base };
    }
    if (SCENARIO === "ended") {
      base.coach = cloneState(INVITATIONS["AVA-COACH-1405"]);
      base.connectionStatus = "ended";
      base.permissionSnapshot = { permissions: { ...defaultPermissions(), nutritionLogs: "summary", workouts: "full", reports: "summary" } };
      base.permissions = defaultPermissions();
      base.selectedFiles = [];
      base.access.status = "revoked";
      base.endReason = "پایان دوره فعلی";
      return { mode: "normal", state: base };
    }
    return { mode: "normal", state: base };
  }

  function retryReadableState() {
    return normalizeState(readState());
  }

  function coachCardMarkup(coach, state, showDates) {
    if (!coach) return "";
    return `
      <div class="coach-profile-card">
        <div class="coach-avatar">${coach.avatar || "م"}</div>
        <div class="coach-identity">
          <strong>${coach.name}</strong>
          <small>${coach.specialty || "—"}</small>
          ${coach.clinic ? `<small>${coach.clinic}</small>` : ""}
          ${showDates ? `<div class="coach-meta-list"><small>وضعیت همکاری: ${connectionStatusLabel(state.connectionStatus)}</small><small>تاریخ شروع: ${persianDate(state.access.startedAt || todayLocal())}</small></div>` : ""}
        </div>
      </div>`;
  }

  function summaryTagsMarkup(tags, title = "اطلاعات به‌اشتراک‌گذاشته‌شده") {
    return `
      <section class="coach-card coach-access-card" data-od-id="coach-shared-access">
        <div class="coach-card__head">
          <div><h3>${title}</h3><p>${tags.length ? `مربی در حال حاضر به ${tags.length} بخش دسترسی دارد.` : "هنوز دسترسی فعالی ثبت نشده است."}</p></div>
        </div>
        <div class="coach-access-tags">${tags.length ? tags.map((tag) => `<span class="coach-tag">${tag}</span>`).join("") : '<span class="coach-chip">بدون دسترسی فعال</span>'}</div>
      </section>`;
  }

  function bindOverflowMenu(trigger, menu) {
    if (!trigger || !menu) return;
    const closeMenu = () => {
      menu.hidden = true;
      document.removeEventListener("click", outsideClick, true);
      document.removeEventListener("keydown", escHandler, true);
    };
    const outsideClick = (event) => {
      if (!menu.contains(event.target) && event.target !== trigger) closeMenu();
    };
    const escHandler = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        trigger.focus();
      }
    };
    trigger.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        document.addEventListener("click", outsideClick, true);
        document.addEventListener("keydown", escHandler, true);
      } else {
        closeMenu();
      }
    });
  }

  function initCoachSpace() {
    const root = document.getElementById("coach-space-root");
    if (!root) return;
    const connectDialog = document.getElementById("coach-connect-dialog");
    const endDialog = document.getElementById("coach-end-dialog");
    const inviteInput = document.getElementById("coach-invite-input");
    const inviteError = document.getElementById("coach-invite-error");
    const inviteResults = document.getElementById("coach-connect-results");
    const inviteContinue = document.getElementById("coach-invite-continue");
    const endReason = document.getElementById("coach-end-reason");
    bindDialogDismiss(connectDialog);
    bindDialogDismiss(endDialog);
    let runtime = getScenarioState();
    let feedbackExpanded = false;
    let invitePreview = null;

    function renderEmpty() {
      root.innerHTML = `
        <section class="coach-empty-state" data-od-id="coach-empty-state">
          <div class="coach-empty-state__art">م</div>
          <h1>هنوز مربی‌ای به حسابت متصل نیست</h1>
          <p>${storageError ? "ذخیره‌ی محلی در دسترس نیست، اما هنوز می‌توانی این جریان را ببینی و ادامه بدهی." : "می‌توانی با کد یا لینک دعوت، فضای مشترک با مربی را فعال کنی و بعد سطح دسترسی‌ها را خودت انتخاب کنی."}</p>
          <button class="button button--primary button--lg" type="button" id="coach-open-connect">اتصال به مربی</button>
        </section>`;
      root.querySelector("#coach-open-connect")?.addEventListener("click", (event) => openDialog(connectDialog, event.currentTarget));
    }

    function renderError() {
      root.innerHTML = `
        <section class="coach-state-panel" data-od-id="coach-error-state">
          <div class="coach-state-panel__art">!</div>
          <h2>دریافت اطلاعات همکاری انجام نشد</h2>
          <p>یک‌بار دیگر تلاش کن تا وضعیت فعلی دوباره خوانده شود.</p>
          <button class="button button--secondary" type="button" id="coach-retry-button">تلاش دوباره</button>
        </section>`;
      root.querySelector("#coach-retry-button")?.addEventListener("click", () => {
        runtime = { mode: "normal", state: retryReadableState() };
        render();
      });
    }

    function renderPending(state) {
      const coach = state.pendingCoach;
      root.innerHTML = `
        <section class="coach-hero" data-od-id="coach-pending-hero">
          <span class="coach-eyebrow">درخواست ارتباط</span>
          ${coachCardMarkup(coach, state, true)}
          <div class="coach-notice coach-notice--pending">
            <strong>در انتظار تأیید مربی</strong>
            <p>تا قبل از تأیید مربی، برنامه‌ها، کارها، فایل‌ها و ارسال پیام جدید فعال نمی‌شوند.</p>
          </div>
          <div class="coach-inline-actions">
            <button class="button button--secondary" type="button" id="coach-cancel-request">لغو درخواست</button>
          </div>
        </section>`;
      root.querySelector("#coach-cancel-request")?.addEventListener("click", () => {
        const next = readState();
        next.pendingCoach = null;
        next.connectionStatus = "none";
        next.inviteDraft = null;
        next.access.status = "inactive";
        writeState(next);
        runtime = { mode: "normal", state: next };
        showToast("درخواست ارتباط لغو شد.");
        render();
      });
    }

    function renderRejected(state) {
      root.innerHTML = `
        <section class="coach-state-panel" data-od-id="coach-rejected-state">
          <div class="coach-state-panel__art">×</div>
          ${coachCardMarkup(state.pendingCoach, state, true)}
          <h2>درخواست ارتباط پذیرفته نشد</h2>
          <p>می‌توانی با دعوت جدید دوباره تلاش کنی.</p>
          <button class="button button--primary" type="button" id="coach-retry-connect">اتصال با دعوت جدید</button>
        </section>`;
      root.querySelector("#coach-retry-connect")?.addEventListener("click", (event) => openDialog(connectDialog, event.currentTarget));
    }

    function programsMarkup(state, readOnly) {
      return `
        <section class="coach-card ${readOnly ? "coach-card--readonly" : ""}" data-od-id="coach-shared-programs">
          <div class="coach-card__head"><div><h2>برنامه‌های مشترک</h2><p>${readOnly ? "برنامه‌ها باقی می‌مانند اما دیگر به‌روزرسانی جدیدی از طرف مربی دریافت نمی‌کنند." : "برنامه‌های فعال مرتبط با همکاری فعلی."}</p></div></div>
          <details class="coach-mobile-collapse" open>
            <summary><strong>فهرست برنامه‌ها</strong><span class="coach-chip">${state.sharedPrograms.length} برنامه</span></summary>
            <div class="coach-program-grid coach-responsive-programs">
              ${state.sharedPrograms.map((program) => `
                <article class="coach-program-card" data-tone="plan">
                  <div class="coach-program-card__meta">
                    <span>نوع برنامه</span>
                    <strong>${program.type}</strong>
                  </div>
                  <strong>${program.title}</strong>
                  <div class="coach-file-meta">
                    <span>وضعیت: ${readOnly ? "فقط‌خواندنی" : program.status}</span>
                    <span>شروع: ${persianDate(program.startDate)}</span>
                    <span>پایان: ${persianDate(program.endDate)}</span>
                  </div>
                  <div class="progress-track" style="--progress:${program.progress}%"><span style="--progress:${program.progress}%"></span></div>
                  <a class="button button--secondary button--sm" href="${program.href}">مشاهده برنامه</a>
                </article>`).join("")}
            </div>
          </details>
        </section>`;
    }

    function filesMarkup(state, collapsedLabel = "فایل‌های مشترک") {
      return `
        <section class="coach-card coach-files-panel" data-od-id="coach-shared-files">
          <details class="coach-mobile-collapse" open>
            <summary><strong>${collapsedLabel}</strong><span class="coach-chip">${state.sharedFiles.length} فایل</span></summary>
            <div class="coach-file-list">
              ${state.sharedFiles.map((file) => `
                <div class="coach-file-row">
                  <div class="coach-file-row__content">
                    <strong>${file.name}</strong>
                    <small>${file.sender} · ${persianDate(file.date)} · ${file.type}</small>
                  </div>
                  <a class="button button--quiet button--sm" href="${file.href || buildCoachRoute(state)}">مشاهده</a>
                </div>`).join("")}
            </div>
            <a class="button button--secondary button--sm" href="${buildCoachRoute(state)}">رفتن به همه فایل‌ها</a>
          </details>
        </section>`;
    }

    function renderActiveOrEnded(state) {
      const accessStatus = computeAccessStatus(state.access, effectivePermissions(state));
      const permissions = effectivePermissions(state);
      const tags = permissionSummary(state.connectionStatus === "ended" ? defaultPermissions() : permissions);
      const previousTags = permissionSummary(state.permissionSnapshot?.permissions || {});
      const ended = state.connectionStatus === "ended";
      const inactive = accessStatus === "inactive";
      const manageLabel = inactive ? "فعال‌کردن دسترسی‌ها" : accessStatus === "expired" ? "مدیریت یا تمدید دسترسی" : "مدیریت دسترسی‌ها";
      const routeToMessages = buildCoachRoute(state);
      const feedbackText = feedbackExpanded ? state.latestFeedback.details : state.latestFeedback.text;
      root.innerHTML = `
        <section class="coach-hero" data-od-id="coach-space-hero">
          <div class="coach-hero__head">
            <div>
              <span class="coach-eyebrow">فضای مشترک با مربی</span>
              ${coachCardMarkup(state.coach, state, true)}
            </div>
            <div class="coach-inline-actions">
              <span class="coach-status-badge" data-status="${accessStatus}">${accessStatusLabel(accessStatus)}</span>
              ${ended ? "" : `<div class="coach-overflow"><button class="icon-button" type="button" id="coach-menu-trigger" aria-label="گزینه‌های بیشتر">⋯</button><div class="coach-overflow__menu" id="coach-menu" hidden><button type="button" id="coach-end-trigger">پایان همکاری</button></div></div>`}
            </div>
          </div>
          <div class="coach-summary-grid">
            <div class="coach-summary-metric"><span>تاریخ شروع همکاری</span><strong>${persianDate(state.access.startedAt || todayLocal())}</strong></div>
            <div class="coach-summary-metric"><span>Check-in بعدی</span><strong>${persianDateTime(state.nextCheckIn)}</strong></div>
            <div class="coach-summary-metric"><span>وضعیت دسترسی</span><strong>${accessStatusLabel(accessStatus)}</strong></div>
            <div class="coach-summary-metric"><span>بخش‌های فعال</span><strong>${ended ? "۰ بخش" : `${accessCount(permissions)} بخش`}</strong></div>
          </div>
          ${accessStatus === "scheduled" ? `<div class="coach-notice"><strong>دسترسی از ${persianDate(state.access.startedAt)} شروع می‌شود</strong><p>تا آن زمان هیچ داده‌ای در اختیار مربی قرار نمی‌گیرد.</p></div>` : ""}
          ${accessStatus === "expired" ? `<div class="coach-notice coach-notice--expired"><strong>دسترسی‌ها منقضی شده‌اند</strong><p>بخش‌های اشتراکی فعلاً دیگر قابل مشاهده نیستند.</p></div>` : ""}
          ${ended ? `<div class="coach-notice coach-notice--ended"><strong>همکاری پایان یافته است</strong><p>پیام‌ها و برنامه‌های قبلی فقط‌خواندنی باقی مانده‌اند و دسترسی فعال دیگری وجود ندارد.</p></div>` : ""}
          <div class="coach-inline-actions">
            <a class="button button--primary" href="${routeToMessages}">${ended ? "مشاهده پیام‌های قبلی" : "ارسال پیام"}</a>
            ${ended ? `<button class="button button--secondary is-disabled" type="button" aria-disabled="true">مدیریت دسترسی‌ها</button>` : `<a class="button button--secondary" href="coach-permissions-botanical.html">${manageLabel}</a>`}
            ${ended ? `<button class="button button--secondary" type="button" id="coach-reconnect">اتصال دوباره به مربی</button>` : ""}
          </div>
        </section>
        <div class="coach-space-layout">
          <div class="coach-main-column">
            <section class="coach-card" data-od-id="coach-collaboration-summary">
              <div class="coach-card__head"><div><h2>${ended ? "خلاصه همکاری گذشته" : "خلاصه همکاری"}</h2><p>نمای سریع از برنامه‌ها، کارها و بازخوردهای همین دوره.</p></div></div>
              <div class="coach-summary-grid">
                <div class="coach-mini-card"><span>برنامه‌های مشترک</span><strong>${state.sharedPrograms.length} برنامه</strong></div>
                <div class="coach-mini-card"><span>کارهای این هفته</span><strong>${ended ? "فقط‌خواندنی" : `${state.weeklyTasks.filter((item) => item.status !== "done").length} مورد باقی‌مانده`}</strong></div>
                <div class="coach-mini-card"><span>آخرین بازخورد</span><strong>${persianDate(state.latestFeedback.date)}</strong></div>
                <div class="coach-mini-card"><span>فایل‌های مشترک</span><strong>${state.sharedFiles.length} فایل</strong></div>
              </div>
            </section>
            ${programsMarkup(state, ended)}
            ${ended ? "" : `
              <section class="coach-card" data-od-id="coach-weekly-tasks">
                <div class="coach-card__head"><div><h2>کارهای این هفته</h2><p>کارهایی که مربی برای همین هفته با تو هماهنگ کرده است.</p></div></div>
                <div class="coach-task-list">
                  ${state.weeklyTasks.map((task) => `
                    <div class="coach-task-row">
                      <div class="coach-task-row__content">
                        <strong>${task.title}</strong>
                        <small>مهلت: ${persianDate(task.due)} · ${task.status === "done" ? "انجام‌شده" : "باقی‌مانده"}</small>
                      </div>
                      <a class="button ${task.status === "done" ? "button--secondary" : "button--primary"} button--sm" href="${task.id === "checkin" ? routeToMessages : task.href}">${task.actionLabel}</a>
                    </div>`).join("")}
                </div>
              </section>`}
            <section class="coach-card" data-od-id="coach-latest-feedback">
              <div class="coach-card__head"><div><h2>آخرین بازخورد مربی</h2><p>${persianDate(state.latestFeedback.date)} · ${state.latestFeedback.topic}</p></div></div>
              <div class="coach-feedback-card">
                <p>${feedbackText}</p>
                <div class="coach-inline-actions">
                  <a class="button button--secondary button--sm" href="${routeToMessages}">پاسخ در پیام‌ها</a>
                  <button class="button button--quiet button--sm" type="button" id="coach-feedback-toggle">${feedbackExpanded ? "بستن" : "مشاهده کامل"}</button>
                </div>
              </div>
            </section>
          </div>
          <aside class="coach-sidebar coach-stack">
            ${summaryTagsMarkup(tags)}
            ${ended && previousTags.length ? summaryTagsMarkup(previousTags, "دسترسی‌های قبلی") : ""}
            ${filesMarkup(state)}
          </aside>
        </div>`;

      bindOverflowMenu(root.querySelector("#coach-menu-trigger"), root.querySelector("#coach-menu"));
      root.querySelector("#coach-end-trigger")?.addEventListener("click", (event) => openDialog(endDialog, event.currentTarget));
      root.querySelector("#coach-feedback-toggle")?.addEventListener("click", (event) => {
        feedbackExpanded = !feedbackExpanded;
        renderActiveOrEnded(runtime.state);
        event.currentTarget.focus();
      });
      root.querySelector("#coach-reconnect")?.addEventListener("click", (event) => {
        const next = readState();
        next.coach = null;
        next.pendingCoach = null;
        next.inviteDraft = null;
        next.connectionStatus = "none";
        next.permissions = defaultPermissions();
        next.access = { status: "inactive", startedAt: "", endMode: "none", endDate: "" };
        writeState(next);
        runtime = { mode: "normal", state: next };
        openDialog(connectDialog, event.currentTarget);
        render();
      });
    }

    function render() {
      const state = runtime.state;
      if (runtime.mode === "loading") {
        root.innerHTML = `
          <section class="coach-state-panel" data-od-id="coach-loading-state">
            <div class="coach-state-panel__art">…</div>
            <h2>در حال بارگذاری فضای مشترک</h2>
            <div class="coach-skeleton"><span></span><span></span><span></span></div>
          </section>`;
        return;
      }
      if (runtime.mode === "error") {
        renderError();
        return;
      }
      if (!state.coach && !state.pendingCoach) {
        renderEmpty();
        return;
      }
      if (state.connectionStatus === "pending" && state.pendingCoach) {
        renderPending(state);
        return;
      }
      if (state.connectionStatus === "rejected" && state.pendingCoach) {
        renderRejected(state);
        return;
      }
      renderActiveOrEnded(state);
    }

    document.getElementById("coach-connect-cancel")?.addEventListener("click", () => {
      invitePreview = null;
      inviteContinue.disabled = true;
      inviteResults.innerHTML = "";
      closeDialog(connectDialog);
    });
    document.getElementById("coach-connect-cancel-secondary")?.addEventListener("click", () => {
      invitePreview = null;
      inviteContinue.disabled = true;
      inviteResults.innerHTML = "";
      closeDialog(connectDialog);
    });
    document.getElementById("coach-end-cancel")?.addEventListener("click", () => closeDialog(endDialog));
    document.getElementById("coach-end-cancel-secondary")?.addEventListener("click", () => closeDialog(endDialog));

    document.getElementById("coach-verify-invite")?.addEventListener("click", (event) => {
      inviteError.textContent = "";
      inviteResults.innerHTML = "";
      invitePreview = null;
      const result = inviteLookup(inviteInput.value);
      if (result.status === "empty") {
        inviteError.textContent = "کد یا لینک دعوت را وارد کن.";
        inviteContinue.disabled = true;
        return;
      }
      if (result.status === "expired") {
        inviteResults.innerHTML = '<div class="coach-state-panel"><div class="coach-state-panel__art">!</div><h2>دعوت منقضی شده است</h2><p>از مربی بخواه لینک یا کد تازه بفرستد.</p></div>';
        inviteContinue.disabled = true;
        return;
      }
      if (result.status === "invalid") {
        inviteResults.innerHTML = '<div class="coach-state-panel"><div class="coach-state-panel__art">?</div><h2>دعوت معتبر نیست</h2><p>کد یا لینک را دوباره بررسی کن.</p></div>';
        inviteContinue.disabled = true;
        return;
      }
      invitePreview = result.coach;
      inviteResults.innerHTML = `<div class="coach-preview-card"><div class="coach-preview-card__row"><div class="coach-avatar">${result.coach.avatar}</div><div class="coach-identity"><strong>${result.coach.name}</strong><small>${result.coach.specialty}</small>${result.coach.clinic ? `<small>${result.coach.clinic}</small>` : ""}<small>${result.coach.bio}</small></div></div></div>`;
      inviteContinue.disabled = false;
      announce("اطلاعات مربی دعوت‌شده آماده‌ی بررسی است.");
      event.currentTarget.focus();
    });

    inviteContinue?.addEventListener("click", () => {
      if (!invitePreview) return;
      const next = readState();
      next.inviteDraft = cloneState(invitePreview);
      next.pendingCoach = null;
      next.connectionStatus = next.coach ? next.connectionStatus : "none";
      writeState(next);
      closeDialog(connectDialog);
      window.location.href = "coach-permissions-botanical.html?mode=connect";
    });

    document.getElementById("coach-end-submit")?.addEventListener("click", () => {
      const next = readState();
      next.permissionSnapshot = {
        permissions: cloneState(next.permissions),
        selectedFiles: [...next.selectedFiles],
      };
      next.connectionStatus = "ended";
      next.inviteDraft = null;
      next.pendingCoach = null;
      next.access.status = "revoked";
      next.access.endDate = todayLocal();
      next.permissions = defaultPermissions();
      next.selectedFiles = [];
      next.endReason = endReason.value.trim();
      next.changeLog.unshift({ date: todayLocal(), type: "end", note: "همکاری پایان یافت و دسترسی‌ها قطع شدند." });
      writeState(next);
      runtime = { mode: "normal", state: next };
      closeDialog(endDialog);
      showToast("همکاری پایان یافت و دسترسی مؤثر به صفر رسید.");
      render();
    });

    render();
  }

  function initCoachPermissions() {
    const root = document.getElementById("coach-permissions-root");
    const footer = document.getElementById("coach-permissions-footer");
    if (!root || !footer) return;
    const sensitiveDialog = document.getElementById("coach-sensitive-dialog");
    const confirmDialog = document.getElementById("coach-save-dialog");
    const revokeDialog = document.getElementById("coach-revoke-dialog");
    const unsavedDialog = document.getElementById("coach-unsaved-dialog");
    [sensitiveDialog, confirmDialog, revokeDialog, unsavedDialog].forEach(bindDialogDismiss);

    let state = readState();
    let coach = MODE === "connect" ? state.inviteDraft : state.coach;
    let permissionLiveState = "";
    let baseline = buildBaseline();
    let draft = cloneState(baseline);
    let sensitiveTarget = null;
    let pendingNavigation = "";

    function buildBaseline() {
      return {
        permissions: cloneState(state.permissions),
        selectedFiles: [...state.selectedFiles],
        access: {
          startMode: state.access.startedAt && state.access.startedAt !== todayLocal() ? "custom" : "today",
          startedAt: state.access.startedAt || todayLocal(),
          endMode: state.access.endMode || "none",
          endDate: state.access.endDate || "",
        },
      };
    }

    function isEditableState() {
      const currentAccess = computeAccessStatus(state.access, effectivePermissions(state));
      if (MODE === "connect" && state.inviteDraft) return true;
      if (!state.coach) return false;
      if (state.connectionStatus === "ended" || state.connectionStatus === "rejected" || state.connectionStatus === "pending") return false;
      return currentAccess === "active" || currentAccess === "expired" || currentAccess === "inactive" || currentAccess === "scheduled";
    }

    function currentStartDate() {
      return draft.access.startMode === "today" ? todayLocal() : draft.access.startedAt;
    }

    function validateDraft() {
      const errors = {};
      const startDate = currentStartDate();
      if (draft.access.startMode === "custom" && !draft.access.startedAt) {
        errors.startedAt = "تاریخ شروع را مشخص کن.";
      }
      if (draft.access.endMode === "date") {
        if (!draft.access.endDate) {
          errors.endDate = "تاریخ پایان را مشخص کن.";
        } else if (compareDateOnly(draft.access.endDate, startDate) < 0) {
          errors.endDate = "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.";
        }
      }
      return errors;
    }

    function hasChanges() {
      return JSON.stringify(draft) !== JSON.stringify(baseline);
    }

    function requestLeave(targetHref) {
      if (!hasChanges()) {
        cleanupInviteDraft();
        window.location.href = targetHref;
        return;
      }
      pendingNavigation = targetHref;
      openDialog(unsavedDialog, document.activeElement);
    }

    function cleanupInviteDraft() {
      if (MODE === "connect" && state.inviteDraft && !state.coach) {
        state = readState();
        state.inviteDraft = null;
        writeState(state);
      }
    }

    function permissionCopy(item, level) {
      if (level === "none") return "هیچ داده‌ای از این بخش با مربی به اشتراک گذاشته نمی‌شود.";
      return level === "summary" ? item.summaryText : item.fullText;
    }

    function fileDiff() {
      return {
        added: draft.selectedFiles.filter((id) => !baseline.selectedFiles.includes(id)).map((id) => FILE_OPTIONS.find((item) => item.id === id)).filter(Boolean),
        removed: baseline.selectedFiles.filter((id) => !draft.selectedFiles.includes(id)).map((id) => FILE_OPTIONS.find((item) => item.id === id)).filter(Boolean),
      };
    }

    function diffRows() {
      return PERMISSION_DEFS.map((item) => {
        const before = baseline.permissions[item.id];
        const after = draft.permissions[item.id];
        if (before === after) return "";
        return `<li><strong>${item.title}</strong><span>از ${LEVEL_LABELS[before]} به ${LEVEL_LABELS[after]}</span></li>`;
      }).filter(Boolean);
    }

    function accessDiffRows() {
      const rows = [];
      if (baseline.access.startMode !== draft.access.startMode || baseline.access.startedAt !== draft.access.startedAt) {
        rows.push(`<li><strong>شروع دسترسی</strong><span>${draft.access.startMode === "today" ? "شروع از امروز" : `شروع در ${persianDate(draft.access.startedAt)}`}</span></li>`);
      }
      if (baseline.access.endMode !== draft.access.endMode || baseline.access.endDate !== draft.access.endDate) {
        const endText = draft.access.endMode === "none" ? "بدون تاریخ پایان" : draft.access.endMode === "collaboration" ? "پایان همزمان با پایان همکاری" : `پایان در ${persianDate(draft.access.endDate)}`;
        rows.push(`<li><strong>پایان دسترسی</strong><span>${endText}</span></li>`);
      }
      return rows;
    }

    function filePickerMarkup() {
      if (draft.permissions.files === "none") return "";
      return `
        <div class="coach-file-picker">
          <p class="coach-dialog__hint">فقط فایل‌های انتخابی با مربی به اشتراک گذاشته می‌شوند.</p>
          ${FILE_OPTIONS.map((file) => `
            <label class="coach-file-picker__row">
              <input type="checkbox" value="${file.id}" ${draft.selectedFiles.includes(file.id) ? "checked" : ""} data-file-toggle="${file.id}">
              <div><strong>${file.name}</strong><small>${file.kind} · ${persianDate(file.date)}</small></div>
            </label>`).join("")}
          ${draft.selectedFiles.length ? "" : '<p class="coach-empty-inline">هنوز فایلی برای اشتراک انتخاب نشده است.</p>'}
        </div>`;
    }

    function renderAccessSummary(status) {
      return `
        <div class="coach-summary-grid">
          <div class="coach-summary-metric"><span>تعداد بخش‌های دارای دسترسی</span><strong>${accessCount(draft.permissions)} بخش</strong></div>
          <div class="coach-summary-metric"><span>تاریخ شروع دسترسی</span><strong>${persianDate(currentStartDate())}</strong></div>
          <div class="coach-summary-metric"><span>تاریخ پایان</span><strong>${draft.access.endMode === "date" ? persianDate(draft.access.endDate) : draft.access.endMode === "collaboration" ? "همزمان با پایان همکاری" : "بدون پایان"}</strong></div>
          <div class="coach-summary-metric"><span>وضعیت دسترسی</span><strong>${accessStatusLabel(status)}</strong></div>
        </div>`;
    }

    function renderReadOnlyState(title, body) {
      root.innerHTML = `
        <section class="coach-state-panel" data-od-id="coach-permissions-readonly">
          <div class="coach-state-panel__art">م</div>
          <h2>${title}</h2>
          <p>${body}</p>
          <a class="button button--primary" href="coach-space-botanical.html">بازگشت به فضای مربی</a>
        </section>`;
      footer.innerHTML = "";
    }

    function renderPage(focusSelector) {
      state = readState();
      coach = MODE === "connect" ? state.inviteDraft : state.coach;
      if (!coach) {
        renderReadOnlyState("ابتدا یک مربی را به حسابت متصل کن", "تا وقتی مربی متصل نشده باشد، صفحه دسترسی‌ها چیزی برای تنظیم ندارد.");
        return;
      }
      if (!isEditableState()) {
        if (state.connectionStatus === "ended") {
          renderReadOnlyState("همکاری پایان یافته و دسترسی جدیدی قابل تنظیم نیست.", "برای این همکاری، فقط وضعیت قبلی و پیام‌های قبلی قابل مشاهده‌اند.");
        } else if (state.connectionStatus === "pending") {
          renderReadOnlyState("درخواست ارتباط ارسال شده است.", "تا وقتی مربی درخواست را تأیید نکند، ویرایش دسترسی‌ها ممکن نیست.");
        } else if (state.connectionStatus === "rejected") {
          renderReadOnlyState("این دعوت دیگر قابل استفاده نیست.", "برای ویرایش دسترسی‌ها ابتدا باید دعوت تازه‌ای را آغاز کنی.");
        } else {
          renderReadOnlyState("این صفحه در حال حاضر قابل ویرایش نیست.", "برای ادامه به فضای مربی برگرد.");
        }
        return;
      }

      const errors = validateDraft();
      const previewItems = PERMISSION_DEFS.filter((item) => draft.permissions[item.id] !== "none");
      const status = computeAccessStatus({ ...state.access, startedAt: currentStartDate(), endMode: draft.access.endMode, endDate: draft.access.endDate }, draft.permissions);
      root.innerHTML = `
        <section class="coach-card" data-od-id="coach-permissions-header">
          <div class="coach-header-row">
            <div>
              <button class="coach-link-row coach-link-button" type="button" id="coach-back-link">بازگشت</button>
              <h1 class="coach-page-title">دسترسی‌های مربی</h1>
              <p class="coach-page-subtitle">${coach.name} · خودت مشخص می‌کنی چه اطلاعاتی و با چه سطحی به اشتراک گذاشته شود.</p>
            </div>
            <div class="coach-inline-actions">
              <span class="coach-status-badge" data-status="${status}">${accessStatusLabel(status)}</span>
            </div>
          </div>
          ${renderAccessSummary(status)}
        </section>

        <section class="coach-permissions-list" data-od-id="coach-permission-groups">
          ${PERMISSION_DEFS.map((item) => `
            <article class="coach-permission-card" data-permission-id="${item.id}">
              <div class="coach-permission-card__head">
                <div class="coach-inline-actions">
                  <h3>${item.title}</h3>
                  ${item.note ? `<span class="${item.sensitive ? "coach-sensitive-badge" : "coach-chip"}">${item.note}</span>` : ""}
                </div>
                <p>${permissionCopy(item, draft.permissions[item.id])}</p>
              </div>
              <div class="coach-segmented" role="group" aria-label="${item.title}">
                ${["none", "summary", "full"].map((level) => `
                  <button type="button" data-level="${level}" data-permission-trigger="${item.id}" aria-pressed="${draft.permissions[item.id] === level}" class="${draft.permissions[item.id] === level ? "is-selected" : ""}">
                    <span class="coach-segmented__icon" aria-hidden="true">${draft.permissions[item.id] === level ? "✓" : ""}</span>
                    <span>${LEVEL_LABELS[level]}</span>
                  </button>`).join("")}
              </div>
              ${item.id === "files" ? filePickerMarkup() : ""}
            </article>`).join("")}
        </section>

        <section class="coach-card" data-od-id="coach-access-duration">
          <div class="coach-card__head"><div><h2>مدت دسترسی</h2><p>شروع و پایان دسترسی را جدا از خود همکاری مشخص کن.</p></div></div>
          <div class="coach-date-grid">
            <label class="coach-date-option"><input type="radio" name="coach-start-mode" value="today" ${draft.access.startMode === "today" ? "checked" : ""}><div><strong>شروع از امروز</strong><small>از امروز فعال می‌شود.</small></div></label>
            <label class="coach-date-option"><input type="radio" name="coach-start-mode" value="custom" ${draft.access.startMode === "custom" ? "checked" : ""}><div><strong>شروع در تاریخ دلخواه</strong><small>اگر باید در روز دیگری آغاز شود.</small></div></label>
            <div class="coach-date-inputs" id="coach-start-date-row" ${draft.access.startMode === "custom" ? "" : "hidden"}>
              <label><span class="sr-only">تاریخ شروع</span><input type="date" id="coach-access-start" value="${draft.access.startedAt || todayLocal()}"></label>
            </div>
            <div class="coach-field-error">${errors.startedAt || ""}</div>
            <div class="coach-date-inputs">
              <label><span class="sr-only">نوع پایان</span><select id="coach-access-end-mode"><option value="none" ${draft.access.endMode === "none" ? "selected" : ""}>بدون تاریخ پایان</option><option value="date" ${draft.access.endMode === "date" ? "selected" : ""}>پایان در تاریخ مشخص</option><option value="collaboration" ${draft.access.endMode === "collaboration" ? "selected" : ""}>پایان همزمان با پایان همکاری</option></select></label>
            </div>
            <div class="coach-date-inputs" id="coach-end-date-row" ${draft.access.endMode === "date" ? "" : "hidden"}>
              <label><span class="sr-only">تاریخ پایان</span><input type="date" id="coach-access-end-date" value="${draft.access.endDate || ""}"></label>
            </div>
            <div class="coach-field-error">${errors.endDate || ""}</div>
          </div>
        </section>

        <details class="coach-card coach-accordion" open data-od-id="coach-preview-accordion">
          <summary><strong>مربی دقیقاً چه چیزی می‌بیند؟</strong><span class="coach-chip">${previewItems.length} مورد فعال</span></summary>
          <ul class="coach-preview-list">
            ${previewItems.length ? previewItems.map((item) => `<li><strong>${item.title}</strong><span>${permissionCopy(item, draft.permissions[item.id])}</span></li>`).join("") : '<li><strong>هنوز دسترسی فعالی انتخاب نشده است.</strong><span>اتصال مربی به معنی اشتراک خودکار داده‌ها نیست.</span></li>'}
          </ul>
        </details>`;

      footer.innerHTML = `
        <div class="coach-sticky-footer">
          <div class="coach-sticky-footer__actions">
            <button class="button button--primary" type="button" id="coach-save-button" ${!hasChanges() || Object.keys(errors).length ? "disabled" : ""}>${MODE === "connect" ? "تأیید و ارسال درخواست" : "ذخیره دسترسی‌ها"}</button>
            <button class="button button--secondary" type="button" id="coach-cancel-button">انصراف</button>
            <button class="button button--quiet button--sm coach-danger-quiet" type="button" id="coach-revoke-button">تنظیم همه روی بدون دسترسی</button>
          </div>
          <small class="coach-dialog__hint">${Object.keys(errors).length ? "پیش از ذخیره، خطاهای تاریخ را برطرف کن." : hasChanges() ? "تغییرات ذخیره‌نشده داری." : "تغییری نسبت به وضعیت فعلی ثبت نشده است."}</small>
        </div>`;

      bindPermissionEvents();
      bindDurationEvents();
      footer.querySelector("#coach-save-button")?.addEventListener("click", (event) => openSaveDialog(event.currentTarget));
      footer.querySelector("#coach-cancel-button")?.addEventListener("click", () => requestLeave("coach-space-botanical.html"));
      footer.querySelector("#coach-revoke-button")?.addEventListener("click", (event) => openDialog(revokeDialog, event.currentTarget));
      root.querySelector("#coach-back-link")?.addEventListener("click", () => requestLeave("coach-space-botanical.html"));
      if (focusSelector) {
        requestAnimationFrame(() => {
          root.querySelector(focusSelector)?.focus();
        });
      }
    }

    function bindPermissionEvents() {
      root.querySelectorAll("[data-permission-trigger]").forEach((button) => {
        button.addEventListener("click", () => {
          const permissionId = button.dataset.permissionTrigger;
          const nextLevel = button.dataset.level;
          const definition = PERMISSION_DEFS.find((item) => item.id === permissionId);
          if (!permissionId || !nextLevel || !definition) return;
          if (definition.sensitive && draft.permissions[permissionId] === "none" && nextLevel !== "none") {
            sensitiveTarget = { permissionId, nextLevel, selector: `[data-permission-trigger="${permissionId}"][data-level="${nextLevel}"]` };
            openDialog(sensitiveDialog, button);
            return;
          }
          draft.permissions[permissionId] = nextLevel;
          if (permissionId === "files" && nextLevel === "none") draft.selectedFiles = [];
          permissionLiveState = `${definition.title} روی ${LEVEL_LABELS[nextLevel]} تنظیم شد.`;
          announce(permissionLiveState);
          renderPage(`[data-permission-trigger="${permissionId}"][data-level="${nextLevel}"]`);
        });
      });
      root.querySelectorAll("[data-file-toggle]").forEach((input) => {
        input.addEventListener("change", () => {
          draft.selectedFiles = Array.from(root.querySelectorAll("[data-file-toggle]:checked")).map((item) => item.value);
          announce("انتخاب فایل‌های اشتراکی به‌روز شد.");
          renderPage(`[data-file-toggle][value="${input.value}"]`);
        });
      });
    }

    function bindDurationEvents() {
      root.querySelectorAll('input[name="coach-start-mode"]').forEach((input) => {
        input.addEventListener("change", () => {
          draft.access.startMode = input.value;
          if (input.value === "today") draft.access.startedAt = todayLocal();
          renderPage(`#${input.id || ""}`);
        });
      });
      root.querySelector("#coach-access-start")?.addEventListener("change", (event) => {
        draft.access.startedAt = event.target.value;
        renderPage("#coach-access-start");
      });
      root.querySelector("#coach-access-end-mode")?.addEventListener("change", (event) => {
        draft.access.endMode = event.target.value;
        if (draft.access.endMode !== "date") draft.access.endDate = "";
        renderPage("#coach-access-end-mode");
      });
      root.querySelector("#coach-access-end-date")?.addEventListener("change", (event) => {
        draft.access.endDate = event.target.value;
        renderPage("#coach-access-end-date");
      });
    }

    function openSaveDialog(opener) {
      const errors = validateDraft();
      if (!hasChanges() || Object.keys(errors).length) return;
      const diff = fileDiff();
      const rows = [...diffRows(), ...accessDiffRows()];
      document.getElementById("coach-save-coach-name").textContent = coach?.name || "—";
      document.getElementById("coach-save-coach-specialty").textContent = coach?.specialty || "—";
      document.getElementById("coach-save-summary").innerHTML = rows.length ? rows.join("") : '<li><strong>فقط انتخاب فایل‌ها تغییر کرده است.</strong><span>سطح دسترسی‌ها ثابت مانده‌اند.</span></li>';
      document.getElementById("coach-save-added").textContent = diff.added.length ? diff.added.map((item) => item.name).join("، ") : "فایلی اضافه نشده";
      document.getElementById("coach-save-removed").textContent = diff.removed.length ? diff.removed.map((item) => item.name).join("، ") : "فایلی حذف نشده";
      openDialog(confirmDialog, opener);
    }

    document.getElementById("coach-sensitive-confirm")?.addEventListener("click", () => {
      if (!sensitiveTarget) return;
      draft.permissions[sensitiveTarget.permissionId] = sensitiveTarget.nextLevel;
      announce(`${PERMISSION_DEFS.find((item) => item.id === sensitiveTarget.permissionId)?.title || "این بخش"} روی ${LEVEL_LABELS[sensitiveTarget.nextLevel]} تنظیم شد.`);
      closeDialog(sensitiveDialog);
      renderPage(sensitiveTarget.selector);
      sensitiveTarget = null;
    });
    document.getElementById("coach-sensitive-cancel")?.addEventListener("click", () => {
      closeDialog(sensitiveDialog);
      sensitiveTarget = null;
    });

    document.getElementById("coach-save-confirm")?.addEventListener("click", () => {
      const errors = validateDraft();
      if (Object.keys(errors).length) {
        closeDialog(confirmDialog);
        renderPage();
        return;
      }
      state = readState();
      state.permissions = cloneState(draft.permissions);
      state.selectedFiles = [...draft.selectedFiles];
      state.access.startedAt = currentStartDate();
      state.access.endMode = draft.access.endMode;
      state.access.endDate = draft.access.endMode === "date" ? draft.access.endDate : "";
      state.access.status = computeAccessStatus(state.access, state.permissions);
      if (MODE === "connect" && state.inviteDraft) {
        state.pendingCoach = cloneState(state.inviteDraft);
        state.connectionStatus = "pending";
        state.access.status = "inactive";
        state.permissions = cloneState(draft.permissions);
        state.selectedFiles = [...draft.selectedFiles];
        state.inviteDraft = null;
      }
      state.changeLog.unshift({ date: todayLocal(), type: "permissions", note: `${accessCount(state.permissions)} بخش برای مربی به‌روزرسانی شد.` });
      writeState(state);
      closeDialog(confirmDialog);
      showToast(MODE === "connect" ? "درخواست ارتباط با دسترسی‌های انتخاب‌شده ارسال شد." : "دسترسی‌ها ذخیره شدند.");
      window.location.href = "coach-space-botanical.html";
    });

    document.getElementById("coach-save-cancel")?.addEventListener("click", () => closeDialog(confirmDialog));
    document.getElementById("coach-revoke-confirm")?.addEventListener("click", () => {
      draft.permissions = defaultPermissions();
      draft.selectedFiles = [];
      announce("همه دسته‌ها روی بدون دسترسی تنظیم شدند.");
      closeDialog(revokeDialog);
      renderPage("#coach-revoke-button");
      showToast("همه بخش‌ها روی «بدون دسترسی» تنظیم شدند. برای اعمال نهایی، ذخیره را بزن.");
    });
    document.getElementById("coach-revoke-cancel")?.addEventListener("click", () => closeDialog(revokeDialog));
    document.getElementById("coach-unsaved-stay")?.addEventListener("click", () => closeDialog(unsavedDialog));
    document.getElementById("coach-unsaved-leave")?.addEventListener("click", () => {
      closeDialog(unsavedDialog);
      cleanupInviteDraft();
      if (pendingNavigation) window.location.href = pendingNavigation;
    });

    window.addEventListener("beforeunload", (event) => {
      if (!hasChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    });

    renderPage();
  }

  function initSettingsLink() {
    const settingsList = document.querySelector("#panel-settings .profile-setting-list");
    if (!settingsList || settingsList.querySelector("[data-coach-settings-link]")) return;
    const row = document.createElement("div");
    row.className = "profile-setting-row";
    row.setAttribute("data-coach-settings-link", "true");
    row.innerHTML = '<div class="profile-setting-row__meta"><strong>مربی و دسترسی‌ها</strong><small>فضای مشترک، وضعیت همکاری و سطح دسترسی هر بخش</small></div><a class="button button--secondary button--sm" href="coach-space-botanical.html">باز کردن</a>';
    settingsList.insertBefore(row, settingsList.children[settingsList.children.length - 1] || null);
  }

  function initDashboardCoachCard() {
    const state = readState();
    if (!state.coach || state.connectionStatus !== "active") return;
    const card = document.getElementById("important-card");
    if (!card || card.querySelector("[data-coach-inline-card]")) return;
    const inline = document.createElement("div");
    inline.className = "coach-inline-entry";
    inline.setAttribute("data-coach-inline-card", "true");
    inline.innerHTML = `<a class="button button--secondary button--sm" href="coach-space-botanical.html">Check-in بعدی · ${persianDateTime(state.nextCheckIn)}</a>`;
    card.appendChild(inline);
  }

  function initMessagesCoachLink() {
    const state = readState();
    const threadId = state.coach?.threadId || state.pendingCoach?.threadId;
    if (!threadId) return;
    const list = document.getElementById("conversation-list");
    const header = document.getElementById("thread-header");
    if (!list || !header) return;
    const update = () => {
      const activeThread = document.querySelector(`[data-conversation-id="${threadId}"]`);
      if (activeThread && !activeThread.querySelector(".coach-conversation-chip")) {
        const chip = document.createElement("span");
        chip.className = "coach-conversation-chip";
        chip.textContent = "گفت‌وگوی مربی فعلی";
        activeThread.querySelector(".conversation-copy")?.appendChild(chip);
      }
      if (ENTRY === "coach-space" && !header.querySelector("[data-back-to-coach]")) {
        const back = document.createElement("a");
        back.className = "coach-link-row";
        back.href = "coach-space-botanical.html";
        back.setAttribute("data-back-to-coach", "true");
        back.textContent = "بازگشت به فضای مشترک مربی";
        header.prepend(back);
      }
      const currentThread = new URLSearchParams(window.location.search).get("thread") || "";
      if (currentThread === threadId) {
        const target = document.querySelector(`[data-conversation-id="${threadId}"]`);
        if (target && !target.classList.contains("is-active")) target.click();
      }
    };
    update();
    new MutationObserver(update).observe(list, { childList: true, subtree: true });
    new MutationObserver(update).observe(header, { childList: true, subtree: true });
  }

  function initPlansCoachSource() {
    const state = readState();
    if (!state.coach || state.connectionStatus === "ended") return;
    document.querySelectorAll(".plan-hub-card--workout .plan-hub-source strong, .plan-hub-card--food .plan-hub-primary__meta span:first-child").forEach((node) => {
      if (node.textContent.includes("متخصص")) node.textContent = "منبع: مربی";
    });
  }

  if (PAGE === "coach-space") initCoachSpace();
  if (PAGE === "coach-permissions") initCoachPermissions();
  if (PAGE === "settings") initSettingsLink();
  if (PAGE === "dashboard") initDashboardCoachCard();
  if (PAGE === "messages") initMessagesCoachLink();
  if (PAGE === "plans") initPlansCoachSource();
})();
