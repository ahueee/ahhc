---
name: gws-slides
description: 使用 gws CLI 製作或操作 Google Slides 簡報時的完整參考，包含 Peppercorns 設計規範（配色、字體、版面）與 batchUpdate 執行方法。凡涉及 gws slides 指令或 Peppercorns 簡報製作的任務都應讀此 skill。
---

# gws CLI 簡報製作參考

## Peppercorns 設計規範

### 模板 ID
- **模板**：`19a1pIh_4fcNGs_-bNEEgEVN0QRfZgPOp6fUEb1eFqD0`
- **參考範本**：`1zUVBgbA8_nginyYSNy2o3pPhouXqHN0Sqme2EOCIRN0`

### 投影片規格
- **尺寸**：720 × 405pt（16:9）／9144000 × 5143500 EMU
- **四邊 margin**：22.7pt

### 配色

| 角色 | 色碼 | RGB float | 用途 |
|------|------|-----------|------|
| 背景主色 | `#1A1A1A` | 0.102 / 0.102 / 0.102 | 絕大多數投影片背景 |
| 重點黃 | `#F7C94F` | 0.969 / 0.788 / 0.310 | 章節數字、標籤色塊、強調文字 |
| 主文白 | `#FFFFFF` | 1.0 / 1.0 / 1.0 | 標題、大標 |
| 內文灰 | `#B4B4B4` | 0.706 / 0.706 / 0.706 | 內文、段落文字 |
| 備註灰 | `#888888` | 0.533 / 0.533 / 0.533 | 備註、圖說小字 |
| 深色文字（黃底用）| `#1A1A1A` | — | 黃底色塊上的文字 |

### 字體

| 語言 | 字體 | 用途 |
|------|------|------|
| 英文 | `Space Grotesk` | 標題、章節標籤、所有英文 |
| 中文 | `Noto Sans TC` | 中文內文、副標題 |

### 文字層級

| 層級 | 字級 | 字重 | 顏色 | 用途 |
|------|------|------|------|------|
| 大標題 | 60pt | Bold | 白 / 黃 | 封面、章節頁主標 |
| 次標題 | 48pt | Bold | 白 / 黃 | 重要概念說明大字 |
| 頁面標題 | 24pt | Bold | 白 / 黃 | 章節頁副標 |
| 內頁標題 | 18pt | Bold | 白 / 黃 | 內頁左上方頁面名稱 |
| 段落標題 | 10pt | Bold | 白 / 黃 | 內文區段標題 |
| **表格欄標題** | **10pt** | **Bold** | **黃** | **表格 column / row header** |
| **表格內文** | **8pt** | **Bold** | **灰** | **表格 cell 內容文字** |
| 內文 | 8pt | Regular | 淺灰 | 一般說明文字 |
| 備註 | 6pt | Regular | 淺灰 | 圖說備註、技術細節 |

行距：短內文 1.15 / 長內文 1.5；段落間距 spaceBelow 4pt。

### 版面結構

**章節頁（Section Header）**
```
黃色數字（60pt bold）  英文章節名（60pt bold white）
                      中文副標（24pt bold white）
```
章節編號格式：`0X  SECTION_NAME`（章節頁），側邊標籤：`SECTION  中文名`

**⚠️ Section Header 文字框寬度規則（必讀）**

Section header 有三個文字框，建立時 **寬度必須延伸到 slide 右邊緣**，否則英文長字（如 INTERACTION、BACKGROUND）在 60pt 下會強制換行。

投影片寬度 = 9144000 EMU。各文字框的正確 width：

| 元素 | translateX (EMU) | width (EMU) | height (EMU) | 說明 |
|------|-----------------|-------------|--------------|------|
| 數字（黃，60pt） | 288000 | 1200000 (~94pt) | **1016000 (80pt)** | 2 位數足夠 |
| 英文（白，60pt） | 1692250 | **7451750 (586.8pt)** | **1016000 (80pt)** | 延伸到右邊緣 |
| 中文（白，24pt） | 1728000 | **7416000 (583.9pt)** | **457200 (36pt)** | 延伸到右邊緣 |

