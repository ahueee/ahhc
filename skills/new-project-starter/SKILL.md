---
name: new-project-starter
description: >
  啟動新專案的完整工作流。當使用者說「啟動新專案」、「start new project」、
  或提供「[project name]_[work name]」格式的專案名稱時觸發。
  會自動在 Notion 建立專案頁面、在 Slack 建立私人頻道。
  只要使用者提到「啟動新專案」、「開新案子」、「new project」、「建立專案」就應立即使用此 skill。
---

# 啟動新專案 Skill

當使用者說「啟動新專案 [project name]_[work name]」或類似語句時，執行以下完整流程。

---

## Step 0：解析輸入

從使用者的 prompt 中提取：
- **project_name**：底線前的文字（如 `ABC藝術節`）
- **work_name**：底線後的文字（如 `主燈`）；若沒有底線或沒有第二段，則 work_name 為空
- **year_now**：取得當前年份（西元年，例如 2026）

建立格式化標題：
- **page_title**：
  - 若有 work_name：`[year_now]_[project_name] - [work_name]`（例如 `2026_ABC藝術節 - 主燈`）
  - 若無 work_name：`[year_now]_[project_name]`（例如 `2026_ABC藝術節`）
- **slack_channel_name**：`[year_now]-[project_name]`（空格轉 `-`，例如 `2026-ABC藝術節`）

---

## Step 1：建立 Notion 專案頁面

使用 **Notion MCP connector** 工具（`mcp__*__notion-*`）完成所有操作，不使用瀏覽器。

### 1-1 並行取得 Database Schema 與成員清單

同時執行以下兩個操作，節省時間：

**A. Fetch Projects Database**
使用 `notion-fetch` 取得 Projects database：
- URL：`https://www.notion.so/4a066d61c95c4fb29578e425b31e3c2d`

從回傳結果中取得：
- `data_source_id`（collection ID，用於建立頁面的 parent）
- 各 property 的正確名稱（特別是「狀態」與「團隊」欄位的實際欄位名稱）
- `<templates>` 區塊中 **「專案樣板 v7.5」** 的 `template_id`

**B. 搜尋成員 ID**
使用 `notion-get-users` 分別搜尋：
- `query: "Annie"` → 找到 `Annie Hu` 的 user ID
- `query: "Chin"` → 找到 `Chin Hsiang Hu` 的 user ID

### 1-2 建立頁面並套用樣板

使用 `notion-create-pages` 一次完成建立頁面、套用樣板、設定 properties：

- `parent.type`：`data_source_id`，值為 Step 1-1 取得的 data_source_id
- `template_id`：「專案樣板 v7.5」的 template ID（使用 template 時不要帶 content）
- `properties`：同時設定標題（page_title）、狀態（`接洽/提案中`）、團隊（Annie Hu 與 Chin Hsiang Hu 的 user ID）

記下新頁面的 `page_id` 備用。

> 樣板套用是非同步的，頁面建立後內容會稍後出現，約等 3-5 秒再進行下一步。

### 1-3 刪除「使用說明」區塊

使用 `notion-fetch` 取得新頁面完整內容，找到「使用說明」toggle heading 區塊（含其所有子內容）。

使用 `notion-update-page`（`update_content` 命令）將整段「使用說明」toggle block 替換為空字串：

```json
{
  "page_id": "<新頁面 page_id>",
  "command": "update_content",
  "content_updates": [
    {
      "old_str": "<從 fetch 取得的完整使用說明 toggle block 內容>",
      "new_str": ""
    }
  ]
}
```

### 1-4 修改子資料庫標題 `(Sample)`

在 `notion-fetch` 的頁面內容中找到標題為 `(Sample)` 的子資料庫，取得其 database URL 或 ID。

使用 `notion-update-data-source` 將其標題改為 **page_title**。

---

## Step 2：建立 Slack 頻道

### 2-0 檢查頻道是否已存在

