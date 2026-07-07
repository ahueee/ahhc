---
name: peppercorns-pptx
description: 用 PowerPoint（.pptx）製作或編輯 Peppercorns 簡報時的完整參考，包含 Peppercorns 設計規範（配色、字體、版面）、字體安裝與跑版排除、以及 pptx 產出與 QA 的實作方法。凡涉及 .pptx 建立/編輯/從 Google Slides 匯出成 pptx／檢查跑版的任務都應讀此 skill。線上 Google Slides 版請改用 gws-slides skill。
---

# Peppercorns PowerPoint（.pptx）製作參考

> 這是 [[gws-slides]] 的 PowerPoint 對應版本。設計規範（配色/字體/版面）與 gws-slides 完全一致，
> 差異在於**產出工具**（python-pptx / Google Slides 匯出）與 **PowerPoint 特有的字體跑版問題**。

---

## ⚠️ 最重要：字體跑版的真正原因（先看這段）

Peppercorns 簡報指定字體：**英文 `Space Grotesk`、中文 `Noto Sans TC`、數字 `Space Mono`**。

**Mac 版 PowerPoint 不會使用 pptx 內嵌字體**（只有 Windows 版 PowerPoint 會用）。
所以即使 pptx 內嵌了字體、XML 也寫對了字體名稱，只要**開啟的那台 Mac 沒有安裝這些字體，PowerPoint 就會擅自替換**，看起來就是「字體全錯 / 跑版」。

**判斷順序（遇到「字體錯了」時照做）：**
1. 先確認 pptx XML 內字體名稱是否正確 → 通常是對的，不要急著改檔案。
2. 確認開啟的電腦有沒有裝這三套字體 → **多半是沒裝**，這才是主因。
3. 裝字體 → **完全結束 PowerPoint（Cmd+Q，不是關視窗）再重開** → 就正確了。

```python
# 檢查 pptx 實際用到哪些字體（診斷第一步）
import zipfile, re
from collections import Counter
z = zipfile.ZipFile("deck.pptx"); c = Counter()
for n in z.namelist():
    if re.match(r'ppt/slides/slide\d+\.xml$', n):
        for f in re.findall(r'typeface="([^"]*)"', z.read(n).decode('utf-8','ignore')):
            c[f] += 1
print(c.most_common())  # 應以 Space Grotesk / Noto Sans TC 為大宗
```

### 安裝規格字體到本機（免密碼，裝到使用者字體夾）

字體夾：`~/Library/Fonts`（Finder 隱藏，用 `Cmd+Shift+G` 貼 `~/Library/Fonts` 進入）。

```bash
cd ~/Library/Fonts
curl -sL -o NotoSansTC.ttf   "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"
curl -sL -o SpaceGrotesk.ttf "https://github.com/google/fonts/raw/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf"
curl -sL -o SpaceMono-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Regular.ttf"
curl -sL -o SpaceMono-Bold.ttf    "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Bold.ttf"
curl -sL -o SpaceMono-Italic.ttf  "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Italic.ttf"
```
> `NotoSansJP`（日文）≠ `Noto Sans TC`（繁中）；有 JP 不代表有 TC，中文會用到錯的日文字形。
> 裝完務必 **Cmd+Q 重開 PowerPoint** 才會生效。

### 給 Windows 收件者：內嵌字體
若對方用 Windows PowerPoint，可內嵌字體讓對方免安裝：
PowerPoint →「檔案 → 選項 → 儲存 → 在檔案內嵌字型」。（從 Google Slides 匯出的 pptx 通常已內嵌，Windows 端可直接吃。）

---

## Peppercorns 設計規範

### 投影片規格
- **尺寸**：720 × 405 pt（16:9）= **10 × 5.625 in**。
  ⚠️ 不是 PowerPoint 預設的 13.333 × 7.5 in。用 python-pptx 建新檔要手動設：
  ```python
  from pptx.util import Emu
  prs.slide_width  = Emu(9144000)   # 720pt
  prs.slide_height = Emu(5143500)   # 405pt
  ```
- **四邊 margin**：22.7 pt

### 配色

| 角色 | 色碼 | RGB | 用途 |
|------|------|-----|------|
| 背景主色 | `#1A1A1A` | 26,26,26 | 絕大多數投影片背景 |
| 重點黃 | `#F7C94F` | 247,201,79 | 章節數字、標籤色塊、強調文字 |
| 主文白 | `#FFFFFF` | 255,255,255 | 標題、大標 |
| 內文灰 | `#B4B4B4` | 180,180,180 | 內文、段落文字 |
| 備註灰 | `#888888` | 136,136,136 | 備註、圖說小字 |
| 章節標籤灰 | `#CCCCCC` | 204,204,204 | 左下角章節標籤 |
| 深色文字（黃底用）| `#1A1A1A` | 26,26,26 | 黃色色塊上的文字 |

### 字體

| 語言 | 字體 | 用途 |
|------|------|------|
| 英文 | `Space Grotesk` | 標題、章節標籤、所有英文 |
| 中文 | `Noto Sans TC` | 中文內文、副標題 |
| 數字/等寬 | `Space Mono` | 時間軸、數字標記 |

### 文字層級

| 層級 | 字級 | 字重 | 顏色 | 用途 |
|------|------|------|------|------|
| 大標題 | 60pt | Bold | 白 / 黃 | 封面、章節頁主標 |
| 次標題 | 48pt | Bold | 白 / 黃 | 重要概念大字 |
| 頁面標題 | 24pt | Bold | 白 / 黃 | 章節頁副標 |
| 內頁標題 | 18pt | Bold | 白 / 黃 | 內頁左上頁面名稱 |
| 段落標題 | 10pt | Bold | 白 / 黃 | 內文區段標題 |
| 表格欄標題 | 10pt | Bold | 黃 | 表格 header |
| 表格內文 | 8pt | Bold | 灰 | 表格 cell |
| 內文 | 8pt | Regular | 淺灰 | 一般說明 |
| 備註 | 6pt | Regular | 淺灰 | 圖說、技術細節 |

