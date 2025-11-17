# 辅助函数设计文档

## 文档信息
- **项目名称**: PIGEON_RACING_TEST_PROJECT
- **文档版本**: v1.0.0
- **创建日期**: 2025-11-17
- **模块数量**: 6
- **函数总数**: 25+
- **参考文档**: [TEST_REPORT.md](../../TEST_REPORT.md)

---

## 设计原则

### 1. 单一职责原则
每个函数只负责一个特定功能，便于测试和维护。

### 2. 复用性优先
将重复操作封装为函数，提高代码复用率 ≥ 60%。

### 3. 容错性设计
内置重试机制和错误处理，提高测试稳定性。

### 4. 基于经验
继承 [TEST_REPORT.md](../../TEST_REPORT.md) 验证的成功经验。

---

## 模块结构

```
tests/helpers/
├── navigation.ts          # 导航相关函数
├── mode-switching.ts      # 模式切换函数
├── trajectory-utils.ts    # 轨迹操作函数
├── loft-list.ts          # 鸽舍列表函数
├── validators.ts         # 数据验证函数
└── wait-utils.ts         # 等待策略函数
```

---

## 1. navigation.ts - 导航辅助

### 1.1 enterFirstRace()
**功能**: 进入首页第一个赛事
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<void>`

**实现**:
```typescript
/**
 * 进入首页第一个赛事
 * @param page Playwright Page 对象
 */
export async function enterFirstRace(page: Page): Promise<void> {
  await page.getByRole('button')
    .filter({ hasText: '进入' })
    .first()
    .click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 验证进入成功
  await expect(page.getByRole('table')).toBeVisible();
}
```

**使用示例**:
```typescript
test('进入赛事', async ({ page }) => {
  await page.goto('https://skyracing.com.cn');
  await enterFirstRace(page);
});
```

---

### 1.2 selectPigeon()
**功能**: 选择指定索引的鸽子
**参数**:
- `page: Page` - Playwright Page 对象
- `index: number` - 鸽子索引（默认 0，即第一名）

**返回值**: `Promise<string>` - 返回选中鸽子的环号

**实现**:
```typescript
/**
 * 选择指定索引的鸽子
 * @param page Playwright Page 对象
 * @param index 鸽子索引（默认 0）
 * @returns 选中鸽子的环号
 */
export async function selectPigeon(
  page: Page,
  index: number = 0
): Promise<string> {
  const rows = await page.getByRole('row').all();

  if (index >= rows.length) {
    throw new Error(`索引 ${index} 超出范围，共有 ${rows.length} 只鸽子`);
  }

  // 点击复选框
  await rows[index].getByLabel('').click();

  // 提取环号
  const rowText = await rows[index].textContent();
  const ringNumber = rowText?.match(/\d{4}-\d{2}-\d{7}/)?.[0] || '';

  return ringNumber;
}
```

**使用示例**:
```typescript
test('选择鸽子', async ({ page }) => {
  const ringNumber = await selectPigeon(page, 0);
  console.log(`选中鸽子: ${ringNumber}`);
});
```

---

### 1.3 selectMultiplePigeons()
**功能**: 批量选择多只鸽子
**参数**:
- `page: Page` - Playwright Page 对象
- `count: number` - 选择数量

**返回值**: `Promise<string[]>` - 返回选中鸽子的环号数组

**实现**:
```typescript
/**
 * 批量选择多只鸽子
 * @param page Playwright Page 对象
 * @param count 选择数量
 * @returns 选中鸽子的环号数组
 */
export async function selectMultiplePigeons(
  page: Page,
  count: number
): Promise<string[]> {
  const ringNumbers: string[] = [];

  for (let i = 0; i < count; i++) {
    const ringNumber = await selectPigeon(page, i);
    ringNumbers.push(ringNumber);
  }

  // 验证勾选清单
  await expect(page.getByText(`勾选清单 ${count}`)).toBeVisible();

  return ringNumbers;
}
```

---

### 1.4 viewTrajectory()
**功能**: 点击查看轨迹按钮
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<void>`