使用 `slack_search_channels` 搜尋 **slack_channel_name**（例如 `2026-ABC藝術節`）：
- 設定 `channel_types: "public_channel,private_channel"` 以同時搜尋私人頻道

若**已存在**：回報頻道已存在，跳過建立步驟。
若**不存在**：繼續執行 Step 2-1。

### 2-1 建立私人頻道

> ⚠️ **Slack MCP connector 目前不支援建立頻道**，請改用 Google Chrome DevTools MCP 操作。

使用 Chrome DevTools MCP（`mcp__chrome-devtools__*`）操作瀏覽器，執行以下步驟：

**A. 開啟 Slack 並導航**

1. 使用 `mcp__chrome-devtools__list_pages` 確認目前開啟的頁面清單
2. 若已有 Slack 分頁（URL 含 `app.slack.com`），使用 `mcp__chrome-devtools__select_page` 切換至該分頁；若無，則使用 `mcp__chrome-devtools__new_page` 開啟新分頁後再以 `mcp__chrome-devtools__navigate_page` 前往 `https://app.slack.com`
3. 使用 `mcp__chrome-devtools__take_screenshot` 確認 Slack 已正確載入

**B. 建立頻道**

4. 使用 `mcp__chrome-devtools__evaluate_script` 嘗試點擊「新增頻道」入口：
   ```javascript
   document.querySelector('[data-qa="add-channel-link"]')?.click();
   ```
   若此 selector 無效，改用 `mcp__chrome-devtools__take_screenshot` 截圖後，再以 `mcp__chrome-devtools__click` 點擊畫面上的「+」或「Add channels」按鈕
5. 在彈出選單中使用 `mcp__chrome-devtools__click` 點選「創建頻道」(Create a channel)
6. 使用 `mcp__chrome-devtools__wait_for` 等待建立表單出現（selector 如 `[data-qa="create-channel-name-input"]`）
7. 使用 `mcp__chrome-devtools__fill` 在 Channel name 欄位填入 **slack_channel_name**（例如 `2026-ABC藝術節`）
8. 使用 `mcp__chrome-devtools__click` 將可見性切換為**私人（Private）**
9. 點擊「建立（Create）」完成頻道建立

**C. 加入成員**

10. 進入「添加人員」步驟後，使用 `mcp__chrome-devtools__fill` 在搜尋欄輸入 `Chin-Hsiang`
11. 使用 `mcp__chrome-devtools__take_screenshot` 確認搜尋結果，再以 `mcp__chrome-devtools__click` 選取 `Hu, Chin-Hsiang` 並確認加入

**D. 移至分區**

12. 使用 `mcp__chrome-devtools__take_screenshot` 確認頻道已出現在左側列表
13. 右鍵點擊左側頻道名稱，選擇「移至分區」→ **「專案 Projects」**（若無法右鍵，改用 `mcp__chrome-devtools__evaluate_script` 觸發 contextmenu 事件）

> **操作原則**：每個步驟後都用 `mcp__chrome-devtools__take_screenshot` 確認畫面狀態。若某個 DOM selector 失敗，截圖後重新觀察畫面並調整 selector；或改用 `mcp__chrome-devtools__evaluate_script` 查詢可用元素後再操作。

---

## 完成確認

完成後，向使用者回報：
1. Notion 頁面標題與連結（`https://notion.so/<page_id>`）
2. Slack 頻道名稱（`#slack_channel_name`）

---

## 注意事項

- **Notion 所有操作**使用 Notion MCP connector（`mcp__*__notion-*`），不使用瀏覽器。
- **Slack 搜尋**使用 Slack MCP connector；頻道**建立**目前需使用 Chrome DevTools MCP（`mcp__chrome-devtools__*`）。
- `notion-fetch` 務必先執行，才能取得正確的 property 名稱與 template ID，避免欄位名稱猜錯。
- page_title 格式需完全正確，包含年份、底線、空格、連字號。
- 樣板套用非同步，建立頁面後需稍等 3-5 秒再 fetch 內容，才能找到「使用說明」區塊。