行距：短內文 1.15 / 長內文 1.5；段落間距 spaceBelow 4pt。

### 版面結構

**章節頁（Section Header）**：`黃色兩位數字（60pt bold）` + `英文章節名（60pt bold 白）` + `中文副標（24pt bold 白）`。
英文文字框寬度要延伸到 slide 右邊緣，避免長字（INTERACTION、BACKGROUND）在 60pt 下折行。

**內容頁標準元素位置（pt）**

| 元素 | x | y | 規格 |
|------|---|---|------|
| 標題文字框 | 22.7 | 22.7 | 第一行中文(Noto Sans TC 18pt bold 白)換行第二行英文(Space Grotesk 18pt bold 白) |
| 章節標籤（左下）| 22.7 | 386.5 | 6pt `#CCCCCC`，格式 `章節中文 CHAPTER_EN` |
| Logo（右下）| 587.6 | 389.0 | Peppercorns logo |
| 頁碼（右下）| 697.3 | 386.5 | 6pt 白，右對齊 |
| 內容區域 | 22.7 | 80 | 寬 651.3 高 300 |

**核心紀律**：左下角章節標籤必須符合該頁大標題主題（常從前頁複製後忘了改）。
編輯使用者已改過的頁面時，最小變動、不要覆寫使用者的編輯。

---

## 產出方式

### A. 從既有 Peppercorns 簡報產出（首選）
Peppercorns 的樣式都在 Google Slides 模板裡，**最保真的做法是先在 Google Slides 完成，再匯出成 pptx**（樣式、字體名稱、內嵌字體都會帶著）。用 [[gws-slides]] 操作 Google Slides，然後：

**匯出成 pptx（大檔請用這個，避開 10MB API 限制）**
Drive API 的 `files.export` 有 **10MB 上限**，圖多的簡報會失敗（`exportSizeLimitExceeded`）。
改用 `docs.google.com` 匯出端點，帶 OAuth token：
```python
import subprocess, json, urllib.request, urllib.parse, os
creds=json.loads(subprocess.run(['gws','auth','export','--unmasked'],capture_output=True,text=True).stdout)
data=urllib.parse.urlencode({'client_id':creds['client_id'],'client_secret':creds['client_secret'],
  'refresh_token':creds['refresh_token'],'grant_type':'refresh_token'}).encode()
tok=json.loads(urllib.request.urlopen(urllib.request.Request('https://oauth2.googleapis.com/token',data=data)).read())['access_token']
FID='<google_slides_id>'
url=f'https://docs.google.com/presentation/d/{FID}/export/pptx'
req=urllib.request.Request(url, headers={'Authorization':f'Bearer {tok}'})
with urllib.request.urlopen(req) as r, open('out.pptx','wb') as f: f.write(r.read())
print('size', os.path.getsize('out.pptx'))
```

### B. 從零或編輯 .pptx
用 anthropic-skills 的 `pptx` skill（python-pptx / unpack-edit-pack）。建立時務必先把頁面尺寸設成 720×405pt，並在每個 run 指定字體：
```python
run.font.name = "Noto Sans TC"   # 中文；英文/數字用 "Space Grotesk" / "Space Mono"
run.font.size = Pt(18); run.font.bold = True
run.font.color.rgb = RGBColor(0xFF,0xFF,0xFF)
```

---

## QA：檢查跑版（本機工具鏈）

本機沒有 `soffice`/`pdftoppm` 在 PATH 上，用以下已驗證可行的組合：

- **LibreOffice**（手動安裝在）：`~/Applications/LibreOffice.app/Contents/MacOS/soffice`
  （brew cask 在這台機器無法自動搬到 /Applications；DMG 在 brew cache，掛載後手動 cp 到 `~/Applications` 即可，記得 `xattr -dr com.apple.quarantine`。）
- **poppler / pdftoppm 在這台機器 dylib 連結壞掉，不要用**。改用 **PyMuPDF** 把 PDF 轉圖。
  `python3 -m pip install --user --break-system-packages PyMuPDF`

```bash
SOFFICE=~/Applications/LibreOffice.app/Contents/MacOS/soffice
pkill -f soffice.bin 2>/dev/null; sleep 1      # 讓它重讀新裝的字體
"$SOFFICE" --headless --convert-to pdf --outdir . deck.pptx
```
```python
import fitz  # PyMuPDF
doc=fitz.open("deck.pdf"); mat=fitz.Matrix(150/72,150/72)
for i,p in enumerate(doc): p.get_pixmap(matrix=mat).save(f"slide-{i+1:02d}.jpg")
```
> LibreOffice 讀 `~/Library/Fonts`。**先裝字體再渲染**，否則 LibreOffice 也會替換，你就分不清是設計問題還是缺字體。
> LibreOffice 的替換結果 ≈「對方電腦沒裝字體」的最壞情況，可拿來驗證跑版。

**逐頁看圖檢查**：字體是否正確、文字是否溢出/折行/貼邊、標籤與大標主題是否一致、頁尾 logo/頁碼位置。

---

## 常見既有內容瑕疵（從 Google Slides 帶過來的，記得順手檢查）
- 內文殘留 markdown 粗體符號 `**...**`（Slides 不解析，會顯示字面星號）。
- 英文標籤拼字（曾見 `Introducion` 應為 `Introduction`）。
- 深色說明文字壓在亮部影像上 → 對比不足；改白字或加深底。
