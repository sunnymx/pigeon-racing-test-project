# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Automated testing project for a pigeon racing GPS tracking system (https://skyracing.com.cn/) using **Playwright MCP** for interactive browser automation. Currently in **documentation and planning phase** - automation implementation pending.

---

## 🤝 Agent 協作規則

### 核心流程

**當收到問題報告或修改請求時，必須依序執行：**

| 步驟 | 內容 | 限制 |
|------|------|------|
| **1. 分析** | 診斷根本原因，輸出白話文分析報告 | 未獲確認前，禁止進入步驟 2 |
| **2. 修改確認** | 輸出修改計畫（位置、原因、內容、預期結果、影響範圍） | 未獲確認前，禁止進入步驟 3 |
| **3. 執行** | 執行最小化修改，測試並回報結果 | - |

### 強制規則

**協作規則**：
1. **禁止跳過確認** - 用戶未說「好」「確認」「執行」前，不得進入下一步
2. **白話文優先** - 所有技術說明必須附加非技術人員能理解的解釋
3. **不確定就問** - 需求有歧義時，必須先詢問，禁止自行假設

**開發原則**：
4. **最小化修改** - 只改必要的部分，禁止「順便」改其他代碼
5. **KISS** - Keep It Simple, Stupid — 優先選擇最簡單的解決方案
6. **YAGNI** - You Aren't Gonna Need It — 不實作目前不需要的功能
7. **DRY** - Don't Repeat Yourself — 重複代碼超過 2 處應抽取為共用
8. **單一職責** - 每個函數/模組只做一件事，做好一件事
9. **先讓它動，再讓它好** - 先實現功能，確認正確後再優化

---

## 📐 漸進式收斂開發

### 層級定義

| 層級 | 內容 | 限制 |
|------|------|------|
| **大方向** | 架構目標、核心概念 | 僅討論，不產出代碼 |
| **階段計劃** | 具體功能範圍 | ≤300 行總量 |
| **工單執行** | 單一任務實作 | ≤100 行/工單，≤150 行/次生成 |

### 開發循環

```
1. 討論 → 確立大方向（不寫代碼）
2. 規劃 → 拆分為可執行的小階段
3. 執行 → 逐一完成工單
4. 檢視 → 驗證成果是否符合方向
5. 收斂 → 根據成果更新方向，回到步驟 2
```

### 代碼生成上限

| 類型 | 上限 | 說明 |
|------|------|------|
| 單次生成 | **≤150 行** | 預設上限，確保生成品質 |
| 單一工單 | **≤100 行** | 確保可檢視 |
| 單次計劃 | **≤300 行** | 分多個工單執行 |
| 特殊情況 | **≤250 行** | 新建組件、Schema，需事先告知 |

**禁止事項**：
- 禁止單次生成超過 250 行代碼（硬上限）
- 禁止跳過檢視直接進入下一階段
- 禁止在用戶未確認前批量執行多個工單

---

## 🏗️ 設計原則

### 關注點分離（文件結構）

| 層級 | 位置 | 職責 |
|------|------|------|
| 總覽 | `CLAUDE.md` | 專案總覽、快速參考、索引導航 |
| 架構 | `docs/architecture/` | 系統架構、模組設計、技術決策 |
| 規格 | `spec/[功能名]/` | 功能規格、API 設計、資料結構 |
| 指南 | `docs/guides/` | 開發指南、操作手冊、最佳實踐 |

### 關注點分離（代碼結構）

**單一檔案上限**：
- HTML/Vue 組件：**300 行以內**
- Python 模組：**500 行以內**
- TypeScript 模組：**400 行以內**
- 超過上限時，**必須**拆分為獨立模組

**代碼拆分原則**：
```
按職責分層
├── 視圖層（UI 組件、頁面佈局）
├── 邏輯層（業務邏輯、資料處理）
├── 資料層（API 呼叫、狀態管理）
└── 工具層（共用函數、常數定義）
```

### 重構觸發點

**當以下情況發生時，必須提醒用戶考慮重構**：
- 單一檔案即將或已經超過行數上限
- 發現重複代碼超過 3 處
- 新功能與現有結構不符

---

## 🚨 Critical Gotchas

### 2D/3D Mode Selection (UPDATED 2025-11-24)

**CRITICAL**: There are **THREE different types of buttons** - don't confuse them!

#### Button Type 1: Preference Selector (選擇鴿子畫面)
**Location**: Next to "查看軌跡" button when selecting pigeons (red badge showing "3D")
**Purpose**: Sets which mode will be used when clicking "查看軌跡"
**Behavior**:
- This is a **preference setting**
- Can be toggled freely
- Only affects **next** trajectory view, NOT current map
- ❌ Do NOT use this to switch current map mode

