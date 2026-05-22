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

當內容有「分類 × 日期」或「分類 × 分類」結構時，用手工格線 + 文字框模擬表格（勿用 Google Slides API 的 createTable，樣式難控制）。

### 設計原則
- **欄** = 類別（電力｜點光源｜軟體）
- **列** = 日期或階段（6/1-4｜6/8）
- **欄標題**：黃色 10pt Bold，Noto Sans TC（中文）+ Space Grotesk（英文副標 dim）
- **列標題**：黃底黑字 pill，10pt Bold，居中
- **表格內文**：灰色 8pt Bold，Noto Sans TC
- **格線**：`#383838`（LINE_C），寬 0.75pt RECTANGLE，outline NOT_RENDERED

### 格線 helper
```python
LINE_C = {'red': 0.22, 'green': 0.22, 'blue': 0.22}

def hline(oid, x, y, w, sid):
    reqs = []
    reqs.append({'createShape': {'objectId': oid, 'shapeType': 'RECTANGLE',
        'elementProperties': ep(x, y, w, 0.75, sid)}})
    reqs.append({'updateShapeProperties': {'objectId': oid,
        'shapeProperties': {
            'shapeBackgroundFill': {'solidFill': {'color': {'rgbColor': LINE_C}}},
            'outline': {'propertyState': 'NOT_RENDERED'}},
        'fields': 'shapeBackgroundFill,outline'}})
    return reqs

def vline(oid, x, y, h, sid):
    reqs = []
    reqs.append({'createShape': {'objectId': oid, 'shapeType': 'RECTANGLE',
        'elementProperties': ep(x, y, 0.75, h, sid)}})
    reqs.append({'updateShapeProperties': {'objectId': oid,
        'shapeProperties': {
            'shapeBackgroundFill': {'solidFill': {'color': {'rgbColor': LINE_C}}},
            'outline': {'propertyState': 'NOT_RENDERED'}},
        'fields': 'shapeBackgroundFill,outline'}})
    return reqs
```

### 欄標題 helper
```python
def cat_header(oid, x, y, w, cn, en, sid):
    """黃色欄標題：中文 10pt bold yellow + 英文 7pt dim"""
    full = f'{cn}  {en}'
    reqs = []
    reqs.append({'createShape': {'objectId': oid, 'shapeType': 'TEXT_BOX',
        'elementProperties': ep(x, y, w, 20, sid)}})
    reqs.append({'insertText': {'objectId': oid, 'insertionIndex': 0, 'text': full}})
    reqs.append({'updateTextStyle': {'objectId': oid,
        'style': {'fontFamily': 'Noto Sans TC', 'fontSize': pt(10), 'bold': True,
                  'foregroundColor': rgb(YELLOW)},
        'textRange': {'type': 'FIXED_RANGE', 'startIndex': 0, 'endIndex': len(cn)},
        'fields': 'fontFamily,fontSize,bold,foregroundColor'}})
    reqs.append({'updateTextStyle': {'objectId': oid,
        'style': {'fontFamily': 'Space Grotesk', 'fontSize': pt(7), 'bold': False,
                  'foregroundColor': rgb(DIM)},
        'textRange': {'type': 'FIXED_RANGE', 'startIndex': len(cn), 'endIndex': len(full)},
        'fields': 'fontFamily,fontSize,bold,foregroundColor'}})
    reqs.append({'updateShapeProperties': {'objectId': oid,
        'shapeProperties': {'shapeBackgroundFill': {'propertyState': 'NOT_RENDERED'},
                            'contentAlignment': 'MIDDLE'},
        'fields': 'shapeBackgroundFill,contentAlignment'}})
    reqs.append({'updateParagraphStyle': {'objectId': oid,
        'style': {'lineSpacing': 100, 'alignment': 'START'},
        'textRange': {'type': 'ALL'}, 'fields': 'lineSpacing,alignment'}})
    return reqs
```

### 列標題 pill helper（黃底黑字）
```python
def date_pill(oid, x, y, w, line1, line2, sid):
    text = f'{line1}\n{line2}' if line2 else line1
    reqs = []
    reqs.append({'createShape': {'objectId': oid, 'shapeType': 'TEXT_BOX',
        'elementProperties': ep(x, y, w, 32 if line2 else 18, sid)}})
    reqs.append({'insertText': {'objectId': oid, 'insertionIndex': 0, 'text': text}})
    reqs.append({'updateTextStyle': {'objectId': oid,
        'style': {'fontFamily': 'Noto Sans TC', 'fontSize': pt(10), 'bold': True,
                  'foregroundColor': rgb(DARK)},   # DARK = #1A1A1A
        'textRange': {'type': 'ALL'}, 'fields': 'fontFamily,fontSize,bold,foregroundColor'}})
    reqs.append({'updateShapeProperties': {'objectId': oid,
        'shapeProperties': {
            'shapeBackgroundFill': {'solidFill': {'color': {'rgbColor': YELLOW}}},
            'contentAlignment': 'MIDDLE'},
        'fields': 'shapeBackgroundFill,contentAlignment'}})
    reqs.append({'updateParagraphStyle': {'objectId': oid,
        'style': {'lineSpacing': 115, 'alignment': 'CENTER'},
        'textRange': {'type': 'ALL'}, 'fields': 'lineSpacing,alignment'}})
    return reqs
```

### 表格內文 helper（8pt Bold 灰）
```python
def task_box(oid, x, y, w, h, text, sid):
    reqs = []
    reqs.append({'createShape': {'objectId': oid, 'shapeType': 'TEXT_BOX',
        'elementProperties': ep(x, y, w, h, sid)}})
    reqs.append({'insertText': {'objectId': oid, 'insertionIndex': 0, 'text': text}})
    reqs.append({'updateTextStyle': {'objectId': oid,
        'style': {'fontFamily': 'Noto Sans TC', 'fontSize': pt(8), 'bold': True,
                  'foregroundColor': rgb(GRAY)},
        'textRange': {'type': 'ALL'}, 'fields': 'fontFamily,fontSize,bold,foregroundColor'}})
    reqs.append({'updateParagraphStyle': {'objectId': oid,
        'style': {'lineSpacing': 145, 'spaceAbove': pt(0), 'spaceBelow': pt(4),
                  'alignment': 'START'},
        'textRange': {'type': 'ALL'}, 'fields': 'lineSpacing,spaceAbove,spaceBelow,alignment'}})
    reqs.append({'updateShapeProperties': {'objectId': oid,
        'shapeProperties': {'shapeBackgroundFill': {'propertyState': 'NOT_RENDERED'},
                            'contentAlignment': 'TOP'},
        'fields': 'shapeBackgroundFill,contentAlignment'}})
    return reqs
```

### 透明背景（必要時）
```python
# 讓文字框背景透明（不遮住底層元素）
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
