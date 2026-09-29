(function () {
  "use strict";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function localDateParts(date = new Date()) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  function dateOnlyLocal(date = new Date()) {
    const { year, month, day } = localDateParts(date);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function parseDateOnly(value) {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (![year, month, day].every(Number.isFinite)) return null;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function addDays(dateOnly, offset) {
    const base = parseDateOnly(dateOnly) || new Date();
    base.setDate(base.getDate() + offset);
    return dateOnlyLocal(base);
  }

  function formatPersianDate(value, options = {}) {
    const parsed = value instanceof Date ? value : parseDateOnly(value);
    if (!parsed) return "—";
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: options.weekday ? "long" : undefined,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsed);
  }

  function todayPersianLabel() {
    return `امروز، ${formatPersianDate(dateOnlyLocal())}`;
  }

  function minBookingDate() {
    return dateOnlyLocal();
  }

  window.AvocadoDate = {
    dateOnlyLocal,
    parseDateOnly,
    addDays,
    formatPersianDate,
    todayPersianLabel,
    todayInputValue: dateOnlyLocal,
    minBookingDate,
  };
})();