> **高度規則**：文字框高度設剛好容納一行字即可，**不要用 3000000（236pt）**，那樣的高度難以在 UI 裡選取編輯。60pt 字用 80pt 高，24pt 字用 36pt 高。

```python
# ✅ 正確寫法 — 文字框寬到 slide 右邊緣
SLIDE_W = 9144000
sections = [
    # (oid_prefix, slide_oid, num, english, chinese)
]
for prefix, slide_id, num, en, cn in sections:
    reqs += [
        # 數字框
        make_textbox(f"{prefix}_n", slide_id, 288000,  1723850, 1200000, 3000000, num, 60, YELLOW),
        # 英文框 — width = SLIDE_W - translateX
        make_textbox(f"{prefix}_e", slide_id, 1692250, 1723850, SLIDE_W - 1692250, 3000000, en,  60, WHITE),
        # 中文框 — width = SLIDE_W - translateX
        make_textbox(f"{prefix}_c", slide_id, 1728000, 2606400, SLIDE_W - 1728000, 3000000, cn,  24, WHITE),
    ]

# ❌ 錯誤寫法（3000000 EMU = 236pt，太窄，長英文字會被折行）
# make_textbox(..., width=3000000, ...)
```

建立後若已發現換行，用 `updatePageElementTransform` 修正 scaleX：
```python
# scaleX = target_width / original_width_at_creation
# English: scaleX = 7451750 / 3000000 = 2.4839
# Chinese: scaleX = 7416000 / 3000000 = 2.4720
{"updatePageElementTransform": {
    "objectId": f"{prefix}_e",
    "transform": {"scaleX": 2.4839, "scaleY": 1.0,
                  "translateX": 1692250, "translateY": 1723850, "unit": "EMU"},
    "applyMode": "ABSOLUTE"
}}
```

**內容頁標準元素位置**

| 元素 | x | y | w | h | 規格 |
|------|---|---|---|---|------|
| 標題文字框 | 22.7 | 22.7 | 500 | auto | CN 換行 EN，18pt bold white，autoFit |
| 章節標籤（左下）| 22.7 | 386.5 | auto | auto | 6pt `#CCCCCC`，`章節中文 CHAPTER_EN` |
| Logo（右下）| 587.6 | 389.0 | 109.7 | 4.8 | Peppercorns logo |
| 頁碼（右下）| 697.3 | 386.5 | auto | auto | 6pt white，右對齊 |
| 內容區域 | 22.7 | 80 | 651.3 | 300 | — |

**標題文字格式：** 第一行中文（Noto Sans TC 18pt bold white）換行第二行英文（Space Grotesk 18pt bold white）

### 圖說標籤
- 黃底黑字：重要作品標題（bold 10pt）
- 白底黑字 / 青底黑字：複雜背景圖說（bold 10pt）

---

## 表格版面設計模式

**用 `createTable` 製作真正的表格**，不要用手工格線 + 文字框模擬。`createTable` 支援完整的樣式控制，效果更乾淨。

### 設計規範
- **欄標題（header row）**：黃色 10pt Bold，Noto Sans TC（中文）+ Space Grotesk 7pt dim（英文副標）
- **列標題（date/row header）**：黃色 10pt Bold，居中，稍深背景 `HDR_BG`
- **表格內文**：灰色 **8pt Bold**，Noto Sans TC
- **Header row 背景**：`#262626`（HDR_BG = 0.15/0.15/0.15）
- **內文 cell 背景**：`#1A1A1A`（DARK，與投影片背景同色）
- **內框線**：`#383838`（LINE_C），0.75pt
- **外框線**：`#2E2E2E`（EDGE_C），0.5pt

### 完整 createTable 流程

