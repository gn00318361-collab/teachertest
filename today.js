// Google Apps Script 部署完成後，請替換成你的 Web App URL。
const API_URL = "https://script.google.com/macros/s/AKfycby55Y8FGAP9V1cFucprJi2dDd6pn8q5_CMX2OAY7VQlN7Ho9WkIHyN2RpKKAe-XRyJ1rw/exec";

const STORAGE_KEY = "qxes-subteacher-score-console-1150708-v1";
const LOCAL_SCORES_KEY = "qxes-subteacher-score-console-1150708-local-scores-v1";

const judges = ["第1評審委員", "第2評審委員", "第3評審委員", "第4評審委員", "第5評審委員"];

const candidates = [
  { no: "01", name: "藍婷", category: "一般代理", subject: "導師" },
  { no: "02", name: "陳政輝", category: "一般代理", subject: "體育科任" },
  { no: "03", name: "倪月如", category: "教支人員", subject: "客語" },
  { no: "04", name: "古安富", category: "教支人員", subject: "排灣族語" },
  { no: "05", name: "吳慧姿", category: "鐘點教師", subject: "自然" },
  { no: "06", name: "蘇于榕", category: "鐘點教師", subject: "閩南語" },
];

const scoreTypes = {
  teaching: {
    label: "試教評分",
    max: [25, 25, 20, 20, 10],
    items: ["教材內容掌握", "教學設計與流程", "教學表達與互動", "班級經營與應變", "整體表現"],
  },
  oral: {
    label: "口試評分",
    max: [20, 30, 20, 20, 10],
    items: ["教育理念與專業知能", "問題分析與表達", "行政配合與溝通", "學生輔導與班級經營", "整體表現"],
  },
};

let selectedJudge = "";
let currentView = "candidate";
let cloudScoresCache = [];
let localScoresCache = [];
let candidateKeyword = "";

function getJobs() {
  return candidates.map((candidate) => ({
    id: `candidate_${candidate.no}`,
    candidateNo: candidate.no,
    candidateName: candidate.name,
    candidates: `${candidate.no} ${candidate.name}`,
    title: `${candidate.category} - ${candidate.subject}`,
    subject: candidate.subject,
    category: candidate.category,
    room: "青溪國小甄試試場",
    time: "09:00 起",
    judges,
  }));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedJudge, currentView }));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    selectedJudge = saved.selectedJudge || "";
    currentView = saved.currentView || "candidate";
  } catch (_error) {
    selectedJudge = "";
    currentView = "candidate";
  }

  try {
    localScoresCache = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
    if (!Array.isArray(localScoresCache)) localScoresCache = [];
  } catch (_error) {
    localScoresCache = [];
  }
}

function isApiReady() {
  return API_URL && !API_URL.includes("XXXXX");
}

function setSyncStatus(message) {
  const node = document.querySelector("#syncStatus");
  if (node) node.textContent = message;
}