**实现**:
```typescript
/**
 * 点击查看轨迹按钮并等待加载完成
 * @param page Playwright Page 对象
 */
export async function viewTrajectory(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: '查看轨迹' });

  // 验证按钮已启用
  await expect(button).toBeEnabled();

  await button.click();

  // 等待轨迹视图加载
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 验证轨迹详情面板出现
  // （具体验证逻辑根据实际页面结构调整）
}
```

---

## 2. mode-switching.ts - 模式切换

### 2.1 switchTo2DMode()
**功能**: 切换到 2D 模式（使用 3D→2D 序列）
**参数**:
- `page: Page` - Playwright Page 对象
- `retries: number` - 重试次数（默认 2）

**返回值**: `Promise<boolean>` - 成功返回 true

**实现**:
```typescript
/**
 * 切换到2D模式（使用3D→2D切换序列确保数据加载）
 * 基于 TEST_REPORT.md 问题#1 的解决方案
 *
 * @param page Playwright Page 对象
 * @param retries 重试次数
 * @returns 成功返回 true
 */
export async function switchTo2DMode(
  page: Page,
  retries: number = 2
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      // 步骤1: 确保先在3D模式
      const button2D = page.getByRole('button', { name: '2d 2D模式' });
      const is2DMode = await button2D.isVisible().catch(() => false);

      if (!is2DMode) {
        // 当前已在3D，先切换一次确保初始化
        const button3D = page.getByRole('button', { name: 'view_in_ar 3D模式' });
        if (await button3D.isVisible().catch(() => false)) {
          await button3D.click();
          await page.waitForTimeout(1000);
        }
      }

      // 步骤2: 切换到2D模式
      await button2D.click();
      await page.waitForTimeout(2000);

      // 步骤3: 验证地图瓦片加载
      const tileCount = await page.locator('.amap-container img').count();

      if (tileCount > 50) {
        console.log(`✅ 2D模式切换成功，地图瓦片数: ${tileCount}`);
        return true;
      } else {
        console.warn(`⚠️ 地图瓦片不足 (${tileCount})，重试...`);
      }
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 次切换失败:`, error);
      if (i === retries - 1) throw error;
    }
  }

  throw new Error('切换到2D模式失败');
}
```

**参考**: [TEST_REPORT.md - 问题#1](../../TEST_REPORT.md#问题-1-2d轨迹初次载入失败)

---

### 2.2 switchTo3DMode()
**功能**: 切换到 3D 模式
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<boolean>` - 成功返回 true

**实现**:
```typescript
/**
 * 切换到3D模式并等待Cesium加载完成
 * @param page Playwright Page 对象
 * @returns 成功返回 true
 */
export async function switchTo3DMode(page: Page): Promise<boolean> {
  // 点击3D模式按钮
  await page.getByRole('button')
    .filter({ hasText: '3D模式' })
    .click();

  await page.waitForTimeout(3000);

  // 验证Cesium初始化
  await page.waitForFunction(
    () => window.Cesium !== undefined,
    { timeout: 30000 }
  );

  // 等待地球瓦片加载
  await page.waitForFunction(
    () => window.viewer?.scene.globe.tilesLoaded,
    { timeout: 60000 }
  ).catch(() => {
    console.warn('⚠️ Cesium瓦片加载超时，但继续执行');
  });

  // 验证按钮文字变更
  const button2D = await page.getByRole('button', { name: '2d 2D模式' }).isVisible();

  if (button2D) {
    console.log('✅ 3D模式切换成功');
    return true;
  }

  throw new Error('切换到3D模式失败');
}
```

---

### 2.3 ensureStaticMode()
**功能**: 确保处于静态模式（所有轨迹点可见）
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<boolean>` - 成功返回 true

**实现**:
```typescript
/**
 * 确保处于静态模式（所有轨迹点可见）
 * 基于 TEST_REPORT.md 问题#2 的解决方案
 *
 * @param page Playwright Page 对象
 * @returns 成功返回 true
 */
