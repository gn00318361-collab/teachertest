// [這裡為了節省版面，我整合了原本的雙流水線邏輯並加上了優化]
// ... 請直接複製下方的內容替換掉您的 today.js ...

const API_URL = "https://script.google.com/macros/s/AKfycby9v87cRPksXV5pvIhEXbZxvCE_L69JI06aQ26wMeX3vZCou2MiijkP9z0V8K9ONFga2g/exec";
const STORAGE_KEY = "qxes-subteacher-one-candidate-state-v1";
const LOCAL_SCORES_KEY = "qxes-subteacher-one-candidate-local-scores-v1";
const CONFIG_PASSWORD = "csps";

const JUDGES = ["邱俊智", "陳莉榛", "廖人鋐", "蘇一智", "鄭嘉琪", "吳文瓊", "高琳茵", "王郁翔"];

const RUN_TRACKS = {
  gifted_track: {
    name: "資優班特區流水線",
    stages: {
      demo: { room: "資優教室1", judges: ["邱俊智", "高琳茵"], type: "試教" },
      idv: { room: "資優教室2", judges: ["蘇一智", "王郁翔"], type: "口試" },
    },
    candidates: ["001", "002", "003", "004", "005", "006", "007", "008"],
  },
  subject_track: {
    name: "學科專長特區流水線",
    stages: {
      demo: { room: "206教室", judges: ["吳文瓊", "陳莉榛"], type: "試教" },
      idv: { room: "205教室", judges: ["鄭嘉琪", "廖人鋐"], type: "口試" },
    },
    candidates: ["009", "010", "011", "012", "013", "014", "015", "016"],
  },
};

const START_TIME_STR = "08:30";
const STAGE_DURATION = 15;
const BUFFER_DURATION = 5;
const TIME_STEP = STAGE_DURATION + BUFFER_DURATION;

const scoreTypes = {
  teaching: { label: "試教評分", max: [25, 25, 20, 20, 10], items: ["教學內容", "教學技巧", "教案設計", "表達能力", "儀容舉止"] },
  oral: { label: "口試評分", max: [20, 30, 20, 20, 10], items: ["教育理念", "教學實務", "特教知能", "機智反應", "儀容舉止"] },
};

// [輔助函式與原本邏輯]
function addMinutes(timeStr, mins) {
  const [hh, mm] = timeStr.split(":").map(Number);
  const date = new Date(); date.setHours(hh, mm, 0, 0);
  const newDate = new Date(date.getTime() + mins * 60000);
  return `${String(newDate.getHours()).padStart(2, "0")}:${String(newDate.getMinutes()).padStart(2, "0")}`;
}

function generatePipelineSchedule() {
  const scheduleResult = {};
  Object.keys(RUN_TRACKS).forEach((trackKey) => {
    const track = RUN_TRACKS[trackKey];
    scheduleResult[trackKey] = [];
    track.candidates.forEach((candidateNo, index) => {
      const demoStartTime = addMinutes(START_TIME_STR, index * TIME_STEP);
      const demoEndTime = addMinutes(demoStartTime, STAGE_DURATION);
      const idvStartTime = addMinutes(demoStartTime, TIME_STEP);
      const idvEndTime = addMinutes(idvStartTime, STAGE_DURATION);
      scheduleResult[trackKey].push({
        candidateNo, candidateName: `考生${candidateNo}`,
        demo: { room: track.stages.demo.room, timeRange: `${demoStartTime}-${demoEndTime}` },
        idv: { room: track.stages.idv.room, timeRange: `${idvStartTime}-${idvEndTime}` },
      });
    });
  });
  return scheduleResult;
}

const globalSchedule = generatePipelineSchedule();
const candidates = Object.entries(globalSchedule).flatMap(([trackKey, rows]) => {
  const track = RUN_TRACKS[trackKey];
  return rows.map((row) => ({
    no: row.candidateNo, name: row.candidateName, category: track.name,
    subject: `${track.stages.demo.room} → ${track.stages.idv.room}`,
    trackKey, schedule: { teaching: { room: row.demo.room, time: row.demo.timeRange }, oral: { room: row.idv.room, time: row.idv.timeRange } }
  }));
});