```python
LINE_C = {'red': 0.22, 'green': 0.22, 'blue': 0.22}
EDGE_C = {'red': 0.18, 'green': 0.18, 'blue': 0.18}
HDR_BG = {'red': 0.15, 'green': 0.15, 'blue': 0.15}

# 1. 建立表格
requests.append({'createTable': {
    'objectId': 'my_table',          # 最少 5 個字元
    'elementProperties': ep(X, Y, W, H, SLIDE_ID),
    'rows': 3, 'columns': 4}})

# 2. 設定欄寬
requests.append({'updateTableColumnProperties': {
    'objectId': 'my_table', 'columnIndices': [0],
    'tableColumnProperties': {'columnWidth': pt(62)},
    'fields': 'columnWidth'}})

# 3. 設定列高
requests.append({'updateTableRowProperties': {
    'objectId': 'my_table', 'rowIndices': [0],
    'tableRowProperties': {'minRowHeight': pt(24)},
    'fields': 'minRowHeight'}})

# 4. 設定格線（INNER / OUTER 分開設）
requests.append({'updateTableBorderProperties': {
    'objectId': 'my_table',
    'tableRange': {'location': {'rowIndex': 0, 'columnIndex': 0},
                   'rowSpan': 3, 'columnSpan': 4},
    'borderPosition': 'INNER',       # 或 'OUTER' / 'ALL'
    'tableBorderProperties': {
        'tableBorderFill': {'solidFill': {'color': {'rgbColor': LINE_C}}},
        'weight': pt(0.75), 'dashStyle': 'SOLID'},
    'fields': 'tableBorderFill,weight,dashStyle'}})

# 5. 設定 cell 背景 & 垂直對齊
requests.append({'updateTableCellProperties': {
    'objectId': 'my_table',
    'tableRange': {'location': {'rowIndex': 0, 'columnIndex': 0},
                   'rowSpan': 1, 'columnSpan': 1},
    'tableCellProperties': {
        'tableCellBackgroundFill': {'solidFill': {'color': {'rgbColor': HDR_BG}}},
        'contentAlignment': 'MIDDLE'},   # TOP / MIDDLE / BOTTOM
    'fields': 'tableCellBackgroundFill,contentAlignment'}})

# 6. 在 cell 插入文字（需指定 cellLocation）
requests.append({'insertText': {
    'objectId': 'my_table',
    'cellLocation': {'rowIndex': 0, 'columnIndex': 1},
    'insertionIndex': 0, 'text': '電力  Electrical'}})

# 7. 設定 cell 文字樣式（需指定 cellLocation）
requests.append({'updateTextStyle': {
    'objectId': 'my_table',
    'cellLocation': {'rowIndex': 0, 'columnIndex': 1},
    'style': {'fontFamily': 'Noto Sans TC', 'fontSize': pt(10), 'bold': True,
              'foregroundColor': rgb(YELLOW)},
    'textRange': {'type': 'FIXED_RANGE', 'startIndex': 0, 'endIndex': 2},
    'fields': 'fontFamily,fontSize,bold,foregroundColor'}})

# 8. 設定 cell 段落樣式（需指定 cellLocation）
requests.append({'updateParagraphStyle': {
    'objectId': 'my_table',
    'cellLocation': {'rowIndex': 0, 'columnIndex': 1},
    'style': {'alignment': 'START', 'lineSpacing': 100},
    'textRange': {'type': 'ALL'},
    'fields': 'alignment,lineSpacing'}})
```

### 透明背景（文字框用，非 table cell）
```python
{'updateShapeProperties': {'objectId': oid,
    'shapeProperties': {'shapeBackgroundFill': {'propertyState': 'NOT_RENDERED'}},
    'fields': 'shapeBackgroundFill'}}
```

---

## 重要執行規則

**所有 batchUpdate 必須用 Python subprocess 執行，不得用 shell 直接帶 JSON：**

