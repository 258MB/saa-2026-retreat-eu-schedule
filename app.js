// European-adjusted schedule for the Simply Always Awake Online Retreat.
// The whole EU day is anchored to Europe/Amsterdam (CEST). During the retreat
// window (Jul 8-12, 2026) the live sessions' CEST times are exactly the
// retreat's Mountain Time schedule shifted +8h, so anchoring everything to one
// zone is instant-accurate. Everything renders in the visitor's local zone.
const SOURCE_TIME_ZONE = "Europe/Amsterdam";

// kind: "live" = join on Zoom · "rec" = previous-day replay · "self" = self-guided · "close" = day marker
const DAY_ONE = [
  ["17:00", "Guided Meditation", "live", "gm", 0],
  ["17:40", "Break", "self"],
  ["17:50", "Meditation", "self"],
  ["18:30", "Break", "self"],
  ["18:40", "Meditation", "self"],
  ["19:20", "Break", "self"],
  ["19:30", "Talk", "live", "talk", 0],
  ["20:30", "Break", "self"],
  ["20:40", "Meditation", "self"],
  ["21:20", "Break", "self"],
  ["21:30", "Meditation", "self"],
  ["22:00", "End of Day", "close"],
];

// recKey + recDayOffset: which recording belongs to this row.
// Morning Q&A and evening Poetry replay the *previous* retreat day (-1);
// live sessions later gain the recording of their own day (0).
const FULL_DAY = [
  ["09:00", "Meditation", "self"],
  ["09:40", "Break", "self"],
  ["09:50", "Q&A", "rec", "qa", -1],
  ["11:20", "Break", "self"],
  ["11:30", "Meditation", "self"],
  ["12:00", "Lunch / Free Time", "self"],
  ["14:00", "Q&A with Viivi", "live", "viivi", 0],
  ["15:30", "Break", "self"],
  ["16:00", "Meditation", "self"],
  ["16:40", "Break", "self"],
  ["17:00", "Guided Meditation", "live", "gm", 0],
  ["17:40", "Dinner / Free Time", "self"],
  ["19:20", "Break", "self"],
  ["19:30", "Talk", "live", "talk", 0],
  ["20:30", "Break", "self"],
  ["20:40", "Poetry", "rec", "poetry", -1],
  ["21:20", "Break", "self"],
  ["21:30", "Meditation", "self"],
  ["22:00", "End of Day", "close"],
];

// Sunday: the retreat itself closes after the final Talk (20:30 CEST).
// The wind-down that follows is optional and self-guided.
const SUNDAY = [
  ["09:00", "Meditation", "self"],
  ["09:40", "Break", "self"],
  ["09:50", "Q&A", "rec", "qa", -1],
  ["11:20", "Break", "self"],
  ["11:30", "Meditation", "self"],
  ["12:00", "Lunch / Free Time", "self"],
  ["14:00", "Q&A with Viivi", "live", "viivi", 0],
  ["15:30", "Break", "self"],
  ["16:00", "Meditation", "self"],
  ["16:40", "Break", "self"],
  ["17:00", "Guided Meditation", "live", "gm", 0],
  ["17:40", "Dinner / Free Time", "self"],
  ["19:20", "Break", "self"],
  ["19:30", "Final Talk", "live", "talk", 0],
  ["20:30", "Retreat Close 🙏", "close"],
  ["20:40", "Poetry (optional)", "rec", "poetry", -1],
  ["21:20", "Break", "self"],
  ["21:30", "Meditation (optional)", "self"],
  ["22:00", "End of Day", "close"],
];

const RETREAT_DAYS = [
  { date: "2026-07-08", template: DAY_ONE },
  { date: "2026-07-09", template: FULL_DAY },
  { date: "2026-07-10", template: FULL_DAY },
  { date: "2026-07-11", template: FULL_DAY },
  { date: "2026-07-12", template: SUNDAY },
];

// YouTube recordings, 0-indexed by retreat day (0 = Wed Jul 8).
// Add new IDs here as they appear in the Recordings doc.
const RECORDINGS = {
  gm: { 0: "IdJzO_a-i0w", 1: "o_SpSquIuuM" },
  talk: { 0: "2b4Hsy8h2rk", 1: "kMOeiAyKqTo" },
  qa: { 0: "2s76op3f6R8", 1: "Gan46Py8TlU" },
  poetry: { 0: "9WjLV4QVSG0", 1: "eAL5vdTgRB0" },
  viivi: { 1: "iYDCUnAo5lQ", 2: "Q77D8HY_uvo" },
};

