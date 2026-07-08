const STORAGE_KEY = "qxes-subteacher-three-views-1150708-director-split-v4";
const ROOMS_KEY = "qxes-subteacher-rooms-1150708-director-split-v4";

const statusOptions = ["未招滿", "第1招錄取", "第2招錄取", "第3招錄取", "已額滿截止"];
const judgeProgress = ["未開始", "評分中", "已繳交評分表"];
const preciseTimeSlotSets = {
  full: ["09:00-09:25", "09:25-09:50", "09:50-10:15", "10:30-10:55", "10:55-11:20", "11:20-11:45", "11:45-12:10"],
  until1130: ["09:00-09:25", "09:25-09:50", "09:50-10:15", "10:15-10:40", "10:40-11:05", "11:05-11:30"],
  firstHalf: ["09:00-09:25", "09:25-09:50", "09:50-10:15", "10:15-10:40"],
  secondHalf: ["10:40-11:05", "11:05-11:30", "11:30-11:55", "11:55-12:20"],
};
const checklistLabels = {
  desks: "桌椅設備就位（評審桌椅、計時器、標示牌）",
  forms: "評分表件就位（口試/試教評分表、簽章表）",
  lessonPlans: "考生教案就位（收齊考生提供之一式3份教學活動設計）",
  staff: "試場人員就位（唱名、計分工作人員已到場）",
};

const fallbackRoomSchedules = {
  "7/8": {
    round: "第1次招考",
    date: "115年7月8日（星期三）",
    method: "試教10分鐘＋口試10分鐘",
    per_candidate_minutes: 25,
    rooms: [
      {
        room: "資優班教室一",
        subjects: [
          { id: "0708_room_1_subject_1", time: "09:00 - 12:00", subject: "導師", vacancy: "代理-實缺5名", scope: "國小數學科，單元自選", judges: ["邱俊智", "羅靜之", "黃志豪"] },
        ],
      },
      {
        room: "資優班教室二",
        subjects: [
          { id: "0708_room_2_subject_a", time: "09:00 - 10:40", subject: "身心障礙不分類巡迴輔導班教師", vacancy: "特教代理-實缺1名、控管缺1名", scope: "五年級數學，版本自選", judges: ["羅元廷", "蘇一智"] },
          { id: "0708_room_2_subject_c", time: "11:00 - 11:50", subject: "辦理本市教育局體育保健科業務、國小教育科業務", vacancy: "體育保健科業務1名、國小教育科業務1名", scope: "電腦實機操作行政文書處理相關概念", judges: ["羅元廷", "蘇一智"] },
        ],
      },
      {
        room: "205教室",
        subjects: [
          { id: "0708_room_3_subject_1", time: "09:00 - 10:40", subject: "社會科任", vacancy: "代理-實缺1名", scope: "五年級社會", judges: ["鄭嘉琪", "吳文瓊"] },
          { id: "0708_room_3_subject_2", time: "10:40 - 11:50", subject: "美勞科任", vacancy: "代理-實缺1名", scope: "三年級木作教學", judges: ["鄭嘉琪", "吳文瓊"] },
        ],
      },
      {
        room: "206教室",
        subjects: [
          { id: "0708_room_4_subject_1", time: "09:00 - 10:40", subject: "英語科任", vacancy: "代理-合理編制虛缺2名", scope: "五年級英語", judges: ["羅元廷", "羅靜之", "黃志豪"] },
          { id: "0708_room_4_subject_2", time: "10:40 - 11:25", subject: "行政支援", vacancy: "代理-增置餘額實缺1名", scope: "自然科學", judges: ["羅元廷", "羅靜之", "黃志豪"] },
        ],
      },
    ],
  },
  "7/10": {
    round: "第3次招考",
    date: "115年7月10日（星期五）",
    method: "試教10分鐘＋口試10分鐘（免教案）",
    per_candidate_minutes: 25,
    rooms: [
      { room: "資優班教室一", subjects: [{ id: "0710_room_1_subject_1", time: "09:00 - 11:30", subject: "自然鐘點教師", vacancy: "1名，每週10-14節", scope: "五年級自然，單元自選（試教10分鐘＋口試10分鐘，免教案）", judges: ["邱俊智", "陳莉榛", "高琳茵"] }] },
      { room: "資優班教室二", subjects: [{ id: "0710_room_2_subject_1", time: "09:00 - 10:40", subject: "閩南語鐘點教師", vacancy: "1名，每週8-10節", scope: "一年級閩南語，單元自選（試教10分鐘＋口試10分鐘，免教案）", judges: ["高琳茵", "蘇一智", "廖人鋐"] }] },
      { room: "205教室", subjects: [{ id: "0710_room_3_subject_1", time: "09:00 - 11:30", subject: "美勞鐘點教師", vacancy: "2名，每週12-16節", scope: "四年級木作教學，單元自選（試教10分鐘＋口試10分鐘，免教案）", judges: ["鄭嘉琪", "吳文瓊", "陳莉榛"] }] },
      { room: "206教室", subjects: [{ id: "0710_room_4_subject_1", time: "09:00 - 10:40", subject: "體育鐘點教師", vacancy: "1名，每週10-14節", scope: "四或五年級體育，單元自選（試教10分鐘＋口試10分鐘，免教案）", judges: ["廖人鋐", "蘇一智", "邱俊智"] }] },
    ],
  },
};

