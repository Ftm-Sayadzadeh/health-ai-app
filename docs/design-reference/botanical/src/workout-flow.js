(function () {
  "use strict";

  const WORKOUT_STORAGE_KEY = "avocado:workout-flow-v1";
  const LEGACY_STORAGE_KEY = "avocado:workout-botanical";
  const PAGE = document.body.dataset.page || "";

  if (!["workout", "workout-weekly", "workout-session"].includes(PAGE)) return;

  const DAY_ORDER = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
  const DAY_LABELS = {
    sat: "شنبه",
    sun: "یکشنبه",
    mon: "دوشنبه",
    tue: "سه‌شنبه",
    wed: "چهارشنبه",
    thu: "پنج‌شنبه",
    fri: "جمعه",
  };
  const STATE_PARAM = new URLSearchParams(window.location.search).get("state") || "";
  const ENTRY_PARAM = new URLSearchParams(window.location.search).get("entry") || "workout";
  const DAY_PARAM = new URLSearchParams(window.location.search).get("day") || "";
  const TODAY = new Date();
  const TODAY_KEY = toDateKey(TODAY);

  const SHARED_SUBSTITUTIONS = {
    ex1: [
      { id: "sub-goblet-squat", name: "گابلت اسکوات", muscles: "چهارسر ران و باسن", gear: "یک دمبل", reason: "اگر اسکوات آزاد ناپایدار است، فرم را کنترل‌شده‌تر می‌کند." },
      { id: "sub-box-squat", name: "اسکوات روی باکس", muscles: "چهارسر ران و میان‌تنه", gear: "باکس یا صندلی", reason: "دامنه حرکت را کوتاه‌تر و قابل‌پیش‌بینی می‌کند." },
    ],
    ex2: [
      { id: "sub-landmine-press", name: "پرس لندماین تک‌دست", muscles: "سرشانه و سینه بالا", gear: "هالتر", reason: "فشار روی شانه را کمتر می‌کند و مسیر حرکت پایدارتر است." },
      { id: "sub-band-press", name: "پرس کشی ایستاده", muscles: "سرشانه و پشت بازو", gear: "کش تمرینی", reason: "برای روزهای خستگی یا محدودیت وزنه گزینه سبک‌تری است." },
    ],
    ex3: [
      { id: "sub-hip-thrust", name: "هیپ تراست", muscles: "باسن و همسترینگ", gear: "نیمکت", reason: "دامنه بارگذاری روی باسن را بیشتر می‌کند." },
      { id: "sub-single-bridge", name: "پل باسن تک‌پا", muscles: "باسن و میان‌تنه", gear: "بدون وسیله", reason: "بدون وزنه شدت را بالاتر می‌برد." },
    ],
    ex4: [
      { id: "sub-dead-bug", name: "ددباگ کنترل‌شده", muscles: "میان‌تنه", gear: "بدون وسیله", reason: "برای روزهای فشار شانه کمتر، جایگزین امن‌تری است." },
      { id: "sub-hollow-hold", name: "هالو هولد", muscles: "میان‌تنه", gear: "بدون وسیله", reason: "تمرکز بیشتری روی کنترل مرکزی بدن می‌دهد." },
    ],
  };

  const state = readWorkoutState();
  let toastTimer = null;
  let sessionTick = null;
  let restTick = null;

  ensureGuideDialog();
  ensureResultDialog();
  ensureSessionSwitchDialog();
  ensureToast();
  syncRuntimeFromClock();
  syncWeekStatuses();

  if (PAGE === "workout") setupWorkoutTodayPage();
  if (PAGE === "workout-weekly") setupWorkoutWeeklyPage();
  if (PAGE === "workout-session") setupWorkoutSessionPage();

  function defaultSessionTemplates() {
    return {
      "session-2": {
        id: "session-2",
        program: "قدرت پایه",
        sessionNumber: 2,
        title: "بالاتنه و هسته مرکزی",
        duration: 32,
        calories: 165,
        intensity: "متوسط",
        suggestedTime: "۱۸:۳۰",
        note: "تمرکز روی کنترل حرکت و تنفس.",
        exercises: [
          exerciseTemplate("s2-ex1", 1, "پارویی کشی", 3, 12, 55, "پشت و پشت بازو", "کش تمرینی", "آرنج را نزدیک بدن نگه دار و شانه‌ها را بالا نیاور.", 0),
          exerciseTemplate("s2-ex2", 2, "پرس سینه روی زمین", 3, 10, 75, "سینه و پشت بازو", "دو دمبل سبک", "در پایین حرکت مکث کوتاه داشته باش و کمر را خنثی نگه دار.", 6),
          exerciseTemplate("s2-ex3", 3, "کرانچ دو مرحله‌ای", 2, 14, 40, "میان‌تنه", "بدون وسیله", "گردن را نکش و حرکت را آرام کنترل کن.", 0),
        ],
      },
      "session-3": {
        id: "session-3",
        program: "قدرت پایه",
        sessionNumber: 3,
        title: "پایین‌تنه و میان‌تنه",
        duration: 35,
        calories: 180,
        intensity: "متوسط",
        suggestedTime: "۱۹:۰۰",
        note: "حرکت‌های امروز برای اجرای واقعی و ثبت ست‌به‌ست آماده‌اند.",
        exercises: [
          exerciseTemplate("ex1", 1, "اسکوات با وزن بدن", 3, 12, 60, "چهارسر ران، باسن، میان‌تنه", "بدون وسیله", "قفسه سینه را باز نگه دار، زانوها را هم‌جهت پنجه‌ها پایین ببر و در بالاترین نقطه نفس را آزاد کن.", 0),
          exerciseTemplate("ex2", 2, "پرس شانه دمبل سبک", 3, 10, 75, "سرشانه، پشت بازو", "دو دمبل سبک", "آرنج‌ها را زیر دمبل نگه دار و در بالای حرکت کمر را بیش از حد گود نکن.", 6),
          exerciseTemplate("ex3", 3, "پل باسن", 3, 12, 45, "باسن، همسترینگ", "بدون وسیله", "پاشنه‌ها را به زمین فشار بده و در بالاترین نقطه دو ثانیه مکث کن.", 0),
          exerciseTemplate("ex4", 4, "پلانک ساعد", 3, 30, 45, "میان‌تنه، شانه", "بدون وسیله", "بدن را در یک خط نگه دار و اجازه نده لگن افت کند.", 0, "ثانیه"),
        ],
      },
      "session-4": {
        id: "session-4",
        program: "قدرت پایه",
        sessionNumber: 4,
        title: "کششی و بازیابی فعال",
        duration: 22,
        calories: 95,
        intensity: "سبک",
        suggestedTime: "۱۷:۰۰",
        note: "جلسه کوتاه برای باز شدن بدن و کنترل تنفس.",
        exercises: [
          exerciseTemplate("s4-ex1", 1, "اسپلیت اسکوات کوتاه", 2, 10, 45, "پا و تعادل", "بدون وسیله", "دامنه را کوتاه نگه دار و تعادل را روی پای جلو حفظ کن.", 0),
          exerciseTemplate("s4-ex2", 2, "کشش همسترینگ پویا", 2, 35, 30, "پشت پا", "بدون وسیله", "زانو را قفل نکن و ریتم تنفس را ثابت نگه دار.", 0, "ثانیه"),
          exerciseTemplate("s4-ex3", 3, "تنفس دیافراگمی", 2, 45, 20, "تنفس و ریکاوری", "بدون وسیله", "چهار شماره دم، چهار شماره نگه‌دار و شش شماره بازدم.", 0, "ثانیه"),
        ],
      },
      "session-5": {
        id: "session-5",
        program: "قدرت پایه",
        sessionNumber: 5,
        title: "زنجیره خلفی و ثبات",
        duration: 34,
        calories: 170,
        intensity: "متوسط",
        suggestedTime: "۱۸:۱۵",
        note: "جلسه آینده برای تثبیت الگوهای حرکتی هفته است.",
        exercises: [
          exerciseTemplate("s5-ex1", 1, "ددلیفت رومانیایی دمبل", 3, 10, 70, "همسترینگ و باسن", "دو دمبل", "شانه را عقب نگه دار و دامنه را تا جایی برو که کمر خنثی بماند.", 8),
          exerciseTemplate("s5-ex2", 2, "روئینگ خم", 3, 12, 50, "پشت", "دو دمبل", "در بالای حرکت یک مکث کوتاه داشته باش.", 6),
          exerciseTemplate("s5-ex3", 3, "بردداگ", 2, 10, 35, "میان‌تنه و تعادل", "بدون وسیله", "لگن را نچرخان و دست و پای مخالف را هم‌زمان بکش.", 0),
        ],
      },
    };
  }

  function exerciseTemplate(id, order, name, sets, reps, rest, muscles, equipment, guide, suggestedWeight, repUnit = "تکرار") {
    return {
      id,
      order,
      name,
      sets,
      reps,
      rest,
      muscles,
      equipment,
      guide,
      suggestedWeight,
      repUnit,
    };
  }

  function recurringWeekBlueprint() {
    return {
      sat: { plan: "session", templateId: "session-2" },
      sun: { plan: "session", templateId: "session-4" },
      mon: { plan: "rest", templateId: "" },
      tue: { plan: "session", templateId: "session-3" },
      wed: { plan: "empty", templateId: "" },
      thu: { plan: "rest", templateId: "" },
      fri: { plan: "session", templateId: "session-5" },
    };
  }

  function buildDefaultWeek(offset = 0, overrides = {}) {
    const start = startOfPersianWeek(TODAY);
    start.setDate(start.getDate() + (offset * 7));
    const blueprint = recurringWeekBlueprint();
    return DAY_ORDER.map((weekdayId, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = toDateKey(date);
      const base = blueprint[weekdayId];
      const override = overrides[dateKey] || {};
      const plan = override.plan || base.plan;
      const templateId = Object.prototype.hasOwnProperty.call(override, "templateId") ? override.templateId : base.templateId;
      return {
        id: dateKey,
        weekdayId,
        label: DAY_LABELS[weekdayId],
        dateIso: date.toISOString(),
        dateKey,
        shortDate: formatShortDate(date),
        plan,
        templateId,
        status: override.status || (plan === "rest" ? "rest" : plan === "empty" ? "empty" : dateKey === TODAY_KEY ? "today" : "future"),
        backupTemplateId: override.backupTemplateId || "",
        note: override.note || "",
      };
    });
  }

  function buildDefaultHistory() {
    const week = buildDefaultWeek();
    const sat = week.find((item) => item.weekdayId === "sat");
    const sun = week.find((item) => item.weekdayId === "sun");
    const tue = week.find((item) => item.weekdayId === "tue");
    return [
      {
        id: `history-${sat?.dateKey || "sat"}-1`,
        dayId: sat?.id || "sat",
        weekdayId: "sat",
        dateIso: sat?.dateIso || new Date(TODAY.getTime() - (6 * 86400000)).toISOString(),
        dateLabel: "شنبه ۱۹ تیر ۱۴۰۵",
        title: "بالاتنه و هسته مرکزی",
        durationMinutes: 31,
        intensityLabel: "متوسط",
        completedExercises: 3,
        totalExercises: 3,
        totalSetsDone: 8,
        status: "complete",
        shortNote: "فرم حرکت‌ها پایدار بود و استراحت‌ها کافی ماند.",
        energy: "متعادل",
        body: "آماده",
        pain: "",
      },
      {
        id: `history-${sun?.dateKey || "sun"}-1`,
        dayId: sun?.id || "sun",
        weekdayId: "sun",
        dateIso: sun?.dateIso || new Date(TODAY.getTime() - (5 * 86400000)).toISOString(),
        dateLabel: "یکشنبه ۲۰ تیر ۱۴۰۵",
        title: "کششی و بازیابی فعال",
        durationMinutes: 21,
        intensityLabel: "سبک",
        completedExercises: 3,
        totalExercises: 3,
        totalSetsDone: 6,
        status: "complete",
        shortNote: "جلسه سبک و ریکاوری کامل بود.",
        energy: "سبک",
        body: "آزاد",
        pain: "",
      },
      {
        id: `history-${tue?.dateKey || "tue"}-1`,
        dayId: tue?.id || "tue",
        weekdayId: "tue",
        dateIso: tue?.dateIso || new Date(TODAY.getTime() - (3 * 86400000)).toISOString(),
        dateLabel: "سه‌شنبه ۲۲ تیر ۱۴۰۵",
        title: "پایین‌تنه و میان‌تنه",
        durationMinutes: 18,
        intensityLabel: "ناتمام",
        completedExercises: 2,
        totalExercises: 4,
        totalSetsDone: 5,
        status: "partial",
        shortNote: "جلسه نیمه‌کاره ماند و پلانک ثبت نشد.",
        energy: "کم",
        body: "خسته",
        pain: "کشش خفیف شانه",
      },
    ];
  }

  function defaultWorkoutState() {
    const templates = defaultSessionTemplates();
    const week = buildDefaultWeek();
    const todaySession = week.find((item) => item.dateKey === TODAY_KEY && item.plan === "session") || week.find((item) => item.plan === "session");
    return {
      selectedDayId: todaySession?.id || week[0].id,
      weekOffset: 0,
      weekOverrides: {},
      templates,
      week,
      activeSession: {
        templateId: todaySession?.templateId || "session-5",
        dayId: todaySession?.id || week[0].id,
        status: "not_started",
        elapsedSeconds: 0,
        currentExerciseIndex: 0,
        setLogs: {},
        skippedExercises: [],
        substitutions: {},
        completionMode: "",
        startedAt: "",
        pausedAt: "",
        lastSavedAt: "",
        finishResult: null,
        sessionInstanceId: "",
        lastCompletedAt: "",
        rest: null,
      },
      history: buildDefaultHistory(),
    };
  }

  function readWorkoutState() {
    try {
      const stored = JSON.parse(localStorage.getItem(WORKOUT_STORAGE_KEY) || "null");
      if (stored) return normalizeWorkoutState(stored);
    } catch (_) {}

    const migrated = migrateLegacyState();
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }

  function migrateLegacyState() {
    const fallback = defaultWorkoutState();
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
      if (!legacy || !legacy.session || !Array.isArray(legacy.exercises)) return fallback;
      const templates = defaultSessionTemplates();
      templates["session-3"] = {
        id: "session-3",
        program: legacy.session.program || "قدرت پایه",
        sessionNumber: Number(legacy.session.sessionNumber) || 3,
        title: "تمرین امروز",
        duration: Number(legacy.session.duration) || 35,
        calories: Number(legacy.session.calories) || 180,
        intensity: legacy.session.difficulty || "متوسط",
        suggestedTime: "۱۹:۰۰",
        note: "از وضعیت قبلی منتقل شده است.",
        exercises: legacy.exercises.map((exercise, index) => ({
          id: exercise.id || `legacy-${index + 1}`,
          order: Number(exercise.order) || index + 1,
          name: exercise.name || `حرکت ${index + 1}`,
          sets: Number(exercise.sets) || 3,
          reps: Number(exercise.reps) || 10,
          rest: Number(exercise.rest) || 60,
          muscles: exercise.muscles || "—",
          equipment: "بدون وسیله",
          guide: exercise.guide || "راهنما برای این حرکت ثبت نشده است.",
          suggestedWeight: 0,
          repUnit: exercise.repUnit || "تکرار",
        })),
      };

      const activeLogs = {};
      legacy.exercises.forEach((exercise) => {
        if (exercise.completed) {
          activeLogs[exercise.id] = Array.from({ length: Number(exercise.sets) || 1 }, (_, setIndex) => ({
            setNumber: setIndex + 1,
            status: "done",
            reps: Number(exercise.reps) || 0,
            weight: 0,
            repUnit: exercise.repUnit || "تکرار",
          }));
        }
      });

      fallback.templates = templates;
      fallback.activeSession = {
        templateId: "session-3",
        dayId: "fri",
        status: completedSetCount({ setLogs: activeLogs }) === totalSetCount(templates["session-3"]) ? "complete" : legacy.session.started ? "in_progress" : "not_started",
        elapsedSeconds: Number(legacy.session.elapsedSeconds) || 0,
        currentExerciseIndex: findCurrentExerciseIndex(templates["session-3"], activeLogs, []),
        setLogs: activeLogs,
        skippedExercises: [],
        substitutions: {},
        completionMode: "",
        startedAt: legacy.session.started ? new Date().toISOString() : "",
        pausedAt: "",
        lastSavedAt: new Date().toISOString(),
        finishResult: null,
      };

      fallback.history = Array.isArray(legacy.history)
        ? legacy.history.map((item, index) => ({
            id: `legacy-history-${index + 1}`,
            dayId: index === 0 ? "tue" : "sat",
            dateLabel: item.date || "ثبت قبلی",
            title: "تمرین ثبت‌شده",
            durationMinutes: Number(legacy.session.duration) || 30,
            intensityLabel: item.feeling || "معمولی",
            completedExercises: legacy.exercises.filter((exercise) => exercise.completed).length,
            totalExercises: legacy.exercises.length,
            totalSetsDone: legacy.exercises.filter((exercise) => exercise.completed).reduce((sum, exercise) => sum + (Number(exercise.sets) || 0), 0),
            status: index === 0 ? "partial" : "complete",
            shortNote: item.note || "از نسخه قبلی منتقل شد.",
            energy: item.feeling || "متعادل",
            body: "—",
            pain: "",
          }))
        : fallback.history;
      return normalizeWorkoutState(fallback);
    } catch (_) {
      return fallback;
    }
  }

  function normalizeWorkoutState(raw) {
    const fallback = defaultWorkoutState();
    const templates = raw.templates || fallback.templates;
    const weekOffset = Number(raw.weekOffset) || 0;
    const weekOverrides = raw.weekOverrides && typeof raw.weekOverrides === "object" ? raw.weekOverrides : {};
    return {
      selectedDayId: raw.selectedDayId || fallback.selectedDayId,
      weekOffset,
      weekOverrides,
      templates,
      week: buildDefaultWeek(weekOffset, weekOverrides),
      activeSession: {
        templateId: raw.activeSession?.templateId || fallback.activeSession.templateId,
        dayId: raw.activeSession?.dayId || fallback.activeSession.dayId,
        status: raw.activeSession?.status || "not_started",
        elapsedSeconds: Math.max(0, Number(raw.activeSession?.elapsedSeconds) || 0),
        currentExerciseIndex: Math.max(0, Number(raw.activeSession?.currentExerciseIndex) || 0),
        setLogs: raw.activeSession?.setLogs || {},
        skippedExercises: Array.isArray(raw.activeSession?.skippedExercises) ? raw.activeSession.skippedExercises : [],
        substitutions: raw.activeSession?.substitutions || {},
        completionMode: raw.activeSession?.completionMode || "",
        startedAt: raw.activeSession?.startedAt || "",
        pausedAt: raw.activeSession?.pausedAt || "",
        lastSavedAt: raw.activeSession?.lastSavedAt || "",
        finishResult: raw.activeSession?.finishResult || null,
        sessionInstanceId: raw.activeSession?.sessionInstanceId || "",
        lastCompletedAt: raw.activeSession?.lastCompletedAt || "",
        rest: raw.activeSession?.rest || null,
      },
      history: Array.isArray(raw.history)
        ? raw.history.map((item) => ({
            ...item,
            dayId: item.dayId || item.dateKey || item.weekdayId || "",
            weekdayId: item.weekdayId || item.dayId || "",
            dateIso: item.dateIso || TODAY.toISOString(),
          }))
        : fallback.history,
    };
  }

  function saveWorkoutState() {
    state.activeSession.lastSavedAt = new Date().toISOString();
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(state));
  }

  function syncRuntimeFromClock() {
    const lastSaved = state.activeSession.lastSavedAt ? new Date(state.activeSession.lastSavedAt) : null;
    if (!lastSaved || Number.isNaN(lastSaved.getTime())) return;
    const deltaSeconds = Math.max(0, Math.round((Date.now() - lastSaved.getTime()) / 1000));
    if (!deltaSeconds) return;
    if (state.activeSession.status === "in_progress") {
      state.activeSession.elapsedSeconds += deltaSeconds;
    }
    if (state.activeSession.rest?.active && !state.activeSession.rest.paused) {
      state.activeSession.rest.remaining = Math.max(0, Number(state.activeSession.rest.remaining || 0) - deltaSeconds);
      if (state.activeSession.rest.remaining === 0) {
        state.activeSession.rest.active = false;
      }
    }
  }

  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.hidden = true;
    toast.innerHTML = `
      <span class="toast__check">
        <svg class="icon icon--sm" aria-hidden="true"><use href="assets/icons.svg#icon-check"></use></svg>
      </span>
      <span id="toast-message">ثبت شد.</span>
      <button type="button" id="toast-close">بستن</button>
    `;
    document.body.append(toast);
    document.getElementById("toast-close").addEventListener("click", () => {
      toast.hidden = true;
    });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    const label = document.getElementById("toast-message");
    if (!toast || !label) return;
    window.clearTimeout(toastTimer);
    label.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function ensureGuideDialog() {
    if (document.getElementById("workout-guide-dialog")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "workout-sheet";
    dialog.id = "workout-guide-dialog";
    dialog.setAttribute("aria-labelledby", "workout-guide-title");
    dialog.innerHTML = `
      <div class="workout-sheet__body">
        <div class="workout-sheet__handle" aria-hidden="true"></div>
        <div class="workout-sheet__header">
          <div>
            <h2 id="workout-guide-title">مشاهده آموزش کامل</h2>
            <p id="workout-guide-subtitle">جزئیات حرکت، عضلات هدف و راهنمای اجرا.</p>
          </div>
          <button class="icon-button" type="button" data-workout-close aria-label="بستن">
            <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-close"></use></svg>
          </button>
        </div>
        <div class="workout-sheet-list">
          <div class="workout-option-card">
            <strong id="workout-guide-name">اسکوات با وزن بدن</strong>
            <small id="workout-guide-meta">۳ ست · ۱۲ تکرار · استراحت ۶۰ ثانیه</small>
          </div>
          <div class="workout-option-card">
            <strong>عضلات هدف</strong>
            <small id="workout-guide-muscles">چهارسر ران، باسن، میان‌تنه</small>
          </div>
          <div class="workout-option-card">
            <strong>راهنمای کوتاه</strong>
            <small id="workout-guide-copy">قفسه سینه را باز نگه دار و زانوها را هم‌جهت پنجه‌ها پایین ببر.</small>
          </div>
        </div>
        <div class="workout-sheet__actions">
          <button class="button button--secondary" type="button" data-workout-close>بستن</button>
          <button class="button button--primary" type="button" id="workout-guide-complete">این حرکت انجام شد</button>
        </div>
      </div>
    `;
    document.body.append(dialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.querySelectorAll("[data-workout-close]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(dialog));
    });
    document.getElementById("workout-guide-complete").addEventListener("click", () => {
      const exerciseId = dialog.dataset.exerciseId;
      if (PAGE === "workout-session" && exerciseId) {
        completeCurrentSet({ markWholeExercise: true });
      } else if (exerciseId) {
        openSessionFromDay(state.activeSession.dayId || "fri", ENTRY_PARAM, true);
      }
      closeDialog(dialog);
    });
  }

  function openGuide(templateExercise) {
    const dialog = document.getElementById("workout-guide-dialog");
    if (!dialog || !templateExercise) return;
    dialog.dataset.exerciseId = templateExercise.id;
    document.getElementById("workout-guide-name").textContent = templateExercise.name;
    document.getElementById("workout-guide-meta").textContent = `${toPersianNumber(templateExercise.sets)} ست · ${repLabel(templateExercise)} · استراحت ${toPersianNumber(templateExercise.rest)} ثانیه`;
    document.getElementById("workout-guide-muscles").textContent = templateExercise.muscles;
    document.getElementById("workout-guide-copy").textContent = templateExercise.guide;
    openDialog(dialog);
  }

  function ensureResultDialog() {
    if (document.getElementById("workout-result-dialog")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "workout-modal";
    dialog.id = "workout-result-dialog";
    dialog.setAttribute("aria-labelledby", "workout-result-title");
    dialog.innerHTML = `
      <div class="workout-modal__body">
        <div class="workout-sheet__header">
          <div>
            <h2 id="workout-result-title">نتیجه جلسه</h2>
            <p id="workout-result-date">مرور ثبت نهایی این جلسه.</p>
          </div>
          <button class="icon-button" type="button" data-result-close aria-label="بستن">
            <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-close"></use></svg>
          </button>
        </div>
        <div class="workout-summary-grid">
          <div class="workout-stat-card"><span>مدت واقعی</span><strong id="workout-result-duration">—</strong></div>
          <div class="workout-stat-card"><span>وضعیت</span><strong id="workout-result-status">—</strong></div>
          <div class="workout-stat-card"><span>حرکت‌های کامل</span><strong id="workout-result-exercises">—</strong></div>
          <div class="workout-stat-card"><span>ست‌های ثبت‌شده</span><strong id="workout-result-sets">—</strong></div>
        </div>
        <div class="workout-option-card">
          <strong id="workout-result-title-line">—</strong>
          <small id="workout-result-note">—</small>
          <small id="workout-result-body">—</small>
        </div>
        <div class="workout-sheet__actions">
          <button class="button button--secondary" type="button" data-result-close>بستن</button>
          <button class="button button--primary" type="button" id="workout-repeat-session">تکرار این جلسه</button>
        </div>
      </div>
    `;
    document.body.append(dialog);
    dialog.querySelectorAll("[data-result-close]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(dialog));
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  }

  function openResultReview(dayId) {
    const dialog = document.getElementById("workout-result-dialog");
    const item = latestHistoryForDay(dayId);
    if (!dialog || !item) {
      showToast("هنوز نتیجه‌ای برای مرور ثبت نشده است.");
      return;
    }
    setText("#workout-result-date", item.dateLabel || formatFullDate(new Date(item.dateIso || TODAY)));
    setText("#workout-result-duration", formatMinutes(item.durationMinutes || 0));
    setText("#workout-result-status", item.status === "complete" ? "کامل" : "ناقص");
    setText("#workout-result-exercises", `${toPersianNumber(item.completedExercises)} از ${toPersianNumber(item.totalExercises)}`);
    setText("#workout-result-sets", `${toPersianNumber(item.totalSetsDone)} ست`);
    setText("#workout-result-title-line", item.title || "ثبت جلسه");
    setText("#workout-result-note", item.shortNote || "بدون یادداشت تکمیلی.");
    setText("#workout-result-body", `انرژی: ${item.energy || "—"} · حال بدن: ${item.body || "—"}${item.pain ? ` · ناراحتی: ${item.pain}` : ""}`);
    const repeatButton = document.getElementById("workout-repeat-session");
    if (repeatButton) {
      repeatButton.onclick = () => confirmRepeatSession(dayId);
    }
    openDialog(dialog);
  }

  function confirmRepeatSession(dayId, entry = ENTRY_PARAM || "workout") {
    const day = getWeekDay(dayId);
    if (!day) return;
    if (!window.confirm("جلسه قبلی حفظ می‌شود و یک اجرای تازه برای همین روز شروع می‌شود. ادامه می‌دهی؟")) {
      return;
    }
    resetSessionForDay(day);
    saveWorkoutState();
    window.location.href = `workout-session-botanical.html?day=${day.id}&entry=${entry}`;
  }

  function ensureSessionSwitchDialog() {
    if (document.getElementById("workout-session-switch-dialog")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "workout-modal";
    dialog.id = "workout-session-switch-dialog";
    dialog.setAttribute("aria-labelledby", "workout-session-switch-title");
    dialog.innerHTML = `
      <div class="workout-modal__body">
        <div class="workout-sheet__header">
          <div>
            <h2 id="workout-session-switch-title">جلسه فعال دیگری باز است</h2>
            <p id="workout-session-switch-copy">برای شروع روز جدید، تکلیف جلسه فعلی را مشخص کن.</p>
          </div>
        </div>
        <div class="workout-sheet-list">
          <button class="button button--primary" type="button" id="session-switch-continue">ادامه جلسه فعلی</button>
          <button class="button button--secondary" type="button" id="session-switch-save-start">ذخیره جلسه فعلی و شروع جلسه جدید</button>
          <button class="button button--quiet" type="button" id="session-switch-cancel">انصراف</button>
        </div>
      </div>
    `;
    document.body.append(dialog);
  }

  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function toPersianNumber(value) {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  }

  function formatClock(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(total / 60);
    const remain = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
  }

  function formatMinutes(minutes) {
    return `${toPersianNumber(minutes)} دقیقه`;
  }

  function formatShortDate(date) {
    return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
  }

  function formatFullDate(date) {
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  }

  function toDateKey(date) {
    const copy = new Date(date);
    copy.setHours(12, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
  }

  function startOfPersianWeek(date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = copy.getDay();
    const diff = day === 6 ? 0 : day + 1;
    copy.setDate(copy.getDate() - diff);
    return copy;
  }

  function getWeekDay(dayId) {
    return state.week.find((item) => item.id === dayId || item.weekdayId === dayId || item.dateKey === dayId) || null;
  }

  function getTemplateById(templateId) {
    return state.templates[templateId] || null;
  }

  function getSelectedDay() {
    return getWeekDay(state.selectedDayId) || state.week.find((item) => item.dateKey === TODAY_KEY) || state.week[0];
  }

  function activeTemplate() {
    return getTemplateById(state.activeSession.templateId);
  }

  function sessionProgressFor(template) {
    return template.exercises.map((exercise) => {
      const logs = state.activeSession.setLogs[exercise.id] || [];
      const doneSets = logs.filter((item) => item.status === "done").length;
      const skippedSets = logs.filter((item) => item.status === "skipped").length;
      const remainingSets = Math.max(0, exercise.sets - logs.length);
      const substituted = state.activeSession.substitutions[exercise.id];
      const exerciseView = effectiveExercise(exercise, substituted);
      return {
        exercise: exerciseView,
        baseExercise: exercise,
        logs,
        doneSets,
        skippedSets,
        remainingSets,
        completed: doneSets >= exercise.sets,
        skipped: skippedSets >= exercise.sets,
        substituted,
      };
    });
  }

  function totalSetCount(template) {
    return template.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  }

  function completedSetCount(progress) {
    return Object.values(progress.setLogs || {}).flat().filter((item) => item.status === "done").length;
  }

  function findCurrentExerciseIndex(template, setLogs, skippedExercises) {
    const skipped = new Set(skippedExercises || []);
    for (let index = 0; index < template.exercises.length; index += 1) {
      const exercise = template.exercises[index];
      if (skipped.has(exercise.id)) continue;
      const logs = setLogs[exercise.id] || [];
      if (logs.length < exercise.sets) return index;
    }
    return template.exercises.length - 1;
  }

  function sessionStatusLabel(status = state.activeSession.status) {
    const labels = {
      not_started: "آماده شروع",
      in_progress: "در حال اجرا",
      paused: "متوقف‌شده",
      complete: "انجام‌شده",
      partial: "ناقص",
    };
    return labels[status] || "آماده شروع";
  }

  function dayVisualState(day) {
    if (state.activeSession.dayId === day.id && ["in_progress", "paused"].includes(state.activeSession.status)) return "today";
    if (day.plan === "rest") return "rest";
    if (day.plan === "empty") return "empty";
    if (day.status === "done") return "done";
    if (day.status === "partial") return "partial";
    if (day.dateKey === TODAY_KEY) return "today";
    return "future";
  }

  function historyForCurrentWeek() {
    const weekKeys = new Set(state.week.map((day) => day.id));
    return state.history.filter((item) => weekKeys.has(item.dayId));
  }

  function calculateWeeklyStreak() {
    const dates = [...new Set(
      state.history
        .filter((item) => ["complete", "partial"].includes(item.status))
        .map((item) => toDateKey(item.dateIso || TODAY))
    )].sort().reverse();
    let streak = 0;
    let cursor = new Date(TODAY);
    while (dates.includes(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function weeklySummary() {
    const weekHistory = historyForCurrentWeek();
    const planned = state.week.filter((day) => day.plan === "session").length;
    const done = weekHistory.filter((item) => item.status === "complete").length;
    const duration = weekHistory.reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
    const streak = calculateWeeklyStreak();
    const next = nextPlannedDay();
    return {
      planned,
      done,
      duration,
      streak,
      next,
    };
  }

  function nextPlannedDay() {
    const todayIndex = state.week.findIndex((day) => day.dateKey === TODAY_KEY);
    const ordered = todayIndex >= 0 ? [...state.week.slice(todayIndex), ...state.week.slice(0, todayIndex)] : state.week;
    return ordered.find((day) => day.plan === "session" && !["done", "partial"].includes(day.status)) || ordered.find((day) => day.plan === "session") || null;
  }

  function currentSessionTemplate(dayId) {
    const day = getWeekDay(dayId);
    if (!day || day.plan !== "session") return null;
    if (state.activeSession.dayId === day.id && state.activeSession.templateId) {
      return getTemplateById(state.activeSession.templateId);
    }
    return getTemplateById(day.templateId);
  }

  function resetSessionForDay(day) {
    const targetDay = typeof day === "string" ? getWeekDay(day) : day;
    const targetTemplate = targetDay ? getTemplateById(targetDay.templateId) : null;
    if (!targetDay || !targetTemplate) return null;
    state.activeSession = {
      templateId: targetTemplate.id,
      dayId: targetDay.id,
      status: "not_started",
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      setLogs: {},
      skippedExercises: [],
      substitutions: {},
      completionMode: "",
      startedAt: "",
      pausedAt: "",
      lastSavedAt: "",
      finishResult: null,
      sessionInstanceId: `session-${targetDay.id}-${Date.now()}`,
      lastCompletedAt: "",
      rest: null,
    };
    return targetTemplate;
  }

  function ensureActiveSession(dayId) {
    const targetDay = getWeekDay(dayId);
    if (!targetDay || targetDay.plan !== "session") return null;
    const targetTemplate = getTemplateById(targetDay.templateId);
    if (!targetTemplate) return null;

    if (!state.activeSession.templateId) {
      resetSessionForDay(targetDay);
      return targetTemplate;
    }

    if (state.activeSession.dayId === targetDay.id && state.activeSession.templateId === targetTemplate.id) {
      return targetTemplate;
    }

    if (!["in_progress", "paused", "complete", "partial"].includes(state.activeSession.status)) {
      resetSessionForDay(targetDay);
    }
    return targetTemplate;
  }

  function syncWeekStatuses() {
    const historyByDay = new Map();
    state.history.forEach((item) => {
      if (!item.dayId) return;
      const previous = historyByDay.get(item.dayId);
      if (!previous || new Date(item.dateIso || 0) > new Date(previous.dateIso || 0)) {
        historyByDay.set(item.dayId, item);
      }
    });

    state.week = buildDefaultWeek(state.weekOffset, state.weekOverrides).map((day) => {
      const history = historyByDay.get(day.id);
      if (day.plan === "rest") return { ...day, status: "rest" };
      if (day.plan === "empty") return { ...day, status: "empty" };
      if (state.activeSession.dayId === day.id && ["in_progress", "paused"].includes(state.activeSession.status)) {
        return { ...day, status: "today" };
      }
      if (history?.status === "complete") return { ...day, status: "done" };
      if (history?.status === "partial") return { ...day, status: "partial" };
      return { ...day, status: day.dateKey === TODAY_KEY ? "today" : "future" };
    });
  }

  function todayPlannedDay() {
    return state.week.find((day) => day.dateKey === TODAY_KEY) || null;
  }

  function latestHistoryForDay(dayId) {
    return state.history
      .filter((item) => item.dayId === dayId)
      .sort((a, b) => new Date(b.dateIso || 0) - new Date(a.dateIso || 0))[0] || null;
  }

  function openSessionFromDay(dayId, entry, reviewOnly = false) {
    const template = ensureActiveSession(dayId);
    if (!template) return;
    if (!reviewOnly && state.activeSession.status === "not_started") {
      state.activeSession.status = "in_progress";
      state.activeSession.startedAt = new Date().toISOString();
    }
    state.selectedDayId = dayId;
    saveWorkoutState();
    const query = new URLSearchParams({ day: dayId, entry });
    if (reviewOnly) query.set("guide", template.exercises[state.activeSession.currentExerciseIndex]?.id || "");
    window.location.href = `workout-session-botanical.html?${query.toString()}`;
  }

  function setupWorkoutTodayPage() {
    syncWeekStatuses();
    const day = getWeekDay(state.activeSession.dayId) || todayPlannedDay() || state.week.find((item) => item.plan === "session");
    const template = day ? currentSessionTemplate(day.id) || ensureActiveSession(day.id) || activeTemplate() : activeTemplate();
    if (!template || !day) return;
    const progress = sessionProgressFor(template);
    const completedExercises = progress.filter((item) => item.completed).length;
    const next = progress.find((item) => !item.completed && !item.skipped) || progress[progress.length - 1];
    const latestHistory = latestHistoryForDay(day.id);
    const actionLabel = ["in_progress", "paused"].includes(state.activeSession.status)
      ? "ادامه تمرین"
      : latestHistory?.status === "complete"
        ? "مشاهده نتیجه"
        : "شروع تمرین";

    setText("#topbar-session-title", `${template.program} · جلسه ${toPersianNumber(template.sessionNumber)}`);
    setText("#hero-program-title", `${template.program} · جلسه ${toPersianNumber(template.sessionNumber)}`);
    setText("#hero-duration", formatMinutes(template.duration));
    setText("#hero-difficulty", `شدت ${template.intensity}`);
    setText("#hero-calories", `حدود ${toPersianNumber(template.calories)} کالری`);
    setText("#hero-progress-count", `${toPersianNumber(completedExercises)} از ${toPersianNumber(template.exercises.length)} حرکت`);
    setText("#hero-next-exercise", next ? resolvedExerciseName(next) : "همه حرکت‌ها ثبت شده‌اند");
    setText("#hero-elapsed-time", formatClock(state.activeSession.elapsedSeconds));
    setText("#hero-session-status", sessionStatusLabel());
    setText("#hero-progress-percent", `${toPersianNumber(Math.round((completedExercises / template.exercises.length) * 100))}٪`);
    document.getElementById("hero-progress-bar")?.style.setProperty("--progress", `${Math.round((completedExercises / template.exercises.length) * 100)}%`);
    setText("#workout-note", ["in_progress", "paused"].includes(state.activeSession.status)
      ? "جلسه از آخرین وضعیت ذخیره‌شده ادامه پیدا می‌کند و حرکت فعلی، ست فعلی و استراحت بعدی حفظ می‌شود."
      : "از اینجا می‌توانی خلاصه تمرین را ببینی و در زمان مناسب وارد اجرای جلسه شوی.");

    const startLink = document.getElementById("start-workout-link");
    const mobileStartLink = document.getElementById("mobile-start-link");
    if (startLink) {
      startLink.textContent = actionLabel;
      startLink.href = latestHistory?.status === "complete" ? "#workout-view-result" : `workout-session-botanical.html?day=${day.id}&entry=workout`;
    }
    if (mobileStartLink) {
      mobileStartLink.href = startLink?.href || `workout-session-botanical.html?day=${day.id}&entry=workout`;
      setText("#mobile-start-label", actionLabel);
    }

    const weeklyLink = document.getElementById("weekly-plan-link");
    if (weeklyLink) weeklyLink.href = "workout-weekly-botanical.html";

    const list = document.getElementById("today-exercise-summary");
    if (list) {
      list.innerHTML = progress.map((item) => `
        <article class="workout-summary-row ${item.completed ? "is-done" : ""}">
          <div>
            <strong>${resolvedExerciseName(item)}</strong>
            <small>${toPersianNumber(item.exercise.sets)} ست · ${repLabel(item.exercise)} · ${item.exercise.muscles}</small>
            <div class="workout-summary-row__meta">
              <span class="workout-summary-badge">${item.completed ? "انجام‌شده" : item.skipped ? "ردشده" : "در صف اجرا"}</span>
              <span class="workout-summary-badge" data-tone="plan">استراحت ${toPersianNumber(item.exercise.rest)} ثانیه</span>
            </div>
          </div>
          <div class="workout-row-actions">
            <button class="button button--secondary button--sm" type="button" data-guide-open="${item.exercise.id}">آموزش</button>
          </div>
        </article>
      `).join("");

      list.addEventListener("click", (event) => {
        const guideButton = event.target.closest("[data-guide-open]");
        if (!guideButton) return;
        const exercise = template.exercises.find((item) => item.id === guideButton.dataset.guideOpen);
        if (exercise) openGuide(exercise);
      });
    }

    const lastHistory = document.getElementById("today-history-preview");
    if (lastHistory) {
      const historyMarkup = state.history.slice(0, 2).map((item) => `
        <article class="workout-history-row">
          <div>
            <strong>${item.title}</strong>
            <small>${item.dateLabel} · ${item.shortNote}</small>
          </div>
          <span class="workout-status-chip" data-tone="${item.status === "complete" ? "done" : "warn"}">${item.status === "complete" ? "کامل" : "ناقص"}</span>
        </article>
      `).join("");
      lastHistory.innerHTML = historyMarkup;
    }

    document.getElementById("finish-workout-button")?.addEventListener("click", () => {
      if (latestHistory?.status === "complete" || latestHistory?.status === "partial") {
        openResultReview(day.id);
        return;
      }
      openSessionFromDay(day.id, "workout");
    });
    startLink?.addEventListener("click", (event) => {
      if (latestHistory?.status === "complete") {
        event.preventDefault();
        openResultReview(day.id);
      }
    });
    mobileStartLink?.addEventListener("click", (event) => {
      if (latestHistory?.status === "complete") {
        event.preventDefault();
        openResultReview(day.id);
      }
    });
  }

  function setupWorkoutWeeklyPage() {
    renderWeeklyPage();
    bindWeeklyActions();
  }

  function renderWeeklyPage() {
    syncWeekStatuses();
    const summary = weeklySummary();
    const selectedDay = getSelectedDay();
    const selectedTemplate = currentSessionTemplate(selectedDay.id);
    const selectedVisualState = dayVisualState(selectedDay);
    const todayDay = todayPlannedDay();

    setText("#weekly-range-label", `${formatFullDate(new Date(state.week[0].dateIso))} تا ${formatFullDate(new Date(state.week[state.week.length - 1].dateIso))}`);
    setText("#weekly-done-count", `${toPersianNumber(summary.done)} از ${toPersianNumber(summary.planned)} جلسه انجام‌شده`);
    setText("#weekly-duration-total", formatMinutes(summary.duration));
    setText("#weekly-streak", `${toPersianNumber(summary.streak)} روز استمرار`);
    setText("#weekly-next-session", summary.next ? `${summary.next.label} · ${currentSessionTemplate(summary.next.id)?.title || "جلسه بعدی"}` : "جلسه‌ای برای ادامه ثبت نشده");

    const todayButton = document.getElementById("weekly-start-today");
    if (todayButton) {
      if (todayDay?.plan === "session") {
        todayButton.hidden = false;
        todayButton.href = `workout-session-botanical.html?day=${todayDay.id}&entry=weekly`;
        todayButton.textContent = state.activeSession.dayId === todayDay.id && ["in_progress", "paused"].includes(state.activeSession.status)
          ? "ادامه تمرین امروز"
          : latestHistoryForDay(todayDay.id)?.status === "complete"
            ? "مشاهده نتیجه"
            : "شروع تمرین امروز";
      } else if (summary.next) {
        todayButton.hidden = false;
        todayButton.href = `workout-weekly-botanical.html`;
        todayButton.textContent = `جلسه بعدی: ${summary.next.label}`;
      } else {
        todayButton.hidden = true;
      }
    }

    const daysRoot = document.getElementById("weekly-day-strip");
    if (daysRoot) {
      daysRoot.innerHTML = state.week.map((day) => {
        const visual = dayVisualState(day);
        return `
          <button
            class="workout-day-status"
            type="button"
            data-day-select="${day.id}"
            data-state="${visual}"
            data-selected="${day.id === selectedDay.id ? "true" : "false"}"
            aria-pressed="${day.id === selectedDay.id ? "true" : "false"}"
          >
            <strong>${day.label}</strong>
            <small>${day.shortDate}</small>
            <small>${dayStatusCopy(visual)}</small>
          </button>
        `;
      }).join("");
    }

    renderWeeklySessionCard(selectedDay, selectedTemplate, selectedVisualState);
    renderWeeklyHistory();
    toggleTabPanel("weekly-tab-program");
  }

  function renderWeeklySessionCard(day, template, visualState) {
    const container = document.getElementById("weekly-selected-day");
    if (!container) return;

    if (STATE_PARAM === "loading") {
      container.innerHTML = `
        <section class="workout-state-panel workout-panel-card" data-state="loading">
          <strong>در حال دریافت برنامه هفتگی</strong>
          <span class="workout-skeleton"></span>
          <span class="workout-skeleton"></span>
          <span class="workout-skeleton"></span>
        </section>
      `;
      return;
    }

    if (STATE_PARAM === "error") {
      container.innerHTML = `
        <section class="workout-state-panel workout-panel-card" data-state="error">
          <strong>دریافت برنامه این هفته کامل نشد</strong>
          <p>اتصال را دوباره بررسی کن یا کمی بعد دوباره تلاش کن.</p>
          <button class="button button--secondary" type="button" id="weekly-retry-button">تلاش مجدد</button>
        </section>
      `;
      document.getElementById("weekly-retry-button")?.addEventListener("click", () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("state");
        window.location.href = url.toString();
      });
      return;
    }

    if (!template && day.plan === "empty") {
      container.innerHTML = `
        <section class="workout-state-panel workout-panel-card">
          <strong>برای این روز جلسه‌ای تنظیم نشده است</strong>
          <p>می‌توانی همین روز را بعداً به یک جلسه تمرینی اختصاص بدهی یا جابه‌جایی جلسه را از منو انجام بدهی.</p>
        </section>
      `;
      return;
    }

    if (day.plan === "rest") {
      container.innerHTML = `
        <section class="workout-shell-card">
          <div class="workout-card__header">
            <div>
              <h2>روز استراحت</h2>
              <p>امروز برای بازیابی در نظر گرفته شده است.</p>
            </div>
            <span class="workout-status-chip">استراحت</span>
          </div>
          <div class="workout-info-strip">
            <strong>پیشنهاد سبک</strong>
            <p>۱۰ دقیقه کشش آرام یا ۲۰ دقیقه پیاده‌روی سبک.</p>
          </div>
          ${day.backupTemplateId ? '<button class="button button--secondary" type="button" id="restore-day-session">بازگرداندن جلسه</button>' : ""}
        </section>
      `;
      document.getElementById("restore-day-session")?.addEventListener("click", () => {
        day.plan = "session";
        day.templateId = day.backupTemplateId;
        day.backupTemplateId = "";
        day.status = "future";
        saveWorkoutState();
        renderWeeklyPage();
        showToast("جلسه دوباره به این روز برگردانده شد.");
      });
      return;
    }

    const historyItem = latestHistoryForDay(day.id);
    const progress = state.activeSession.dayId === day.id ? sessionProgressFor(template) : template.exercises.map((exercise) => ({ exercise, completed: false, skipped: false }));
    const nextActionLabel = historyItem?.status === "complete"
      ? "مشاهده نتیجه"
      : state.activeSession.dayId === day.id && ["in_progress", "paused"].includes(state.activeSession.status)
        ? "ادامه جلسه"
        : "شروع جلسه";
    const nextActionHref = historyItem?.status === "complete"
      ? "#weekly-view-result"
      : `workout-session-botanical.html?day=${day.id}&entry=weekly`;
    container.innerHTML = `
      <section class="workout-shell-card" data-od-id="weekly-day-session-card">
        <div class="workout-card__header">
          <div>
            <h2>${template.title}</h2>
            <p>${template.program} · جلسه ${toPersianNumber(template.sessionNumber)}</p>
          </div>
          <span class="workout-status-chip" data-tone="${visualState === "done" ? "done" : visualState === "today" ? "today" : visualState === "partial" ? "warn" : "plan"}">${dayStatusCopy(visualState)}</span>
        </div>
        <div class="workout-summary-grid">
          <div class="workout-stat-card"><span>مدت تقریبی</span><strong>${formatMinutes(template.duration)}</strong></div>
          <div class="workout-stat-card"><span>تعداد حرکت‌ها</span><strong>${toPersianNumber(template.exercises.length)} حرکت</strong></div>
          <div class="workout-stat-card"><span>شدت</span><strong>${template.intensity}</strong></div>
          <div class="workout-stat-card"><span>زمان پیشنهادی</span><strong>${template.suggestedTime}</strong></div>
        </div>
        <div class="workout-summary-list">
          ${progress.slice(0, 4).map((item) => `
            <article class="workout-summary-row ${item.completed ? "is-done" : ""}">
              <div>
                <strong>${resolvedExerciseName(item)}</strong>
                <small>${repLabel(item.exercise)} · ${item.exercise.muscles}</small>
              </div>
              <span class="workout-summary-badge">${item.completed ? "انجام‌شده" : "در برنامه"}</span>
            </article>
          `).join("")}
        </div>
        <div class="workout-inline-actions">
          <a class="button button--primary" href="${nextActionHref}" data-weekly-primary-action="${day.id}">${nextActionLabel}</a>
          <button class="button button--secondary" type="button" id="weekly-open-exercises">مشاهده حرکت‌ها</button>
          <button class="button button--quiet" type="button" id="weekly-more-actions">منوی بیشتر</button>
          ${historyItem?.status === "complete" || historyItem?.status === "partial" ? `<button class="button button--quiet" type="button" data-review-result="${day.id}">مشاهده نتیجه</button>` : ""}
          ${historyItem?.status === "complete" ? `<button class="button button--quiet" type="button" data-repeat-session="${day.id}">تکرار این جلسه</button>` : ""}
        </div>
      </section>
    `;

    container.querySelector("[data-weekly-primary-action]")?.addEventListener("click", (event) => {
      if (historyItem?.status === "complete") {
        event.preventDefault();
        openResultReview(day.id);
      }
    });
    document.getElementById("weekly-open-exercises")?.addEventListener("click", () => {
      openExerciseListSheet(template, day.id);
    });
    document.getElementById("weekly-more-actions")?.addEventListener("click", () => {
      openMoveSheet(day.id);
    });
    container.querySelector("[data-review-result]")?.addEventListener("click", () => openResultReview(day.id));
    container.querySelector("[data-repeat-session]")?.addEventListener("click", () => confirmRepeatSession(day.id, "weekly"));
  }

  function renderWeeklyHistory() {
    const root = document.getElementById("weekly-history-list");
    if (!root) return;
    if (STATE_PARAM === "history-empty") {
      root.innerHTML = `
        <div class="workout-empty-state">
          <strong>هنوز تاریخچه‌ای برای این بازه ثبت نشده است</strong>
          <small>بعد از پایان اولین جلسه، اینجا خلاصه واقعی تمرین‌ها را می‌بینی.</small>
        </div>
      `;
      return;
    }

    const filter = document.querySelector("[data-history-filter][aria-pressed='true']")?.dataset.historyFilter || "week";
    const items = filterHistory(filter);
    root.innerHTML = items.map((item) => `
      <article class="workout-history-row" tabindex="0" data-history-open="${item.id}">
        <div>
          <strong>${item.title}</strong>
          <small>${item.dateLabel} · ${item.shortNote}</small>
          <div class="workout-history-row__details">
            <small>مدت: ${formatMinutes(item.durationMinutes)} · شدت ثبت‌شده: ${item.intensityLabel}</small>
            <small>حرکت‌های انجام‌شده: ${toPersianNumber(item.completedExercises)} از ${toPersianNumber(item.totalExercises)} · ست‌ها: ${toPersianNumber(item.totalSetsDone)}</small>
            <small>انرژی: ${item.energy} · وضعیت بدن: ${item.body}${item.pain ? ` · ناراحتی: ${item.pain}` : ""}</small>
          </div>
        </div>
        <span class="workout-status-chip" data-tone="${item.status === "complete" ? "done" : "warn"}">${item.status === "complete" ? "کامل" : "ناقص"}</span>
      </article>
    `).join("");
  }

  function bindWeeklyActions() {
    document.getElementById("weekly-day-strip")?.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-day-select]");
      if (!trigger) return;
      state.selectedDayId = trigger.dataset.daySelect;
      saveWorkoutState();
      renderWeeklyPage();
    });

    document.querySelectorAll("[data-day-strip-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const strip = document.getElementById("weekly-day-strip");
        if (!strip) return;
        const direction = button.dataset.dayStripNav === "next" ? 1 : -1;
        const delta = Math.max(strip.clientWidth * 0.72, 180) * direction;
        strip.scrollBy({ left: delta, behavior: "smooth" });
      });
    });

    document.querySelectorAll("[data-week-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        state.weekOffset += button.dataset.weekNav === "prev" ? -1 : 1;
        syncWeekStatuses();
        state.selectedDayId = state.week.find((item) => item.dateKey === TODAY_KEY)?.id || state.week[0].id;
        saveWorkoutState();
        renderWeeklyPage();
      });
    });

    document.querySelectorAll("[data-history-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-history-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        renderWeeklyHistory();
      });
    });

    document.getElementById("weekly-tab-switch")?.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-weekly-tab]");
      if (!trigger) return;
      document.querySelectorAll("[data-weekly-tab]").forEach((item) => item.setAttribute("aria-selected", String(item === trigger)));
      toggleTabPanel(trigger.dataset.weeklyTab);
    });

    document.getElementById("weekly-history-list")?.addEventListener("click", toggleHistoryRow);
    document.getElementById("weekly-history-list")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      toggleHistoryRow(event);
      event.preventDefault();
    });

    document.querySelectorAll("[data-workout-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(button.closest("dialog")));
    });

    document.getElementById("weekly-confirm-move")?.addEventListener("click", () => {
      const dialog = document.getElementById("weekly-move-sheet");
      const sourceDay = getWeekDay(dialog?.dataset.dayId || "");
      const targetDayId = document.querySelector('input[name="move-target-day"]:checked')?.value;
      const targetDay = getWeekDay(targetDayId || "");
      if (!sourceDay || !targetDay) {
        showToast("ابتدا روز مقصد را انتخاب کن.");
        return;
      }
      if (state.activeSession.dayId === sourceDay.id && ["in_progress", "paused"].includes(state.activeSession.status) && !window.confirm("این جلسه در حال اجراست. ابتدا با تأیید شما به روز جدید منتقل می‌شود. ادامه می‌دهی؟")) {
        return;
      }
      targetDay.plan = "session";
      targetDay.templateId = sourceDay.templateId;
      targetDay.status = "future";
      sourceDay.plan = "empty";
      sourceDay.templateId = "";
      sourceDay.status = "empty";
      if (state.activeSession.dayId === sourceDay.id) {
        state.activeSession.dayId = targetDay.id;
      }
      saveWorkoutState();
      closeDialog(dialog);
      renderWeeklyPage();
      showToast("جلسه به روز جدید منتقل شد.");
    });

    document.getElementById("weekly-convert-rest")?.addEventListener("click", () => {
      const dialog = document.getElementById("weekly-move-sheet");
      const day = getWeekDay(dialog?.dataset.dayId || "");
      if (!day) return;
      if (state.activeSession.dayId === day.id && ["in_progress", "paused"].includes(state.activeSession.status) && !window.confirm("برای تبدیل این روز به استراحت، باید جلسه فعال فعلی متوقف شود. مطمئنی؟")) {
        return;
      }
      if (day.plan === "session" && day.templateId) {
        day.backupTemplateId = day.templateId;
      }
      day.plan = "rest";
      day.templateId = "";
      day.status = "rest";
      saveWorkoutState();
      closeDialog(dialog);
      renderWeeklyPage();
      showToast("این روز به حالت استراحت تغییر کرد.");
    });

    document.getElementById("weekly-mark-undone")?.addEventListener("click", () => {
      const dialog = document.getElementById("weekly-move-sheet");
      const day = getWeekDay(dialog?.dataset.dayId || "");
      if (!day) return;
      day.status = day.plan === "session" ? "future" : day.status;
      state.history = state.history.filter((item) => item.dayId !== day.id);
      if (state.activeSession.dayId === day.id && ["complete", "partial"].includes(state.activeSession.status)) {
        state.activeSession.status = "paused";
      }
      saveWorkoutState();
      closeDialog(dialog);
      renderWeeklyPage();
      showToast("وضعیت روز انتخاب‌شده به انجام‌نشده برگردانده شد.");
    });

    document.getElementById("weekly-show-note")?.addEventListener("click", () => {
      const dialog = document.getElementById("weekly-move-sheet");
      const day = getWeekDay(dialog?.dataset.dayId || "");
      const template = day ? currentSessionTemplate(day.id) : null;
      if (!template) {
        showToast("برای این روز یادداشت برنامه‌ای ثبت نشده است.");
        return;
      }
      showToast(template.note || "برای این جلسه یادداشت خاصی ثبت نشده است.");
    });
  }

  function toggleHistoryRow(event) {
    const row = event.target.closest("[data-history-open]");
    if (!row) return;
    row.classList.toggle("is-open");
  }

  function toggleTabPanel(tabId) {
    const program = document.getElementById("weekly-tab-program");
    const history = document.getElementById("weekly-tab-history");
    if (!program || !history) return;
    program.hidden = tabId !== "weekly-tab-program";
    history.hidden = tabId !== "weekly-tab-history";
  }

  function filterHistory(filter) {
    const now = new Date(TODAY);
    if (filter === "all") {
      return [...state.history].sort((a, b) => new Date(b.dateIso || 0) - new Date(a.dateIso || 0));
    }
    if (filter === "month") {
      return state.history
        .filter((item) => {
          const date = new Date(item.dateIso || 0);
          return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        })
        .sort((a, b) => new Date(b.dateIso || 0) - new Date(a.dateIso || 0));
    }
    return historyForCurrentWeek().sort((a, b) => new Date(b.dateIso || 0) - new Date(a.dateIso || 0));
  }

  function openExerciseListSheet(template, dayId) {
    const dialog = document.getElementById("weekly-exercise-sheet");
    const root = document.getElementById("weekly-exercise-list");
    const startLink = document.getElementById("weekly-exercise-start");
    if (!dialog || !root || !template) return;
    dialog.dataset.dayId = dayId;
    if (startLink) startLink.href = `workout-session-botanical.html?day=${dayId}&entry=weekly`;
    root.innerHTML = template.exercises.map((exercise) => `
      <article class="workout-option-card">
        <strong>${exercise.name}</strong>
        <small>${toPersianNumber(exercise.sets)} ست · ${repLabel(exercise)} · ${exercise.equipment}</small>
      </article>
    `).join("");
    openDialog(dialog);
  }

  function openMoveSheet(dayId) {
    const dialog = document.getElementById("weekly-move-sheet");
    const options = document.getElementById("weekly-move-options");
    const day = getWeekDay(dayId);
    if (!dialog || !options || !day) return;
    dialog.dataset.dayId = dayId;
    options.innerHTML = state.week
      .filter((item) => item.id !== dayId)
      .map((item) => `
        <label class="workout-option-card">
          <input type="radio" name="move-target-day" value="${item.id}" ${item.plan === "session" ? "disabled" : ""} />
          <strong>${item.label} · ${item.shortDate}</strong>
          <small>${item.plan === "rest" ? "روز استراحت" : item.plan === "empty" ? "بدون برنامه" : "جلسه فعال دیگر"}</small>
        </label>
      `)
      .join("");
    openDialog(dialog);
  }

  function setupWorkoutSessionPage() {
    syncWeekStatuses();
    const requestedDay = DAY_PARAM ? getWeekDay(DAY_PARAM) : getWeekDay(state.activeSession.dayId) || todayPlannedDay();
    if (requestedDay && state.activeSession.dayId && state.activeSession.dayId !== requestedDay.id && ["in_progress", "paused"].includes(state.activeSession.status)) {
      const dialog = document.getElementById("workout-session-switch-dialog");
      document.getElementById("session-switch-continue").onclick = () => {
        closeDialog(dialog);
        const template = activeTemplate();
        if (template) renderSessionPage(template);
      };
      document.getElementById("session-switch-save-start").onclick = () => {
        if (!requestedDay) return;
        resetSessionForDay(requestedDay);
        state.activeSession.status = "in_progress";
        state.activeSession.startedAt = new Date().toISOString();
        saveWorkoutState();
        closeDialog(dialog);
        const template = activeTemplate();
        if (template) {
          renderSessionPage(template);
          runSessionTimer();
        }
      };
      document.getElementById("session-switch-cancel").onclick = () => {
        closeDialog(dialog);
        redirectAfterSession();
      };
      openDialog(dialog);
    } else if (requestedDay) {
      ensureActiveSession(requestedDay.id);
    }

    if (state.activeSession.status === "not_started") {
      state.activeSession.status = "in_progress";
      state.activeSession.startedAt = new Date().toISOString();
      saveWorkoutState();
    }

    const template = activeTemplate() || (requestedDay ? currentSessionTemplate(requestedDay.id) : null);
    if (!template) return;

    wireSessionDialogs(template);
    renderSessionPage(template);
    bindSessionActions(template);
    runSessionTimer();
    maybeOpenGuideFromQuery(template);
  }

  function renderSessionPage(template) {
    const progress = sessionProgressFor(template);
    const currentIndex = Math.min(state.activeSession.currentExerciseIndex, template.exercises.length - 1);
    const currentProgress = progress[currentIndex];
    const currentExercise = currentProgress.exercise;
    const currentLogs = currentProgress.logs;
    const currentSetNumber = Math.min(currentLogs.length + 1, currentExercise.sets);
    const completedExercises = progress.filter((item) => item.completed).length;
    const skippedExercises = progress.filter((item) => item.skipped).length;
    const doneSets = completedSetCount(state.activeSession);
    const totalSets = totalSetCount(template);
    const percent = Math.round((doneSets / Math.max(1, totalSets)) * 100);
    const isCurrentExerciseFinished = currentLogs.length >= currentExercise.sets;
    const allSetsResolved = progress.every((item) => item.logs.length >= item.exercise.sets);

    setText("#session-program-title", template.program);
    setText("#session-title", template.title);
    setText("#session-elapsed", formatClock(state.activeSession.elapsedSeconds));
    setText("#session-progress-text", `حرکت ${toPersianNumber(currentIndex + 1)} از ${toPersianNumber(template.exercises.length)}`);
    setText("#session-progress-percent", `${toPersianNumber(percent)}٪`);
    document.getElementById("session-progress-bar")?.style.setProperty("--progress", `${percent}%`);

    setText("#current-exercise-name", resolvedExerciseName(currentProgress));
    setText("#current-exercise-muscles", currentExercise.muscles);
    setText("#current-exercise-guide", currentExercise.guide);
    setText("#current-exercise-order", `حرکت ${toPersianNumber(currentExercise.order)}`);
    setText("#current-exercise-sets", `${toPersianNumber(currentSetNumber)} از ${toPersianNumber(currentExercise.sets)} ست`);
    setText("#current-exercise-target", repLabel(currentExercise));
    setText("#current-exercise-weight", currentExercise.suggestedWeight ? `${toPersianNumber(currentExercise.suggestedWeight)} کیلوگرم` : "بدون وزنه پیشنهادی");
    setText("#current-exercise-rest", `${toPersianNumber(currentExercise.rest)} ثانیه استراحت`);
    setText("#session-unsaved-note", state.activeSession.status === "paused" ? "جلسه ذخیره شده و از همین نقطه ادامه پیدا می‌کند." : "پیشرفت جلسه به‌صورت موقت ذخیره می‌شود و با خروج ناگهانی از بین نمی‌رود.");
    setText("#session-field-reps-label", currentExercise.repUnit === "ثانیه" ? "زمان / ثانیه" : "تعداد تکرار");
    const repsField = document.getElementById("session-field-reps");
    const weightField = document.getElementById("session-field-weight");
    const repsWrapper = repsField?.closest(".field");
    const weightWrapper = weightField?.closest(".field");
    const needsWeight = Number(currentExercise.suggestedWeight || 0) > 0 && currentExercise.repUnit !== "ثانیه";
    if (repsField) repsField.value = String(currentExercise.reps);
    if (weightField) weightField.value = String(currentExercise.suggestedWeight || 0);
    if (repsWrapper) repsWrapper.hidden = false;
    if (weightWrapper) weightWrapper.hidden = !needsWeight;
    if (weightField) weightField.disabled = !needsWeight;

    renderSessionStepper(progress);
    renderLoggedSets(currentProgress);
    renderExercisePicker(progress);
    renderSubstituteOptions(currentExercise.id);
    renderRestOverlay();

    const doneButton = document.getElementById("session-complete-set");
    if (doneButton) {
      doneButton.textContent = "این ست انجام شد";
      doneButton.disabled = isCurrentExerciseFinished || allSetsResolved;
      doneButton.hidden = allSetsResolved;
    }
    const previousButton = document.getElementById("session-prev-exercise");
    if (previousButton) previousButton.disabled = currentIndex === 0;
    const nextButton = document.getElementById("session-next-exercise");
    if (nextButton) nextButton.disabled = currentIndex >= template.exercises.length - 1;
    const finishButton = document.getElementById("session-finish-button");
    if (finishButton) {
      finishButton.classList.toggle("button--primary", allSetsResolved);
      finishButton.classList.toggle("button--quiet", !allSetsResolved);
    }

    setText("#session-summary-line", `${toPersianNumber(completedExercises)} حرکت کامل · ${toPersianNumber(skippedExercises)} حرکت ردشده`);
  }

  function renderSessionStepper(progress) {
    const root = document.getElementById("session-stepper");
    if (!root) return;
    root.innerHTML = progress.map((item, index) => {
      let stateLabel = "upcoming";
      if (item.completed) stateLabel = "done";
      else if (item.skipped) stateLabel = "skipped";
      else if (index === state.activeSession.currentExerciseIndex) stateLabel = "current";
      return `<button class="workout-session-step" type="button" data-session-jump="${index}" data-state="${stateLabel}" aria-label="${resolvedExerciseName(item)} - ${stateLabel}" ${stateLabel === "current" ? 'aria-current="step"' : ""}>${toPersianNumber(index + 1)}</button>`;
    }).join("");
  }

  function renderLoggedSets(progressItem) {
    const root = document.getElementById("session-logged-sets");
    if (!root) return;
    if (!progressItem.logs.length) {
      root.innerHTML = `
        <div class="workout-empty-state">
          <strong>هنوز ستی برای این حرکت ثبت نشده است</strong>
          <small>اولین ست را انجام بده تا این بخش با جزئیات پر شود.</small>
        </div>
      `;
      return;
    }
    root.innerHTML = progressItem.logs.map((log) => `
      <article class="workout-logged-set ${log.status === "skipped" ? "is-skipped" : ""}">
        <div>
          <strong>ست ${toPersianNumber(log.setNumber)}</strong>
          <small>${log.status === "done" ? `${toPersianNumber(log.reps)} ${log.repUnit}${log.weight ? ` · ${toPersianNumber(log.weight)} کیلو` : ""}` : "این ست رد شده است."}</small>
        </div>
        <span class="workout-status-chip" data-tone="${log.status === "done" ? "done" : "warn"}">${log.status === "done" ? "انجام شد" : "رد شد"}</span>
      </article>
    `).join("");
  }

  function renderExercisePicker(progress) {
    const root = document.getElementById("session-exercise-picker");
    if (!root) return;
    root.innerHTML = progress.map((item, index) => `
      <button class="workout-history-row" type="button" data-session-jump="${index}">
        <div>
          <strong>${resolvedExerciseName(item)}</strong>
          <small>${item.exercise.muscles}</small>
        </div>
        <span class="workout-status-chip" data-tone="${item.completed ? "done" : item.skipped ? "warn" : index === state.activeSession.currentExerciseIndex ? "today" : "plan"}">${item.completed ? "کامل" : item.skipped ? "ردشده" : index === state.activeSession.currentExerciseIndex ? "فعلی" : "باقی‌مانده"}</span>
      </button>
    `).join("");
  }

  function renderSubstituteOptions(exerciseId) {
    const root = document.getElementById("session-substitute-options");
    if (!root) return;
    const options = SHARED_SUBSTITUTIONS[exerciseId] || [];
    root.innerHTML = options.map((option) => `
      <label class="workout-option-card">
        <input type="radio" name="substitute-option" value="${option.id}">
        <strong>${option.name}</strong>
        <small>${option.muscles} · ${option.gear}</small>
        <small>${option.reason}</small>
      </label>
    `).join("");
  }

  function renderRestOverlay() {
    const overlay = document.getElementById("session-rest-overlay");
    if (!overlay) return;
    const restState = state.activeSession.rest || null;
    if (!restState || !restState.active) {
      overlay.hidden = true;
      return;
    }
    overlay.hidden = false;
    setText("#session-rest-time", formatClock(restState.remaining));
    setText("#session-rest-next", restState.nextExerciseName || "حرکت بعدی");
  }

  function bindSessionActions(template) {
    document.getElementById("session-guide-button")?.addEventListener("click", () => {
      const currentExercise = sessionProgressFor(template)[state.activeSession.currentExerciseIndex].exercise;
      openGuide(currentExercise);
    });

    document.getElementById("session-complete-set")?.addEventListener("click", () => {
      completeCurrentSet();
    });

    document.getElementById("session-skip-set")?.addEventListener("click", () => {
      skipCurrentSet();
    });

    document.getElementById("session-prev-exercise")?.addEventListener("click", () => {
      state.activeSession.currentExerciseIndex = Math.max(0, state.activeSession.currentExerciseIndex - 1);
      saveWorkoutState();
      renderSessionPage(template);
    });

    document.getElementById("session-next-exercise")?.addEventListener("click", () => {
      state.activeSession.currentExerciseIndex = Math.min(template.exercises.length - 1, state.activeSession.currentExerciseIndex + 1);
      saveWorkoutState();
      renderSessionPage(template);
    });

    document.getElementById("session-open-picker")?.addEventListener("click", () => {
      openDialog(document.getElementById("session-picker-sheet"));
    });

    document.getElementById("session-skip-exercise")?.addEventListener("click", () => {
      skipCurrentExercise();
    });

    document.getElementById("session-open-substitute")?.addEventListener("click", () => {
      openDialog(document.getElementById("session-substitute-sheet"));
    });

    document.getElementById("session-finish-button")?.addEventListener("click", () => {
      openFinishSheet();
    });

    document.getElementById("session-complete-all")?.addEventListener("click", () => {
      openCompleteAllSheet(template);
    });

    document.getElementById("session-exit-button")?.addEventListener("click", () => {
      openDialog(document.getElementById("session-exit-dialog"));
    });

    document.getElementById("session-exercise-picker")?.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-session-jump]");
      if (!jump) return;
      state.activeSession.currentExerciseIndex = Number(jump.dataset.sessionJump) || 0;
      saveWorkoutState();
      closeDialog(document.getElementById("session-picker-sheet"));
      renderSessionPage(template);
    });

    document.getElementById("session-stepper")?.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-session-jump]");
      if (!jump) return;
      state.activeSession.currentExerciseIndex = Number(jump.dataset.sessionJump) || 0;
      saveWorkoutState();
      renderSessionPage(template);
    });

    document.getElementById("session-logged-sets")?.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-edit-last-set]");
      const deleteButton = event.target.closest("[data-delete-last-set]");
      const progress = sessionProgressFor(template)[state.activeSession.currentExerciseIndex];
      const baseExercise = progress?.baseExercise || template.exercises[state.activeSession.currentExerciseIndex];
      if (!baseExercise) return;
      const logs = state.activeSession.setLogs[baseExercise.id] || [];
      if (editButton) {
        const last = logs[logs.length - 1];
        if (!last) return;
        const repsField = document.getElementById("session-field-reps");
        const weightField = document.getElementById("session-field-weight");
        if (repsField) repsField.value = String(last.reps || baseExercise.reps);
        if (weightField) weightField.value = String(last.weight || 0);
        logs.pop();
        state.activeSession.setLogs[baseExercise.id] = logs;
        saveWorkoutState();
        renderSessionPage(template);
        showToast("آخرین ست برای ویرایش به فرم برگردانده شد.");
      }
      if (deleteButton) {
        if (!logs.length) return;
        logs.pop();
        state.activeSession.setLogs[baseExercise.id] = logs;
        saveWorkoutState();
        renderSessionPage(template);
        showToast("آخرین ست حذف شد.");
      }
    });

    document.getElementById("session-substitute-confirm")?.addEventListener("click", () => {
      const selected = document.querySelector('input[name="substitute-option"]:checked');
      const current = sessionProgressFor(template)[state.activeSession.currentExerciseIndex].exercise;
      if (!selected || !current) return;
      const replacement = (SHARED_SUBSTITUTIONS[current.id] || []).find((item) => item.id === selected.value);
      if (!replacement) return;
      state.activeSession.substitutions[current.id] = replacement;
      saveWorkoutState();
      closeDialog(document.getElementById("session-substitute-sheet"));
      renderSessionPage(template);
      showToast(`حرکت «${replacement.name}» جایگزین شد.`);
    });

    document.getElementById("session-rest-skip")?.addEventListener("click", clearRestOverlay);
    document.getElementById("session-rest-add")?.addEventListener("click", () => adjustRest(15));
    document.getElementById("session-rest-toggle")?.addEventListener("click", toggleRestPause);

    document.getElementById("session-save-exit")?.addEventListener("click", () => {
      state.activeSession.status = "paused";
      clearRestOverlay();
      saveWorkoutState();
      redirectAfterSession();
    });

    document.getElementById("session-exit-continue")?.addEventListener("click", () => {
      closeDialog(document.getElementById("session-exit-dialog"));
    });

    document.getElementById("session-exit-partial")?.addEventListener("click", () => {
      closeDialog(document.getElementById("session-exit-dialog"));
      openFinishSheet("partial");
    });

    document.getElementById("session-finish-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      finalizeSession(document.getElementById("session-finish-form").dataset.forceStatus || "");
    });

    document.getElementById("session-complete-all-confirm")?.addEventListener("click", () => {
      markAllRemainingDone();
      closeDialog(document.getElementById("session-complete-all-dialog"));
      openFinishSheet("complete");
    });

    document.getElementById("session-complete-all-partial")?.addEventListener("click", () => {
      closeDialog(document.getElementById("session-complete-all-dialog"));
      openFinishSheet("partial");
    });

    document.querySelectorAll("[data-workout-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(button.closest("dialog")));
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });
  }

  function wireSessionDialogs(template) {
    const summaryProgram = document.getElementById("session-summary-program");
    if (summaryProgram) {
      summaryProgram.textContent = `${template.program} · جلسه ${toPersianNumber(template.sessionNumber)}`;
    }
  }

  function maybeOpenGuideFromQuery(template) {
    const guideId = new URLSearchParams(window.location.search).get("guide");
    if (!guideId) return;
    const exercise = template.exercises.find((item) => item.id === guideId);
    if (exercise) openGuide(exercise);
  }

  function completeCurrentSet(options = {}) {
    const template = activeTemplate();
    const currentExercise = template.exercises[state.activeSession.currentExerciseIndex];
    if (!currentExercise) return;
    const logs = state.activeSession.setLogs[currentExercise.id] || [];
    if (options.markWholeExercise) {
      while (logs.length < currentExercise.sets) {
        logs.push({
          setNumber: logs.length + 1,
          status: "done",
          reps: currentExercise.reps,
          weight: currentExercise.suggestedWeight || 0,
          repUnit: currentExercise.repUnit,
        });
      }
    } else if (logs.length < currentExercise.sets) {
      const repsValue = Number(document.getElementById("session-field-reps")?.value || currentExercise.reps);
      const weightValue = Number(document.getElementById("session-field-weight")?.value || currentExercise.suggestedWeight || 0);
      logs.push({
        setNumber: logs.length + 1,
        status: "done",
        reps: repsValue,
        weight: weightValue,
        repUnit: currentExercise.repUnit,
      });
    }
    state.activeSession.setLogs[currentExercise.id] = logs;
    advanceAfterSet(template, currentExercise, logs.length >= currentExercise.sets);
    showToast(`ست ${toPersianNumber(logs.length)} برای «${resolvedExerciseName({ exercise: currentExercise, substituted: state.activeSession.substitutions[currentExercise.id] })}» ثبت شد.`);
  }

  function skipCurrentSet() {
    const template = activeTemplate();
    const currentExercise = template.exercises[state.activeSession.currentExerciseIndex];
    const logs = state.activeSession.setLogs[currentExercise.id] || [];
    if (logs.length >= currentExercise.sets) return;
    logs.push({
      setNumber: logs.length + 1,
      status: "skipped",
      reps: 0,
      weight: 0,
      repUnit: currentExercise.repUnit,
    });
    state.activeSession.setLogs[currentExercise.id] = logs;
    advanceAfterSet(template, currentExercise, logs.length >= currentExercise.sets);
    showToast(`ست ${toPersianNumber(logs.length)} رد شد.`);
  }

  function skipCurrentExercise() {
    const template = activeTemplate();
    const exercise = template.exercises[state.activeSession.currentExerciseIndex];
    if (!exercise) return;
    if (!state.activeSession.skippedExercises.includes(exercise.id)) {
      state.activeSession.skippedExercises.push(exercise.id);
    }
    state.activeSession.currentExerciseIndex = Math.min(template.exercises.length - 1, state.activeSession.currentExerciseIndex + 1);
    clearRestOverlay();
    saveWorkoutState();
    renderSessionPage(template);
    showToast(`حرکت «${resolvedExerciseName({ exercise, substituted: state.activeSession.substitutions[exercise.id] })}» رد شد.`);
  }

  function advanceAfterSet(template, exercise, finishedExercise) {
    state.activeSession.status = "in_progress";
    if (finishedExercise) {
      const nextIndex = findCurrentExerciseIndex(template, state.activeSession.setLogs, state.activeSession.skippedExercises);
      state.activeSession.currentExerciseIndex = Math.min(nextIndex, template.exercises.length - 1);
    }
    const nextExercise = template.exercises[state.activeSession.currentExerciseIndex];
    if (resolvedExerciseCount(template) === template.exercises.length) {
      clearRestOverlay();
      if (PAGE === "workout-session") {
        window.setTimeout(() => openFinishSheet(), 120);
      }
    } else {
      startRestOverlay(exercise.rest, nextExercise?.name || "حرکت بعدی");
    }
    saveWorkoutState();
    renderSessionPage(template);
  }

  function startRestOverlay(seconds, nextExerciseName) {
    clearInterval(restTick);
    state.activeSession.rest = {
      active: true,
      paused: false,
      remaining: seconds,
      nextExerciseName,
    };
    restTick = window.setInterval(() => {
      if (!state.activeSession.rest || state.activeSession.rest.paused) return;
      state.activeSession.rest.remaining = Math.max(0, state.activeSession.rest.remaining - 1);
      if (state.activeSession.rest.remaining === 0) {
        clearRestOverlay();
      }
      saveWorkoutState();
      renderRestOverlay();
    }, 1000);
    renderRestOverlay();
  }

  function clearRestOverlay() {
    clearInterval(restTick);
    delete state.activeSession.rest;
    saveWorkoutState();
    renderRestOverlay();
  }

  function adjustRest(amount) {
    if (!state.activeSession.rest) return;
    state.activeSession.rest.remaining += amount;
    saveWorkoutState();
    renderRestOverlay();
  }

  function toggleRestPause() {
    if (!state.activeSession.rest) return;
    state.activeSession.rest.paused = !state.activeSession.rest.paused;
    const button = document.getElementById("session-rest-toggle");
    if (button) button.textContent = state.activeSession.rest.paused ? "ادامه" : "مکث";
    saveWorkoutState();
  }

  function completedExerciseCount(template) {
    return sessionProgressFor(template).filter((item) => item.completed).length;
  }

  function resolvedExerciseCount(template) {
    return sessionProgressFor(template).filter((item) => item.logs.length >= item.exercise.sets).length;
  }

  function runSessionTimer() {
    clearInterval(sessionTick);
    sessionTick = window.setInterval(() => {
      if (state.activeSession.status !== "in_progress") return;
      state.activeSession.elapsedSeconds += 1;
      saveWorkoutState();
      setText("#session-elapsed", formatClock(state.activeSession.elapsedSeconds));
    }, 1000);
  }

  function renderRestOverlay() {
    const overlay = document.getElementById("session-rest-overlay");
    if (!overlay) return;
    const restState = state.activeSession.rest || null;
    if (!restState || !restState.active) {
      overlay.hidden = true;
      return;
    }
    overlay.hidden = false;
    setText("#session-rest-time", formatClock(restState.remaining));
    setText("#session-rest-next", restState.nextExerciseName || "حرکت بعدی");
    const toggleButton = document.getElementById("session-rest-toggle");
    if (toggleButton) toggleButton.textContent = restState.paused ? "ادامه" : "مکث";
  }

  function openCompleteAllSheet(template) {
    const dialog = document.getElementById("session-complete-all-dialog");
    if (!dialog) return;
    const progress = sessionProgressFor(template);
    const done = progress.filter((item) => item.completed).length;
    const partial = progress.filter((item) => !item.completed && item.logs.length > 0).length;
    const untouched = progress.filter((item) => item.logs.length === 0 && !item.skipped).length;
    setText("#session-complete-all-summary", `${toPersianNumber(done)} حرکت کامل · ${toPersianNumber(partial)} حرکت ناقص · ${toPersianNumber(untouched)} حرکت ثبت‌نشده`);
    openDialog(dialog);
  }

  function markAllRemainingDone() {
    const template = activeTemplate();
    template.exercises.forEach((exercise) => {
      const logs = (state.activeSession.setLogs[exercise.id] || []).map((log) => ({
        ...log,
        status: "done",
        reps: log.reps || exercise.reps,
        weight: typeof log.weight === "number" ? log.weight : (exercise.suggestedWeight || 0),
      }));
      while (logs.length < exercise.sets) {
        logs.push({
          setNumber: logs.length + 1,
          status: "done",
          reps: exercise.reps,
          weight: exercise.suggestedWeight || 0,
          repUnit: exercise.repUnit,
        });
      }
      state.activeSession.setLogs[exercise.id] = logs;
    });
    state.activeSession.skippedExercises = [];
    state.activeSession.currentExerciseIndex = template.exercises.length - 1;
    state.activeSession.completionMode = "all_done";
    saveWorkoutState();
  }

  function openFinishSheet(forcedStatus = "") {
    const dialog = document.getElementById("session-finish-dialog");
    const form = document.getElementById("session-finish-form");
    if (!dialog || !form) return;
    form.dataset.forceStatus = forcedStatus;
    const template = activeTemplate();
    const progress = sessionProgressFor(template);
    const doneSets = completedSetCount(state.activeSession);
    const actualMinutes = Math.round((state.activeSession.elapsedSeconds || 0) / 60);
    const durationMinutes = actualMinutes > 0 ? actualMinutes : template.duration;
    setText("#session-finish-duration", formatMinutes(durationMinutes));
    setText("#session-finish-summary", `${toPersianNumber(progress.filter((item) => item.completed).length)} حرکت کامل · ${toPersianNumber(doneSets)} ست ثبت‌شده`);
    setText("#session-finish-calories", `${toPersianNumber(Math.max(1, Math.round((template.calories / Math.max(1, template.duration)) * durationMinutes)))} کالری تقریبی`);
    openDialog(dialog);
  }

  function finalizeSession(forcedStatus = "") {
    const template = activeTemplate();
    const completedExercises = sessionProgressFor(template).filter((item) => item.completed).length;
    const status = forcedStatus || (completedExercises === template.exercises.length ? "complete" : "partial");
    state.activeSession.status = status;
    state.activeSession.completionMode = status;
    clearRestOverlay();

    const form = document.getElementById("session-finish-form");
    const energy = form.querySelector("[name='energy']")?.value || "متعادل";
    const body = form.querySelector("[name='body']")?.value || "آماده";
    const pain = form.querySelector("[name='pain']")?.value.trim() || "";
    const note = form.querySelector("[name='note']")?.value.trim() || "بدون یادداشت تکمیلی.";
    const intensity = form.querySelector("[name='intensity']")?.value || "۳";

    state.activeSession.finishResult = { energy, body, pain, note, intensity };
    state.activeSession.lastCompletedAt = new Date().toISOString();

    const day = getWeekDay(state.activeSession.dayId);
    if (day) day.status = status === "complete" ? "done" : "partial";

    state.history.unshift({
      id: `history-${Date.now()}`,
      dayId: state.activeSession.dayId,
      dateLabel: formatFullDate(new Date()),
      title: template.title,
      durationMinutes: Math.max(1, Math.round(state.activeSession.elapsedSeconds / 60) || template.duration),
      intensityLabel: `شدت ${intensity} از ۵`,
      completedExercises,
      totalExercises: template.exercises.length,
      totalSetsDone: completedSetCount(state.activeSession),
      status,
      shortNote: note,
      energy,
      body,
      pain,
    });

    saveWorkoutState();
    closeDialog(document.getElementById("session-finish-dialog"));
    showToast("نتیجه تمرین با موفقیت ثبت شد.");
    redirectAfterSession();
  }

  function redirectAfterSession() {
    if (ENTRY_PARAM === "weekly") {
      window.location.href = "workout-weekly-botanical.html";
      return;
    }
    if (ENTRY_PARAM === "plans") {
      window.location.href = "plans-botanical.html";
      return;
    }
    window.location.href = "workout-botanical.html";
  }

  function dayStatusCopy(stateName) {
    const labels = {
      done: "انجام‌شده",
      today: "امروز",
      future: "آینده",
      partial: "ناقص",
      rest: "استراحت",
      empty: "بدون برنامه",
    };
    return labels[stateName] || "برنامه";
  }

  function repLabel(exercise) {
    return exercise.repUnit === "ثانیه"
      ? `${toPersianNumber(exercise.reps)} ثانیه`
      : `${toPersianNumber(exercise.reps)} تکرار`;
  }

  function effectiveExercise(baseExercise, substitution) {
    if (!substitution) return baseExercise;
    return {
      ...baseExercise,
      ...substitution,
      equipment: substitution.equipment || substitution.gear || baseExercise.equipment,
    };
  }

  function resolvedExerciseName(progressItem) {
    return progressItem.substituted?.name || progressItem.exercise.name;
  }

  function renderSubstituteOptions(exerciseId) {
    const root = document.getElementById("session-substitute-options");
    const confirmButton = document.getElementById("session-substitute-confirm");
    if (!root) return;
    const options = SHARED_SUBSTITUTIONS[exerciseId] || [];
    if (!options.length) {
      root.innerHTML = `
        <div class="workout-empty-state">
          <strong>برای این حرکت هنوز جایگزین نمونه تعریف نشده است</strong>
          <small>می‌توانی همین حرکت را ادامه بدهی یا بعداً از برنامه هفتگی جلسه را جابه‌جا کنی.</small>
        </div>
      `;
      if (confirmButton) confirmButton.disabled = true;
      return;
    }
    if (confirmButton) confirmButton.disabled = false;
    root.innerHTML = options.map((option) => `
      <label class="workout-option-card">
        <input type="radio" name="substitute-option" value="${option.id}">
        <strong>${option.name}</strong>
        <small>${option.muscles} · ${option.gear || option.equipment || "بدون وسیله"}</small>
        <small>${option.reason}</small>
      </label>
    `).join("");
  }

  function renderLoggedSets(progressItem) {
    const root = document.getElementById("session-logged-sets");
    if (!root) return;
    if (!progressItem.logs.length) {
      root.innerHTML = `
        <div class="workout-empty-state">
          <strong>هنوز ستی برای این حرکت ثبت نشده است</strong>
          <small>بعد از ثبت اولین ست، همین‌جا قابل مرور و اصلاح خواهد بود.</small>
        </div>
      `;
      return;
    }
    root.innerHTML = progressItem.logs
      .map((log, index) => `
        <article class="workout-logged-set ${log.status === "skipped" ? "is-skipped" : ""}">
          <div>
            <strong>ست ${toPersianNumber(log.setNumber)}</strong>
            <small>${log.status === "done" ? `${toPersianNumber(log.reps)} ${log.repUnit}${log.weight ? ` · ${toPersianNumber(log.weight)} کیلو` : ""}` : "این ست رد شده است."}</small>
          </div>
          <div class="workout-row-actions">
            <span class="workout-status-chip" data-tone="${log.status === "done" ? "done" : "warn"}">${log.status === "done" ? "انجام شد" : "رد شد"}</span>
            ${index === progressItem.logs.length - 1 ? `<button class="button button--quiet button--sm" type="button" data-edit-last-set="${log.setNumber}">ویرایش</button><button class="button button--quiet button--sm" type="button" data-delete-last-set="${log.setNumber}">حذف</button>` : ""}
          </div>
        </article>
      `)
      .join("");
  }

  function validateSetInputs(exercise) {
    const repsField = document.getElementById("session-field-reps");
    const weightField = document.getElementById("session-field-weight");
    const errors = [];
    const needsWeight = Number(exercise.suggestedWeight || 0) > 0 && exercise.repUnit !== "ثانیه";
    const repsValue = Number(repsField?.value || 0);
    const weightValue = Number(weightField?.value || 0);
    if (!Number.isFinite(repsValue) || repsValue <= 0) {
      errors.push("مقدار تکرار یا زمان را درست وارد کن.");
    }
    if (needsWeight && (!Number.isFinite(weightValue) || weightValue < 0)) {
      errors.push("وزن نمی‌تواند خالی یا منفی باشد.");
    }
    if (errors.length) {
      showToast(errors[0]);
      return null;
    }
    return {
      reps: repsValue,
      weight: needsWeight ? weightValue : 0,
    };
  }

  function completeCurrentSet(options = {}) {
    const template = activeTemplate();
    const progress = sessionProgressFor(template);
    const currentProgress = progress[state.activeSession.currentExerciseIndex];
    const currentExercise = currentProgress.baseExercise || template.exercises[state.activeSession.currentExerciseIndex];
    if (!currentExercise) return;
    const logs = state.activeSession.setLogs[currentExercise.id] || [];
    if (options.markWholeExercise) {
      while (logs.length < currentExercise.sets) {
        logs.push({
          setNumber: logs.length + 1,
          status: "done",
          reps: currentExercise.reps,
          weight: currentExercise.suggestedWeight || 0,
          repUnit: currentExercise.repUnit,
        });
      }
    } else if (logs.length < currentExercise.sets) {
      const values = validateSetInputs(currentProgress.exercise);
      if (!values) return;
      logs.push({
        setNumber: logs.length + 1,
        status: "done",
        reps: values.reps,
        weight: values.weight,
        repUnit: currentProgress.exercise.repUnit,
      });
    } else {
      return;
    }
    state.activeSession.setLogs[currentExercise.id] = logs;
    advanceAfterSet(template, currentProgress.exercise, logs.length >= currentExercise.sets);
    showToast(`ست ${toPersianNumber(logs.length)} برای «${resolvedExerciseName(currentProgress)}» ثبت شد.`);
  }

  function runSessionTimer() {
    clearInterval(sessionTick);
    sessionTick = window.setInterval(() => {
      if (state.activeSession.status !== "in_progress") return;
      state.activeSession.elapsedSeconds += 1;
      saveWorkoutState();
      setText("#session-elapsed", formatClock(state.activeSession.elapsedSeconds));
    }, 1000);
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }
})();