export async function ensureStaticMode(page: Page): Promise<boolean> {
  // 检查轨迹标记数量
  let markerCount = await page.locator('[title*="2025-26-"]').count();

  if (markerCount < 3) {
    console.log('⚠️ 当前为动态模式，切换到静态...');

    // 点击timeline按钮切换模式
    await page.locator('button:has(img[alt="timeline"])').click();
    await page.waitForTimeout(1000);

    // 重新检查
    markerCount = await page.locator('[title*="2025-26-"]').count();
  }

  console.log(`✅ 静态模式激活，轨迹标记数: ${markerCount}`);
  return markerCount >= 3;
}
```

**参考**: [TEST_REPORT.md - 问题#2](../../TEST_REPORT.md#问题-2-動態靜態模式混淆)

---

### 2.4 ensureDynamicMode()
**功能**: 确保处于动态播放模式
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<boolean>` - 成功返回 true

**实现**:
```typescript
/**
 * 确保处于动态播放模式
 * @param page Playwright Page 对象
 * @returns 成功返回 true
 */
export async function ensureDynamicMode(page: Page): Promise<boolean> {
  // 检查轨迹标记数量
  let markerCount = await page.locator('[title*="2025-26-"]').count();

  if (markerCount >= 3) {
    console.log('⚠️ 当前为静态模式，切换到动态...');

    // 点击timeline按钮切换模式
    await page.locator('button:has(img[alt="timeline"])').click();
    await page.waitForTimeout(1000);

    // 重新检查
    markerCount = await page.locator('[title*="2025-26-"]').count();
  }

  // 验证播放控制可见
  const playButton = await page.getByRole('button')
    .filter({ hasText: 'play_arrow' })
    .isVisible();

  console.log(`✅ 动态模式激活，播放控制可见: ${playButton}`);
  return markerCount < 3 && playButton;
}
```

---

## 3. trajectory-utils.ts - 轨迹操作

### 3.1 clickTrajectoryPoint()
**功能**: 点击指定索引的轨迹点
**参数**:
- `page: Page` - Playwright Page 对象
- `index: number` - 轨迹点索引（默认中间点）

**返回值**: `Promise<boolean>` - 成功返回 true

**实现**:
```typescript
/**
 * 点击指定索引的轨迹点
 * 基于 TEST_REPORT.md 问题#3 的解决方案
 *
 * @param page Playwright Page 对象
 * @param index 轨迹点索引（默认中间点）
 * @returns 成功返回 true
 */
export async function clickTrajectoryPoint(
  page: Page,
  index?: number
): Promise<boolean> {
  // 等待轨迹标记出现
  await page.waitForSelector('[title*="2025-26-"]', { timeout: 5000 });

  // 获取所有轨迹标记
  const markers = await page.locator('[title*="2025-26-"]').all();

  if (markers.length === 0) {
    throw new Error('未找到轨迹标记点');
  }

  // 如果未指定索引，选择中间点
  const targetIndex = index !== undefined
    ? Math.min(index, markers.length - 1)
    : Math.floor(markers.length / 2);

  console.log(`点击轨迹点 ${targetIndex}/${markers.length - 1}`);

  // 点击指定标记
  await markers[targetIndex].click();

  // 等待信息窗格出现
  await page.waitForSelector('heading:has-text("2025-26-")', { timeout: 3000 });

  return true;
}
```