const legacyDefaultJobs = [
  makeJob("job_1", "導師", "資優班教室A", ["邱俊智", "羅靜之"], "1號 王小明\n2號 李大同", "試教＋口試", "數學科"),
  makeJob("job_2", "自然科任", "資優班教室B", ["黃志豪", "羅元廷"], "1號 陳怡君", "試教＋口試", "五年級自然"),
  makeJob("job_3", "身障巡迴輔導班", "", ["蘇一智"], "", "試教＋口試", "特殊教育教學演示"),
  makeJob("job_4", "美勞鐘點代課", "205", ["鄭嘉琪"], "1號 林志明", "試教＋口試", "木作教學"),
  makeJob("job_5", "一般鐘點代課", "206", ["吳文瓊"], "", "試教＋口試", "依現場公告科目"),
  makeJob("job_6", "英語科任", "", [], "", "試教＋口試", "英語教學演示"),
  makeJob("job_7", "體育科任", "", [], "", "試教＋口試", "體育課程教學演示"),
  makeJob("job_8", "音樂科任", "", [], "", "試教＋口試", "音樂課程教學演示"),
  makeJob("job_9", "資訊科任", "", [], "", "試教＋口試", "資訊融入教學"),
  makeJob("job_10", "資優巡迴輔導班", "", [], "", "試教＋口試", "資優教育課程設計"),
  makeJob("job_11", "特教班代理教師", "", [], "", "試教＋口試", "特殊教育課程教學"),
  makeJob("job_12", "本土語文鐘點代課", "", [], "", "試教＋口試", "本土語文教學演示"),
  makeJob("job_13", "社會科任", "", [], "", "試教＋口試", "社會領域教學演示"),
  makeJob("job_14", "健康科任", "", [], "", "試教＋口試", "健康教育教學演示"),
];

const defaultJobs = jobsFromRoomSchedules(loadRoomSchedules());

let state = loadState();
let currentView = "candidate";
let selectedJudge = "";

function loadRoomSchedules() {
  const raw = localStorage.getItem(ROOMS_KEY);
  if (!raw) return normalizeFixedRoomJudges(fallbackRoomSchedules);
  try {
    const parsed = JSON.parse(raw);
    return normalizeFixedRoomJudges(parsed && typeof parsed === "object" ? parsed : fallbackRoomSchedules);
  } catch {
    return normalizeFixedRoomJudges(fallbackRoomSchedules);
  }
}