#### Button Type 2: Map Mode Switcher (地圖功能選單) ⭐ PRIMARY
**Location**: In trajectory view's map control panel
**Purpose**: **Switches current displayed map** between 2D ↔ 3D
**Behavior**:
- When in 2D map → Shows "3D模式" → Click to enter 3D
- When in 3D map → Shows "2D模式" → Click to enter 2D
- ✅ **Button text = mode you'll enter** (as originally documented)
- ✅ **Use this for ensureModeByText()**

#### Button Type 3: Static/Dynamic Toggle (2D only)
**Location**: Map control panel (only visible in 2D mode)
**Purpose**: Switches between "靜態軌跡" and "動態軌跡" in 2D
**Behavior**:
- Only appears in 2D mode
- Toggles trajectory display style

**Detecting Current Mode** (Use this method):
- ✅ **2D Mode**: Check for AMap container (`.amap-container`)
- ✅ **3D Mode**: Check for Cesium controls (視角1/視角2 buttons)
- ❌ **WRONG**: Do NOT use button text to detect current mode

📖 **Deep dive**: [Mode Switching Guide](docs/guides/mode-switching.md)
🏗️ **Architecture**: [Test Framework](docs/architecture/test-framework.md#2d3d-mode-architecture)

### Known Issues Quick Reference

1. **2D trajectory initial load failure** → Reload trajectory by re-selecting pigeon (3D→2D switch does NOT work)
2. **Static/Dynamic mode confusion** → Count marker points (≥15 static vs <5 dynamic)
3. **Trajectory point click unresponsive** → Use `.amap-icon > img` selector with `force: true`
4. **Data loading timing** → Wait 2-3 seconds after switches
5. **page.goto networkidle timeout** → Use `domcontentloaded` + element wait instead

📖 **Solutions**: [Troubleshooting Guide](docs/guides/troubleshooting.md)

### ⚠️ Selector Quick Reference (2025-11-26)

**關鍵選擇器**:
- 軌跡標記點: `.amap-icon > img`
- Canvas 圖層: `canvas.amap-layer`

📖 **完整說明**: [Selectors Guide](docs/guides/selectors.md)

---

## ⚡ Quick Start

### Playwright MCP Setup

```bash
# Install (project scope)
claude mcp add playwright npx @playwright/mcp@latest --scope project

# Verify
claude mcp list
```

### Basic Test Flow

```typescript
// Navigate → Select → View Trajectory
await page.goto('https://skyracing.com.cn/');
await page.getByRole('button', { name: '進入' }).first().click();

// Check mode button BEFORE selecting pigeon
const modeButton = page.getByRole('button', { name: /2D|3D/ });
const buttonText = await modeButton.textContent();
// buttonText determines which mode you'll enter!

await page.locator('input[type="checkbox"]').first().click();
await page.getByRole('button', { name: '查看軌跡' }).click();
```

📖 **Complete workflow**: [Playwright MCP Guide](docs/guides/playwright-workflow.md)

---

## 🛠️ Code Development Index

**修改程式碼前，務必參閱索引確認影響範圍**

| 模組類型 | 數量 | 說明 |
|---------|------|------|
| Helper 函數 | 7 模組 | `tests/helpers/` - 導航、模式切換、軌跡操作等 |
| P0 測試案例 | 3 個 | `tests/e2e/` - TC-02-001, TC-03-001, TC-04-001 |

📖 **完整說明**: [Helper Functions](docs/architecture/helper-functions.md)

---

## 📚 Documentation Architecture

### Quick Reference (You Are Here)
**CLAUDE.md** - Critical warnings, quick commands, navigation index

### Architecture & Design
**[docs/architecture/test-framework.md](docs/architecture/test-framework.md)**
- Test framework architecture design
- Helper function module design
- Test case priority system (P0/P1/P2)
- Data validation framework

**[docs/technical-architecture/](docs/technical-architecture/)**
- [System Architecture](docs/technical-architecture/SYSTEM_ARCHITECTURE.md) - Frontend/backend architecture, map engines
- [Dependency Graph](docs/technical-architecture/DEPENDENCY_GRAPH.md) - Technical dependencies, API call chains, wait strategies

**[docs/data-model/](docs/data-model/)**
- [Entity Relationship](docs/data-model/ENTITY_RELATIONSHIP.md) - Data model, entity relationships, validation rules

**[docs/information-architecture/](docs/information-architecture/)**
- [Site Map](docs/information-architecture/SITE_MAP.md) - Complete page structure
- [Page Flows](docs/information-architecture/PAGE_FLOWS.md) - Navigation flows, decision points

### Development Planning
**[docs/development-plan/](docs/development-plan/)**
- [Development Roadmap](docs/development-plan/ROADMAP.md) - Complete 3-phase development plan
- [Documents Checklist](docs/development-plan/DOCUMENTS_CHECKLIST.md) - Track documentation progress
- Quick start priority strategy: Architecture docs (2-3 days) → P0 tests implementation

### Detailed Guides
**[docs/guides/](docs/guides/)**
- [Mode Switching Guide](docs/guides/mode-switching.md) - 2D/3D selection deep dive
- [Troubleshooting Guide](docs/guides/troubleshooting.md) - 4 known issues + solutions
- [Testing Strategies](docs/guides/testing-strategies.md) - Triple verification, wait patterns
- [Playwright Workflow](docs/guides/playwright-workflow.md) - Interactive testing flow

### Test Planning
**[docs/test-plan/](docs/test-plan/)**
- [Test Plan Overview](docs/test-plan/TEST_PLAN_OVERVIEW.md) - Master strategy
- [Test Cases](docs/test-plan/TEST_CASES.md) - 35+ detailed test cases
- [Known Issues Solutions](docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md) - Original problem documentation

### API Reference
**[docs/api-reference/](docs/api-reference/)**
- [API Endpoints](docs/api-reference/API_ENDPOINTS.md) - 6 core endpoints

---

## 🔄 Git Workflow

This project maintains **two remote repositories**:

```bash
# Push to main repository (sunnymx)
git push origin main

# Push to team repository (MinXinCorp)
git push minxin main

# View configured remotes
git remote -v
```

📖 **Complete setup**: [Git Setup Guide](docs/GIT_SETUP.md)

---

## 🎯 When Starting Implementation

### Step-by-Step Approach

1. **Read this file first** (you're here!)
2. **Understand architecture** → [Test Framework](docs/architecture/test-framework.md)
3. **Learn tools** → [Playwright MCP Workflow](docs/guides/playwright-workflow.md)
4. **Study strategies** → [Testing Strategies](docs/guides/testing-strategies.md)
5. **Review test cases** → [Test Cases](docs/test-plan/TEST_CASES.md)
6. **Handle known issues** → [Troubleshooting](docs/guides/troubleshooting.md)

### Implementation Priorities

**Phase 1: P0 Tests** (Critical - must pass)
- TC-02-001: 2D static trajectory
- TC-03-001: Static/dynamic switching
- TC-04-001: 3D mode rendering

**Phase 2: P1 Tests** (Important)
- Trajectory point interaction
- Data validation
- Mode switching edge cases

**Phase 3: P2 Tests** (Nice-to-have)
- Loft list operations
- Error handling
- Performance tests

📖 **Complete catalog**: [Test Plan Overview](docs/test-plan/TEST_PLAN_OVERVIEW.md)

---

## 📊 Project Status

**Last Updated**: 2025-11-26

**Current State**:
- ✅ MVP testing completed
- ✅ Test plan documentation complete (35+ test cases)
- ✅ Documentation consistency verified (9.75/10 score)
- ✅ P0 測試案例實作完成 (3/3)
- ✅ Helper 函數模組完整 (7/7)
- ✅ 選擇器更新完成 (`.amap-icon > img`)
- 🚧 P1/P2 測試案例待實作

**Project Statistics**:
- 📋 Test cases: 35+ (3 P0 implemented)
- 🔧 Helper functions: 7 modules (~1,828 lines)
- 🔌 API endpoints: 6
- ⚠️ Known issues: 4 (all solved)
- 📖 Guides: 5
- 🏗️ Architecture docs: 10

---

## 🔍 Quick Reference Links

- **Development Plan**: [Roadmap](docs/development-plan/ROADMAP.md) | [Documents Checklist](docs/development-plan/DOCUMENTS_CHECKLIST.md)
- **Architecture**: [Test Framework](docs/architecture/test-framework.md) | [System Architecture](docs/technical-architecture/SYSTEM_ARCHITECTURE.md) | [Dependency Graph](docs/technical-architecture/DEPENDENCY_GRAPH.md)
- **Data Model**: [Entity Relationship](docs/data-model/ENTITY_RELATIONSHIP.md)
- **Information Architecture**: [Site Map](docs/information-architecture/SITE_MAP.md) | [Page Flows](docs/information-architecture/PAGE_FLOWS.md)
- **Guides Index**: [docs/guides/](docs/guides/README.md)
- **Test Plan**: [Test Plan Overview](docs/test-plan/TEST_PLAN_OVERVIEW.md)
- **Test Cases**: [Detailed Test Cases](docs/test-plan/TEST_CASES.md)
- **API Docs**: [API Endpoints](docs/api-reference/API_ENDPOINTS.md)
- **Git Setup**: [Git Configuration](docs/GIT_SETUP.md)

---

## 💡 Key Takeaways

1. ⚠️ **Button text determines mode**, not checkbox state (most common mistake!)
2. 📖 **Consult guides** before implementing - all 4 known issues have solutions
3. 🧪 **Test interactively first** - use Playwright MCP to validate approach
4. 🔄 **Use triple verification** - DOM + Canvas + Network
5. 📝 **Follow P0→P1→P2** - implement by priority

---

**Documentation last updated**: 2025-11-26 - Separation of Concerns refactoring completed.
