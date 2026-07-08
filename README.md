# 青溪國小115學年度代理代課教師甄試數位評分控制台

這是一套給甄試現場使用的單頁式評分控制台，支援考生逐位檢視、評審線上評分、Google Apps Script 寫入試算表、本機暫存備援，以及行政看板列印排程簽名表。

## 檔案結構

```text
.
├─ index.html    # GitHub Pages 入口頁
├─ today.html    # 舊網址轉址到 index.html
├─ today.css     # 介面樣式
├─ today.js      # 考生資料、排程、評分與 GAS 同步邏輯
└─ README.md     # 專案說明
```

## 主要功能

- 一次只顯示一位考生，避免現場評分時畫面過亂。
- 支援上一位、下一位與看板進度切換。
- 6 位考生雙軌排程：
  - 試場 A：試教
  - 試場 B：口試
  - 每人 10 分鐘
  - 09:30-09:40 換場
- 評審線上評分：
  - 試教評分
  - 口試評分
  - 自動合計
  - Enter 跳下一格
  - 聚焦分數欄自動全選
  - 防止連點重複送出
- 切換考生前會檢查是否有未送出的分數。
- 評審選擇需輸入密碼 `csps`。
- 7/10 評審名單：邱俊智、陳莉榛、廖人鋐、蘇一智、鄭嘉琪、吳文瓊、高琳茵。
- 支援 Google Apps Script Web App 寫入 Google 試算表。
- 若雲端讀取受瀏覽器限制，仍保留 LocalStorage 本機暫存紀錄。
- 行政看板可列印 A4 橫式排程簽名表。

## GitHub Pages 部署

1. 建立 GitHub repository。
2. 上傳本資料夾內所有檔案。
3. 到 repository 的 `Settings`。
4. 進入 `Pages`。
5. Source 選擇 `Deploy from a branch`。
6. Branch 選擇 `main`，資料夾選擇 `/root`。
7. 儲存後等待 GitHub Pages 產生網址。

GitHub Pages 會自動讀取 `index.html` 作為首頁。

## Google Apps Script 設定

`today.js` 內已設定 Apps Script Web App URL：

```javascript
const API_URL = "https://script.google.com/macros/s/AKfycby9v87cRPksXV5pvIhEXbZxvCE_L69JI06aQ26wMeX3vZCou2MiijkP9z0V8K9ONFga2g/exec";
```

送出的資料欄位：

```text
judgeName
candidateNo
candidateName
subject
scoreType
s1
s2
s3
s4
s5
total
```

## 現場使用流程

1. 開啟控制台首頁。
2. 使用「考生」模式確認目前考生與試教、口試排程。
3. 切到「評分」模式。
4. 選擇評審委員並輸入密碼 `csps`。
5. 填寫試教或口試分數。
6. 點選「送出評分」。
7. 切換下一位考生。
8. 行政端可在「看板」查看進度並列印排程簽名表。

## 注意事項

- 正式成績資料以 Google 試算表為準。
- LocalStorage 只作為本機備援與畫面顯示用。
- 若修改考生名單、評分項目或排程，請更新 `today.js`。
- 若重新部署 Apps Script，請同步更新 `today.js` 的 `API_URL`。