```python
import subprocess, json

subprocess.run([
    'gws', 'slides', 'presentations', 'batchUpdate',
    '--params', json.dumps({"presentationId": PRES_ID}),
    '--json', json.dumps({"requests": requests})
], check=True)
```

> 原因：shell 會展開 `$`、`!` 等字元，破壞 JSON 內容。

**Object ID 規則：**
- 最短 5 個字元，否則 API 報錯（`length should not be less than 5`）
- 例：`'t48'` → 改為 `'t48_title'`

**段落對齊 enum：**
- ✅ `'START'`（左對齊）、`'CENTER'`、`'END'`（右對齊）、`'JUSTIFIED'`
- ❌ `'LEFT'` / `'RIGHT'` → API 會報 invalid enum 錯誤

---

## ⚠️ 製作簡報時的核心紀律

### 1. 左下角章節標籤必須符合該頁大標題

每個內容頁左下角都有章節標籤（`章節中文 CHAPTER_EN`，位於 x=22.7 y=386.5）。  
**做新頁或編輯頁面前先看一下這個標籤對不對。** 它常常從前一頁複製而來、但這一頁的主題已經換了，導致左下標籤與大標題不一致。

範例錯誤：
- 簡報 p.91-99 的主題是「聲音 SOUND」相關內容，但左下角標籤仍寫成上一章的「燈光 LIGHT」之類
- 看大標題判斷主題分類，左下標籤應與該章節主題一致

**作法：**
- 製作每一頁前，先讀該頁現有的左下標籤文字
- 看該頁大標題判斷正確的章節分類
- 不一致時**直接幫使用者改成正確的標籤**，不需要先問；改完跟使用者報告一下「順便把左下標籤從 X 改成 Y」即可

### 2. 不要覆蓋使用者已編輯過的內容

當使用者在一頁完成後做了編輯（改文字、改列高欄寬、改顏色、刪掉欄位、新增列等），之後又請我改同一頁，**絕對不可以動到他已經編輯過的部分**。

**判別使用者的編輯：**
- 對比「我上次產出的內容」與「目前簡報的實際狀態」 → 不同的部分就是使用者改過的
- 重新 `gws slides presentations get` 取得當前狀態
- 對比表格的 rows × cols 數、cell 內容、column widths、row heights
- 若結構變了（例如我做的是 7×4 但現在是 6×4），代表使用者刪了列或欄、合併過、改過結構

**安全策略：**
- 收到「再改一下這頁」的要求時，先重新讀取該頁的當前狀態（不要憑記憶）
- 只用最小變動原則：能 `insertText` / `updateTextStyle` 解決就不要 `deleteObject + createTable`
- 任何需要重建整個元素的動作前，先告知使用者「我會重建這個 X，這會清掉你的 Y 編輯，OK 嗎？」
- 修改某 cell 文字時，只動該 cell；不要順手「更新一下整個表格的樣式」
- 列高、欄寬、邊框、cell 背景色 → 除非使用者明確要求調整，否則一律不動

**檢查清單（每次改既有頁前跑過）：**
- [ ] 已重新 fetch 該頁當前狀態？
- [ ] 已比對結構與我上次產出的差異？
- [ ] 我即將動的範圍只限定在使用者要求的部分？
- [ ] 沒有順手覆寫 column widths / row heights / borders？

---

## 讀取簡報

### 取得完整簡報（含所有 slides）
```bash
gws slides presentations get \
  --params '{"presentationId": "PRES_ID"}'
```