const RECORDINGS_DOC_URL =
  "https://docs.google.com/document/d/1rkIvPc6x3rBdop8l-StP5VZ-79uowX2yZBSSRTDqC5E/edit";

const elements = {
  statusLabel: document.querySelector("#status-label"),
  currentTitle: document.querySelector("#current-title"),
  currentWindow: document.querySelector("#current-window"),
  countdown: document.querySelector("#countdown"),
  countdownNote: document.querySelector("#countdown-note"),
  nextTitle: document.querySelector("#next-title"),
  nextWindow: document.querySelector("#next-window"),
  nextLiveNote: document.querySelector("#next-live-note"),
  nextLiveTitle: document.querySelector("#next-live-title"),
  nextLiveWindow: document.querySelector("#next-live-window"),
  zoomButton: document.querySelector("#zoom-button"),
  sourceNote: document.querySelector("#source-note"),
  localZoneLabel: document.querySelector("#local-zone-label"),
  dayTabs: document.querySelector("#day-tabs"),
  dayPanel: document.querySelector("#day-panel"),
  recordingDialog: document.querySelector("#recording-dialog"),
  recordingDialogTitle: document.querySelector("#recording-dialog-title"),
  recordingMount: document.querySelector("#recording-mount"),
};

const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function getTimeZoneOffset(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day),
    Number(values.hour), Number(values.minute), Number(values.second)
  );
  return asUtc - date.getTime();
}

function zonedTimeToDate({ year, month, day, hour, minute }, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const firstOffset = getTimeZoneOffset(new Date(utcGuess), timeZone);
  const secondOffset = getTimeZoneOffset(new Date(utcGuess - firstOffset), timeZone);
  return new Date(utcGuess - secondOffset);
}

function buildEvents() {
  return RETREAT_DAYS.flatMap((retreatDay, dayIndex) => {
    const [year, month, day] = retreatDay.date.split("-").map(Number);

    return retreatDay.template.map(([time, name, kind, recKey, recDayOffset]) => {
      const [hour, minute] = time.split(":").map(Number);
      const recDay = recKey ? dayIndex + recDayOffset : null;
      const videoId = recKey ? RECORDINGS[recKey]?.[recDay] ?? null : null;

      return {
        dayIndex,
        name,
        kind,
        recKey: recKey || null,
        videoId,
        start: zonedTimeToDate({ year, month, day, hour, minute }, SOURCE_TIME_ZONE),
      };
    });
  }).sort((a, b) => a.start - b.start);
}

const events = buildEvents();
let selectedDayIndex = null;
let renderedDayIndex = null;

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: localTimeZone, hour: "numeric", minute: "2-digit",
  }).format(date);
}

function formatTimeWithZone(date) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: localTimeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(date);
}

function formatTabDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: localTimeZone, weekday: "short", month: "short", day: "numeric",
  }).format(date);
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.ceil(Math.max(0, milliseconds) / 60000);
  if (totalMinutes < 1) return "<1 min";
  if (totalMinutes > 180) return `${Math.ceil(totalMinutes / 60)} hr`;
  return `${totalMinutes} min`;
}

function findStatus(now) {
  const firstEvent = events[0];
  const nextIndex = events.findIndex((event) => event.start > now);

  if (now < firstEvent.start) {
    return { current: null, next: firstEvent, phase: "before" };
  }

  if (nextIndex === -1) {
    const finalEvent = events[events.length - 1];
    return {
      current: { name: "Retreat complete 🙏", start: finalEvent.start, end: null, kind: "close" },
      next: null,
      phase: "after",
    };
  }

  const current = events[nextIndex - 1];
  const next = events[nextIndex];

  if (current.name === "End of Day") {
    return {
      current: { name: "Closed for the evening", start: current.start, end: next.start, kind: "self" },
      next,
      phase: "between",
    };
  }

  return { current: { ...current, end: next.start }, next, phase: "during" };
}

function findNextLive(now) {
  return events.find((event) => event.kind === "live" && event.start > now) || null;
}