**参考**: [TEST_REPORT.md - 问题#3](../../TEST_REPORT.md#问题-3-軌跡點點擊無回應)

---

### 3.2 verifyTrajectoryPointInfo()
**功能**: 验证轨迹点信息窗格
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<TrajectoryPointData>` - 返回提取的数据

**类型定义**:
```typescript
interface TrajectoryPointData {
  ringNumber: string;
  time: string;
  speed: string;
  direction: string;
  altitude: string;
  rank: string;
}
```

**实现**:
```typescript
/**
 * 验证轨迹点信息窗格并提取数据
 * @param page Playwright Page 对象
 * @returns 提取的轨迹点数据
 */
export async function verifyTrajectoryPointInfo(
  page: Page
): Promise<TrajectoryPointData> {
  const popup = page.locator('.trajectory-point-popup, [role="dialog"]');

  // 验证所有字段可见
  await expect(popup.locator('heading:has-text("2025-26-")')).toBeVisible();
  await expect(popup.locator('text=時間：')).toBeVisible();
  await expect(popup.locator('text=速度：')).toBeVisible();
  await expect(popup.locator('text=方向：')).toBeVisible();
  await expect(popup.locator('text=海拔：')).toBeVisible();
  await expect(popup.locator('text=名次：')).toBeVisible();

  // 提取数据
  const data: TrajectoryPointData = {
    ringNumber: await popup.locator('heading').textContent() || '',
    time: await extractFieldValue(popup, '時間'),
    speed: await extractFieldValue(popup, '速度'),
    direction: await extractFieldValue(popup, '方向'),
    altitude: await extractFieldValue(popup, '海拔'),
    rank: await extractFieldValue(popup, '名次'),
  };

  console.log('✅ 轨迹点信息:', data);

  return data;
}

async function extractFieldValue(
  popup: Locator,
  fieldName: string
): Promise<string> {
  const text = await popup.locator(`text=${fieldName}：`).textContent();
  return text?.split('：')[1]?.trim() || '';
}
```

---

### 3.3 verifyTrajectoryDetailPanel()
**功能**: 验证侧边栏轨迹详情数据
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<TrajectoryDetailData>` - 返回提取的数据

**类型定义**:
```typescript
interface TrajectoryDetailData {
  ringNumber: string;
  startTime: string;
  endTime: string;
  duration: string;
  avgSpeed: number;
  maxSpeed: number;
  avgAltitude: number;
  maxAltitude: number;
  actualDistance: number;
  straightDistance: number;
}
```

**实现**:
```typescript
/**
 * 验证侧边栏轨迹详情数据
 * @param page Playwright Page 对象
 * @returns 提取的轨迹详情数据
 */
export async function verifyTrajectoryDetailPanel(
  page: Page
): Promise<TrajectoryDetailData> {
  const panel = page.locator('.trajectory-detail-panel, aside');

  const data: TrajectoryDetailData = {
    ringNumber: await extractPanelField(panel, '公環號'),
    startTime: await extractPanelField(panel, '起點時間'),
    endTime: await extractPanelField(panel, '終點時間'),
    duration: await extractPanelField(panel, '持續時間'),
    avgSpeed: parseFloat(await extractPanelField(panel, '平均分速')),
    maxSpeed: parseFloat(await extractPanelField(panel, '最高分速')),
    avgAltitude: parseFloat(await extractPanelField(panel, '平均高度')),
    maxAltitude: parseFloat(await extractPanelField(panel, '最大高度')),
    actualDistance: parseFloat(await extractPanelField(panel, '實際距離')),
    straightDistance: parseFloat(await extractPanelField(panel, '直線距離')),
  };

  // 验证数据逻辑关系
  expect(data.maxSpeed).toBeGreaterThanOrEqual(data.avgSpeed);
  expect(data.maxAltitude).toBeGreaterThanOrEqual(data.avgAltitude);
  expect(data.actualDistance).toBeGreaterThanOrEqual(data.straightDistance);

  console.log('✅ 轨迹详情数据:', data);

  return data;
}

async function extractPanelField(
  panel: Locator,
  fieldName: string
): Promise<string> {
  const element = panel.locator(`text=${fieldName}`).locator('..');
  const text = await element.textContent();
  return text?.replace(fieldName, '').trim() || '';
}
```

---

### 3.4 waitForPlaybackUpdate()
**功能**: 等待播放时间更新
**参数**:
- `page: Page` - Playwright Page 对象
- `timeoutMs: number` - 超时时间（默认 5000ms）

**返回值**: `Promise<boolean>` - 时间更新返回 true

**实现**:
```typescript
/**
 * 等待播放时间更新（验证播放功能工作）
 * @param page Playwright Page 对象
 * @param timeoutMs 超时时间
 * @returns 时间更新返回 true
 */
export async function waitForPlaybackUpdate(
  page: Page,
  timeoutMs: number = 5000
): Promise<boolean> {
  const initialTime = await page.locator('text=/\\d{2}:\\d{2}/').textContent();

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await page.waitForTimeout(500);

    const currentTime = await page.locator('text=/\\d{2}:\\d{2}/').textContent();

    if (currentTime !== initialTime) {
      console.log(`✅ 播放时间更新: ${initialTime} → ${currentTime}`);
      return true;
    }
  }

  throw new Error('播放时间未更新，超时');
}
```

---

## 4. loft-list.ts - 鸽舍列表

### 4.1 switchToLoftListTab()
**功能**: 切换到鸽舍列表 Tab
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<void>`

**实现**:
```typescript
/**
 * 切换到鸽舍列表Tab
 * @param page Playwright Page 对象
 */
export async function switchToLoftListTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: '鸽舍列表' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('✅ 已切换到鸽舍列表Tab');
}
```

---

### 4.2 selectLoftPigeons()
**功能**: 选择鸽舍内的鸽子
**参数**:
- `page: Page` - Playwright Page 对象
- `loftIndex: number` - 鸽舍索引（默认 0）
- `pigeonCount: number` - 选择鸽子数量（默认 2）

**返回值**: `Promise<string[]>` - 返回选中鸽子的环号

**实现**:
```typescript
/**
 * 选择鸽舍内的鸽子
 * @param page Playwright Page 对象
 * @param loftIndex 鸽舍索引
 * @param pigeonCount 选择鸽子数量
 * @returns 选中鸽子的环号数组
 */
