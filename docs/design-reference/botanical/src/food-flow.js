(() => {
  "use strict";

  const STORAGE_KEYS = {
    savedFoods: "avocado-saved-foods",
    customFoods: "avocado-custom-foods",
    comboMeals: "avocado-combo-meals",
    recentSearches: "avocado-recent-food-searches",
    recentFoods: "avocado-recent-food-items",
    foodLogEntries: "avocado-food-log-entries-v1",
    flowContext: "avocado-food-flow-context-v1",
  };

  const MEAL_NAMES = {
    breakfast: "صبحانه",
    lunch: "ناهار",
    dinner: "شام",
    snack: "میان‌وعده",
    other: "سایر",
  };

  const DEFAULT_FOODS = [
    { id: "iran-lobia", name: "خوراک لوبیا", category: "غذای ایرانی", reference: "۱ کاسه", calories: 410, protein: 19, carbs: 48, fat: 11, fiber: 14, sugar: 6, sodium: 520, ingredients: "لوبیا چیتی، پیاز، رب گوجه، ادویه، روغن", units: [{ label: "۱ کاسه", multiplier: 1 }, { label: "۱۰۰ گرم", multiplier: 0.62 }, { label: "نیم کاسه", multiplier: 0.5 }] },
    { id: "iran-rice-chicken", name: "مرغ و برنج با سالاد", category: "غذای ایرانی", reference: "۱ بشقاب", calories: 520, protein: 31, carbs: 62, fat: 15, fiber: 5, sugar: 4, sodium: 460, ingredients: "برنج، مرغ، سالاد فصل", units: [{ label: "۱ بشقاب", multiplier: 1 }, { label: "نیم بشقاب", multiplier: 0.55 }, { label: "۱۰۰ گرم", multiplier: 0.38 }] },
    { id: "dairy-yogurt", name: "ماست کم‌چرب", category: "لبنیات", reference: "۱۵۰ گرم", calories: 95, protein: 9, carbs: 10, fat: 2, fiber: 0, sugar: 8, sodium: 70, ingredients: "شیر کم‌چرب، مایه ماست", units: [{ label: "۱۵۰ گرم", multiplier: 1 }, { label: "۱۰۰ گرم", multiplier: 0.67 }, { label: "۱ کاسه کوچک", multiplier: 1.2 }] },
    { id: "fruit-apple", name: "سیب", category: "میوه", reference: "۱ عدد", calories: 80, protein: 0.4, carbs: 21, fat: 0.2, fiber: 4, sugar: 16, sodium: 1, ingredients: "سیب تازه", units: [{ label: "۱ عدد", multiplier: 1 }, { label: "نصف عدد", multiplier: 0.5 }, { label: "۱۰۰ گرم", multiplier: 0.55 }] },
    { id: "drink-milk-coffee", name: "قهوه با شیر", category: "نوشیدنی", reference: "۱ لیوان", calories: 92, protein: 4, carbs: 10, fat: 3, fiber: 0, sugar: 7, sodium: 48, ingredients: "قهوه، شیر کم‌چرب", units: [{ label: "۱ لیوان", multiplier: 1 }, { label: "نیم لیوان", multiplier: 0.5 }, { label: "۲۵۰ میلی‌لیتر", multiplier: 1 }] },
    { id: "grain-sangak-cheese", name: "نان سنگک و پنیر", category: "نان و غلات", reference: "۱ بشقاب", calories: 320, protein: 13, carbs: 34, fat: 14, fiber: 3, sugar: 1, sodium: 410, ingredients: "نان سنگک، پنیر سفید، سبزی خوردن", units: [{ label: "۱ بشقاب", multiplier: 1 }, { label: "نیم بشقاب", multiplier: 0.5 }, { label: "۱۰۰ گرم", multiplier: 0.58 }] },
    { id: "fruit-banana", name: "موز", category: "میوه", reference: "۱ عدد", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3, sugar: 14, sodium: 1, ingredients: "موز تازه", units: [{ label: "۱ عدد", multiplier: 1 }, { label: "نصف عدد", multiplier: 0.5 }, { label: "۱۰۰ گرم", multiplier: 0.9 }] },
    { id: "drink-orange-juice", name: "آب پرتقال طبیعی", category: "نوشیدنی", reference: "۱ لیوان", calories: 112, protein: 2, carbs: 26, fat: 0.3, fiber: 0.5, sugar: 21, sodium: 3, ingredients: "پرتقال تازه", units: [{ label: "۱ لیوان", multiplier: 1 }, { label: "نیم لیوان", multiplier: 0.5 }, { label: "۲۵۰ میلی‌لیتر", multiplier: 1 }] },
  ];

  const DEFAULT_RECENT = [
    { ...DEFAULT_FOODS[5], lastMeal: "breakfast", lastUsedAt: new Date().toISOString(), usageCount: 6 },
    { ...DEFAULT_FOODS[3], lastMeal: "snack", lastUsedAt: new Date().toISOString(), usageCount: 4 },
    { ...DEFAULT_FOODS[1], lastMeal: "lunch", lastUsedAt: new Date().toISOString(), usageCount: 7 },
  ];

  const CATEGORIES = ["غذای ایرانی", "میوه", "نوشیدنی", "لبنیات", "نان و غلات"];
  const OVERLAY_FLOW_TABS = [
    { key: "search", label: "جست‌وجو" },
    { key: "ai", label: "ثبت با هوش مصنوعی" },
    { key: "saved", label: "ذخیره‌شده‌ها" },
  ];
  const AI_SUGGESTIONS = ["یک کف دست نان", "دو قاشق برنج", "یک مشت آجیل"];
  const AI_LIBRARY = [
    { id: "ai-bread", keywords: ["نان"], name: "نان", category: "نان و غلات", reference: "۱ کف دست", defaultUnit: "کف دست", calories: 80, protein: 3, carbs: 16, fat: 0.8, assumption: "یک کف دست نان معادل حدود ۳۰ گرم در نظر گرفته شد", confidence: "medium" },
    { id: "ai-rice", keywords: ["برنج"], name: "برنج پخته", category: "غذای ایرانی", reference: "۲ قاشق", defaultUnit: "قاشق", calories: 55, protein: 1.1, carbs: 12, fat: 0.2, assumption: "هر دو قاشق برنج پخته معادل حدود ۴۵ گرم در نظر گرفته شد", confidence: "medium" },
    { id: "ai-nuts", keywords: ["آجیل", "مغز"], name: "آجیل مخلوط", category: "میان‌وعده", reference: "۱ مشت", defaultUnit: "مشت", calories: 180, protein: 5, carbs: 7, fat: 16, assumption: "یک مشت آجیل معادل حدود ۳۰ گرم در نظر گرفته شد", confidence: "low" },
    { id: "ai-sunflower", keywords: ["تخمه آفتابگردان"], name: "تخمه آفتابگردان", category: "میان‌وعده", reference: "۱ مشت", defaultUnit: "مشت", calories: 170, protein: 6, carbs: 6, fat: 14, assumption: "یک مشت تخمه آفتابگردان معادل حدود ۳۰ گرم در نظر گرفته شد", confidence: "medium" },
    { id: "ai-pumpkin", keywords: ["تخمه کدو"], name: "تخمه کدو", category: "میان‌وعده", reference: "۱ مشت", defaultUnit: "مشت", calories: 160, protein: 8, carbs: 4, fat: 13, assumption: "یک مشت تخمه کدو معادل حدود ۳۰ گرم در نظر گرفته شد", confidence: "medium" },
    { id: "ai-sweet-tea", keywords: ["چای شیرین", "چای"], name: "چای شیرین", category: "نوشیدنی", reference: "۱ لیوان", defaultUnit: "لیوان", calories: 70, protein: 0, carbs: 18, fat: 0, assumption: "یک لیوان چای شیرین با حدود دو قاشق چای‌خوری شکر در نظر گرفته شد", confidence: "low" },
    { id: "ai-seeds-generic", keywords: ["تخمه"], name: "تخمه", category: "میان‌وعده", reference: "۱ مشت", defaultUnit: "مشت", calories: 165, protein: 7, carbs: 5, fat: 13, assumption: "یک مشت تخمه معادل حدود ۳۰ گرم فرض شد", confidence: "low" },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function readStorage(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readFlowContext() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.flowContext) || "{}");
    } catch {
      return {};
    }
  }

  function writeFlowContext(value) {
    sessionStorage.setItem(STORAGE_KEYS.flowContext, JSON.stringify(value || {}));
  }

  function formatDateLabel(date = new Date()) {
    return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(date);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(value);
  }

  function normalizeDigits(value) {
    const digitMap = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9", "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
    return String(value || "").replace(/[۰-۹٠-٩]/g, (digit) => digitMap[digit] || digit);
  }

  function readNumericHint(text) {
    const normalized = normalizeDigits(text).trim();
    const numericMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    if (numericMatch) return Number(numericMatch[1]);
    const wordMap = { "نیم": 0.5, "یک": 1, "یه": 1, "دو": 2, "سه": 3, "چهار": 4 };
    return Object.entries(wordMap).find(([key]) => normalized.includes(key))?.[1] || 1;
  }

  function splitAiSegments(text) {
    return normalizeDigits(text)
      .split(/(?:\s+و\s+|،|,|\n| سپس | بعدش )+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function buildAiDraft(preset, segment, overrides = {}) {
    const quantity = overrides.quantity ?? readNumericHint(segment || preset.reference || "1");
    const unit = overrides.unit || preset.defaultUnit || "واحد";
    const unitLabel = `${formatNumber(quantity)} ${unit}`.trim();
    return {
      id: overrides.id || `ai-${preset.id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      foodId: preset.id,
      name: overrides.name || preset.name,
      quantity,
      unit,
      calories: Math.round((preset.calories || 0) * quantity),
      protein: Number(((preset.protein || 0) * quantity).toFixed(1)),
      carbs: Number(((preset.carbs || 0) * quantity).toFixed(1)),
      fat: Number(((preset.fat || 0) * quantity).toFixed(1)),
      baseQuantity: quantity,
      perUnitCalories: Number(preset.calories || 0),
      perUnitProtein: Number(preset.protein || 0),
      perUnitCarbs: Number(preset.carbs || 0),
      perUnitFat: Number(preset.fat || 0),
      assumption: overrides.assumption || preset.assumption,
      confidence: overrides.confidence || preset.confidence || "medium",
      reference: unitLabel,
      estimated: true,
      category: preset.category || "خوراک تخمینی",
    };
  }

  function refreshAiDraft(item, quantity) {
    const safeQuantity = Math.max(Number(quantity || 0), 0.5);
    return {
      ...item,
      quantity: safeQuantity,
      calories: Math.round((item.perUnitCalories || 0) * safeQuantity),
      protein: Number(((item.perUnitProtein || 0) * safeQuantity).toFixed(1)),
      carbs: Number(((item.perUnitCarbs || 0) * safeQuantity).toFixed(1)),
      fat: Number(((item.perUnitFat || 0) * safeQuantity).toFixed(1)),
    };
  }

  function estimateAiText(text) {
    const input = String(text || "").trim();
    if (!input) {
      return { status: "idle" };
    }
    if (/خطا|سرویس/.test(input)) {
      return { status: "error", message: "فعلاً تخمین در دسترس نیست. یک‌بار دیگر تلاش کن." };
    }
    if (/تخمه/.test(input) && !/آفتاب|کدو/.test(input)) {
      return {
        status: "clarify",
        question: "تخمه آفتابگردان بود یا کدو؟",
        options: [
          { label: "آفتابگردان", replacement: input.replace(/تخمه/g, "تخمه آفتابگردان") },
          { label: "کدو", replacement: input.replace(/تخمه/g, "تخمه کدو") },
        ],
      };
    }
    const segments = splitAiSegments(input);
    const items = segments.map((segment) => {
      const preset = AI_LIBRARY.find((entry) => entry.keywords.some((keyword) => segment.includes(keyword))) || {
        id: "ai-generic",
        name: segment.replace(/خوردم|خورده‌ام|نوشیدم|زدم/g, "").trim() || "خوراک ثبت‌شده",
        category: "خوراک تخمینی",
        defaultUnit: "واحد",
        calories: 120,
        protein: 4,
        carbs: 12,
        fat: 5,
        assumption: "نوع و مقدار دقیق از متن به‌صورت تقریبی برداشت شد",
        confidence: "low",
      };
      return buildAiDraft(preset, segment);
    });
    return {
      status: "success",
      items,
      lowConfidence: items.some((item) => item.confidence === "low"),
    };
  }

  function todayIso() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function readSavedFoods() {
    return readStorage(STORAGE_KEYS.savedFoods, []).map((item) => ({ ...item, kind: item.kind || "saved" }));
  }

  function readCustomFoods() {
    return readStorage(STORAGE_KEYS.customFoods, []).map((item) => ({ ...item, kind: item.kind || "custom" }));
  }

  function readComboMeals() {
    return readStorage(STORAGE_KEYS.comboMeals, []).map((item) => ({ ...item, kind: "combo" }));
  }

  function readRecentSearches() {
    return readStorage(STORAGE_KEYS.recentSearches, []);
  }

  function readRecentFoods() {
    const items = readStorage(STORAGE_KEYS.recentFoods, DEFAULT_RECENT);
    return items.length ? items : DEFAULT_RECENT;
  }

  function readFoodLogEntries() {
    return readStorage(STORAGE_KEYS.foodLogEntries, []);
  }

  function writeFoodLogEntry(entry) {
    const items = readFoodLogEntries();
    const next = [entry, ...items.filter((item) => item.id !== entry.id)];
    writeStorage(STORAGE_KEYS.foodLogEntries, next);
  }

  function allFoods() {
    return [...DEFAULT_FOODS.map((item) => ({ ...item, kind: item.kind || "saved", source: "catalog" })), ...readSavedFoods(), ...readCustomFoods()];
  }

  function isSaved(foodId) {
    return readSavedFoods().some((item) => item.id === foodId);
  }

  function toggleSaved(food) {
    const current = readSavedFoods();
    const exists = current.some((item) => item.id === food.id);
    const next = exists
      ? current.filter((item) => item.id !== food.id)
      : [{ ...food, kind: food.kind || "saved", savedAt: new Date().toISOString() }, ...current];
    writeStorage(STORAGE_KEYS.savedFoods, next);
    return !exists;
  }

  function recordRecentSearch(query) {
    const normalized = String(query || "").trim();
    if (!normalized) return;
    const items = readRecentSearches().filter((item) => item !== normalized);
    items.unshift(normalized);
    writeStorage(STORAGE_KEYS.recentSearches, items.slice(0, 6));
  }

  function recordRecentFood(food, meal) {
    const entry = { ...food, lastMeal: meal, lastUsedAt: new Date().toISOString(), usageCount: Number(food.usageCount || 0) + 1 };
    const items = readRecentFoods().filter((item) => item.id !== food.id);
    items.unshift(entry);
    writeStorage(STORAGE_KEYS.recentFoods, items.slice(0, 8));
  }

  function updateFoodUsage(foodId, meal) {
    const touchList = (items) => items.map((item) => item.id === foodId ? { ...item, lastMeal: meal, lastUsedAt: new Date().toISOString(), usageCount: Number(item.usageCount || 0) + 1 } : item);
    writeStorage(STORAGE_KEYS.savedFoods, touchList(readSavedFoods()));
    writeStorage(STORAGE_KEYS.customFoods, touchList(readCustomFoods()));
    writeStorage(STORAGE_KEYS.comboMeals, touchList(readComboMeals()));
  }

  function stateLabel(type, controller) {
    return type === "detail" ? "افزودن به " + MEAL_NAMES[controller.state.meal] : "جست‌وجوی خوراک";
  }

  function createDialogShell() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <dialog class="food-flow-dialog" aria-label="جریان ثبت خوراک">
        <div class="food-flow-panel food-flow-panel--wide app-modal-shell">
          <div class="food-flow-panel__header app-modal-header"></div>
          <div class="food-flow-panel__body app-modal-body"></div>
          <div class="food-flow-panel__footer app-modal-footer"></div>
        </div>
      </dialog>
      <dialog class="food-flow-confirm-dialog" aria-label="تأیید بستن">
        <div class="food-flow-confirm">
          <div>
            <strong>تغییرات بررسی‌نشده باقی می‌ماند</strong>
            <p class="food-flow-note">اگر برگردی، مقدار یا یادداشتی که تنظیم کرده‌ای از بین می‌رود.</p>
          </div>
          <div class="food-flow-confirm__actions">
            <button class="button button--secondary" type="button" data-ff-confirm-cancel>ماندن در صفحه</button>
            <button class="button button--primary" type="button" data-ff-confirm-close>بستن و خروج</button>
          </div>
        </div>
      </dialog>
    `;
    return {
      dialog: wrapper.children[0],
      confirmDialog: wrapper.children[1],
    };
  }

  function createController(options) {
    const { dialog, confirmDialog } = createDialogShell();
    document.body.append(dialog, confirmDialog);

    const controller = {
      options,
      dialog,
      confirmDialog,
      state: {
        step: options.initialStep || "search",
        meal: options.initialMeal || "lunch",
        commitMode: "log",
        flowTab: "search",
        query: "",
        tab: "all",
        searchScrollTop: 0,
        selectedFood: null,
        unitIndex: 0,
        quantity: 1,
        note: "",
        date: todayIso(),
        aiInput: "",
        aiStatus: "idle",
        aiItems: [],
        aiQuestion: null,
        aiOptions: [],
      },
      opener: null,
      pickerCallback: null,
      dirtyBaseline: "",
      isOpen: false,
    };

    function setBodyLock(locked) {
      document.documentElement.style.overflow = locked ? "hidden" : "";
      document.body.style.overflow = locked ? "hidden" : "";
    }

    function panelNodes() {
      return {
        header: $(".food-flow-panel__header", dialog),
        body: $(".food-flow-panel__body", dialog),
        footer: $(".food-flow-panel__footer", dialog),
      };
    }

    function getLaunchContext() {
      return typeof options.getLaunchContext === "function" ? (options.getLaunchContext() || {}) : {};
    }

    function openWithStep(step, payload = {}) {
      controller.state.step = step;
      Object.assign(controller.state, payload);
      controller.isOpen = true;
      dialog.classList.toggle("food-flow-dialog--side", window.innerWidth >= 961);
      if (!dialog.open) dialog.showModal();
      setBodyLock(true);
      render();
    }

    function mealLabel(meal) {
      return MEAL_NAMES[meal] || "سایر";
    }

    function searchResults() {
      const query = controller.state.query.trim().toLocaleLowerCase("fa");
      const base = controller.state.flowTab === "saved"
        ? [...readSavedFoods(), ...readCustomFoods()]
        : controller.state.tab === "recent"
          ? readRecentFoods()
          : controller.state.tab === "saved"
            ? [...readSavedFoods(), ...readCustomFoods()]
            : allFoods();
      if (!query) return base;
      return base.filter((food) => [food.name, food.category, food.ingredients, food.note].filter(Boolean).join(" ").toLocaleLowerCase("fa").includes(query));
    }

    function overlayTabsHtml() {
      return `
        <div class="food-flow-mode-tabs" role="tablist" aria-label="روش افزودن خوراک">
          ${OVERLAY_FLOW_TABS.map((tab) => `
            <button type="button" role="tab" aria-selected="${String(controller.state.flowTab === tab.key)}" data-ff-flow-tab="${tab.key}">
              ${tab.label}
            </button>
          `).join("")}
        </div>
      `;
    }

    function searchViewHtml() {
      const results = searchResults();
      const query = controller.state.query.trim();
      const showPreload = !query && controller.state.tab === "all" && controller.state.flowTab === "search";
      const showError = query === "خطا";
      const showLoading = controller.state.loading;
      const showEmpty = !showPreload && !showError && !showLoading && !results.length;
      return `
        <div class="food-flow-view">
          <section class="app-modal-section">
            <div class="app-modal-section__heading">
              <h3>روش افزودن خوراک</h3>
              <p>روش مناسب را انتخاب کن و بعد از بررسی نهایی آن را به ثبت امروز اضافه کن.</p>
            </div>
            ${overlayTabsHtml()}
          </section>
          <section class="app-modal-section">
            <div class="app-modal-section__heading">
              <h3>جست‌وجو</h3>
              <p>${controller.state.flowTab === "saved" ? "فقط خوراک‌های ذخیره‌شده و سفارشی خودت را می‌بینی." : "خوراک را جست‌وجو کن یا از فیلترهای سریع برای یافتن آن استفاده کن."}</p>
            </div>
            <div class="food-flow-search">
              <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-search" /></svg>
              <input id="food-flow-search-input" type="search" placeholder="${controller.state.flowTab === "saved" ? "در خوراک‌های ذخیره‌شده جست‌وجو کن" : "نام غذا یا محصول را جست‌وجو کن"}" value="${controller.state.query}" autocomplete="off" />
              <button class="food-flow-ghost-button" type="button" data-ff-clear-search>پاک‌کردن</button>
            </div>
            <div class="food-flow-inline-actions">
              ${controller.state.flowTab === "search" ? `<div class="food-flow-tabbar" role="tablist" aria-label="فیلتر جست‌وجو">
                ${["all", "recent", "saved"].map((tab) => `<button type="button" role="tab" aria-selected="${String(controller.state.tab === tab)}" data-ff-tab="${tab}">${tab === "all" ? "همه" : tab === "recent" ? "اخیر" : "ذخیره‌شده‌ها"}</button>`).join("")}
              </div>` : `<p class="food-flow-note">این فهرست فقط خوراک‌های ذخیره‌شده و سفارشی تو را نشان می‌دهد.</p>`}
              <a class="food-flow-link" href="saved-foods-botanical.html" data-ff-manage-saved>مدیریت همه خوراک‌های ذخیره‌شده</a>
            </div>
          </section>
          <section class="app-modal-section">
            <div class="app-modal-section__heading">
              <h3>${showPreload ? "پیشنهادهای سریع" : query ? "نتایج جست‌وجو" : "محتوا"}</h3>
              <p>${showPreload ? "می‌توانی از جست‌وجوهای اخیر یا دسته‌بندی‌های پرکاربرد شروع کنی." : "محتوای این بخش با توجه به جست‌وجو و وضعیت فعلی تغییر می‌کند."}</p>
            </div>
            ${showLoading ? `
              <div class="food-flow-state">
                <div class="food-flow-loading-line"></div>
                <div class="food-flow-loading-line"></div>
                <div class="food-flow-loading-line"></div>
              </div>` : ""}
            ${showError ? `
              <div class="food-flow-state">
                <h3>دریافت اطلاعات کامل نشد</h3>
                <p>یک‌بار دیگر تلاش کن یا از تب ذخیره‌شده‌ها استفاده کن.</p>
                <div class="food-flow-state__actions">
                  <button class="button button--primary" type="button" data-ff-retry>تلاش دوباره</button>
                </div>
              </div>` : ""}
            ${showPreload ? `
              <div class="food-flow-list-section">
                <div class="app-modal-section__heading">
                  <h3>جست‌وجوهای اخیر</h3>
                  <p>اگر قبلاً غذایی را جست‌وجو کرده باشی، اینجا سریع‌تر پیدایش می‌کنی.</p>
                </div>
                <div class="food-flow-recent">
                  ${(readRecentSearches().length ? readRecentSearches() : ["ماست", "سیب", "مرغ"]).map((item) => `<button class="food-flow-chip" type="button" data-ff-recent="${item}">${item}</button>`).join("")}
                </div>
              </div>
              <div class="food-flow-list-section">
                <div class="app-modal-section__heading">
                  <h3>دسته‌بندی‌های پرکاربرد</h3>
                </div>
                <div class="food-flow-categories">
                  ${CATEGORIES.map((category) => `<button class="food-flow-chip" type="button" data-ff-category="${category}">${category}</button>`).join("")}
                </div>
              </div>` : ""}
            ${showEmpty ? `
              <div class="food-flow-state">
                <h3>نتیجه‌ای پیدا نشد</h3>
                <p>نام دیگری را امتحان کن یا از خوراک‌های ذخیره‌شده استفاده کن.</p>
                <div class="food-flow-state__actions">
                  <button class="button button--primary" type="button" data-ff-clear-search>پاک‌کردن جست‌وجو</button>
                </div>
              </div>` : ""}
            ${!showPreload && !showError && !showLoading && !showEmpty ? `
              <div class="food-flow-list">
                ${results.map((food) => `
                  <article class="food-flow-search-result">
                    <div>
                      <strong>${food.name}</strong>
                      <small>${food.reference || "۱ واحد"} · ${food.category || "خوراک"}</small>
                      <div class="food-flow-search-result__support">
                        <span><bdi dir="ltr">${formatNumber(food.calories || 0)}</bdi> kcal</span>
                        <div class="food-flow-search-result__macros">
                          <span>پروتئین ${formatNumber(food.protein || 0)}</span>
                          <span>کربوهیدرات ${formatNumber(food.carbs || 0)}</span>
                          <span>چربی ${formatNumber(food.fat || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div class="food-flow-search-result__actions">
                      <button class="food-flow-save ${isSaved(food.id) ? "is-saved" : ""}" type="button" data-ff-save="${food.id}" aria-label="${isSaved(food.id) ? "حذف از ذخیره‌شده‌ها" : "ذخیره‌کردن خوراک"}">
                        <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-star" /></svg>
                      </button>
                      <button class="button button--primary button--sm" type="button" data-ff-select="${food.id}">انتخاب</button>
                    </div>
                  </article>`).join("")}
              </div>` : ""}
          </section>
        </div>
      `;
    }

    function aiTotals() {
      return controller.state.aiItems.reduce((acc, item) => {
        acc.calories += Number(item.calories || 0);
        acc.protein += Number(item.protein || 0);
        acc.carbs += Number(item.carbs || 0);
        acc.fat += Number(item.fat || 0);
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    function syncAiSummary() {
      if (!dialog.open || controller.state.flowTab !== "ai" || controller.state.aiStatus !== "success") return;
      const totals = aiTotals();
      const panel = $(".food-flow-ai-summary", dialog);
      if (!panel) return;
      const summaryMap = {
        calories: formatNumber(totals.calories),
        protein: formatNumber(totals.protein),
        carbs: formatNumber(totals.carbs),
        fat: formatNumber(totals.fat),
      };
      Object.entries(summaryMap).forEach(([key, value]) => {
        const node = panel.querySelector(`[data-ai-total="${key}"]`);
        if (node) node.textContent = value;
      });
    }

    function aiViewHtml() {
      const totals = aiTotals();
      const lowConfidence = controller.state.aiItems.some((item) => item.confidence === "low");
      return `
        <div class="food-flow-view">
          <section class="app-modal-section">
            <div class="app-modal-section__heading">
              <h3>روش افزودن خوراک</h3>
              <p>روش مناسب را انتخاب کن و بعد از بررسی نهایی آن را به ثبت امروز اضافه کن.</p>
            </div>
            ${overlayTabsHtml()}
          </section>
          <section class="app-modal-section food-flow-ai-intro">
            <div class="app-modal-section__heading">
              <h3>چی خوردی؟</h3>
              <p>با زبان خودت بنویس؛ مقدار و ارزش غذایی را تخمین می‌زنیم و قبل از ثبت می‌توانی اصلاحشان کنی.</p>
            </div>
            <label class="field food-flow-ai-field">
              <span class="field__label">شرح خوراک</span>
              <textarea id="food-flow-ai-input" rows="4" placeholder="مثلاً یه مشت تخمه خوردم و یک لیوان چای شیرین نوشیدم">${controller.state.aiInput}</textarea>
            </label>
            <div class="food-flow-chip-row">
              ${AI_SUGGESTIONS.map((item) => `<button class="food-flow-chip" type="button" data-ff-ai-suggest="${item}">${item}</button>`).join("")}
            </div>
            <button class="button button--primary" type="button" data-ff-ai-submit>تخمین بزن</button>
          </section>
          ${controller.state.aiStatus === "loading" ? `
            <section class="app-modal-section">
              <div class="food-flow-state">
                <div class="food-flow-loading-line"></div>
                <div class="food-flow-loading-line"></div>
                <div class="food-flow-loading-line"></div>
              </div>
            </section>` : ""}
          ${controller.state.aiStatus === "clarify" ? `
            <section class="app-modal-section">
              <div class="food-flow-state">
                <h3>${controller.state.aiQuestion || "برای ادامه یک مورد را مشخص کن"}</h3>
                <div class="food-flow-state__actions">
                  ${(controller.state.aiOptions || []).map((option, index) => `<button class="button button--secondary" type="button" data-ff-ai-option="${index}">${option.label}</button>`).join("")}
                </div>
              </div>
            </section>` : ""}
          ${controller.state.aiStatus === "error" ? `
            <section class="app-modal-section">
              <div class="food-flow-state">
                <h3>تخمین انجام نشد</h3>
                <p>${controller.state.aiQuestion || "فعلاً مشکلی در پردازش متن پیش آمده است."}</p>
                <div class="food-flow-state__actions">
                  <button class="button button--primary" type="button" data-ff-ai-retry>تلاش مجدد</button>
                </div>
              </div>
            </section>` : ""}
          ${controller.state.aiStatus === "success" ? `
            <section class="app-modal-section">
              <div class="food-flow-ai-summary">
                <div>
                  <strong>نتیجه تخمینی</strong>
                  <p class="food-flow-note">${lowConfidence ? "برخی موارد تقریبی هستند و قبل از ثبت باید بررسی شوند." : "همه‌ی موارد قبل از ثبت نهایی قابل ویرایش هستند."}</p>
                </div>
                <div class="food-flow-search-result__macros">
                  <span>کالری <bdi data-ai-total="calories">${formatNumber(totals.calories)}</bdi></span>
                  <span>پروتئین <bdi data-ai-total="protein">${formatNumber(totals.protein)}</bdi></span>
                  <span>کربوهیدرات <bdi data-ai-total="carbs">${formatNumber(totals.carbs)}</bdi></span>
                  <span>چربی <bdi data-ai-total="fat">${formatNumber(totals.fat)}</bdi></span>
                </div>
              </div>
            </section>
            <section class="app-modal-section">
              <div class="app-modal-section__heading">
                <h3>خوراک‌های تشخیص‌داده‌شده</h3>
                <p>هر مورد را قبل از ثبت نهایی می‌توانی اصلاح کنی.</p>
              </div>
              <div class="food-flow-ai-list">
                ${controller.state.aiItems.map((item, index) => `
                  <article class="food-flow-ai-card">
                    <div class="food-flow-ai-card__head">
                      <div>
                        <strong>${item.name}</strong>
                        <div class="food-flow-chip-row">
                          <span class="food-flow-ai-badge ${item.confidence === "low" ? "is-low" : ""}">${item.confidence === "low" ? "تخمین تقریبی" : "تخمینی"}</span>
                        </div>
                      </div>
                      <p class="food-flow-note">${item.assumption || ""}</p>
                    </div>
                    <div class="food-flow-ai-card__grid">
                      <label class="field"><span class="field__label">نوع خوراک</span><input data-ff-ai-name="${index}" value="${item.name}" /></label>
                      <label class="field"><span class="field__label">مقدار</span><input data-ff-ai-quantity="${index}" type="number" min="0.5" step="0.5" value="${item.quantity}" /></label>
                      <label class="field"><span class="field__label">واحد</span><input data-ff-ai-unit="${index}" value="${item.unit}" /></label>
                      <label class="field"><span class="field__label">کالری</span><input data-ff-ai-calories="${index}" type="number" min="0" value="${item.calories}" /></label>
                      <label class="field"><span class="field__label">پروتئین</span><input data-ff-ai-protein="${index}" type="number" min="0" step="0.1" value="${item.protein}" /></label>
                      <label class="field"><span class="field__label">کربوهیدرات</span><input data-ff-ai-carbs="${index}" type="number" min="0" step="0.1" value="${item.carbs}" /></label>
                      <label class="field"><span class="field__label">چربی</span><input data-ff-ai-fat="${index}" type="number" min="0" step="0.1" value="${item.fat}" /></label>
                    </div>
                  </article>`).join("")}
              </div>
            </section>
            <section class="app-modal-section food-flow-detail-card">
              <div class="app-modal-section__heading">
                <h3>تنظیمات ثبت</h3>
                <p>وعده، تاریخ و یادداشت را قبل از تأیید نهایی مرور کن.</p>
              </div>
              <div class="food-flow-detail-inline">
                <label class="field">
                  <span class="field__label">وعده</span>
                  <div class="food-flow-meal-row">
                    ${Object.entries(MEAL_NAMES).map(([key, label]) => `<button class="food-flow-detail-chip ${controller.state.meal === key ? "is-active" : ""}" type="button" data-ff-meal="${key}">${label}</button>`).join("")}
                  </div>
                </label>
                <label class="field">
                  <span class="field__label">تاریخ</span>
                  <input id="food-flow-date-input" type="date" value="${controller.state.date}" />
                </label>
              </div>
              <label class="field">
                <span class="field__label">یادداشت</span>
                <input id="food-flow-note-input" type="text" value="${controller.state.note}" placeholder="مثلاً با چای کم‌رنگ یا بدون روغن" />
              </label>
            </section>` : ""}
        </div>
      `;
    }

    function detailFood() {
      return controller.state.selectedFood || DEFAULT_FOODS[1];
    }

    function detailSnapshot() {
      return JSON.stringify({
        unitIndex: controller.state.unitIndex,
        quantity: controller.state.quantity,
        meal: controller.state.meal,
        note: controller.state.note,
        date: controller.state.date,
        commitMode: controller.state.commitMode,
      });
    }

    function currentUnit() {
      const food = detailFood();
      return food.units?.[controller.state.unitIndex] || { label: food.reference || "۱ واحد", multiplier: 1 };
    }

    function currentFactor() {
      return (currentUnit().multiplier || 1) * controller.state.quantity;
    }

    function detailViewHtml() {
      const food = detailFood();
      const factor = currentFactor();
      const calories = Math.round((food.calories || 0) * factor);
      const protein = (food.protein || 0) * factor;
      const carbs = (food.carbs || 0) * factor;
      const fat = (food.fat || 0) * factor;
      const fiber = (food.fiber || 0) * factor;
      const sugar = (food.sugar || 0) * factor;
      const sodium = Math.round((food.sodium || 0) * factor);
      const ingredients = String(food.ingredients || "").split("،").map((item) => item.trim()).filter(Boolean);
      return `
        <div class="food-flow-detail-grid">
          <section class="food-flow-detail-card app-modal-section">
            <div class="food-flow-detail-summary">
              <div class="food-flow-detail-summary__head">
                <div>
                  <span class="food-flow-detail-kicker">${food.category || "خوراک منتخب"}</span>
                  <h3>${food.name}</h3>
                  <p class="food-flow-note">مقدار مرجع: ${food.reference || "۱ واحد"}</p>
                </div>
                <button class="food-flow-save ${isSaved(food.id) ? "is-saved" : ""}" type="button" data-ff-save="${food.id}" aria-label="${isSaved(food.id) ? "حذف از ذخیره‌شده‌ها" : "ذخیره‌کردن خوراک"}">
                  <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-star" /></svg>
                </button>
              </div>
              <div class="food-flow-detail-stats">
                <article class="food-flow-detail-stat"><span>کالری</span><strong>${formatNumber(calories)} kcal</strong></article>
                <article class="food-flow-detail-stat"><span>پروتئین</span><strong>${formatNumber(protein)} گرم</strong></article>
                <article class="food-flow-detail-stat"><span>کربوهیدرات</span><strong>${formatNumber(carbs)} گرم</strong></article>
                <article class="food-flow-detail-stat"><span>چربی</span><strong>${formatNumber(fat)} گرم</strong></article>
              </div>
            </div>
            <div class="food-flow-detail-fields">
              <div>
                <span class="field__label">واحد</span>
                <div class="food-flow-chip-row">
                  ${(food.units || [{ label: food.reference || "۱ واحد", multiplier: 1 }]).map((unit, index) => `<button class="food-flow-detail-chip ${index === controller.state.unitIndex ? "is-active" : ""}" type="button" data-ff-unit="${index}">${unit.label}</button>`).join("")}
                </div>
              </div>
              <div>
                <span class="field__label">مقدار</span>
                <div class="food-flow-quantity">
                  <button class="food-flow-stepper" type="button" data-ff-qty-inc>+</button>
                  <div class="food-flow-quantity-display">
                    <strong>${formatNumber(controller.state.quantity)}</strong>
                    <small>${formatNumber(controller.state.quantity)} ${currentUnit().label}</small>
                  </div>
                  <button class="food-flow-stepper" type="button" data-ff-qty-dec>−</button>
                </div>
              </div>
              <div>
                <span class="field__label">وعده</span>
                <div class="food-flow-meal-row">
                  ${Object.entries(MEAL_NAMES).map(([key, label]) => `<button class="food-flow-detail-chip ${controller.state.meal === key ? "is-active" : ""}" type="button" data-ff-meal="${key}">${label}</button>`).join("")}
                </div>
              </div>
              <div class="food-flow-detail-inline">
                <label class="field">
                  <span class="field__label">تاریخ ثبت</span>
                  <input id="food-flow-date-input" type="date" value="${controller.state.date}" />
                </label>
                <label class="field">
                  <span class="field__label">یادداشت اختیاری</span>
                  <input id="food-flow-note-input" type="text" value="${controller.state.note}" placeholder="مثلاً با سالاد و بدون نوشابه" />
                </label>
              </div>
            </div>
          </section>
          <section class="food-flow-detail-card app-modal-section">
            <div class="app-modal-section__heading">
              <h3>خلاصه نهایی این ثبت</h3>
              <p class="food-flow-note">ثبت واقعی فقط پس از فشردن دکمه نهایی انجام می‌شود.</p>
            </div>
            <div class="food-flow-detail-stats">
              <article class="food-flow-detail-stat"><span>کالری نهایی</span><strong>${formatNumber(calories)} kcal</strong></article>
              <article class="food-flow-detail-stat"><span>پروتئین</span><strong>${formatNumber(protein)} گرم</strong></article>
              <article class="food-flow-detail-stat"><span>کربوهیدرات</span><strong>${formatNumber(carbs)} گرم</strong></article>
              <article class="food-flow-detail-stat"><span>چربی</span><strong>${formatNumber(fat)} گرم</strong></article>
            </div>
            <details class="food-flow-accordion">
              <summary><span>اطلاعات تکمیلی خوراک</span><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-chevron-down" /></svg></summary>
              <div class="food-flow-accordion__body">
                <dl class="food-flow-accordion__stats">
                  <div><dt>فیبر</dt><dd>${formatNumber(fiber)} گرم</dd></div>
                  <div><dt>قند</dt><dd>${formatNumber(sugar)} گرم</dd></div>
                  <div><dt>سدیم</dt><dd>${formatNumber(sodium)} میلی‌گرم</dd></div>
                </dl>
                <ul class="food-flow-ingredient-list">${ingredients.map((item) => `<li>${item}</li>`).join("")}</ul>
              </div>
            </details>
          </section>
        </div>
      `;
    }

    function render() {
      const { header, body, footer } = panelNodes();
      if (controller.state.step === "search") {
        header.innerHTML = `
          <div>
            <h2>${stateLabel("detail", controller)}</h2>
            <p>${controller.state.flowTab === "ai" ? "توضیح طبیعی‌ات را به تخمین قابل‌بررسی تبدیل کن و بعد از تأیید ثبتش کن." : "بدون خروج از صفحه، خوراک مناسب را پیدا کن و بعد مقدار را بررسی کن."}</p>
          </div>
          <div class="food-flow-header-actions">
            <button class="button button--quiet button--sm" type="button" data-ff-close>بستن</button>
          </div>`;
        body.innerHTML = controller.state.flowTab === "ai" ? aiViewHtml() : searchViewHtml();
        footer.innerHTML = controller.state.flowTab === "ai" && controller.state.aiStatus === "success" && controller.state.aiItems.length
          ? `
            <div class="app-modal-footer__meta">خوراک فقط پس از تأیید نهایی ثبت می‌شود.</div>
            <div class="app-modal-footer__actions">
              <button class="button button--secondary" type="button" data-ff-close>انصراف</button>
              <button class="button button--primary" type="button" data-ff-submit>تأیید و افزودن به ثبت امروز</button>
              <button class="button button--secondary" type="button" data-ff-ai-retry>تلاش مجدد</button>
            </div>
          `
          : `
            <div class="app-modal-footer__meta">خوراک تا قبل از تأیید نهایی به ثبت واقعی امروز اضافه نمی‌شود.</div>
            <div class="app-modal-footer__actions">
              <button class="button button--secondary" type="button" data-ff-close>انصراف</button>
            </div>`;
        window.requestAnimationFrame(() => {
          const input = controller.state.flowTab === "ai" ? $("#food-flow-ai-input", dialog) : $("#food-flow-search-input", dialog);
          if (input && document.activeElement !== input) input.focus({ preventScroll: true });
          $(".food-flow-panel__body", dialog).scrollTop = controller.state.flowTab === "ai" ? 0 : (controller.state.searchScrollTop || 0);
        });
      } else {
        header.innerHTML = `
          <div>
            <h2>${stateLabel("detail", controller)}</h2>
            <p>قبل از ثبت نهایی، مقدار، واحد، وعده و تاریخ را بررسی کن.</p>
          </div>
          <div class="food-flow-header-actions">
            <button class="button button--quiet button--sm" type="button" data-ff-back>بازگشت</button>
            <button class="button button--quiet button--sm" type="button" data-ff-close>بستن</button>
          </div>`;
        body.innerHTML = detailViewHtml();
        footer.innerHTML = `
          <div class="app-modal-footer__meta">خوراک فقط پس از تأیید نهایی ثبت می‌شود.</div>
          <div class="app-modal-footer__actions">
            <button class="button button--secondary" type="button" data-ff-close>انصراف</button>
            <button class="button button--primary" type="button" data-ff-submit>افزودن به ${mealLabel(controller.state.meal)}</button>
          </div>`;
        controller.dirtyBaseline ||= detailSnapshot();
      }
    }

    function requestClose() {
      const isDirty = controller.state.step === "detail" && detailSnapshot() !== controller.dirtyBaseline;
      if (isDirty) {
        if (!confirmDialog.open) confirmDialog.showModal();
        return;
      }
      closeNow();
    }

    function closeNow() {
      controller.isOpen = false;
      controller.state.step = controller.options.initialStep || "search";
      controller.state.commitMode = "log";
      controller.state.flowTab = "search";
      controller.state.query = "";
      controller.state.tab = "all";
      controller.state.loading = false;
      controller.state.searchScrollTop = 0;
      controller.state.selectedFood = null;
      controller.state.unitIndex = 0;
      controller.state.quantity = 1;
      controller.state.note = "";
      controller.state.date = todayIso();
      controller.state.aiInput = "";
      controller.state.aiStatus = "idle";
      controller.state.aiItems = [];
      controller.state.aiQuestion = null;
      controller.state.aiOptions = [];
      controller.pickerCallback = null;
      controller.dirtyBaseline = "";
      if (confirmDialog.open) confirmDialog.close();
      if (dialog.open) dialog.close();
      setBodyLock(false);
      if (controller.opener && typeof controller.opener.focus === "function") {
        controller.opener.focus();
      }
    }

    function openSearch(meal, opener, extra = {}) {
      const context = getLaunchContext();
      controller.opener = opener || document.activeElement;
      controller.state.meal = meal || context.meal || "lunch";
      controller.state.commitMode = extra.commitMode || "log";
      controller.state.flowTab = extra.flowTab || "search";
      controller.state.query = extra.query || "";
      controller.state.tab = controller.state.flowTab === "saved" ? "saved" : "all";
      controller.state.selectedFood = null;
      controller.state.unitIndex = 0;
      controller.state.quantity = 1;
      controller.state.note = "";
      controller.state.date = context.date || todayIso();
      controller.state.aiInput = extra.aiInput || "";
      controller.state.aiStatus = "idle";
      controller.state.aiItems = [];
      controller.state.aiQuestion = null;
      controller.state.aiOptions = [];
      controller.pickerCallback = typeof extra.onPick === "function" ? extra.onPick : null;
      controller.dirtyBaseline = "";
      openWithStep("search");
    }

    function openDetail(food, opener, meal, extra = {}) {
      const context = getLaunchContext();
      controller.opener = opener || document.activeElement;
      controller.state.selectedFood = food;
      controller.state.meal = meal || controller.state.meal || context.meal || "lunch";
      controller.state.commitMode = extra.commitMode || controller.state.commitMode || "log";
      controller.state.unitIndex = 0;
      controller.state.quantity = Number(food.defaultQuantity || 1);
      controller.state.note = food.note || "";
      controller.state.date = context.date || todayIso();
      controller.pickerCallback = typeof extra.onPick === "function" ? extra.onPick : controller.pickerCallback;
      controller.dirtyBaseline = "";
      openWithStep("detail");
    }

    function selectFoodById(foodId) {
      const food = allFoods().find((item) => item.id === foodId) || readRecentFoods().find((item) => item.id === foodId);
      if (!food) return;
      controller.state.searchScrollTop = $(".food-flow-panel__body", dialog)?.scrollTop || 0;
      openDetail(food, controller.opener, controller.state.meal, {
        commitMode: controller.state.commitMode,
        onPick: controller.pickerCallback,
      });
    }

    function createEntry() {
      const food = detailFood();
      const factor = currentFactor();
      return {
        id: `food-log-entry-${Date.now()}`,
        foodId: food.id,
        meal: controller.state.meal,
        name: food.name,
        quantity: formatNumber(controller.state.quantity),
        unit: currentUnit().label,
        calories: String(Math.round((food.calories || 0) * factor)),
        note: controller.state.note.trim(),
        date: controller.state.date,
        protein: Number(((food.protein || 0) * factor).toFixed(1)),
        carbs: Number(((food.carbs || 0) * factor).toFixed(1)),
        fat: Number(((food.fat || 0) * factor).toFixed(1)),
      };
    }

    function createPickerEntryFromDraft(item) {
      return {
        id: item.id || `food-picker-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        foodId: item.foodId || item.id,
        meal: controller.state.meal,
        name: item.name,
        quantity: formatNumber(item.quantity || 1),
        unit: item.unit || "واحد",
        calories: String(Math.round(Number(item.calories || 0))),
        note: controller.state.note.trim(),
        date: controller.state.date,
        protein: Number(item.protein || 0),
        carbs: Number(item.carbs || 0),
        fat: Number(item.fat || 0),
      };
    }

    function genericToast(message) {
      const page = document.body.dataset.page;
      if (page === "saved-foods") {
        const toast = $("#saved-foods-toast");
        const messageNode = $("#saved-foods-toast-message");
        if (toast && messageNode) {
          messageNode.textContent = message;
          toast.hidden = false;
          return;
        }
      }
      if (page === "food-log" && window.AvocadoFoodLogApi?.showToast) {
        window.AvocadoFoodLogApi.showToast(message);
      }
    }

    function commitEntry() {
      const entry = createEntry();
      if (controller.state.commitMode === "picker" && controller.pickerCallback) {
        controller.pickerCallback([entry], controller);
        closeNow();
        return;
      }
      writeFoodLogEntry(entry);
      recordRecentFood(detailFood(), controller.state.meal);
      updateFoodUsage(detailFood().id, controller.state.meal);
      if (typeof options.onCommit === "function") {
        options.onCommit(entry, controller);
      } else {
        genericToast(`خوراک با موفقیت به ${mealLabel(controller.state.meal)} اضافه شد.`);
      }
      closeNow();
    }

    function commitAiEntries() {
      const entries = controller.state.aiItems.map((item) => createPickerEntryFromDraft({
        ...item,
        id: `food-log-entry-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      }));
      if (controller.state.commitMode === "picker" && controller.pickerCallback) {
        controller.pickerCallback(entries, controller);
        closeNow();
        return;
      }
      entries.forEach((entry) => writeFoodLogEntry(entry));
      controller.state.aiItems.forEach((item) => {
        recordRecentFood(item, controller.state.meal);
        if (item.foodId) updateFoodUsage(item.foodId, controller.state.meal);
      });
      if (typeof options.onCommitBulk === "function") {
        options.onCommitBulk(entries, controller);
      } else if (typeof options.onCommit === "function" && entries.length === 1) {
        options.onCommit(entries[0], controller);
      } else {
        genericToast(`خوراک با موفقیت به ${mealLabel(controller.state.meal)} اضافه شد.`);
      }
      closeNow();
    }

    function submitAiEstimate() {
      const result = estimateAiText(controller.state.aiInput);
      controller.state.aiStatus = "loading";
      render();
      window.setTimeout(() => {
        if (result.status === "clarify") {
          controller.state.aiStatus = "clarify";
          controller.state.aiQuestion = result.question;
          controller.state.aiOptions = result.options;
        } else if (result.status === "error") {
          controller.state.aiStatus = "error";
          controller.state.aiQuestion = result.message;
        } else if (result.status === "success") {
          controller.state.aiStatus = "success";
          controller.state.aiItems = result.items;
          controller.state.aiQuestion = null;
          controller.state.aiOptions = [];
        } else {
          controller.state.aiStatus = "idle";
        }
        render();
      }, 320);
    }

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      requestClose();
    });

    dialog.addEventListener("click", (event) => {
      const target = event.target.closest("[data-ff-close],[data-ff-back],[data-ff-tab],[data-ff-flow-tab],[data-ff-category],[data-ff-recent],[data-ff-select],[data-ff-save],[data-ff-clear-search],[data-ff-retry],[data-ff-unit],[data-ff-meal],[data-ff-qty-inc],[data-ff-qty-dec],[data-ff-submit],[data-ff-save-later],[data-ff-manage-saved],[data-ff-ai-suggest],[data-ff-ai-submit],[data-ff-ai-option],[data-ff-ai-retry]");
      if (!target) return;
      if (target.dataset.ffClose !== undefined) requestClose();
      if (target.dataset.ffBack !== undefined) {
        controller.state.step = "search";
        render();
      }
      if (target.dataset.ffFlowTab) {
        controller.state.flowTab = target.dataset.ffFlowTab;
        if (controller.state.flowTab === "saved") controller.state.tab = "saved";
        if (controller.state.flowTab === "search" && controller.state.tab === "saved") controller.state.tab = "all";
        render();
      }
      if (target.dataset.ffTab) {
        controller.state.tab = target.dataset.ffTab;
        render();
      }
      if (target.dataset.ffCategory) {
        controller.state.query = target.dataset.ffCategory;
        recordRecentSearch(controller.state.query);
        render();
      }
      if (target.dataset.ffRecent) {
        controller.state.query = target.dataset.ffRecent;
        recordRecentSearch(controller.state.query);
        render();
      }
      if (target.dataset.ffSelect) selectFoodById(target.dataset.ffSelect);
      if (target.dataset.ffSave) {
        const food = allFoods().find((item) => item.id === target.dataset.ffSave) || readRecentFoods().find((item) => item.id === target.dataset.ffSave);
        if (food) {
          toggleSaved(food);
          render();
        }
      }
      if (target.dataset.ffClearSearch !== undefined) {
        controller.state.query = "";
        controller.state.tab = "all";
        render();
      }
      if (target.dataset.ffRetry !== undefined) {
        controller.state.loading = false;
        render();
      }
      if (target.dataset.ffUnit) {
        controller.state.unitIndex = Number(target.dataset.ffUnit);
        render();
      }
      if (target.dataset.ffMeal) {
        controller.state.meal = target.dataset.ffMeal;
        render();
      }
      if (target.dataset.ffQtyInc !== undefined) {
        controller.state.quantity = Math.min(controller.state.quantity + 0.5, 20);
        render();
      }
      if (target.dataset.ffQtyDec !== undefined) {
        controller.state.quantity = Math.max(controller.state.quantity - 0.5, 0.5);
        render();
      }
      if (target.dataset.ffSubmit !== undefined) {
        if (controller.state.flowTab === "ai" && controller.state.aiStatus === "success" && controller.state.aiItems.length) {
          commitAiEntries();
        } else {
          commitEntry();
        }
      }
      if (target.dataset.ffSaveLater !== undefined) {
        const food = detailFood();
        toggleSaved({ ...food, note: controller.state.note, defaultQuantity: controller.state.quantity, defaultMeal: controller.state.meal });
        genericToast("خوراک برای بعد ذخیره شد.");
        render();
      }
      if (target.dataset.ffManageSaved !== undefined) {
        writeFlowContext({
          meal: controller.state.meal,
          date: controller.state.date,
          sourcePage: "food-log-botanical.html",
          fromFlow: true,
        });
        requestClose();
        window.location.href = "saved-foods-botanical.html";
      }
      if (target.dataset.ffAiSuggest) {
        controller.state.aiInput = target.dataset.ffAiSuggest;
        render();
      }
      if (target.dataset.ffAiSubmit !== undefined) submitAiEstimate();
      if (target.dataset.ffAiOption !== undefined) {
        const option = controller.state.aiOptions[Number(target.dataset.ffAiOption)];
        if (option?.replacement) {
          controller.state.aiInput = option.replacement;
          submitAiEstimate();
        }
      }
      if (target.dataset.ffAiRetry !== undefined) submitAiEstimate();
    });

    dialog.addEventListener("input", (event) => {
      const target = event.target;
      if (target.id === "food-flow-search-input") {
        controller.state.query = target.value;
        controller.state.loading = true;
        window.clearTimeout(controller.searchTimer);
        controller.searchTimer = window.setTimeout(() => {
          controller.state.loading = false;
          if (controller.state.query.trim()) recordRecentSearch(controller.state.query);
          render();
        }, 180);
      }
      if (target.id === "food-flow-ai-input") controller.state.aiInput = target.value;
      if (target.id === "food-flow-note-input") controller.state.note = target.value;
      if (target.id === "food-flow-date-input") controller.state.date = target.value;
      const aiField = ["Name", "Quantity", "Unit", "Calories", "Protein", "Carbs", "Fat"].find((suffix) => target.dataset[`ffAi${suffix}`] !== undefined);
      if (aiField) {
        const keyMap = {
          Name: "name",
          Quantity: "quantity",
          Unit: "unit",
          Calories: "calories",
          Protein: "protein",
          Carbs: "carbs",
          Fat: "fat",
        };
        const index = Number(target.dataset[`ffAi${aiField}`]);
        const key = keyMap[aiField];
        const value = key === "name" || key === "unit" ? target.value : Number(target.value || 0);
        controller.state.aiItems = controller.state.aiItems.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          if (key === "quantity") {
            const nextItem = refreshAiDraft(item, value);
            const root = target.closest(".food-flow-ai-card");
            if (root) {
              const nextValues = {
                calories: nextItem.calories,
                protein: nextItem.protein,
                carbs: nextItem.carbs,
                fat: nextItem.fat,
              };
              Object.entries(nextValues).forEach(([fieldKey, fieldValue]) => {
                const field = root.querySelector(`[data-ff-ai-${fieldKey}="${index}"]`);
                if (field) field.value = fieldValue;
              });
            }
            return nextItem;
          }
          if (key === "calories" || key === "protein" || key === "carbs" || key === "fat") {
            const quantity = Math.max(Number(item.quantity || 0), 0.5);
            const perUnitKey = `perUnit${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            return { ...item, [key]: value, [perUnitKey]: Number((value / quantity).toFixed(3)) };
          }
          return { ...item, [key]: value };
        });
        syncAiSummary();
      }
    });

    confirmDialog.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-ff-confirm-close]");
      const cancelButton = event.target.closest("[data-ff-confirm-cancel]");
      if (closeButton) closeNow();
      if (cancelButton) confirmDialog.close();
    });

    return { openSearch, openDetail, close: requestClose };
  }

  function mountFoodLogFlow() {
    const pageApi = window.AvocadoFoodLogApi;
    const controller = createController({
      initialStep: "search",
      initialMeal: "lunch",
      getLaunchContext: () => pageApi?.getFlowContext?.() || {},
      onCommit(entry) {
        if (pageApi?.appendLoggedFood) {
          pageApi.appendLoggedFood(entry);
        }
        if (pageApi?.showToast) {
          pageApi.showToast(`خوراک با موفقیت به ${MEAL_NAMES[entry.meal]} اضافه شد.`);
        }
      },
      onCommitBulk(entries) {
        entries.forEach((entry) => pageApi?.appendLoggedFood?.(entry));
        pageApi?.showToast?.(`خوراک با موفقیت به ${MEAL_NAMES[entries[0]?.meal || "lunch"]} اضافه شد.`);
      },
    });

    function openPicker(config = {}) {
      controller.openSearch(config.meal || "other", config.opener || document.activeElement, {
        flowTab: config.flowTab || "search",
        aiInput: config.aiInput || "",
        query: config.query || "",
        commitMode: "picker",
        onPick: config.onPick,
      });
    }

    document.addEventListener("click", (event) => {
      const savedFoodsTrigger = event.target.closest("[data-open-saved-foods]");
      if (savedFoodsTrigger) {
        event.preventDefault();
        event.stopImmediatePropagation();
        writeFlowContext(pageApi?.getFlowContext?.() || {
          meal: "lunch",
          date: todayIso(),
          sourcePage: "food-log-botanical.html",
          fromFlow: true,
        });
        window.location.href = "saved-foods-botanical.html";
        return;
      }
      const trigger = event.target.closest("[data-nutrition-open]");
      if (!trigger) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const meal = trigger.dataset.meal || "other";
      const source = trigger.dataset.source || "";
      if (source === "plan" && trigger.dataset.name) {
        controller.openDetail({
          id: `plan-food-${Date.now()}`,
          name: trigger.dataset.name,
          category: "برنامه غذایی",
          reference: `${trigger.dataset.quantity || "۱"} ${trigger.dataset.unit || "وعده"}`.trim(),
          calories: Number(trigger.dataset.calories || 0),
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          ingredients: trigger.dataset.note || "از برنامه غذایی امروز",
          units: [{ label: `${trigger.dataset.quantity || "۱"} ${trigger.dataset.unit || "وعده"}`.trim(), multiplier: 1 }],
        }, trigger, meal);
        return;
      }
      controller.openSearch(meal, trigger, { flowTab: trigger.dataset.flowTab || "search" });
    }, true);

    if (pageApi?.importStoredEntries) {
      pageApi.importStoredEntries(readFoodLogEntries());
    }

    return { openPicker, controller };
  }

  function mountSavedFoodsFlow() {
    const flowContext = readFlowContext();
    const controller = createController({
      initialStep: "detail",
      initialMeal: flowContext.meal || "lunch",
      getLaunchContext: () => readFlowContext(),
      onCommit(entry) {
        genericPageToast(`خوراک برای ${MEAL_NAMES[entry.meal]} امروز ثبت شد.`);
      },
      onCommitBulk(entries) {
        genericPageToast(`خوراک‌ها برای ${MEAL_NAMES[entries[0]?.meal || "lunch"]} آماده ثبت شدند.`);
      },
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open-saved-food-detail]");
      if (!trigger) return;
      event.preventDefault();
      const foodId = trigger.dataset.openSavedFoodDetail;
      const food = [...readSavedFoods(), ...readCustomFoods(), ...readComboMeals()].find((item) => item.id === foodId);
      if (!food) return;
      controller.openDetail(food, trigger, readFlowContext().meal || "lunch");
    }, true);

    function genericPageToast(message) {
      const toast = $("#saved-foods-toast");
      const messageNode = $("#saved-foods-toast-message");
      if (toast && messageNode) {
        messageNode.textContent = message;
        toast.hidden = false;
      }
    }
  }

  function genericPageToast(message) {
    const toast = $("#saved-foods-toast");
    const messageNode = $("#saved-foods-toast-message");
    if (toast && messageNode) {
      messageNode.textContent = message;
      toast.hidden = false;
    }
  }

  window.AvocadoFoodFlow = {
    mountFoodLogFlow,
    mountSavedFoodsFlow,
    readFoodLogEntries,
    readFlowContext,
    writeFlowContext,
  };

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "food-log") {
      const flow = mountFoodLogFlow();
      if (flow?.openPicker) window.AvocadoFoodFlow.openFoodPicker = flow.openPicker;
    }
    if (page === "saved-foods") mountSavedFoodsFlow();
  });
})();
