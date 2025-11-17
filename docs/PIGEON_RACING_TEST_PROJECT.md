# 賽鴿追蹤系統 - 前端回歸測試專案

> 使用 Playwright MCP + Midscene.js 建立智能化的前端測試流程
> 
> 專案目標：自動檢測異常數據、驗證 UI 功能、確保地圖渲染正確

---

## 📋 專案概述

### 測試目標
- ✅ 檢測飛行數據異常（如：實際距離 46168 km、實際分速 106529 m/Min）
- ✅ 驗證地圖正確渲染和飛行路徑顯示
- ✅ 確保航點數據的連續性和邏輯一致性
- ✅ 跨瀏覽器兼容性測試
- ✅ 視覺回歸測試

### 技術棧
- Playwright (功能測試，基於 accessibility tree)
- Midscene.js + UI-TARS/Qwen-VL (視覺驗證)
- TypeScript (類型安全)
- GitHub Actions (CI/CD)

---

## 🏗️ 專案結構

```
pigeon-race-testing/
├── .github/
│   └── workflows/
│       └── e2e-tests.yml          # CI/CD 配置
├── config/
│   ├── playwright.config.ts       # Playwright 配置
│   └── midscene.config.ts         # Midscene 配置
├── tests/
│   ├── e2e/
│   │   ├── 01-page-load.spec.ts              # 頁面載入測試
│   │   ├── 02-flight-data-validation.spec.ts  # 飛行數據驗證
│   │   └── 03-waypoints-validation.spec.ts    # 航點數據測試
│   ├── visual/
│   │   ├── map-rendering.spec.ts    # 地圖渲染測試
│   │   └── ui-consistency.spec.ts   # UI 一致性測試
│   ├── validators/
│   │   ├── flight-data-validator.ts  # 飛行數據驗證器
│   │   └── data-rules.ts            # 驗證規則定義
│   └── utils/
│       ├── data-extractors.ts       # 數據提取工具
│       └── helpers.ts               # 輔助函數
├── reports/                         # 測試報告目錄
├── screenshots/                     # 截圖基準
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 📦 安裝與設置

### 步驟 1: 初始化專案

```bash
# 建立專案目錄
mkdir pigeon-race-testing
cd pigeon-race-testing

# 初始化 npm 專案
npm init -y

# 安裝依賴
npm install --save-dev \
  @playwright/test@latest \
  typescript@latest \
  @types/node@latest \
  dotenv@latest

# 安裝 Midscene（可選，用於視覺測試）
npm install --save-dev midscene

# 初始化 TypeScript
npx tsc --init
```

### 步驟 2: 配置 Playwright MCP（Claude Code）

```bash
# 在 Claude Code 中添加 Playwright MCP
claude mcp add-json playwright '{
  "type": "stdio",
  "command": "npx",
  "args": ["@playwright/mcp@latest", "--headless"]
}' --scope user

# 驗證安裝
claude mcp list
```

---

## 📄 配置文件

### `package.json`

```json
{
  "name": "pigeon-race-testing",
  "version": "1.0.0",
  "description": "賽鴿追蹤系統前端回歸測試",
  "scripts": {
    "test": "playwright test",
    "test:e2e": "playwright test tests/e2e",
    "test:visual": "playwright test tests/visual",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "report": "playwright show-report reports/html",
    "validate": "tsc --noEmit"
  },
  "keywords": ["testing", "e2e", "playwright", "racing-pigeon"],
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^22.0.0",
    "dotenv": "^16.4.5",
    "midscene": "^0.5.0",
    "typescript": "^5.6.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["tests/**/*", "config/**/*"],
  "exclude": ["node_modules", "dist", "reports"]
}
```

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: 'https://jxl.skyracing.com.cn',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

### `.env.example`

```bash
# API Keys for Midscene.js
OPENAI_API_KEY=your_openai_key_here
MIDSCENE_MODEL_NAME=qwen-vl-max-latest
MIDSCENE_USE_QWEN_VL=1

# Test Configuration
BASE_URL=https://jxl.skyracing.com.cn
TEST_TIMEOUT=30000

# Notification Webhooks (Optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

---

## 🧪 測試文件

### `tests/validators/data-rules.ts`

