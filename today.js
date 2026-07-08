const API_URL = "https://script.google.com/macros/s/AKfycby9v87cRPksXV5pvIhEXbZxvCE_L69JI06aQ26wMeX3vZCou2MiijkP9z0V8K9ONFga2g/exec";

const STORAGE_KEY = "qxes-subteacher-one-candidate-state-v1";
const LOCAL_SCORES_KEY = "qxes-subteacher-one-candidate-local-scores-v1";

const judges = ["第1評審委員", "第2評審委員", "第3評審委員", "第4評審委員", "第5評審委員"];

const candidates = [
  {
    no: "01",
    name: "藍婷",
    category: "一般代理",
    subject: "導師",
    schedule: {
      teaching: { room: "試場 A", time: "09:00-09:10" },
      oral: { room: "試場 B", time: "09:40-09:50" },
    },
  },
  {
    no: "02",
    name: "陳政輝",
    category: "一般代理",
    subject: "體育科任",
    schedule: {
      teaching: { room: "試場 A", time: "09:10-09:20" },
      oral: { room: "試場 B", time: "09:50-10:00" },
    },
  },
  {
    no: "03",
    name: "倪月如",
    category: "教支人員",
    subject: "客語",
    schedule: {
      teaching: { room: "試場 A", time: "09:20-09:30" },
      oral: { room: "試場 B", time: "10:00-10:10" },
    },
  },
  {
    no: "04",
    name: "古安富",
    category: "教支人員",
    subject: "排灣族語",
    schedule: {
      oral: { room: "試場 B", time: "09:00-09:10" },
      teaching: { room: "試場 A", time: "09:40-09:50" },
    },
  },
  {
    no: "05",
    name: "吳慧姿",
    category: "鐘點教師",
    subject: "自然",
    schedule: {
      oral: { room: "試場 B", time: "09:10-09:20" },
      teaching: { room: "試場 A", time: "09:50-10:00" },
    },
  },
  {
    no: "06",
    name: "蘇于榕",
    category: "鐘點教師",
    subject: "閩南語",
    schedule: {
      oral: { room: "試場 B", time: "09:20-09:30" },
      teaching: { room: "試場 A", time: "10:00-10:10" },
    },
  },
];

const scoreTypes = {
  teaching: {
    label: "試教評分",
    max: [25, 25, 20, 20, 10],
    items: [
      "教學內容-學科專門知識",
      "教學技巧",
      "教案設計",
      "表達能力與師生互動",
      "儀容舉止",
    ],
  },
  oral: {
    label: "口試評分",
    max: [20, 30, 20, 20, 10],
    items: [
      "教育理念與抱負",
      "課程及教學實務與經驗",
      "訓輔及特教知能實務與經驗",
      "表達能力與機智反應",
      "儀容舉止",
    ],
  },
};

let currentView = "candidate";
let currentCandidateIndex = 0;
let selectedJudge = "";
let cloudScoresCache = [];
let localScoresCache = [];

function currentCandidate() {
  return candidates[currentCandidateIndex];
}

function activeScoreTypeKey() {
  if (currentView !== "judge") return "teaching";

  const activePane = document.querySelector("#judgeStage .tab-pane.active");
  const activeForm = activePane?.querySelector("form[data-score-key]");
  return activeForm?.dataset.scoreKey || "teaching";
}

function scheduleLabel(candidate, scoreKey) {
  const schedule = candidate.schedule[scoreKey];
  return `${schedule.time}（${schedule.room}）`;
}

function currentJob(scoreKey = activeScoreTypeKey()) {
  const candidate = currentCandidate();
  const selectedSchedule = candidate.schedule[scoreKey] || candidate.schedule.teaching;

  return {
    id: `candidate_${candidate.no}_${scoreKey}`,
    candidateNo: candidate.no,
    candidateName: candidate.name,
    title: `${candidate.category} - ${candidate.subject}`,
    scoreKey,
    scoreType: scoreTypes[scoreKey]?.label || "試教評分",
    room: selectedSchedule.room,
    time: selectedSchedule.time,
    teaching: candidate.schedule.teaching,
    oral: candidate.schedule.oral,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    currentView = saved.currentView || "candidate";
    currentCandidateIndex = Number(saved.currentCandidateIndex) || 0;
    selectedJudge = saved.selectedJudge || "";
  } catch (_error) {
    currentView = "candidate";
    currentCandidateIndex = 0;
    selectedJudge = "";
  }

  currentCandidateIndex = Math.max(0, Math.min(candidates.length - 1, currentCandidateIndex));

  try {
    localScoresCache = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
    if (!Array.isArray(localScoresCache)) localScoresCache = [];
  } catch (_error) {
    localScoresCache = [];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentView, currentCandidateIndex, selectedJudge }));
}