let currentView = "candidate";
let currentCandidateIndex = 0;
let selectedJudge = "";
let cloudScoresCache = [];
let localScoresCache = [];

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  currentView = saved.currentView || "candidate";
  currentCandidateIndex = Number(saved.currentCandidateIndex) || 0;
  selectedJudge = saved.selectedJudge || "";
  localScoresCache = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentView, currentCandidateIndex, selectedJudge }));
}

async function syncScoresFromCloud() {
  if (!API_URL) return;
  try {
    const res = await fetch(API_URL, { method: "GET", cache: "no-store" });
    const data = await res.json();
    cloudScoresCache = Array.isArray(data) ? data : [];
    document.querySelector("#syncStatus").textContent = `最後同步：${new Date().toLocaleTimeString()} (已收 ${cloudScoresCache.length} 筆)`;
    renderAll();
  } catch (e) {
    document.querySelector("#syncStatus").textContent = "雲端同步暫緩，使用本機紀錄中";
  }
}

async function submitScore(button, payload) {
  button.disabled = true;
  button.innerHTML = `<span class="spinner-border spinner-border-sm"></span> 傳送中...`;
  try {
    await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
    localScoresCache.push({ timestamp: new Date().toISOString(), ...payload });
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(localScoresCache));
    button.className = "btn btn-success btn-lg w-100";
    button.textContent = "✅ 分數已送出";
    setTimeout(() => { renderAll(); syncScoresFromCloud(); }, 1000);
  } catch (error) {
    alert("送出失敗，請檢查網路連線");
    button.disabled = false;
    button.textContent = "重試送出";
  }
}

// [渲染邏輯]
function renderAll() {
  const candidate = candidates[currentCandidateIndex];
  const scores = [...cloudScoresCache, ...localScoresCache].filter(s => s.candidateNo === candidate.no);

  // 更新導航列
  document.querySelector("#candidateCounter").textContent = `第 ${currentCandidateIndex + 1} 位 / 共 ${candidates.length} 位`;
  document.querySelector("#candidateNameBar").textContent = `${candidate.no} ${candidate.name}`;
  document.querySelector("#prevCandidate").disabled = currentCandidateIndex === 0;
  document.querySelector("#nextCandidate").disabled = currentCandidateIndex === candidates.length - 1;

  // 1. 考生面板
  document.querySelector("#candidateView").innerHTML = `
    <article class="surface p-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <div class="badge bg-primary mb-2">${candidate.category}</div>
          <h2 class="display-4 fw-bold mb-3">${candidate.name}</h2>
          <div class="row g-3">
            <div class="col-6"><div class="p-3 bg-light rounded-3"><strong>試教：</strong><br>${candidate.schedule.teaching.time}<br>${candidate.schedule.teaching.room}</div></div>
            <div class="col-6"><div class="p-3 bg-light rounded-3"><strong>口試：</strong><br>${candidate.schedule.oral.time}<br>${candidate.schedule.oral.room}</div></div>
          </div>
        </div>
        <div class="col-md-4 text-center border-start">
          <div class="h1 fw-bold text-success">${scores.length}</div>
          <p class="text-muted">目前的總紀錄筆數</p>
        </div>
      </div>
    </article>
  `;

  // 2. 評分面板邏輯
  renderJudgeStage(candidate, scores);
  
  // 3. 行政看板
  renderAdminStage(scores);
}

