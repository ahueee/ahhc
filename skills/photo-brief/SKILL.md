---
name: photo-brief
description: 當使用者說「製作 [project_name] 的作品拍攝簡報」時立即觸發。從既有專案簡報副本中刪除非視覺內容，保留攝影團隊看懂作品所需的最少頁面，並在結尾加入影像拍攝頁。
---

# 作品拍攝簡報製作

## 觸發條件
使用者說：**「製作 [project_name] 的作品拍攝簡報」** 或同等意思的句子。

---

## 執行步驟

### Step 1｜找到原始簡報

用 gws Drive 搜尋：

```bash
gws drive files list --params '{
  "q": "name contains \"PROJECT_NAME\" and mimeType=\"application/vnd.google-apps.presentation\" and trashed=false",
  "fields": "files(id,name,parents)",
  "supportsAllDrives": "true",
  "includeItemsFromAllDrives": "true"
}'
```

- 若有多個結果，選名稱最符合且**無 `_作品拍攝`** 後綴的那一個
- 記下 `fileId` 與 `parents[0]`（資料夾 ID）

---

### Step 2｜副本並重新命名

```bash
# 複製到同一個資料夾
gws drive files copy \
  --params '{"fileId": "ORIGINAL_ID", "supportsAllDrives": "true"}' \
  --json '{"name": "ORIGINAL_NAME_作品拍攝", "parents": ["PARENT_FOLDER_ID"]}'
```

記下新的 `id`（即 `NEW_PRES_ID`）。

---

### Step 3｜刪除不需要的投影片

#### 篩選原則

**保留（能讓攝影師「看見」作品的頁面）：**
| 類型 | 判斷依據 |
|------|---------|
| 封面 | 第 1 張，永遠保留 |
| 場地 / 作品概覽 | 有地點、形式、作品名稱的簡短說明頁（通常 1–2 頁） |
| 創作概念短版 | 有圖或極短文字（≤5 行）的概念頁，不是長篇論述 |
| 基地 / 現場照片 | 有實拍照片的頁面 |
| 章節分隔頁 | 有章節編號 + 大標的頁（例：`01 VISUAL`、`02 INTERACTION`） |
| **視覺模擬圖（全部）** | 標題含「模擬」、「Simulation」、「Visual」且主體是圖的頁面 |
| 互動流程概覽 | 有流程圖 / 步驟圖的頁（只留概覽，不留文字腳本） |

**刪除（攝影師不需要的）：**
| 類型 | 判斷依據 |
|------|---------|
| 長篇文字概念說明 | 整頁以大段落文字為主、無視覺圖示 |
| 技術規格 | 含 LED、訊號、電源、走線、機房等字眼 |
| 硬體架構 / 設備細節 | 電路圖、接線圖、尺寸測量 |
| 施工安裝流程 | 高空車、預組裝、施工路徑 |
| 時程甘特圖 | 含日期區間、里程碑的時程頁 |
| 互動腳本細節 | 逐步腳本（Script）、狀態機說明 |
| 魚種 / 元件圖鑑 | 個別物件細部說明（除非整頁是視覺設計） |
| 尺寸補充頁 | 純測量數字、無設計意圖的規格頁 |

**口訣：這頁有沒有讓人「看見」作品的圖？沒有就刪。**

#### 刪除投影片的方式

先取得所有 slide objectIds：

```bash
gws slides presentations get --params '{"presentationId": "NEW_PRES_ID"}' \
  2>/dev/null | python3 -c "
import json, sys
raw = sys.stdin.read()
lines = raw.split('\n')
j = next(i for i,l in enumerate(lines) if l.strip().startswith('{'))
data = json.loads('\n'.join(lines[j:]))
for i, s in enumerate(data['slides']):
    texts = []
    for e in s.get('pageElements', []):
        for r in e.get('shape', {}).get('text', {}).get('textElements', []):
            c = r.get('textRun', {}).get('content', '').strip()
            if c: texts.append(c)
    print(f'{i+1}\t{s[\"objectId\"]}\t{\" | \".join(texts[:4])[:80]}')
"
```

分析每頁內容後，對要刪除的 slide 執行 batchUpdate。**使用 Python subprocess 執行，避免 shell 展開破壞 JSON：**

```python
import subprocess, json

delete_requests = [
    {"deleteObject": {"objectId": sid}}
    for sid in SLIDES_TO_DELETE  # list of objectIds
]

subprocess.run([
    'gws', 'slides', 'presentations', 'batchUpdate',
    '--params', json.dumps({"presentationId": NEW_PRES_ID}),
    '--json', json.dumps({"requests": delete_requests})
])
```

---

### Step 4｜複製影像拍攝頁到簡報結尾

影像拍攝頁來源：
- **來源簡報 ID**：`1CcEw7oStGFPBfLNZ4yzBYV9407lHRLVMXbVO8FtCURM`
- **目標 slide objectId**：`g3e32990d847_1_132`（最後一頁）

Google Slides API 不支援跨簡報直接複製 slide，改用以下流程：

1. **取得來源 slide 的完整 pageElements**
2. **在目標簡報新增一頁空白 slide**
3. **逐一重建 pageElements**（文字框、圖片、形狀等）
4. **套用原始背景色與佈局**

```python
import subprocess, json

# 1. 取得來源 slide
result = subprocess.run(
    ['gws', 'slides', 'presentations', 'get',
     '--params', json.dumps({"presentationId": "1CcEw7oStGFPBfLNZ4yzBYV9407lHRLVMXbVO8FtCURM"})],
    capture_output=True, text=True
)
raw = result.stdout
lines = raw.split('\n')
j = next(i for i,l in enumerate(lines) if l.strip().startswith('{'))
src_pres = json.loads('\n'.join(lines[j:]))

# 找到 objectId = g3e32990d847_1_132 的 slide
src_slide = next(s for s in src_pres['slides'] if s['objectId'] == 'g3e32990d847_1_132')

# 2. 在目標簡報新增 slide
add_result = subprocess.run(
    ['gws', 'slides', 'presentations', 'batchUpdate',
     '--params', json.dumps({"presentationId": NEW_PRES_ID}),
     '--json', json.dumps({"requests": [{"createSlide": {"insertionIndex": 9999}}]})],
    capture_output=True, text=True
)
new_slide_id = json.loads(add_result.stdout)['replies'][0]['createSlide']['objectId']

# 3. 依 src_slide['pageElements'] 重建元素（文字、圖片、形狀）
# 參考設計規範（見 memory: pptx_design_spec.md）重建各元素
```

> **注意**：重建時套用設計規範：黑底 `#1A1A1A`、Space Grotesk（英文）/ Noto Sans TC（中文）、重點黃 `#F7C94F`。

---

## 設計規範提醒

本 skill 操作的是**既有簡報副本**，設計規範已繼承。若需新增或修改元素，參照 memory 中的 **Peppercorns 簡報設計規格**：
- 背景：`#1A1A1A`
- 重點色：`#F7C94F`
- 英文字體：Space Grotesk
- 中文字體：Noto Sans TC
- 所有 gws batchUpdate 透過 `subprocess.run(['gws', ..., '--json', json.dumps(body)])` 執行

---

## 完成後回報

```
✅ 已完成「PROJECT_NAME_作品拍攝」簡報
📄 保留頁數：X 頁（from 原始 Y 頁）
🔗 https://docs.google.com/presentation/d/NEW_PRES_ID/edit
```
