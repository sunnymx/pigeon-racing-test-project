# Skyracing.com.cn 自动化测试实施计划

## 文档信息
- **版本**: v1.0.0
- **创建日期**: 2025-11-17
- **最后更新**: 2025-11-17
- **状态**: 📋 计划阶段
- **作者**: 测试自动化团队

---

## 📋 目录

1. [项目概述](#项目概述)
2. [现状分析](#现状分析)
3. [自动化方案](#自动化方案)
4. [实施路径](#实施路径)
5. [技术架构](#技术架构)
6. [关键挑战与解决方案](#关键挑战与解决方案)
7. [投入估算](#投入估算)
8. [成功指标](#成功指标)
9. [风险管理](#风险管理)
10. [参考文档](#参考文档)

---

## 项目概述

### 背景

**Skyracing.com.cn** 是一个赛鸽追踪系统，提供 2D/3D 轨迹可视化、实时播放、多鸽子比较等功能。当前项目已完成：

- ✅ 完整的测试用例规格（35+ 测试用例）
- ✅ 详细的辅助函数设计（25+ 函数）
- ✅ 交互式探索测试验证（Playwright MCP）
- ✅ 已知问题解决方案文档化

### 当前问题

**测试方法**：交互式 Playwright MCP
- **执行方式**：通过自然语言指令手动控制浏览器
- **执行时间**：每次完整测试约 25-30 分钟
- **参与要求**：需要人工全程参与
- **自动化程度**：0%（无法批量执行、无法 CI/CD 集成）

### 项目目标

将已收敛的测试规格转换为**完全自动化的 Playwright 测试脚本**，实现：

| 指标 | 当前状态 | 目标状态 | 改进幅度 |
|-----|---------|---------|---------|
| **执行时间** | 25-30 分钟 | 5-10 分钟 | ⬇️ 60-70% |
| **人工参与** | 100%（全程） | 0%（完全自动） | ⬇️ 100% |
| **可重复性** | 低（手动操作） | 高（自动化脚本） | ⬆️ 显著提升 |
| **CI/CD 集成** | ❌ 不支持 | ✅ 完全支持 | ⬆️ 从无到有 |
| **测试覆盖率** | 约 35% | 100% | ⬆️ 65% |
| **报告生成** | 手动记录 | 自动生成 HTML | ⬆️ 自动化 |

---

## 现状分析

### 已有资产

#### 1. 文档资产（✅ 完善）

| 文档名称 | 内容概要 | 状态 | 价值 |
|---------|---------|------|------|
| **TEST_CASES.md** | 35+ 测试用例，按优先级分类 | ✅ 完成 | ⭐⭐⭐⭐⭐ |
| **HELPER_FUNCTIONS_DESIGN.md** | 25+ 辅助函数设计，含完整代码 | ✅ 完成 | ⭐⭐⭐⭐⭐ |
| **KNOWN_ISSUES_SOLUTIONS.md** | 4 个已知问题及解决方案 | ✅ 完成 | ⭐⭐⭐⭐ |
| **AUTOMATED_EXPLORATION_PLAN.md** | 三阶段探索测试计划 | ✅ 完成 | ⭐⭐⭐ |
| **EXPLORATION_REPORT_v1.0.0** | 实际探索测试结果报告 | ✅ 完成 | ⭐⭐⭐⭐ |

#### 2. 测试用例清单（35+ 用例）

| 测试模块 | 用例数 | 优先级 | 文档化状态 | 验证状态 |
|---------|--------|--------|-----------|---------|
| TC-01: 赛事列表测试 | 5 | P1 | ✅ 完成 | ✅ 部分验证 |
| TC-02: 2D 静态轨迹测试 | 6 | P0 | ✅ 完成 | ✅ 已验证 |
| TC-03: 2D 动画播放测试 | 7 | P0 | ✅ 完成 | ⏭️ 未验证 |
| TC-04: 3D 轨迹播放测试 | 6 | P0 | ✅ 完成 | ✅ 已验证（4/6） |
| TC-05: 鸽舍列表测试 | 4 | P1 | ✅ 完成 | ⏭️ 未验证 |
| TC-06: 轨迹详情测试 | 4 | P1 | ✅ 完成 | ✅ 部分验证 |
| TC-07: UI 元素综合测试 | 6 | P2 | ✅ 完成 | ⏭️ 未验证 |

**总计**：38 个测试用例，100% 已文档化，约 40% 已通过探索测试验证。

#### 3. 辅助函数设计（25+ 函数）

已设计 6 个模块，包含完整 TypeScript 实现代码：

| 模块 | 函数数量 | 核心功能 | 实现状态 |
|------|---------|---------|---------|
| **navigation.ts** | 4 | 页面导航、鸽子选择 | 📋 仅设计 |
| **mode-switching.ts** | 4 | 2D/3D 切换、静态/动态模式 | 📋 仅设计 |
| **trajectory-utils.ts** | 4 | 轨迹点交互、详情验证 | 📋 仅设计 |
| **loft-list.ts** | 4 | 鸽舍选择、多鸽子比较 | 📋 仅设计 |
| **validators.ts** | 7 | 页面状态验证 | 📋 仅设计 |
| **wait-utils.ts** | 2 | 智能等待策略 | 📋 仅设计 |

#### 4. 已知问题及解决方案（4 个）

| 问题 | 解决方案 | 验证状态 |
|-----|---------|---------|
| 问题#1: 2D 轨迹初次加载失败 | 使用 3D→2D 切换序列 | ✅ 已验证有效 |
| 问题#2: 动态/静态模式混淆 | 检查轨迹标记数量 | ⚠️ 视觉确认 |
| 问题#3: 轨迹点点击无响应 | 使用 `[title*=""]` 选择器 | ✅ 已验证有效 |
| 问题#4: 数据加载时序问题 | 增加等待和重试机制 | ✅ 已验证有效 |

### 缺失资产

#### 1. 代码实现（❌ 未开始）

```
/Users/tf/Downloads/PIGEON_RACING_TEST_PROJECT/
├── package.json                 ❌ 不存在
├── playwright.config.ts         ❌ 不存在
├── tests/
│   ├── e2e/                    📁 空目录
│   │   ├── 01-race-list.spec.ts          ❌ 未创建
│   │   ├── 02-track-2d-static.spec.ts    ❌ 未创建
│   │   ├── 03-track-2d-playback.spec.ts  ❌ 未创建
│   │   ├── 04-track-3d-playback.spec.ts  ❌ 未创建
│   │   ├── 05-loft-list.spec.ts          ❌ 未创建
│   │   ├── 06-trajectory-detail.spec.ts  ❌ 未创建
│   │   └── 07-ui-elements.spec.ts        ❌ 未创建
│   ├── helpers/                ❌ 不存在
│   │   ├── navigation.ts                 ❌ 未创建
│   │   ├── mode-switching.ts             ❌ 未创建
│   │   ├── trajectory-utils.ts           ❌ 未创建
│   │   ├── loft-list.ts                  ❌ 未创建
│   │   ├── validators.ts                 ❌ 未创建
│   │   └── wait-utils.ts                 ❌ 未创建
│   └── utils/                  📁 空目录
└── .github/
    └── workflows/
        └── playwright.yml       ❌ 未创建
```

**代码实现进度**：0%

#### 2. CI/CD 集成（❌ 未配置）

- ❌ 无 GitHub Actions 配置
- ❌ 无自动化测试触发机制
- ❌ 无测试报告自动生成

---

## 自动化方案

### 方案选择

#### 方案对比

| 方案 | 优势 | 劣势 | 适用场景 | 推荐度 |
|-----|------|------|---------|--------|
| **方案 A：传统 Playwright 脚本** | • 完全自动化<br>• CI/CD 集成<br>• 成熟稳定 | • 需要编写代码<br>• 初期投入高 | 核心回归测试 | ⭐⭐⭐⭐⭐ |
| **方案 B：Playwright MCP** | • 无需编码<br>• 灵活探索 | • 无法自动化<br>• 需人工参与 | 探索性测试 | ⭐⭐⭐ |
| **方案 C：混合方案** | • 兼具两者优势<br>• 灵活性最高 | • 需要两套工具 | 推荐方案 | ⭐⭐⭐⭐⭐ |

#### 推荐方案：方案 C（混合方案）

**策略**：

1. **核心回归测试**（80% 工作量）
   - **方法**：传统 Playwright 脚本
   - **用例**：35+ 个已文档化测试用例
   - **执行**：自动化批量运行
   - **频率**：每日定时 + PR 触发

2. **探索性测试**（20% 工作量）
   - **方法**：Playwright MCP
   - **用例**：新功能验证、问题调试
   - **执行**：交互式手动运行
   - **频率**：按需触发

### 技术栈

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",        // 测试框架
    "typescript": "^5.0.0",               // TypeScript 支持
    "@types/node": "^20.0.0",             // Node.js 类型
    "dotenv": "^16.0.0"                   // 环境变量管理（可选）
  },
  "scripts": {
    "test": "playwright test",                          // 运行所有测试
    "test:p0": "playwright test --grep @P0",            // 仅 P0 测试
    "test:headed": "playwright test --headed",          // 有头模式
    "test:debug": "playwright test --debug",            // 调试模式
    "test:report": "playwright show-report"             // 查看报告
  }
}
```

### 项目结构

```
PIGEON_RACING_TEST_PROJECT/
├── docs/
│   └── test-plan/
│       ├── TEST_CASES.md                    # 测试用例规格 ✅
│       ├── HELPER_FUNCTIONS_DESIGN.md       # 辅助函数设计 ✅
│       ├── KNOWN_ISSUES_SOLUTIONS.md        # 已知问题 ✅
│       └── AUTOMATION_IMPLEMENTATION_PLAN.md # 本文档 ✅
├── tests/
│   ├── e2e/                                 # E2E 测试脚本
│   │   ├── 01-race-list.spec.ts            # P1 - 5 用例
│   │   ├── 02-track-2d-static.spec.ts      # P0 - 6 用例 ⭐
│   │   ├── 03-track-2d-playback.spec.ts    # P0 - 7 用例 ⭐
│   │   ├── 04-track-3d-playback.spec.ts    # P0 - 6 用例 ⭐
│   │   ├── 05-loft-list.spec.ts            # P1 - 4 用例
│   │   ├── 06-trajectory-detail.spec.ts    # P1 - 4 用例
│   │   └── 07-ui-elements.spec.ts          # P2 - 6 用例
│   ├── helpers/                             # 辅助函数库
│   │   ├── navigation.ts                   # 导航辅助 ⭐
│   │   ├── mode-switching.ts               # 模式切换 ⭐
│   │   ├── trajectory-utils.ts             # 轨迹操作 ⭐
│   │   ├── loft-list.ts                    # 鸽舍列表
│   │   ├── validators.ts                   # 验证函数
│   │   └── wait-utils.ts                   # 等待策略 ⭐
│   ├── fixtures/                            # 测试固定装置
│   │   └── base.ts                         # 基础 fixture
│   └── utils/                               # 通用工具
│       └── constants.ts                    # 常量定义
├── screenshots/                             # 测试截图
│   ├── baseline/                           # 基线截图（可选）
│   └── actual/                             # 实际截图
├── playwright.config.ts                     # Playwright 配置 ⭐
├── package.json                             # 项目配置 ⭐
├── tsconfig.json                            # TypeScript 配置
└── .github/
    └── workflows/
        └── playwright.yml                   # GitHub Actions CI

⭐ = 优先创建
```

---

## 实施路径

### 总体时间表

| 阶段 | 工作内容 | 预估时间 | 优先级 | 产出 |
|-----|---------|---------|--------|------|
| **阶段 1** | 基础设施搭建 | 1-2 天 | P0 | 可运行的 Playwright 环境 |
| **阶段 2** | 辅助函数开发 | 2-3 天 | P0 | 可复用的函数库 |
| **阶段 3** | P0 测试脚本 | 3-4 天 | P0 | 核心功能自动化测试 |
| **阶段 4** | P1/P2 测试脚本 | 3-4 天 | P1 | 完整测试覆盖 |
| **阶段 5** | CI/CD 集成 | 1-2 天 | P1 | 持续集成自动化 |
| **总计** | | **10-15 天** | | 完整自动化测试框架 |

---

### 阶段 1：基础设施搭建（1-2 天）

#### 目标
创建可运行的 Playwright 测试环境

#### 任务清单

**Task 1.1：初始化 Node.js 项目**
```bash
cd /Users/tf/Downloads/PIGEON_RACING_TEST_PROJECT
npm init -y
```

**Task 1.2：安装依赖**
```bash
npm install -D @playwright/test typescript @types/node
npx playwright install chromium  # 仅安装 Chromium（可选 firefox, webkit）
```

**Task 1.3：创建 TypeScript 配置**

创建 `tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["tests/**/*"],
  "exclude": ["node_modules"]
}
```

**Task 1.4：创建 Playwright 配置**

创建 `playwright.config.ts`：
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // 超时配置
  timeout: 60 * 1000,           // 每个测试 60 秒
  expect: { timeout: 10000 },   // 断言超时 10 秒

  // 失败重试
  retries: process.env.CI ? 2 : 0,  // CI 环境重试 2 次

  // 并发配置
  workers: process.env.CI ? 1 : 3,  // CI 串行，本地 3 并发

  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  use: {
    // 基础 URL
    baseURL: 'https://skyracing.com.cn',

    // 浏览器选项
    headless: true,
    viewport: { width: 1280, height: 720 },

    // 截图和视频
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // 导航超时
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 可选：多浏览器测试
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],
});
```

**Task 1.5：验证环境**

创建测试文件 `tests/e2e/00-smoke.spec.ts`（冒烟测试）：
```typescript
import { test, expect } from '@playwright/test';

test('smoke test: homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Skyracing GPS pigeon tracker/);

  // 验证至少有赛事卡片
  const cards = page.locator('.race-card, [class*="card"]');
  await expect(cards.first()).toBeVisible({ timeout: 10000 });
});
```

运行测试：
```bash
npx playwright test tests/e2e/00-smoke.spec.ts
```

#### 验收标准
- ✅ `npx playwright test` 可执行
- ✅ 冒烟测试通过
- ✅ 生成 HTML 报告（`playwright-report/index.html`）

---

### 阶段 2：辅助函数开发（2-3 天）

#### 目标
将 `HELPER_FUNCTIONS_DESIGN.md` 中的设计转换为可执行代码

#### 优先级排序

| 模块 | 优先级 | 理由 | 预估时间 |
|------|--------|------|---------|
| **navigation.ts** | P0 | 所有测试的前置依赖 | 4 小时 |
| **mode-switching.ts** | P0 | 包含关键问题解决方案 | 4 小时 |
| **wait-utils.ts** | P0 | 稳定性基础 | 2 小时 |
| **trajectory-utils.ts** | P0 | 核心交互功能 | 4 小时 |
| **validators.ts** | P1 | 提升测试可靠性 | 3 小时 |
| **loft-list.ts** | P1 | 仅 TC-05 需要 | 3 小时 |

#### Task 2.1：创建 navigation.ts（P0）

**位置**：`tests/helpers/navigation.ts`

**核心函数**：
1. `enterFirstRace(page)` - 进入第一个赛事
2. `selectPigeon(page, ringNumber)` - 选择鸽子
3. `viewTrajectory(page)` - 查看轨迹
4. `returnToRaceList(page)` - 返回赛事列表

**实现示例**（基于 HELPER_FUNCTIONS_DESIGN.md）：
```typescript
import { Page, expect } from '@playwright/test';

/**
 * 进入第一个赛事详情页
 * 解决：问题#4（数据加载时序）
 */
export async function enterFirstRace(page: Page): Promise<void> {
  // 等待页面加载完成
  await page.waitForLoadState('networkidle');

  // 等待赛事卡片出现
  const firstRaceCard = page.locator('.race-card, [class*="card"]').first();
  await expect(firstRaceCard).toBeVisible({ timeout: 10000 });

  // 点击"进入"按钮
  const enterButton = firstRaceCard.getByRole('button', { name: /进入|Enter/i });
  await enterButton.click();

  // 等待详情页加载
  await page.waitForLoadState('networkidle');

  // 验证进入成功（鸽子列表出现）
  await expect(page.locator('[type="checkbox"]').first()).toBeVisible({ timeout: 10000 });
}

// ... 其他函数（参考 HELPER_FUNCTIONS_DESIGN.md）
```

#### Task 2.2：创建 mode-switching.ts（P0，关键）

**位置**：`tests/helpers/mode-switching.ts`

**核心函数**：
1. `reload2DTrajectory(page, pigeonIndex, maxRetries)` - **包含问题#1解决方案**
2. `ensure2DStaticMode(page)` - **包含问题#2解决方案**
3. `switchTo3DMode(page)`
4. `ensureDynamicMode(page)`

**实现示例**（基于 KNOWN_ISSUES_SOLUTIONS.md）：
```typescript
import { Page } from '@playwright/test';

/**
 * 重新加载 2D 轨迹数据
 * 解决：问题#1（2D 轨迹初次加载失败）
 * 方案：重新选择鸽子并查看轨迹
 */
export async function reload2DTrajectory(
  page: Page,
  pigeonIndex: number = 0,
  maxRetries: number = 3
): Promise<boolean> {

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 尝试加载 2D 轨迹 (第 ${attempt + 1}/${maxRetries} 次)...`);

      // 步骤1: 返回鸽子列表（如果当前在轨迹视图）
      const backButton = page.getByRole('button', { name: /返回|关闭|close/i });
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();
        await page.waitForTimeout(1000);
      }

      // 步骤2: 取消之前的选择
      const selectedCheckbox = page.locator('input[type="checkbox"]:checked').first();
      if (await selectedCheckbox.isVisible().catch(() => false)) {
        await selectedCheckbox.click();
        await page.waitForTimeout(500);
      }

      // 步骤3: 重新选择鸽子
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      if (checkboxes.length > pigeonIndex) {
        await checkboxes[pigeonIndex].click();
        await page.waitForTimeout(500);
      }

      // 步骤4: 点击查看轨迹
      const viewButton = page.getByRole('button', { name: /查看轨迹|view.*trajectory/i });
      await viewButton.click();

      // 步骤5: 等待数据加载
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 步骤6: 切换到 2D 模式（如果当前不是）
      const button2D = page.getByRole('button', { name: /2d.*模式|2d.*mode/i });
      if (await button2D.isVisible().catch(() => false)) {
        await button2D.click();
        await page.waitForTimeout(2000);
      }

      // 步骤7: 验证地图瓦片和 Canvas 加载
      const tileCount = await page.locator('.amap-container img, .amap-layer img').count();
      const canvas = await page.locator('canvas.amap-layer').count();

      if (tileCount > 50 && canvas > 0) {
        console.log(`✅ 2D 轨迹加载成功！瓦片: ${tileCount}, Canvas: ${canvas}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ 第 ${attempt + 1} 次加载失败:`, error);
    }
  }

  return false;
}

/**
 * 确保处于 2D 静态模式
 * 解决：问题#2（动态/静态模式混淆）
 * 方案：检查轨迹标记数量，区分静态和动态模式
 */
export async function ensure2DStaticMode(page: Page): Promise<boolean> {
  // 检查是否在播放（动态模式特征）
  const pauseButton = page.getByRole('button').filter({ hasText: /pause|暂停/ });
  const isPlaying = await pauseButton.isVisible().catch(() => false);

  if (isPlaying) {
    console.log('⚠️ 当前为 2D 动态模式，切换到静态模式...');

    // 点击 timeline 按钮切换到静态模式
    const timelineButton = page.locator('button:has(img[alt="timeline"])');
    if (await timelineButton.isVisible().catch(() => false)) {
      await timelineButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // 验证静态模式特征：轨迹点数量 >= 3
  const markerCount = await page.locator('[title*="2025-"]').count();

  if (markerCount >= 3) {
    console.log(`✅ 已切换到 2D 静态模式，轨迹点数: ${markerCount}`);
    return true;
  }

  return false;
}

// ... 其他函数
```

**关键区别**：
- **旧方案**（已废弃）：3D→2D 切换序列
- **新方案**（推荐）：重新选择流程 + 区分静态/动态模式

#### Task 2.3：创建 wait-utils.ts（P0）

**位置**：`tests/helpers/wait-utils.ts`

**核心函数**：
1. `waitForMapTilesLoaded(page)` - 等待地图瓦片加载
2. `waitForCesiumReady(page)` - 等待 Cesium 3D 引擎就绪

**实现示例**：
```typescript
import { Page } from '@playwright/test';

/**
 * 等待地图瓦片加载完成
 * 解决：问题#4（数据加载时序问题）
 */
export async function waitForMapTilesLoaded(
  page: Page,
  minTileCount: number = 50,
  maxWaitTime: number = 10000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const tileCount = await page.locator('.amap-container img, .amap-layer img').count();

    if (tileCount >= minTileCount) {
      return true;  // 加载完成
    }

    await page.waitForTimeout(500);  // 等待 500ms 后重试
  }

  return false;  // 超时
}

/**
 * 等待 Cesium 3D 引擎就绪
 */
export async function waitForCesiumReady(page: Page): Promise<boolean> {
  try {
    // 方法 1：检查 Cesium Canvas 元素
    await page.locator('canvas.cesium-widget').waitFor({ timeout: 5000 });

    // 方法 2：等待 Cesium 对象初始化（可选）
    await page.waitForFunction(() => {
      return typeof (window as any).Cesium !== 'undefined';
    }, { timeout: 5000 });

    // 等待初始渲染
    await page.waitForTimeout(2000);

    return true;
  } catch (error) {
    return false;
  }
}
```

#### Task 2.4：创建 trajectory-utils.ts（P0）

**位置**：`tests/helpers/trajectory-utils.ts`

**核心函数**：
1. `clickTrajectoryPoint(page, index)` - **包含问题#3解决方案**
2. `verifyTrajectoryPointInfo(page, expectedData)`
3. `verifyTrajectoryDetailPanel(page)`

**实现示例**：
```typescript
import { Page, expect } from '@playwright/test';

/**
 * 点击轨迹标记点
 * 解决：问题#3（轨迹点点击无响应）
 * 方案：使用 title 属性选择器
 */
export async function clickTrajectoryPoint(
  page: Page,
  index: number = 0
): Promise<void> {
  // 使用 title 属性选择器（基于 EXPLORATION_REPORT 发现）
  const markers = await page.locator('[title*="2025-"]').all();

  if (markers.length === 0) {
    throw new Error('未找到轨迹标记点');
  }

  if (index >= markers.length) {
    throw new Error(`索引 ${index} 超出范围（共 ${markers.length} 个标记）`);
  }

  // 点击指定标记
  await markers[index].click();

  // 等待弹窗或详情更新
  await page.waitForTimeout(500);
}

/**
 * 验证轨迹详情面板显示正确
 */
export async function verifyTrajectoryDetailPanel(page: Page): Promise<void> {
  // 验证右侧详情面板存在
  const detailPanel = page.locator('[class*="detail"], [class*="info-panel"]').first();
  await expect(detailPanel).toBeVisible();

  // 验证关键数据字段（基于 EXPLORATION_REPORT）
  const requiredFields = [
    '公环号', '起点时间', '终点时间', '持续时间',
    '平均分速', '最高分速', '平均高度', '最大高度',
    '实际距离', '直线距离'
  ];

  for (const field of requiredFields) {
    const fieldElement = page.locator(`text=${field}`).first();
    await expect(fieldElement).toBeVisible({ timeout: 5000 });
  }
}
```

#### Task 2.5：创建 validators.ts（P1）

**位置**：`tests/helpers/validators.ts`

**核心函数**：
1. `validatePageLoaded(page)`
2. `validateRaceListPage(page)`
3. `validateTrajectoryViewPage(page)`
4. `validatePlaybackControls(page)`

#### Task 2.6：创建 loft-list.ts（P1）

**位置**：`tests/helpers/loft-list.ts`

**核心函数**：
1. `switchToLoftList(page)`
2. `selectLoft(page, loftName)`
3. `selectMultipleLofts(page, loftNames)`
4. `verifyLoftTrajectories(page, expectedCount)`

#### 验收标准
- ✅ 6 个辅助函数文件全部创建
- ✅ 核心函数（P0）通过单元测试或手动验证
- ✅ 包含完整的 TypeScript 类型注解
- ✅ 包含详细的 JSDoc 注释

---

### 阶段 3：P0 核心测试脚本开发（3-4 天）

#### 目标
实现优先级最高的 19 个测试用例（TC-02, TC-03, TC-04）

#### Task 3.1：实现 02-track-2d-static.spec.ts（P0）

**用例数**：6 个
**参考文档**：TEST_CASES.md - TC-02

**测试文件结构**：
```typescript
import { test, expect } from '@playwright/test';
import { enterFirstRace, selectPigeon, viewTrajectory } from '../helpers/navigation';
import { switchTo2DMode, ensureStaticMode } from '../helpers/mode-switching';
import { clickTrajectoryPoint, verifyTrajectoryDetailPanel } from '../helpers/trajectory-utils';
import { waitForMapTilesLoaded } from '../helpers/wait-utils';

test.describe('TC-02: 2D Static Trajectory Tests @P0', () => {
  test.beforeEach(async ({ page }) => {
    // 前置步骤：进入赛事并选择鸽子
    await page.goto('/');
    await enterFirstRace(page);
    await selectPigeon(page, 1);  // 选择排名第一的鸽子
    await viewTrajectory(page);

    // 切换到 2D 静态模式
    await switchTo2DMode(page);
    await ensureStaticMode(page);
  });

  test('TC-02-001: 2D map tiles load successfully', async ({ page }) => {
    // 验证地图瓦片加载
    const loaded = await waitForMapTilesLoaded(page);
    expect(loaded).toBeTruthy();

    // 验证瓦片数量
    const tileCount = await page.locator('.amap-container img').count();
    expect(tileCount).toBeGreaterThan(50);
  });

  test('TC-02-002: Trajectory line is visible', async ({ page }) => {
    // 验证红色轨迹线显示
    // 注意：轨迹线通过 Canvas 渲染，无法直接定位
    // 方案：检查 Canvas 元素存在 + 截图对比（可选）

    const canvas = page.locator('canvas.amap-layer, canvas[class*="trajectory"]');
    await expect(canvas.first()).toBeVisible();

    // 可选：视觉回归测试
    // await expect(page).toHaveScreenshot('2d-trajectory-line.png');
  });

  test('TC-02-003: Start and end markers are visible', async ({ page }) => {
    // 验证起点和终点标记
    const markers = await page.locator('[title*="2025-"]').all();
    expect(markers.length).toBeGreaterThanOrEqual(2);  // 至少有起点和终点
  });

  test('TC-02-004: Click trajectory point shows info popup', async ({ page }) => {
    // 点击第一个标记点
    await clickTrajectoryPoint(page, 0);

    // 验证信息弹窗或详情更新
    // （具体验证逻辑取决于实际 UI 实现）
    await page.waitForTimeout(500);

    // 示例：验证时间戳显示
    const timestamp = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/').first();
    await expect(timestamp).toBeVisible();
  });

  test('TC-02-005: Trajectory detail panel shows correct data', async ({ page }) => {
    // 验证右侧详情面板
    await verifyTrajectoryDetailPanel(page);
  });

  test('TC-02-006: All trajectory points are in static mode', async ({ page }) => {
    // 验证静态模式（标记点数量 ≥ 3）
    const markerCount = await page.locator('[title*="2025-"]').count();
    expect(markerCount).toBeGreaterThanOrEqual(3);

    // 验证无播放按钮或播放按钮为暂停状态
    const playButton = page.getByRole('button').filter({ hasText: /play_arrow/ });
    await expect(playButton).toBeVisible();  // 显示播放按钮 = 已暂停 = 静态模式
  });
});
```

**预估时间**：6-8 小时

#### Task 3.2：实现 03-track-2d-playback.spec.ts（P0）

**用例数**：7 个
**参考文档**：TEST_CASES.md - TC-03

**测试要点**：
- TC-03-001: 切换到动态模式
- TC-03-002: 播放控制（播放/暂停）
- TC-03-003: 快进功能
- TC-03-004: 快退功能
- TC-03-005: 速度调节
- TC-03-006: 时间进度验证
- TC-03-007: 鸽子标记移动验证

**预估时间**：8-10 小时

#### Task 3.3：实现 04-track-3d-playback.spec.ts（P0）

**用例数**：6 个
**参考文档**：TEST_CASES.md - TC-04
**已验证**：4/6 用例已在 EXPLORATION_REPORT 中验证通过

**测试要点**：
- TC-04-001: 切换到 3D 模式 ✅ 已验证
- TC-04-002: Cesium 引擎加载 ✅ 已验证（自动播放）
- TC-04-003: 3D 播放控制 ✅ 已验证
- TC-04-004: 视角切换 ✅ 已验证
- TC-04-005: 显示轨迹点开关 ⏭️ 未验证
- TC-04-006: 3D 视觉验证 ✅ 间接验证

**实现示例**（部分）：
```typescript
test('TC-04-002: 3D mode auto-plays trajectory @P0', async ({ page }) => {
  // 新发现：3D 视图自动开始播放（EXPLORATION_REPORT 发现）
  await switchTo3DMode(page);

  // 验证自动播放
  const pauseButton = page.getByRole('button').filter({ hasText: /pause/ });
  await expect(pauseButton).toBeVisible({ timeout: 5000 });

  // 验证时间前进
  const initialTime = await page.locator('[class*="current-time"]').textContent();
  await page.waitForTimeout(2000);
  const updatedTime = await page.locator('[class*="current-time"]').textContent();

  expect(initialTime).not.toBe(updatedTime);  // 时间应该改变
});
```

**预估时间**：6-8 小时

#### 验收标准
- ✅ 3 个测试文件全部创建
- ✅ 19 个 P0 测试用例全部通过
- ✅ 测试执行时间 < 10 分钟
- ✅ 生成完整的 HTML 测试报告

---

### 阶段 4：P1/P2 补充测试脚本开发（3-4 天）

#### 目标
实现剩余的 19 个测试用例（TC-01, TC-05, TC-06, TC-07）

#### Task 4.1：实现 01-race-list.spec.ts（P1）

**用例数**：5 个
**参考文档**：TEST_CASES.md - TC-01

**测试要点**：
- TC-01-001: 首页加载验证
- TC-01-002: 赛事卡片数量 ≥ 10
- TC-01-003: 赛事信息完整性
- TC-01-004: 进入赛事详情
- TC-01-005: 赛事搜索/筛选（如果有）

**预估时间**：4-5 小时

#### Task 4.2：实现 05-loft-list.spec.ts（P1）

**用例数**：4 个
**参考文档**：TEST_CASES.md - TC-05

**测试要点**：
- TC-05-001: 切换到鸽舍列表
- TC-05-002: 选择鸽舍
- TC-05-003: 多鸽子轨迹比较
- TC-05-004: 鸽舍轨迹详情

**预估时间**：5-6 小时

#### Task 4.3：实现 06-trajectory-detail.spec.ts（P1）

**用例数**：4 个
**参考文档**：TEST_CASES.md - TC-06

**测试要点**：
- TC-06-001: 轨迹详情面板数据准确性
- TC-06-002: 航点表格显示
- TC-06-003: 数据导出功能（如果有）
- TC-06-004: 详情面板交互

**预估时间**：4-5 小时

#### Task 4.4：实现 07-ui-elements.spec.ts（P2）

**用例数**：6 个
**参考文档**：TEST_CASES.md - TC-07

**测试要点**：
- TC-07-001: 按钮状态反馈
- TC-07-002: 工具提示显示
- TC-07-003: 错误提示
- TC-07-004: 加载动画
- TC-07-005: 响应式布局
- TC-07-006: 快捷键支持（如果有）

**预估时间**：5-6 小时

#### 验收标准
- ✅ 4 个测试文件全部创建
- ✅ 19 个测试用例全部通过
- ✅ 总测试覆盖率达到 100%（38/38 用例）

---

### 阶段 5：CI/CD 集成（1-2 天）

#### 目标
配置 GitHub Actions 实现持续集成自动化

#### Task 5.1：创建 GitHub Actions 工作流

**位置**：`.github/workflows/playwright.yml`

**配置内容**：
```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    # 每日早上 8:00 (UTC) 运行
    - cron: '0 8 * * *'
  workflow_dispatch:  # 手动触发

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    strategy:
      matrix:
        shard: [1, 2, 3]  # 分片并行执行

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shard }}/3
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-videos-${{ matrix.shard }}
          path: test-results/
          retention-days: 7

  merge-reports:
    if: always()
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: Download all reports
        uses: actions/download-artifact@v4
        with:
          path: all-reports

      - name: Merge reports
        run: npx playwright merge-reports --reporter html all-reports

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 30
```

#### Task 5.2：配置测试报告发布（可选）

**方案 A：GitHub Pages**
```yaml
- name: Deploy to GitHub Pages
  if: always()
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./playwright-report
```

**方案 B：Slack 通知**
```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Playwright tests failed on ${{ github.ref }}"
      }
```

#### Task 5.3：配置 PR 检查

确保 Pull Request 必须通过测试才能合并：

1. 在 GitHub 仓库设置中启用 **Branch Protection Rules**
2. 要求 `Playwright Tests` 状态检查通过
3. 可选：要求至少 1 个审核批准

#### 验收标准
- ✅ GitHub Actions 工作流成功运行
- ✅ PR 触发自动测试
- ✅ 每日定时测试执行
- ✅ 测试报告自动上传

---

## 技术架构

### 技术选型

| 组件 | 选择 | 版本 | 理由 |
|-----|------|------|------|
| **测试框架** | Playwright | ^1.40.0 | 跨浏览器、快速、稳定 |
| **语言** | TypeScript | ^5.0.0 | 类型安全、IDE 支持好 |
| **CI/CD** | GitHub Actions | - | 免费、易集成 |
| **报告** | HTML Reporter | 内置 | 可视化、易分享 |
| **浏览器** | Chromium | 内置 | 与生产环境一致 |

### 配置策略

#### 超时配置
```typescript
{
  timeout: 60000,           // 单个测试 60 秒
  expect: { timeout: 10000 }, // 断言 10 秒
  navigationTimeout: 30000,   // 页面导航 30 秒
  actionTimeout: 10000        // 操作 10 秒
}
```

#### 重试策略
- **本地环境**：不重试（快速失败，便于调试）
- **CI 环境**：重试 2 次（减少偶发性失败）

#### 并发策略
- **本地环境**：3 个 worker（充分利用 CPU）
- **CI 环境**：1 个 worker（避免资源竞争）
- **可选**：使用 sharding 分片并行执行（`--shard=1/3`）

#### 截图和视频
- **截图**：仅失败时（`screenshot: 'only-on-failure'`）
- **视频**：仅失败时（`video: 'retain-on-failure'`）
- **Trace**：仅失败时（`trace: 'retain-on-failure'`）

---

## 关键挑战与解决方案

### 挑战 1：2D 轨迹初次加载失败

**问题描述**：
首次查看轨迹时，2D 模式下轨迹线不显示或地图瓦片未加载（gpx2d 数据未就绪）

**原因分析**：
API 加载时未等候响应即渲染地图，导致首次查看时数据可能未完全加载

**解决方案**：
使用 **重新选择流程**（已在 `mode-switching.ts` 中实现）

**核心方法**：
1. 返回鸽子列表
2. 取消之前的选择
3. 重新选择鸽子
4. 点击查看轨迹
5. 等待数据加载（networkidle + 3秒缓冲）
6. 验证地图瓦片和 Canvas 图层

**关键点**：
- **区分 2D 静态和动态模式**：静态模式显示完整轨迹（≥3 个轨迹点），动态模式播放动画（<3 个轨迹点）
- **重试机制**：最多重试 3 次
- **验证标准**：地图瓦片 >50 个 + Canvas 图层存在

**参考文档**：
`KNOWN_ISSUES_SOLUTIONS.md` - 问题#1

**验证状态**：
✅ 新方案已更新（旧的 3D→2D 切换方案已废弃）

---

### 挑战 2：动态/静态模式混淆

**问题描述**：
无法区分当前是静态模式（所有轨迹点显示）还是动态模式（播放动画）

**原因分析**：
UI 按钮状态不明确，需要额外验证逻辑

**解决方案**：
**检查轨迹标记数量**
- 静态模式：标记数量 ≥ 3（多个航点）
- 动态模式：标记数量 = 1（当前位置）

**参考文档**：
`KNOWN_ISSUES_SOLUTIONS.md` - 问题#2

**实现代码**：
参见 `mode-switching.ts` 中的 `ensureStaticMode()` 函数

---

### 挑战 3：轨迹点点击无响应

**问题描述**：
使用常规 DOM 选择器无法定位轨迹标记点

**原因分析**：
轨迹标记通过 **Canvas/AMap API** 渲染，不是普通 DOM 元素

**解决方案**：
使用 **title 属性选择器**：`[title*="2025-"]`

**参考文档**：
`KNOWN_ISSUES_SOLUTIONS.md` - 问题#3

**实现代码**：
```typescript
const markers = await page.locator('[title*="2025-"]').all();
await markers[index].click();
```

**验证状态**：
✅ 已验证有效（EXPLORATION_REPORT）

---

### 挑战 4：数据加载时序问题

**问题描述**：
页面元素出现时，后端数据可能尚未完全加载

**原因分析**：
异步数据加载，`waitForSelector` 不足以保证数据就绪

**解决方案**：
**多层等待策略**
1. `waitForLoadState('networkidle')` - 等待网络空闲
2. 等待关键元素可见
3. 增加短暂固定延迟（1-2 秒）
4. 使用重试机制

**参考文档**：
`KNOWN_ISSUES_SOLUTIONS.md` - 问题#4

**实现代码**：
参见 `wait-utils.ts` 中的 `waitForMapTilesLoaded()` 函数

---

### 挑战 5：Canvas 渲染元素的视觉验证

**问题描述**：
轨迹线通过 Canvas 绘制，无法使用 DOM 断言验证

**解决方案**：
**方案 A**：视觉回归测试（截图对比）
```typescript
await expect(page).toHaveScreenshot('trajectory-line.png', {
  maxDiffPixels: 100  // 允许 100 像素差异
});
```

**方案 B**：间接验证（检查 Canvas 元素 + 数据 API）
```typescript
// 验证 Canvas 存在
await expect(page.locator('canvas.amap-layer')).toBeVisible();

// 验证数据已加载（通过 API 响应或元素状态）
const tileCount = await page.locator('.amap-container img').count();
expect(tileCount).toBeGreaterThan(50);
```

**推荐**：
优先使用方案 B（更稳定），必要时结合方案 A

---

## 投入估算

### 时间投入

| 阶段 | 工作内容 | 预估时间 | 依赖 | 风险 |
|-----|---------|---------|------|------|
| **阶段 1** | 基础设施搭建 | 1-2 天 | 无 | 低 |
| **阶段 2** | 辅助函数开发 | 2-3 天 | 阶段 1 | 中 |
| **阶段 3** | P0 测试脚本 | 3-4 天 | 阶段 2 | 中 |
| **阶段 4** | P1/P2 测试脚本 | 3-4 天 | 阶段 3 | 低 |
| **阶段 5** | CI/CD 集成 | 1-2 天 | 阶段 3 | 低 |
| **缓冲时间** | 调试、优化 | 2-3 天 | - | - |
| **总计** | | **12-18 天** | | |

**人力配置建议**：
- **1 人全职**：12-18 天
- **2 人协作**：7-10 天（阶段 2-4 可并行）

### 成本估算

| 类型 | 项目 | 成本 | 说明 |
|-----|------|------|------|
| **软件成本** | Playwright | $0 | 开源免费 |
| | GitHub Actions | $0 | 公开仓库免费 |
| | Node.js + TypeScript | $0 | 开源免费 |
| **人力成本** | 开发工程师 | 根据薪资 | 12-18 天工作量 |
| **基础设施** | CI/CD 运行时间 | $0-$50/月 | GitHub Actions 有免费额度 |
| **总计** | | **人力成本为主** | 软件成本可忽略 |

### 技能要求

#### 必需技能
- ✅ TypeScript 基础语法
- ✅ Playwright 基本操作（`page.goto`, `page.click`, `expect`）
- ✅ 异步编程（`async/await`, Promise）
- ✅ DOM 操作和选择器（CSS selector, XPath）
- ✅ Git 版本控制

#### 可选技能
- 🔶 GitHub Actions 配置（阶段 5 需要）
- 🔶 高德地图 API 了解（帮助理解 2D 渲染）
- 🔶 Cesium 3D 引擎了解（帮助理解 3D 渲染）
- 🔶 Canvas API 基础（帮助处理 Canvas 元素）

#### 学习资源
- [Playwright 官方文档](https://playwright.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## 成功指标

### 功能指标

| 指标 | 目标值 | 验收标准 |
|-----|--------|---------|
| **测试覆盖率** | 100% | 38/38 测试用例全部实现 |
| **测试通过率** | ≥ 95% | 首次运行通过率 |
| **执行时间** | ≤ 10 分钟 | 本地完整测试套件 |
| **CI 执行时间** | ≤ 15 分钟 | 包括环境准备 |

### 质量指标

| 指标 | 目标值 | 验收标准 |
|-----|--------|---------|
| **代码覆盖率** | N/A | （仅测试代码，无覆盖率要求） |
| **Flaky 测试率** | ≤ 5% | 连续 10 次运行，失败率 < 5% |
| **代码审查** | 100% | 所有代码经过 review |
| **文档完整性** | 100% | 所有函数有 JSDoc 注释 |

### 自动化指标

| 指标 | 目标值 | 验收标准 |
|-----|--------|---------|
| **CI/CD 集成** | ✅ | GitHub Actions 正常运行 |
| **自动化程度** | 100% | 无需人工参与执行 |
| **报告生成** | 自动 | HTML 报告自动生成 |
| **失败通知** | 自动 | PR 状态检查 + 可选邮件/Slack |

### 维护指标

| 指标 | 目标值 | 说明 |
|-----|--------|------|
| **维护成本** | ≤ 2 小时/周 | 用于更新测试和修复问题 |
| **新增用例成本** | ≤ 1 小时/用例 | 基于辅助函数库 |
| **回归测试频率** | 每日 + 每次 PR | 自动触发 |

---

## 风险管理

### 风险识别

| 风险 | 概率 | 影响 | 风险等级 | 缓解措施 |
|-----|------|------|---------|---------|
| **网站 UI 变更** | 中 | 高 | 🟡 中高 | • 使用语义化选择器（role, label）<br>• 建立 Page Object 模式<br>• 定期维护测试 |
| **API 变更** | 低 | 高 | 🟡 中 | • 监控 API 响应格式<br>• 添加 API 版本检查 |
| **Canvas 渲染变化** | 中 | 中 | 🟡 中 | • 使用间接验证<br>• 视觉回归测试作为备选 |
| **测试不稳定（Flaky）** | 高 | 中 | 🟡 中高 | • 增加智能等待<br>• 使用重试机制<br>• 定期审查失败日志 |
| **性能下降** | 低 | 低 | 🟢 低 | • 并发执行<br>• 分片测试 |
| **人员流失** | 中 | 中 | 🟡 中 | • 完善文档<br>• 代码注释清晰 |

### 应对策略

#### 策略 1：选择器鲁棒性

**问题**：UI 变更导致选择器失效

**解决方案**：
1. **优先级排序**：
   - Role-based: `getByRole('button', { name: '进入' })`
   - Label-based: `getByLabel('公环号')`
   - Text-based: `getByText('查看轨迹')`
   - CSS class: `.race-card`（最后选择）

2. **避免脆弱选择器**：
   ```typescript
   // ❌ 不推荐：依赖具体 class 名称
   page.locator('.MuiButton-root-123')

   // ✅ 推荐：使用语义化选择器
   page.getByRole('button', { name: /进入|Enter/i })
   ```

#### 策略 2：测试隔离

**问题**：测试之间相互影响

**解决方案**：
- 每个测试独立初始化状态（`beforeEach`）
- 避免共享可变状态
- 使用不同的测试数据

#### 策略 3：定期维护

**频率**：每月或每季度

**内容**：
- 审查并更新失效的选择器
- 移除过时的测试用例
- 优化执行时间
- 更新依赖版本

---

## 参考文档

### 内部文档

| 文档名称 | 路径 | 用途 |
|---------|------|------|
| **测试用例规格** | `docs/test-plan/TEST_CASES.md` | 测试脚本开发参考 |
| **辅助函数设计** | `docs/test-plan/HELPER_FUNCTIONS_DESIGN.md` | 辅助函数实现参考 |
| **已知问题解决方案** | `docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md` | 问题修复参考 |
| **探索测试报告** | `docs/test-plan/EXPLORATION_REPORT_v1.0.0_20251117.md` | 实战经验参考 |
| **自动化探索计划** | `docs/test-plan/AUTOMATED_EXPLORATION_PLAN.md` | 执行策略参考 |

### 外部资源

| 资源 | 链接 | 说明 |
|-----|------|------|
| **Playwright 官方文档** | https://playwright.dev/ | API 参考、最佳实践 |
| **TypeScript 手册** | https://www.typescriptlang.org/docs/ | 语法参考 |
| **GitHub Actions 文档** | https://docs.github.com/en/actions | CI/CD 配置 |
| **高德地图 API** | https://lbs.amap.com/ | 2D 地图交互 |
| **Cesium 文档** | https://cesium.com/docs/ | 3D 引擎了解 |

---

## 附录

### 附录 A：快速开始指南

#### 本地环境准备

```bash
# 1. 克隆仓库（或进入项目目录）
cd /Users/tf/Downloads/PIGEON_RACING_TEST_PROJECT

# 2. 安装依赖（阶段 1 完成后）
npm install

# 3. 安装浏览器
npx playwright install chromium

# 4. 运行测试
npm test                  # 运行所有测试
npm run test:p0           # 仅运行 P0 测试
npm run test:headed       # 有头模式（可见浏览器）
npm run test:debug        # 调试模式

# 5. 查看报告
npm run test:report       # 打开 HTML 报告
```

#### 调试单个测试

```bash
# 方法 1：使用 --grep 过滤
npx playwright test --grep "TC-02-001"

# 方法 2：指定文件
npx playwright test tests/e2e/02-track-2d-static.spec.ts

# 方法 3：调试模式（逐步执行）
npx playwright test --debug tests/e2e/02-track-2d-static.spec.ts
```

---

### 附录 B：常见问题 FAQ

#### Q1: 测试失败时如何调试？

**A**: 使用以下步骤：
1. 查看截图：`test-results/*/test-failed-1.png`
2. 观看失败视频：`test-results/*/video.webm`
3. 使用调试模式：`npx playwright test --debug`
4. 查看 trace：`npx playwright show-trace trace.zip`

#### Q2: 如何处理 Flaky 测试？

**A**:
1. 增加等待时间：使用 `waitForMapTilesLoaded()` 等智能等待
2. 增加重试次数：`test.describe.configure({ retries: 2 })`
3. 添加日志：`console.log()` 记录关键步骤
4. 隔离测试：确保测试独立性

#### Q3: 测试执行太慢怎么办？

**A**:
1. 并行执行：`npx playwright test --workers=3`
2. 仅运行 P0 测试：`npm run test:p0`
3. 使用分片：`npx playwright test --shard=1/3`
4. 优化等待时间：减少不必要的 `waitForTimeout`

#### Q4: 如何添加新的测试用例？

**A**:
1. 在相应的 `.spec.ts` 文件中添加 `test()` 块
2. 复用辅助函数（`helpers/` 目录）
3. 参考现有用例的结构
4. 添加适当的标签（如 `@P0`, `@P1`）

---

### 附录 C：版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|------|
| v1.0.0 | 2025-11-17 | 初始版本，完整实施计划 | 测试自动化团队 |

---

### 附录 D：术语表

| 术语 | 解释 |
|-----|------|
| **P0/P1/P2** | 测试用例优先级（P0 最高） |
| **Flaky Test** | 间歇性失败的不稳定测试 |
| **Fixture** | Playwright 测试固定装置，用于共享设置 |
| **Sharding** | 将测试分片并行执行，提高速度 |
| **Trace** | Playwright 录制的详细执行轨迹 |
| **Headless** | 无头模式（不显示浏览器窗口） |
| **Headed** | 有头模式（显示浏览器窗口） |
| **CI/CD** | 持续集成/持续部署 |

---

## 总结

本实施计划提供了将现有测试规格转换为完全自动化 Playwright 测试框架的详细路径。通过 5 个阶段的系统化实施，预计在 **10-15 天**内完成：

✅ **38 个测试用例**全部自动化
✅ **执行时间**从 25 分钟降至 **5-10 分钟**
✅ **人工参与**从 100% 降至 **0%**
✅ **CI/CD 集成**，实现每日自动回归测试

**立即开始**：按照阶段 1 的任务清单，创建基础设施并运行第一个冒烟测试！

---

**文档维护**：本文档应随项目进展更新，记录实际执行中的变更和发现。

**反馈渠道**：如有问题或建议，请在项目仓库提交 Issue 或 PR。