function isApiReady() {
  return API_URL && !API_URL.includes("XXXXX");
}

function scoreSource() {
  return isApiReady() && cloudScoresCache.length ? cloudScoresCache : localScoresCache;
}

function scoresFor(candidate) {
  return scoreSource().filter((score) => {
    return String(score.candidateNo || "") === candidate.no || String(score.candidateName || "").includes(candidate.name);
  });
}

function hasExistingScore(candidate, scoreType) {
  return scoresFor(candidate).some((score) => score.judgeName === selectedJudge && score.scoreType === scoreType);
}

function setSyncStatus(message) {
  document.querySelector("#syncStatus").textContent = message;
}

async function syncScoresFromCloud() {
  if (!isApiReady()) {
    setSyncStatus(`本機測試模式：目前有 ${localScoresCache.length} 筆暫存評分。`);
    return;
  }

  try {
    const res = await fetch(API_URL, { method: "GET", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cloudScoresCache = Array.isArray(data) ? data : [];
    setSyncStatus(`已讀取 ${cloudScoresCache.length} 筆雲端紀錄，時間：${new Date().toLocaleTimeString("zh-TW")}`);
    renderAll();
  } catch (_error) {
    setSyncStatus("雲端讀取受瀏覽器限制，畫面先顯示本機送出紀錄；正式資料請以 Google 試算表為準。");
  }
}

async function submitScore(button, payload) {
  button.disabled = true;
  button.textContent = "送出中...";

  try {
    if (isApiReady()) {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });
    }

    localScoresCache.push({ timestamp: new Date().toISOString(), ...payload });
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(localScoresCache));
    alert(isApiReady() ? "分數已送出。請以 Google 試算表確認正式資料。" : "目前為本機測試模式，分數已暫存在此電腦。");
    renderAll();
    syncScoresFromCloud();
  } catch (error) {
    alert(`送出失敗：${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "送出評分";
  }
}

function confirmCandidateLeave() {
  const dirtyInputs = [...document.querySelectorAll("#judgeStage .item-score")].some((input) => input.value !== "");
  if (!dirtyInputs) return true;

  return confirm("目前有填寫到一半的分數尚未送出，確定要切換考生嗎？\n(注意：切換後未送出的分數將會遺失)");
}

function renderCandidateHeader() {
  const candidate = currentCandidate();
  document.querySelector("#candidateCounter").textContent = `第 ${currentCandidateIndex + 1} 位 / 共 ${candidates.length} 位`;
  document.querySelector("#candidateNameBar").textContent = `${candidate.no} ${candidate.name}｜${candidate.category} - ${candidate.subject}`;
  document.querySelector("#prevCandidate").disabled = currentCandidateIndex === 0;
  document.querySelector("#nextCandidate").disabled = currentCandidateIndex === candidates.length - 1;
}

function renderCandidateStage() {
  const candidate = currentCandidate();
  const scores = scoresFor(candidate);
  document.querySelector("#candidateStage").innerHTML = `
    <article class="candidate-focus">
      <div>
        <div class="d-flex flex-column flex-lg-row align-items-lg-center gap-4 mb-4">
          <div class="candidate-number">${candidate.no}</div>
          <div>
            <div class="text-secondary fw-bold mb-2">${escapeHtml(candidate.category)}｜${escapeHtml(candidate.subject)}</div>
            <h2 id="candidate-title" class="candidate-title fw-bold mb-0">${escapeHtml(candidate.name)}</h2>
          </div>
        </div>
        <div class="meta-grid mb-4">
          <div class="meta-box"><div class="small text-secondary">試教</div><strong>${escapeHtml(scheduleLabel(candidate, "teaching"))}</strong></div>
          <div class="meta-box"><div class="small text-secondary">口試</div><strong>${escapeHtml(scheduleLabel(candidate, "oral"))}</strong></div>
          <div class="meta-box"><div class="small text-secondary">目前紀錄</div><strong>${scores.length} 筆</strong></div>
        </div>
        <div class="border-top pt-3">
          <div class="small text-secondary fw-bold mb-2">評分狀態</div>
          ${renderScoreRows(scores)}
        </div>
      </div>
    </article>
  `;
}

function renderJudgeSelect() {
  const select = document.querySelector("#judgeSelect");
  select.innerHTML = '<option value="">請選擇評審委員</option>';
  judges.forEach((judge) => {
    const option = document.createElement("option");
    option.value = judge;
    option.textContent = judge;
    option.selected = judge === selectedJudge;
    select.appendChild(option);
  });
}

function renderJudgeStage() {
  const root = document.querySelector("#judgeStage");
  const candidate = currentCandidate();

  if (!selectedJudge) {
    root.innerHTML = '<div class="alert alert-warning">請先選擇評審委員。</div>';
    return;
  }

  const initialJob = currentJob("teaching");
  root.innerHTML = `
    <article class="score-panel">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
        <div>
          <div class="text-secondary fw-bold">${escapeHtml(candidate.category)}｜${escapeHtml(candidate.subject)}</div>
          <h3 class="h2 fw-bold mb-1">${candidate.no} ${escapeHtml(candidate.name)}</h3>
          <div id="judgeScheduleLine" class="text-secondary">${escapeHtml(initialJob.scoreType)}｜${escapeHtml(initialJob.time)}｜${escapeHtml(initialJob.room)}</div>
        </div>
        <span id="judgeRoomBadge" class="badge text-bg-info align-self-lg-start fs-6">${escapeHtml(initialJob.room)}</span>
      </div>
      <ul class="nav nav-tabs" role="tablist">
        ${Object.entries(scoreTypes).map(([key, type], index) => `
          <li class="nav-item" role="presentation">
            <button class="nav-link ${index === 0 ? "active" : ""}" data-score-tab="${key}" data-bs-toggle="tab" data-bs-target="#${key}Panel" type="button" role="tab">${type.label}</button>
          </li>
        `).join("")}
      </ul>
      <div class="tab-content border border-top-0 bg-light p-3">
        ${Object.entries(scoreTypes).map(([key, type], index) => renderScoreForm(candidate, key, type, index === 0)).join("")}
      </div>
    </article>
  `;

  bindScoreForms(root, candidate);
  bindScoreTabs(root);
}

function bindScoreTabs(root) {
  root.querySelectorAll("[data-score-tab]").forEach((tab) => {
    tab.addEventListener("shown.bs.tab", () => updateJudgeScheduleLine(tab.dataset.scoreTab));
    tab.addEventListener("click", () => updateJudgeScheduleLine(tab.dataset.scoreTab));
  });
}

function updateJudgeScheduleLine(scoreKey = activeScoreTypeKey()) {
  const job = currentJob(scoreKey);
  const line = document.querySelector("#judgeScheduleLine");
  const badge = document.querySelector("#judgeRoomBadge");
  if (line) line.textContent = `${job.scoreType}｜${job.time}｜${job.room}`;
  if (badge) badge.textContent = job.room;
}

function renderScoreForm(candidate, key, type, active) {
  const existing = hasExistingScore(candidate, type.label);
  return `
    <div id="${key}Panel" class="tab-pane fade ${active ? "show active" : ""}" role="tabpanel">
      ${existing ? '<div class="alert alert-info py-2">已有此委員對此考生的同項紀錄，再送出會新增一筆。</div>' : ""}
      <form data-score-key="${key}" data-score-type="${type.label}">
        <div class="score-input-grid">
          ${type.items.map((item, index) => `
            <label class="score-input-row">
              <span class="fw-bold">${item}（最高 ${type.max[index]} 分）</span>
              <input type="number" class="form-control form-control-lg item-score" data-max="${type.max[index]}" min="0" max="${type.max[index]}" step="0.1" required />
            </label>
          `).join("")}
        </div>
        <div class="text-end mt-3">
          <h4 class="fw-bold">合計：<span class="text-danger form-total">0</span> 分</h4>
          <button class="btn btn-success btn-lg fw-bold w-100 send-score-btn" type="submit">送出評分</button>
        </div>
      </form>
    </div>
  `;
}

function bindScoreForms(root, candidate) {
  root.querySelectorAll("form").forEach((form) => {
    const inputs = [...form.querySelectorAll(".item-score")];
    const sendButton = form.querySelector(".send-score-btn");

    inputs.forEach((input, index) => {
      input.addEventListener("focus", () => input.select());
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();

        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          sendButton.focus();
        }
      });
    });

    form.addEventListener("input", () => {
      form.querySelector(".form-total").textContent = calculateFormTotal(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (sendButton.disabled) return;

      const validation = validateScoreForm(form);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      const scoreType = form.dataset.scoreType;
      if (hasExistingScore(candidate, scoreType) && !confirm("已有同委員、同考生、同項目的紀錄。確定仍要新增一筆嗎？")) return;

      const scores = inputs.map((input) => Number(input.value));
      const job = currentJob(form.dataset.scoreKey);
      submitScore(sendButton, {
        judgeName: selectedJudge,
        candidateNo: candidate.no,
        candidateName: candidate.name,
        subject: job.title,
        scoreType,
        s1: scores[0],
        s2: scores[1],
        s3: scores[2],
        s4: scores[3],
        s5: scores[4],
        total: Number(calculateFormTotal(form)),
      });
    });
  });
}

function printSignSheet() {
  const rows = candidates.map((candidate) => `
    <tr>
      <td class="center">${candidate.no}</td>
      <td>${escapeHtml(candidate.name)}</td>
      <td>${escapeHtml(candidate.category)}</td>
      <td>${escapeHtml(candidate.subject)}</td>
      <td>試教<br>${escapeHtml(candidate.schedule.teaching.time)}<br>${escapeHtml(candidate.schedule.teaching.room)}</td>
      <td>口試<br>${escapeHtml(candidate.schedule.oral.time)}<br>${escapeHtml(candidate.schedule.oral.room)}</td>
      <td class="sign"></td>
      <td class="sign"></td>
      <td class="sign"></td>
      <td class="sign"></td>
      <td class="sign"></td>
    </tr>
  `).join("");

  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    alert("瀏覽器封鎖了列印視窗，請允許彈出視窗後再試一次。");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="zh-Hant">
      <head>
        <meta charset="utf-8" />
        <title>青溪國小代理代課教師甄試排程簽名表</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            font-family: "Microsoft JhengHei", "Noto Sans TC", Arial, sans-serif;
            color: #111;
            margin: 0;
          }
          h1 {
            text-align: center;
            font-size: 22px;
            margin: 0 0 6px;
          }
          .subtitle {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #333;
            padding: 6px 5px;
            vertical-align: middle;
          }
          th {
            background: #eef2f5;
            text-align: center;
          }
          .center {
            text-align: center;
          }
          .sign {
            height: 54px;
          }
          .note {
            margin-top: 8px;
            font-size: 12px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>桃園市桃園區青溪國民小學 115學年度代理代課教師甄試排程簽名表</h1>
        <div class="subtitle">
          <span>雙軌 10 分鐘排程｜09:30-09:40 換場</span>
          <span>列印時間：${new Date().toLocaleString("zh-TW")}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">編號</th>
              <th style="width: 8%;">考生</th>
              <th style="width: 8%;">類別</th>
              <th style="width: 8%;">科目</th>
              <th style="width: 11%;">試教排程</th>
              <th style="width: 11%;">口試排程</th>
              <th>委員1簽名</th>
              <th>委員2簽名</th>
              <th>委員3簽名</th>
              <th>委員4簽名</th>
              <th>委員5簽名</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="note">試場 A：試教場地。試場 B：口試場地。請各評審委員完成線上評分後於本表簽名確認。</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function renderAdminStage() {
  const candidate = currentCandidate();
  const scores = scoresFor(candidate);
  document.querySelector("#adminStage").innerHTML = `
    <div class="row g-3">
      <div class="col-12 col-xl-8">
        <article class="admin-panel">
          <div class="d-flex justify-content-between gap-2 mb-3">
            <div>
              <div class="text-secondary fw-bold">${escapeHtml(candidate.category)}｜${escapeHtml(candidate.subject)}</div>
              <h3 class="h2 fw-bold mb-1">${candidate.no} ${escapeHtml(candidate.name)}</h3>
              <div class="text-secondary">${escapeHtml(scheduleLabel(candidate, "teaching"))}</div>
              <div class="text-secondary">${escapeHtml(scheduleLabel(candidate, "oral"))}</div>
            </div>
            <span class="badge ${scores.length ? "text-bg-success" : "text-bg-secondary"} align-self-start">${scores.length} 筆</span>
          </div>
          ${renderScoreRows(scores)}
        </article>
      </div>
      <div class="col-12 col-xl-4">
        <article class="admin-panel">
          <div class="d-grid mb-3">
            <button id="printSignSheet" class="btn btn-dark fw-bold" type="button">🖨️ 列印排程簽名表</button>
          </div>
          <h4 class="h6 fw-bold mb-3">全體進度</h4>
          <div class="progress-list">
            ${candidates.map((item, index) => {
              const count = scoresFor(item).length;
              return `<button class="progress-pill text-start ${index === currentCandidateIndex ? "border-dark" : ""}" data-candidate-index="${index}" type="button">
                <strong>${item.no} ${escapeHtml(item.name)}</strong><br />
                <span class="small text-secondary">${count} 筆紀錄</span>
              </button>`;
            }).join("")}
          </div>
        </article>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-candidate-index]").forEach((button) => {
    button.addEventListener("click", () => {
      setCandidateIndex(Number(button.dataset.candidateIndex));
    });
  });

  document.querySelector("#printSignSheet").addEventListener("click", printSignSheet);
}

