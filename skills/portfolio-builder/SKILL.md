---
name: portfolio-builder
description: >
  自動建立作品集頁面的完整工作流。當使用者說「作品集 [project name]」、「建立作品集」、
  「新增作品集」、「幫我建作品集」時立即觸發。
  會自動在 Notion 建立作品集頁面（含 template）、關聯專案、從 Google Drive 簡報抓取作品資訊、
  並上網搜尋社群推廣與媒體報導連結填入頁面。
  只要使用者提到「作品集」加上任何專案名稱，就應立即使用此 skill。
---

# 作品集建立 Skill

當使用者說「作品集 [project name]」時，執行以下完整流程。

---

## Step 0：解析輸入

從使用者的 prompt 中提取：
- **project_name**：`作品集` 後面的所有文字（例如 `光之河`、`台南國家美術館戶外廊道`）
- **year_now**：取得當前年份（西元年，例如 2026）

---

## Step 1：Notion - 取得專案資訊

使用 **Notion MCP connector**（`mcp__*__notion-*`）完成所有操作。

### 1-1 搜尋 Projects Database 中的對應專案

使用 `notion-search` 搜尋 **project_name**，找到 Projects database 中的對應專案頁面。

從搜尋結果中取得：
- **project_page_title**：該 Notion 頁面的**完整標題**（包含 emoji，例如 `🌅 台南國家美術館戶外廊道`）
- **project_page_id**：頁面 ID（備用）
- **專案類型**（property）
- **作品標籤**（property）

> 如果搜尋到多個結果，選擇最符合 project_name 的那個。

### 1-2 取得「歷年作品列表」Database 資訊

使用 `notion-search` 搜尋 `歷年作品列表`，找到 Peppercorns workspace 中的
**「歷年作品列表（持續更新）」** database。

使用 `notion-fetch` 取得 database 完整資訊：
- `data_source_id`（collection://... 格式，用於建立頁面）
- 各 property 的正確欄位名稱
- `<templates>` 區塊中 **「作品集樣板」** 的 `template_id`

**可與 Step 2 同時進行，節省時間。**

---

## Step 2：Google Slides - 讀取簡報，判斷作品數量與內容

這是本流程的核心步驟。目標是從簡報中找出：
1. **有幾件作品**（決定要建幾個 Notion 作品集頁面）
2. **每件作品的名稱、場地、展期、尺寸、媒材、介紹**

### 2-1 找到並讀取簡報

**Step A：用 Google Drive MCP 定位資料夾與 Slides 檔案**

用 `google_drive_search` 找到專案資料夾：
```
api_query: name contains '[project_name]'
```

找到資料夾後，搜尋其子資料夾（通常名為「簡報」、「proposal」、「presentation」）：
```
api_query: '[folder_id]' in parents
```

在資料夾中進一步搜尋 Google Slides 檔案：
```
api_query: '[folder_id]' in parents and mimeType = 'application/vnd.google-apps.presentation'
```

> 搜尋結果若回傳 `application/vnd.google-apps.presentation` 類型的檔案，即為 Google Slides。記下其 `file_id`。

**Step B：優先嘗試 Google Drive MCP 直接讀取（最快）**

取得 Slides 的 `file_id` 後，使用 `google_drive_fetch` 嘗試讀取內容：

```
file_id: [slides_file_id]
```

Google Drive MCP 支援 Google Slides 的文字 export，若成功即可直接取得所有投影片的純文字內容，**完全不需要開啟瀏覽器**，速度最快。

> **如果 `google_drive_fetch` 回傳內容**（即使是部分文字）→ 直接使用，跳過 Step C。
>
> **如果 `google_drive_fetch` 失敗或回傳空內容** → 繼續 Step C。

**Step C：Fallback — 用 Claude in Chrome 開啟並讀取（備案）**

僅在 Step B 失敗時才使用此方法：

1. 使用 `mcp__Claude_in_Chrome__tabs_context_mcp` 取得可用的 tab ID
2. 使用 `mcp__Claude_in_Chrome__navigate` 前往 Step A 找到的資料夾 URL：
   `https://drive.google.com/drive/folders/[folder_id]`
3. 使用 `mcp__Claude_in_Chrome__get_page_text` 查看資料夾中的檔案列表，找到 Slides 檔案
4. 用 `mcp__Claude_in_Chrome__navigate` 開啟 Slides 檔案
5. 用 `mcp__Claude_in_Chrome__get_page_text` 讀取簡報文字內容（重點看前 5-10 頁）

> Claude in Chrome 使用用戶的 Chrome 瀏覽器（已登入 Google 帳號），可正常開啟 Google Slides。
> 若 Claude in Chrome 未連線，提示用戶確認 Chrome extension 已啟動後再繼續。