```typescript
/**
 * 飛行數據驗證規則
 * 定義所有合理的數值範圍
 */

export interface FlightDataRules {
  avgSpeed: { min: number; max: number };        // 平均分速 (m/Min)
  maxSpeed: { min: number; max: number };        // 最高分速
  avgAltitude: { min: number; max: number };     // 平均高度 (m)
  maxAltitude: { min: number; max: number };     // 最大高度
  actualDistance: { min: number; max: number };  // 實際距離 (km)
  straightDistance: { min: number; max: number };// 直線距離 (km)
}

/**
 * 標準驗證規則
 * 基於賽鴿實際飛行特性設定
 */
export const STANDARD_RULES: FlightDataRules = {
  avgSpeed: { min: 800, max: 2000 },           // 賽鴿平均速度範圍
  maxSpeed: { min: 1000, max: 2500 },          // 最高速度範圍
  avgAltitude: { min: 0, max: 3000 },          // 平均飛行高度
  maxAltitude: { min: 0, max: 5000 },          // 最大飛行高度
  actualDistance: { min: 1, max: 1000 },       // 實際距離（公里）
  straightDistance: { min: 1, max: 800 },      // 直線距離
};

/**
 * 寬鬆規則（用於特殊賽事）
 */
export const RELAXED_RULES: FlightDataRules = {
  avgSpeed: { min: 500, max: 2500 },
  maxSpeed: { min: 800, max: 3000 },
  avgAltitude: { min: 0, max: 4000 },
  maxAltitude: { min: 0, max: 6000 },
  actualDistance: { min: 1, max: 1500 },
  straightDistance: { min: 1, max: 1200 },
};
```

### `tests/validators/flight-data-validator.ts`

```typescript
import { STANDARD_RULES, FlightDataRules } from './data-rules';

export interface FlightData {
  avgSpeed: number;
  maxSpeed: number;
  avgAltitude: number;
  maxAltitude: number;
  actualDistance: number;
  actualSpeed: number;
  straightDistance: number;
  straightSpeed: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: FlightData;
}

export class FlightDataValidator {
  constructor(private rules: FlightDataRules = STANDARD_RULES) {}

  validate(data: FlightData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 基本範圍驗證
    this.validateRange(
      data.avgSpeed, 
      this.rules.avgSpeed, 
      '平均分速', 
      'm/Min', 
      errors
    );

    this.validateRange(
      data.maxSpeed, 
      this.rules.maxSpeed, 
      '最高分速', 
      'm/Min', 
      errors
    );

    this.validateRange(
      data.avgAltitude, 
      this.rules.avgAltitude, 
      '平均高度', 
      'm', 
      errors
    );

    this.validateRange(
      data.maxAltitude, 
      this.rules.maxAltitude, 
      '最大高度', 
      'm', 
      errors
    );

    // 🔥 關鍵：異常距離檢測
    if (data.actualDistance < this.rules.actualDistance.min || 
        data.actualDistance > this.rules.actualDistance.max) {
      errors.push(
        `⚠️ 實際距離 ${data.actualDistance.toFixed(2)} km 異常！` +
        `正常範圍: [${this.rules.actualDistance.min}, ${this.rules.actualDistance.max}] km`
      );
    }

    if (data.straightDistance < this.rules.straightDistance.min || 
        data.straightDistance > this.rules.straightDistance.max) {
      errors.push(
        `直線距離 ${data.straightDistance.toFixed(2)} km 超出範圍 ` +
        `[${this.rules.straightDistance.min}, ${this.rules.straightDistance.max}] km`
      );
    }

    // 🔥 實際分速異常檢測（會抓到 106529.36 這類問題）
    if (data.actualSpeed > 10000) {
      errors.push(
        `⚠️ 實際分速 ${data.actualSpeed.toFixed(2)} m/Min 嚴重異常！` +
        `可能是計算錯誤或數據損壞`
      );
    }

    // 2. 數據邏輯關聯驗證
    if (data.avgSpeed > data.maxSpeed) {
      errors.push(
        `邏輯錯誤：平均分速 (${data.avgSpeed}) > 最高分速 (${data.maxSpeed})`
      );
    }

    if (data.avgAltitude > data.maxAltitude) {
      errors.push(
        `邏輯錯誤：平均高度 (${data.avgAltitude}) > 最大高度 (${data.maxAltitude})`
      );
    }

    if (data.actualDistance < data.straightDistance) {
      warnings.push(
        `實際距離 (${data.actualDistance.toFixed(2)} km) < ` +
        `直線距離 (${data.straightDistance.toFixed(2)} km)，可能有誤`
      );
    }

    // 3. 距離比例驗證
    const distanceRatio = data.actualDistance / data.straightDistance;
    if (distanceRatio > 2.5) {
      warnings.push(
        `實際距離是直線距離的 ${distanceRatio.toFixed(2)} 倍，` +
        `路徑可能過於彎曲`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data,
    };
  }

  private validateRange(
    value: number,
    range: { min: number; max: number },
    label: string,
    unit: string,
    errors: string[]
  ): void {
    if (value < range.min || value > range.max) {
      errors.push(
        `${label} ${value} ${unit} 超出合理範圍 [${range.min}, ${range.max}] ${unit}`
      );
    }
  }
}
```

