# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Automated testing project for a pigeon racing GPS tracking system (https://skyracing.com.cn/) using **Playwright MCP** for interactive browser automation. Currently in **documentation and planning phase** - automation implementation pending.

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

1. **2D trajectory initial load failure** → Reload trajectory by re-selecting pigeon (or use 3D→2D switch as fallback)
2. **Static/Dynamic mode confusion** → Count marker points (15-20 vs 1-3)
3. **Trajectory point click unresponsive** → Use accessibility tree locator
4. **Data loading timing** → Wait 2-3 seconds after switches

📖 **Solutions**: [Troubleshooting Guide](docs/guides/troubleshooting.md)

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

**Last Updated**: 2025-11-18

**Current State**:
- ✅ MVP testing completed
- ✅ Test plan documentation complete (35+ test cases)
- ✅ Documentation consistency verified (10/10 score)
- ✅ TC-03-008 corrected and verified
- ✅ Architecture and guides documented
- ✅ **Phase 1 Day 3 completed** - Technical architecture docs (4 documents)
- 🚧 Automation script implementation pending

**Documentation Statistics**:
- 📋 Test cases: 35+
- 🔧 Helper functions: 25+ (designed)
- 🔌 API endpoints: 6
- ⚠️ Known issues: 4 (solved)
- 📖 Guides: 4
- 🏗️ Architecture docs: 10 (Phase 1 complete)

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

**Documentation last updated**: 2025-11-18 - Architecture restructuring completed.