### 2-2 判斷作品數量

讀取簡報後，判斷其中有幾件**獨立作品**：

- **1 件作品** → 建立 **1 個**作品集頁面
- **2 件以上** → 為**每件作品各建立 1 個**頁面

判斷依據：
- 簡報是否有明顯的分節（作品一、作品二⋯⋯）
- 是否出現多個不同的作品名稱，且各自有獨立的場地/尺寸/介紹
- 不同展示媒材（投影 vs LED 屏）通常代表獨立的作品

### 2-3 提取每件作品的資訊

對**每件作品**分別提取：
- **artwork_name**：作品名稱（例如 `玉山日出`、`香蕉樹的院子`）
- **場地**：venue
- **展期**：dates（例如 `2025.12.15 - 2026.03.08`）
- **尺寸**：dimensions（以簡報中標示的數值為準，例如 `W900 × H500 cm`）
- **媒材**：materials（例如 `投影機 × 3、生成式 AI`）
- **作品介紹**：description

---

## Step 3：Notion - 建立作品集頁面

對每件作品，依序執行以下步驟。若有 2 件作品，完整重複兩次。

### 3-1 建立頁面（套用樣板）

**Page title 格式**：`[project_page_title]《[artwork_name]》`

範例：
- `🌅 台南國家美術館戶外廊道《玉山日出》`
- `🌅 台南國家美術館戶外廊道《香蕉樹的院子》`

> project_page_title 直接使用從 Notion 讀取的**原始完整標題**，
> 包含 emoji，不要修改格式或去掉 emoji。

使用 `notion-create-pages`：
- `parent.type`: `data_source_id`（Step 1-2 取得）
- `template_id`：「作品集樣板」的 template_id
- `properties`: `Name` 設為上述 page_title

記下 **portfolio_page_id** 備用。樣板套用非同步，建立後稍等 3-5 秒。

### 3-2 填寫 Properties

使用 `notion-update-page` 更新：

**必填：**
- **🤖 Projects**（relation）：JSON array，指向 project_page_id 的 URL
- **Status**：根據作品媒材對應 database schema 的 Status 選項
  （例如 LED、投影互動、大型互動裝置）
- **環境**：`["戶外"]` 或 `["室內"]`（從場地判斷）
- **技術**：對應陣列（例如 `["即時AI生成", "電腦視覺"]`）

> 先用 `notion-fetch` 確認 portfolio page 的 property 名稱，再更新，避免欄位猜錯。

### 3-3 填寫說明區塊

使用 `notion-update-page`（update_content 命令），替換樣板中的說明 table：

```
### 《[artwork_name]》
<table>
  <tr><td>場地</td><td>[venue]</td></tr>
  <tr><td>展期</td><td>[dates]</td></tr>
  <tr><td>尺寸</td><td>[dimensions]</td></tr>
  <tr><td>媒材</td><td>[materials]</td></tr>
  <tr><td>作品介紹</td><td>[description]</td></tr>
  <tr><td>Credit</td><td></td></tr>
</table>
```

---

## Step 4：網路搜尋 - 填寫連結參考

每個作品集頁面填入對應連結（同一專案的多件作品可共用同一次搜尋結果）。

### 4-1 社群推廣

搜尋詞（多次嘗試不同組合）：
- `[project_name] site:instagram.com`
- `[artwork_name] [project_name] reels`
- `[project_name] Facebook`

### 4-2 媒體報導

- `[project_name] 媒體報導 OR 新聞`
- `[artwork_name] 報導 OR 採訪`
- 若屬較大活動，用活動名稱搜尋

### 4-3 填入 Notion

- **「社群推廣」**：每個連結一行
- **「媒體報導」**：bulleted list，格式 `• [標題](URL)`
- 找不到：填 `（尚無資料）`

---

## 完成確認

完成後向使用者回報：
1. 建立了幾個作品集頁面（含作品名稱）
2. 每個頁面的標題與 Notion 連結
3. 已填寫的欄位清單
4. 無法填寫的欄位說明原因

---

## 工具使用說明

| 任務 | 使用工具 |
|------|---------|
| 搜尋 Notion 專案、資料庫 | Notion MCP (`notion-search`, `notion-fetch`) |
| 建立、更新 Notion 頁面 | Notion MCP (`notion-create-pages`, `notion-update-page`) |
| 定位 Google Drive 資料夾與 Slides 檔案 | Google Drive MCP (`google_drive_search`) |
| 讀取 Google Slides 文字內容（優先） | Google Drive MCP (`google_drive_fetch`) |
| 讀取 Google Slides 文字內容（備案） | Claude in Chrome (`mcp__Claude_in_Chrome__*`) |
| 搜尋社群推廣、媒體報導 | WebSearch |