function renderScoreRows(scores) {
  if (!scores.length) return '<span class="badge text-bg-secondary">尚無評分紀錄</span>';
  return scores.map((score) => `
    <div class="score-row">
      <span>${escapeHtml(score.judgeName || "未填委員")}｜${escapeHtml(score.scoreType || "未填項目")}</span>
      <strong class="text-success">${Number(score.total) || 0} 分</strong>
    </div>
  `).join("");
}

function calculateFormTotal(form) {
  const sum = [...form.querySelectorAll(".item-score")].reduce((total, input) => total + (Number(input.value) || 0), 0);
  return Number(sum.toFixed(1));
}

function validateScoreForm(form) {
  for (const input of form.querySelectorAll(".item-score")) {
    const value = Number(input.value);
    const max = Number(input.dataset.max);
    if (input.value === "" || Number.isNaN(value)) return { valid: false, message: "請填完整所有分項分數。" };
    if (value < 0 || value > max) return { valid: false, message: `分數需介於 0 到 ${max} 分。` };
  }
  return { valid: true, message: "" };
}

function setView(view) {
  currentView = view;
  saveState();

  document.querySelectorAll(".view-button").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    button.classList.toggle("btn-primary", active && view === "candidate");
    button.classList.toggle("btn-success", active && view === "judge");
    button.classList.toggle("btn-warning", active && view === "admin");
    button.classList.toggle("btn-outline-primary", !active && button.dataset.view === "candidate");
    button.classList.toggle("btn-outline-success", !active && button.dataset.view === "judge");
    button.classList.toggle("btn-outline-warning", !active && button.dataset.view === "admin");
  });

  document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  updateJudgeScheduleLine();
}