function finalJuly8Schedule() {
  const checklist = { desks: false, forms: false, lessonPlans: false, staff: false };
  const rows = [
    { no: "01", name: "藍婷", subject: "一般代理-導師", vacancy: "代理-實缺", teachScope: "導師試教，依甄試簡章及現場公告辦理", oralScope: "導師職務口試，依甄試簡章及現場公告辦理" },
    { no: "02", name: "陳政輝", subject: "一般代理-體育科任", vacancy: "代理-實缺", teachScope: "體育科任試教，依甄試簡章及現場公告辦理", oralScope: "體育科任職務口試，依甄試簡章及現場公告辦理" },
    { no: "03", name: "吳姿慧", subject: "鐘點教師-自然", vacancy: "鐘點教師", teachScope: "自然科試教，依甄試簡章及現場公告辦理", oralScope: "自然鐘點教師口試，依甄試簡章及現場公告辦理" },
    { no: "04", name: "蘇于榕", subject: "鐘點教師-閩南語", vacancy: "鐘點教師", teachScope: "閩南語試教，依甄試簡章及現場公告辦理", oralScope: "閩南語鐘點教師口試，依甄試簡章及現場公告辦理" },
    { no: "05", name: "倪月如", subject: "教支人員-客語", vacancy: "教支人員", teachScope: "客語教學演示，依甄試簡章及現場公告辦理", oralScope: "客語教支人員口試，依甄試簡章及現場公告辦理" },
    { no: "06", name: "古安富", subject: "教支人員-排灣族語", vacancy: "教支人員", teachScope: "排灣族語教學演示，依甄試簡章及現場公告辦理", oralScope: "排灣族語教支人員口試，依甄試簡章及現場公告辦理" },
  ];
  const slotTimes = ["09:00 - 09:10", "09:10 - 09:20", "09:20 - 09:30", "09:30 - 09:40", "09:40 - 09:50", "09:50 - 10:00"];
  const teachingOrder = ["01", "02", "03", "04", "05", "06"];
  const oralOrder = ["04", "05", "06", "01", "02", "03"];
  const buildSubjects = (kind, scopeKey, roomCode, order) => order.map((no, index) => {
    const row = rows.find((item) => item.no === no);
    return {
      id: `0708_${roomCode}_${row.no}`,
      date: "7/8",
      time: slotTimes[index],
      subject: `${row.no}號 ${row.subject}－${row.name}`,
      vacancy: row.vacancy,
      candidates: `${row.no}號 ${row.name}`,
      scope: `${row[scopeKey]}（本場只看${kind}）`,
      judges: kind === "試教" ? ["試教委員"] : ["口試委員"],
      status: "未報到",
      checklist,
    };
  });

  return {
    round: "第1次第1招",
    date: "115年7月8日（星期三）",
    method: "分場辦理：一間只看試教，一間只看口試",
    per_candidate_minutes: 10,
    note: "7/8 依主任指示分流：1、2、3號先考試教；4、5、6號先考口試，再互換場地。",
    rooms: [
      {
        id: "0708_teaching_room",
        room: "試教場",
        title: "試教場：只看試教",
        time: "09:00 - 10:00",
        mode: "本場僅辦理試教／教學演示評分；1、2、3號先考試教，4、5、6號接續試教。",
        subjects: buildSubjects("試教", "teachScope", "teaching", teachingOrder),
      },
      {
        id: "0708_oral_room",
        room: "口試場",
        title: "口試場：只看口試",
        time: "09:00 - 10:00",
        mode: "本場僅辦理口試評分；4、5、6號先考口試，1、2、3號接續口試。",
        subjects: buildSubjects("口試", "oralScope", "oral", oralOrder),
      },
    ],
  };
}

