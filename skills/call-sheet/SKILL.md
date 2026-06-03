---
name: call-sheet
description: >
  製作或更新進場通告單（Call Sheet）的完整工作流。
  當使用者說「做 [專案名] 的通告單」、「製作通告單」、「更新通告單」、
  「幫我做 X 的通告單」、「call sheet for X」時觸發。
  會自動從 Notion 工序頁讀取資訊、複製 Google Sheets 模板到專案資料夾、
  填入人員總表與每日工序，並套用正確的格式（白/灰/黃底色、外發廠商紅字）。
  只要使用者提到「通告單」三個字搭配任何專案名稱，就應立即使用此 skill。
---

# 通告單製作 Skill

依以下流程做出符合 Peppercorns 樣式規範的通告單。

---

## 重要 ID 與資源

- **模板 spreadsheet ID**：`1pEru-90wEpSDQGFOy32z2u2i322eCYGlVoeC-KcdUD8`
- **模板名稱**：`（專案名稱）＿通告單 Template`
- 目標 Drive 資料夾：依專案不同（地景藝術節資料夾 `1wda1tI_7hO3u08V6xUM0lTL_LX7FVc1i`、其他資料夾使用者會給）
- Notion 來源：通常是專案資料庫中的「工序安排」與「進場安裝」兩個頁面

模板分頁結構：
- `人員總表`（sheetId 固定 `1045181812`）
- `（日期）`（一個範本 day sheet；複製成多份命名為 `6/9`、`6/10` ...）

---

## Step 1：蒐集資訊

1. 讀取兩個 Notion 頁面（使用者通常會給連結）：
   - **工序安排**：抓「工序統整」「工序細流」表格
     - 每天的進場日期（紅底列）
     - 每個時段的工序、人員、設備
   - **進場安裝**：抓住宿、餐食、廠商、預組裝與交通資訊
2. 釐清出**永安漁港這類「現場」進場的日期範圍**（通常是 4-6 天）。倉庫預組裝那幾天不算現場日期，要分清楚。
3. 列出每天的「公司內部夥伴」vs「外發廠商」，整理出每人每日 call time。

---

## Step 2：複製模板

```python
import subprocess, json

result = subprocess.run([
    'gws', 'drive', 'files', 'copy',
    '--params', json.dumps({
        "fileId": "1pEru-90wEpSDQGFOy32z2u2i322eCYGlVoeC-KcdUD8",
        "supportsAllDrives": "true"
    }),
    '--json', json.dumps({
        "name": f"{year}_{project_name}_通告單",
        "parents": [TARGET_FOLDER_ID]
    })
], capture_output=True, text=True)
```

新檔命名建議：`{year}_{project_name}_通告單`（例如 `2026_桃園地景藝術節_永安漁港_通告單`）。

---

## Step 3：建立各日分頁

複製 `（日期）` 分頁為多份，每份命名為日期（`6/9`、`6/10` 等），原本的 `（日期）` 改名為第一天日期：

```python
requests = [
    {"duplicateSheet": {"sourceSheetId": 0, "insertSheetIndex": 2, "newSheetName": "6/10"}},
    {"duplicateSheet": {"sourceSheetId": 0, "insertSheetIndex": 3, "newSheetName": "6/11"}},
    {"duplicateSheet": {"sourceSheetId": 0, "insertSheetIndex": 4, "newSheetName": "6/12"}},
    {"updateSheetProperties": {"properties": {"sheetId": 0, "title": "6/9"}, "fields": "title"}},
]
```

---

## Step 4：填入「人員總表」

**只放現場進場那幾天的日期**，倉庫預組裝、開幕、撤場等非進場日不要寫進來，版面要乾淨。

欄位結構：
- A2-?2：日期（從 B2 開始）
- A3-?：人員名稱（從 A3 開始）
- B3-?：每人每日的 call time

人員分兩段：
- 內部夥伴（先列出）
- 空 4-5 列當隔開
- `外發夥伴` 標頭列
- 外發人員（**只列廠商/公司名**，不要把同公司的個人拆開寫；例如「青田」這家公司有「詹大、Ken」兩位，就只寫「青田」，數量在點餐統整另記）

### 格式規則（重要！）