### 解析 slides 與文字內容（Python）
```python
import subprocess, json

result = subprocess.run(
    ['gws', 'slides', 'presentations', 'get',
     '--params', json.dumps({"presentationId": PRES_ID})],
    capture_output=True, text=True
)
raw = result.stdout
lines = raw.split('\n')
j = next(i for i,l in enumerate(lines) if l.strip().startswith('{'))
data = json.loads('\n'.join(lines[j:]))

for i, slide in enumerate(data['slides']):
    texts = []
    for elem in slide.get('pageElements', []):
        for run in elem.get('shape', {}).get('text', {}).get('textElements', []):
            c = run.get('textRun', {}).get('content', '').strip()
            if c: texts.append(c)
    print(f"Slide {i+1} [{slide['objectId']}]: {' | '.join(texts[:5])}")
```

### 取得單頁縮圖 URL
```bash
gws slides presentations pages getThumbnail \
  --params '{"presentationId": "PRES_ID", "pageObjectId": "SLIDE_OBJ_ID"}'
```

---

## Drive 操作（找簡報、複製、重命名）

### 搜尋簡報
```python
subprocess.run([
    'gws', 'drive', 'files', 'list',
    '--params', json.dumps({
        "q": f'name contains "{keyword}" and mimeType="application/vnd.google-apps.presentation" and trashed=false',
        "fields": "files(id,name,parents)",
        "supportsAllDrives": "true",
        "includeItemsFromAllDrives": "true"
    })
], capture_output=True, text=True)
```

### 複製簡報到同一資料夾
```python
subprocess.run([
    'gws', 'drive', 'files', 'copy',
    '--params', json.dumps({"fileId": SRC_ID, "supportsAllDrives": "true"}),
    '--json', json.dumps({"name": NEW_NAME, "parents": [PARENT_FOLDER_ID]})
], capture_output=True, text=True)
```

### 重命名
```python
subprocess.run([
    'gws', 'drive', 'files', 'update',
    '--params', json.dumps({"fileId": FILE_ID, "supportsAllDrives": "true"}),
    '--json', json.dumps({"name": NEW_NAME})
])
```

---

## batchUpdate 常用 requests

### 刪除投影片
```python
{"deleteObject": {"objectId": SLIDE_OBJ_ID}}
```

### 新增投影片（空白）
```python
{
    "createSlide": {
        "insertionIndex": INDEX,   # 0 = 第一頁；省略 = 最後
        "slideLayoutReference": {"predefinedLayout": "BLANK"}
    }
}
```

### 修改投影片背景色
```python
{
    "updatePageProperties": {
        "objectId": SLIDE_OBJ_ID,
        "pageProperties": {
            "pageBackgroundFill": {
                "solidFill": {
                    "color": {"rgbColor": {"red": 0.102, "green": 0.102, "blue": 0.102}}
                }
            }
        },
        "fields": "pageBackgroundFill"
    }
}
```

> 顏色換算：`#1A1A1A` → `red=0.102, green=0.102, blue=0.102`（除以 255）

### 新增文字框
```python
# Step 1: createShape
{
    "createShape": {
        "objectId": "my_textbox_id",   # 自訂 ID，全簡報唯一
        "shapeType": "TEXT_BOX",
        "elementProperties": {
            "pageObjectId": SLIDE_OBJ_ID,
            "size": {
                "width":  {"magnitude": WIDTH_PT,  "unit": "PT"},
                "height": {"magnitude": HEIGHT_PT, "unit": "PT"}
            },
            "transform": {
                "scaleX": 1, "scaleY": 1,
                "translateX": X_PT, "translateY": Y_PT,
                "unit": "PT"
            }
        }
    }
}

# Step 2: insertText（在同一個 batchUpdate 裡）
{
    "insertText": {
        "objectId": "my_textbox_id",
        "insertionIndex": 0,
        "text": "文字內容"
    }
}

# Step 3: updateTextStyle
{
    "updateTextStyle": {
        "objectId": "my_textbox_id",
        "style": {
            "fontFamily": "Space Grotesk",   # 或 "Noto Sans TC"
            "fontSize": {"magnitude": 18, "unit": "PT"},
            "bold": True,
            "foregroundColor": {
                "opaqueColor": {"rgbColor": {"red": 1, "green": 1, "blue": 1}}
            }
        },
        "textRange": {"type": "ALL"},
        "fields": "fontFamily,fontSize,bold,foregroundColor"
    }
}
```