### `tests/utils/data-extractors.ts`

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * 從頁面中提取數值
 * 使用 accessibility tree 確保低 token 消耗
 */
export async function extractNumber(
  page: Page,
  label: string,
  unit?: string
): Promise<number> {
  try {
    // 嘗試找到包含標籤的元素
    const locator = page.locator(`text=${label}`).first();
    const container = locator.locator('..'); // 父元素
    const text = await container.textContent();

    if (!text) return 0;

    // 提取數字（支援小數點和逗號分隔符）
    const match = text.match(/[\d,]+\.?\d*/);
    if (!match) return 0;

    const numStr = match[0].replace(/,/g, '');
    return parseFloat(numStr);
  } catch (error) {
    console.warn(`無法提取 ${label}:`, error);
    return 0;
  }
}

/**
 * 提取完整的飛行數據
 */
export async function extractFlightData(page: Page) {
  await page.waitForSelector('text=飛行數據', { timeout: 10000 });

  return {
    avgSpeed: await extractNumber(page, '平均分速', 'm/Min'),
    maxSpeed: await extractNumber(page, '最高分速', 'm/Min'),
    avgAltitude: await extractNumber(page, '平均高度', 'm'),
    maxAltitude: await extractNumber(page, '最大高度', 'm'),
    actualDistance: await extractNumber(page, '實際距離', 'km'),
    actualSpeed: await extractNumber(page, '實際分速', 'm/Min'),
    straightDistance: await extractNumber(page, '直線距離', 'km'),
    straightSpeed: await extractNumber(page, '直線分速', 'm/Min'),
  };
}

/**
 * 提取航點表格數據
 */
export interface Waypoint {
  point: number;
  time: string;
  duration: string;
  distance: number;
  altitude: number;
  speed: number;
}

export async function extractWaypoints(page: Page): Promise<Waypoint[]> {
  return await page.locator('table tbody tr').evaluateAll(rows => {
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return {
        point: parseInt(cells[0]?.textContent || '0'),
        time: cells[1]?.textContent?.trim() || '',
        duration: cells[2]?.textContent?.trim() || '',
        distance: parseFloat(cells[3]?.textContent || '0'),
        altitude: parseFloat(cells[4]?.textContent || '0'),
        speed: parseFloat(cells[5]?.textContent || '0'),
      };
    });
  });
}
```

### `tests/utils/helpers.ts`

```typescript
/**
 * 將時間字串轉換為秒數
 * @param timeStr 格式: "HH:MM:SS"
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 3) return 0;
  
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
}

/**
 * 驗證時間序列是否遞增
 */
export function isTimeIncreasing(times: string[]): boolean {
  for (let i = 1; i < times.length; i++) {
    const prev = parseTime(times[i - 1]);
    const curr = parseTime(times[i]);
    if (curr < prev) return false;
  }
  return true;
}

/**
 * 計算兩點之間的距離差
 */
export function calculateDistanceDiff(
  point1: { distance: number },
  point2: { distance: number }
): number {
  return Math.abs(point2.distance - point1.distance);
}

/**
 * 生成測試報告摘要
 */