| 區域 | 條件 | 底色 | 字體 |
|------|------|------|------|
| 內部夥伴名字（A 欄） | 一律 | 白 `#FFFFFF` (1.0, 1.0, 1.0) | bold |
| 內部夥伴時間 | 要進場的時間（如 `9:00 - 20:00`） | 白 `#FFFFFF` | bold |
| 內部夥伴時間 | 不用去（值是 `x`） | 淺灰 `#F0F0F0` (0.94, 0.94, 0.94) | not bold |
| 外發夥伴整段（A12 以下到名單結束） | 一律 | 淺黃 `#FFF2CC` (1.0, 0.949, 0.8) | bold 看是否進場 |
| 外發夥伴時間 | 要進場 | 黃底 | bold |
| 外發夥伴時間 | `x` | 黃底 | not bold |
| `外發夥伴` 標頭列 A 欄 | 一律 | 黃底 | bold |

**清欄**：模板原本可能有遺留的舊日期欄（如 9/13 之後），務必把 F-L 整段欄位清空。

### 格式套用程式碼骨架

```python
WHITE = {"red": 1.0, "green": 1.0, "blue": 1.0}
LIGHT_GREY = {"red": 0.94, "green": 0.94, "blue": 0.94}
LIGHT_YELLOW = {"red": 1.0, "green": 0.949, "blue": 0.8}

def fmt_req(sheet_id, row_s, row_e, col_s, col_e, bg, bold):
    return {"repeatCell": {
        "range": {"sheetId": sheet_id, "startRowIndex": row_s-1, "endRowIndex": row_e,
                  "startColumnIndex": col_s-1, "endColumnIndex": col_e},
        "cell": {"userEnteredFormat": {"backgroundColor": bg, "textFormat": {"bold": bold}}},
        "fields": "userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.bold",
    }}
```

逐 cell 套用，依該 cell 的值（時間 vs `x`）決定 bold 與 bg。

---

## Step 5：填入每日分頁

每天的 day sheet 結構：

| 區塊 | 位置 |
|------|------|
| 標題 | A1（專案 X 黑川互動媒體藝術 / 作品名稱，多行用 `\n`） |
| 日期 / 進場階段 | H1（如 `2026/6/9\n硬體進場 Day1`） |
| Call / End Time | J1（如 `Call Time  9:00\nEnd Time  20:00`） |
| 通告時間 | A4:B12（**只放公司內部的人**） |
| 外部夥伴 / 客戶 | C4:F12（廠商 / 人數 / 窗口 / 抵達時間） |
| 第一現場 | H3（地點名稱） |
| 第二現場 | I3（地點名稱） |
| 餐食統整 | M3:T15（餐點預訂） |
| **時間 header** | A16（**注意：是 row 16，不是 15！**） |
| **工序時間槽** | A17 起（B 工序、F 人員、I 設備） |
| 點餐統整 | M17 起 |
| PM 工作表 | V 欄 |

### 關鍵紀律

1. **通告時間**只放公司內部夥伴；浩宇、青田等外發放在「外部夥伴/客戶」那一段。
2. **第一現場/第二現場**指當天會去的地點。例如 6/9 從倉庫出發再到永安漁港，第一現場 = 倉庫、第二現場 = 永安漁港觀光漁市。要去看 Notion 工序裡寫的「\[倉庫\]」「\[永安\]」標記。
3. **時間表 row offset**：模板的「時間」表頭在 **row 16**（不是 15），實際時間槽從 **row 17** 開始。第一次做時很容易差 1 列。
4. **如果當日開始時間 < 模板第一格（10:00）**：要 `insertDimension` 在 row 17 插入新列，再把 A17 設成早一個小時的時段（如 `9:00 - 10:00`）。整份點餐統整與其他內容會跟著往下移，這是預期行為。
5. **如果 Notion 工序的午餐/晚餐時間 ≠ 模板（13:00 / 18:00）**：要主動把午餐、晚餐 row 移到正確位置（例如 6/9 的午餐在 12-13，要把 B 跟 F 移過去，原本 13-14 槽改成 Notion 該時段的工序）。
6. **點餐統整人員清單**：必須包含當天所有來的人，含外發。例如有 2 位浩宇就寫兩列「浩宇」（一列一人，這樣餐點數量才對）。
7. **人員欄外發廠商紅字**：F 欄的人員 cell 若有「浩宇」「青田」等外發廠商名稱，要用 `updateCells` + `textFormatRuns` 把這些字串標成深紅色 2（`#990000` ≈ rgb 0.6, 0, 0）。