export async function selectLoftPigeons(
  page: Page,
  loftIndex: number = 0,
  pigeonCount: number = 2
): Promise<string[]> {
  // 点击鸽舍展开
  await page.locator('.loft-item').nth(loftIndex).click();
  await page.waitForTimeout(1000);

  const ringNumbers: string[] = [];

  // 勾选指定数量的鸽子
  for (let i = 0; i < pigeonCount; i++) {
    const checkbox = page.locator('.pigeon-checkbox').nth(i);
    await checkbox.click();

    // 提取环号
    const rowText = await checkbox.locator('..').textContent();
    const ringNumber = rowText?.match(/\d{4}-\d{2}-\d{7}/)?.[0] || '';
    ringNumbers.push(ringNumber);
  }

  console.log(`✅ 已选择 ${pigeonCount} 只鸽子:`, ringNumbers);

  return ringNumbers;
}
```

---

## 5. validators.ts - 数据验证

### 5.1 validateRingNumber()
**功能**: 验证环号格式
**参数**:
- `ringNumber: string` - 环号

**返回值**: `boolean` - 格式正确返回 true

**实现**:
```typescript
/**
 * 验证环号格式 (YYYY-NN-NNNNNNN)
 * @param ringNumber 环号
 * @returns 格式正确返回 true
 */
export function validateRingNumber(ringNumber: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{7}$/;
  return pattern.test(ringNumber);
}
```

---

### 5.2 validateTimeFormat()
**功能**: 验证时间格式
**参数**:
- `timeString: string` - 时间字符串

**返回值**: `boolean` - 格式正确返回 true

**实现**:
```typescript
/**
 * 验证时间格式 (YYYY-MM-DD HH:MM:SS)
 * @param timeString 时间字符串
 * @returns 格式正确返回 true
 */
export function validateTimeFormat(timeString: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return pattern.test(timeString);
}
```

---

### 5.3 validateSpeedValue()
**功能**: 验证速度值合理性
**参数**:
- `speed: number` - 速度值（m/min）

**返回值**: `boolean` - 合理返回 true

**实现**:
```typescript
/**
 * 验证速度值合理性 (100 - 3000 m/min)
 * @param speed 速度值
 * @returns 合理返回 true
 */