function getCurrentDayIndex(now) {
  if (now < events[0].start) return 0;

  const upcomingIndex = events.findIndex((event) => event.start > now);
  if (upcomingIndex === -1) return RETREAT_DAYS.length - 1;

  const previous = events[upcomingIndex - 1];
  // Overnight (after End of Day), the upcoming morning is the relevant day.
  return previous.name === "End of Day"
    ? events[upcomingIndex].dayIndex
    : previous.dayIndex;
}

function recordingLabel(event) {
  if (event.kind !== "rec") return "";
  const sourceDay = event.recKey === "viivi" ? event.dayIndex : event.dayIndex - 1;
  const sourceDate = RETREAT_DAYS[sourceDay];
  if (!sourceDate) return "";
  const weekday = new Intl.DateTimeFormat(undefined, {
    timeZone: SOURCE_TIME_ZONE, weekday: "long",
  }).format(zonedTimeToDate({
    year: Number(sourceDate.date.slice(0, 4)),
    month: Number(sourceDate.date.slice(5, 7)),
    day: Number(sourceDate.date.slice(8, 10)),
    hour: 12, minute: 0,
  }, SOURCE_TIME_ZONE));
  return `${weekday}’s recording`;
}

function renderDayTabs() {
  elements.dayTabs.innerHTML = RETREAT_DAYS.map((retreatDay, index) => {
    const firstEvent = events.find((event) => event.dayIndex === index);
    return `
      <button
        id="day-tab-${index}"
        class="day-tab"
        type="button"
        role="tab"
        aria-controls="day-panel"
        data-day-index="${index}"
      >
        <span class="day-tab-name">Day ${index + 1}</span>
        <span class="day-tab-date">${formatTabDate(firstEvent.start)}</span>
      </button>
    `;
  }).join("");

  elements.dayTabs.querySelectorAll("[role=tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      selectedDayIndex = Number(tab.dataset.dayIndex);
      renderDayPanel();
      renderStatus();
    });
  });
}

function updateDayTabs(currentDayIndex) {
  elements.dayTabs.querySelectorAll("[role=tab]").forEach((tab) => {
    const index = Number(tab.dataset.dayIndex);
    tab.classList.toggle("is-current", index === currentDayIndex);
    tab.setAttribute("aria-selected", String(index === selectedDayIndex));
  });
}

function renderDayPanel() {
  const dayEvents = events.filter((event) => event.dayIndex === selectedDayIndex);

  elements.dayPanel.innerHTML = `
    <div class="session-list">
      ${dayEvents.map((event) => {
        const badge = event.kind === "live"
          ? '<span class="badge badge-live">LIVE</span>'
          : event.kind === "rec"
            ? '<span class="badge badge-rec">REPLAY</span>'
            : "";
        const replayNote = event.kind === "rec"
          ? `<span class="session-note">${recordingLabel(event)}</span>`
          : "";
        const watchLink = event.videoId
          ? `<a class="session-watch" href="https://youtu.be/${event.videoId}" data-video-id="${event.videoId}" data-session-name="${event.name}" target="_blank" rel="noopener noreferrer">▶ Watch</a>`
          : event.recKey
            ? `<a class="session-watch session-watch-pending" href="${RECORDINGS_DOC_URL}" target="_blank" rel="noopener noreferrer">check recordings doc</a>`
            : "";

        return `
          <div class="session-row session-kind-${event.kind}" data-start="${event.start.toISOString()}">
            <time class="session-time" datetime="${event.start.toISOString()}">${formatTime(event.start)}</time>
            <div class="session-detail">
              <span class="session-name">${event.name}</span>
              ${badge}
              ${replayNote}
              <span class="session-state" aria-hidden="true"></span>
            </div>
            ${watchLink}
          </div>
        `;
      }).join("")}
    </div>
  `;

  renderedDayIndex = selectedDayIndex;
}

function updateHighlights(status, now) {
  elements.dayPanel.querySelectorAll(".session-row").forEach((row) => {
    row.classList.remove("is-active", "is-next");
    const stateLabel = row.querySelector(".session-state");
    stateLabel.textContent = "";

    if (status.current?.start && row.dataset.start === status.current.start.toISOString()
      && status.phase === "during") {
      row.classList.add("is-active");
      stateLabel.textContent = status.current.end
        ? `Now · ${formatDuration(status.current.end.getTime() - now.getTime())} left`
        : "Now";
    } else if (status.next && row.dataset.start === status.next.start.toISOString()) {
      row.classList.add("is-next");
      stateLabel.textContent = "Next";
    }
  });
}

