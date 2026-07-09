const API_URL = "https://script.google.com/macros/s/AKfycbx_tMdBueAo-6mLgoAdVA9c35ViQzPFXdtMnVF8X6otPGDfJFQiAH7v5pxYF_SPfOQ/exec";
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

const START_TIME_STR = "09:00";
const STAGE_DURATION = 15;
const BUFFER_DURATION = 5;
const TIME_STEP = STAGE_DURATION + BUFFER_DURATION;

const scoreTypes = {
  teaching: { label: "試教評分", max: [25, 25, 20, 20, 10], items: ["教學內容", "教學技巧", "教案設計", "表達能力", "儀容舉止"] },
  oral: { label: "口試評分", max: [20, 30, 20, 20, 10], items: ["教育理念", "教學實務", "特教知能", "機智反應", "儀容舉止"] },
};

// [輔助函式]
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
    button.className = "btn btn-success btn-lg w-100 py-3 fw-bold";
    button.textContent = "✅ 分數已送出";
    setTimeout(() => { renderAll(); syncScoresFromCloud(); }, 1000);
  } catch (error) {
    alert("送出失敗，請檢查網路連線");
    button.disabled = false;
    button.textContent = "重試送出";
  }
}

// 輔助函式：取得評審指派關卡資訊
function getJudgeAssignment(judge, candidate) {
  const track = RUN_TRACKS[candidate.trackKey];
  if (!track) return null;
  if (track.stages.demo.judges.includes(judge)) {
    return { type: "teaching", stage: track.stages.demo };
  }
  if (track.stages.idv.judges.includes(judge)) {
    return { type: "oral", stage: track.stages.idv };
  }
  return null;
}

// 輔助函式：檢查目前表單是否有輸入值 (未存檔)
function isFormDirty() {
  const form = document.querySelector("#scoreForm");
  if (!form) return false;
  const inputs = form.querySelectorAll(".item-score");
  let isDirty = false;
  inputs.forEach(i => {
    if (i.value.trim() !== "") {
      isDirty = true;
    }
  });
  return isDirty;
}