async function syncScoresFromCloud() {
  if (!isApiReady()) {
    setSyncStatus(`本機測試模式：目前有 ${localScoresCache.length} 筆暫存評分。設定 Apps Script URL 後會改用雲端同步。`);
    return;
  }

  try {
    const res = await fetch(API_URL, { method: "GET", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cloudScoresCache = Array.isArray(data) ? data : [];
    setSyncStatus(`已同步 ${cloudScoresCache.length} 筆雲端評分資料，時間：${new Date().toLocaleTimeString("zh-TW")}`);
    renderCandidateCards();
    renderJudgeCards();
    renderAdminCards();
  } catch (error) {
    setSyncStatus(`雲端讀取受瀏覽器限制，畫面先顯示本機送出紀錄；正式資料請以 Google 試算表為準。`);
  }
}

async function submitScoreToCloud(button, payload) {
  if (!isApiReady()) {
    localScoresCache.push({
      timestamp: new Date().toISOString(),
      ...payload,
    });
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(localScoresCache));
    alert("目前是本機測試模式，分數已暫存在這台電腦。正式使用前請設定 Google Apps Script Web App URL。");
    setSyncStatus(`本機測試模式：目前有 ${localScoresCache.length} 筆暫存評分。`);
    renderCandidateCards();
    renderJudgeCards();
    renderAdminCards();
    return;
  }

  button.disabled = true;
  button.textContent = "送出中...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload),
    });
    localScoresCache.push({
      timestamp: new Date().toISOString(),
      ...payload,
    });
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(localScoresCache));

    alert("分數已送出。若要確認雲端寫入結果，請查看 Google 試算表。");
    setSyncStatus(`已送出 ${localScoresCache.length} 筆本機紀錄；雲端正式資料請以 Google 試算表為準。`);
    renderCandidateCards();
    renderJudgeCards();
    renderAdminCards();
    await syncScoresFromCloud();
  } catch (error) {
    alert(`送出失敗：${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "送出評分";
  }
}

function getScoresForJob(job) {
  const source = isApiReady() && cloudScoresCache.length ? cloudScoresCache : localScoresCache;
  return source.filter((score) => {
    return String(score.candidateNo || "") === job.candidateNo || String(score.candidateName || "").includes(job.candidateName);
  });
}

function hasExistingScore(job, scoreType) {
  return getScoresForJob(job).some((score) => score.judgeName === selectedJudge && score.scoreType === scoreType);
}

function renderScoreStatusHtml(job) {
  const scores = getScoresForJob(job);
  if (!scores.length) return `<span class="badge bg-secondary">尚無雲端評分紀錄</span>`;

  return scores.map((score) => `
    <div class="score-row">
      <span>${escapeHtml(score.judgeName || "未填委員")}｜${escapeHtml(score.scoreType || "未填項目")}</span>
      <strong class="text-success">${Number(score.total) || 0} 分</strong>
    </div>
  `).join("");
}

function filteredJobs() {
  const keyword = candidateKeyword.trim().toLowerCase();
  const jobs = getJobs();
  if (!keyword) return jobs;

  return jobs.filter((job) => {
    return [job.candidateNo, job.candidateName, job.title, job.subject, job.category].some((value) => {
      return String(value).toLowerCase().includes(keyword);
    });
  });
}

function renderCandidateCards() {
  const root = document.querySelector("#candidateCards");
  root.innerHTML = "";

  filteredJobs().forEach((job) => {
    const card = document.createElement("article");
    card.className = "job-card";
    card.innerHTML = `
      <h3 class="h4 fw-bold mb-3">${escapeHtml(job.title)}</h3>
      <p class="fs-5 fw-bold text-primary mb-2">考生：${escapeHtml(job.candidates)}</p>
      <p class="mb-2">試場：${escapeHtml(job.room)}</p>
      <p class="mb-2">時間：${escapeHtml(job.time)}</p>
      <div class="mt-3 border-top pt-3">
        <small class="text-secondary d-block mb-2">雲端評分狀態</small>
        ${renderScoreStatusHtml(job)}
      </div>
    `;
    root.appendChild(card);
  });
}

function renderJudgeSelect() {
  const select = document.querySelector("#judgeSelect");
  select.innerHTML = '<option value="">請選擇評審委員</option>';

  judges.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    option.selected = name === selectedJudge;
    select.appendChild(option);
  });
}

function renderJudgeCards() {
  const root = document.querySelector("#judgeCards");
  root.innerHTML = "";

  if (!selectedJudge) {
    root.innerHTML = '<div class="alert alert-warning">請先選擇評審委員身分。</div>';
    return;
  }

  getJobs().forEach((job) => {
    const card = document.createElement("article");
    card.className = "judge-task-card p-3";
    card.innerHTML = `
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
        <div>
          <h3 class="h4 text-success fw-bold mb-1">${escapeHtml(job.title)}</h3>
          <p class="mb-0 text-secondary">考生：<strong>${escapeHtml(job.candidates)}</strong></p>
        </div>
        <span class="badge bg-info text-dark align-self-lg-start fs-6">${escapeHtml(job.room)}</span>
      </div>
      <ul class="nav nav-tabs" role="tablist">
        ${Object.entries(scoreTypes).map(([key, type], index) => `
          <li class="nav-item" role="presentation">
            <button class="nav-link ${index === 0 ? "active" : ""}" data-bs-toggle="tab" data-bs-target="#${job.id}-${key}" type="button" role="tab">${type.label}</button>
          </li>
        `).join("")}
      </ul>
      <div class="tab-content border border-top-0 p-3 bg-light">
        ${Object.entries(scoreTypes).map(([key, type], index) => renderScoreForm(job, key, type, index === 0)).join("")}
      </div>
    `;

    root.appendChild(card);
    bindScoreForms(card, job);
  });
}

function renderScoreForm(job, scoreTypeKey, scoreType, active) {
  const existing = hasExistingScore(job, scoreType.label);
  return `
    <div class="tab-pane fade ${active ? "show active" : ""}" id="${job.id}-${scoreTypeKey}" role="tabpanel">
      ${existing ? '<div class="alert alert-info py-2">雲端已有此委員對此考生的同項評分紀錄，再送出會新增一筆紀錄。</div>' : ""}
      <form data-job-id="${job.id}" data-score-type="${scoreType.label}">
        <div class="score-input-grid">
          ${scoreType.items.map((item, index) => `
            <label class="score-input-row">
              <small class="fw-bold">${item}（最高 ${scoreType.max[index]} 分）</small>
              <input type="number" class="form-control item-score" data-max="${scoreType.max[index]}" data-index="${index}" min="0" max="${scoreType.max[index]}" step="0.1" placeholder="0-${scoreType.max[index]}" required />
            </label>
          `).join("")}
        </div>
        <div class="text-end mt-3">
          <h5 class="fw-bold text-dark mb-3">合計分數：<span class="text-danger form-total">0</span> 分</h5>
          <button class="btn btn-success fw-bold w-100 send-score-btn" type="submit">送出評分</button>
        </div>
      </form>
    </div>
  `;
}

function bindScoreForms(card, job) {
  card.querySelectorAll("form").forEach((form) => {
    form.addEventListener("input", () => {
      form.querySelector(".form-total").textContent = calculateFormTotal(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const validation = validateScoreForm(form);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      const scoreType = form.dataset.scoreType;
      if (hasExistingScore(job, scoreType) && !confirm("雲端已有同委員、同考生、同項目的紀錄。確定仍要新增一筆嗎？")) return;

      const scores = [...form.querySelectorAll(".item-score")].map((input) => Number(input.value));
      const payload = {
        judgeName: selectedJudge,
        candidateNo: job.candidateNo,
        candidateName: job.candidateName,
        subject: job.title,
        scoreType,
        s1: scores[0],
        s2: scores[1],
        s3: scores[2],
        s4: scores[3],
        s5: scores[4],
        total: Number(calculateFormTotal(form)),
      };

      submitScoreToCloud(form.querySelector(".send-score-btn"), payload);
    });
  });
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

function renderAdminCards() {
  const root = document.querySelector("#adminCards");
  root.innerHTML = "";

  getJobs().forEach((job) => {
    const scores = getScoresForJob(job);
    const card = document.createElement("article");
    card.className = "admin-card p-3";
    card.innerHTML = `
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-2">
        <div>
          <h4 class="h5 fw-bold mb-1">${escapeHtml(job.title)}｜${escapeHtml(job.candidates)}</h4>
          <p class="text-secondary mb-2">${escapeHtml(job.room)}｜${escapeHtml(job.time)}</p>
        </div>
        <span class="badge ${scores.length ? "bg-success" : "bg-secondary"} align-self-lg-start">${scores.length} 筆</span>
      </div>
      <div class="p-2 bg-light rounded">
        <h6 class="fw-bold text-dark border-bottom pb-2">雲端評分紀錄</h6>
        ${renderScoreStatusHtml(job)}
      </div>
    `;
    root.appendChild(card);
  });
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
}

function renderAll() {
  renderCandidateCards();
  renderJudgeSelect();
  renderJudgeCards();
  renderAdminCards();
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
    button.addEventListener("click", () => {
      setView(button.dataset.view);
      renderAll();
    });
  });

  document.querySelector("#judgeSelect").addEventListener("change", (event) => {
    selectedJudge = event.target.value;
    saveState();
    renderJudgeCards();
  });

  document.querySelector("#candidateSearch").addEventListener("input", (event) => {
    candidateKeyword = event.target.value;
    renderCandidateCards();
  });

  document.querySelector("#forceSyncBtn").addEventListener("click", () => {
    setSyncStatus("正在讀取雲端評分資料...");
    syncScoresFromCloud();
  });

  document.querySelector("#resetThreeViews").addEventListener("click", () => {
    if (!confirm("確定要清除本機畫面快取與本機暫存評分嗎？雲端試算表資料不會被刪除。")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOCAL_SCORES_KEY);
    localScoresCache = [];
    selectedJudge = "";
    currentView = "candidate";
    renderAll();
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
setInterval(syncScoresFromCloud, 5000);
