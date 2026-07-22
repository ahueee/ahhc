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

這是本流程的核心步驟，全程使用 **gws CLI**（不需開啟瀏覽器）。目標是從簡報中找出：
1. **有幾件作品**（決定要建幾個 Notion 作品集頁面）
2. **每件作品的名稱、場地、展期、尺寸、媒材、介紹**

> 所有 gws 指令一律用 **Python subprocess** 執行，`--params` / `--json` 帶 `json.dumps(...)`，
> 不要用 shell 直接帶 JSON（避免 `$`、`!`、引號被 shell 展開破壞）。

### 2-1 用 gws 定位專案資料夾與 Slides 檔案

**Step A：找到專案資料夾**

用 `gws drive files list` 搜尋名稱含 project_name 的資料夾：

```python
import subprocess, json

def gws(args, params=None, body=None):
    cmd = ['gws'] + args
    if params is not None:
        cmd += ['--params', json.dumps(params)]
    if body is not None:
        cmd += ['--json', json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout

# 搜尋專案資料夾
out = gws(['drive', 'files', 'list'], params={
    "q": f'name contains "{project_name}" and mimeType="application/vnd.google-apps.folder" and trashed=false',
    "fields": "files(id,name,parents)",
    "supportsAllDrives": "true",
    "includeItemsFromAllDrives": "true"
})
```

從結果取得專案資料夾的 `folder_id`（若有多個，選最符合 project_name 的）。

**Step B：在專案資料夾中找 Google Slides 檔案**

簡報**直接放在專案資料夾底下**（資料夾名稱本身也含 project_name），直接查該資料夾即可：

```python
# 專案資料夾下的 Slides 檔
out = gws(['drive', 'files', 'list'], params={
    "q": f'"{folder_id}" in parents and mimeType="application/vnd.google-apps.presentation" and trashed=false',
    "fields": "files(id,name,parents)",
    "supportsAllDrives": "true",
    "includeItemsFromAllDrives": "true"
})
```

記下目標簡報的 `presentation_id`。若有多個簡報檔（例如「提案」「結案」），優先選最新／最完整的版本。

> 備案：若 Step A 找資料夾不順（同名多筆），也可跳過資料夾直接全域搜尋簡報：
> `name contains "{project_name}" and mimeType="application/vnd.google-apps.presentation"`。

### 2-2 用 gws 讀取簡報文字內容

用 `gws slides presentations get` 取得完整簡報，並在 Python 中解析每頁文字：

```python
result = subprocess.run(
    ['gws', 'slides', 'presentations', 'get',
     '--params', json.dumps({"presentationId": presentation_id})],
    capture_output=True, text=True
)
raw = result.stdout
lines = raw.split('\n')
j = next(i for i, l in enumerate(lines) if l.strip().startswith('{'))
data = json.loads('\n'.join(lines[j:]))

# 只讀前 10 頁：作品集所需資訊（名稱／場地／展期／尺寸／媒材／介紹）通常都在前段，省 token
for i, slide in enumerate(data['slides'][:10]):
    texts = []
    for elem in slide.get('pageElements', []):
        for run in elem.get('shape', {}).get('text', {}).get('textElements', []):
            c = run.get('textRun', {}).get('content', '').strip()
            if c:
                texts.append(c)
        # 表格內文字
        for row in elem.get('table', {}).get('tableRows', []):
            for cell in row.get('tableCells', []):
                for run in cell.get('text', {}).get('textElements', []):
                    c = run.get('textRun', {}).get('content', '').strip()
                    if c:
                        texts.append(c)
    print(f"Slide {i+1}: {' | '.join(texts)}")
```

> **只讀前 10 頁**（`data['slides'][:10]`）。作品名稱、場地、展期、尺寸、媒材、介紹幾乎都集中在前段，
> 前 10 頁足夠完成作品集，可大幅省 token。
> 只有在前 10 頁明顯缺關鍵資訊時，才把切片放寬（例如 `[:20]`）繼續往後讀。

### 2-3 判斷作品數量