// 輔助函式：切換考生 (帶防呆)
function changeCandidate(indexOffset) {
  if (currentView === "judge" && isFormDirty()) {
    if (!confirm("⚠️ 您的評分表已填寫部分分數但尚未送出，切換考生會清除現有輸入。確定要切換考生嗎？")) {
      return;
    }
  }
  const newIndex = currentCandidateIndex + indexOffset;
  if (newIndex >= 0 && newIndex < candidates.length) {
    currentCandidateIndex = newIndex;
    saveState();
    renderAll();
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
          <span class="track-badge mb-2">${candidate.category}</span>
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
  
  // 3. 行政看板與列印專區
  renderAdminStage();
  renderPrintArea();
}

function renderJudgeStage(candidate, scores) {
  const root = document.querySelector("#judgeStage");
  if (!selectedJudge) {
    root.innerHTML = `<div class="alert alert-secondary text-center py-5 rounded-4 border-2"><h3>請先於上方選擇評審身分</h3></div>`;
    return;
  }
  
  // 防呆機制：比對評審與考生的 track
  const assignment = getJudgeAssignment(selectedJudge, candidate);
  if (!assignment) {
    let assignedRoom = "";
    let assignedType = "";
    let assignedTrackName = "";
    for (const [key, track] of Object.entries(RUN_TRACKS)) {
      if (track.stages.demo.judges.includes(selectedJudge)) {
        assignedRoom = track.stages.demo.room;
        assignedType = "試教";
        assignedTrackName = track.name;
        break;
      }
      if (track.stages.idv.judges.includes(selectedJudge)) {
        assignedRoom = track.stages.idv.room;
        assignedType = "口試";
        assignedTrackName = track.name;
        break;
      }
    }
    
    root.innerHTML = `
      <div class="alert alert-warning text-center py-4 border-2 shadow-sm rounded-4">
        <h4 class="fw-bold text-danger">⚠️ 評審教室與考生流水線不符</h4>
        <p class="mb-2">您的評分教室為：<strong>${assignedTrackName} - ${assignedRoom} (${assignedType})</strong></p>
        <p class="mb-2">目前選擇的考生：<strong>${candidate.no} ${candidate.name}</strong> 屬於 <strong>${candidate.category}</strong></p>
        <hr>
        <p class="mb-0 text-muted small">請點擊上方「下一位」或「上一位」切換至您負責的考生，或者重新選擇評審身分。</p>
      </div>
    `;
    return;
  }
  
  const type = scoreTypes[assignment.type];
  
  root.innerHTML = `
    <div class="score-panel">
      <h4 class="fw-bold mb-3 border-bottom pb-2">${type.label} - ${candidate.name} (${assignment.stage.room})</h4>
      <form id="scoreForm" novalidate>
        ${type.items.map((item, i) => `
          <div class="score-input-row">
            <div class="d-flex flex-column">
              <span class="fw-bold">${item} <small class="text-muted">(上限 ${type.max[i]} 分)</small></span>
              <div class="invalid-feedback text-danger small mt-1" id="err-${i}" style="display: none;">分數不可小於 0 且不可大於 ${type.max[i]}</div>
            </div>
            <input type="number" class="item-score" data-max="${type.max[i]}" step="0.1" min="0" max="${type.max[i]}" required>
          </div>
        `).join("")}
        <div class="text-end mt-4">
          <h2 class="fw-bold text-danger">總分：<span id="totalDisplay">0.0</span></h2>
          <button class="btn btn-primary btn-lg w-100 py-3 fw-bold" type="submit">確認並送出分數</button>
        </div>
      </form>
    </div>
  `;

  const form = root.querySelector("#scoreForm");
  const inputs = form.querySelectorAll(".item-score");
  
  inputs.forEach((input, index) => {
    // 聚焦時自動全選
    input.addEventListener("focus", () => {
      input.select();
    });
    
    // 按下 Enter 自動跳下一格
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          form.querySelector('button[type="submit"]').focus();
        }
      }
    });

    // 輸入值即時驗證與總分計算
    input.addEventListener("input", () => {
      const val = Number(input.value);
      const max = Number(input.dataset.max);
      const errEl = form.querySelector(`#err-${index}`);
      
      if (input.value.trim() !== "" && (val < 0 || val > max)) {
        input.classList.add("is-invalid");
        if (errEl) errEl.style.display = "block";
      } else {
        input.classList.remove("is-invalid");
        if (errEl) errEl.style.display = "none";
      }
      
      let total = 0;
      let hasError = false;
      inputs.forEach((inp, idx) => {
        const v = Number(inp.value) || 0;
        const m = Number(inp.dataset.max);
        if (inp.value.trim() !== "" && (v < 0 || v > m)) {
          hasError = true;
        }
        total += v;
      });
      document.querySelector("#totalDisplay").textContent = total.toFixed(1);
      
      // 若有不合規的分數，停用送出按鈕
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = hasError;
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // 二次檢查是否有不合規欄位
    let hasError = false;
    inputs.forEach((input, idx) => {
      const val = Number(input.value);
      const max = Number(input.dataset.max);
      if (input.value.trim() === "" || val < 0 || val > max) {
        hasError = true;
        input.classList.add("is-invalid");
        const errEl = form.querySelector(`#err-${idx}`);
        if (errEl) errEl.style.display = "block";
      }
    });
    
    if (hasError) {
      alert("請填寫正確的分數，且分數不可超過上限。");
      return;
    }
    
    const payload = {
      judgeName: selectedJudge, candidateNo: candidate.no, candidateName: candidate.name,
      scoreType: type.label, total: Number(document.querySelector("#totalDisplay").textContent),
      s1: inputs[0].value, s2: inputs[1].value, s3: inputs[2].value, s4: inputs[3].value, s5: inputs[4].value
    };
    submitScore(form.querySelector('button'), payload);
  });
}