function renderStatus() {
  const now = new Date();
  const status = findStatus(now);
  const currentDayIndex = getCurrentDayIndex(now);

  if (selectedDayIndex === null) selectedDayIndex = currentDayIndex;
  if (renderedDayIndex !== selectedDayIndex) renderDayPanel();

  if (!status.current) {
    elements.statusLabel.textContent = "Begins soon";
    elements.currentTitle.textContent = "The retreat has not started";
    elements.currentWindow.textContent = "";
  } else {
    elements.statusLabel.textContent = status.phase === "after" ? "Retreat status" : "Happening now";
    elements.currentTitle.textContent = status.current.name;
    elements.currentWindow.textContent = status.current.end
      ? `${formatTime(status.current.start)}–${formatTimeWithZone(status.current.end)}`
      : "";
  }

  if (!status.next) {
    elements.countdown.textContent = "🙏";
    elements.countdownNote.hidden = true;
  } else {
    elements.countdown.textContent = formatDuration(status.next.start.getTime() - now.getTime());
    elements.countdownNote.hidden = false;
    elements.nextTitle.textContent = status.next.name;
    elements.nextWindow.textContent = `· ${formatTimeWithZone(status.next.start)}`;
  }

  const nextLive = findNextLive(now);
  const isLiveNow = status.phase === "during" && status.current.kind === "live";
  elements.zoomButton.classList.toggle("is-live", isLiveNow);
  elements.zoomButton.textContent = isLiveNow ? "Join Zoom — live now" : "Join Zoom";

  const nextIsTheLiveOne = status.next && nextLive
    && status.next.start.getTime() === nextLive.start.getTime();

  if (isLiveNow || !nextLive || nextIsTheLiveOne) {
    elements.nextLiveNote.hidden = true;
  } else {
    elements.nextLiveNote.hidden = false;
    elements.nextLiveTitle.textContent = nextLive.name;
    elements.nextLiveWindow.textContent =
      `· ${formatTimeWithZone(nextLive.start)} · in ${formatDuration(nextLive.start.getTime() - now.getTime())}`;
  }

  elements.sourceNote.innerHTML = `Times shown in <strong>${localTimeZone}</strong>`;
  elements.localZoneLabel.textContent = localTimeZone;
  updateDayTabs(currentDayIndex);
  updateHighlights(status, now);
}

function initializeToneControl() {
  const setTone = (tone, persist) => {
    const resolved = tone === "dim" ? "dim" : "bright";
    document.documentElement.dataset.tone = resolved;
    document.querySelectorAll(".tone-control [data-tone]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tone === resolved));
    });
    if (persist) {
      try { localStorage.setItem("saa-eu-tone", resolved); } catch (_) { /* fine */ }
    }
  };

  setTone(document.documentElement.dataset.tone, false);
  document.querySelectorAll(".tone-control [data-tone]").forEach((button) => {
    button.addEventListener("click", () => setTone(button.dataset.tone, true));
  });
}

function initializeRecordingDialog() {
  elements.dayPanel.addEventListener("click", (event) => {
    const link = event.target.closest(".session-watch[data-video-id]");
    if (!link || typeof elements.recordingDialog.showModal !== "function") return;

    event.preventDefault();
    elements.recordingDialogTitle.textContent = link.dataset.sessionName;

    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(link.dataset.videoId)}?autoplay=1&rel=0`;
    frame.title = `${link.dataset.sessionName} recording`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    elements.recordingMount.replaceChildren(frame);
    elements.recordingDialog.showModal();
  });

  elements.recordingDialog.addEventListener("click", (event) => {
    if (event.target === elements.recordingDialog) elements.recordingDialog.close();
  });
  elements.recordingDialog.addEventListener("close", () => {
    elements.recordingMount.replaceChildren();
  });
}

initializeToneControl();
renderDayTabs();
initializeRecordingDialog();
renderStatus();
setInterval(renderStatus, 1000);