export function generateSummary(results: any[]): string {
  const total = results.length;
  const passed = results.filter(r => r.isValid).length;
  const failed = total - passed;
  
  return `
測試摘要
========
總計: ${total}
通過: ${passed} ✅
失敗: ${failed} ❌
通過率: ${((passed / total) * 100).toFixed(2)}%
  `.trim();
}
```

### `tests/e2e/01-page-load.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('賽鴿追蹤頁面 - 基礎功能', () => {
  
  test.beforeEach(async ({ page }) => {
    // 可以在這裡設置測試前的準備工作
    await page.goto('/');
  });

  test('應該正確載入頁面並顯示所有關鍵元素', async ({ page }) => {
    // 等待地圖容器出現
    await page.waitForSelector('.map-container, canvas, [class*="map"]', { 
      timeout: 15000 
    });
    
    // 驗證頂部資訊欄
    await expect(page.locator('text=/版權|copyright/i')).toBeVisible();
    
    // 驗證地圖控制元件
    const threeDButton = page.locator('button:has-text("3D"), [aria-label*="3D"]');
    if (await threeDButton.count() > 0) {
      await expect(threeDButton.first()).toBeVisible();
    }
    
    // 驗證選單按鈕
    const menuButton = page.locator('button[class*="menu"], .menu-button, [aria-label*="menu"]');
    if (await menuButton.count() > 0) {
      await expect(menuButton.first()).toBeVisible();
    }
    
    // 驗證飛行數據區塊
    await expect(page.locator('text=飛行數據')).toBeVisible({ timeout: 10000 });
    
    // 驗證航點表格
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const rows = await table.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    
    console.log(`✅ 頁面載入成功，發現 ${rows} 個航點`);
  });

  test('應該在合理時間內載入完成', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('text=飛行數據', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ 頁面載入時間: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 應在 10 秒內載入
  });

  test('應該正確顯示賽事編號', async ({ page }) => {
    await page.goto('/');
    
    // 查找包含日期格式的賽事編號
    const raceIdLocator = page.locator('text=/20\\d{2}-\\d{2}-\\d{7}/');
    
    if (await raceIdLocator.count() > 0) {
      const raceId = await raceIdLocator.first().textContent();
      console.log(`🏁 賽事編號: ${raceId}`);
      expect(raceId).toMatch(/20\d{2}-\d{2}-\d{7}/);
    } else {
      console.warn('⚠️ 未找到賽事編號');
    }
  });

  test('應該正確顯示地圖', async ({ page }) => {
    await page.goto('/');
    
    // 等待地圖相關元素
    const mapSelectors = [
      'canvas',
      '[class*="map"]',
      '[id*="map"]',
      '.leaflet-container',
      '.mapboxgl-canvas'
    ];
    
    let mapFound = false;
    for (const selector of mapSelectors) {
      if (await page.locator(selector).count() > 0) {
        mapFound = true;
        console.log(`✅ 找到地圖元素: ${selector}`);
        break;
      }
    }
    
    expect(mapFound).toBe(true);
  });
});
```

### `tests/e2e/02-flight-data-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { FlightDataValidator } from '../validators/flight-data-validator';
import { extractFlightData } from '../utils/data-extractors';