function finalJuly10Schedule() {
  const checklist = { desks: false, forms: false, lessonPlans: false, staff: false };
  return {
    round: "第3次招考",
    date: "115年7月10日（星期五）",
    method: "試教10分鐘＋口試10分鐘（免教案）",
    per_candidate_minutes: 25,
    rooms: [
      {
        id: "0710_room_1",
        room: "資優班教室一",
        title: "考場一：資優班教室一",
        time: "09:00 - 11:30",
        mode: "邱俊智、陳莉榛定點審查；委員不動",
        subjects: [
          { id: "job_11", date: "7/10", time: "09:00 - 11:30", subject: "自然鐘點教師(代課)", vacancy: "代課鐘點", scope: "五年級自然（試教10分+口試10分）", judges: ["邱俊智", "陳莉榛"], status: "未招滿", checklist },
        ],
      },
      {
        id: "0710_room_2",
        room: "資優班教室二",
        title: "考場二：資優班教室二",
        time: "09:00 - 10:40",
        mode: "高琳茵、蘇一智定點審查；委員不動",
        subjects: [
          { id: "job_12", date: "7/10", time: "09:00 - 10:40", subject: "閩南語鐘點教師(代課)", vacancy: "代課鐘點", scope: "一年級閩南語（試教10分+口試10分）", judges: ["高琳茵", "蘇一智"], status: "未招滿", checklist },
        ],
      },
      {
        id: "0710_room_3",
        room: "205 教室",
        title: "考場三：205 教室",
        time: "09:00 - 11:30",
        mode: "廖人鋐、鄭嘉琪、吳文瓊定點審查；委員不動",
        subjects: [
          { id: "job_13", date: "7/10", time: "09:00 - 11:30", subject: "美勞鐘點教師(代課)", vacancy: "代課鐘點", scope: "四年級木作教學（試教10分+口試10分）", judges: ["廖人鋐", "鄭嘉琪", "吳文瓊"], status: "未招滿", checklist },
          { id: "job_14", date: "7/10", time: "09:00 - 10:40", subject: "體育鐘點教師(代課)", vacancy: "代課鐘點", scope: "四或五年級體育（試教10分+口試10分）", judges: ["廖人鋐", "鄭嘉琪", "吳文瓊"], status: "未招滿", checklist },
        ],
      },
    ],
  };
}

function normalizeFixedRoomJudges(schedules) {
  const next = clone(schedules || fallbackRoomSchedules);
  const exam0708 = next["7/8"];
  if (!exam0708 || !Array.isArray(exam0708.rooms)) return next;

  const findRoom = (roomId) => exam0708.rooms.find((room) => room.id === roomId);
  const setSubjectJudges = (roomId, subjectId, judges) => {
    const room = findRoom(roomId);
    const subject = room?.subjects?.find((item) => item.id === subjectId);
    if (subject) subject.judges = judges;
  };

  const room2 = findRoom("0708_room_2");
  if (room2) {
    room2.title = "考場二：資優班教室二（委員原地不動）";
    room2.mode = "中場休息、更換試卷與評分表；委員原地不動";
    const transition = room2.subjects?.find((item) => item.id === "0708_room_2_transition");
    if (transition) {
      transition.subject = "中場休息、更換試卷與評分表";
      transition.scope = "委員原地不動，僅更換試卷與評分表";
    }
  }

  const room3 = findRoom("0708_room_3");
  if (room3) room3.mode = "鄭嘉琪、吳文瓊定點審查；委員不動";

  setSubjectJudges("0708_room_2", "0708_room_2_subject_c", ["羅元廷", "蘇一智"]);
  setSubjectJudges("0708_room_3", "0708_room_3_subject_1", ["鄭嘉琪", "吳文瓊"]);
  setSubjectJudges("0708_room_3", "0708_room_3_subject_2", ["鄭嘉琪", "吳文瓊"]);

  next["7/8"] = finalJuly8Schedule();
  next["7/10"] = finalJuly10Schedule();

  return next;
}

function jobsFromRoomSchedules(schedules) {
  const jobs = [];
  Object.entries(schedules).forEach(([dateKey, exam]) => {
    (exam.rooms || []).forEach((room) => {
      (room.subjects || []).forEach((subject) => {
        if (!(subject.judges || []).length) return;
        jobs.push(makeJob(
          subject.id || `${dateKey}_${room.room}_${subject.subject}`,
          subject.subject,
          room.room,
          subject.judges || [],
          subject.candidates || "",
          exam.method || "試教＋口試",
          subject.scope || "",
          {
            dateKey,
            dateLabel: exam.date || dateKey,
            round: exam.round || "",
            time: subject.time || room.time || "",
            slotMinutes: subject.slot_minutes || room.slot_minutes || exam.per_candidate_minutes || 25,
            vacancy: subject.vacancy || "",
            roomTitle: room.title || room.room || "",
          }
        ));
      });
    });
  });
  return jobs.length ? jobs : legacyDefaultJobs;
}

