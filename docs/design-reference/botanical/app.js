(() => {
  "use strict";

  const themeKey = "avocado-prototype-theme";
  const requestedTheme =
    document.documentElement.dataset.theme || document.body.dataset.theme;
  const theme = requestedTheme || localStorage.getItem(themeKey) || "original";
  document.documentElement.dataset.theme = theme;
  if (requestedTheme) localStorage.setItem(themeKey, requestedTheme);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta)
    themeMeta.content = theme === "botanical" ? "#123f26" : "#0d685d";

  const themedFiles = new Set([
    "index.html",
    "auth.html",
    "otp.html",
    "welcome.html",
    "dashboard.html",
    "log.html",
    "plans.html",
    "profile.html",
  ]);
  const botanicalRoutes = {
    "welcome.html": "welcome-botanical.html",
    "dashboard.html": "dashboard-botanical.html",
    "log.html": "food-log-botanical.html",
    "plans.html": "plans-botanical.html",
    "profile.html": "settings-botanical.html",
  };
  const primaryNavItems = [
    { key: "today", label: "امروز", href: "dashboard-botanical.html", icon: "assets/icons/icon-home.png" },
    { key: "quick-log", label: "ثبت", href: "quick-log-botanical.html", icon: "assets/icons/icon-plus-key.png" },
    { key: "plans", label: "برنامه‌ها", href: "plans-botanical.html", icon: "assets/icons/icon-planner.png" },
    { key: "reports", label: "روند", href: "reports-botanical.html", icon: "assets/icons/icon-increase.png" },
    { key: "me", label: "من", href: "settings-botanical.html", icon: "assets/icons/icon-user.png" },
  ];
  const primaryNavFootText = "مسیرهای اصلی همیشه از همین پنج بخش در دسترس هستند.";
  const pageGroups = {
    "dashboard-botanical.html": "today",
    "quick-log-botanical.html": "quick-log",
    "food-log-botanical.html": "quick-log",
    "nutrition-targets-botanical.html": "quick-log",
    "saved-foods-botanical.html": "quick-log",
    "water-botanical.html": "quick-log",
    "body-botanical.html": "quick-log",
    "plans-botanical.html": "plans",
    "plan-detail-botanical.html": "plans",
    "plan-editor-botanical.html": "plans",
    "meal-plan-botanical.html": "plans",
    "workout-botanical.html": "plans",
    "workout-weekly-botanical.html": "plans",
    "workout-session-botanical.html": "plans",
    "reports-botanical.html": "reports",
    "community-botanical.html": "me",
    "group-detail-botanical.html": "me",
    "challenge-detail-botanical.html": "me",
    "coach-space-botanical.html": "me",
    "coach-permissions-botanical.html": "me",
    "settings-botanical.html": "me",
    "profile-botanical.html": "me",
  };

  function currentHtmlFile() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function activeNavKey() {
    if (currentHtmlFile() === "nutrition-targets-botanical.html") {
      const entry = new URLSearchParams(window.location.search).get("entry") || "";
      if (/settings-botanical\.html/i.test(entry)) return "me";
      if (/(meal-plan|plans)-botanical\.html/i.test(entry)) return "plans";
      return "quick-log";
    }
    return pageGroups[currentHtmlFile()] || null;
  }

  function themedPage(path) {
    if (theme !== "botanical") return path;
    const match = path.match(/^([^?#]+\.html)([?#].*)?$/);
    if (!match || !themedFiles.has(match[1])) return path;
    const target = botanicalRoutes[match[1]] || match[1].replace(/\.html$/, "-botanical.html");
    return `${target}${match[2] || ""}`;
  }

  if (theme === "botanical")
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (href) link.setAttribute("href", themedPage(href));
    });

  const page = document.body.dataset.page || "";
  const stateKey = "avocado-prototype-state-v2";
  const nutritionTargetsKey = "avocado:nutrition-targets-v1";
  const avatarGenderKey = "avocado:user-gender";
  const avatarNameKey = "avocado:user-name";
  const mealNames = {
    breakfast: "صبحانه",
    lunch: "ناهار",
    dinner: "شام",
    snack: "میان‌وعده",
    other: "سایر",
  };
  const defaultFoods = [
    {
      id: "seed-bread",
      name: "نان سنگک و پنیر",
      amount: "۱ سهم",
      calories: 310,
      meal: "breakfast",
      time: "۰۸:۱۰",
    },
    {
      id: "seed-egg",
      name: "تخم‌مرغ",
      amount: "۱ عدد",
      calories: 78,
      meal: "breakfast",
      time: "۰۸:۱۲",
    },
    {
      id: "seed-coffee",
      name: "قهوه با شیر",
      amount: "۱ فنجان",
      calories: 92,
      meal: "breakfast",
      time: "۰۹:۲۰",
    },
    {
      id: "seed-apple",
      name: "سیب",
      amount: "۱ عدد",
      calories: 80,
      meal: "snack",
      time: "۱۱:۳۰",
    },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];

  const nutritionSourceLabels = {
    self: "تنظیم‌شده توسط من",
    plan: "برگرفته از برنامه فعال",
    coach: "تعیین‌شده توسط مربی",
    avocado: "پیشنهاد آووکادو",
  };

  function nutritionTargetDay(day = {}) {
    return {
      calories: Math.max(0, Number(day.calories) || 0),
      protein: Math.max(0, Number(day.protein) || 0),
      carbs: Math.max(0, Number(day.carbs) || 0),
      fat: Math.max(0, Number(day.fat) || 0),
    };
  }

  function defaultNutritionTargets() {
    const single = nutritionTargetDay({
      calories: 1800,
      protein: 110,
      carbs: 160,
      fat: 70,
    });
    const workout = nutritionTargetDay({
      calories: 1950,
      protein: 120,
      carbs: 185,
      fat: 68,
    });
    const rest = nutritionTargetDay({
      calories: 1700,
      protein: 110,
      carbs: 140,
      fat: 66,
    });
    const baselineSingle = nutritionTargetDay({
      calories: 1750,
      protein: 105,
      carbs: 165,
      fat: 65,
    });
    return {
      source: "self",
      method: "grams",
      dayMode: "single",
      activeDay: "single",
      single,
      workout,
      rest,
      baseline: {
        source: "plan",
        dayMode: "single",
        single: baselineSingle,
        workout: nutritionTargetDay({
          calories: 1880,
          protein: 116,
          carbs: 178,
          fat: 65,
        }),
        rest: nutritionTargetDay({
          calories: 1680,
          protein: 108,
          carbs: 145,
          fat: 62,
        }),
        updatedAt: "2026-07-22T09:30:00+03:30",
      },
      updatedAt: "2026-07-24T08:00:00+03:30",
    };
  }

  function normalizeNutritionTargetsState(input = {}) {
    const fallback = defaultNutritionTargets();
    return {
      source: ["self", "plan", "coach", "avocado"].includes(input.source) ? input.source : fallback.source,
      method: input.method === "percent" ? "percent" : "grams",
      dayMode: input.dayMode === "split" ? "split" : "single",
      activeDay: input.activeDay === "workout" || input.activeDay === "rest" ? input.activeDay : "single",
      single: nutritionTargetDay(input.single || fallback.single),
      workout: nutritionTargetDay(input.workout || fallback.workout),
      rest: nutritionTargetDay(input.rest || fallback.rest),
      baseline: {
        source: ["plan", "coach", "avocado", "self"].includes(input?.baseline?.source)
          ? input.baseline.source
          : fallback.baseline.source,
        dayMode: input?.baseline?.dayMode === "split" ? "split" : "single",
        single: nutritionTargetDay(input?.baseline?.single || fallback.baseline.single),
        workout: nutritionTargetDay(input?.baseline?.workout || fallback.baseline.workout),
        rest: nutritionTargetDay(input?.baseline?.rest || fallback.baseline.rest),
        updatedAt: input?.baseline?.updatedAt || fallback.baseline.updatedAt,
      },
      updatedAt: input.updatedAt || fallback.updatedAt,
    };
  }

  function readNutritionTargets() {
    try {
      return normalizeNutritionTargetsState(JSON.parse(localStorage.getItem(nutritionTargetsKey) || "{}"));
    } catch (_) {
      const fallback = defaultNutritionTargets();
      localStorage.setItem(nutritionTargetsKey, JSON.stringify(fallback));
      return fallback;
    }
  }

  function saveNutritionTargets(nextState) {
    const normalized = normalizeNutritionTargetsState(nextState);
    localStorage.setItem(nutritionTargetsKey, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("avocado:nutrition-targets-updated", { detail: normalized }));
    return normalized;
  }

  function resetNutritionTargets() {
    const fallback = defaultNutritionTargets();
    localStorage.setItem(nutritionTargetsKey, JSON.stringify(fallback));
    window.dispatchEvent(new CustomEvent("avocado:nutrition-targets-updated", { detail: fallback }));
    return fallback;
  }

  window.AvocadoNutritionTargets = {
    storageKey: nutritionTargetsKey,
    sourceLabels: nutritionSourceLabels,
    defaultState: defaultNutritionTargets,
    read: readNutritionTargets,
    save: saveNutritionTargets,
    reset: resetNutritionTargets,
    normalize: normalizeNutritionTargetsState,
  };

  function renderPrimaryNavigation() {
    const activeKey = activeNavKey();
    const renderLink = (item, mobile = false) => {
      const classes = [
        item.key === "quick-log" ? "quick-log-trigger" : "",
        mobile && item.key === "quick-log" ? "bottom-nav__primary" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<a href="${item.href}"${classes ? ` class="${classes}"` : ""}${
        item.key === activeKey ? ' aria-current="page"' : ""
      }><img class="nav-icon" src="${item.icon}" alt="" aria-hidden="true" /><span class="nav-link__label">${
        item.label
      }</span></a>`;
    };

    $$(".side-nav").forEach((sidebar) => {
      const brand = $(".brand", sidebar);
      if (brand) brand.setAttribute("href", "dashboard-botanical.html");
      const nav = $("nav", sidebar);
      if (nav) nav.innerHTML = primaryNavItems.map((item) => renderLink(item)).join("");
      const foot = $(".side-nav__foot", sidebar);
      if (foot) foot.textContent = primaryNavFootText;
    });

    $$(".bottom-nav").forEach((bottomNav) => {
      bottomNav.innerHTML = primaryNavItems
        .map((item) => renderLink(item, true))
        .join("");
    });
  }

  function normalizeGender(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["male", "man", "boy", "m", "پسر", "مرد"].includes(normalized))
      return "male";
    if (["female", "woman", "girl", "f", "دختر", "زن"].includes(normalized))
      return "female";
    return "";
  }

  function readAvatarName() {
    const storedName = localStorage.getItem(avatarNameKey)?.trim();
    if (storedName) return storedName;
    const firstAvatarLabel = $(".avatar-link")?.getAttribute("aria-label") || "";
    const parsedName = firstAvatarLabel.replace(/^پروفایل\s*/, "").trim();
    return parsedName || "سارا";
  }

  function resolveAvatarGender() {
    return (
      normalizeGender(localStorage.getItem(avatarGenderKey)) ||
      normalizeGender(document.body.dataset.userGender) ||
      "female"
    );
  }

  function applyUserAvatarIcons() {
    const gender = resolveAvatarGender();
    const iconSrc =
      gender === "male" ? "icons8-person-64.png" : "icons8-account-64.png";
    const userName = readAvatarName();

    $$(".avatar-link").forEach((link) => {
      link.dataset.avatarIcon = "true";
      link.dataset.avatarGender = gender;
      if (!link.getAttribute("aria-label")) {
        link.setAttribute("aria-label", `پروفایل ${userName}`);
      }
      link.innerHTML =
        `<img class="avatar-link__image" src="${iconSrc}" alt="" aria-hidden="true" />`;
    });
  }

  function applyNotificationIcons() {
    $$(".app-topbar__actions").forEach((actions) => {
      const avatar = $(".avatar-link", actions);
      if (!avatar) return;

      let notificationLink =
        $('a[href*="notifications-botanical.html"]', actions) ||
        $('a[href*="notifications.html"]', actions);

      if (!notificationLink) {
        notificationLink = document.createElement("a");
        notificationLink.className = "icon-button notification-button";
        notificationLink.href = themedPage("notifications-botanical.html");
        notificationLink.setAttribute("aria-label", "اعلان‌ها");
        actions.insertBefore(notificationLink, avatar);
      }

      notificationLink.classList.add("notification-button");
      notificationLink.innerHTML =
        '<img class="notification-button__image" src="assets/icons/icon-bell.png" alt="" aria-hidden="true" />';
    });
  }

  function normalizeTopbarActions() {
    $$(".app-topbar__actions").forEach((actions) => {
      const userName = readAvatarName();
      actions.innerHTML = `
        <a class="header-action-link" href="messages-botanical.html" aria-label="پیام‌ها">
          <img class="header-action-icon" src="assets/icons/icon-message.png" alt="" aria-hidden="true" />
        </a>
        <a class="header-action-link header-action-link--notification" href="notifications-botanical.html" aria-label="اعلان‌ها">
          <img class="header-action-icon" src="assets/icons/icon-bell.png" alt="" aria-hidden="true" />
          <span class="header-action-badge" aria-hidden="true"></span>
        </a>
        <a class="avatar-link" href="settings-botanical.html" aria-label="پروفایل ${userName}">${userName.charAt(0) || "س"}</a>
      `;
    });
  }

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(stateKey));
      if (stored && Array.isArray(stored.foods)) return stored;
    } catch (_) {
      // Invalid local demo data falls back to a safe initial state.
    }
    const initial = {
      phone: "09123456789",
      seenWelcome: false,
      authenticated: false,
      foods: defaultFoods,
    };
    localStorage.setItem(stateKey, JSON.stringify(initial));
    return initial;
  }

  let state = readState();
  let lastAddedId = null;
  let toastTimer = null;

  function saveState() {
    localStorage.setItem(stateKey, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toEnglishDigits(value) {
    return String(value)
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  }

  function toPersianNumber(value) {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  }

  function normalizePhone(value) {
    let digits = toEnglishDigits(value).replace(/\D/g, "");
    if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
    else if (digits.startsWith("98")) digits = `0${digits.slice(2)}`;
    else if (digits.length === 10 && digits.startsWith("9"))
      digits = `0${digits}`;
    return digits;
  }

  function formatPhone(value) {
    const phone = normalizePhone(value).padEnd(11, " ");
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 11)}`.trim();
  }

  function showToast(message) {
    const toast = $("#toast");
    const label = $("#toast-message");
    if (!toast || !label) return;
    window.clearTimeout(toastTimer);
    label.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 5000);
  }

  function setButtonLoading(button, loading, loadingLabel = "در حال انجام") {
    if (!button) return;
    const loader = $(".button__loader", button);
    const label = $("[data-button-label]", button);
    button.disabled = loading;
    button.setAttribute("aria-busy", String(loading));
    if (loader) loader.hidden = !loading;
    if (label) {
      if (!button.dataset.originalLabel)
        button.dataset.originalLabel = label.textContent;
      label.textContent = loading ? loadingLabel : button.dataset.originalLabel;
    }
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

  function setupQuickLog() {
    if (page === "quick-log") return;

    const fallbackHref = "quick-log-botanical.html";
    const items = [
      {
        id: "food",
        title: "غذا",
        copy: "وعده یا خوراکی مصرف‌شده را اضافه کنید",
        href: "food-log-botanical.html",
        icon: "assets/icons/icons8-healthy-food-calories-calculator-64.png",
        tone: "food",
      },
      {
        id: "water",
        title: "آب",
        copy: "مقدار آب نوشیده‌شده را ثبت کنید",
        href: "water-botanical.html",
        icon: "assets/icons/icons8-water-bottle-64.png",
        tone: "water",
      },
      {
        id: "body",
        title: "وزن و اندازه‌ها",
        copy: "وزن یا اندازه‌های جدید بدن را وارد کنید",
        href: "body-botanical.html",
        icon: "assets/icons/icons8-scale-64.png",
        tone: "body",
      },
      {
        id: "workout",
        title: "تمرین",
        copy: "تمرین امروز یا فعالیت انجام‌شده را ثبت کنید",
        href: "workout-botanical.html",
        icon: "assets/icons/icons8-dumbbell-64.png",
        tone: "workout",
      },
    ];

    const triggers = [
      ...document.querySelectorAll(".side-nav nav a[href], .bottom-nav a[href]"),
    ].filter((link) => {
      const href = link.getAttribute("href") || "";
      return /(?:quick-log-botanical|quick-log)\.html(?:[?#].*)?$/i.test(href);
    });

    if (!triggers.length) return;

    function cardsMarkup() {
      return items
        .map(
          (item) => `
            <a class="quick-log-card" href="${item.href}" data-tone="${item.tone}">
              <div class="quick-log-card__head">
                <span class="quick-log-card__icon" aria-hidden="true">
                  <img src="${item.icon}" alt="" />
                </span>
                <span class="quick-log-card__arrow" aria-hidden="true">
                  <svg class="icon" viewBox="0 0 24 24"><use href="assets/icons.svg#icon-arrow"></use></svg>
                </span>
              </div>
              <div class="quick-log-card__body">
                <strong>${item.title}</strong>
                <p>${item.copy}</p>
              </div>
              <span class="quick-log-card__foot">ورود به ثبت تخصصی</span>
            </a>`,
        )
        .join("");
    }

    function ensureDialog() {
      let dialog = document.getElementById("quick-log-dialog");
      if (dialog) return dialog;

      dialog = document.createElement("dialog");
      dialog.id = "quick-log-dialog";
      dialog.className = "quick-log-dialog";
      dialog.setAttribute("aria-labelledby", "quick-log-title");
      dialog.innerHTML = `
        <div class="quick-log-dialog__sheet" data-quick-log-sheet>
          <div class="sheet__handle" aria-hidden="true"></div>
          <div class="quick-log-dialog__header">
            <div class="quick-log-dialog__top">
              <div class="quick-log-dialog__title">
                <h2 id="quick-log-title">چه چیزی را می‌خواهید ثبت کنید؟</h2>
                <p>یکی از موارد زیر را انتخاب کنید تا سریع ثبتش کنید.</p>
              </div>
              <button class="icon-button quick-log-dialog__close" type="button" data-quick-log-close aria-label="بستن ثبت سریع">
                <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-close"></use></svg>
              </button>
            </div>
          </div>
          <div class="quick-log-dialog__grid" data-quick-log-grid>
            ${cardsMarkup()}
          </div>
          <p class="quick-log-note quick-log-dialog__note">اطلاعات فقط پس از تأیید شما ثبت می‌شوند.</p>
        </div>
      `;
      document.body.append(dialog);
      return dialog;
    }

    let opener = null;
    let touchStartY = 0;
    let dragDistance = 0;

    function isDesktop() {
      return window.matchMedia("(min-width: 62rem)").matches;
    }

    function openQuickLog(trigger) {
      const dialog = ensureDialog();
      if (typeof dialog.showModal !== "function") {
        window.location.href = fallbackHref;
        return;
      }
      opener = trigger || document.activeElement;
      const sheet = dialog.querySelector("[data-quick-log-sheet]");
      if (sheet) {
        sheet.style.transform = "";
        sheet.classList.remove("is-dragging");
      }
      dialog.showModal();
      window.requestAnimationFrame(() => {
        dialog.querySelector(".quick-log-card")?.focus();
      });
    }

    function closeQuickLog() {
      const dialog = document.getElementById("quick-log-dialog");
      if (!dialog?.open) return;
      dialog.close();
      window.requestAnimationFrame(() => opener?.focus?.());
    }

    triggers.forEach((trigger) => {
      trigger.classList.add("quick-log-trigger");
      trigger.dataset.quickLogTrigger = "true";
      trigger.setAttribute("href", fallbackHref);
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) {
          return;
        }
        event.preventDefault();
        openQuickLog(trigger);
      });
    });

    const dialog = ensureDialog();
    const sheet = dialog.querySelector("[data-quick-log-sheet]");
    const closeButton = dialog.querySelector("[data-quick-log-close]");
    const handle = dialog.querySelector(".sheet__handle");

    closeButton?.addEventListener("click", closeQuickLog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeQuickLog();
    });
    dialog.addEventListener("cancel", () => {
      window.requestAnimationFrame(() => opener?.focus?.());
    });

    const startDrag = (event) => {
      if (isDesktop()) return;
      touchStartY = event.touches[0].clientY;
      dragDistance = 0;
      sheet?.classList.add("is-dragging");
    };
    const moveDrag = (event) => {
      if (!touchStartY || isDesktop() || !sheet) return;
      dragDistance = Math.max(0, event.touches[0].clientY - touchStartY);
      sheet.style.transform = `translateY(${Math.min(dragDistance, 180)}px)`;
    };
    const endDrag = () => {
      if (!touchStartY || isDesktop() || !sheet) return;
      sheet.classList.remove("is-dragging");
      if (dragDistance > 96) {
        touchStartY = 0;
        dragDistance = 0;
        closeQuickLog();
        return;
      }
      sheet.style.transform = "";
      touchStartY = 0;
      dragDistance = 0;
    };

    [handle, sheet].forEach((target) => {
      target?.addEventListener("touchstart", startDrag, { passive: true });
      target?.addEventListener("touchmove", moveDrag, { passive: true });
      target?.addEventListener("touchend", endDrag, { passive: true });
      target?.addEventListener("touchcancel", endDrag, { passive: true });
    });
  }

  $$("[data-open-dialog]").forEach((trigger) => {
    trigger.addEventListener("click", () =>
      openDialog(document.getElementById(trigger.dataset.openDialog)),
    );
  });
  $$("[data-close-dialog]").forEach((trigger) => {
    trigger.addEventListener("click", () =>
      closeDialog(trigger.closest("dialog")),
    );
  });
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  function setupLanding() {
    const toggle = $("[data-menu-toggle]");
    const menu = $("#mobile-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      menu.hidden = expanded;
      toggle
        .querySelector("use")
        ?.setAttribute(
          "href",
          `assets/icons.svg#icon-${expanded ? "menu" : "close"}`,
        );
    });
    $$("a", menu).forEach((link) =>
      link.addEventListener("click", () => {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }),
    );
  }

  function setupAuth() {
    const form = $("#phone-form");
    const input = $("#mobile-number");
    const control = $("#phone-control");
    const error = $("#phone-error");
    const serverError = $("#server-error");
    const submit = $("#phone-submit");
    if (!form || !input || !submit) return;

    function updateValidity(showError = false) {
      const normalized = normalizePhone(input.value);
      const valid = /^09\d{9}$/.test(normalized);
      const invalidVisible = showError && input.value.trim() !== "" && !valid;
      submit.disabled = !valid;
      input.setAttribute("aria-invalid", String(invalidVisible));
      control.classList.toggle("is-error", invalidVisible);
      error.hidden = !invalidVisible;
      if (valid) serverError.hidden = true;
      return { valid, normalized };
    }

    input.addEventListener("input", () => updateValidity(false));
    input.addEventListener("blur", () => updateValidity(true));
    updateValidity(false);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const { valid, normalized } = updateValidity(true);
      if (!valid) return;
      setButtonLoading(submit, true, "در حال ارسال کد");
      serverError.hidden = true;
      window.setTimeout(() => {
        if (normalized.endsWith("0000")) {
          setButtonLoading(submit, false);
          submit.disabled = false;
          serverError.hidden = false;
          return;
        }
        state.phone = normalized;
        saveState();
        sessionStorage.setItem(
          "avocadoOtpExpiresAt",
          String(Date.now() + 120000),
        );
        window.location.href = themedPage("otp.html");
      }, 850);
    });
  }

  function setupOtp() {
    const form = $("#otp-form");
    const group = $("#otp-group");
    const inputs = $$("input", group || document);
    const error = $("#otp-error");
    const expired = $("#otp-expired");
    const timer = $("#otp-timer");
    const resend = $("#resend-code");
    const submit = $("#otp-submit");
    const phone = $("#otp-phone");
    if (!form || !group || !submit) return;
    if (phone) phone.textContent = formatPhone(state.phone);

    let expiresAt = Number(sessionStorage.getItem("avocadoOtpExpiresAt"));
    if (!expiresAt) {
      expiresAt = Date.now() + 120000;
      sessionStorage.setItem("avocadoOtpExpiresAt", String(expiresAt));
    }

    function remainingSeconds() {
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    }

    function paintTimer() {
      const remaining = remainingSeconds();
      const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
      const seconds = String(remaining % 60).padStart(2, "0");
      if (timer)
        timer.innerHTML = remaining
          ? `ارسال دوباره تا <bdi dir="ltr">${minutes}:${seconds}</bdi>`
          : "زمان کد تمام شده است.";
      if (resend) resend.disabled = remaining > 0;
      if (remaining === 0) window.clearInterval(interval);
    }

    let interval = window.setInterval(paintTimer, 1000);
    paintTimer();

    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = toEnglishDigits(input.value).replace(/\D/g, "").slice(-1);
        group.classList.remove("is-error");
        error.hidden = true;
        if (input.value) inputs[index + 1]?.focus();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value)
          inputs[index - 1]?.focus();
        if (event.key === "ArrowRight") inputs[index + 1]?.focus();
        if (event.key === "ArrowLeft") inputs[index - 1]?.focus();
      });
      input.addEventListener("paste", (event) => {
        const digits = toEnglishDigits(event.clipboardData.getData("text"))
          .replace(/\D/g, "")
          .slice(0, 6);
        if (digits.length < 2) return;
        event.preventDefault();
        digits.split("").forEach((digit, digitIndex) => {
          if (inputs[digitIndex]) inputs[digitIndex].value = digit;
        });
        inputs[Math.min(digits.length, 6) - 1]?.focus();
      });
    });

    resend?.addEventListener("click", () => {
      expiresAt = Date.now() + 120000;
      sessionStorage.setItem("avocadoOtpExpiresAt", String(expiresAt));
      expired.hidden = true;
      error.hidden = true;
      group.classList.remove("is-error");
      inputs.forEach((input) => {
        input.value = "";
      });
      inputs[0]?.focus();
      window.clearInterval(interval);
      interval = window.setInterval(paintTimer, 1000);
      paintTimer();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      error.hidden = true;
      expired.hidden = true;
      group.classList.remove("is-error");
      if (remainingSeconds() === 0) {
        expired.hidden = false;
        return;
      }
      const code = inputs.map((input) => input.value).join("");
      if (code !== "123456") {
        group.classList.add("is-error");
        error.hidden = false;
        inputs.find((input) => !input.value)?.focus() || inputs[0]?.focus();
        return;
      }
      setButtonLoading(submit, true, "در حال ورود");
      state.authenticated = true;
      saveState();
      window.setTimeout(() => {
        window.location.href = themedPage(
          state.seenWelcome ? "dashboard.html" : "welcome.html",
        );
      }, 700);
    });
  }

  function setupWelcome() {
    $$("[data-welcome-complete]").forEach((link) => {
      link.addEventListener("click", () => {
        state.seenWelcome = true;
        state.authenticated = true;
        saveState();
      });
    });
  }

  function foodEntryHtml(food) {
    const calorieText = food.calories
      ? `${toPersianNumber(food.calories)} kcal`
      : "—";
    return `<div class="food-entry" data-food-id="${escapeHtml(food.id)}">
      <span class="food-entry__main"><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.amount)} · ${escapeHtml(food.time || "اکنون")}</small></span>
      <span class="food-entry__value"><b>${escapeHtml(calorieText)}</b><small>دستی</small></span>
    </div>`;
  }

  function renderFoods(searchTerm = "") {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("fa");
    const visibleFoods = normalizedSearch
      ? state.foods.filter((food) =>
          food.name.toLocaleLowerCase("fa").includes(normalizedSearch),
        )
      : state.foods;
    Object.keys(mealNames).forEach((meal) => {
      const list = document.querySelector(`[data-meal-list="${meal}"]`);
      if (!list) return;
      const mealFoods = visibleFoods.filter((food) => food.meal === meal);
      list.innerHTML = mealFoods.map(foodEntryHtml).join("");
      const group = list.closest("[data-meal-group]");
      const count = $("[data-meal-count]", group);
      const empty = document.querySelector(`[data-meal-empty="${meal}"]`);
      if (count)
        count.textContent = mealFoods.length
          ? `${toPersianNumber(mealFoods.length)} مورد`
          : "ثبت نشده";
      if (empty) empty.hidden = mealFoods.length > 0 || normalizedSearch !== "";
    });
    const total = state.foods.reduce(
      (sum, food) => sum + (Number(food.calories) || 0),
      0,
    );
    const mealCount = new Set(state.foods.map((food) => food.meal)).size;
    const todayCount = $("#today-count");
    const todayCalories = $("#today-calories");
    const todayMeals = $("#today-meals");
    const progressBar = $("#day-progress-bar");
    const progressCopy = $("#day-progress-copy");
    const progressPercent = $("#day-progress-percent");
    const resultCount = $("#log-result-count");
    if (todayCount)
      todayCount.textContent = `${toPersianNumber(state.foods.length)} مورد`;
    if (todayCalories)
      todayCalories.textContent = `${toPersianNumber(total)} kcal`;
    if (todayMeals)
      todayMeals.textContent = `در ${toPersianNumber(mealCount)} وعده`;
    if (progressBar)
      progressBar.style.setProperty("--progress", `${mealCount * 20}%`);
    if (progressCopy)
      progressCopy.textContent = `${toPersianNumber(mealCount)} وعده از ۵ گروه ثبت شده`;
    if (progressPercent)
      progressPercent.textContent = `${toPersianNumber(mealCount * 20)}٪`;
    if (resultCount)
      resultCount.textContent = `${toPersianNumber(visibleFoods.length)} مورد`;
  }

  function setupTabs() {
    $$('[role="tablist"]').forEach((tablist) => {
      if (tablist.hasAttribute("data-profile-tabs")) return;
      const tabs = $$('[role="tab"]', tablist);
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((item) => {
            const selected = item === tab;
            item.setAttribute("aria-selected", String(selected));
            const panel = document.getElementById(
              item.getAttribute("aria-controls"),
            );
            if (panel) panel.hidden = !selected;
          });
        });
      });
    });
  }

  function setupFoodFlow() {
    const dialog = $("#food-dialog");
    const form = $("#food-form");
    const name = $("#food-name");
    const amount = $("#food-amount");
    const calories = $("#food-calories");
    const meal = $("#food-meal");
    const notice = $("#prefill-notice");
    const noticeText = $("#prefill-text");
    if (!dialog || !form) {
      renderFoods();
      return;
    }

    $$("[data-open-food]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        form.reset();
        name.value = trigger.dataset.name || "";
        amount.value = trigger.dataset.amount || "";
        calories.value = toEnglishDigits(trigger.dataset.calories || "");
        meal.value = trigger.dataset.meal || "snack";
        const source = trigger.dataset.source;
        notice.hidden = !source;
        if (source && noticeText) {
          noticeText.textContent =
            source === "plan"
              ? "این مورد از برنامه غذایی آمده و هنوز مصرف‌شده نیست. مقدار واقعی را بررسی و سپس ثبت کنید."
              : source === "saved"
                ? "خوراک ذخیره‌شده فقط فرم را پر کرده است. ثبت نهایی با تأیید شما انجام می‌شود."
                : "خوراک اخیر فقط فرم را پر کرده است. مقدار را بررسی و سپس تأیید کنید.";
        }
        openDialog(dialog);
        window.setTimeout(() => name.focus(), 80);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const newFood = {
        id: `food-${Date.now()}`,
        name: name.value.trim(),
        amount: amount.value.trim(),
        calories: Number(toEnglishDigits(calories.value)) || 0,
        meal: meal.value,
        time: new Intl.DateTimeFormat("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      };
      state.foods.push(newFood);
      lastAddedId = newFood.id;
      saveState();
      closeDialog(dialog);
      renderFoods($("[data-log-search]")?.value || "");
      showToast(
        `«${newFood.name}» به ${mealNames[newFood.meal]} امروز اضافه شد.`,
      );
    });

    $("#toast-undo")?.addEventListener("click", () => {
      if (!lastAddedId) {
        $("#toast").hidden = true;
        return;
      }
      state.foods = state.foods.filter((food) => food.id !== lastAddedId);
      lastAddedId = null;
      saveState();
      renderFoods($("[data-log-search]")?.value || "");
      showToast("ثبت تازه واگردانی شد.");
    });

    const search = $("[data-log-search]");
    search?.addEventListener("input", () => renderFoods(search.value));
    renderFoods();
  }

  function setupProfile() {
    $("#profile-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const selectedGender = normalizeGender($("#profile-gender")?.value);
      if (selectedGender) localStorage.setItem(avatarGenderKey, selectedGender);
      showToast("تغییرات اطلاعات سلامت ذخیره شد.");
      applyUserAvatarIcons();
    });
    $("[data-questionnaire-next]")?.addEventListener("click", () =>
      showToast("پاسخ ذخیره شد؛ پرسش بعدی آماده است."),
    );

    const fileInput = $("#plan-file");
    const fileItem = $("#uploaded-file");
    const fileName = $("#uploaded-file-name");
    const uploadZone = $("[data-upload-zone]");
    function acceptFile(file) {
      if (!file || !fileItem || !fileName) return;
      fileName.textContent = file.name;
      $("small", fileItem).innerHTML =
        `<bdi dir="ltr">${(file.size / 1024 / 1024).toFixed(1)} MB</bdi> · آماده بررسی`;
      fileItem.hidden = false;
      showToast("فایل برای بررسی آماده شد.");
    }
    fileInput?.addEventListener("change", () =>
      acceptFile(fileInput.files?.[0]),
    );
    ["dragenter", "dragover"].forEach((eventName) =>
      uploadZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.style.borderColor = "var(--av-color-primary)";
      }),
    );
    ["dragleave", "drop"].forEach((eventName) =>
      uploadZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.style.borderColor = "";
      }),
    );
    uploadZone?.addEventListener("drop", (event) =>
      acceptFile(event.dataTransfer.files?.[0]),
    );
    $("[data-remove-file]")?.addEventListener("click", () => {
      fileItem.hidden = true;
      if (fileInput) fileInput.value = "";
      showToast("فایل حذف شد.");
    });
  }

  function setupSettingsPage() {
    const root = $("[data-settings-root]");
    if (!root) return;

    const tabsRoot = $("[data-profile-tabs]", root);
    const tabTriggers = $$("[data-tab]", tabsRoot);
    const tabPanels = $$("[data-profile-tab-panel]", root);
    const fileInput = $("#settings-file-input");
    const fileGroups = {
      plan: $("[data-file-list=\"plan\"]", root),
      medical: $("[data-file-list=\"medical\"]", root),
      image: $("[data-file-list=\"image\"]", root),
    };
    const fileEmptyState = $("[data-file-empty-state]", root);
    const uploadZone = $("[data-settings-upload-zone]", root);
    const incompleteCard = $("[data-incomplete-card]", root);
    const resumeList = $("[data-resume-list]", root);
    const resumeToggle = $("[data-resume-toggle]", root);
    const completeSummary = $("[data-complete-summary]", root);
    const primaryButton = $("[data-profile-primary-action]", root);
    const editBackdrop = $("[data-edit-backdrop]", document);
    const deleteInput = $("[data-delete-confirm-input]");
    const deleteConfirm = $("[data-delete-confirm]");
    const toastClose = $("#toast-undo");
    let replacementTargetName = "";

    const todayLabel = window.AvocadoDate?.todayPersianLabel?.() || `امروز، ${new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}`;
    const panelByEditKey = {
      personal: "personal",
      metrics: "personal",
      preferences: "personal",
      "health-info": "health",
      "body-info": "health",
    };
    const validTabs = ["personal", "health", "files", "settings", "security"];
    const mobileResumeQuery = window.matchMedia("(max-width: 47.99rem)");
    const mobileCardAccordionQuery = window.matchMedia("(max-width: 47.99rem)");

    function normalizeTabKey(value) {
      return validTabs.includes(value) ? value : "personal";
    }

    function readTabFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      return tab ? normalizeTabKey(tab) : null;
    }

    function writeTabToUrl(key, mode = "push") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      if (mode === "replace") {
        window.history.replaceState({ tab: key }, "", nextUrl);
        return;
      }
      if ((window.history.state && window.history.state.tab) === key && url.search === window.location.search) return;
      window.history.pushState({ tab: key }, "", nextUrl);
    }

    function scrollActiveTabIntoView(trigger, behavior = "smooth") {
      if (!tabsRoot || !trigger) return;
      const rootRect = tabsRoot.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const delta = triggerRect.left - (rootRect.left + (rootRect.width - triggerRect.width) / 2);
      tabsRoot.scrollTo({
        left: tabsRoot.scrollLeft + delta,
        behavior,
      });
    }

    function scrollToPanelStart(panel, behavior = "smooth") {
      if (!panel) return;
      const top = panel.getBoundingClientRect().top + window.scrollY - 104;
      window.scrollTo({ top: Math.max(0, top), behavior });
    }

    function setResumeCollapsed(collapsed) {
      if (!incompleteCard || !resumeToggle) return;
      incompleteCard.dataset.collapsed = collapsed ? "true" : "false";
      resumeToggle.setAttribute("aria-expanded", String(!collapsed));
      resumeToggle.textContent = collapsed ? "نمایش جزئیات" : "جمع‌کردن";
    }

    function syncResumeCardMode() {
      if (!resumeToggle) return;
      if (mobileResumeQuery.matches) {
        resumeToggle.hidden = false;
        if (!incompleteCard?.dataset.resumeInitialized) setResumeCollapsed(true);
      } else {
        resumeToggle.hidden = true;
        setResumeCollapsed(false);
      }
      if (incompleteCard) incompleteCard.dataset.resumeInitialized = "true";
    }

    function setActiveTab(key, options = {}) {
      const { updateHistory = false, historyMode = "push", focusTrigger = false, scrollTab = true, scrollPanel = false, scrollBehavior = "smooth" } = options;
      const safeKey = normalizeTabKey(key);
      let activePanel = null;
      tabTriggers.forEach((trigger) => {
        const active = trigger.dataset.tab === safeKey;
        trigger.setAttribute("aria-selected", String(active));
        trigger.classList.toggle("active", active);
        trigger.tabIndex = active ? 0 : -1;
        if (active && focusTrigger) trigger.focus();
        if (active && scrollTab) scrollActiveTabIntoView(trigger);
      });
      tabPanels.forEach((panel) => {
        const active = panel.dataset.profileTabPanel === safeKey;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
        panel.setAttribute("aria-hidden", String(!active));
        if (active) activePanel = panel;
      });
      if (updateHistory) writeTabToUrl(safeKey, historyMode);
      if (scrollPanel) scrollToPanelStart(activePanel, scrollBehavior);
    }

    function closeAllEditPanels() {
      $$("[data-edit-panel]", root).forEach((panel) => {
        panel.hidden = true;
      });
      editBackdrop?.setAttribute("hidden", "");
      document.body.classList.remove("settings-edit-open");
    }

    function openEditPanel(key) {
      const panel = $(`[data-edit-panel="${key}"]`, root);
      if (!panel) return;
      closeAllEditPanels();
      panel.hidden = false;
      editBackdrop?.removeAttribute("hidden");
      document.body.classList.add("settings-edit-open");
      const tabKey = panelByEditKey[key];
      if (tabKey) setActiveTab(tabKey, { scrollPanel: false });
      const firstField = $("input, select, textarea", panel);
      firstField?.focus();
    }

    function closeEditPanel(key) {
      const panel = $(`[data-edit-panel="${key}"]`, root);
      if (panel) panel.hidden = true;
      if (!$$("[data-edit-panel]:not([hidden])", root).length) {
        editBackdrop?.setAttribute("hidden", "");
        document.body.classList.remove("settings-edit-open");
      }
    }

    function updateText(selector, value) {
      $$(selector, root).forEach((node) => {
        node.textContent = value;
      });
    }

    function progressItems() {
      return $$("[data-progress-item]", root);
    }

    function markProgress(key, complete, meta, label, progress) {
      const row = $(`[data-progress-item="${key}"]`, root);
      if (!row) return;
      row.dataset.complete = complete ? "true" : "false";
      if (typeof progress === "number") row.dataset.progress = String(progress);
      const metaNode = $("[data-progress-meta]", row);
      const labelNode = $("[data-progress-label]", row);
      const fillNode = $("[data-progress-fill]", row);
      if (metaNode && meta) metaNode.textContent = meta;
      if (labelNode && label) labelNode.textContent = label;
      if (fillNode && typeof progress === "number") {
        fillNode.style.setProperty("--progress", `${progress}%`);
      }
    }

    function updateCompletion() {
      const items = progressItems();
      if (!items.length) return;
      const total = items.reduce((sum, item) => sum + Number(item.dataset.progress || 0), 0);
      const avg = Math.round(total / items.length);
      const incomplete = items.filter((item) => item.dataset.complete !== "true");
      const completed = items.filter((item) => item.dataset.complete === "true");
      items.forEach((item) => {
        item.hidden = item.dataset.complete === "true";
      });
      updateText("[data-profile-completion-text]", `${avg}٪`);
      updateText("[data-profile-completion-badge]", incomplete.length ? `پروفایل شما ${avg}٪ تکمیل شده` : "پروفایل شما کامل است");
      $$("[data-profile-completion-fill]", root).forEach((node) => {
        node.style.setProperty("--progress", `${avg}%`);
      });
      updateText("[data-profile-updated-at]", todayLabel);
      if (primaryButton) {
        primaryButton.textContent = incomplete.length ? "تکمیل پروفایل" : "ویرایش پروفایل";
      }
      if (completeSummary) {
        completeSummary.hidden = completed.length === 0;
        completeSummary.textContent = `${completed.length} بخش کامل شد`;
      }
      if (incompleteCard) {
        incompleteCard.hidden = incomplete.length === 0;
        incompleteCard.dataset.hasComplete = completed.length ? "true" : "false";
      }
    }

    function refreshProfileSummary() {
      const name = ($("[data-field-name]", root)?.value || "سارا").trim() || "سارا";
      const age = ($("[data-field-age]", root)?.value || "۲۲").trim() || "۲۲";
      const genderSelect = $("[data-field-gender]", root);
      const gender = genderSelect?.selectedOptions?.[0]?.textContent?.trim() || "زن";
      const normalizedGender = normalizeGender(genderSelect?.value || gender);
      const language = ($("[data-field-language-pref]", root)?.value || $("[data-field-language]", root)?.value || "فارسی").trim();
      const units = ($("[data-field-units-pref]", root)?.value || $("[data-field-units]", root)?.value || "متریک").trim();
      const goal = ($("[data-field-goal]", root)?.value || "تغذیه سالم‌تر").trim();
      const height = ($("[data-field-height]", root)?.value || $("[data-field-height-secondary]", root)?.value || "۱۶۸").trim();
      const weight = ($("[data-field-weight]", root)?.value || $("[data-field-weight-secondary]", root)?.value || "۶۸").trim();
      const activity = ($("[data-field-activity]", root)?.value || "متوسط").trim();

      localStorage.setItem(avatarNameKey, name);
      if (normalizedGender) localStorage.setItem(avatarGenderKey, normalizedGender);

      updateText("[data-profile-name]", name);
      updateText("[data-profile-name-secondary]", name);
      updateText("[data-profile-goal-summary]", `هدف اصلی: ${goal}`);
      updateText("[data-profile-hero-summary]", `${goal} · قد ${height} سانتی‌متر · وزن ${weight} کیلوگرم · برنامه‌های فعال در یک نگاه.`);
      updateText("[data-profile-height-weight]", `${height} سانتی‌متر · ${weight} کیلو`);
      updateText("[data-profile-active-plans]", "غذایی + تمرینی");
      updateText("[data-profile-identity-line]", `${name} · ${age} ساله · ${gender}`);
      updateText("[data-profile-activity-line]", activity);
      updateText("[data-profile-language-line]", language);
      updateText("[data-profile-units-line]", units);
      updateText("[data-summary-personal]", `${name} · ${age} ساله · ${gender}`);
      updateText("[data-summary-goal]", goal);
      updateText("[data-summary-goal-long]", `${goal} و حفظ انرژی روزانه`);
      updateText("[data-summary-body]", `قد ${height} سانتی‌متر · وزن ${weight} کیلوگرم`);
      updateText("[data-summary-activity]", activity);
      updateText("[data-summary-preferences]", `${language} · ${units}`);
      applyUserAvatarIcons();
    }

    function appendUploadedFile(file) {
      if (!file) return;
      const isPdf = file.type.includes("pdf");
      const isImage = file.type.startsWith("image/");
      const targetGroup = isPdf ? fileGroups.medical : isImage ? fileGroups.image : fileGroups.plan;
      if (!targetGroup) return;
      const fileType = isPdf ? "PDF" : isImage ? "تصویر" : "فایل";
      const sizeLabel = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
      const safeName = escapeHtml(file.name);
      const row = document.createElement("div");
      row.className = "file-row";
      row.dataset.fileRow = file.name;
      row.innerHTML = `
        <div class="file-row__meta">
          <strong><bdi dir="ltr">${safeName}</bdi></strong>
          <small>${fileType} · <bdi dir="ltr">${sizeLabel}</bdi> · ${todayLabel}</small>
        </div>
        <div class="file-row__actions">
          <span class="review-badge" data-state="pending">در انتظار بررسی</span>
          <details class="file-menu">
            <summary aria-label="اقدام برای ${safeName}">⋯</summary>
            <div class="file-menu__panel">
              <button type="button" data-file-action="view" data-file-name="${safeName}">مشاهده</button>
              <button type="button" data-file-action="replace" data-file-name="${safeName}">جایگزینی</button>
              <button type="button" data-file-action="remove" data-file-name="${safeName}">حذف</button>
            </div>
          </details>
        </div>
      `;
      targetGroup.prepend(row);
      if (fileEmptyState) fileEmptyState.hidden = true;
      markProgress("plan-file", true, "فایل تازه اضافه شد و منتظر بررسی است.", "در انتظار بررسی", 100);
      updateCompletion();
      showToast(`فایل «${file.name}» برای بررسی آماده شد.`);
    }

    function syncCollapsibleCards() {
      const cards = $$("[data-card-collapsible]", root);
      cards.forEach((card, index) => {
        if (!mobileCardAccordionQuery.matches) {
          card.dataset.collapsed = "false";
          return;
        }
        if (!card.dataset.mobileInitialized) {
          card.dataset.collapsed = index === 0 ? "false" : "true";
          card.dataset.mobileInitialized = "true";
        }
      });
    }

    function handleFileAction(button) {
      const action = button.dataset.fileAction;
      const fileName = button.dataset.fileName || "فایل";
      const menu = button.closest("details");
      if (action === "view") {
        showToast(`پیش‌نمایش «${fileName}» آماده است.`);
      }
      if (action === "replace") {
        replacementTargetName = fileName;
        fileInput?.click();
      }
      if (action === "remove") {
        button.closest("[data-file-row]")?.remove();
        if (!$$("[data-file-row]", root).length) {
          markProgress("plan-file", false, "هنوز فایل فعالی اضافه نشده است.", "نیاز به فایل", 25);
          if (fileEmptyState) fileEmptyState.hidden = false;
        }
        updateCompletion();
        showToast(`«${fileName}» حذف شد.`);
      }
      if (menu) menu.open = false;
    }

    tabTriggers.forEach((trigger, index) => {
      trigger.addEventListener("click", () =>
        setActiveTab(trigger.dataset.tab, {
          updateHistory: true,
          historyMode: "push",
          scrollTab: true,
          scrollPanel: true,
        }),
      );
      trigger.addEventListener("keydown", (event) => {
        const currentIndex = index;
        const isRtl = document.dir === "rtl";
        let nextIndex = currentIndex;
        if (event.key === "ArrowLeft") nextIndex = isRtl ? Math.min(tabTriggers.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
        if (event.key === "ArrowRight") nextIndex = isRtl ? Math.max(0, currentIndex - 1) : Math.min(tabTriggers.length - 1, currentIndex + 1);
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabTriggers.length - 1;
        if (nextIndex !== currentIndex) {
          event.preventDefault();
          setActiveTab(tabTriggers[nextIndex].dataset.tab, {
            updateHistory: true,
            historyMode: "push",
            focusTrigger: true,
            scrollTab: true,
            scrollPanel: true,
          });
          return;
        }
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setActiveTab(trigger.dataset.tab, {
            updateHistory: true,
            historyMode: "push",
            focusTrigger: true,
            scrollTab: true,
            scrollPanel: true,
          });
        }
      });
    });

    $$("[data-row-action]", root).forEach((row) => {
      const openTarget = row.dataset.rowAction;
      const openFromRow = () => {
        if (!openTarget) return;
        openEditPanel(openTarget);
      };
      row.addEventListener("click", (event) => {
        if (event.target.closest("button, a, summary, select, input, textarea, label")) return;
        openFromRow();
      });
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openFromRow();
      });
    });

    $$("[data-edit-open]", root).forEach((button) => {
      button.addEventListener("click", () => openEditPanel(button.dataset.editOpen));
    });

    $$("[data-edit-close]", root).forEach((button) => {
      button.addEventListener("click", () => closeEditPanel(button.dataset.editClose));
    });

    editBackdrop?.addEventListener("click", () => closeAllEditPanels());

    $$("[data-card-toggle]", root).forEach((header) => {
      header.addEventListener("click", (event) => {
        if (!mobileCardAccordionQuery.matches) return;
        if (event.target.closest("button, a, summary, select, input, textarea, label")) return;
        const card = header.closest("[data-card-collapsible]");
        if (!card) return;
        const isCollapsed = card.dataset.collapsed === "true";
        card.dataset.collapsed = isCollapsed ? "false" : "true";
      });
    });

    primaryButton?.addEventListener("click", () => {
      const firstIncomplete = progressItems().find((item) => item.dataset.complete !== "true");
      if (!firstIncomplete) {
        openEditPanel("personal");
        return;
      }
      const key = firstIncomplete.dataset.progressItem;
      const actionButton = $(`[data-resume-action="${key}"]`, root);
      actionButton?.click();
    });

    $("[data-open-profile-summary-edit]", root)?.addEventListener("click", () => openEditPanel("metrics"));

    $$("[data-resume-action]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.resumeAction;
        if (action === "health-info") {
          openEditPanel("health-info");
          return;
        }
        if (action === "dietary-restrictions") {
          openEditPanel("health-info");
          return;
        }
        if (action === "nutrition-questionnaire") {
          openDialog($("#nutrition-questionnaire-dialog"));
          return;
        }
        if (action === "plan-file") {
          setActiveTab("files", { updateHistory: true, historyMode: "push", scrollPanel: true });
          if (uploadZone) {
            const top = uploadZone.getBoundingClientRect().top + window.scrollY - 120;
            window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
          }
          return;
        }
      });
    });

    $$("[data-settings-form]", root).forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formKey = form.dataset.settingsForm;
        if (formKey === "personal") {
          refreshProfileSummary();
          showToast("اطلاعات شخصی ذخیره شد.");
        }
        if (formKey === "metrics") {
          refreshProfileSummary();
          showToast("قد، وزن و هدف اصلی بروزرسانی شد.");
        }
        if (formKey === "preferences") {
          refreshProfileSummary();
          showToast("ترجیحات روزانه ذخیره شد.");
        }
        if (formKey === "health-info") {
          updateText("[data-summary-medical]", ($("[data-field-medical]", root)?.value || "").replace(/\n+/g, " · "));
          updateText("[data-summary-restrictions]", ($("[data-field-restrictions]", root)?.value || "").replace(/\n+/g, " · "));
          markProgress("health-info", true, "اطلاعات سلامت تکمیل شد.", "کامل", 100);
          markProgress("dietary-restrictions", true, "محدودیت‌های غذایی ثبت و تکمیل شد.", "کامل", 100);
          showToast("اطلاعات سلامت و محدودیت‌ها ذخیره شد.");
        }
        if (formKey === "body-info") {
          const height = ($("[data-field-height-secondary]", root)?.value || "۱۶۸").trim();
          const weight = ($("[data-field-weight-secondary]", root)?.value || "۶۸").trim();
          updateText("[data-profile-height-weight]", `${height} سانتی‌متر · ${weight} کیلو`);
          updateText("[data-summary-body]", `قد ${height} سانتی‌متر · وزن ${weight} کیلوگرم`);
          showToast("اطلاعات بدنی بروزرسانی شد.");
        }
        closeEditPanel(formKey);
        updateCompletion();
      });
    });

    $$("[data-questionnaire-save]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.questionnaireSave;
        if (key === "nutrition") {
          markProgress("nutrition-questionnaire", true, "پرسش‌نامه تغذیه کامل شد.", "کامل", 100);
          closeDialog($("#nutrition-questionnaire-dialog"));
          showToast("پرسش‌نامه تغذیه ذخیره شد.");
        }
        if (key === "health") {
          closeDialog($("#health-questionnaire-dialog"));
          showToast("پرسش‌نامه سلامت ذخیره شد.");
        }
        updateCompletion();
      });
    });

    $$("[data-file-action]", root).forEach((button) => {
      button.dataset.boundClick = "true";
      button.addEventListener("click", () => handleFileAction(button));
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-file-action]");
      if (!button || button.dataset.boundClick === "true") return;
      handleFileAction(button);
    });

    $("[data-trigger-upload]", root)?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (replacementTargetName) {
        $(`[data-file-row="${replacementTargetName}"]`, root)?.remove();
        replacementTargetName = "";
      }
      appendUploadedFile(file);
      fileInput.value = "";
    });

    ["dragenter", "dragover"].forEach((eventName) =>
      uploadZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.style.borderColor = "var(--av-color-primary)";
      }),
    );
    ["dragleave", "drop"].forEach((eventName) =>
      uploadZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.style.borderColor = "";
      }),
    );
    uploadZone?.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) appendUploadedFile(file);
    });

    $$(".switch", root).forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.getAttribute("aria-checked") !== "true";
        button.setAttribute("aria-checked", String(next));
      });
    });

    deleteConfirm?.addEventListener("click", () => {
      if ((deleteInput?.value || "").trim() !== "حذف") {
        showToast("برای تأیید حذف، عبارت خواسته‌شده را دقیق وارد کنید.");
        return;
      }
      closeDialog($("#delete-dialog"));
      showToast("در نمونه، حذف حساب انجام نشد.");
    });

    toastClose?.addEventListener("click", () => {
      const toast = $("#toast");
      if (toast) toast.hidden = true;
    });

    resumeToggle?.addEventListener("click", () => {
      const collapsed = incompleteCard?.dataset.collapsed === "true";
      setResumeCollapsed(!collapsed);
    });

    if (typeof mobileResumeQuery.addEventListener === "function") {
      mobileResumeQuery.addEventListener("change", syncResumeCardMode);
    } else if (typeof mobileResumeQuery.addListener === "function") {
      mobileResumeQuery.addListener(syncResumeCardMode);
    }

    if (typeof mobileCardAccordionQuery.addEventListener === "function") {
      mobileCardAccordionQuery.addEventListener("change", syncCollapsibleCards);
    } else if (typeof mobileCardAccordionQuery.addListener === "function") {
      mobileCardAccordionQuery.addListener(syncCollapsibleCards);
    }

    window.addEventListener("popstate", () => {
      setActiveTab(readTabFromUrl() || "personal", {
        updateHistory: false,
        focusTrigger: false,
        scrollTab: true,
        scrollPanel: true,
      });
    });

    refreshProfileSummary();
    syncResumeCardMode();
    syncCollapsibleCards();
    const initializeTabs = () => {
      const initialTab = readTabFromUrl() ||
        tabTriggers.find(
          (trigger) => trigger.getAttribute("aria-selected") === "true",
        )?.dataset.tab || "personal";
      setActiveTab(initialTab, {
        updateHistory: true,
        historyMode: "replace",
        scrollTab: false,
        scrollPanel: false,
        scrollBehavior: "auto",
      });
      updateCompletion();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeTabs, { once: true });
    } else {
      initializeTabs();
    }
  }

  function setupExtendedProduct() {
    $$("[data-action-toast]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        showToast(trigger.dataset.actionToast || "تغییر ذخیره شد.");
      });
    });

    $$("[data-toggle-state]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const target = document.getElementById(trigger.dataset.toggleState);
        if (!target) return;
        target.classList.toggle("hidden-state");
        trigger.setAttribute(
          "aria-pressed",
          String(!target.classList.contains("hidden-state")),
        );
      });
    });

    $$("[data-filter]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const group = trigger.closest("[data-filter-group]");
        const filter = trigger.dataset.filter;
        $$("[data-filter]", group || document).forEach((item) =>
          item.setAttribute("aria-pressed", String(item === trigger)),
        );
        $$("[data-filter-item]").forEach((item) => {
          item.hidden = filter !== "all" && item.dataset.filterItem !== filter;
        });
      });
    });

    $$("[data-add-row]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const list = document.getElementById(trigger.dataset.addRow);
        if (!list) return;
        const row = document.createElement("div");
        row.className = "timeline-item";
        row.innerHTML =
          '<span class="timeline-dot" aria-hidden="true"></span><span><strong>مورد تازه</strong><small>برای ویرایش آماده است</small></span><button class="button button--quiet button--sm" type="button" data-remove-row>حذف</button>';
        list.append(row);
        showToast("مورد تازه اضافه شد.");
      });
    });

    document.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-row]");
      if (!remove) return;
      remove.closest(".timeline-item, .notification-item, .shopping-item")?.remove();
      showToast("مورد حذف شد.");
    });
  }

  function setupOnboarding() {
    const root = $("[data-onboarding]");
    if (!root) return;
    const steps = $$("[data-step]", root);
    const progress = $("[data-onboarding-progress]", root);
    const currentLabel = $("[data-onboarding-current]", root);
    const form = $("#onboarding-form");
    const storageKey = "avocado:onboarding";
    let current = Number(localStorage.getItem(`${storageKey}:step`) || 0);

    function showStep(index) {
      current = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach((step, stepIndex) => {
        step.hidden = stepIndex !== current;
      });
      const percent = Math.round(((current + 1) / steps.length) * 100);
      progress?.style.setProperty("--value", `${percent}%`);
      if (currentLabel)
        currentLabel.textContent = `مرحله ${toPersianNumber(current + 1)} از ${toPersianNumber(steps.length)}`;
      localStorage.setItem(`${storageKey}:step`, String(current));
    }

    function validateVisibleStep() {
      const step = steps[current];
      const required = $$("[required]", step);
      for (const field of required) {
        if (!field.checkValidity()) {
          field.reportValidity();
          return false;
        }
      }
      const radioGroups = new Set(
        $$('input[type="radio"][required]', step).map((input) => input.name),
      );
      for (const name of radioGroups) {
        if (!$(`input[name="${CSS.escape(name)}"]:checked`, step)) {
          showToast("برای ادامه یک گزینه را انتخاب کنید.");
          return false;
        }
      }
      return true;
    }

    $$("[data-next-step]", root).forEach((button) => {
      button.addEventListener("click", () => {
        if (!validateVisibleStep()) return;
        const data = new FormData(form);
        localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(data)));
        showStep(current + 1);
        showToast("پاسخ‌ها موقت ذخیره شد.");
      });
    });
    $$("[data-prev-step]", root).forEach((button) =>
      button.addEventListener("click", () => showStep(current - 1)),
    );
    $$("[data-save-exit]", root).forEach((button) =>
      button.addEventListener("click", () => {
        localStorage.setItem(`${storageKey}:step`, String(current));
        showToast("پاسخ‌ها ذخیره شد؛ هر زمان آماده بودید ادامه دهید.");
      }),
    );
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateVisibleStep()) return;
      const loading = $("#onboarding-loading");
      const success = $("#onboarding-success");
      steps.forEach((step) => (step.hidden = true));
      if (loading) loading.hidden = false;
      window.setTimeout(() => {
        if (loading) loading.hidden = true;
        if (success) success.hidden = false;
        localStorage.setItem("avocado:onboarding-complete", "true");
        showToast("اطلاعات شما ذخیره شد.");
      }, 900);
    });
    showStep(current);
  }

  renderPrimaryNavigation();
  setupTabs();
  setupExtendedProduct();
  setupQuickLog();
  normalizeTopbarActions();
  applyUserAvatarIcons();
  if (page === "landing") setupLanding();
  if (page === "auth") setupAuth();
  if (page === "otp") setupOtp();
  if (page === "welcome") setupWelcome();
  if (["dashboard", "log", "plans", "food-log", "meal-plan"].includes(page)) setupFoodFlow();
  if (page === "profile") setupProfile();
  if (page === "settings") setupSettingsPage();
  if (page === "onboarding") setupOnboarding();
})();