test.describe('飛行數據驗證', () => {
  
  test('應該提取並驗證所有飛行統計數據', async ({ page }) => {
    await page.goto('/');
    
    // 提取飛行數據
    const flightData = await extractFlightData(page);
    
    console.log('📊 提取的飛行數據:');
    console.log(JSON.stringify(flightData, null, 2));

    // 執行驗證
    const validator = new FlightDataValidator();
    const result = validator.validate(flightData);

    // 顯示警告
    if (result.warnings.length > 0) {
      console.warn('⚠️ 警告:');
      result.warnings.forEach(w => console.warn(`  - ${w}`));
    }

    // 顯示錯誤
    if (!result.isValid) {
      console.error('❌ 驗證失敗:');
      result.errors.forEach(e => console.error(`  - ${e}`));
    }

    // 測試斷言
    expect(result.isValid, 
      `數據驗證失敗:\n${result.errors.join('\n')}`
    ).toBe(true);
  });

  test('各項數據應在合理範圍內', async ({ page }) => {
    await page.goto('/');
    const data = await extractFlightData(page);

    // 基本範圍檢查
    expect(data.avgSpeed).toBeGreaterThan(0);
    expect(data.avgSpeed).toBeLessThanOrEqual(3000);
    
    expect(data.maxSpeed).toBeGreaterThan(0);
    expect(data.maxSpeed).toBeLessThanOrEqual(3000);
    
    expect(data.avgAltitude).toBeGreaterThanOrEqual(0);
    expect(data.avgAltitude).toBeLessThanOrEqual(5000);
    
    expect(data.actualDistance).toBeGreaterThan(0);
    expect(data.actualDistance).toBeLessThanOrEqual(1000);
    
    console.log('✅ 所有數據範圍檢查通過');
  });

  test('平均值不應大於最大值', async ({ page }) => {
    await page.goto('/');
    const data = await extractFlightData(page);

    expect(data.avgSpeed).toBeLessThanOrEqual(data.maxSpeed);
    expect(data.avgAltitude).toBeLessThanOrEqual(data.maxAltitude);
    
    console.log('✅ 平均值與最大值關係正確');
  });
});
```

### `tests/e2e/03-waypoints-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { extractWaypoints } from '../utils/data-extractors';
import { isTimeIncreasing, parseTime } from '../utils/helpers';

test.describe('航點數據驗證', () => {
  
  test('應該提取航點表格數據', async ({ page }) => {
    await page.goto('/');
    
    const waypoints = await extractWaypoints(page);
    
    console.log(`📍 航點數量: ${waypoints.length}`);
    console.log('前 3 個航點:');
    waypoints.slice(0, 3).forEach(wp => {
      console.log(`  航點 ${wp.point}: ${wp.time}, 距離 ${wp.distance}km, 速度 ${wp.speed}m/min`);
    });

    expect(waypoints.length).toBeGreaterThan(0);
  });

  test('航點編號應該連續', async ({ page }) => {
    await page.goto('/');
    const waypoints = await extractWaypoints(page);

    for (let i = 0; i < waypoints.length; i++) {
      expect(waypoints[i].point).toBe(i + 1);
    }
    
    console.log('✅ 航點編號連續性驗證通過');
  });

  test('時間序列應該遞增', async ({ page }) => {
    await page.goto('/');
    const waypoints = await extractWaypoints(page);
    
    const times = waypoints.map(wp => wp.time);
    const isIncreasing = isTimeIncreasing(times);

    if (!isIncreasing) {
      console.error('❌ 發現時間序列異常:');
      for (let i = 1; i < waypoints.length; i++) {
        const prevTime = parseTime(waypoints[i - 1].time);
        const currTime = parseTime(waypoints[i].time);
        if (currTime < prevTime) {
          console.error(
            `  航點 ${waypoints[i].point}: ${waypoints[i].time} ` +
            `早於航點 ${waypoints[i-1].point}: ${waypoints[i-1].time}`
          );
        }
      }
    }

    expect(isIncreasing).toBe(true);
  });

  test('距離應該累積遞增', async ({ page }) => {
    await page.goto('/');
    const waypoints = await extractWaypoints(page);

    for (let i = 1; i < waypoints.length; i++) {
      const prevDistance = waypoints[i - 1].distance;
      const currDistance = waypoints[i].distance;
      
      expect(currDistance).toBeGreaterThanOrEqual(prevDistance);
    }
    
    console.log('✅ 距離累積遞增驗證通過');
  });

  test('每個航點的速度應該合理', async ({ page }) => {
    await page.goto('/');
    const waypoints = await extractWaypoints(page);

    const abnormalWaypoints = waypoints.filter(
      wp => wp.speed < 0 || wp.speed > 3000
    );

    if (abnormalWaypoints.length > 0) {
      console.error('❌ 發現異常速度的航點:');
      abnormalWaypoints.forEach(wp => {
        console.error(`  航點 ${wp.point}: 速度 ${wp.speed} m/min`);
      });
    }

    expect(abnormalWaypoints.length).toBe(0);
  });
});
```

---

## 🚀 執行指令

### 基本測試

```bash
# 執行所有測試
npm test

# 執行功能測試
npm run test:e2e

# 執行特定測試文件
npx playwright test tests/e2e/02-flight-data-validation.spec.ts