### 設定 autoFit（文字框隨內容縮放）
```python
# autofit 是 read-only，用 updateShapeProperties 設 contentAlignment 即可
{
    "updateShapeProperties": {
        "objectId": "my_textbox_id",
        "shapeProperties": {
            "contentAlignment": "TOP"   # TOP / MIDDLE / BOTTOM
        },
        "fields": "contentAlignment"
    }
}
```

> `autofit` 欄位在 API 是 read-only，無法透過 batchUpdate 設定，忽略即可。

### 插入圖片（從 Drive 或公開 URL）
```python
{
    "createImage": {
        "objectId": "my_image_id",
        "url": "https://drive.google.com/uc?id=FILE_ID",   # Drive 圖片用此格式
        "elementProperties": {
            "pageObjectId": SLIDE_OBJ_ID,
            "size": {
                "width":  {"magnitude": W_PT, "unit": "PT"},
                "height": {"magnitude": H_PT, "unit": "PT"}
            },
            "transform": {
                "scaleX": 1, "scaleY": 1,
                "translateX": X_PT, "translateY": Y_PT,
                "unit": "PT"
            }
        }
    }
}
```

### 刪除文字再重寫（避免殘留空行）
```python
# 先刪除原有文字
{"deleteText": {"objectId": OBJ_ID, "textRange": {"type": "ALL"}}}
# 再插入新文字
{"insertText": {"objectId": OBJ_ID, "insertionIndex": 0, "text": "新內容"}}
```

---

## 段落格式

### 設定行距與段落間距
```python
{
    "updateParagraphStyle": {
        "objectId": OBJ_ID,
        "style": {
            "lineSpacing": 115,              # 1.15 倍行距 = 115
            "spaceAbove": {"magnitude": 0, "unit": "PT"},
            "spaceBelow": {"magnitude": 4, "unit": "PT"}
        },
        "textRange": {"type": "ALL"},
        "fields": "lineSpacing,spaceAbove,spaceBelow"
    }
}
```

---

## 完整 batchUpdate 範例（Python）

```python
import subprocess, json

PRES_ID = "your_presentation_id"

requests = [
    # 1. 刪除第 3 張 slide
    {"deleteObject": {"objectId": "slide_obj_id_3"}},

    # 2. 新增文字框
    {
        "createShape": {
            "objectId": "new_title",
            "shapeType": "TEXT_BOX",
            "elementProperties": {
                "pageObjectId": "target_slide_id",
                "size": {
                    "width": {"magnitude": 500, "unit": "PT"},
                    "height": {"magnitude": 40, "unit": "PT"}
                },
                "transform": {
                    "scaleX": 1, "scaleY": 1,
                    "translateX": 22.7, "translateY": 22.7,
                    "unit": "PT"
                }
            }
        }
    },
    {
        "insertText": {
            "objectId": "new_title",
            "insertionIndex": 0,
            "text": "標題文字\nTitle Text"
        }
    },
    {
        "updateTextStyle": {
            "objectId": "new_title",
            "style": {
                "fontFamily": "Noto Sans TC",
                "fontSize": {"magnitude": 18, "unit": "PT"},
                "bold": True,
                "foregroundColor": {
                    "opaqueColor": {"rgbColor": {"red": 1, "green": 1, "blue": 1}}
                }
            },
            "textRange": {"type": "ALL"},
            "fields": "fontFamily,fontSize,bold,foregroundColor"
        }
    }
]

result = subprocess.run(
    ['gws', 'slides', 'presentations', 'batchUpdate',
     '--params', json.dumps({"presentationId": PRES_ID}),
     '--json', json.dumps({"requests": requests})],
    capture_output=True, text=True, check=True
)
print(json.loads(result.stdout))
```