讀取簡報後，判斷其中有幾件**獨立作品**：

- **1 件作品** → 建立 **1 個**作品集頁面
- **2 件以上** → 為**每件作品各建立 1 個**頁面

判斷依據：
- 簡報是否有明顯的分節（作品一、作品二⋯⋯）
- 是否出現多個不同的作品名稱，且各自有獨立的場地/尺寸/介紹
- 不同展示媒材（投影 vs LED 屏）通常代表獨立的作品

### 2-4 提取每件作品的資訊

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

記下 **portfolio_page_id** 備用。

> **⚠️ 樣板套用是非同步的——務必先確認套用完成再寫內容（否則會出現重複區塊）**
>
> Notion 套用 template 是背景作業，且 `notion-fetch` 在建立後短時間內會**一直回「建立當下的空白快取」**，讓你誤判樣板沒套上。
>
> 千萬不要一看到 fetch 顯示 `blank-page` 就用 `replace_content` 覆寫——因為你寫完之後，樣板骨架才會被 Notion 補進來，結果變成「你的內容 + 一份空樣板」兩份，頁尾就多出重複的 `說明《作品名稱》/ 影片 / 照片 / 連結參考`。
>
> **正確作法**：建立後先等 5 秒，然後 `notion-fetch` 反覆確認，直到 content 裡**實際出現樣板結構**（看得到 `### 《作品名稱》` 說明表、`# 連結參考` 等）再進行 3-2 / 3-3。若連續幾次 fetch 都還是 blank，就再等幾秒重試，不要搶先寫入。

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

**前提**：3-1 已確認樣板結構實際出現在 content 中（不是空白快取）。

一律用 `notion-update-page` 的 **`update_content` 命令**（search-and-replace），**針對樣板既有的 placeholder 做替換**，把作品資訊填進樣板原本的 `說明` table。

- 標題：把 `### 《作品名稱》` 替換成 `### 《[artwork_name]》`
- table：把各列右欄的空 cell（`<td></td>`）替換成對應內容（場地／展期／尺寸／媒材／作品介紹／Credit）

> **不要用 `replace_content` 整頁覆寫**。原因：
> 1. 若樣板尚未套完，`replace_content` 會與稍後補上的樣板骨架疊成兩份 → 產生重複區塊。
> 2. 使用者可能已在頁面加了照片、填了欄位；整頁覆寫會蓋掉他的編輯。
>
> `update_content` 只動你指定的 placeholder，安全得多。

**萬一還是出現重複區塊**（頁尾多一份空的 `說明《作品名稱》/ 影片 / 照片 / 連結參考`）：
用 `update_content` 把「頁尾那份空樣板」整段當 `old_str`、`new_str` 設為空字串刪除；錨點用 `### 《作品名稱》`（只會出現在未填的重複區）。刪除前先 `notion-fetch` 確認要刪的是空的那一份，**不要刪到已填內容的那一份**。

---

## Step 4：網路搜尋 - 填寫連結參考

每個作品集頁面填入對應連結（同一專案的多件作品可共用同一次搜尋結果）。

### 4-1 社群推廣

搜尋詞（多次嘗試不同組合）：
- `[project_name] site:instagram.com`
- `[artwork_name] [project_name] reels`
- `[project_name] Facebook`

### 4-2 媒體報導

搜尋詞：
- `[project_name] 媒體報導 OR 新聞`
- `[artwork_name] 報導 OR 採訪`
- 若屬較大活動，用活動名稱搜尋

**篩選原則：**
- ✅ 只收內文／圖片有提到作品名或製作團隊的報導（活動整體報導只要點到這件作品也算）
- 務必逐篇 WebFetch 開內文確認再收；擋爬蟲無法核實的仍可收，但標註為「疑似但未證實」交使用者決定

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
| 定位 Google Drive 資料夾與 Slides 檔案 | gws CLI (`gws drive files list`) |
| 讀取 Google Slides 文字內容 | gws CLI (`gws slides presentations get`) |
| 搜尋社群推廣、媒體報導 | WebSearch |