function setCandidateIndex(nextIndex) {
  const boundedIndex = Math.max(0, Math.min(candidates.length - 1, nextIndex));
  if (boundedIndex === currentCandidateIndex) return;
  if (!confirmCandidateLeave()) return;

  currentCandidateIndex = boundedIndex;
  saveState();
  renderAll();
}

function moveCandidate(delta) {
  setCandidateIndex(currentCandidateIndex + delta);
}

function renderAll() {
  renderCandidateHeader();
  renderCandidateStage();
  renderJudgeSelect();
  renderJudgeStage();
  renderAdminStage();
  setView(currentView);
}

function updateClock() {
  document.querySelector("#liveClock").textContent = new Date().toLocaleString("zh-TW", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function setupEvents() {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelector("#prevCandidate").addEventListener("click", () => moveCandidate(-1));
  document.querySelector("#nextCandidate").addEventListener("click", () => moveCandidate(1));

  document.querySelector("#judgeSelect").addEventListener("change", (event) => {
    const nextJudge = event.target.value;
    if (!nextJudge) {
      selectedJudge = "";
      saveState();
      renderJudgeStage();
      return;
    }

    const password = prompt("請輸入評審驗證密碼");
    if (password !== "csps") {
      alert("驗證失敗");
      event.target.value = selectedJudge;
      return;
    }

    selectedJudge = nextJudge;
    saveState();
    renderJudgeStage();
  });

  document.querySelector("#forceSyncBtn").addEventListener("click", syncScoresFromCloud);

  document.querySelector("#resetThreeViews").addEventListener("click", () => {
    if (!confirm("確定要清除本機暫存評分嗎？雲端試算表資料不會被刪除。")) return;
    localStorage.removeItem(LOCAL_SCORES_KEY);
    localScoresCache = [];
    renderAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target?.classList?.contains("item-score")) return;
    moveCandidate(event.key === "ArrowLeft" ? -1 : 1);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadState();
setupEvents();
renderAll();
updateClock();
syncScoresFromCloud();
setInterval(updateClock, 1000);
setInterval(syncScoresFromCloud, 20000);