function renderAdminStage() {
  const allScores = [...cloudScoresCache, ...localScoresCache];
  // 每位考生需要 4 筆評分（試教 2 筆、口試 2 筆）
  const totalCompleted = candidates.filter(c => allScores.filter(s => s.candidateNo === c.no).length >= 4).length;
  
  const tableRows = candidates.map(c => {
    const track = RUN_TRACKS[c.trackKey];
    const demoJudges = track.stages.demo.judges;
    const idvJudges = track.stages.idv.judges;
    const scoresForC = allScores.filter(s => s.candidateNo === c.no);
    
    const demoStatusHtml = demoJudges.map(j => {
      const hasScore = scoresForC.some(s => s.judgeName === j && s.scoreType === "試教評分");
      return `<span class="judge-tag ${hasScore ? 'done' : 'waiting'}">${j}${hasScore ? ' ✅' : ''}</span>`;
    }).join(" ");
    
    const idvStatusHtml = idvJudges.map(j => {
      const hasScore = scoresForC.some(s => s.judgeName === j && s.scoreType === "口試評分");
      return `<span class="judge-tag ${hasScore ? 'done' : 'waiting'}">${j}${hasScore ? ' ✅' : ''}</span>`;
    }).join(" ");
    
    const count = scoresForC.length;
    
    return `
      <tr>
        <td class="fw-bold text-start" style="padding-left: 1.5rem;">${c.no} ${c.name}</td>
        <td><span class="badge bg-light text-dark border">${track.name.replace("流水線", "")}</span></td>
        <td class="text-start">
          <div class="small text-muted mb-1">${c.schedule.teaching.time} (${c.schedule.teaching.room})</div>
          <div>${demoStatusHtml}</div>
        </td>
        <td class="text-start">
          <div class="small text-muted mb-1">${c.schedule.oral.time} (${c.schedule.oral.room})</div>
          <div>${idvStatusHtml}</div>
        </td>
        <td>
          <span class="status-badge ${count >= 4 ? 'completed' : 'pending'}">
            ${count} / 4 筆已送出
          </span>
        </td>
      </tr>
    `;
  }).join("");
  
  document.querySelector("#adminStage").innerHTML = `
    <div class="row g-4 mb-4">
      <div class="col-12 col-md-6 col-lg-4">
        <div class="surface h-100 d-flex flex-column justify-content-between">
          <div>
            <h5 class="fw-bold text-muted small text-uppercase">甄試整體進度</h5>
            <div class="display-5 fw-bold text-primary my-2">${totalCompleted} / ${candidates.length} <span class="fs-6 fw-normal text-muted">位考生評畢</span></div>
          </div>
          <div class="progress mt-2" style="height: 10px; border-radius: 5px;">
            <div class="progress-bar bg-primary" role="progressbar" style="width: ${(totalCompleted/candidates.length)*100}%" aria-valuenow="${totalCompleted}" aria-valuemin="0" aria-valuemax="${candidates.length}"></div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-lg-8">
        <div class="surface h-100 d-flex align-items-center justify-content-between">
          <div class="me-3">
            <h5 class="fw-bold text-dark mb-1">A4 橫式排程簽名表</h5>
            <p class="text-muted small mb-0">點選按鈕即可列印出專供評審現場簽名確認的紙本排程表，排版已特別為 A4 橫向配置優化。</p>
          </div>
          <button onclick="window.print()" class="btn btn-dark btn-lg px-4 py-3 fw-bold shadow-sm" style="border-radius: 12px;">🖨️ 列印排程簽名表</button>
        </div>
      </div>
    </div>
    
    <div class="surface p-0 overflow-hidden shadow-sm mb-4">
      <div class="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
        <h5 class="fw-bold mb-0 text-primary">📊 現場評分監控進度看板</h5>
        <span class="badge bg-primary-subtle text-primary fw-bold">自動更新：20秒/次</span>
      </div>
      <div class="table-responsive">
        <table class="admin-table mb-0">
          <thead>
            <tr>
              <th style="padding-left: 1.5rem; text-align: left;">考生編號 & 姓名</th>
              <th>甄試類別</th>
              <th style="text-align: left;">試教關卡狀態 (評審)</th>
              <th style="text-align: left;">口試關卡狀態 (評審)</th>
              <th>已收筆數</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPrintArea() {
  const printEl = document.querySelector("#printArea");
  if (!printEl) return;
  
  const rowsHtml = candidates.map((c, index) => {
    const track = RUN_TRACKS[c.trackKey];
    return `
      <tr>
        <td>${index + 1}</td>
        <td class="fw-bold">${c.no}</td>
        <td>${c.name}</td>
        <td>${c.schedule.teaching.time}</td>
        <td>${c.schedule.teaching.room}</td>
        <td class="signature-box">
          <div class="small text-muted text-start" style="font-size: 7.5pt; border-bottom: 1px dotted #ccc; padding-bottom: 6px;">
            1. ${track.stages.demo.judges[0]}:
          </div>
          <div class="small text-muted text-start" style="font-size: 7.5pt; padding-top: 2px;">
            2. ${track.stages.demo.judges[1]}:
          </div>
        </td>
        <td>${c.schedule.oral.time}</td>
        <td>${c.schedule.oral.room}</td>
        <td class="signature-box">
          <div class="small text-muted text-start" style="font-size: 7.5pt; border-bottom: 1px dotted #ccc; padding-bottom: 6px;">
            1. ${track.stages.idv.judges[0]}:
          </div>
          <div class="small text-muted text-start" style="font-size: 7.5pt; padding-top: 2px;">
            2. ${track.stages.idv.judges[1]}:
          </div>
        </td>
        <td></td>
      </tr>
    `;
  }).join("");
  
  printEl.innerHTML = `
    <div class="print-title">桃園市桃園區青溪國民小學 115 學年度代理代課教師甄試數位評分控制台</div>
    <div class="print-subtitle">甄試流水線排程暨委員簽名確認表 (列印時間：${new Date().toLocaleString()})</div>
    <table class="print-table">
      <thead>
        <tr>
          <th style="width: 4%;">序</th>
          <th style="width: 7%;">考生編號</th>
          <th style="width: 9%;">考生姓名</th>
          <th style="width: 10%;">試教時間</th>
          <th style="width: 10%;">試教教室</th>
          <th style="width: 20%;">試教評審委員簽名</th>
          <th style="width: 10%;">口試時間</th>
          <th style="width: 10%;">口試教室</th>
          <th style="width: 20%;">口試評審委員簽名</th>
          <th style="width: 10%;">備註</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="print-footer">
      <span>承辦人：__________________</span>
      <span>輔導主任：__________________</span>
      <span>校長：__________________</span>
    </div>
  `;
}

// [初始化與事件監聽]
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  
  const select = document.querySelector("#judgeSelect");
  select.innerHTML = '<option value="">請選擇...</option>' + JUDGES.map(j => `<option value="${j}" ${j===selectedJudge?'selected':''}>${j}</option>`).join("");
  
  select.addEventListener("change", (e) => {
    if (!e.target.value) {
      selectedJudge = "";
      saveState();
      renderAll();
      return;
    }
    if (prompt("請輸入驗證密碼") === CONFIG_PASSWORD) {
      selectedJudge = e.target.value;
      saveState();
      renderAll();
    } else {
      alert("密碼錯誤");
      e.target.value = selectedJudge || "";
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

  document.querySelector("#prevCandidate").addEventListener("click", () => changeCandidate(-1));
  document.querySelector("#nextCandidate").addEventListener("click", () => changeCandidate(1));

  document.querySelector("#resetThreeViews").addEventListener("click", () => {
    if (confirm("確定清除本機紀錄？這將會清空尚未同步到雲端的所有分數備援。")) { 
      localStorage.clear(); 
      location.reload(); 
    }
  });

  // 實作即時時鐘更新
  function updateClock() {
    const clockEl = document.querySelector("#liveClock");
    if (clockEl) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 綁定手動更新看板按鈕
  const forceSyncBtn = document.querySelector("#forceSyncBtn");
  if (forceSyncBtn) {
    forceSyncBtn.addEventListener("click", () => {
      forceSyncBtn.disabled = true;
      forceSyncBtn.textContent = "更新中...";
      syncScoresFromCloud().finally(() => {
        forceSyncBtn.disabled = false;
        forceSyncBtn.textContent = "手動更新看板";
      });
    });
  }

  // 根據回復狀態顯示正確面板
  document.querySelectorAll(".view-button").forEach(b => {
    if (b.dataset.view === currentView) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });
  document.querySelectorAll(".view-panel").forEach(p => {
    if (p.id === `${currentView}View`) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });

  renderAll();
  syncScoresFromCloud();
  setInterval(syncScoresFromCloud, 20000);
});