# 有頭模式（看到瀏覽器）
npm run test:headed

# 調試模式
npm run test:debug
```

### 進階選項

```bash
# 只在 Chrome 執行
npx playwright test --project=chromium

# 只在移動裝置執行
npx playwright test --project="Mobile Chrome"

# 使用 UI 模式（互動式）
npm run test:ui

# 產生測試報告
npm run report
```

---

## 📊 在 Claude Code 中使用

### 方法 1: 直接執行測試

```bash
# 在 Claude Code 中
claude

# 然後輸入：
請幫我執行賽鴿追蹤系統的前端測試：
1. 安裝所有依賴
2. 執行完整的測試套件
3. 如果發現異常數據，詳細報告問題
4. 生成測試報告
```

### 方法 2: 逐步驗證

```bash
# 在 Claude Code 中
claude

# 測試特定功能：
請使用 Playwright MCP 測試以下內容：
1. 打開 https://jxl.skyracing.com.cn
2. 提取所有飛行數據
3. 驗證是否有異常數值（如距離超過 1000km）
4. 提取航點表格並檢查連續性
```

### 方法 3: 生成測試報告

```bash
claude

# 輸入：
請分析賽鴿追蹤系統的測試結果，並生成一份詳細報告，包含：
- 所有測試案例的通過/失敗狀態
- 發現的所有異常數據
- 建議的修復方案
- 視覺化的數據趨勢圖
```

---

## 🔍 異常檢測範例

### 會被標記為異常的數據：

```typescript
// ❌ 實際距離異常
actualDistance: 46168.05 km
// 預期: 1-1000 km
// 錯誤: "實際距離 46168.05 km 異常！"

// ❌ 實際分速異常
actualSpeed: 106529.36 m/Min
// 預期: < 10000 m/Min
// 錯誤: "實際分速 106529.36 m/Min 嚴重異常！"

// ❌ 平均速度大於最高速度
avgSpeed: 1800 m/Min
maxSpeed: 1500 m/Min
// 錯誤: "邏輯錯誤：平均分速 > 最高分速"

// ⚠️ 實際距離小於直線距離
actualDistance: 300 km
straightDistance: 400 km
// 警告: "實際距離 < 直線距離，可能有誤"
```

---

## 📈 CI/CD 整合

### `.github/workflows/e2e-tests.yml`

```yaml
name: 前端回歸測試

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 */6 * * *'  # 每 6 小時執行

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run tests
        run: npm test
        
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: reports/
          
      - name: Notify on failure
        if: failure()
        run: |
          echo "⚠️ 測試失敗！發現異常數據"
```

---

## 🎯 下一步

1. **建立專案**
   ```bash
   # 複製這個文件到你的專案目錄
   # 然後執行：
   npm install
   npx playwright install
   ```

2. **配置測試 URL**
   - 修改 `playwright.config.ts` 中的 `baseURL`
   - 或在測試中使用完整 URL

3. **執行首次測試**
   ```bash
   npm test
   ```

4. **查看報告**
   ```bash
   npm run report
   ```

---

## 💡 使用 Claude Code 快速啟動

```bash
# 在終端輸入
claude

# 然後說：
請根據 PIGEON_RACING_TEST_PROJECT.md 
建立完整的測試專案，並執行第一次測試
```

---

## 📞 問題排解

### 常見問題

**Q: Playwright 安裝失敗？**
```bash
# 清除快取重試
rm -rf node_modules package-lock.json
npm install
npx playwright install --with-deps
```

**Q: 測試超時？**
```typescript
// 在 playwright.config.ts 增加 timeout
timeout: 60000, // 60 秒
```

**Q: 找不到元素？**
```typescript
// 使用更寬鬆的選擇器
await page.locator('text=/飛行|flight/i').waitFor();
```

---

## ✅ 檢查清單

- [ ] 安裝 Node.js 18+
- [ ] 安裝專案依賴
- [ ] 配置 Playwright MCP
- [ ] 設置測試 URL
- [ ] 執行第一次測試
- [ ] 查看測試報告
- [ ] 配置 CI/CD（可選）

---

**專案完成！準備好在 Claude Code 中執行了！** 🚀