export function validateSpeedValue(speed: number): boolean {
  return speed >= 100 && speed <= 3000;
}
```

---

## 6. wait-utils.ts - 等待策略

### 6.1 waitForMapTilesLoaded()
**功能**: 等待地图瓦片加载完成
**参数**:
- `page: Page` - Playwright Page 对象
- `minTiles: number` - 最小瓦片数（默认 50）

**返回值**: `Promise<number>` - 返回实际瓦片数

**实现**:
```typescript
/**
 * 等待地图瓦片加载完成
 * @param page Playwright Page 对象
 * @param minTiles 最小瓦片数
 * @returns 实际瓦片数
 */
export async function waitForMapTilesLoaded(
  page: Page,
  minTiles: number = 50
): Promise<number> {
  let tileCount = 0;
  const maxWaitTime = 15000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    tileCount = await page.locator('.amap-container img').count();

    if (tileCount >= minTiles) {
      console.log(`✅ 地图瓦片加载完成: ${tileCount}`);
      return tileCount;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`地图瓦片加载超时，当前: ${tileCount}/${minTiles}`);
}
```

---

### 6.2 waitForCesiumReady()
**功能**: 等待 Cesium 3D 引擎就绪
**参数**:
- `page: Page` - Playwright Page 对象

**返回值**: `Promise<boolean>` - 就绪返回 true

**实现**:
```typescript
/**
 * 等待Cesium 3D引擎就绪
 * @param page Playwright Page 对象
 * @returns 就绪返回 true
 */
export async function waitForCesiumReady(page: Page): Promise<boolean> {
  // 等待Cesium对象
  await page.waitForFunction(
    () => window.Cesium !== undefined,
    { timeout: 30000 }
  );

  // 等待viewer对象
  await page.waitForFunction(
    () => window.viewer !== undefined,
    { timeout: 30000 }
  );

  // 等待地球瓦片（可选，可能超时）
  await page.waitForFunction(
    () => window.viewer?.scene.globe.tilesLoaded,
    { timeout: 60000 }
  ).catch(() => {
    console.warn('⚠️ Cesium地球瓦片加载超时，但继续执行');
  });

  console.log('✅ Cesium引擎就绪');
  return true;
}
```

---

## 使用示例

### 完整测试流程示例

```typescript
import { test, expect } from '@playwright/test';
import {
  enterFirstRace,
  selectPigeon,
  viewTrajectory
} from './helpers/navigation';
import { switchTo2DMode, ensureStaticMode } from './helpers/mode-switching';
import {
  clickTrajectoryPoint,
  verifyTrajectoryPointInfo,
  verifyTrajectoryDetailPanel
} from './helpers/trajectory-utils';

test('完整2D轨迹测试流程', async ({ page }) => {
  // 1. 导航
  await page.goto('https://skyracing.com.cn');
  await enterFirstRace(page);

  // 2. 选择鸽子
  const ringNumber = await selectPigeon(page, 0);
  console.log(`选中鸽子: ${ringNumber}`);

  // 3. 查看轨迹
  await viewTrajectory(page);

  // 4. 切换到2D模式
  await switchTo2DMode(page);

  // 5. 确保静态模式
  await ensureStaticMode(page);

  // 6. 点击轨迹点
  await clickTrajectoryPoint(page);

  // 7. 验证轨迹点信息
  const pointData = await verifyTrajectoryPointInfo(page);
  expect(pointData.ringNumber).toContain('2025-26-');

  // 8. 验证轨迹详情
  const detailData = await verifyTrajectoryDetailPanel(page);
  expect(detailData.avgSpeed).toBeGreaterThan(0);
});
```

---

## 最佳实践

### 1. 错误处理
所有函数都应包含适当的错误处理：
```typescript
try {
  await switchTo2DMode(page);
} catch (error) {
  console.error('切换2D模式失败:', error);
  // 截图用于调试
  await page.screenshot({ path: 'error-2d-switch.png' });
  throw error;
}
```

### 2. 日志记录
使用 console.log 记录关键步骤：
```typescript
console.log('✅ 成功');
console.log('⚠️ 警告');
console.log('❌ 失败');
```

### 3. 超时配置
合理设置超时时间：
- 普通操作: 5-10 秒
- 地图加载: 15-30 秒
- Cesium 加载: 30-60 秒

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-17
**函数总数**: 25+