### 外發廠商紅字程式碼

```python
DARK_RED_2 = {"red": 0.6, "green": 0.0, "blue": 0.0}
BLACK = {"red": 0.0, "green": 0.0, "blue": 0.0}

def build_runs(text, targets=["浩宇", "青田"]):
    """找出 targets 在 text 中所有位置，建出 textFormatRuns 結構"""
    positions = []
    for target in targets:
        idx = 0
        while True:
            found = text.find(target, idx)
            if found == -1: break
            positions.append((found, found + len(target)))
            idx = found + len(target)
    if not positions: return None
    positions.sort()
    runs = [{"startIndex": 0, "format": {"foregroundColor": BLACK}}]
    for (s, e) in positions:
        runs.append({"startIndex": s, "format": {"foregroundColor": DARK_RED_2}})
        runs.append({"startIndex": e, "format": {"foregroundColor": BLACK}})
    return runs

# 套用
{"updateCells": {
    "range": {"sheetId": SHEET_ID, "startRowIndex": row-1, "endRowIndex": row,
              "startColumnIndex": 5, "endColumnIndex": 6},  # F column
    "rows": [{"values": [{
        "userEnteredValue": {"stringValue": text},
        "textFormatRuns": runs
    }]}],
    "fields": "userEnteredValue,textFormatRuns",
}}
```

---

## Step 6：驗證

讀回 spreadsheet 確認：
- 人員總表 4 個日期欄都正確、外發夥伴在黃底區、時間用粗體、x 用淺灰
- 各日分頁 A17 起的時間槽與 Notion 工序對齊
- 通告時間只有內部、外部夥伴在 C 欄、第一/第二現場有填
- 點餐統整名單包含所有外發
- F 欄的浩宇/青田用紅字（要把 spreadsheet 開來目視確認，read API 不會顯示文字顏色）

---

## ⚠️ 持續編輯紀律（不可覆蓋使用者編輯）

使用者完成第一輪後**可能會手動編輯內容**（改人名、改時間、加註記、合併儲存格、改顏色），下一輪請我「再加一些東西」時：

### 一定要做
- **先讀當前狀態**（不要憑記憶或前次產出）
- **比對結構變化**：欄/列數、合併儲存格、儲存格內容差異
- **最小變動原則**：能用 `insertText` 解決就不要 `deleteObject + createTable`
- 修改某 cell 文字時，**只動該 cell**，不要順手「更新一下整個區塊」

### 一定不要做
- 不要覆蓋使用者填入的店家、餐點、單價、車型車號等具體資料
- 不要重設使用者調過的欄寬、列高、邊框、背景色
- 不要因為「順便清乾淨」就把不在請求範圍內的格子清空
- 任何需要重建整個元素的動作前，**先告知使用者**「我會重建 X，這會清掉你的 Y 編輯，OK 嗎？」

### 檢查清單（每次改既有通告單前過一次）
- [ ] 已重新 fetch 該 sheet 的當前狀態？
- [ ] 已比對結構與上次產出的差異？
- [ ] 即將動的範圍只限定在使用者要求的部分？
- [ ] 沒有順手覆寫使用者填的廠商、餐點、車型？

---

## gws 指令備忘

```bash
# 讀取
gws sheets +read --spreadsheet ID --range "SheetName!A1:Z30"

# 讀帶格式
gws sheets spreadsheets get --params '{"spreadsheetId":"...", "ranges":["..."], "includeGridData":"true", "fields":"sheets.data.rowData.values(userEnteredFormat(backgroundColor,textFormat))"}'

# values 批次更新（不含格式）
gws sheets spreadsheets values batchUpdate --params '{"spreadsheetId":"..."}' --json '{"valueInputOption":"RAW","data":[...]}'

# 完整批次更新（含格式、插入列、合併等）
gws sheets spreadsheets batchUpdate --params '{"spreadsheetId":"..."}' --json '{"requests":[...]}'

# 複製檔案
gws drive files copy --params '{"fileId":"...","supportsAllDrives":"true"}' --json '{"name":"...","parents":["..."]}'
```

務必用 Python `subprocess` + `json.dumps` 包裝，避免 shell 展開 `$`、`!` 等字元破壞 JSON。
