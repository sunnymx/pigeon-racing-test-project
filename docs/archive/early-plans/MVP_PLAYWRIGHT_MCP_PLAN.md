# Playwright MCP + Claude Code MVP 測試部署計畫

> **專案類型**：技術驗證 MVP
> **測試目標**：https://skyracing.com.cn/
> **執行環境**：Claude Code CLI + Playwright MCP
> **預計時間**：1.5-2 小時
> **建立日期**：2025-11-14
> **最後更新**：2025-11-14（已根據官方文檔修正配置命令）

---

## ⚠️ 重要更新說明

**v1.1 更新（2025-11-14）**：
- ✅ 修正配置命令格式（移除引號，根據 Microsoft 官方文檔）
- ✅ 添加 Node.js 版本要求檢查（需要 v18+）
- ✅ 提供兩種配置方式（npx 或全局安裝）
- ✅ 更新所有相關章節的配置命令

**關鍵修正**：
```bash
# ❌ 舊命令（錯誤）
claude mcp add playwright npx '@playwright/mcp@latest' --scope project

# ✅ 新命令（正確）
claude mcp add playwright npx @playwright/mcp@latest --scope project
```

---

## 📌 目錄

1. [Claude Desktop vs Claude Code 差異](#claude-desktop-vs-claude-code-差異)
2. [專案概述](#專案概述)
3. [分階段部署計畫](#分階段部署計畫)
4. [Claude Code 使用技巧](#claude-code-使用技巧)
5. [預期成果](#預期成果)
6. [執行檢查清單](#執行檢查清單)

---

## 🔑 Claude Desktop vs Claude Code 差異

### 關鍵差異對比

| 特性 | Claude Desktop | Claude Code (CLI) |
|------|---------------|------------------|
| **類型** | 桌面應用程式 | 命令列工具 |
| **配置位置** | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.claude.json` |
| **配置範圍** | 全局（所有對話） | 按專案目錄 |
| **MCP 添加方式** | 手動編輯 JSON 文件 | `claude mcp add` 命令 |
| **使用場景** | 日常對話、個人使用 | 開發工作流、專案整合 |
| **瀏覽器模式** | Headless（背景執行） | **Headed（可見視窗）** ✨ |
| **配置共享** | 個人配置 | 可提交到 Git（team 共享） |

### 重要優勢

**Claude Code 的 Playwright MCP 優勢**：
- ✅ **可見瀏覽器視窗**：可以看到測試過程
- ✅ **專案級配置**：`.mcp.json` 可提交到版本控制
- ✅ **團隊協作**：配置可與團隊共享
- ✅ **開發整合**：與代碼工作流無縫整合

---

## 📋 專案概述

### MVP 測試目標

**主要目的**：
1. ✅ 驗證 MCP 能否提取數據
2. ✅ 了解數據結構
3. ✅ 建立後續測試基礎
4. ✅ 評估開發成本

### 測試範圍（中等）

測試 **5 個核心功能**：
1. 首頁探索與頁面載入
2. 賽事/鴿子列表數據提取
3. 軌跡數據提取與分析
4. 飛行統計數據驗證
5. 地圖渲染檢查

---

## 🎯 分階段部署計畫

### 階段 1：環境設置（20 分鐘）

#### 步驟 1.1：確認當前位置

```bash
# 確認在專案目錄
pwd
# 應輸出: /Users/tf/Downloads/PIGEON_RACING_TEST_PROJECT
```

#### 步驟 1.2：配置 Playwright MCP

**⚠️ 重要：Node.js 版本要求**
```bash
# 檢查 Node.js 版本（需要 18 或更高）
node --version
# 應輸出：v18.x.x 或更高
```

**配置方式（選擇其一）**：

**方式 A：使用 npx（推薦快速測試）** ⭐
```bash
# 無需預先安裝，直接配置
claude mcp add playwright npx @playwright/mcp@latest --scope project
```
- ✅ 無需全局安裝套件
- ✅ 自動使用最新版本
- ⚠️ 首次執行需下載（稍慢）

**方式 B：全局安裝（推薦生產環境）**
```bash
# 步驟 1：全局安裝
npm install -g @playwright/mcp

# 步驟 2：配置 MCP（注意：使用 mcp-server-playwright）
claude mcp add playwright mcp-server-playwright --scope project
```
- ✅ 啟動速度快，版本固定
- ✅ 離線可用
- ⚠️ 需要手動更新版本

**配置範圍選項**：
- `--scope local`（預設）：僅當前目錄，配置在 `~/.claude.json`
- `--scope project`（推薦）：專案級，配置在 `.mcp.json`，可提交 Git
- `--scope user`：用戶級，所有專案可用

**MVP 測試推薦**：使用**方式 A** + `--scope project`

#### 步驟 1.3：驗證 MCP 安裝

```bash
# 列出已安裝的 MCP 伺服器
claude mcp list

# 測試 Playwright MCP 連接
claude mcp get playwright
```

**預期輸出**：
```
✓ playwright
  Command: npx @playwright/mcp@latest
  Scope: project
  Status: ✓ Connected
  Tools: 25 available
```

#### 步驟 1.4：創建 MVP 測試目錄結構

```bash
# 創建 MVP 測試目錄
mkdir -p mvp_test/{data_samples,screenshots}
```

**目錄結構**：
```
PIGEON_RACING_TEST_PROJECT/
├── .mcp.json                    # MCP 配置（新增）✨
├── mvp_test/                    # MVP 測試記錄（新增）
│   ├── README.md                # MVP 總覽
│   ├── test_log.md              # 測試執行記錄
│   ├── data_samples/            # 提取的數據範例
│   │   ├── race_list.json
│   │   ├── trajectory_data.json
│   │   └── flight_statistics.json
│   └── screenshots/             # 測試截圖
│       ├── homepage.png
│       └── map_view.png
├── tests/                       # 原有測試代碼
├── DEPLOYMENT_PLAN.md           # 部署方案文檔
├── TUTORIAL_GITHUB_ACTIONS.md   # GitHub Actions 教學
└── MVP_PLAYWRIGHT_MCP_PLAN.md   # 本文檔
```

#### 步驟 1.5：創建初始文檔

**文件清單**：
- `mvp_test/README.md` - MVP 測試總覽
- `mvp_test/test_log.md` - 測試執行記錄模板

---

### 階段 2：互動式測試（60 分鐘）

**使用方式**：在 Claude Code 對話中直接請求測試

#### 🧪 測試 1：首頁探索（10 分鐘）

**對話指令範例**：
```
使用 playwright mcp 打開 https://skyracing.com.cn/
幫我分析頁面結構，找出主要功能區塊
```

**測試檢查點**：
- [ ] 頁面載入時間（應 < 5 秒）
- [ ] 主要 UI 元件可見（導航、表格、地圖）
- [ ] Angular Material 元件正確渲染
- [ ] 是否需要登入？
- [ ] 有哪些可點擊的入口？

**記錄內容**：
```markdown
# 測試 1：首頁探索

## 執行時間
2025-11-14 XX:XX

## 測試結果
- 頁面載入速度：X 秒
- 主要功能入口：
  1. XXX
  2. XXX
- 可測試元素：
  - 按鈕：XXX
  - 連結：XXX
```

---

#### 🧪 測試 2：賽事/鴿子列表（15 分鐘）

**對話指令範例**：
```
找到賽事列表或鴿子列表
提取前 10 筆數據
分析數據結構（欄位名稱、數據類型、格式）
將數據保存為 JSON
```

**測試檢查點**：
- [ ] 列表數據成功提取
- [ ] 數據結構清晰（欄位識別）
- [ ] 分頁功能測試（如果有）
- [ ] 數據完整性（無缺失欄位）

**預期數據格式**：
```json
{
  "race_list": [
    {
      "race_id": "2024-12-0001234",
      "pigeon_name": "XXX",
      "pigeon_id": "XXX",
      "timestamp": "2024-12-01 09:00:00",
      "status": "飛行中",
      "distance": 123.45
    }
  ],
  "total_count": 100,
  "page": 1
}
```

**記錄要點**：
- 可提取的欄位清單
- 數據類型（字串、數字、日期）
- 是否有空值或異常值

---

#### 🧪 測試 3：軌跡數據提取（20 分鐘）

**對話指令範例**：
```
點擊進入某個鴿子的軌跡詳情頁
提取軌跡數據點（經緯度、時間、高度、速度）
分析數據格式和完整性
檢查是否有異常數據點
```

**測試檢查點**：
- [ ] 成功進入軌跡詳情頁
- [ ] 軌跡數據點提取完整
- [ ] 時間序列連續性
- [ ] 坐標合理性驗證
- [ ] 數據點數量統計

**預期數據格式**：
```json
{
  "pigeon_id": "XXX",
  "trajectory": [
    {
      "timestamp": "2024-12-01 09:00:00",
      "latitude": 25.0330,
      "longitude": 121.5654,
      "altitude": 150.5,
      "speed": 1234.56,
      "point_number": 1
    },
    {
      "timestamp": "2024-12-01 09:01:00",
      "latitude": 25.0335,
      "longitude": 121.5660,
      "altitude": 152.3,
      "speed": 1240.12,
      "point_number": 2
    }
  ],
  "total_points": 150
}
```

**關鍵驗證邏輯**：
```python
# 時間序列遞增？
timestamps_increasing = all(
    t1 < t2 for t1, t2 in zip(timestamps[:-1], timestamps[1:])
)

# 坐標範圍合理？（台灣地區）
latitude_valid = all(21 <= lat <= 26 for lat in latitudes)
longitude_valid = all(119 <= lon <= 122 for lon in longitudes)

# 高度合理？
altitude_valid = all(0 <= alt <= 5000 for alt in altitudes)
```

---

#### 🧪 測試 4：飛行統計數據（10 分鐘）

**對話指令範例**：
```
提取飛行統計數據：
- 平均分速、最高分速
- 平均高度、最大高度
- 實際距離、直線距離
- 實際分速、直線分速
```

**重點檢測項目**：
- [ ] 所有統計欄位都能提取
- [ ] 數值單位正確（m/Min, km, m）
- [ ] 數值範圍合理
- [ ] **異常數據檢測**（核心！）

**異常數據範例**（需能檢測到）：
```json
{
  "avg_speed": 1234.56,      // m/Min - 正常
  "max_speed": 1500.23,      // m/Min - 正常
  "actual_distance": 46168.05,  // km - ❌ 異常！應 < 1000
  "actual_speed": 106529.36,    // m/Min - ❌ 異常！應 < 10000
  "straight_distance": 456.78   // km - 正常
}
```

**驗證規則**：
```typescript
// 基於 STANDARD_RULES
const validationRules = {
  avgSpeed: { min: 800, max: 2000 },        // m/Min
  maxSpeed: { min: 1000, max: 2500 },       // m/Min
  avgAltitude: { min: 0, max: 3000 },       // m
  maxAltitude: { min: 0, max: 5000 },       // m
  actualDistance: { min: 1, max: 1000 },    // km ⭐ 重點
  straightDistance: { min: 1, max: 800 },   // km
  actualSpeed: { min: 0, max: 10000 }       // m/Min ⭐ 重點
};
```

---

#### 🧪 測試 5：地圖渲染驗證（5 分鐘）

**對話指令範例**：
```
檢查地圖是否正確渲染
截圖保存到 mvp_test/screenshots/map_view.png
驗證地圖控件是否可用（縮放、3D 切換等）
```

**測試檢查點**：
- [ ] Canvas/SVG 元素存在
- [ ] 地圖容器已載入
- [ ] 地圖縮放控件可見
- [ ] 軌跡線是否顯示（視覺檢查）
- [ ] 截圖成功保存

**技術細節**：
```typescript
// 地圖庫檢測
const mapLibraries = [
  '.leaflet-container',  // Leaflet
  '.mapboxgl-canvas',    // Mapbox
  '.gm-style',           // Google Maps
  'canvas'               // 通用 canvas
];

// 檢查哪個地圖庫被使用
```

---

### 階段 3：數據驗證邏輯測試（20 分鐘）

#### 綜合驗證測試

**對話指令範例**：
```
使用剛才提取的飛行數據，執行以下驗證：

1. 距離驗證
   - 實際距離是否 < 1000 km？
   - 直線距離是否 < 800 km？
   - 實際距離是否 ≥ 直線距離？

2. 速度驗證
   - 平均分速是否在 800-2000 m/Min？
   - 最高分速是否在 1000-2500 m/Min？
   - 實際分速是否 < 10000 m/Min？（異常檢測）
   - 平均速度是否 ≤ 最高速度？

3. 高度驗證
   - 平均高度是否在 0-3000 m？
   - 最大高度是否在 0-5000 m？
   - 平均高度是否 ≤ 最大高度？

4. 邏輯一致性
   - 距離比例是否合理（實際/直線 < 2.5）？
   - 時間序列是否遞增？

生成驗證報告，標記所有異常項目
```

**預期輸出**：
```markdown
# 數據驗證報告

## 驗證結果總覽
- 總驗證項：12 項
- 通過：10 項 ✅
- 失敗：2 項 ❌

## 異常項目詳情

### ❌ 實際距離異常
- **數值**：46168.05 km
- **合理範圍**：1-1000 km
- **超出倍數**：46 倍
- **嚴重程度**：高

### ❌ 實際分速異常
- **數值**：106529.36 m/Min
- **合理範圍**：0-10000 m/Min
- **超出倍數**：10 倍
- **嚴重程度**：高

## 建議
這些異常可能是：
1. 數據計算錯誤
2. 單位轉換錯誤
3. 後端數據損壞
```

---

### 階段 4：總結評估（10 分鐘）

#### 產出文檔

**1. MVP_TEST_REPORT.md**（測試總結報告）

```markdown
# Playwright MCP 測試報告

## 基本資訊
- **測試日期**：2025-11-14
- **測試人員**：[姓名]
- **測試環境**：Claude Code + Playwright MCP
- **目標網站**：https://skyracing.com.cn/
- **測試時長**：X 小時

---

## 測試總結

### 完成度
- 測試範圍：5 個核心功能
- 成功完成：X/5
- 部分完成：X/5
- 失敗：X/5

### 成功率統計
| 測試項目 | 狀態 | 備註 |
|---------|------|------|
| 首頁探索 | ✅ | 載入正常 |
| 列表提取 | ✅ | 數據完整 |
| 軌跡提取 | ⚠️ | 部分欄位缺失 |
| 統計驗證 | ✅ | 發現異常數據 |
| 地圖渲染 | ✅ | 視覺正常 |

---

## 技術可行性評估

### ✅ 可以提取的數據

**列表數據**：
- 賽事 ID、鴿子名稱
- 時間戳、狀態
- 基本統計數字

**軌跡數據**：
- 經緯度坐標
- 時間序列
- 高度、速度

**統計數據**：
- 飛行速度（平均/最高）
- 飛行高度（平均/最大）
- 距離數據

### ⚠️ 技術限制

**Accessibility Tree 限制**：
- 地圖軌跡視覺細節（需截圖補充）
- 動態載入內容（需等待策略）
- Canvas 內部數據（需 JavaScript 提取）

**可接受的解決方案**：
- 基本驗證用 Accessibility Tree ✅
- 視覺驗證用截圖 ✅
- 深度數據用 JavaScript evaluate ✅

### 💰 開發成本評估

基於 MVP 測試經驗：

| 階段 | 工作量 | 備註 |
|------|-------|------|
| 測試腳本開發 | 8-12 小時 | 固化為 .spec.ts |
| 數據驗證邏輯 | 4-6 小時 | validators/ 目錄 |
| CI/CD 配置 | 2-4 小時 | GitHub Actions |
| 文檔撰寫 | 2-3 小時 | README, 使用說明 |
| **總計** | **16-25 小時** | **2-3 天** |

---

## 發現的問題

### 數據異常
1. **實際距離異常**：46168 km（正常應 < 1000 km）
2. **實際分速異常**：106529 m/Min（正常應 < 10000 m/Min）

### 技術問題
1. [列出在測試中遇到的技術問題]
2. [例如：某些元素選擇器不穩定]

---

## 後續建議

### 立即可行
1. ✅ **部署完整測試專案**（按 DEPLOYMENT_PLAN.md）
2. ✅ **配置 GitHub Actions**（自動化執行）
3. ✅ **設置 Slack 通知**（異常告警）

### 中期規劃
1. 🔄 增加更多測試案例（邊界條件、錯誤處理）
2. 🔄 優化等待策略（提升穩定性）
3. 🔄 視覺回歸測試（截圖對比）

### 長期考慮
1. 🔮 API 測試整合（如果有 API 的話）
2. 🔮 性能監控（頁面載入時間趨勢）
3. 🔮 跨瀏覽器測試擴展

---

## 結論

**整體評估**：✅ **可行且推薦**

Playwright MCP 完全適合此專案：
- ✅ 核心數據提取：100% 可行
- ✅ 異常檢測：成功識別異常數據
- ✅ 開發成本：合理（2-3 天）
- ✅ 維護成本：低（自動化執行）

**建議行動**：
立即啟動完整專案開發，預計 2-3 天內完成部署。
```

---

**2. DATA_SAMPLES.json**（數據範例）

```json
{
  "metadata": {
    "extraction_date": "2025-11-14",
    "source_url": "https://skyracing.com.cn/",
    "extractor": "Playwright MCP"
  },
  "race_list": [
    {
      "race_id": "2024-12-0001234",
      "pigeon_name": "XXX",
      "timestamp": "2024-12-01 09:00:00",
      "status": "completed",
      "distance_km": 456.78
    }
  ],
  "trajectory_data": {
    "pigeon_id": "XXX",
    "total_points": 150,
    "trajectory": [
      {
        "point_number": 1,
        "timestamp": "2024-12-01 09:00:00",
        "latitude": 25.0330,
        "longitude": 121.5654,
        "altitude_m": 150.5,
        "speed_m_min": 1234.56
      }
    ]
  },
  "flight_statistics": {
    "avg_speed": 1234.56,
    "max_speed": 1500.23,
    "avg_altitude": 200.5,
    "max_altitude": 350.8,
    "actual_distance": 46168.05,
    "actual_speed": 106529.36,
    "straight_distance": 456.78,
    "straight_speed": 1123.45
  },
  "anomalies_detected": [
    {
      "field": "actual_distance",
      "value": 46168.05,
      "expected_range": "1-1000 km",
      "severity": "high"
    },
    {
      "field": "actual_speed",
      "value": 106529.36,
      "expected_range": "0-10000 m/Min",
      "severity": "high"
    }
  ]
}
```

---

**3. FULL_PROJECT_ESTIMATE.md**（完整專案評估）

```markdown
# 完整專案成本評估

基於 MVP 測試結果的詳細評估

---

## 專案範圍

### 核心功能
1. 自動化數據提取（列表、軌跡、統計）
2. 數據驗證（範圍、邏輯、一致性）
3. 異常檢測與告警
4. 測試報告生成
5. CI/CD 自動化執行

### 擴展功能（可選）
- 視覺回歸測試
- API 測試整合
- 性能監控
- 歷史數據趨勢分析

---

## 工作量分解

### 階段 1：測試腳本開發（8-12 小時）

| 任務 | 時間 | 產出 |
|------|------|------|
| 頁面載入測試 | 1-2h | 01-page-load.spec.ts |
| 數據提取測試 | 3-4h | 02-flight-data-validation.spec.ts |
| 航點驗證測試 | 2-3h | 03-waypoints-validation.spec.ts |
| 地圖渲染測試 | 1-2h | visual/map-rendering.spec.ts |
| 整合測試 | 1h | integration.spec.ts |

### 階段 2：數據驗證邏輯（4-6 小時）

| 任務 | 時間 | 產出 |
|------|------|------|
| 驗證規則定義 | 1h | validators/data-rules.ts |
| 驗證器實作 | 2-3h | validators/flight-data-validator.ts |
| 數據提取工具 | 1-2h | utils/data-extractors.ts |
| 輔助函數 | 1h | utils/helpers.ts |

### 階段 3：CI/CD 配置（2-4 小時）

| 任務 | 時間 | 產出 |
|------|------|------|
| Playwright 配置 | 1h | playwright.config.ts |
| GitHub Actions Workflow | 1-2h | .github/workflows/e2e-tests.yml |
| Slack 通知設置 | 0.5h | Webhook 配置 |
| GitHub Pages 部署 | 0.5-1h | 報告網站 |

### 階段 4：文檔與優化（2-3 小時）

| 任務 | 時間 | 產出 |
|------|------|------|
| README 撰寫 | 1h | README.md |
| 使用說明 | 0.5h | USAGE.md |
| 故障排除指南 | 0.5-1h | TROUBLESHOOTING.md |
| 代碼優化 | 0.5h | 重構、註解 |

---

## 總時間與成本

| 項目 | 最低 | 最高 | 平均 |
|------|------|------|------|
| **總開發時間** | 16h | 25h | 20h |
| **工作天數** | 2天 | 3.5天 | 2.5天 |
| **人力成本**（假設 $50/h） | $800 | $1250 | $1000 |

### 持續成本

| 項目 | 成本 |
|------|------|
| GitHub Actions（公開 Repo） | $0/月 |
| GitHub Actions（私有 Repo） | $0-16/月 |
| Slack 通知 | $0/月 |
| 維護工時 | 1-2h/月 |

---

## 技術風險評估

| 風險 | 可能性 | 影響 | 緩解策略 |
|------|--------|------|----------|
| 網站改版導致選擇器失效 | 中 | 中 | 使用彈性選擇器、定期檢查 |
| 動態載入超時 | 中 | 低 | 增加重試機制 |
| CI 額度超支 | 低 | 低 | 監控用量、優化執行時間 |
| 測試不穩定（flaky） | 中 | 中 | 增加等待策略、重試邏輯 |

---

## ROI 分析

### 投資
- 初期開發：20 小時（$1000）
- 每月維護：2 小時（$100）

### 回報
- 節省手動測試：每週 5 小時 × 4 週 = 20 小時/月
- 早期發現問題：減少線上事故
- 持續監控：提升系統可靠性

### ROI 計算
```
月節省 = 20 小時 × $50/h = $1000
投資回收期 = $1000 / $1000 = 1 個月

年度 ROI = ($1000 × 12 - $100 × 12 - $1000) / $1000 × 100%
         = ($12000 - $1200 - $1000) / $1000 × 100%
         = 980%
```

---

## 建議執行順序

### Week 1：核心開發
- Day 1-2：測試腳本開發
- Day 3：數據驗證邏輯
- Day 4：CI/CD 配置
- Day 5：測試與優化

### Week 2：部署與監控
- Day 1：正式部署到 GitHub Actions
- Day 2-3：觀察穩定性
- Day 4：團隊培訓
- Day 5：文檔完善

### Week 3：優化與擴展
- Day 1-2：根據反饋優化
- Day 3-4：增加測試案例
- Day 5：總結與復盤

---

## 成功標準

### 技術指標
- ✅ 測試通過率 > 95%
- ✅ 執行時間 < 5 分鐘
- ✅ 異常檢測準確率 > 99%
- ✅ 誤報率 < 1%

### 業務指標
- ✅ 每天自動執行 2 次
- ✅ 異常通知延遲 < 5 分鐘
- ✅ 團隊滿意度 > 4/5

---

## 結論

**投資建議**：✅ **強烈推薦**

理由：
1. 成本合理（2-3 天開發）
2. ROI 極高（1 個月回本，年度 ROI 980%）
3. 技術風險低（已驗證可行）
4. 長期價值高（持續監控、早期發現問題）

**下一步行動**：
確認預算與時程後，立即啟動開發。
```

---

## 🔧 Claude Code 使用技巧

### 如何在對話中使用 Playwright MCP

#### 首次使用（明確指定）

```
使用 playwright mcp 打開 https://skyracing.com.cn/
```

**為什麼要明確指定？**
- 避免 Claude 使用 Bash 執行 Playwright CLI
- 確保使用 MCP 的瀏覽器自動化功能

#### 後續使用（Claude 會記住）

```
提取頁面上的賽事列表數據
```

```
點擊第一個賽事，進入詳情頁
```

```
截圖保存到 mvp_test/screenshots/
```

---

### Playwright MCP 可用工具（25 個）

#### 導航類
- `browser_navigate` - 訪問 URL
- `browser_navigate_back` - 返回上一頁
- `browser_navigate_forward` - 前進
- `browser_refresh` - 刷新頁面
- `browser_goto` - 導航到新頁面

#### 互動類
- `browser_click` - 點擊元素
- `browser_type` - 輸入文字
- `browser_press` - 按鍵（Enter、Tab 等）
- `browser_select_option` - 選擇下拉選項
- `browser_drag` - 拖曳元素
- `browser_hover` - 滑鼠懸停

#### 表單類
- `browser_fill` - 填充表單欄位
- `browser_check` - 勾選 checkbox
- `browser_uncheck` - 取消勾選
- `browser_file_upload` - 上傳文件

#### 觀察類
- `browser_snapshot` - 獲取 Accessibility Tree
- `browser_take_screenshot` - 截圖
- `browser_get_text` - 提取文字
- `browser_get_attribute` - 獲取屬性
- `browser_is_visible` - 檢查可見性
- `browser_is_enabled` - 檢查啟用狀態

#### 進階類
- `browser_evaluate` - 執行 JavaScript
- `browser_wait_for_selector` - 等待元素
- `browser_wait_for_load_state` - 等待載入狀態
- `browser_get_cookies` - 獲取 Cookies
- `browser_set_cookies` - 設置 Cookies

**您不需要記住這些工具名稱**！

直接用自然語言說明需求即可：
- ✅ "點擊『查看詳情』按鈕"
- ✅ "提取表格中的所有數據"
- ✅ "等待地圖載入完成"
- ✅ "截圖並保存"

---

### 實用對話模式

#### 模式 1：探索式測試
```
User: 使用 playwright mcp 打開網站首頁，
      幫我找出所有可點擊的按鈕和連結

Claude: [執行]
        發現以下可點擊元素：
        - 按鈕：「查看賽事」「登入」
        - 連結：「最新消息」「排行榜」

User: 點擊「查看賽事」，看看會進入什麼頁面

Claude: [執行]
        已進入賽事列表頁面，發現以下內容...
```

#### 模式 2：數據提取
```
User: 提取頁面上的賽事列表，
      包含賽事 ID、名稱、時間、狀態

Claude: [執行]
        已提取 50 筆賽事數據...

User: 將這些數據保存為 JSON 文件到
      mvp_test/data_samples/race_list.json

Claude: [執行]
        已保存到指定路徑
```

#### 模式 3：驗證測試
```
User: 使用剛才提取的飛行數據，
      檢查是否有距離超過 1000 km 的異常項目

Claude: [分析]
        發現 1 筆異常：
        - 實際距離：46168.05 km（超出正常範圍 46 倍）
```

---

### 進階技巧

#### 處理動態載入

```
User: 等待表格數據載入完成後再提取

Claude: [使用 wait_for_selector]
        已等待載入完成，開始提取...
```

#### 處理分頁

```
User: 逐頁提取所有賽事數據（共 10 頁）

Claude: [循環點擊「下一頁」]
        第 1 頁：50 筆
        第 2 頁：50 筆
        ...
        總計：500 筆
```

#### 處理登入

```
User: 如果需要登入，請等待我手動輸入帳號密碼

Claude: [打開登入頁面]
        已打開登入頁面，瀏覽器視窗可見
        請手動登入後告訴我繼續

User: 好了，繼續

Claude: [檢測登入成功]
        已登入，繼續執行測試...
```

**優勢**：可見瀏覽器視窗，支援手動操作！

---

## 📊 預期成果

### 最低標準（必須達成）

- [ ] ✅ Playwright MCP 成功配置
- [ ] ✅ 能訪問目標網站
- [ ] ✅ 提取至少一種數據（列表或軌跡）
- [ ] ✅ 完成基本數據驗證
- [ ] ✅ 生成測試記錄文檔

### 理想標準（期望達成）

- [ ] ✅ 完成全部 5 個測試
- [ ] ✅ 提取所有核心數據（列表、軌跡、統計）
- [ ] ✅ 驗證數據準確性和合理性
- [ ] ✅ 成功識別異常數據（如距離 46168 km）
- [ ] ✅ 生成完整測試報告
- [ ] ✅ 保存數據範例（JSON 格式）
- [ ] ✅ 評估完整專案可行性和成本

### 額外成果（超出預期）

- [ ] 🌟 發現網站 UI/UX 問題
- [ ] 🌟 識別性能瓶頸
- [ ] 🌟 建立測試最佳實踐
- [ ] 🌟 為團隊培訓準備材料

---

## ✅ 執行檢查清單

### 環境準備階段

- [ ] 確認在專案目錄（`/Users/tf/Downloads/PIGEON_RACING_TEST_PROJECT`）
- [ ] 檢查 Node.js 版本（`node --version`，需要 v18+）
- [ ] 執行配置命令（推薦）：`claude mcp add playwright npx @playwright/mcp@latest --scope project`
- [ ] 驗證 `claude mcp list` 顯示 playwright
- [ ] 確認 `.mcp.json` 文件已創建
- [ ] 創建 `mvp_test/` 目錄結構
- [ ] 創建初始文檔（README.md, test_log.md）

### 測試執行階段

- [ ] 測試 1：首頁探索（10 分鐘）
  - [ ] 頁面載入測試
  - [ ] UI 元件檢查
  - [ ] 功能入口識別

- [ ] 測試 2：列表數據提取（15 分鐘）
  - [ ] 提取賽事/鴿子列表
  - [ ] 分析數據結構
  - [ ] 保存 JSON 範例

- [ ] 測試 3：軌跡數據提取（20 分鐘）
  - [ ] 進入詳情頁
  - [ ] 提取軌跡數據點
  - [ ] 驗證數據完整性

- [ ] 測試 4：統計數據驗證（10 分鐘）
  - [ ] 提取飛行統計
  - [ ] 執行範圍驗證
  - [ ] 檢測異常數據

- [ ] 測試 5：地圖渲染檢查（5 分鐘）
  - [ ] 檢查地圖元素
  - [ ] 截圖保存
  - [ ] 控件驗證

### 文檔產出階段

- [ ] 完成 `test_log.md`（測試過程記錄）
- [ ] 完成 `MVP_TEST_REPORT.md`（總結報告）
- [ ] 保存 `DATA_SAMPLES.json`（數據範例）
- [ ] 完成 `FULL_PROJECT_ESTIMATE.md`（成本評估）
- [ ] 保存測試截圖到 `screenshots/`

### 後續行動

- [ ] 評估 MVP 測試結果
- [ ] 決定是否啟動完整專案
- [ ] 如果啟動，按照 `DEPLOYMENT_PLAN.md` 執行
- [ ] 如果有問題，調整測試策略

---

## 🎯 與原專案的整合

### 現在：MVP 驗證階段

```
MVP 測試（本文檔）
    ↓
驗證技術可行性
    ↓
評估開發成本
```

### 接下來：完整專案開發

```
基於 MVP 結果
    ↓
開發完整測試腳本（PIGEON_RACING_TEST_PROJECT.md）
    ↓
固化為 TypeScript .spec.ts 文件
    ↓
部署到 GitHub Actions（DEPLOYMENT_PLAN.md）
    ↓
自動化持續監控
```

### 最終目標

```
賽鴿追蹤系統（https://skyracing.com.cn/）
    ↓
每天自動測試 2 次
    ↓
異常數據自動檢測
    ↓
Slack 即時告警
    ↓
團隊快速響應
```

---

## 📞 疑難排解

### 常見問題

#### Q1: MCP 添加失敗？

```bash
# 錯誤：command not found
# 解決：確認 Claude Code 已安裝
which claude

# 錯誤：Node.js 版本過舊
# 解決：升級 Node.js 到 18 或更高
node --version

# 錯誤：playwright 連接失敗
# 解決：使用正確的配置命令（注意：移除引號）
claude mcp add playwright npx @playwright/mcp@latest --scope project

# 或使用全局安裝方式
npm install -g @playwright/mcp
claude mcp add playwright mcp-server-playwright --scope project
```

#### Q2: 瀏覽器沒有打開？

```
# 問題：使用了 headless 模式
# 解決：Claude Code 的 Playwright MCP 預設是 headed（有視窗）
#      如果沒看到視窗，檢查是否誤用了 Bash 執行

# 確保在對話中明確說：
"使用 playwright mcp 打開..."
```

#### Q3: 無法提取數據？

```
可能原因：
1. 元素還在載入 → 增加等待時間
2. 選擇器錯誤 → 使用更彈性的選擇器
3. 需要登入 → 手動登入後繼續

解決方式：
"等待頁面完全載入後再提取數據"
"使用 text 選擇器而非 class 選擇器"
```

#### Q4: 配置沒有保存？

```bash
# 檢查配置文件
cat .mcp.json

# 如果不存在，檢查是否在正確目錄
pwd

# 重新添加（使用 --scope project，注意：移除引號）
claude mcp add playwright npx @playwright/mcp@latest --scope project
```

---

## 🚀 開始執行

### 立即行動

**步驟 1**：執行配置命令（在終端）
```bash
cd /Users/tf/Downloads/PIGEON_RACING_TEST_PROJECT

# 檢查 Node.js 版本
node --version

# 配置 Playwright MCP（注意：移除引號）
claude mcp add playwright npx @playwright/mcp@latest --scope project

# 驗證配置
claude mcp list
```

**步驟 2**：創建測試目錄
```bash
mkdir -p mvp_test/{data_samples,screenshots}
```

**步驟 3**：開始測試（在 Claude Code 對話中）
```
使用 playwright mcp 打開 https://skyracing.com.cn/
幫我分析頁面結構
```

---

## 📋 時間規劃

### 預計時程

```
總時間：1.5-2 小時

09:00 - 09:20  階段 1：環境設置
09:20 - 10:20  階段 2：互動式測試
10:20 - 10:40  階段 3：數據驗證
10:40 - 10:50  階段 4：總結評估
10:50 - 11:00  文檔整理與備份
```

### 關鍵里程碑

- ⏰ **20 分鐘**：完成環境設置
- ⏰ **40 分鐘**：完成首個數據提取
- ⏰ **80 分鐘**：完成所有測試
- ⏰ **100 分鐘**：完成驗證邏輯
- ⏰ **120 分鐘**：完成總結報告

---

## 💡 成功要訣

### Do's（應該做的）

✅ **明確指定 MCP**
```
使用 playwright mcp ...
```

✅ **逐步測試**
```
先測試簡單功能，再測試複雜功能
```

✅ **詳細記錄**
```
記錄每個測試的結果、問題、解決方案
```

✅ **保存證據**
```
截圖、數據範例、錯誤訊息
```

### Don'ts（不應該做的）

❌ **不要跳過環境驗證**
```
沒驗證 MCP 就開始測試
```

❌ **不要忽略異常**
```
看到錯誤就繼續，沒有記錄
```

❌ **不要過度優化**
```
MVP 階段追求完美，浪費時間
```

❌ **不要忘記備份**
```
沒保存測試結果就關閉瀏覽器
```

---

## 🎯 最終目標

### MVP 測試成功標準

```
✅ 技術驗證：證明 Playwright MCP 能提取數據
✅ 數據完整：獲得足夠的數據範例
✅ 異常檢測：成功識別異常數據
✅ 成本評估：評估完整專案工作量
✅ 決策支持：提供充分的決策依據
```

### 下一步決策

**如果 MVP 成功** → 啟動完整專案開發
**如果有限制** → 調整測試策略或技術方案
**如果失敗** → 尋找替代方案

---

**準備好開始 MVP 測試了嗎？** 🚀

確認此計畫後，請告訴我，我將立即協助您：
1. 執行環境配置
2. 開始互動式測試
3. 記錄測試結果
4. 生成評估報告
