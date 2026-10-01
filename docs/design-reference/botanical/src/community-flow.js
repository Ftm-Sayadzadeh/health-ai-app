(function () {
  "use strict";

  const PAGE = document.body?.dataset.page || "";
  if (
    ![
      "community",
      "group-detail",
      "challenge-detail",
      "settings",
      "dashboard",
      "notifications",
    ].includes(PAGE)
  ) {
    return;
  }

  const STORAGE_KEY = "avocado:community-flow-v1";
  const SCENARIO = new URLSearchParams(window.location.search).get("scenario") || "";
  const GROUP_ID = new URLSearchParams(window.location.search).get("group") || "";
  const CHALLENGE_ID = new URLSearchParams(window.location.search).get("challenge") || "";
  const INVITE_CODE = new URLSearchParams(window.location.search).get("invite") || "";
  const TODAY = dateOnlyLocal();
  const CURRENT_USER_ID = "user-sara";
  const LEGACY_WEEKDAY_OPTIONS = [
    { value: 6, label: "شنبه" },
    { value: 0, label: "یکشنبه" },
    { value: 1, label: "دوشنبه" },
    { value: 2, label: "سه‌شنبه" },
    { value: 3, label: "چهارشنبه" },
    { value: 4, label: "پنج‌شنبه" },
    { value: 5, label: "جمعه" },
  ];
  const WEEKDAY_OPTIONS = [
    { value: 6, label: "شنبه" },
    { value: 0, label: "یکشنبه" },
    { value: 1, label: "دوشنبه" },
    { value: 2, label: "سه‌شنبه" },
    { value: 3, label: "چهارشنبه" },
    { value: 4, label: "پنج‌شنبه" },
    { value: 5, label: "جمعه" },
  ];
  const CHALLENGE_CATEGORY_OPTIONS = [
    ["nutrition", "تغذیه"],
    ["workout", "تمرین"],
    ["water", "آب"],
    ["sleep", "خواب"],
    ["consistency", "استمرار"],
    ["wellbeing", "حال خوب"],
    ["custom", "سفارشی"],
  ];
  const CHALLENGE_LOCATION_OPTIONS = [
    ["group", "داخل یک گروه"],
    ["private", "خصوصی با دعوت"],
    ["public", "قابل مشاهده برای همه"],
  ];
  const GOAL_TYPE_OPTIONS = [
    ["daily", "انجام روزانه"],
    ["weekly", "تعداد دفعات در هفته"],
    ["amount", "رسیدن به مقدار مشخص"],
    ["streak", "استمرار چندروزه"],
    ["custom", "هدف سفارشی"],
  ];
  const TRACKING_OPTIONS = [
    ["simple", "تأیید ساده انجام‌شدن"],
    ["value", "ثبت مقدار"],
    ["linked", "اتصال اختیاری به یک ثبت موجود در آووکادو"],
  ];
  const PRIVACY_OPTIONS = [
    ["completion", "نمایش فقط انجام‌شدن"],
    ["percent", "نمایش درصد پیشرفت"],
    ["exact", "نمایش مقدار انتخاب‌شده"],
    ["anonymous", "حضور ناشناس"],
  ];

  let memoryState = null;
  let storageError = false;
  let liveRegion = null;
  let toastTimer = null;
  const dialogOpeners = new WeakMap();

  function dateOnlyLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function parseDateOnly(value) {
    if (!value) return null;
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function addDays(date, offset) {
    const parsed = parseDateOnly(date) || new Date();
    parsed.setDate(parsed.getDate() + offset);
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function compareDateOnly(a, b) {
    if (!a || !b) return 0;
    return a.localeCompare(b);
  }

  function dateRangeLabel(start, end) {
    return `${persianDate(start)} تا ${persianDate(end)}`;
  }

  function persianDate(value) {
    if (!value) return "—";
    const parsed = parseDateOnly(value) || new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsed);
  }

  function persianDateTime(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  }

  function toPersianNumber(value) {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uniqueNumbers(input, fallback = []) {
    const source = Array.isArray(input) ? input : fallback;
    return [...new Set(source.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6))];
  }

  function optionsMarkup(options, selectedValue) {
    return options
      .map(
        ([value, label]) =>
          `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${label}</option>`
      )
      .join("");
  }

  function selectedValues(form, name) {
    return Array.from(form.querySelectorAll(`[name="${name}"]:checked`)).map((input) => input.value);
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".field-error").forEach((node) => node.remove());
    form.querySelectorAll(".is-invalid").forEach((node) => node.classList.remove("is-invalid"));
  }

  function setFieldError(field, message) {
    if (!field) return;
    field.classList.add("is-invalid");
    const host = field.closest(".field, .community-fieldset, .community-inline-box") || field.parentElement;
    if (!host) return;
    const error = document.createElement("small");
    error.className = "field-error";
    error.textContent = message;
    host.appendChild(error);
  }

  function ensureLiveRegion() {
    if (liveRegion) return liveRegion;
    liveRegion = document.createElement("div");
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  function announce(message) {
    const region = ensureLiveRegion();
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  function showToast(message) {
    let toast = document.getElementById("community-global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "community-global-toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.hidden = true;
      toast.innerHTML = `
        <span class="toast__check" aria-hidden="true">✓</span>
        <span id="community-global-toast-message"></span>
        <button type="button" id="community-global-toast-close">بستن</button>
      `;
      document.body.appendChild(toast);
      toast.querySelector("button")?.addEventListener("click", () => {
        toast.hidden = true;
      });
    }
    const label = document.getElementById("community-global-toast-message");
    if (label) label.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (parsed) {
        const normalized = normalizeState(parsed);
        memoryState = normalized;
        storageError = false;
        return normalized;
      }
    } catch (_) {
      storageError = true;
    }
    try {
      if (memoryState) return normalizeState(memoryState);
    } catch (_) {
      storageError = true;
    }
    const fallback = defaultState();
    memoryState = fallback;
    return normalizeState(fallback);
  }

  function writeState(nextState) {
    const normalized = normalizeState(nextState);
    memoryState = normalized;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      storageError = false;
    } catch (_) {
      storageError = true;
    }
    return normalized;
  }

  function roleRank(role) {
    return { owner: 3, admin: 2, member: 1, pending: 0, outsider: -1 }[role] ?? -1;
  }

  function groupInvite(code, type, targetId, label) {
    return {
      code,
      status: "sent",
      type,
      targetId,
      label,
      sentAt: `${TODAY}T10:00:00+03:30`,
    };
  }

  function defaultState() {
    const todayDone = CHALLENGE_ID === "hydration-circle" ? false : false;
    return {
      currentUserId: CURRENT_USER_ID,
      users: [
        { id: CURRENT_USER_ID, name: "سارا", avatar: "س", streak: 5 },
        { id: "user-mahna", name: "مهناز", avatar: "م", streak: 8 },
        { id: "user-amin", name: "امین", avatar: "ا", streak: 4 },
        { id: "user-saba", name: "صبا", avatar: "ص", streak: 6 },
        { id: "user-hoda", name: "هدا", avatar: "ه", streak: 3 },
      ],
      groups: [
        {
          id: "group-habit-circle",
          name: "حلقه عادت‌های آرام",
          description: "گروهی برای ادامه‌دادن عادت‌های کوچک با همراهی بدون فشار.",
          category: "حمایت و استمرار",
          privacy: "private",
          joinPolicy: "approval",
          visibility: "discoverable",
          image: "🤝",
          ownerId: CURRENT_USER_ID,
          admins: ["user-mahna"],
          members: [CURRENT_USER_ID, "user-mahna", "user-amin", "user-saba"],
          rules: ["با لحن حمایتی بنویسیم.", "جزئیات خصوصی دیگران را نپرسیم."],
          allowChallengeCreation: "admins",
          challengeIds: ["challenge-hydration-circle"],
          muted: false,
          archived: false,
          createdAt: "2026-07-01",
          activityCount: 3,
          pendingMembers: ["user-hoda"],
          blockedMembers: [],
          invitations: [groupInvite("HABIT-1405", "group", "group-habit-circle", "دعوت به حلقه عادت‌های آرام")],
        },
        {
          id: "group-morning-move",
          name: "صبح‌های پرتحرک",
          description: "برای کسانی که می‌خواهند شروع روز را با حرکت کوتاه نگه دارند.",
          category: "ورزش",
          privacy: "public",
          joinPolicy: "open",
          visibility: "discoverable",
          image: "🏃",
          ownerId: "user-amin",
          admins: ["user-amin"],
          members: [CURRENT_USER_ID, "user-amin", "user-saba"],
          rules: ["حرکت را با توان خودت تنظیم کن."],
          allowChallengeCreation: "owner",
          challengeIds: ["challenge-morning-streak"],
          muted: false,
          archived: false,
          createdAt: "2026-06-25",
          activityCount: 1,
          pendingMembers: [],
          blockedMembers: [],
          invitations: [],
        },
        {
          id: "group-private-balance",
          name: "تعادل شخصی",
          description: "جمعی آرام برای مرور خواب، آب و حال خوب.",
          category: "سبک زندگی",
          privacy: "invite-only",
          joinPolicy: "invite",
          visibility: "link-only",
          image: "🌿",
          ownerId: "user-saba",
          admins: ["user-saba"],
          members: ["user-saba", "user-hoda"],
          rules: ["هر کسی فقط به اندازه راحتی خودش به اشتراک می‌گذارد."],
          allowChallengeCreation: "admins",
          challengeIds: [],
          muted: false,
          archived: false,
          createdAt: "2026-07-08",
          activityCount: 0,
          pendingMembers: [],
          blockedMembers: [],
          invitations: [groupInvite("BALANCE-1405", "group", "group-private-balance", "دعوت به تعادل شخصی")],
        },
      ],
      challenges: [
        {
          id: "challenge-hydration-circle",
          groupId: "group-habit-circle",
          title: "هفت روز آب کافی",
          description: "هر روز فقط انجام‌شدن نوشیدن آب کافی را ثبت می‌کنیم؛ مقدار دقیق برای خودت می‌ماند مگر خودت انتخاب کنی.",
          image: "💧",
          category: "آب",
          goalType: "daily",
          target: { kind: "simple", label: "تأیید ساده انجام‌شدن" },
          startDate: addDays(TODAY, -2),
          endDate: addDays(TODAY, 4),
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          checkInDeadline: "21:30",
          visibility: "group",
          privacySettings: {
            defaultShare: "completion",
            allowExactValue: false,
            allowAnonymous: true,
          },
          reminder: true,
          memberLimit: 12,
          approvalRequired: false,
          rules: ["فقط انجام‌شدن را به اشتراک بگذار.", "اگر ثبت نشد، فردا ادامه بده."],
          canLeaveAfterStart: true,
          participants: [CURRENT_USER_ID, "user-mahna", "user-amin"],
          pendingParticipants: [],
          creatorId: CURRENT_USER_ID,
          status: "active",
          optInLeaderboard: false,
          invitations: [groupInvite("WATER-1405", "challenge", "challenge-hydration-circle", "دعوت به چالش آب")],
        },
        {
          id: "challenge-morning-streak",
          groupId: "group-morning-move",
          title: "سه جلسه حرکت صبحگاهی",
          description: "سه بار در هفته فقط انجام‌شدن حرکت صبحگاهی را ثبت می‌کنیم.",
          image: "☀️",
          category: "تمرین",
          goalType: "weekly",
          target: { kind: "count", label: "۳ بار در هفته" },
          startDate: addDays(TODAY, 1),
          endDate: addDays(TODAY, 14),
          activeDays: [1, 3, 5],
          checkInDeadline: "11:00",
          visibility: "group",
          privacySettings: {
            defaultShare: "completion",
            allowExactValue: false,
            allowAnonymous: false,
          },
          reminder: true,
          memberLimit: 30,
          approvalRequired: false,
          rules: ["فقط با توان خودت پیش برو."],
          canLeaveAfterStart: true,
          participants: [CURRENT_USER_ID, "user-amin", "user-saba"],
          pendingParticipants: [],
          creatorId: "user-amin",
          status: "scheduled",
          optInLeaderboard: false,
          invitations: [],
        },
        {
          id: "challenge-sleep-soft",
          groupId: null,
          title: "خواب آرام‌تر",
          description: "مرور هفتگی خواب با لحن حمایتی و بدون مقایسه مستقیم.",
          image: "🌙",
          category: "خواب",
          goalType: "streak",
          target: { kind: "streak", label: "۴ شب ثبت پیاپی" },
          startDate: addDays(TODAY, -14),
          endDate: addDays(TODAY, -4),
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          checkInDeadline: "09:00",
          visibility: "public",
          privacySettings: {
            defaultShare: "percent",
            allowExactValue: false,
            allowAnonymous: false,
          },
          reminder: false,
          memberLimit: 50,
          approvalRequired: false,
          rules: ["اگر ثبت نشد، فقط ادامه را از امروز بگیر."],
          canLeaveAfterStart: true,
          participants: [CURRENT_USER_ID, "user-hoda"],
          pendingParticipants: [],
          creatorId: "user-hoda",
          status: "finished",
          optInLeaderboard: false,
          invitations: [],
        },
      ],
      posts: [
        {
          id: "post-1",
          groupId: "group-habit-circle",
          authorId: "user-mahna",
          content: "امروز برای ثبت آب فقط گذاشتم یادآوری سر ظهر روشن بماند و کمک کرد.",
          image: "",
          topic: "عادت روزانه",
          reactions: { support: 3, bravo: 2, inspired: 1 },
          userReaction: "",
          replies: [
            { id: "reply-1", authorId: CURRENT_USER_ID, content: "من هم از یادآوری عصر استفاده کردم و خوب بود.", createdAt: `${TODAY}T11:20:00+03:30` },
          ],
          pinned: true,
          visibility: "group",
          onlyManagers: false,
          createdAt: `${TODAY}T09:20:00+03:30`,
          savedBy: [],
        },
        {
          id: "post-2",
          groupId: "group-habit-circle",
          authorId: CURRENT_USER_ID,
          content: "امروز ثبت صبحگاهی‌ام زودتر انجام شد و حس کردم ادامه‌دادن راحت‌تر شد.",
          image: "",
          topic: "Check-in",
          reactions: { support: 2, bravo: 1, inspired: 2 },
          userReaction: "support",
          replies: [],
          pinned: false,
          visibility: "group",
          onlyManagers: false,
          createdAt: `${TODAY}T08:40:00+03:30`,
          savedBy: [CURRENT_USER_ID],
        },
      ],
      checkIns: [
        {
          id: "checkin-1",
          challengeId: "challenge-hydration-circle",
          userId: CURRENT_USER_ID,
          date: addDays(TODAY, -2),
          completed: true,
          value: null,
          note: "صبح زود ثبت شد.",
          visibility: "completion",
          mood: "آرام",
          createdAt: `${addDays(TODAY, -2)}T10:00:00+03:30`,
          updatedAt: `${addDays(TODAY, -2)}T10:00:00+03:30`,
        },
        {
          id: "checkin-2",
          challengeId: "challenge-hydration-circle",
          userId: CURRENT_USER_ID,
          date: addDays(TODAY, -1),
          completed: true,
          value: null,
          note: "ثبت عصر انجام شد.",
          visibility: "completion",
          mood: "خوب",
          createdAt: `${addDays(TODAY, -1)}T18:10:00+03:30`,
          updatedAt: `${addDays(TODAY, -1)}T18:10:00+03:30`,
        },
        {
          id: "checkin-3",
          challengeId: "challenge-hydration-circle",
          userId: "user-mahna",
          date: TODAY,
          completed: true,
          value: null,
          note: "ثبت امروز انجام شد.",
          visibility: "completion",
          mood: "پرانرژی",
          createdAt: `${TODAY}T09:45:00+03:30`,
          updatedAt: `${TODAY}T09:45:00+03:30`,
        },
      ],
      invites: [
        { id: "invite-group-1", type: "group", targetId: "group-private-balance", status: "sent", from: "صبا", code: "BALANCE-1405", expiresAt: addDays(TODAY, 5) },
        { id: "invite-challenge-1", type: "challenge", targetId: "challenge-hydration-circle", status: "sent", from: "مهناز", code: "WATER-1405", expiresAt: addDays(TODAY, 2) },
      ],
      draft: {
        communityTab: "for-you",
        groupFilter: "all",
        challengeFilter: "all",
      },
    };
  }

  function normalizeState(input) {
    const base = clone(defaultState());
    const normalizedGroups = Array.isArray(input?.groups)
      ? input.groups.map((group) => ({
          ...group,
          admins: Array.isArray(group?.admins) ? group.admins : [],
          members: Array.isArray(group?.members) ? group.members : [],
          rules: Array.isArray(group?.rules) ? group.rules.filter(Boolean) : [],
          challengeIds: Array.isArray(group?.challengeIds) ? group.challengeIds : [],
          pendingMembers: Array.isArray(group?.pendingMembers) ? group.pendingMembers : [],
          blockedMembers: Array.isArray(group?.blockedMembers) ? group.blockedMembers : [],
          invitations: Array.isArray(group?.invitations) ? group.invitations : [],
          muted: Boolean(group?.muted),
          archived: Boolean(group?.archived),
        }))
      : base.groups;
    const normalizedChallenges = Array.isArray(input?.challenges)
      ? input.challenges.map((challenge) => ({
          ...challenge,
          activeDays: uniqueNumbers(challenge?.activeDays, [0, 1, 2, 3, 4, 5, 6]),
          rules: Array.isArray(challenge?.rules) ? challenge.rules.filter(Boolean) : [],
          participants: Array.isArray(challenge?.participants) ? challenge.participants : [],
          pendingParticipants: Array.isArray(challenge?.pendingParticipants) ? challenge.pendingParticipants : [],
          privacySettings: {
            defaultShare: "completion",
            allowExactValue: false,
            allowAnonymous: false,
            showPercent: true,
            showNote: false,
            showImage: false,
            ...(challenge?.privacySettings || {}),
          },
          invitations: Array.isArray(challenge?.invitations) ? challenge.invitations : [],
        }))
      : base.challenges;
    return {
      ...base,
      ...input,
      users: Array.isArray(input?.users) ? input.users : base.users,
      groups: normalizedGroups,
      challenges: normalizedChallenges,
      posts: Array.isArray(input?.posts) ? input.posts : base.posts,
      checkIns: Array.isArray(input?.checkIns)
        ? input.checkIns.map((entry) => ({
            ...entry,
            sharedFields: {
              note: false,
              image: false,
              ...(entry?.sharedFields || {}),
            },
          }))
        : base.checkIns,
      invites: Array.isArray(input?.invites) ? input.invites : base.invites,
      draft: {
        ...base.draft,
        ...(input?.draft || {}),
      },
    };
  }

  function getUser(state, id) {
    return state.users.find((item) => item.id === id) || null;
  }

  function currentUser(state) {
    return getUser(state, state.currentUserId);
  }

  function getGroup(state, id) {
    return state.groups.find((item) => item.id === id) || state.groups[0] || null;
  }

  function getChallenge(state, id) {
    return state.challenges.find((item) => item.id === id) || state.challenges[0] || null;
  }

  function groupRole(state, group) {
    if (!group) return "outsider";
    if (group.ownerId === state.currentUserId) return "owner";
    if (group.admins.includes(state.currentUserId)) return "admin";
    if (group.members.includes(state.currentUserId)) return "member";
    if (group.pendingMembers.includes(state.currentUserId)) return "pending";
    return "outsider";
  }

  function canManageGroup(state, group) {
    return roleRank(groupRole(state, group)) >= 2;
  }

  function canCreateChallenge(state, group) {
    const role = groupRole(state, group);
    if (group.allowChallengeCreation === "owner") return role === "owner";
    if (group.allowChallengeCreation === "admins") return role === "owner" || role === "admin";
    return role === "owner" || role === "admin" || role === "member";
  }

  function eligibleChallengeGroups(state) {
    return state.groups.filter((group) => canCreateChallenge(state, group) && !group.archived);
  }

  function hasPendingInvite(state, type, targetId) {
    return state.invites.some(
      (invite) => invite.type === type && invite.targetId === targetId && invite.status === "sent"
    );
  }

  function hasGroupInvite(state, groupId) {
    return state.invites.some(
      (invite) => invite.type === "group" && invite.targetId === groupId && invite.status === "sent"
    );
  }

  function challengeStatus(challenge) {
    if (challenge.status === "finished") return "finished";
    if (compareDateOnly(TODAY, challenge.startDate) < 0) return "scheduled";
    if (compareDateOnly(TODAY, challenge.endDate) > 0) return "finished";
    return "active";
  }

  function checkInsFor(state, challengeId, userId = state.currentUserId) {
    return state.checkIns.filter((item) => item.challengeId === challengeId && item.userId === userId);
  }

  function todayCheckIn(state, challengeId, userId = state.currentUserId) {
    return state.checkIns.find((item) => item.challengeId === challengeId && item.userId === userId && item.date === TODAY) || null;
  }

  function userChallengeState(state, challenge) {
    if (!challenge) return "outsider";
    if (challenge.participants.includes(state.currentUserId)) return "participant";
    if (challenge.pendingParticipants.includes(state.currentUserId)) return "pending";
    return "outsider";
  }

  function challengeProgress(state, challenge, userId = state.currentUserId) {
    const entries = checkInsFor(state, challenge.id, userId).sort((a, b) => a.date.localeCompare(b.date));
    const totalDays = Math.max(
      1,
      Math.floor((parseDateOnly(challenge.endDate) - parseDateOnly(challenge.startDate)) / 86400000) + 1
    );
    const doneDays = entries.filter((item) => item.completed).length;
    let streak = 0;
    let best = 0;
    entries.forEach((entry) => {
      if (entry.completed) {
        streak += 1;
        best = Math.max(best, streak);
      } else {
        streak = 0;
      }
    });
    return {
      percent: Math.round((doneDays / totalDays) * 100),
      doneDays,
      totalDays,
      streak,
      best,
    };
  }

  function personalStats(state) {
    const myGroups = state.groups.filter((group) => group.members.includes(state.currentUserId));
    const myActiveChallenges = state.challenges.filter(
      (challenge) =>
        challenge.participants.includes(state.currentUserId) && challengeStatus(challenge) === "active"
    );
    const thisWeekCount = state.checkIns.filter(
      (item) => item.userId === state.currentUserId && compareDateOnly(item.date, addDays(TODAY, -6)) >= 0
    ).length;
    const streak = currentUser(state)?.streak || 0;
    return {
      groups: myGroups.length,
      activeChallenges: myActiveChallenges.length,
      thisWeekCount,
      streak,
    };
  }

  function invitePreview(state, type, targetId) {
    if (type === "group") {
      const group = getGroup(state, targetId);
      if (!group) return null;
      return {
        title: group.name,
        description: group.description,
        rules: group.rules,
        meta: `${privacyLabel(group.privacy)} · ${toPersianNumber(group.members.length)} عضو`,
      };
    }
    const challenge = getChallenge(state, targetId);
    if (!challenge) return null;
    return {
      title: challenge.title,
      description: challenge.description,
      rules: challenge.rules,
      meta: `${challengeCategoryLabel(challenge.category)} · ${dateRangeLabel(challenge.startDate, challenge.endDate)}`,
    };
  }

  function privacyLabel(value) {
    return {
      public: "عمومی",
      private: "خصوصی",
      "invite-only": "فقط با دعوت",
    }[value] || "عمومی";
  }

  function joinPolicyLabel(value) {
    return {
      open: "عمومی",
      approval: "نیازمند تأیید مدیر",
      invite: "فقط با دعوت",
    }[value] || "عمومی";
  }

  function challengeCategoryLabel(value) {
    if (value === "consistency") return "استمرار";
    return {
      nutrition: "تغذیه",
      workout: "تمرین",
      water: "آب",
      sleep: "خواب",
      streak: "استمرار",
      wellbeing: "حال خوب",
      custom: "سفارشی",
    }[value] || value;
  }

  function goalTypeLabel(value) {
    return {
      daily: "انجام روزانه",
      weekly: "تعداد دفعات در هفته",
      amount: "رسیدن به مقدار مشخص",
      streak: "استمرار چندروزه",
      custom: "هدف سفارشی",
    }[value] || value;
  }

  function statusPill(label, tone) {
    return `<span class="community-pill" data-tone="${tone}">${label}</span>`;
  }

  function ensureDialog(id, klass, title, bodyMarkup) {
    let dialog = document.getElementById(id);
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = id;
    dialog.className = klass;
    dialog.innerHTML = bodyMarkup(title);
    document.body.appendChild(dialog);
    return dialog;
  }

  function openDialog(dialog, opener) {
    if (!dialog) return;
    dialogOpeners.set(dialog, opener || document.activeElement);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    const opener = dialogOpeners.get(dialog);
    if (opener && typeof opener.focus === "function") {
      requestAnimationFrame(() => opener.focus());
    }
  }

  function bindDismiss(dialog) {
    if (!dialog) return;
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  }

  function closeOpenDetails(container = document) {
    container.querySelectorAll("details[open]").forEach((detail) => {
      detail.open = false;
    });
  }

  function bindGlobalDetailsClose(scope = document) {
    scope.addEventListener("click", (event) => {
      const detail = event.target.closest("details");
      if (!detail) {
        closeOpenDetails(scope);
        return;
      }
      scope.querySelectorAll("details[open]").forEach((item) => {
        if (item !== detail) item.open = false;
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeOpenDetails(scope);
    });
  }

  function getScenarioState() {
    const state = readState();
    if (!SCENARIO) return { mode: "normal", state };
    const next = clone(state);
    if (SCENARIO === "loading") return { mode: "loading", state: next };
    if (SCENARIO === "error") return { mode: "error", state: next };
    if (SCENARIO === "offline") return { mode: "offline", state: next };
    if (SCENARIO === "empty") {
      next.groups = [];
      next.challenges = [];
      next.posts = [];
      next.invites = [];
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "no-results") {
      next.draft.groupQuery = "zz";
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "invite-invalid") return { mode: "invalid-invite", state: next };
    if (SCENARIO === "private-group") {
      next.draft.forceGroupId = "group-private-balance";
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "group-archived") {
      const group = getGroup(next, "group-habit-circle");
      if (group) group.archived = true;
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "pending-group") {
      const group = getGroup(next, "group-private-balance");
      if (group && !group.pendingMembers.includes(CURRENT_USER_ID)) group.pendingMembers.push(CURRENT_USER_ID);
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "nonmember") {
      const group = getGroup(next, GROUP_ID || "group-private-balance");
      next.groups = next.groups.map((item) => ({
        ...item,
        members: item.members.filter((id) => id !== CURRENT_USER_ID),
        pendingMembers: item.pendingMembers.filter((id) => id !== CURRENT_USER_ID),
      }));
      if (group) next.draft.forceGroupId = group.id;
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "manager") {
      const group = getGroup(next, "group-habit-circle");
      if (group && !group.admins.includes(CURRENT_USER_ID)) group.admins.push(CURRENT_USER_ID);
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "challenge-finished") {
      const challenge = getChallenge(next, CHALLENGE_ID || "challenge-hydration-circle");
      if (challenge) {
        challenge.startDate = addDays(TODAY, -10);
        challenge.endDate = addDays(TODAY, -1);
        challenge.status = "finished";
      }
      return { mode: "normal", state: next };
    }
    if (SCENARIO === "checkin-done") {
      if (!todayCheckIn(next, "challenge-hydration-circle")) {
        next.checkIns.push({
          id: `checkin-${Date.now()}`,
          challengeId: "challenge-hydration-circle",
          userId: CURRENT_USER_ID,
          date: TODAY,
          completed: true,
          value: null,
          note: "امروز ثبت شد.",
          visibility: "completion",
          mood: "خوب",
          createdAt: `${TODAY}T09:20:00+03:30`,
          updatedAt: `${TODAY}T09:20:00+03:30`,
        });
      }
      return { mode: "normal", state: next };
    }
    return { mode: "normal", state: next };
  }

  function renderStatePanel(title, copy, actionMarkup = "") {
    return `
      <section class="community-empty" data-od-id="community-state">
        <div class="community-empty__art">ج</div>
        <h2>${title}</h2>
        <p>${copy}</p>
        ${actionMarkup}
      </section>
    `;
  }

  function communitySummaryMarkup(stats) {
    return `
      <section class="community-summary" data-od-id="community-summary">
        <div class="community-card__head">
          <h2>خلاصه فعالیت من</h2>
          ${storageError ? statusPill("ذخیره محلی در دسترس نیست", "warning") : ""}
        </div>
        <div class="community-metrics">
          <div class="community-metric"><span>گروه‌های عضو</span><strong>${toPersianNumber(stats.groups)}</strong></div>
          <div class="community-metric"><span>چالش‌های فعال</span><strong>${toPersianNumber(stats.activeChallenges)}</strong></div>
          <div class="community-metric"><span>Check-in این هفته</span><strong>${toPersianNumber(stats.thisWeekCount)}</strong></div>
          <div class="community-metric"><span>استمرار فعلی</span><strong>${toPersianNumber(stats.streak)} روز</strong></div>
        </div>
      </section>
    `;
  }

  function renderCommunityPage() {
    const root = document.getElementById("community-root");
    if (!root) return;
    const scenario = getScenarioState();
    const state = scenario.state;
    if (scenario.mode === "loading") {
      root.innerHTML = `
        <section class="state-panel" data-state="loading" data-od-id="community-loading">
          <span></span><span></span><span></span>
        </section>
      `;
      return;
    }
    if (scenario.mode === "error") {
      root.innerHTML = renderStatePanel(
        "اطلاعات گروه‌ها فعلاً در دسترس نیست",
        "برای دیدن تازه‌ترین گروه‌ها و چالش‌ها دوباره تلاش کن.",
        '<button class="button button--secondary" type="button" id="community-retry">تلاش دوباره</button>'
      );
      root.querySelector("#community-retry")?.addEventListener("click", renderCommunityPage);
      return;
    }
    if (scenario.mode === "offline") {
      root.innerHTML = renderStatePanel(
        "الان آفلاین هستی",
        "داده‌های ذخیره‌شده هنوز دیده می‌شوند و وقتی اتصال برگردد می‌توانی ادامه بدهی.",
        '<button class="button button--secondary" type="button" id="community-offline-retry">بازخوانی</button>'
      );
      root.querySelector("#community-offline-retry")?.addEventListener("click", renderCommunityPage);
      return;
    }
    const stats = personalStats(state);
    const myGroups = state.groups.filter((group) => group.members.includes(state.currentUserId));
    const myChallenges = state.challenges.filter((challenge) => challenge.participants.includes(state.currentUserId));
    const activeChallenge = myChallenges.find((item) => challengeStatus(item) === "active");
    const invites = state.invites.filter((item) => item.status === "sent");
    const forYouGroups = state.groups.filter((group) => !group.members.includes(state.currentUserId)).slice(0, 2);
    const suggestedChallenges = state.challenges.filter((challenge) => !challenge.participants.includes(state.currentUserId)).slice(0, 2);
    const draftTab = state.draft.communityTab || "for-you";
    const groupFilter = state.draft.groupFilter || "all";
    const challengeFilter = state.draft.challengeFilter || "all";
    const groupQuery = state.draft.groupQuery || "";
    const challengeQuery = state.draft.challengeQuery || "";

    function filterGroups() {
      return myGroups.filter((group) => {
        const matchesQuery =
          !groupQuery ||
          `${group.name} ${group.description} ${group.category}`.includes(groupQuery);
        const role = groupRole(state, group);
        const matchesFilter =
          groupFilter === "all" ||
          (groupFilter === "active" && group.activityCount > 0) ||
          (groupFilter === "managed" && (role === "owner" || role === "admin"));
        return matchesQuery && matchesFilter;
      });
    }

    function filterChallenges() {
      return state.challenges.filter((challenge) => {
        const joined = challenge.participants.includes(state.currentUserId);
        const matchesQuery =
          !challengeQuery ||
          `${challenge.title} ${challenge.description} ${challengeCategoryLabel(challenge.category)}`.includes(challengeQuery);
        const matchesFilter =
          challengeFilter === "all" || challenge.category === challengeFilter;
        return matchesQuery && matchesFilter && (joined || challenge.visibility === "public" || challenge.visibility === "group");
      });
    }

    root.innerHTML = `
      <section class="community-shell" data-od-id="community-shell">
        <div class="community-header">
          <div class="community-header__copy">
            <h1>گروه‌ها و چالش‌ها</h1>
            <p>کنار آدم‌هایی با هدف‌های مشابه پیش برو و عادت‌های سالم را با حمایت جمعی ادامه بده.</p>
          </div>
          <details class="community-create-menu">
            <summary>ایجاد</summary>
            <div class="community-menu">
              <button type="button" data-open-create="group">ساخت گروه</button>
              <button type="button" data-open-create="challenge">ساخت چالش</button>
            </div>
          </details>
        </div>
        ${communitySummaryMarkup(stats)}
        <div class="community-tabbar" role="tablist" aria-label="تب‌های اجتماعی">
          <button type="button" role="tab" aria-selected="${String(draftTab === "for-you")}" data-community-tab="for-you">برای من</button>
          <button type="button" role="tab" aria-selected="${String(draftTab === "my-groups")}" data-community-tab="my-groups">گروه‌های من</button>
          <button type="button" role="tab" aria-selected="${String(draftTab === "challenges")}" data-community-tab="challenges">چالش‌ها</button>
        </div>

        <section class="community-tab-panel ${draftTab === "for-you" ? "is-active" : ""}" data-community-panel="for-you">
          ${
            activeChallenge
              ? `<article class="community-card" data-od-id="community-today-checkin">
                  <div class="community-card__head--split">
                    <div>
                      <div class="community-card__kicker">Check-in موردنیاز امروز</div>
                      <h2>${activeChallenge.title}</h2>
                      <p>${todayCheckIn(state, activeChallenge.id) ? "ثبت امروز انجام شده و می‌توانی آن را ویرایش کنی." : "ثبت امروز هنوز انجام نشده است؛ فقط با تأیید خودت ثبت می‌شود."}</p>
                    </div>
                    <a class="button ${todayCheckIn(state, activeChallenge.id) ? "button--secondary" : "button--primary"}" href="challenge-detail-botanical.html?challenge=${activeChallenge.id}">
                      ${todayCheckIn(state, activeChallenge.id) ? "ویرایش ثبت امروز" : "ثبت امروز"}
                    </a>
                  </div>
                </article>`
              : ""
          }

          <div class="community-shell--community">
            <div class="community-section-stack">
              <article class="community-card" data-od-id="community-active-challenges">
                <div class="community-section-title"><h2>چالش‌های فعال من</h2></div>
                <div class="community-card-grid">
                  ${
                    myChallenges.length
                      ? myChallenges
                          .filter((item) => challengeStatus(item) !== "finished")
                          .map((item) => challengeCardMarkup(state, item, "continue"))
                          .join("")
                      : emptyInline("هنوز چالش فعالی نداری", "می‌توانی به یکی از پیشنهادها بپیوندی یا چالش خودت را بسازی.")
                  }
                </div>
              </article>

              <article class="community-card" data-od-id="community-latest-activity">
                <div class="community-section-title"><h2>آخرین فعالیت گروه‌ها</h2></div>
                <div class="community-activity-stack">
                  ${latestActivityMarkup(state)}
                </div>
              </article>
            </div>

            <aside class="community-sidebar">
              <article class="community-card" data-od-id="community-suggestions">
                <div class="community-section-title"><h2>پیشنهادهای مرتبط</h2></div>
                <div class="community-section-stack">
                  ${forYouGroups.map((group) => groupSuggestionMarkup(state, group)).join("")}
                  ${suggestedChallenges.map((challenge) => challengeCardMarkup(state, challenge, "join")).join("")}
                </div>
              </article>

              <article class="community-card" data-od-id="community-invites">
                <div class="community-section-title"><h2>دعوت‌های دریافت‌شده</h2></div>
                <div class="community-section-stack">
                  ${invites.length ? invites.map((invite) => inviteCardMarkup(state, invite)).join("") : emptyInline("دعوت تازه‌ای نداری", "وقتی دعوتی برسد، همین‌جا می‌بینی و قبل از پذیرش می‌توانی جزئیاتش را مرور کنی.")}
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section class="community-tab-panel ${draftTab === "my-groups" ? "is-active" : ""}" data-community-panel="my-groups">
          <article class="community-card" data-od-id="community-groups-list">
            <div class="community-search-shell">
              <input type="search" placeholder="جست‌وجو در گروه‌های من" value="${escapeHtml(groupQuery)}" id="community-group-search" />
              <a class="button button--secondary" href="#" data-open-create="group">ساخت گروه</a>
            </div>
            <div class="community-filterbar" aria-label="فیلتر گروه‌ها">
              ${filterButton("all", "همه", groupFilter)}
              ${filterButton("active", "فعال", groupFilter)}
              ${filterButton("managed", "مدیریت‌شده توسط من", groupFilter)}
            </div>
            <div class="community-section-stack" id="community-groups-results">
              ${
                filterGroups().length
                  ? filterGroups().map((group) => groupCardMarkup(state, group)).join("")
                  : renderStatePanel("هنوز عضو گروهی نیستی", "می‌توانی به یک گروه بپیوندی یا گروه خودت را بسازی.", '<div class="community-sheet__actions"><button class="button button--secondary" type="button" data-open-create="group">ساخت گروه</button></div>')
              }
            </div>
          </article>
        </section>

        <section class="community-tab-panel ${draftTab === "challenges" ? "is-active" : ""}" data-community-panel="challenges">
          <article class="community-card" data-od-id="community-challenges-list">
            <div class="community-search-shell">
              <input type="search" placeholder="جست‌وجو در چالش‌ها" value="${escapeHtml(challengeQuery)}" id="community-challenge-search" />
              <a class="button button--secondary" href="#" data-open-create="challenge">ساخت چالش</a>
            </div>
            <div class="community-filterbar" aria-label="فیلتر چالش‌ها">
              ${filterButton("all", "همه", challengeFilter)}
              ${filterButton("nutrition", "تغذیه", challengeFilter)}
              ${filterButton("workout", "تمرین", challengeFilter)}
              ${filterButton("water", "آب", challengeFilter)}
              ${filterButton("sleep", "خواب", challengeFilter)}
              ${filterButton("streak", "استمرار", challengeFilter)}
              ${filterButton("wellbeing", "حال خوب", challengeFilter)}
            </div>
            <div class="community-section-stack">
              ${
                filterChallenges().length
                  ? filterChallenges().map((challenge) => challengeCardMarkup(state, challenge, challengeAction(state, challenge))).join("")
                  : renderStatePanel("چالشی با این جست‌وجو پیدا نشد", "می‌توانی فیلتر را تغییر بدهی یا یک چالش تازه بسازی.")
              }
            </div>
          </article>
        </section>
      </section>
    `;

    bindGlobalDetailsClose(root);
    bindCommunityPageEvents(state);
  }

  function filterButton(id, label, active) {
    return `<button type="button" data-filter-id="${id}" aria-pressed="${String(active === id)}">${label}</button>`;
  }

  function emptyInline(title, copy) {
    return `
      <div class="community-empty">
        <div class="community-empty__art">ج</div>
        <h2>${title}</h2>
        <p>${copy}</p>
      </div>
    `;
  }

  function groupCardMarkup(state, group) {
    const activeChallenge = state.challenges.find((item) => item.groupId === group.id && challengeStatus(item) === "active");
    return `
      <article class="community-group-card" data-group-id="${group.id}">
        <div class="community-group-card__head">
          <div class="community-hero__title-row">
            <div class="community-symbol">${group.image}</div>
            <div class="community-group-card__body">
              <h3>${group.name}</h3>
              <p>${group.description}</p>
            </div>
          </div>
          ${statusPill(privacyLabel(group.privacy), group.privacy === "public" ? "actual" : "plan")}
        </div>
        <div class="community-meta-list">
          <span>${toPersianNumber(group.members.length)} عضو</span>
          <span>${group.category}</span>
          <span>${toPersianNumber(group.activityCount)} فعالیت جدید</span>
        </div>
        <div class="community-inline-box">
          <strong>چالش فعال گروه</strong>
          <p>${activeChallenge ? activeChallenge.title : "فعلاً چالش فعالی برای این گروه تعریف نشده است."}</p>
        </div>
        <a class="button button--secondary" href="group-detail-botanical.html?group=${group.id}">مشاهده گروه</a>
      </article>
    `;
  }

  function groupSuggestionMarkup(state, group) {
    const action =
      group.joinPolicy === "open"
        ? `<button class="button button--secondary" type="button" data-join-group="${group.id}">پیوستن</button>`
        : `<a class="button button--secondary" href="group-detail-botanical.html?group=${group.id}">مشاهده گروه</a>`;
    return `
      <article class="community-grid-card" data-od-id="suggested-group-${group.id}">
        <div class="community-hero__title-row">
          <div class="community-avatar">${group.image}</div>
          <div>
            <strong>${group.name}</strong>
            <small>${group.description}</small>
          </div>
        </div>
        <div class="community-meta-list">
          <span>${group.category}</span>
          <span>${joinPolicyLabel(group.joinPolicy)}</span>
        </div>
        ${action}
      </article>
    `;
  }

  function challengeAction(state, challenge) {
    if (challenge.participants.includes(state.currentUserId)) {
      if (challengeStatus(challenge) === "finished") return "result";
      return todayCheckIn(state, challenge.id) ? "view" : "continue";
    }
    return challenge.approvalRequired ? "request" : "join";
  }

  function challengeStatusLabel(status) {
    return {
      scheduled: "هنوز شروع نشده",
      active: "فعال",
      finished: "پایان‌یافته",
    }[status] || "فعال";
  }

  function challengeCardMarkup(state, challenge, actionMode) {
    const progress = challengeProgress(state, challenge);
    const status = challengeStatus(challenge);
    const actionLabel = {
      join: "پیوستن",
      request: "درخواست عضویت",
      continue: "ادامه",
      result: "مشاهده نتیجه",
      view: "مشاهده",
    }[actionMode];
    const actionAttr =
      actionMode === "join"
        ? `type="button" data-join-challenge="${challenge.id}"`
        : actionMode === "request"
          ? `type="button" data-request-challenge="${challenge.id}"`
          : `href="challenge-detail-botanical.html?challenge=${challenge.id}"`;
    const actionTag = actionMode === "join" || actionMode === "request" ? "button" : "a";
    return `
      <article class="community-challenge-card" data-challenge-id="${challenge.id}">
        <div class="community-challenge-card__head">
          <div class="community-hero__title-row">
            <div class="community-symbol">${challenge.image}</div>
            <div class="community-challenge-card__body">
              <h3>${challenge.title}</h3>
              <p>${challenge.description}</p>
            </div>
          </div>
          ${statusPill(challengeStatusLabel(status), status === "active" ? "actual" : status === "scheduled" ? "plan" : "warning")}
        </div>
        <div class="community-meta-list">
          <span>${challengeCategoryLabel(challenge.category)}</span>
          <span>${dateRangeLabel(challenge.startDate, challenge.endDate)}</span>
          <span>${toPersianNumber(challenge.participants.length)} شرکت‌کننده</span>
        </div>
        <div class="community-inline-box">
          <strong>پیشرفت شخصی</strong>
          <p>${toPersianNumber(progress.percent)}٪ · ${toPersianNumber(progress.doneDays)} روز انجام‌شده</p>
        </div>
        <${actionTag} class="button button--secondary" ${actionAttr}>${actionLabel}</${actionTag}>
      </article>
    `;
  }

  function latestActivityMarkup(state) {
    const group = getGroup(state, "group-habit-circle");
    const posts = state.posts
      .filter((item) => item.groupId === group.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);
    return posts
      .map((post) => {
        const author = getUser(state, post.authorId);
        return `
          <article class="community-activity-row">
            <div class="community-avatar">${author?.avatar || "ک"}</div>
            <div class="community-activity-row__body">
              <strong>${author?.name || "کاربر"} در ${group.name}</strong>
              <small>${post.content}</small>
            </div>
            <a class="community-link-row" href="group-detail-botanical.html?group=${group.id}">مشاهده</a>
          </article>
        `;
      })
      .join("");
  }

  function inviteCardMarkup(state, invite) {
    const preview = invitePreview(state, invite.type, invite.targetId);
    return `
      <article class="community-preview" data-invite-id="${invite.id}">
        <div class="community-preview__head">
          <div>
            <h3>${invite.type === "group" ? "دعوت به گروه" : "دعوت به چالش"}</h3>
            <p>${preview?.title || "پیشنهاد تازه"} · از طرف ${invite.from}</p>
          </div>
          ${statusPill("ارسال‌شده", "plan")}
        </div>
        <div class="community-meta-list">
          <span>کد دعوت: <bdi>${invite.code}</bdi></span>
          <span>تا ${persianDate(invite.expiresAt)}</span>
        </div>
        <div class="community-sheet__actions">
          <button class="button button--secondary" type="button" data-preview-invite="${invite.id}">پیش‌نمایش</button>
        </div>
      </article>
    `;
  }

  function bindCommunityPageEvents(state) {
    const root = document.getElementById("community-root");
    if (!root) return;
    root.querySelectorAll("[data-community-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        next.draft.communityTab = button.dataset.communityTab;
        writeState(next);
        renderCommunityPage();
      });
    });

    root.querySelector("#community-group-search")?.addEventListener("input", (event) => {
      const next = readState();
      next.draft.groupQuery = event.target.value.trim();
      writeState(next);
      renderCommunityPage();
    });

    root.querySelector("#community-challenge-search")?.addEventListener("input", (event) => {
      const next = readState();
      next.draft.challengeQuery = event.target.value.trim();
      writeState(next);
      renderCommunityPage();
    });

    root.querySelectorAll("[data-filter-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const panel = button.closest("[data-community-panel]");
        if (panel?.dataset.communityPanel === "my-groups") next.draft.groupFilter = button.dataset.filterId;
        else next.draft.challengeFilter = button.dataset.filterId;
        writeState(next);
        renderCommunityPage();
      });
    });

    root.querySelectorAll("[data-open-create]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        openCreateDialog(button.dataset.openCreate, state, button);
      });
    });

    root.querySelectorAll("[data-preview-invite]").forEach((button) => {
      button.addEventListener("click", () => {
        openInvitePreviewDialog(state, button.dataset.previewInvite, button);
      });
    });

    root.querySelectorAll("[data-join-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const group = getGroup(next, button.dataset.joinGroup);
        if (!group.members.includes(next.currentUserId)) group.members.push(next.currentUserId);
        writeState(next);
        showToast(`به گروه «${group.name}» پیوستی.`);
        renderCommunityPage();
      });
    });

    root.querySelectorAll("[data-join-challenge]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const challenge = getChallenge(next, button.dataset.joinChallenge);
        if (!challenge.participants.includes(next.currentUserId)) challenge.participants.push(next.currentUserId);
        writeState(next);
        showToast(`به چالش «${challenge.title}» پیوستی.`);
        renderCommunityPage();
      });
    });

    root.querySelectorAll("[data-request-challenge]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const challenge = getChallenge(next, button.dataset.requestChallenge);
        if (!challenge.pendingParticipants.includes(next.currentUserId)) challenge.pendingParticipants.push(next.currentUserId);
        writeState(next);
        showToast(`درخواست عضویت برای «${challenge.title}» ارسال شد.`);
        renderCommunityPage();
      });
    });
  }

  function createDialogMarkup(title) {
    return `
      <div class="community-dialog__panel">
        <div class="community-dialog__header">
          <div>
            <h2>${title}</h2>
            <p></p>
          </div>
          <button class="icon-button" type="button" data-close-dialog aria-label="بستن">×</button>
        </div>
        <div class="community-dialog__body"></div>
      </div>
    `;
  }

  function createSheetMarkup(title) {
    return `
      <div class="community-sheet__panel">
        <div class="community-sheet__handle" aria-hidden="true"></div>
        <div class="community-sheet__header">
          <div>
            <h2>${title}</h2>
            <p></p>
          </div>
          <button class="icon-button" type="button" data-close-dialog aria-label="بستن">×</button>
        </div>
        <div class="community-sheet__body"></div>
      </div>
    `;
  }

  function isMobileSheet() {
    return window.matchMedia("(max-width: 40rem)").matches;
  }

  function openCreateDialog(type, state, opener, preselectedGroupId = "") {
    const id = type === "group" ? "community-create-group-dialog" : "community-create-challenge-dialog";
    const dialog = ensureDialog(
      id,
      isMobileSheet() ? "community-sheet" : "community-dialog",
      type === "group" ? "ساخت گروه" : "ساخت چالش",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    const copyNode = dialog.querySelector("p");
    if (copyNode) {
      copyNode.textContent =
        type === "group"
          ? "گروه را با قوانین روشن و لحن حمایتی بساز. همه‌چیز داخل همین پنجره می‌ماند."
          : "چالش را با مرزهای روشن حریم خصوصی و روش ثبت دقیق بساز.";
    }
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = type === "group" ? createGroupFormMarkup(state) : createChallengeFormMarkupV2(state, preselectedGroupId);
    bindCreateForm(dialog, type);
    openDialog(dialog, opener);
  }

  function createGroupFormMarkup(state) {
    const existingNames = state.groups
      .filter((group) => group.ownerId === state.currentUserId)
      .map((group) => group.name)
      .join("، ");
    return `
      <form class="community-form-grid" id="community-create-group-form">
        <label class="field field--full"><span class="field__label">نام گروه</span><input name="name" required /></label>
        <label class="field field--full"><span class="field__label">توضیح کوتاه</span><textarea name="description" required></textarea></label>
        <label class="field"><span class="field__label">دسته‌بندی</span>
          <select name="category">
            <option>تغذیه</option>
            <option>ورزش</option>
            <option>کاهش یا افزایش وزن سالم</option>
            <option>سبک زندگی</option>
            <option selected>حمایت و استمرار</option>
            <option>سایر</option>
          </select>
        </label>
        <label class="field"><span class="field__label">تصویر یا نماد گروه</span><input name="image" placeholder="مثلاً 🤝" value="🤝" /></label>
        <fieldset class="community-fieldset field--full"><legend>نوع عضویت</legend>
          <div class="community-choice-grid">
            ${radioChoice("joinPolicy", "open", "عمومی", true)}
            ${radioChoice("joinPolicy", "approval", "نیازمند تأیید مدیر")}
            ${radioChoice("joinPolicy", "invite", "فقط با دعوت")}
          </div>
        </fieldset>
        <fieldset class="community-fieldset field--full"><legend>نمایش گروه</legend>
          <div class="community-choice-grid">
            ${radioChoice("visibility", "discoverable", "قابل جست‌وجو", true)}
            ${radioChoice("visibility", "link-only", "فقط با لینک")}
          </div>
        </fieldset>
        <label class="field field--full"><span class="field__label">قوانین کوتاه گروه</span><textarea name="rules" required placeholder="هر قانون را در یک خط بنویس"></textarea><small class="field__hint">گروه‌های خودت: ${existingNames || "هنوز گروهی از سمت تو ساخته نشده است."}</small></label>
        <fieldset class="community-fieldset field--full"><legend>اجازه ساخت چالش توسط</legend>
          <div class="community-choice-grid">
            ${radioChoice("allowChallengeCreation", "owner", "فقط مدیر")}
            ${radioChoice("allowChallengeCreation", "admins", "مدیران", true)}
            ${radioChoice("allowChallengeCreation", "members", "همه اعضا با تأیید")}
          </div>
        </fieldset>
        <div class="community-dialog__actions field--full">
          <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
          <button class="button button--primary" type="submit">ساخت گروه</button>
        </div>
      </form>
    `;
  }

  function createChallengeFormMarkup(state, preselectedGroupId) {
    return `
      <form class="community-form-grid" id="community-create-challenge-form">
        <label class="field field--full"><span class="field__label">نام چالش</span><input name="title" required /></label>
        <label class="field field--full"><span class="field__label">توضیح</span><textarea name="description" required></textarea></label>
        <label class="field"><span class="field__label">تصویر یا نماد</span><input name="image" value="💧" /></label>
        <label class="field"><span class="field__label">دسته‌بندی</span>
          <select name="category">
            ${optionsMarkup(CHALLENGE_CATEGORY_OPTIONS, "water")}
          </select>
        </label>
        <label class="field"><span class="field__label">محل چالش</span>
          <select name="location">
            <option value="group" ${preselectedGroupId ? "selected" : ""}>داخل یک گروه</option>
            <option value="private">خصوصی با دعوت</option>
            <option value="public">قابل مشاهده برای همه</option>
          </select>
        </label>
        <label class="field"><span class="field__label">گروه مرتبط</span>
          <select name="groupId">
            ${state.groups
              .filter((group) => canCreateChallenge(state, group))
              .map((group) => `<option value="${group.id}" ${group.id === preselectedGroupId ? "selected" : ""}>${group.name}</option>`)
              .join("")}
          </select>
        </label>
        <label class="field"><span class="field__label">نوع هدف</span>
          <select name="goalType">
            <option value="daily">انجام روزانه</option>
            <option value="weekly">تعداد دفعات در هفته</option>
            <option value="amount">رسیدن به مقدار مشخص</option>
            <option value="streak">استمرار چندروزه</option>
            <option value="custom">هدف سفارشی</option>
          </select>
        </label>
        <label class="field"><span class="field__label">روش ثبت</span>
          <select name="tracking">
            <option value="simple">تأیید ساده انجام‌شدن</option>
            <option value="value">ثبت مقدار</option>
            <option value="linked">اتصال اختیاری به ثبت موجود</option>
          </select>
        </label>
        <label class="field"><span class="field__label">تاریخ شروع</span><input type="date" name="startDate" value="${TODAY}" /></label>
        <label class="field"><span class="field__label">تاریخ پایان</span><input type="date" name="endDate" value="${addDays(TODAY, 6)}" /></label>
        <label class="field field--full"><span class="field__label">روزهای فعال هفته</span><input name="activeDays" value="شنبه، یکشنبه، دوشنبه، سه‌شنبه، چهارشنبه، پنج‌شنبه، جمعه" /></label>
        <label class="field"><span class="field__label">مهلت Check-in روزانه</span><input type="time" name="deadline" value="21:30" /></label>
        <label class="field"><span class="field__label">یادآوری</span><select name="reminder"><option value="on">روشن</option><option value="off">خاموش</option></select></label>
        <fieldset class="community-fieldset field--full"><legend>حریم خصوصی نمایش</legend>
          <div class="community-choice-grid">
            ${radioChoice("privacy", "completion", "نمایش فقط انجام‌شدن", true)}
            ${radioChoice("privacy", "percent", "نمایش درصد پیشرفت")}
            ${radioChoice("privacy", "exact", "نمایش مقدار دقیق فقط با انتخاب صریح کاربر")}
            ${radioChoice("privacy", "anonymous", "حضور ناشناس")}
          </div>
        </fieldset>
        <label class="field field--full"><span class="field__label">قوانین</span><textarea name="rules" required placeholder="هر قانون را در یک خط بنویس"></textarea></label>
        <div class="community-alert field--full">
          <strong>یادآوری حریم خصوصی</strong>
          <p>جزئیات دقیق آب، خوراک، وزن یا داده پزشکی فقط وقتی دیده می‌شود که خود کاربر صریحاً آن را انتخاب کند.</p>
        </div>
        <div class="community-dialog__actions field--full">
          <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
          <button class="button button--primary" type="submit">ساخت چالش</button>
        </div>
      </form>
    `;
  }

  function createChallengeFormMarkupV2(state, preselectedGroupId) {
    const eligibleGroups = state.groups.filter((group) => canCreateChallenge(state, group));
    return `
      <form class="community-form-grid" id="community-create-challenge-form">
        <label class="field field--full"><span class="field__label">نام چالش</span><input name="title" required /></label>
        <label class="field field--full"><span class="field__label">توضیح کوتاه</span><textarea name="description" required></textarea></label>
        <label class="field"><span class="field__label">تصویر یا نماد</span><input name="image" value="💧" /></label>
        <label class="field"><span class="field__label">دسته‌بندی</span><select name="category">${optionsMarkup(CHALLENGE_CATEGORY_OPTIONS, "water")}</select></label>
        <label class="field"><span class="field__label">محل چالش</span><select name="location">${optionsMarkup(CHALLENGE_LOCATION_OPTIONS, preselectedGroupId ? "group" : "private")}</select></label>
        <label class="field" data-group-select-field ${preselectedGroupId ? "" : "hidden"}>
          <span class="field__label">گروه مرتبط</span>
          <select name="groupId">
            <option value="">انتخاب گروه</option>
            ${eligibleGroups.map((group) => `<option value="${group.id}" ${group.id === preselectedGroupId ? "selected" : ""}>${group.name}</option>`).join("")}
          </select>
        </label>
        <div class="community-empty field--full" data-group-empty ${preselectedGroupId || eligibleGroups.length ? "hidden" : ""}>
          <h2>در حال حاضر در گروهی با امکان ساخت چالش عضو نیستی.</h2>
          <p>وقتی در گروه مجاز عضو باشی، می‌توانی چالش گروهی را از همین‌جا بسازی.</p>
        </div>
        <label class="field"><span class="field__label">نوع هدف</span><select name="goalType">${optionsMarkup(GOAL_TYPE_OPTIONS, "daily")}</select></label>
        <label class="field"><span class="field__label">روش ثبت</span><select name="tracking">${optionsMarkup(TRACKING_OPTIONS, "simple")}</select></label>
        <div class="community-inline-box field--full">
          <strong>جزئیات هدف</strong>
          <div class="community-form-grid community-form-grid--compact">
            <label class="field"><span class="field__label">مقدار هدف</span><input name="targetValue" inputmode="numeric" placeholder="مثلاً ۳ یا ۸" /></label>
            <label class="field"><span class="field__label">واحد یا معیار</span><input name="targetUnit" placeholder="مثلاً لیوان، جلسه، روز" /></label>
            <label class="field field--full"><span class="field__label">توضیح روش موفقیت</span><textarea name="successCriteria" placeholder="اگر هدف سفارشی است، بنویس موفقیت یعنی چه."></textarea></label>
          </div>
        </div>
        <label class="field"><span class="field__label">تاریخ شروع</span><input type="date" name="startDate" value="${TODAY}" required /></label>
        <label class="field"><span class="field__label">تاریخ پایان</span><input type="date" name="endDate" value="${addDays(TODAY, 6)}" required /></label>
        <fieldset class="community-fieldset field--full" data-active-days-field>
          <legend>روزهای فعال هفته</legend>
          <div class="community-choice-grid community-choice-grid--days">
            ${WEEKDAY_OPTIONS.map((day) => `<label class="community-choice-row"><input type="checkbox" name="activeDays" value="${day.value}" checked /><span>${day.label}</span></label>`).join("")}
          </div>
        </fieldset>
        <label class="field"><span class="field__label">مهلت Check-in روزانه</span><input type="time" name="deadline" value="21:30" /></label>
        <label class="field"><span class="field__label">یادآوری</span><select name="reminder"><option value="on">روشن</option><option value="off">خاموش</option></select></label>
        <fieldset class="community-fieldset field--full"><legend>حریم خصوصی نمایش</legend><div class="community-choice-grid">${PRIVACY_OPTIONS.map(([value, label], index) => radioChoice("privacy", value, label, index === 0)).join("")}</div></fieldset>
        <label class="field field--full" data-rules-field><span class="field__label">قوانین</span><textarea name="rules" required placeholder="هر قانون را در یک خط بنویس"></textarea></label>
        <div class="community-alert field--full">
          <strong>یادآوری حریم خصوصی</strong>
          <p>جزئیات دقیق آب، خوراک، وزن یا داده پزشکی فقط وقتی دیده می‌شود که خود کاربر صریحاً آن را انتخاب کند.</p>
        </div>
        <div class="community-dialog__actions field--full">
          <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
          <button class="button button--primary" type="submit" data-submit-create-challenge>ساخت چالش</button>
        </div>
      </form>
    `;
  }

  function challengeTargetFromForm(data) {
    if (data.goalType === "weekly") return { kind: data.tracking, label: `${data.targetValue} بار در هفته`, value: Number(data.targetValue || 0) };
    if (data.goalType === "amount") return { kind: data.tracking, label: `${data.targetValue} ${data.targetUnit}`.trim(), value: Number(data.targetValue || 0), unit: data.targetUnit || "" };
    if (data.goalType === "streak") return { kind: data.tracking, label: `${data.targetValue} روز پیوسته`, value: Number(data.targetValue || 0) };
    if (data.goalType === "custom") return { kind: data.tracking, label: data.successCriteria || "تعریف سفارشی", criteria: data.successCriteria || "" };
    return { kind: data.tracking, label: "انجام روزانه" };
  }

  function validateChallengeForm(form, state, data, activeDays, rules) {
    const errors = {};
    const eligibleGroups = state.groups.filter((group) => canCreateChallenge(state, group));
    if (!String(data.title || "").trim()) errors.title = "نام چالش الزامی است.";
    if (!String(data.description || "").trim()) errors.description = "توضیح کوتاه الزامی است.";
    if (!data.category) errors.category = "دسته‌بندی را انتخاب کن.";
    if (!data.goalType) errors.goalType = "نوع هدف را مشخص کن.";
    if (!data.startDate) errors.startDate = "تاریخ شروع الزامی است.";
    if (!data.endDate) errors.endDate = "تاریخ پایان الزامی است.";
    if (data.startDate && data.endDate && compareDateOnly(data.endDate, data.startDate) < 0) errors.endDate = "تاریخ پایان باید بعد از تاریخ شروع باشد.";
    if (data.endDate && compareDateOnly(data.endDate, TODAY) < 0) errors.endDate = "چالش پایان‌یافته در گذشته قابل ساخت نیست.";
    if (!activeDays.length) errors.activeDays = "حداقل یک روز فعال را انتخاب کن.";
    if (!rules.length) errors.rules = "حداقل یک قانون را وارد کن.";
    if (data.location === "group") {
      if (!eligibleGroups.length) errors.groupId = "در حال حاضر در گروهی با امکان ساخت چالش عضو نیستی.";
      else if (!data.groupId) errors.groupId = "برای چالش گروهی باید یک گروه را انتخاب کنی.";
    }
    const numericValue = Number(data.targetValue || 0);
    if (data.goalType === "weekly" && !(numericValue >= 1 && numericValue <= 7)) errors.targetValue = "برای تعداد دفعات در هفته، مقدار باید بین ۱ تا ۷ باشد.";
    if (data.goalType === "amount") {
      if (!(numericValue > 0)) errors.targetValue = "مقدار هدف باید بیشتر از صفر باشد.";
      if (!String(data.targetUnit || "").trim()) errors.targetUnit = "واحد یا معیار را وارد کن.";
    }
    if (data.goalType === "streak" && !(numericValue > 0)) errors.targetValue = "تعداد روز هدف باید بیشتر از صفر باشد.";
    if (data.goalType === "custom" && !String(data.successCriteria || "").trim()) errors.successCriteria = "برای هدف سفارشی، روش موفقیت را توضیح بده.";
    return errors;
  }

  function applyChallengeFormErrors(form, errors) {
    Object.entries(errors).forEach(([name, message]) => {
      if (name === "activeDays") {
        setFieldError(form.querySelector("[data-active-days-field]"), message);
        return;
      }
      if (name === "rules") {
        setFieldError(form.querySelector("[data-rules-field]"), message);
        return;
      }
      setFieldError(form.querySelector(`[name="${name}"]`), message);
    });
    const submit = form.querySelector("[data-submit-create-challenge]");
    if (submit) submit.disabled = true;
  }

  function updateChallengeSubmitState(form, state) {
    const data = Object.fromEntries(new FormData(form).entries());
    const activeDays = selectedValues(form, "activeDays").map(Number);
    const rules = String(data.rules || "").split("\n").map((item) => item.trim()).filter(Boolean);
    const submit = form.querySelector("[data-submit-create-challenge]");
    if (submit) submit.disabled = Object.keys(validateChallengeForm(form, state, data, activeDays, rules)).length > 0;
  }

  function bindChallengeCreateForm(form, state) {
    const locationSelect = form.querySelector('[name="location"]');
    const groupField = form.querySelector("[data-group-select-field]");
    const groupEmpty = form.querySelector("[data-group-empty]");
    const goalTypeSelect = form.querySelector('[name="goalType"]');
    const targetValueField = form.querySelector('[name="targetValue"]')?.closest(".field");
    const targetUnitField = form.querySelector('[name="targetUnit"]')?.closest(".field");
    const successField = form.querySelector('[name="successCriteria"]')?.closest(".field");
    const eligibleGroups = state.groups.filter((group) => canCreateChallenge(state, group));

    function syncLocation() {
      const isGroup = locationSelect?.value === "group";
      if (groupField) groupField.hidden = !isGroup || !eligibleGroups.length;
      if (groupEmpty) groupEmpty.hidden = !isGroup || Boolean(eligibleGroups.length);
      const groupSelect = form.querySelector('[name="groupId"]');
      if (groupSelect) {
        groupSelect.disabled = !isGroup || !eligibleGroups.length;
      }
    }

    function syncGoalFields() {
      const mode = goalTypeSelect?.value || "daily";
      if (targetValueField) targetValueField.hidden = mode === "daily";
      if (targetUnitField) targetUnitField.hidden = mode !== "amount";
      if (successField) successField.hidden = mode !== "custom";
    }

    function sync() {
      clearFieldErrors(form);
      syncLocation();
      syncGoalFields();
      updateChallengeSubmitState(form, state);
    }

    locationSelect?.addEventListener("change", sync);
    goalTypeSelect?.addEventListener("change", sync);
    form.querySelectorAll("input, select, textarea").forEach((field) => field.addEventListener("input", sync));
    form.querySelectorAll('input[type="checkbox"]').forEach((field) => field.addEventListener("change", sync));
    sync();
  }

  function radioChoice(name, value, label, checked = false) {
    return `<label class="community-choice-row"><input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""} /><span>${label}</span></label>`;
  }

  function bindCreateForm(dialog, type) {
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    const form = dialog.querySelector("form");
    if (!form) return;
    if (type === "challenge") bindChallengeCreateForm(form, readState());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const next = readState();
      if (type === "group") {
        const duplicate = next.groups.some(
          (group) =>
            group.ownerId === next.currentUserId &&
            group.name.trim().toLowerCase() === String(data.name || "").trim().toLowerCase()
        );
        const rules = String(data.rules || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
        if (!data.name || !data.description || !rules.length) {
          showToast("نام، توضیح کوتاه و حداقل یک قانون لازم است.");
          return;
        }
        if (duplicate) {
          showToast("این نام در گروه‌های خودت تکراری است.");
          return;
        }
        const groupId = `group-${Date.now()}`;
        next.groups.unshift({
          id: groupId,
          name: String(data.name).trim(),
          description: String(data.description).trim(),
          category: String(data.category || "سایر"),
          privacy: data.joinPolicy === "invite" ? "invite-only" : data.joinPolicy === "approval" ? "private" : "public",
          joinPolicy: data.joinPolicy,
          visibility: data.visibility,
          image: String(data.image || "🌿").trim() || "🌿",
          ownerId: next.currentUserId,
          admins: [],
          members: [next.currentUserId],
          rules,
          allowChallengeCreation: data.allowChallengeCreation,
          challengeIds: [],
          muted: false,
          archived: false,
          createdAt: TODAY,
          activityCount: 0,
          pendingMembers: [],
          blockedMembers: [],
          invitations: [],
        });
        next.draft.communityTab = "my-groups";
        writeState(next);
        closeDialog(dialog);
        showToast(`گروه «${data.name}» ساخته شد.`);
        window.location.href = `group-detail-botanical.html?group=${groupId}`;
        return;
      }

      clearFieldErrors(form);
      const challengeId = `challenge-${Date.now()}`;
      const rules = String(data.rules || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const activeDays = selectedValues(form, "activeDays").map(Number);
      const errors = validateChallengeForm(form, next, data, activeDays, rules);
      if (Object.keys(errors).length) {
        applyChallengeFormErrors(form, errors);
        return;
      }
      next.challenges.unshift({
        id: challengeId,
        groupId: data.location === "group" ? data.groupId : null,
        title: String(data.title || "").trim(),
        description: String(data.description || "").trim(),
        image: String(data.image || "⭐").trim() || "⭐",
        category: data.category,
        goalType: data.goalType,
        target: challengeTargetFromForm(data),
        startDate: data.startDate || TODAY,
        endDate: data.endDate || addDays(TODAY, 6),
        activeDays,
        checkInDeadline: data.deadline || "21:30",
        visibility: data.location === "public" ? "public" : data.location === "private" ? "private" : "group",
        privacySettings: {
          defaultShare: data.privacy || "completion",
          allowExactValue: data.privacy === "exact",
          allowAnonymous: data.privacy === "anonymous",
          showPercent: data.privacy === "percent",
          showNote: false,
          showImage: false,
        },
        reminder: data.reminder === "on",
        memberLimit: 0,
        approvalRequired: false,
        rules,
        canLeaveAfterStart: true,
        participants: [next.currentUserId],
        pendingParticipants: [],
        creatorId: next.currentUserId,
        status:
          compareDateOnly(data.endDate || TODAY, TODAY) < 0
            ? "finished"
            : compareDateOnly(data.startDate || TODAY, TODAY) > 0
              ? "scheduled"
              : "active",
        optInLeaderboard: false,
        invitations: [],
      });
      if (data.location === "group") {
        const group = getGroup(next, data.groupId);
        if (group && !group.challengeIds.includes(challengeId)) group.challengeIds.unshift(challengeId);
      }
      next.draft.communityTab = "challenges";
      writeState(next);
      closeDialog(dialog);
      showToast(`چالش «${data.title}» ساخته شد.`);
      window.location.href = `challenge-detail-botanical.html?challenge=${challengeId}`;
    });
  }

  function openInvitePreviewDialog(state, inviteId, opener) {
    const invite = state.invites.find((item) => item.id === inviteId);
    if (!invite) return;
    const preview = invitePreview(state, invite.type, invite.targetId);
    const dialog = ensureDialog(
      "community-invite-preview-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "پیش‌نمایش دعوت",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "پذیرش دعوت فقط بعد از مرور قوانین و جزئیات انجام می‌شود.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <article class="community-preview">
        <h3>${preview?.title || "دعوت"}</h3>
        <p>${preview?.description || ""}</p>
        <div class="community-meta-list"><span>${preview?.meta || ""}</span></div>
      </article>
      <article class="community-card">
        <h3>قوانین</h3>
        <ul class="community-rule-list">
          ${(preview?.rules || []).map((rule) => `<li>${rule}</li>`).join("")}
        </ul>
      </article>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>بعداً</button>
        <button class="button button--primary" type="button" data-accept-invite="${invite.id}">پذیرفتن دعوت</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    dialog.querySelector("[data-accept-invite]")?.addEventListener("click", () => {
      const next = readState();
      const targetInvite = next.invites.find((item) => item.id === invite.id);
      if (targetInvite) targetInvite.status = "accepted";
      if (invite.type === "group") {
        const group = getGroup(next, invite.targetId);
        if (group && !group.members.includes(next.currentUserId)) group.members.push(next.currentUserId);
      } else {
        const challenge = getChallenge(next, invite.targetId);
        if (challenge && !challenge.participants.includes(next.currentUserId)) challenge.participants.push(next.currentUserId);
      }
      writeState(next);
      closeDialog(dialog);
      showToast("دعوت پذیرفته شد.");
      renderCommunityPage();
    });
    openDialog(dialog, opener);
  }

  function renderGroupDetailPage() {
    const root = document.getElementById("group-detail-root");
    if (!root) return;
    const scenario = getScenarioState();
    const state = scenario.state;
    if (scenario.mode === "loading") {
      root.innerHTML = `<section class="state-panel" data-state="loading"><span></span><span></span><span></span></section>`;
      return;
    }
    if (scenario.mode === "error") {
      root.innerHTML = renderStatePanel("جزئیات گروه بارگذاری نشد", "برای دیدن گروه دوباره تلاش کن.", '<button class="button button--secondary" type="button" id="group-retry">تلاش دوباره</button>');
      root.querySelector("#group-retry")?.addEventListener("click", renderGroupDetailPage);
      return;
    }
    const group = getGroup(state, GROUP_ID || state.draft.forceGroupId || "group-habit-circle");
    if (!group) {
      root.innerHTML = renderStatePanel("گروهی پیدا نشد", "این گروه در دسترس نیست.", '<a class="button button--secondary" href="community-botanical.html">بازگشت</a>');
      return;
    }
    const role = groupRole(state, group);
    const groupPosts = state.posts.filter((post) => post.groupId === group.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const groupChallenges = state.challenges.filter((challenge) => challenge.groupId === group.id);
    const draftTab = state.draft.groupDetailTab || "discussion";
    const archived = group.archived;

    if (role === "outsider" && group.joinPolicy === "invite" && !INVITE_CODE) {
      root.innerHTML = renderStatePanel(
        "این گروه فقط با دعوت باز می‌شود",
        "پیش از عضویت باید دعوت معتبر یا لینک مستقیم داشته باشی.",
        '<a class="button button--secondary" href="community-botanical.html">بازگشت به گروه‌ها</a>'
      );
      return;
    }

    root.innerHTML = `
      <section class="community-card" data-od-id="group-detail-hero">
        <div class="community-hero">
          <div class="community-symbol">${group.image}</div>
          <div class="community-hero__main">
            <div class="community-hero__title-row">
              <h1>${group.name}</h1>
              ${statusPill(roleLabel(role), role === "owner" || role === "admin" || role === "member" ? "actual" : "plan")}
              ${archived ? statusPill("بایگانی‌شده", "warning") : ""}
            </div>
            <p>${group.description}</p>
            <div class="community-hero__meta">
              <div class="community-meta-list">
                <span>${group.category}</span>
                <span>${toPersianNumber(group.members.length)} عضو</span>
                <span>${privacyLabel(group.privacy)}</span>
              </div>
              <div class="community-hero__actions">
                ${groupPrimaryAction(state, group, role)}
                <details class="community-more">
                  <summary class="community-ghost-button" aria-label="گزینه‌های بیشتر">⋯</summary>
                  <div class="community-menu">
                    <button type="button" data-share-group="${group.id}">اشتراک لینک گروه</button>
                    <button type="button" data-mute-group="${group.id}">${group.muted ? "لغو بی‌صدا" : "بی‌صدا کردن اعلان‌ها"}</button>
                    <button type="button" data-report-group="${group.id}">گزارش گروه</button>
                    <button type="button" data-leave-group="${group.id}">ترک گروه</button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${archived ? `<section class="community-alert"><strong>این گروه بایگانی شده است.</strong><p>گفت‌وگوهای قبلی همچنان دیده می‌شوند، اما فعالیت تازه‌ای ایجاد نمی‌شود.</p></section>` : ""}

      <div class="community-tabbar" role="tablist" aria-label="تب‌های گروه">
        <button type="button" role="tab" aria-selected="${String(draftTab === "discussion")}" data-group-tab="discussion">گفتگو</button>
        <button type="button" role="tab" aria-selected="${String(draftTab === "challenges")}" data-group-tab="challenges">چالش‌ها</button>
        <button type="button" role="tab" aria-selected="${String(draftTab === "members")}" data-group-tab="members">اعضا</button>
      </div>

      <section class="community-tab-panel ${draftTab === "discussion" ? "is-active" : ""}" data-group-panel="discussion">
        <article class="community-card">
          <div class="community-section-title">
            <h2>گفتگو</h2>
            <span class="community-muted">واکنش‌ها حمایتی‌اند و فضای رقابتی نمی‌سازند.</span>
          </div>
          ${groupPosts.find((post) => post.pinned) ? pinnedPostMarkup(state, groupPosts.find((post) => post.pinned)) : ""}
          ${
            role === "member" || role === "admin" || role === "owner"
              ? composerMarkup(canManageGroup(state, group))
              : `<div class="community-inline-box"><strong>برای مشارکت در گفتگو</strong><p>بعد از عضویت، می‌توانی پست منتشر کنی یا به گفت‌وگوها پاسخ بدهی.</p></div>`
          }
          <div class="community-post-stack">
            ${groupPosts.map((post) => postMarkup(state, group, post)).join("")}
          </div>
        </article>
      </section>

      <section class="community-tab-panel ${draftTab === "challenges" ? "is-active" : ""}" data-group-panel="challenges">
        <article class="community-card">
          <div class="community-section-title">
            <h2>چالش‌ها</h2>
            ${canCreateChallenge(state, group) && !archived ? `<button class="button button--secondary" type="button" data-open-group-challenge="${group.id}">ساخت چالش</button>` : ""}
          </div>
          <div class="community-section-stack">
            ${
              groupChallenges.length
                ? groupChallenges.map((challenge) => challengeCardMarkup(state, challenge, challengeAction(state, challenge))).join("")
                : emptyInline("هنوز چالشی برای این گروه ساخته نشده", "اگر برای این گروه مجاز باشی، می‌توانی چالش اول را همین‌جا تعریف کنی.")
            }
          </div>
        </article>
      </section>

      <section class="community-tab-panel ${draftTab === "members" ? "is-active" : ""}" data-group-panel="members">
        <article class="community-card">
          <div class="community-section-title">
            <h2>اعضا</h2>
            <div class="community-composer__inline">
              <input type="search" id="group-member-search" placeholder="جست‌وجوی اعضا" value="${escapeHtml(state.draft.memberQuery || "")}" />
              ${role === "owner" || role === "admin" ? `<button class="button button--secondary" type="button" data-open-invite-members="${group.id}">دعوت اعضا</button>` : ""}
            </div>
          </div>
          <div class="community-member-list">
            ${memberRowsMarkup(state, group)}
          </div>
        </article>
      </section>

      <div class="community-sticky-bar ${role === "member" || role === "admin" || role === "owner" ? "community-sticky-bar--hidden" : ""}">
        <div>
          <strong>${group.name}</strong>
          <small class="community-muted">${role === "member" || role === "admin" || role === "owner" ? "عضویت فعال" : "برای همراهی بیشتر، اول وضعیت عضویت را مشخص کن."}</small>
        </div>
        ${groupPrimaryAction(state, group, role)}
      </div>
    `;

    bindGlobalDetailsClose(root);
    syncGroupStickyBar(state, group, role);
    bindGroupDetailEvents(state, group);
  }

  function roleLabel(role) {
    return {
      owner: "مالک",
      admin: "مدیر",
      member: "عضو",
      pending: "درخواست در انتظار",
      outsider: "غیرعضو",
    }[role] || "عضو";
  }

  function groupPrimaryAction(state, group, role) {
    if (role === "member" || role === "admin" || role === "owner") {
      return `
        <div class="community-composer__inline">
          ${role === "owner" || role === "admin" ? `<button class="button button--secondary" type="button" data-open-invite-members="${group.id}">دعوت اعضا</button>` : ""}
          ${role === "owner" || role === "admin" ? `<button class="button button--secondary" type="button" data-open-manage-group="${group.id}">مدیریت گروه</button>` : ""}
        </div>
      `;
    }
    if (role === "pending") {
      return `<button class="button button--secondary" type="button" data-cancel-group-request="${group.id}">لغو درخواست</button>`;
    }
    if (hasGroupInvite(state, group.id)) {
      return `<button class="button button--primary" type="button" data-accept-group-invite="${group.id}">پذیرفتن دعوت</button>`;
    }
    if (group.joinPolicy === "open") {
      return `<button class="button button--primary" type="button" data-join-group="${group.id}">پیوستن به گروه</button>`;
    }
    return `<button class="button button--primary" type="button" data-request-group="${group.id}">ارسال درخواست عضویت</button>`;
  }

  function syncGroupStickyBar(state, group, role) {
    const sticky = document.querySelector("#group-detail-root .community-sticky-bar");
    if (!sticky) return;
    const note = sticky.querySelector(".community-muted");
    const shouldShow = !(role === "member" || role === "admin" || role === "owner");
    sticky.classList.toggle("community-sticky-bar--hidden", !shouldShow);
    sticky.hidden = !shouldShow;
    if (!note) return;
    if (role === "pending") {
      note.textContent = "درخواست عضویت در انتظار بررسی است.";
      return;
    }
    if (hasGroupInvite(state, group.id)) {
      note.textContent = "دعوت این گروه برایت رسیده است.";
      return;
    }
    note.textContent = "برای همراهی بیشتر، اول وضعیت عضویت را مشخص کن.";
  }

  function pinnedPostMarkup(state, post) {
    return `
      <article class="community-alert" data-od-id="group-pinned-post">
        <strong>پیام سنجاق‌شده</strong>
        <p>${post.content}</p>
      </article>
    `;
  }

  function composerMarkup(showManagersOnly) {
    return `
      <form class="community-composer" id="group-post-form">
        <div class="community-composer__body">
          <label class="field"><span class="field__label">متن پست</span><textarea name="content" required></textarea></label>
          <div class="community-composer__actions">
            <div class="community-composer__inline">
              <label class="field"><span class="field__label">موضوع</span><select name="topic"><option>گفتگو</option><option>Check-in</option><option>حال خوب</option></select></label>
              <label class="field"><span class="field__label">تصویر اختیاری</span><input name="image" placeholder="مثلاً photo.jpg" /></label>
            </div>
            <div class="community-composer__inline">
              ${showManagersOnly ? '<label class="community-choice-row"><input type="checkbox" name="onlyManagers" /><span>فقط مدیران ببینند</span></label>' : ""}
              <button class="button button--primary" type="submit">انتشار</button>
            </div>
          </div>
        </div>
      </form>
    `;
  }

  function postMarkup(state, group, post) {
    const author = getUser(state, post.authorId);
    const role = group.ownerId === post.authorId ? "مالک" : group.admins.includes(post.authorId) ? "مدیر" : "عضو";
    return `
      <article class="community-post" data-post-id="${post.id}">
        <div class="community-post__header">
          <div class="community-avatar">${author?.avatar || "ک"}</div>
          <div class="community-post__body">
            <div class="community-meta-list"><strong>${author?.name || "کاربر"}</strong><span>${role}</span><span>${persianDateTime(post.createdAt)}</span></div>
            <p>${post.content}</p>
            ${post.image ? `<div class="community-inline-box"><strong>تصویر</strong><p><bdi>${post.image}</bdi></p></div>` : ""}
          </div>
          <details class="community-more">
            <summary class="community-ghost-button" aria-label="گزینه‌های پست">⋯</summary>
            <div class="community-menu">
              ${post.authorId === state.currentUserId ? `<button type="button" data-edit-post="${post.id}">ویرایش پست</button><button type="button" data-delete-post="${post.id}">حذف پست</button>` : ""}
              <button type="button" data-save-post="${post.id}">${post.savedBy.includes(state.currentUserId) ? "حذف از ذخیره‌شده‌ها" : "ذخیره پست"}</button>
              <button type="button" data-report-post="${post.id}">گزارش</button>
            </div>
          </details>
        </div>
        <div class="community-post__support">
          ${supportButton("support", "همراهتم", post.userReaction)}
          ${supportButton("bravo", "آفرین", post.userReaction)}
          ${supportButton("inspired", "انگیزه گرفتم", post.userReaction)}
          <button type="button" data-open-replies="${post.id}">پاسخ‌ها · ${toPersianNumber(post.replies.length)}</button>
        </div>
      </article>
    `;
  }

  function supportButton(id, label, activeReaction) {
    return `<button type="button" data-reaction="${id}" aria-pressed="${String(activeReaction === id)}">${label}</button>`;
  }

  function memberRowsMarkup(state, group) {
    const query = state.draft.memberQuery || "";
    const ids = [...group.members];
    const matched = ids.filter((id) => {
      const user = getUser(state, id);
      return !query || user?.name.includes(query);
    });
    const rows = matched.map((id) => {
      const user = getUser(state, id);
      const role = group.ownerId === id ? "مالک" : group.admins.includes(id) ? "مدیر" : "عضو";
      return `
        <article class="community-member-row" data-member-id="${id}">
          <div class="community-avatar">${user?.avatar || "ک"}</div>
          <div class="community-member-row__body">
            <strong>${user?.name || "کاربر"}</strong>
            <small>${role} · عضو از ${persianDate(group.createdAt)}</small>
            <small>امروز ${user?.streak || 0} روز استمرار شخصی دارد.</small>
          </div>
          ${canManageGroup(state, group) && id !== state.currentUserId ? `<button class="community-mini-action" type="button" data-manage-member="${id}">مدیریت</button>` : ""}
        </article>
      `;
    });
    if (canManageGroup(state, group) && group.pendingMembers.length) {
      rows.push(`
        <div class="community-inline-box">
          <strong>درخواست‌های عضویت</strong>
          <p>${toPersianNumber(group.pendingMembers.length)} درخواست در انتظار بررسی است.</p>
        </div>
      `);
    }
    return rows.join("") || emptyInline("عضوی با این جست‌وجو پیدا نشد", "جست‌وجو را عوض کن یا فهرست کامل را ببین.");
  }

  function bindGroupDetailEvents(state, group) {
    const root = document.getElementById("group-detail-root");
    if (!root) return;
    root.querySelectorAll("[data-group-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        next.draft.groupDetailTab = button.dataset.groupTab;
        writeState(next);
        renderGroupDetailPage();
      });
    });

    root.querySelector("#group-member-search")?.addEventListener("input", (event) => {
      const next = readState();
      next.draft.memberQuery = event.target.value.trim();
      writeState(next);
      renderGroupDetailPage();
    });

    root.querySelector("#group-post-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (!data.content) {
        showToast("پست بدون متن منتشر نمی‌شود.");
        return;
      }
      const next = readState();
      next.posts.unshift({
        id: `post-${Date.now()}`,
        groupId: group.id,
        authorId: next.currentUserId,
        content: String(data.content).trim(),
        image: String(data.image || "").trim(),
        topic: data.topic,
        reactions: { support: 0, bravo: 0, inspired: 0 },
        userReaction: "",
        replies: [],
        pinned: false,
        visibility: "group",
        onlyManagers: Boolean(data.onlyManagers),
        createdAt: `${TODAY}T12:00:00+03:30`,
        savedBy: [],
      });
      writeState(next);
      showToast("پست منتشر شد.");
      renderGroupDetailPage();
    });

    root.querySelectorAll("[data-reaction]").forEach((button) => {
      button.addEventListener("click", () => {
        const postId = button.closest("[data-post-id]")?.dataset.postId;
        const next = readState();
        const post = next.posts.find((item) => item.id === postId);
        if (!post) return;
        post.userReaction = post.userReaction === button.dataset.reaction ? "" : button.dataset.reaction;
        writeState(next);
        announce("واکنش حمایتی به‌روزرسانی شد.");
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-open-replies]").forEach((button) => {
      button.addEventListener("click", () => openRepliesDialog(state, button.dataset.openReplies, button));
    });

    root.querySelectorAll("[data-open-group-challenge]").forEach((button) => {
      button.addEventListener("click", () => openCreateDialog("challenge", readState(), button, button.dataset.openGroupChallenge));
    });

    root.querySelectorAll("[data-open-invite-members]").forEach((button) => {
      button.addEventListener("click", () => openInviteMembersDialog(readState(), group, button));
    });

    root.querySelectorAll("[data-open-manage-group]").forEach((button) => {
      button.addEventListener("click", () => openManageGroupDialog(readState(), group, button));
    });

    root.querySelectorAll("[data-manage-member]").forEach((button) => {
      button.addEventListener("click", () => openMemberActionDialog(readState(), group, button.dataset.manageMember, button));
    });

    root.querySelectorAll("[data-join-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const target = getGroup(next, button.dataset.joinGroup);
        if (!target.members.includes(next.currentUserId)) target.members.push(next.currentUserId);
        writeState(next);
        showToast(`به گروه «${target.name}» پیوستی.`);
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-accept-group-invite]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const target = getGroup(next, button.dataset.acceptGroupInvite);
        const invite = next.invites.find((item) => item.type === "group" && item.targetId === target.id && item.status === "sent");
        if (invite) invite.status = "accepted";
        if (!target.members.includes(next.currentUserId)) target.members.push(next.currentUserId);
        writeState(next);
        showToast(`دعوت گروه «${target.name}» پذیرفته شد.`);
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-request-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const target = getGroup(next, button.dataset.requestGroup);
        if (!target.pendingMembers.includes(next.currentUserId)) target.pendingMembers.push(next.currentUserId);
        writeState(next);
        showToast("درخواست عضویت ارسال شد.");
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-cancel-group-request]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const target = getGroup(next, button.dataset.cancelGroupRequest);
        target.pendingMembers = target.pendingMembers.filter((id) => id !== next.currentUserId);
        writeState(next);
        showToast("درخواست عضویت لغو شد.");
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-share-group]").forEach((button) => {
      button.addEventListener("click", () => showToast("لینک گروه برای اشتراک آماده شد."));
    });

    root.querySelectorAll("[data-mute-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const target = getGroup(next, button.dataset.muteGroup);
        target.muted = !target.muted;
        writeState(next);
        showToast(target.muted ? "اعلان‌های گروه بی‌صدا شد." : "اعلان‌های گروه دوباره فعال شد.");
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-report-group]").forEach((button) => {
      button.addEventListener("click", () => openReportDialog("گروه", button));
    });

    root.querySelectorAll("[data-leave-group]").forEach((button) => {
      button.addEventListener("click", () => openLeaveGroupDialog(readState(), group, button));
    });

    root.querySelectorAll("[data-report-post]").forEach((button) => {
      button.addEventListener("click", () => openReportDialog("پست", button));
    });

    root.querySelectorAll("[data-save-post]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const post = next.posts.find((item) => item.id === button.dataset.savePost);
        if (!post) return;
        if (post.savedBy.includes(next.currentUserId)) {
          post.savedBy = post.savedBy.filter((id) => id !== next.currentUserId);
        } else {
          post.savedBy.push(next.currentUserId);
        }
        writeState(next);
        showToast("وضعیت ذخیره پست به‌روزرسانی شد.");
        renderGroupDetailPage();
      });
    });

    root.querySelectorAll("[data-delete-post]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        next.posts = next.posts.filter((item) => item.id !== button.dataset.deletePost);
        writeState(next);
        showToast("پست حذف شد.");
        renderGroupDetailPage();
      });
    });
  }

  function openRepliesDialog(state, postId, opener) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;
    const dialog = ensureDialog(
      "community-replies-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "پاسخ‌ها",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "پاسخ‌ها داخل همین پنجره باز می‌شوند و صفحه جدا ساخته نمی‌شود.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <div class="community-thread">
        ${
          post.replies.length
            ? post.replies
                .map((reply) => {
                  const author = getUser(state, reply.authorId);
                  return `<article class="community-post__reply"><div class="community-avatar">${author?.avatar || "ک"}</div><div><strong>${author?.name || "کاربر"}</strong><small>${reply.content}</small></div></article>`;
                })
                .join("")
            : "<p class='community-muted'>هنوز پاسخی ثبت نشده است.</p>"
        }
      </div>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>بستن</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    openDialog(dialog, opener);
  }

  function openInviteMembersDialog(state, group, opener) {
    const dialog = ensureDialog(
      "community-invite-members-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "دعوت اعضا",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "دعوت قبل از پذیرش فقط در وضعیت ارسال‌شده می‌ماند و قوانین گروه قابل مرور است.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <div class="community-card">
        <div class="community-form-grid">
          <label class="field field--full"><span class="field__label">جست‌وجوی مخاطب داخل آووکادو</span><input id="community-contact-search" placeholder="مثلاً هدا" /></label>
          <label class="field"><span class="field__label">کد دعوت</span><input readonly value="INV-${group.id.slice(-4).toUpperCase()}" /></label>
          <label class="field"><span class="field__label">لینک دعوت</span><input readonly value="https://avocado.app/community/${group.id}" /></label>
        </div>
      </div>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-copy-invite>کپی لینک دعوت</button>
        <button class="button button--primary" type="button" data-share-invite>اشتراک‌گذاری</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelector("[data-copy-invite]")?.addEventListener("click", () => showToast("لینک دعوت کپی شد."));
    body.querySelector("[data-share-invite]")?.addEventListener("click", () => showToast("اشتراک‌گذاری دعوت آماده شد."));
    openDialog(dialog, opener);
  }

  function openManageGroupDialog(state, group, opener) {
    const dialog = ensureDialog(
      "community-manage-group-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "مدیریت گروه",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "فقط کنترل‌های مدیریتی مرتبط با همین گروه دیده می‌شوند.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <div class="community-section-stack">
        <button class="community-mini-action" type="button" data-pin-post>سنجاق پست منتخب</button>
        <button class="community-mini-action" type="button" data-review-requests>بررسی درخواست‌ها</button>
        <button class="community-mini-action" type="button" data-archive-group>بایگانی گروه</button>
      </div>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>بستن</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelector("[data-archive-group]")?.addEventListener("click", () => {
      const next = readState();
      const target = getGroup(next, group.id);
      target.archived = !target.archived;
      writeState(next);
      closeDialog(dialog);
      showToast(target.archived ? "گروه بایگانی شد." : "گروه از حالت بایگانی خارج شد.");
      renderGroupDetailPage();
    });
    body.querySelector("[data-review-requests]")?.addEventListener("click", () => showToast("درخواست‌های عضویت برای مرور آماده شد."));
    body.querySelector("[data-pin-post]")?.addEventListener("click", () => showToast("برای سنجاق‌کردن، از منوی پست استفاده کن."));
    openDialog(dialog, opener);
  }

  function openMemberActionDialog(state, group, memberId, opener) {
    const member = getUser(state, memberId);
    const dialog = ensureDialog(
      "community-member-action-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "مدیریت عضو",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = `${member?.name || "عضو"} فقط در همین گروه مدیریت می‌شود و اطلاعات خصوصی او نمایش داده نمی‌شود.`;
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <div class="community-section-stack">
        <button class="community-mini-action" type="button" data-member-action="promote">ارتقا به مدیر</button>
        <button class="community-mini-action" type="button" data-member-action="demote">حذف مدیریت</button>
        <button class="community-mini-action" type="button" data-member-action="mute">بی‌صدا کردن موقت</button>
        <button class="community-mini-action" type="button" data-member-action="remove">حذف از گروه</button>
        <button class="community-mini-action" type="button" data-member-action="report">گزارش رفتار</button>
      </div>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>بستن</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelectorAll("[data-member-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const targetGroup = getGroup(next, group.id);
        const action = button.dataset.memberAction;
        if (action === "promote" && !targetGroup.admins.includes(memberId)) targetGroup.admins.push(memberId);
        if (action === "demote") targetGroup.admins = targetGroup.admins.filter((id) => id !== memberId);
        if (action === "remove") targetGroup.members = targetGroup.members.filter((id) => id !== memberId);
        writeState(next);
        closeDialog(dialog);
        showToast("اقدام مدیریتی ثبت شد.");
        renderGroupDetailPage();
      });
    });
    openDialog(dialog, opener);
  }

  function openReportDialog(targetLabel, opener) {
    const dialog = ensureDialog(
      "community-report-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      `گزارش ${targetLabel}`,
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "قبل از ارسال گزارش، دلیل را روشن انتخاب کن.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <fieldset class="community-fieldset">
        <legend>دلیل گزارش</legend>
        <div class="community-choice-grid">
          ${["آزار و توهین", "اطلاعات نادرست خطرناک", "محتوای نامناسب", "تبلیغات", "نقض حریم خصوصی", "سایر"]
            .map((label, index) => radioChoice("reportReason", String(index), label, index === 0))
            .join("")}
        </div>
      </fieldset>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
        <button class="button button--danger" type="button" data-submit-report>ارسال گزارش</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelector("[data-submit-report]")?.addEventListener("click", () => {
      closeDialog(dialog);
      showToast(`گزارش ${targetLabel} ثبت شد.`);
    });
    openDialog(dialog, opener);
  }

  function openLeaveGroupDialog(state, group, opener) {
    const dialog = ensureDialog(
      "community-leave-group-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "ترک گروه",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    dialog.querySelector("p").textContent =
      group.ownerId === state.currentUserId
        ? "مالک گروه قبل از ترک باید مالکیت را منتقل کند."
        : "پیام‌ها و فعالیت‌های قبلی حذف نمی‌شوند، فقط مشارکت آینده متوقف می‌شود.";
    body.innerHTML = `
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
        <button class="button button--danger" type="button" data-confirm-leave ${group.ownerId === state.currentUserId ? "disabled" : ""}>ترک گروه</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelector("[data-confirm-leave]")?.addEventListener("click", () => {
      const next = readState();
      const target = getGroup(next, group.id);
      target.members = target.members.filter((id) => id !== next.currentUserId);
      target.admins = target.admins.filter((id) => id !== next.currentUserId);
      writeState(next);
      closeDialog(dialog);
      showToast("از گروه خارج شدی.");
      window.location.href = "community-botanical.html";
    });
    openDialog(dialog, opener);
  }

  function renderChallengeDetailPage() {
    const root = document.getElementById("challenge-detail-root");
    if (!root) return;
    const scenario = getScenarioState();
    const state = scenario.state;
    if (scenario.mode === "loading") {
      root.innerHTML = `<section class="state-panel" data-state="loading"><span></span><span></span><span></span></section>`;
      return;
    }
    if (scenario.mode === "error") {
      root.innerHTML = renderStatePanel("جزئیات چالش بارگذاری نشد", "برای دیدن چالش دوباره تلاش کن.", '<button class="button button--secondary" type="button" id="challenge-retry">تلاش دوباره</button>');
      root.querySelector("#challenge-retry")?.addEventListener("click", renderChallengeDetailPage);
      return;
    }
    const challenge = getChallenge(state, CHALLENGE_ID || "challenge-hydration-circle");
    if (!challenge) {
      root.innerHTML = renderStatePanel("چالشی پیدا نشد", "این چالش در دسترس نیست.", '<a class="button button--secondary" href="community-botanical.html">بازگشت</a>');
      return;
    }
    const status = challengeStatus(challenge);
    const progress = challengeProgress(state, challenge);
    const todayEntry = todayCheckIn(state, challenge.id);
    const group = challenge.groupId ? getGroup(state, challenge.groupId) : null;
    const tab = state.draft.challengeDetailTab || "about";
    const participantState = userChallengeState(state, challenge);

    root.innerHTML = `
      <section class="community-card" data-od-id="challenge-detail-hero">
        <div class="community-hero">
          <div class="community-symbol">${challenge.image}</div>
          <div class="community-hero__main">
            <div class="community-hero__title-row">
              <h1>${challenge.title}</h1>
              ${statusPill(challengeStatusLabel(status), status === "active" ? "actual" : status === "scheduled" ? "plan" : "warning")}
            </div>
            <p>${challenge.description}</p>
            <div class="community-meta-list">
              <span>${challengeCategoryLabel(challenge.category)}</span>
              <span>${dateRangeLabel(challenge.startDate, challenge.endDate)}</span>
              <span>${toPersianNumber(challenge.participants.length)} شرکت‌کننده</span>
              ${group ? `<span>گروه مرتبط: ${group.name}</span>` : ""}
            </div>
            <div class="community-hero__actions">
              ${challengePrimaryAction(state, challenge, status, todayEntry, participantState)}
              <details class="community-more">
                <summary class="community-ghost-button" aria-label="گزینه‌های بیشتر">⋯</summary>
                <div class="community-menu">
                  <button type="button" data-mute-challenge="${challenge.id}">بی‌صدا کردن اعلان‌ها</button>
                  <button type="button" data-share-challenge="${challenge.id}">اشتراک لینک</button>
                  <button type="button" data-report-challenge="${challenge.id}">گزارش چالش</button>
                  <button type="button" data-leave-challenge="${challenge.id}">خروج از چالش</button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section class="community-card" data-od-id="challenge-progress">
        <div class="community-card__head--split">
          <div>
            <div class="community-card__kicker">پیشرفت شخصی</div>
            <h2>${toPersianNumber(progress.percent)}٪ پیشرفت</h2>
            <p>روزهای ثبت‌شده و مسیر باقی‌مانده چالش را اینجا می‌بینی.</p>
          </div>
          ${todayEntry ? statusPill("Check-in امروز انجام شده", "actual") : statusPill("Check-in امروز هنوز ثبت نشده", "plan")}
        </div>
        <div class="community-metrics">
          <div class="community-metric"><span>روزهای انجام‌شده</span><strong>${toPersianNumber(progress.doneDays)}</strong></div>
          <div class="community-metric"><span>استمرار فعلی</span><strong>${toPersianNumber(progress.streak)}</strong></div>
          <div class="community-metric"><span>بهترین استمرار</span><strong>${toPersianNumber(progress.best)}</strong></div>
          <div class="community-metric"><span>هدف بعدی</span><strong>${status === "active" ? "ثبت امروز" : status === "scheduled" ? "شروع چالش" : "مرور نتیجه"}</strong></div>
        </div>
      </section>

      <section class="community-card" data-od-id="challenge-calendar">
        <div class="community-section-title"><h2>شبکه پیشرفت</h2></div>
        <div class="community-calendar">
          ${challengeCalendarMarkup(state, challenge)}
        </div>
      </section>

      <div class="community-tabbar" role="tablist" aria-label="تب‌های چالش">
        <button type="button" role="tab" aria-selected="${String(tab === "about")}" data-challenge-tab="about">درباره چالش</button>
        <button type="button" role="tab" aria-selected="${String(tab === "mine")}" data-challenge-tab="mine">پیشرفت من</button>
        <button type="button" role="tab" aria-selected="${String(tab === "activity")}" data-challenge-tab="activity">فعالیت گروه</button>
      </div>

      <section class="community-tab-panel ${tab === "about" ? "is-active" : ""}" data-challenge-panel="about">
        <article class="community-card">
          <div class="community-section-title"><h2>درباره چالش</h2></div>
          <div class="community-section-stack">
            <div class="community-inline-box"><strong>سازنده</strong><p>${getUser(state, challenge.creatorId)?.name || "کاربر"}</p></div>
            <div class="community-inline-box"><strong>روش ثبت</strong><p>${challenge.target.label}</p></div>
            <div class="community-inline-box"><strong>قوانین</strong><ul class="community-rule-list">${challenge.rules.map((rule) => `<li>${rule}</li>`).join("")}</ul></div>
          </div>
        </article>
      </section>

      <section class="community-tab-panel ${tab === "mine" ? "is-active" : ""}" data-challenge-panel="mine">
        <article class="community-card">
          <div class="community-section-title"><h2>پیشرفت من</h2></div>
          <div class="community-section-stack">
            <div class="community-inline-box"><strong>Check-in امروز</strong><p>${todayEntry ? "انجام شده و قابل ویرایش است." : "هنوز ثبت نشده؛ اگر امروز نشد، فردا می‌توانی ادامه بدهی."}</p></div>
            <div class="community-inline-box"><strong>حریم خصوصی پیش‌فرض</strong><p>${visibilityCopy(challenge.privacySettings.defaultShare)}</p></div>
          </div>
        </article>
      </section>

      <section class="community-tab-panel ${tab === "activity" ? "is-active" : ""}" data-challenge-panel="activity">
        <article class="community-card">
          <div class="community-section-title"><h2>فعالیت شرکت‌کنندگان</h2></div>
          <div class="community-activity-stack">
            ${challengeActivityMarkup(state, challenge)}
          </div>
        </article>
      </section>

      <div class="community-sticky-bar">
        <div>
          <strong>${challenge.title}</strong>
          <small class="community-muted">${todayEntry ? "ثبت امروز انجام شده است." : "ثبت امروز هنوز انجام نشده است."}</small>
        </div>
        ${challengePrimaryAction(state, challenge, status, todayEntry, participantState)}
      </div>
    `;

    bindGlobalDetailsClose(root);
    syncChallengeDetailUI(root, state, challenge, todayEntry, participantState);
    bindChallengeDetailEvents(state, challenge);
  }

  function syncChallengeDetailUI(root, state, challenge, todayEntry, participantState) {
    const progressCopy = root.querySelector('[data-od-id="challenge-progress"] p');
    if (progressCopy) {
      progressCopy.textContent = "روزهای ثبت‌شده و مسیر باقی‌مانده چالش را اینجا می‌بینی.";
    }
    const sticky = root.querySelector(".community-sticky-bar");
    const heroAction = root.querySelector(".community-hero__actions .button, .community-hero__actions a.button");
    if (!sticky || !heroAction) return;
    const bottomNav = document.querySelector(".bottom-nav");
    const updateBottomOffset = () => {
      const navHeight = bottomNav?.offsetHeight || 0;
      root.style.setProperty("--community-bottom-offset", `${navHeight + 12}px`);
      root.style.setProperty("--community-sticky-padding", `${navHeight + 96}px`);
    };
    const supportsSticky = participantState === "participant" || participantState === "outsider";
    const syncVisibility = (visible) => {
      const mobile = window.matchMedia("(max-width: 40rem)").matches;
      const shouldShow = mobile && supportsSticky && visible;
      sticky.hidden = !shouldShow;
      sticky.classList.toggle("community-sticky-bar--hidden", !shouldShow);
      sticky.classList.toggle("is-visible", shouldShow);
    };
    updateBottomOffset();
    syncVisibility(false);
    if (!("IntersectionObserver" in window)) {
      const update = () => {
        const rect = heroAction.getBoundingClientRect();
        updateBottomOffset();
        syncVisibility(rect.bottom < 0 || rect.top > window.innerHeight);
      };
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      update();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        syncVisibility(!entry.isIntersecting);
      },
      { threshold: 0.45 }
    );
    observer.observe(heroAction);
    window.addEventListener("resize", () => {
      updateBottomOffset();
      const mobile = window.matchMedia("(max-width: 40rem)").matches;
      if (!mobile) syncVisibility(false);
    });
  }

  function challengePrimaryAction(state, challenge, status, todayEntry, participantState) {
    if (participantState === "pending") {
      return `<button class="button button--secondary" type="button" disabled>درخواست در انتظار</button>`;
    }
    if (participantState === "outsider") {
      return `<button class="button button--primary" type="button" data-join-challenge="${challenge.id}">${challenge.approvalRequired ? "درخواست عضویت" : "پیوستن"}</button>`;
    }
    if (status === "finished") {
      return `<a class="button button--secondary" href="#challenge-result">مشاهده نتیجه</a>`;
    }
    if (status === "scheduled") {
      return `<button class="button button--secondary" type="button" disabled>هنوز شروع نشده</button>`;
    }
    return `<button class="button ${todayEntry ? "button--secondary" : "button--primary"}" type="button" data-open-checkin="${challenge.id}">${todayEntry ? "ویرایش ثبت امروز" : "ثبت امروز"}</button>`;
  }

  function challengeCalendarMarkup(state, challenge) {
    const days = [];
    let cursor = challenge.startDate;
    while (compareDateOnly(cursor, challenge.endDate) <= 0) {
      const entry = state.checkIns.find((item) => item.challengeId === challenge.id && item.userId === state.currentUserId && item.date === cursor);
      const parsed = parseDateOnly(cursor);
      const weekday = parsed.getDay();
      const isActiveDay = challenge.activeDays.includes(weekday);
      let stateName = "future";
      let icon = "○";
      let label = "آینده";
      if (!isActiveDay) {
        stateName = "off";
        icon = "–";
        label = "غیرفعال";
      } else if (cursor === TODAY) {
        stateName = entry?.completed ? "done" : "today";
        icon = entry?.completed ? "✓" : "•";
        label = entry?.completed ? "انجام‌شده" : "امروز";
      } else if (compareDateOnly(cursor, TODAY) < 0) {
        stateName = entry?.completed ? "done" : "missed";
        icon = entry?.completed ? "✓" : "!";
        label = entry?.completed ? "انجام‌شده" : "ثبت نشد";
      }
      days.push(`
        <div class="community-day" data-state="${stateName}">
          <span>${toPersianNumber(parsed.getDate())}</span>
          <span class="community-day__icon" aria-hidden="true">${icon}</span>
          <strong>${label}</strong>
        </div>
      `);
      cursor = addDays(cursor, 1);
    }
    return days.join("");
  }

  function visibilityCopy(value) {
    return {
      self: "فقط برای من",
      completion: "فقط انجام‌شدن برای دیگران دیده می‌شود.",
      percent: "فقط درصد پیشرفت نمایش داده می‌شود.",
      exact: "جزئیات انتخاب‌شده دیده می‌شود.",
      anonymous: "به‌صورت ناشناس نمایش داده می‌شود.",
    }[value] || "فقط انجام‌شدن نمایش داده می‌شود.";
  }

  function challengeActivityMarkup(state, challenge) {
    const todayItems = state.checkIns.filter((item) => item.challengeId === challenge.id && item.date === TODAY && item.completed);
    if (!todayItems.length) {
      return emptyInline("هنوز کسی امروز ثبت نکرده", "وقتی اولین Check-in انجام شود، همین‌جا با پیام‌های کوتاه حمایتی دیده می‌شود.");
    }
    return todayItems
      .map((item) => {
        const user = getUser(state, item.userId);
        return `
          <article class="community-activity-row">
            <div class="community-avatar">${user?.avatar || "ک"}</div>
            <div class="community-activity-row__body">
              <strong>${user?.name || "کاربر"} امروز ثبت کرده است</strong>
              <small>${item.visibility === "exact" && item.sharedFields?.note && item.note ? item.note : "فقط انجام‌شدن ثبت شده است."}</small>
            </div>
            ${statusPill("انجام شد", "actual")}
          </article>
        `;
      })
      .join("");
  }

  function bindChallengeDetailEvents(state, challenge) {
    const root = document.getElementById("challenge-detail-root");
    if (!root) return;
    root.querySelectorAll("[data-challenge-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        next.draft.challengeDetailTab = button.dataset.challengeTab;
        writeState(next);
        renderChallengeDetailPage();
      });
    });

    root.querySelectorAll("[data-open-checkin]").forEach((button) => {
      button.addEventListener("click", () => openCheckinDialog(readState(), challenge, button));
    });

    root.querySelectorAll("[data-join-challenge]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = readState();
        const target = getChallenge(next, button.dataset.joinChallenge);
        if (target.approvalRequired) {
          if (!target.pendingParticipants.includes(next.currentUserId)) target.pendingParticipants.push(next.currentUserId);
          showToast("درخواست عضویت در چالش ارسال شد.");
        } else if (!target.participants.includes(next.currentUserId)) {
          target.participants.push(next.currentUserId);
          showToast(`به چالش «${target.title}» پیوستی.`);
        }
        writeState(next);
        renderChallengeDetailPage();
      });
    });

    root.querySelectorAll("[data-mute-challenge]").forEach((button) => {
      button.addEventListener("click", () => showToast("اعلان‌های چالش بی‌صدا شد."));
    });

    root.querySelectorAll("[data-share-challenge]").forEach((button) => {
      button.addEventListener("click", () => showToast("لینک چالش برای اشتراک آماده شد."));
    });

    root.querySelectorAll("[data-report-challenge]").forEach((button) => {
      button.addEventListener("click", () => openReportDialog("چالش", button));
    });

    root.querySelectorAll("[data-leave-challenge]").forEach((button) => {
      button.addEventListener("click", () => openLeaveChallengeDialog(readState(), challenge, button));
    });
  }

  function openCheckinDialog(state, challenge, opener) {
    const existing = todayCheckIn(state, challenge.id);
    const dialog = ensureDialog(
      "community-checkin-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      existing ? "ویرایش Check-in امروز" : "ثبت Check-in امروز",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "قبل از ثبت، دقیقاً می‌بینی چه چیزی برای اعضا قابل مشاهده خواهد بود.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <form class="community-form-grid" id="community-checkin-form">
        <fieldset class="community-fieldset field--full">
          <legend>وضعیت امروز</legend>
          <div class="community-choice-grid">
            ${radioChoice("completed", "yes", "انجام شد", existing?.completed ?? true)}
            ${radioChoice("completed", "no", "انجام نشد", existing ? !existing.completed : false)}
          </div>
        </fieldset>
        <label class="field"><span class="field__label">مقدار ثبت‌شده در صورت نیاز</span><input name="value" value="${escapeHtml(existing?.value || "")}" placeholder="مثلاً ۸ لیوان" /></label>
        <label class="field"><span class="field__label">حال و انرژی</span><select name="mood"><option ${existing?.mood === "آرام" ? "selected" : ""}>آرام</option><option ${existing?.mood === "خوب" ? "selected" : ""}>خوب</option><option ${existing?.mood === "پرانرژی" ? "selected" : ""}>پرانرژی</option></select></label>
        <label class="field field--full"><span class="field__label">یادداشت اختیاری</span><textarea name="note">${escapeHtml(existing?.note || "")}</textarea></label>
        <label class="field field--full"><span class="field__label">تصویر اختیاری</span><input name="image" placeholder="مثلاً photo.jpg" /></label>
        <fieldset class="community-fieldset field--full">
          <legend>سطح اشتراک</legend>
          <div class="community-checkin-visibility">
            ${radioChoice("visibility", "self", "فقط برای من", existing?.visibility === "self")}
            ${radioChoice("visibility", "completion", "نمایش انجام‌شدن", !existing || existing.visibility === "completion", !existing || existing.visibility === "completion")}
            ${radioChoice("visibility", "percent", "نمایش درصد", existing?.visibility === "percent")}
            ${radioChoice("visibility", "exact", "نمایش جزئیات انتخاب‌شده", existing?.visibility === "exact")}
          </div>
        </fieldset>
        <fieldset class="community-fieldset field--full">
          <legend>جزئیات اختیاری قابل نمایش</legend>
          <div class="community-choice-grid">
            <label class="community-choice-row"><input type="checkbox" name="shareNote" ${existing?.sharedFields?.note ? "checked" : ""} /><span>نمایش یادداشت</span></label>
            <label class="community-choice-row"><input type="checkbox" name="shareImage" ${existing?.sharedFields?.image ? "checked" : ""} /><span>نمایش تصویر</span></label>
          </div>
        </fieldset>
        <div class="community-alert field--full">
          <strong>پیش‌نمایش دید اعضا</strong>
          <p id="community-checkin-preview">${existing?.visibility ? visibilityCopy(existing.visibility) : "فقط انجام‌شدن برای اعضا دیده می‌شود."}</p>
        </div>
        <div class="community-dialog__actions field--full">
          <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
          <button class="button button--primary" type="submit">ثبت Check-in</button>
        </div>
      </form>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelector(".community-alert strong")?.replaceChildren("اعضای چالش چه چیزی می‌بینند؟");
    const preview = dialog.querySelector("#community-checkin-preview");
    const updatePreview = () => {
      const form = dialog.querySelector("form");
      const data = Object.fromEntries(new FormData(form).entries());
      const parts = [visibilityCopy(data.visibility || "completion")];
      if ((data.visibility || "completion") === "exact") {
        if (form.querySelector('[name="shareNote"]')?.checked) parts.push("یادداشت انتخابی هم دیده می‌شود.");
        if (form.querySelector('[name="shareImage"]')?.checked) parts.push("تصویر انتخابی هم نمایش داده می‌شود.");
      }
      preview.textContent = parts.join(" ");
    };
    dialog.querySelectorAll('input[name="visibility"], input[name="shareNote"], input[name="shareImage"]').forEach((input) => {
      input.addEventListener("change", () => {
        updatePreview();
      });
    });
    updatePreview();
    dialog.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const next = readState();
      const current = todayCheckIn(next, challenge.id);
      const payload = {
        id: current?.id || `checkin-${Date.now()}`,
        challengeId: challenge.id,
        userId: next.currentUserId,
        date: TODAY,
        completed: data.completed === "yes",
        value: data.value || null,
        note: data.note || "",
        visibility: data.visibility || "completion",
        sharedFields: {
          note: (data.visibility || "completion") === "exact" && data.shareNote === "on",
          image: (data.visibility || "completion") === "exact" && data.shareImage === "on",
        },
        mood: data.mood || "خوب",
        createdAt: current?.createdAt || `${TODAY}T10:00:00+03:30`,
        updatedAt: `${TODAY}T10:00:00+03:30`,
      };
      next.checkIns = next.checkIns.filter((item) => !(item.challengeId === challenge.id && item.userId === next.currentUserId && item.date === TODAY));
      next.checkIns.push(payload);
      writeState(next);
      closeDialog(dialog);
      showToast("Check-in امروز ثبت شد.");
      renderChallengeDetailPage();
      renderDashboardChallengeCard();
    });
    openDialog(dialog, opener);
  }

  function openLeaveChallengeDialog(state, challenge, opener) {
    const dialog = ensureDialog(
      "community-leave-challenge-dialog",
      isMobileSheet() ? "community-sheet" : "community-dialog",
      "خروج از چالش",
      isMobileSheet() ? createSheetMarkup : createDialogMarkup
    );
    dialog.className = isMobileSheet() ? "community-sheet" : "community-dialog";
    bindDismiss(dialog);
    dialog.querySelector("p").textContent = "Check-inهای شخصی حذف نمی‌شوند؛ فقط مشارکت آینده متوقف می‌شود.";
    const body = dialog.querySelector(isMobileSheet() ? ".community-sheet__body" : ".community-dialog__body");
    body.innerHTML = `
      <div class="community-inline-box">
        <strong>اثر خروج</strong>
        <p>داده‌های عمومی قبلی طبق تنظیم حریم خصوصی باقی می‌مانند و ثبت‌های بعدی متوقف می‌شوند.</p>
      </div>
      <div class="community-dialog__actions">
        <button class="button button--secondary" type="button" data-close-dialog>انصراف</button>
        <button class="button button--danger" type="button" data-confirm-leave-challenge>خروج از چالش</button>
      </div>
    `;
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.onclick = () => closeDialog(dialog);
    });
    body.querySelector("[data-confirm-leave-challenge]")?.addEventListener("click", () => {
      const next = readState();
      const target = getChallenge(next, challenge.id);
      target.participants = target.participants.filter((id) => id !== next.currentUserId);
      writeState(next);
      closeDialog(dialog);
      showToast("از چالش خارج شدی.");
      window.location.href = "community-botanical.html";
    });
    openDialog(dialog, opener);
  }

  function renderSettingsCommunityEntry() {
    const page = document.body?.dataset.page;
    if (page !== "settings") return;
    const lists = document.querySelectorAll(".profile-setting-list");
    const list = lists[0];
    if (!list || list.querySelector("[data-community-settings-entry]")) return;
    const row = document.createElement("div");
    row.className = "profile-setting-row";
    row.dataset.communitySettingsEntry = "true";
    row.innerHTML = `
      <div class="profile-setting-row__meta">
        <strong>گروه‌ها و چالش‌ها</strong>
        <small>فضای اجتماعی حمایتی، گروه‌های عضو و چالش‌های فعال</small>
      </div>
      <a class="button button--secondary button--sm" href="community-botanical.html">باز کردن</a>
    `;
    list.appendChild(row);
  }

  function renderDashboardChallengeCard() {
    if (PAGE !== "dashboard" && document.body?.dataset.page !== "dashboard") return;
    const host = document.querySelector(".home-main-grid");
    if (!host) return;
    let mount = document.getElementById("dashboard-community-card");
    if (!mount) {
      mount = document.createElement("section");
      mount.id = "dashboard-community-card";
      mount.className = "home-section";
      mount.setAttribute("data-od-id", "dashboard-community-checkin");
      host.insertAdjacentElement("afterend", mount);
    }
    const state = readState();
    const activeChallenge = state.challenges.find(
      (challenge) =>
        challenge.participants.includes(state.currentUserId) &&
        challengeStatus(challenge) === "active"
    );
    if (!activeChallenge) {
      mount.hidden = true;
      return;
    }
    mount.hidden = false;
    const done = Boolean(todayCheckIn(state, activeChallenge.id));
    mount.innerHTML = `
      <div class="community-card__head--split">
        <div>
          <div class="community-card__kicker">چالش فعال</div>
          <h2>${done ? "ثبت امروز انجام شد" : "ثبت امروز مانده است"}</h2>
          <p>${activeChallenge.title} · ${done ? "می‌توانی نتیجه را مرور کنی." : "اگر آماده‌ای، ثبت امروز را از همین‌جا ادامه بده."}</p>
        </div>
        <a class="button ${done ? "button--secondary" : "button--primary"}" href="challenge-detail-botanical.html?challenge=${activeChallenge.id}">
          ${done ? "مشاهده وضعیت" : "ثبت امروز"}
        </a>
      </div>
    `;
  }

  function renderNotificationsCommunitySamples() {
    if (PAGE !== "notifications" && document.body?.dataset.page !== "notifications") return;
    const content = document.getElementById("notifications-content");
    if (!content || content.querySelector("[data-community-notifications]")) return;
    const section = document.createElement("section");
    section.className = "notification-group";
    section.dataset.communityNotifications = "true";
    section.innerHTML = `
      <div class="notification-group__head">
        <h2>گروه‌ها و چالش‌ها</h2>
        <p>نمونه اعلان‌های اجتماعی متصل به جریان جدید</p>
      </div>
      <div class="notification-list">
        ${notificationLinkRow("دعوت به گروه", "حلقه عادت‌های آرام", "community-botanical.html?invite=HABIT-1405")}
        ${notificationLinkRow("دعوت به چالش", "هفت روز آب کافی", "challenge-detail-botanical.html?challenge=challenge-hydration-circle")}
        ${notificationLinkRow("پذیرفته‌شدن درخواست عضویت", "صبح‌های پرتحرک", "group-detail-botanical.html?group=group-morning-move")}
        ${notificationLinkRow("یادآوری Check-in", "ثبت امروز چالش آب", "challenge-detail-botanical.html?challenge=challenge-hydration-circle")}
        ${notificationLinkRow("پاسخ به پست", "پاسخ جدید در حلقه عادت‌های آرام", "group-detail-botanical.html?group=group-habit-circle")}
        ${notificationLinkRow("شروع یا پایان چالش", "سه جلسه حرکت صبحگاهی", "challenge-detail-botanical.html?challenge=challenge-morning-streak")}
      </div>
    `;
    content.appendChild(section);
  }

  function notificationLinkRow(title, copy, href) {
    return `
      <article class="notification-row">
        <div class="notification-main">
          <span class="notification-icon"><span aria-hidden="true">◎</span></span>
          <div class="notification-copy">
            <div class="notification-title-line"><strong class="notification-title">${title}</strong></div>
            <p class="notification-description">${copy}</p>
          </div>
          <span class="notification-time">همین حالا</span>
          <a class="notification-action" href="${href}">مشاهده</a>
        </div>
      </article>
    `;
  }

  function init() {
    if (PAGE === "community") renderCommunityPage();
    if (PAGE === "group-detail") renderGroupDetailPage();
    if (PAGE === "challenge-detail") renderChallengeDetailPage();
    renderSettingsCommunityEntry();
    renderDashboardChallengeCard();
    renderNotificationsCommunitySamples();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