function makeJob(id, title, room, judges, candidates, method, scope, meta = {}) {
  return {
    id,
    title,
    room,
    judges,
    candidates,
    method,
    scope,
    dateKey: meta.dateKey || "",
    dateLabel: meta.dateLabel || "",
    round: meta.round || "",
    time: meta.time || "",
    slotMinutes: Number(meta.slotMinutes) || 25,
    vacancy: meta.vacancy || "",
    roomTitle: meta.roomTitle || "",
    judge_status: "未開始",
    status: "未招滿",
    checklist: {
      desks: false,
      forms: false,
      lessonPlans: false,
      staff: false,
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const scheduledJobs = jobsFromRoomSchedules(loadRoomSchedules());
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = { jobs: clone(scheduledJobs), updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const saved = JSON.parse(raw);
    return { jobs: mergeJobs(saved.jobs || [], scheduledJobs), updatedAt: saved.updatedAt || new Date().toISOString() };
  } catch {
    return { jobs: clone(scheduledJobs), updatedAt: new Date().toISOString() };
  }
}

function mergeJobs(savedJobs, sourceJobs = defaultJobs) {
  return sourceJobs.map((job) => {
    const saved = savedJobs.find((item) => item.id === job.id);
    if (!saved) return job;
    const lockedRoomIds = ["0708_room_2_subject_c", "0708_room_3_subject_1", "0708_room_3_subject_2"];
    const merged = { ...job, ...saved, checklist: { ...job.checklist, ...(saved.checklist || {}) } };
    if (job.dateKey === "7/8") {
      return {
        ...merged,
        title: job.title,
        room: job.room,
        judges: job.judges,
        time: job.time,
        slotMinutes: job.slotMinutes,
        method: job.method,
        scope: job.scope,
        vacancy: job.vacancy,
        roomTitle: job.roomTitle,
        dateKey: job.dateKey,
        dateLabel: job.dateLabel,
        round: job.round,
      };
    }
    if (job.dateKey === "7/10") {
      return {
        ...merged,
        title: job.title,
        room: job.room,
        judges: job.judges,
        time: job.time,
        slotMinutes: job.slotMinutes,
        method: job.method,
        scope: job.scope,
        vacancy: job.vacancy,
        roomTitle: job.roomTitle,
        dateKey: job.dateKey,
        dateLabel: job.dateLabel,
        round: job.round,
      };
    }
    if (!lockedRoomIds.includes(job.id)) {
      return { ...merged, slotMinutes: job.slotMinutes || merged.slotMinutes };
    }
    return {
      ...merged,
      room: job.room,
      judges: job.judges,
      time: job.time,
      slotMinutes: job.slotMinutes,
      roomTitle: job.roomTitle,
      dateKey: job.dateKey,
      dateLabel: job.dateLabel,
      round: job.round,
      scope: job.scope,
      vacancy: job.vacancy,
      method: job.method,
    };
  });
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAndRender() {
  saveState();
  renderAll();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseList(value) {
  return String(value || "")
    .split(/[\n,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function minutesFromTime(value) {
  const match = String(value || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildSequenceSlots(job) {
  const [startText, endText] = String(job.time || "").split(/\s*-\s*/);
  const start = minutesFromTime(startText);
  const end = minutesFromTime(endText);
  const slotMinutes = Number(job.slotMinutes) || 25;
  if (start === null || end === null || end <= start || slotMinutes <= 0) return [];

  const candidates = parseList(job.candidates);
  const availableSlots = Math.max(1, Math.floor((end - start) / slotMinutes));
  const count = candidates.length ? Math.min(candidates.length, availableSlots) : availableSlots;

  return Array.from({ length: count }, (_, index) => {
    const slotStart = start + index * slotMinutes;
    const slotEnd = Math.min(slotStart + slotMinutes, end);
    return {
      seq: index + 1,
      time: `${formatMinutes(slotStart)} - ${formatMinutes(slotEnd)}`,
      candidate: candidates[index] || "",
    };
  });
}

function getPreciseTimeSlots(job) {
  const date = job.dateKey || job.date || "";
  if (job.id?.startsWith("0708_teaching_") || job.id?.startsWith("0708_oral_")) {
    return buildSequenceSlots(job).map((slot) => slot.time.replace(/\s/g, ""));
  }
  if (job.id === "job_1" || job.id === "0708_room_1_subject_1" || job.title.includes("導師")) {
    return preciseTimeSlotSets.full;
  }

  const firstHalfIds = ["job_4", "job_5", "0708_room_2_subject_a", "0708_room_3_subject_1", "0708_room_4_subject_1"];
  const isShortOrFirstHalf = firstHalfIds.includes(job.id)
    || job.title.includes("社會")
    || job.title.includes("英語")
    || job.title.includes("體育")
    || job.title.includes("閩南語");
  if (isShortOrFirstHalf) {
    return preciseTimeSlotSets.firstHalf;
  }

  const isJuly10MidLength = date === "7/10" && (job.title.includes("自然") || job.title.includes("美勞"));
  if (isJuly10MidLength) {
    return preciseTimeSlotSets.until1130;
  }

  if (date !== "7/8" && date !== "7/10") return buildSequenceSlots(job).map((slot) => slot.time.replace(/\s/g, ""));

  return preciseTimeSlotSets.secondHalf;
}

function sequenceSlotsTable(job, options = {}) {
  const slots = getPreciseTimeSlots(job);
  return `
    <div class="mt-2 mb-3 p-2 bg-light rounded border">
      <small class="fw-bold d-block mb-1 text-secondary">⏱️ 考生順序精準時間：</small>
      ${slots.map((slot, index) => `
        <div class="d-flex justify-content-between gap-3 text-muted sequence-slot-row" style="font-size: 0.85rem;">
          <span>第 ${index + 1} 號考生</span>
          <span class="font-monospace fw-semibold text-dark">${escapeHtml(slot)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function roomText(job) {
  return job.room ? escapeHtml(job.room) : '<span class="waiting-room">請靜待公告</span>';
}

function statusClass(status) {
  if (status === "已額滿截止") return "closed";
  if (status.includes("錄取")) return "done";
  if (status === "評分中") return "active";
  if (status === "已繳交評分表") return "done";
  return "";
}

function statusPill(status) {
  return `<span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

function isReady(job) {
  return Object.values(job.checklist).every(Boolean);
}

function renderCandidateCards() {
  const root = document.querySelector("#candidateCards");
  const keyword = (document.querySelector("#candidateSearch")?.value || "").trim().toLowerCase();
  root.innerHTML = "";
  state.jobs.filter((job) => {
    if (!keyword) return true;
    return [job.title, job.scope, job.room, job.dateLabel, job.time, job.vacancy].join(" ").toLowerCase().includes(keyword);
  }).forEach((job) => {
    const closed = job.status === "已額滿截止";
    const card = document.createElement("article");
    card.className = `job-card ${closed ? "closed" : ""}`;
    card.innerHTML = `
      <h3 class="h4 fw-black mb-3">🎯 報考科目：${escapeHtml(job.title)}</h3>
      ${job.candidates ? `<p class="fs-5 fw-bold text-primary mb-2">👤 考生：${escapeHtml(job.candidates)}</p>` : ""}
      <p class="mb-2">🗓️ ${escapeHtml(job.dateLabel || "日期待公告")} ${job.round ? `｜${escapeHtml(job.round)}` : ""}</p>
      <p class="mb-2">⏰ 應試時段：${escapeHtml(job.time || "請靜待公告")}</p>
      <p class="fs-5 mb-3">📍 應試教室：${roomText(job)}</p>
      ${sequenceSlotsTable(job)}
      <div>📢 招考狀態：${statusPill(job.status)}</div>
      ${closed ? '<div class="closed-message mt-3">❌ 本職缺已錄取額滿，取消後續招考</div>' : ""}
    `;
    root.appendChild(card);
  });
}

function allJudges() {
  const names = new Set();
  state.jobs.forEach((job) => job.judges.forEach((name) => names.add(name)));
  return [...names].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function renderJudgeSelect() {
  const select = document.querySelector("#judgeSelect");
  const judges = allJudges();
  const previous = selectedJudge || select.value;
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = judges.length ? "請選擇委員" : "尚未指派委員";
  select.appendChild(empty);
  judges.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
  if (judges.includes(previous)) {
    select.value = previous;
    selectedJudge = previous;
  } else {
    selectedJudge = "";
  }
}

function renderJudgeCards() {
  const root = document.querySelector("#judgeCards");
  root.innerHTML = "";
  const jobs = selectedJudge ? state.jobs.filter((job) => job.judges.includes(selectedJudge)) : [];
  if (!selectedJudge) {
    root.innerHTML = '<div class="alert alert-warning">請先選擇委員姓名。</div>';
    return;
  }
  if (!jobs.length) {
    root.innerHTML = '<div class="alert alert-secondary">目前沒有指派給此委員的科目。</div>';
    return;
  }
  jobs.forEach((job) => {
    const candidates = parseList(job.candidates);
    const card = document.createElement("article");
    card.className = "judge-task-card";
    card.innerHTML = `
      <div class="d-flex flex-column flex-xl-row justify-content-between gap-2 mb-3">
        <div>
          <h3 class="h4 mb-2">🏫 ${escapeHtml(job.title)}</h3>
          <div class="fs-5 fw-bold mb-2">🗓️ ${escapeHtml(job.dateLabel || "日期待公告")} ${job.round ? `｜${escapeHtml(job.round)}` : ""}</div>
          <div class="fs-5 fw-bold mb-2">⏰ ${escapeHtml(job.time || "時段待公告")}　📍 ${roomText(job)}</div>
          ${sequenceSlotsTable(job)}
          ${job.vacancy ? `<div class="text-secondary mb-2">缺額：${escapeHtml(job.vacancy)}</div>` : ""}
          <div>${statusPill(job.judge_status)} ${isReady(job) ? '<span class="status-pill done ms-1">試場準備就位</span>' : ""}</div>
        </div>
        <button class="btn btn-outline-primary fw-bold progress-button" type="button">🔄 切換進度</button>
      </div>
      <p><strong>📝 甄選方式：</strong>${escapeHtml(job.method)}</p>
      <p><strong>試教範圍提示：</strong>${escapeHtml(job.scope)}</p>
      <p class="mb-2"><strong>👥 評審考生名單：</strong></p>
      <ol class="candidate-list">
        ${candidates.length ? candidates.map((candidate) => `<li>${escapeHtml(candidate)}</li>`).join("") : "<li>尚未登錄考生名單</li>"}
      </ol>
    `;
    card.querySelector(".progress-button").addEventListener("click", () => {
      const next = (judgeProgress.indexOf(job.judge_status) + 1) % judgeProgress.length;
      job.judge_status = judgeProgress[next];
      saveAndRender();
    });
    root.appendChild(card);
  });
}

function renderAdminCards() {
  const root = document.querySelector("#adminCards");
  root.innerHTML = "";
  state.jobs.forEach((job) => {
    const card = document.createElement("article");
    card.className = "admin-card";
    card.innerHTML = `
      <div class="d-flex flex-column flex-xl-row justify-content-between gap-2 mb-3">
        <div>
          <h3 class="h4 mb-1">${escapeHtml(job.title)}</h3>
          <p class="text-secondary mb-2">${escapeHtml(job.dateLabel || "日期待公告")} ${job.round ? `｜${escapeHtml(job.round)}` : ""}｜${escapeHtml(job.time || "時段待公告")}｜${escapeHtml(job.room || "教室待公告")}</p>
          <div>${statusPill(job.status)} ${isReady(job) ? '<span class="status-pill done ms-1">試場準備就位</span>' : '<span class="status-pill active ms-1">就位檢查中</span>'}</div>
        </div>
      </div>
      <div class="admin-grid">
        <section>
          <h4 class="h5">考場基礎指派與考生登錄</h4>
          <div class="admin-field-grid">
            <label class="form-label fw-bold">分配教室
              <input class="form-control" data-field="room" value="${escapeHtml(job.room)}" placeholder="例如：205" />
            </label>
            <label class="form-label fw-bold">評審委員名單
              <textarea class="form-control" data-field="judges" placeholder="多位委員用逗號或換行分隔">${escapeHtml(job.judges.join("\n"))}</textarea>
            </label>
            <label class="form-label fw-bold">考生名單
              <textarea class="form-control" data-field="candidates" placeholder="多位考生用逗號或換行分隔">${escapeHtml(job.candidates)}</textarea>
            </label>
            <label class="form-label fw-bold">甄選方式
              <input class="form-control" data-field="method" value="${escapeHtml(job.method)}" />
            </label>
            <label class="form-label fw-bold">試教範圍提示
              <input class="form-control" data-field="scope" value="${escapeHtml(job.scope)}" />
            </label>
            <label class="form-label fw-bold">招考狀態管理
              <select class="form-select" data-field="status">
                ${statusOptions.map((status) => `<option value="${escapeHtml(status)}" ${job.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
              </select>
            </label>
          </div>
        </section>
        <section>
          <h4 class="h5">試務資源就位檢查表</h4>
          <div class="checklist-box">
            ${Object.entries(checklistLabels).map(([key, label]) => `
              <label class="check-row">
                <input type="checkbox" data-check="${key}" ${job.checklist[key] ? "checked" : ""} />
                <span>${escapeHtml(label)}</span>
              </label>
            `).join("")}
          </div>
          <p class="readonly-help mt-3 mb-0">全部勾選後，考生與評審視角會同步顯示「試場準備就位」。</p>
        </section>
      </div>
    `;
    card.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", () => updateJobField(job, input));
      input.addEventListener("change", () => updateJobField(job, input));
    });
    card.querySelectorAll("[data-check]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        job.checklist[checkbox.dataset.check] = checkbox.checked;
        saveAndRender();
      });
    });
    root.appendChild(card);
  });
}

function updateJobField(job, input) {
  const field = input.dataset.field;
  if (field === "judges") {
    job.judges = parseList(input.value);
  } else if (field === "status") {
    job.status = input.value;
  } else {
    job[field] = input.value;
  }
  saveAndRender();
}

function setView(view) {
  currentView = view;
  document.querySelectorAll(".view-button").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    const color = button.dataset.view === "candidate" ? "primary" : button.dataset.view === "judge" ? "success" : "warning";
    button.classList.toggle(`btn-${color}`, active);
    button.classList.toggle(`btn-outline-${color}`, !active);
  });
  document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
}

function renderAll() {
  renderCandidateCards();
  renderJudgeSelect();
  renderJudgeCards();
  renderAdminCards();
  setView(currentView);
}

function setupEvents() {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelector("#judgeSelect").addEventListener("change", (event) => {
    selectedJudge = event.target.value;
    renderJudgeCards();
  });
  document.querySelector("#candidateSearch").addEventListener("input", renderCandidateCards);
  document.querySelector("#resetThreeViews").addEventListener("click", () => {
    if (!confirm("確定重設三視角試務資料？教室、委員、考生、就位勾選與狀態都會還原。")) return;
    state = { jobs: clone(jobsFromRoomSchedules(loadRoomSchedules())), updatedAt: new Date().toISOString() };
    selectedJudge = "";
    saveState();
    renderAll();
  });
}

function renderClock() {
  const clock = document.querySelector("#liveClock");
  if (!clock) return;
  clock.textContent = `🕒 系統即時時間：${new Date().toLocaleString("zh-TW", { hour12: false })}`;
}

setupEvents();
saveState();
renderClock();
renderAll();
setInterval(renderClock, 1000);