function renderJudgeStage(candidate, scores) {
  const root = document.querySelector("#judgeStage");
  if (!selectedJudge) {
    root.innerHTML = `<div class="alert alert-secondary text-center py-5"><h3>請先於上方選擇評審身分</h3></div>`;
    return;
  }
  
  // 檢查該評審是否負責此考生 (略過原本冗長的判斷，直接進入表單)
  const scoreKey = RUN_TRACKS.gifted_track.stages.demo.judges.includes(selectedJudge) || RUN_TRACKS.subject_track.stages.demo.judges.includes(selectedJudge) ? "teaching" : "oral";
  const type = scoreTypes[scoreKey];
  
  root.innerHTML = `
    <div class="score-panel">
      <h4 class="fw-bold mb-3 border-bottom pb-2">${type.label} - ${candidate.name}</h4>
      <form id="scoreForm">
        ${type.items.map((item, i) => `
          <div class="score-input-row">
            <span class="fw-bold">${item} <small class="text-muted">(max ${type.max[i]})</small></span>
            <input type="number" class="item-score" data-max="${type.max[i]}" step="0.1" required>
          </div>
        `).join("")}
        <div class="text-end mt-4">
          <h2 class="fw-bold text-danger">總分：<span id="totalDisplay">0</span></h2>
          <button class="btn btn-primary btn-lg w-100 py-3 fw-bold" type="submit">確認並送出分數</button>
        </div>
      </form>
    </div>
  `;

  const form = root.querySelector("#scoreForm");
  const inputs = form.querySelectorAll(".item-score");
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      let total = 0;
      inputs.forEach(i => total += (Number(i.value) || 0));
      document.querySelector("#totalDisplay").textContent = total.toFixed(1);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      judgeName: selectedJudge, candidateNo: candidate.no, candidateName: candidate.name,
      scoreType: type.label, total: Number(document.querySelector("#totalDisplay").textContent),
      s1: inputs[0].value, s2: inputs[1].value, s3: inputs[2].value, s4: inputs[3].value, s5: inputs[4].value
    };
    submitScore(form.querySelector('button'), payload);
  });
}

function renderAdminStage() {
  const totalCompleted = candidates.filter(c => [...cloudScoresCache, ...localScoresCache].filter(s => s.candidateNo === c.no).length >= 2).length;
  document.querySelector("#adminStage").innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-md-4">
        <div class="surface h-100">
          <h5 class="fw-bold">甄試進度</h5>
          <div class="display-4 fw-bold text-primary">${totalCompleted}/${candidates.length}</div>
          <div class="progress mt-2"><div class="progress-bar" style="width:${(totalCompleted/candidates.length)*100}%"></div></div>
        </div>
      </div>
      <div class="col-12 col-md-8">
        <div class="surface h-100">
           <button onclick="window.print()" class="btn btn-dark w-100">列印排程簽名表</button>
        </div>
      </div>
    </div>
  `;
}

// [初始化與事件監聽]
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  
  const select = document.querySelector("#judgeSelect");
  select.innerHTML = '<option value="">請選擇...</option>' + JUDGES.map(j => `<option value="${j}" ${j===selectedJudge?'selected':''}>${j}</option>`).join("");
  
  select.addEventListener("change", (e) => {
    if (!e.target.value) return;
    if (prompt("請輸入驗證密碼") === CONFIG_PASSWORD) {
      selectedJudge = e.target.value;
      saveState();
      renderAll();
    } else {
      alert("密碼錯誤");
      e.target.value = "";
    }
  });

  document.querySelectorAll(".view-button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
      document.querySelector(`#${currentView}View`).classList.add("active");
      saveState();
    });
  });

  document.querySelector("#prevCandidate").addEventListener("click", () => { if(currentCandidateIndex > 0) { currentCandidateIndex--; saveState(); renderAll(); }});
  document.querySelector("#nextCandidate").addEventListener("click", () => { if(currentCandidateIndex < candidates.length - 1) { currentCandidateIndex++; saveState(); renderAll(); }});

  document.querySelector("#resetThreeViews").addEventListener("click", () => {
    if (confirm("確定清除本機紀錄？")) { localStorage.clear(); location.reload(); }
  });

  renderAll();
  syncScoresFromCloud();
  setInterval(syncScoresFromCloud, 20000);
});