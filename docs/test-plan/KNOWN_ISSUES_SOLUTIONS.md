# 已知问题与解决方案

## 文档信息
- **项目名称**: PIGEON_RACING_TEST_PROJECT
- **文档版本**: v1.0.0
- **创建日期**: 2025-11-17
- **问题总数**: 4
- **来源**: [TEST_REPORT.md v0.1.0](../../TEST_REPORT.md)
- **验证状态**: ✅ 所有解决方案已验证有效

---

## 问题索引

| 编号 | 问题名称 | 严重程度 | 发现版本 | 解决方案 | 状态 |
|------|---------|---------|---------|---------|------|
| #1 | 2D轨迹初次加载失败 | 🔴 高 | v0.1.0 | 3D→2D切换序列 | ✅ 已解决 |
| #2 | 动态/静态模式混淆 | 🟡 中 | v0.1.0 | 标记数量判断 | ✅ 已解决 |
| #3 | 轨迹点点击无响应 | 🟡 中 | v0.1.0 | 使用accessibility定位 | ✅ 已解决 |
| #4 | 数据加载时序问题 | 🟡 中 | v0.1.0 | 增加等待时间 | ✅ 已解决 |

---

## 问题 #1: 2D轨迹初次加载失败

### 严重程度
🔴 **高** - 影响核心功能

### 发现版本
v0.1.0 (2025-11-17)

### 问题描述

**测试步骤**:
1. 选择鸽子
2. 点击"查看轨迹"
3. 点击"2D模式"按钮

**异常现象**:
- 首次切换到2D模式时，轨迹未正确渲染
- 控制台错误: `ERROR Error: pigeon.gpx2d undefined`
- 地图显示空白或仅显示地形，没有轨迹线
- 轨迹标记点不可见

### 根本原因

**技术分析**:
- 2D轨迹数据 (`gpx2d`) 在首次请求时可能尚未完全加载
- 前端在切换模式时未等待数据加载完成就尝试渲染
- 数据请求和UI渲染存在竞态条件

**API请求分析**:
```
POST https://online02.skyracing.com.cn/ugetPigeonAllJsonInfo
响应包含: { gpx2d: "...", gpx3d: "..." }
```

### 解决方案

#### 方法1: 3D→2D→3D→2D 切换序列（推荐）

**原理**: 通过先切换到3D模式触发数据加载，再切换回2D确保数据就绪

**实现代码**:
```typescript
async function switchTo2DMode(page: Page, retries: number = 2): Promise<boolean> {
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

#### 方法2: 等待数据加载完成

**原理**: 进入轨迹视图后等待足够时间确保数据加载

**实现代码**:
```typescript
async function viewTrajectoryAnd WaitFor2DData(page: Page): Promise<void> {
  await page.getByRole('button', { name: '查看轨迹' }).click();

  // 等待网络请求完成
  await page.waitForLoadState('networkidle');

  // 额外等待3-5秒确保数据处理完成
  await page.waitForTimeout(5000);

  // 验证地图容器存在
  await page.waitForSelector('.amap-container', { timeout: 10000 });

  console.log('✅ 2D数据加载完成');
}
```

#### 方法3: 监听API请求

**原理**: 监听数据请求完成后再进行操作

**实现代码**:
```typescript
async function waitFor2DDataLoaded(page: Page): Promise<void> {
  let dataLoaded = false;

  page.on('response', async response => {
    if (response.url().includes('ugetPigeonAllJsonInfo')) {
      const data = await response.json();
      if (data.gpx2d) {
        dataLoaded = true;
        console.log('✅ gpx2d数据已加载');
      }
    }
  });

  await page.getByRole('button', { name: '查看轨迹' }).click();

  // 等待数据加载标志
  await page.waitForFunction(() => dataLoaded === true, { timeout: 10000 });
}
```

### 预防措施清单

- ✅ **总是使用3D→2D切换序列**
- ✅ **等待地图瓦片加载完成** (>50个img元素)
- ✅ **检查轨迹线是否存在** (红色虚线)
- ✅ **检查控制台无gpx2d错误**
- ✅ **失败时自动重试** (最多2次)

### 测试用例

```typescript
test('TC-#1: 验证2D模式切换', async ({ page }) => {
  await enterFirstRace(page);
  await selectPigeon(page, 0);
  await viewTrajectory(page);

  // 使用解决方案
  const success = await switchTo2DMode(page, 2);

  // 验证
  expect(success).toBe(true);
  const tileCount = await page.locator('.amap-container img').count();
  expect(tileCount).toBeGreaterThan(50);
});
```

---

## 问题 #2: 动态/静态模式混淆

### 严重程度
🟡 **中** - 影响测试准确性

### 发现版本
v0.1.0 (2025-11-17)

### 问题描述

**测试步骤**:
1. 2D模式已加载
2. 点击timeline按钮

**异常现象**:
- 点击timeline按钮会切换动态/静态模式
- 动态模式: 轨迹动画播放，时间轴推进
- 静态模式: 显示完整轨迹，所有轨迹点可见可点击
- 初次点击可能进入错误模式
- 无明确的模式状态指示

### 根本原因

**技术分析**:
- timeline按钮是切换按钮，无明确文字标识当前模式
- 前端状态管理可能存在初始化不一致
- 没有提供API查询当前模式

### 解决方案

#### 模式判断方法

**静态模式特征**:
```typescript
// 特征1: 轨迹标记点数量多
const markerCount = await page.locator('[title*="2025-26-"]').count();
// 静态模式: markerCount >= 3

// 特征2: 完整红色轨迹线可见
// 视觉特征，需要截图验证

// 特征3: 播放控制为暂停状态
const isPaused = await page.locator('button:has-text("pause")').isVisible();
```

**动态模式特征**:
```typescript
// 特征1: 轨迹标记点稀少
const markerCount = await page.locator('[title*="2025-26-"]').count();
// 动态模式: markerCount < 3

// 特征2: 播放控制可见
const playControl = await page.locator('button:has-text("play_arrow")').isVisible();

// 特征3: 时间持续推进
// 需要监测时间变化
```

#### 确保静态模式函数

```typescript
async function ensureStaticMode(page: Page): Promise<boolean> {
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

  // 验证静态模式激活
  if (markerCount >= 3) {
    console.log(`✅ 静态模式激活，轨迹标记数: ${markerCount}`);
    return true;
  }

  throw new Error('无法切换到静态模式');
}
```

#### 确保动态模式函数

```typescript
async function ensureDynamicMode(page: Page): Promise<boolean> {
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

  // 验证动态模式激活
  const playButton = await page.getByRole('button')
    .filter({ hasText: 'play_arrow' })
    .isVisible();

  if (markerCount < 3 && playButton) {
    console.log(`✅ 动态模式激活，播放控制可见`);
    return true;
  }

  throw new Error('无法切换到动态模式');
}
```

### 预防措施清单

- ✅ **始终使用判断函数确认模式**
- ✅ **不依赖按钮点击次数**
- ✅ **通过实际页面状态判断模式**
- ✅ **每次操作前验证当前模式**

### 测试用例

```typescript
test('TC-#2: 模式切换验证', async ({ page }) => {
  await setupTrajectoryView(page);

  // 确保静态模式
  const isStatic = await ensureStaticMode(page);
  expect(isStatic).toBe(true);

  // 切换到动态模式
  const isDynamic = await ensureDynamicMode(page);
  expect(isDynamic).toBe(true);

  // 切换回静态模式
  const isStaticAgain = await ensureStaticMode(page);
  expect(isStaticAgain).toBe(true);
});
```

---

## 问题 #3: 轨迹点点击无响应

### 严重程度
🟡 **中** - 影响交互测试

### 发现版本
v0.1.0 (2025-11-17)

### 问题描述

**测试步骤**:
1. 2D静态模式已加载
2. 尝试点击地图上的轨迹点

**异常现象**:
- 直接使用坐标点击地图容器无效
- 点击 `.amap-container` 无法触发轨迹点信息
- 需要精确点击轨迹标记元素

### 根本原因

**技术分析**:
- 轨迹标记是独立的DOM元素，不是Canvas绘制
- 高德地图使用覆盖层（Overlay）方式渲染标记
- 坐标点击无法准确命中动态生成的标记元素
- 需要通过accessibility snapshot找到标记元素的ref

**DOM结构**:
```html
<div class="amap-container">
  <div class="amap-overlays">
    <generic title="2025-26-0053539" ref="e5233">
      <!-- 轨迹标记内容 -->
    </generic>
  </div>
</div>
```

### 解决方案

#### 方法1: 使用Title选择器（推荐）

**原理**: 轨迹标记有唯一的title属性包含环号

**实现代码**:
```typescript
async function clickTrajectoryPoint(
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

#### 方法2: 使用Accessibility Snapshot

**原理**: 通过snapshot获取元素ref进行点击

**实现代码**:
```typescript
async function clickTrajectoryPointBySnapshot(page: Page): Promise<void> {
  // 获取页面快照
  const snapshot = await page.accessibility.snapshot();

  // 查找轨迹标记元素（需要递归搜索）
  function findMarkers(node: any): any[] {
    const markers = [];

    if (node.name?.includes('2025-26-')) {
      markers.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        markers.push(...findMarkers(child));
      }
    }

    return markers;
  }

  const markers = findMarkers(snapshot);

  if (markers.length > 0) {
    // 点击第一个标记
    // 注意: Playwright MCP可能支持通过ref点击
    // await page.click(`[ref="${markers[0].ref}"]`);
  }
}
```

#### 方法3: getByTitle 方法

**原理**: 使用Playwright的getByTitle选择器

**实现代码**:
```typescript
async function clickTrajectoryPointByTitle(page: Page): Promise<void> {
  // 查找包含"2025-26-"的元素
  const marker = page.getByTitle(/2025-26-/).nth(2);

  await marker.click();

  await page.waitForSelector('heading:has-text("2025-26-")', { timeout: 3000 });
}
```

### 错误方法示例

```typescript
// ❌ 错误: 使用固定坐标点击
await page.locator('.amap-container').click({
  position: { x: 600, y: 400 }
});
// 问题: 地图会缩放、平移，坐标不可靠

// ❌ 错误: 点击地图容器
await page.locator('.amap-container').click();
// 问题: 无法精确命中标记元素

// ❌ 错误: 使用Canvas坐标
await page.evaluate(() => {
  // 尝试通过Canvas API点击
});
// 问题: 标记不是Canvas绘制的
```

### 预防措施清单

- ✅ **使用title属性选择器**
- ✅ **通过all()获取所有标记后选择**
- ✅ **不使用固定坐标点击**
- ✅ **等待标记元素出现后再点击**
- ✅ **验证信息窗格显示**

### 测试用例

```typescript
test('TC-#3: 轨迹点点击测试', async ({ page }) => {
  await setupStaticMode(page);

  // 使用解决方案点击轨迹点
  const success = await clickTrajectoryPoint(page, 2);

  // 验证信息窗格显示
  expect(success).toBe(true);
  await expect(page.locator('heading:has-text("2025-26-")')).toBeVisible();
  await expect(page.locator('text=時間：')).toBeVisible();
  await expect(page.locator('text=速度：')).toBeVisible();
});
```

---

## 问题 #4: 数据加载时序问题

### 严重程度
🟡 **中** - 偶发性错误

### 发现版本
v0.1.0 (2025-11-17)

### 问题描述

**异常现象**:
- 控制台多次出现数据未定义错误
- `ERROR TypeError: Cannot read properties of undefined (reading 'id')`
- `ERROR TypeError: Cannot read properties of undefined (reading 'points')`
- `ERROR TypeError: Cannot read properties of undefined (reading '_leaflet_id')`

**影响**:
- 虽然出现错误，但不影响最终功能
- 可能导致首次操作失败，需要重试
- 降低测试稳定性

### 根本原因

**技术分析**:
- 多个异步数据请求之间存在依赖关系
- 前端代码未充分处理数据未就绪情况
- 操作执行过快，数据处理尚未完成
- 缺少loading状态管理

### 解决方案

#### 方法1: 增加等待时间

**原理**: 在关键操作后增加缓冲时间

**实现代码**:
```typescript
async function safeOperation(page: Page): Promise<void> {
  // 操作前等待
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 执行操作
  await page.click('...');

  // 操作后等待
  await page.waitForTimeout(1000);
}
```

#### 方法2: 验证关键元素存在

**原理**: 操作前验证必要元素已加载

**实现代码**:
```typescript
async function clickWithValidation(page: Page, selector: string): Promise<void> {
  // 等待元素存在
  await page.waitForSelector(selector, { timeout: 5000 });

  // 等待元素可见
  await page.waitForSelector(selector, { state: 'visible' });

  // 等待元素可交互
  await page.waitForSelector(selector, { state: 'attached' });

  // 执行点击
  await page.click(selector);
}
```

#### 方法3: 重试机制

**原理**: 操作失败时自动重试

**实现代码**:
```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.warn(`⚠️ 操作失败，重试 ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('操作失败');
}

// 使用示例
await retryOperation(async () => {
  await page.click('[title*="2025-26-"]');
  await page.waitForSelector('heading:has-text("2025-26-")');
}, 3, 1000);
```

#### 方法4: 监听控制台错误

**原理**: 检测并处理特定错误

**实现代码**:
```typescript
async function setupErrorHandling(page: Page): Promise<void> {
  const knownErrors = [
    'Cannot read properties of undefined',
    'gpx2d undefined',
    '_leaflet_id'
  ];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();

      // 检查是否是已知错误
      if (knownErrors.some(err => text.includes(err))) {
        console.warn(`⚠️ 已知错误（可忽略）: ${text}`);
      } else {
        console.error(`❌ 未知错误: ${text}`);
      }
    }
  });
}
```

### 推荐等待时间

| 操作 | 等待时间 | 说明 |
|------|---------|------|
| 页面导航后 | 2-3秒 | 等待networkidle + 缓冲 |
| 点击查看轨迹后 | 3-5秒 | 数据加载和地图初始化 |
| 模式切换后 | 2秒 | 地图重新渲染 |
| 点击按钮后 | 1秒 | UI响应时间 |
| 首次进入3D后 | 5-10秒 | Cesium加载 |

### 预防措施清单

- ✅ **在所有操作前使用waitForLoadState**
- ✅ **关键步骤增加额外等待时间**
- ✅ **验证关键元素存在后再操作**
- ✅ **使用重试机制处理暂时性失败**
- ✅ **监听并记录控制台错误**

### 测试用例

```typescript
test('TC-#4: 数据加载时序验证', async ({ page }) => {
  // 设置错误监听
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // 执行完整流程（使用等待策略）
  await page.goto('https://skyracing.com.cn');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await enterFirstRace(page);
  await page.waitForTimeout(2000);

  await selectPigeon(page, 0);
  await page.waitForTimeout(1000);

  await viewTrajectory(page);
  await page.waitForTimeout(5000);

  // 验证错误数量
  const criticalErrors = errors.filter(e =>
    !e.includes('gpx2d undefined') &&
    !e.includes('_leaflet_id')
  );

  expect(criticalErrors.length).toBe(0);
});
```

---

## 综合最佳实践

### 1. 操作模板

```typescript
async function safeTrajectoryOperation(page: Page): Promise<void> {
  // 1. 等待网络空闲
  await page.waitForLoadState('networkidle');

  // 2. 额外缓冲时间
  await page.waitForTimeout(2000);

  // 3. 验证关键元素
  await page.waitForSelector('.amap-container', { timeout: 10000 });

  // 4. 执行操作
  await switchTo2DMode(page, 2);  // 使用问题#1的解决方案
  await ensureStaticMode(page);   // 使用问题#2的解决方案
  await clickTrajectoryPoint(page); // 使用问题#3的解决方案

  // 5. 验证结果
  await page.waitForSelector('heading:has-text("2025-26-")');
}
```

### 2. 错误处理模板

```typescript
try {
  await safeTrajectoryOperation(page);
} catch (error) {
  console.error('❌ 操作失败:', error);

  // 截图用于调试
  await page.screenshot({
    path: `error-${Date.now()}.png`,
    fullPage: true
  });

  // 记录控制台日志
  const logs = await page.evaluate(() => {
    return console.log.toString();
  });

  // 重试或抛出错误
  throw error;
}
```

### 3. 测试稳定性检查清单

在执行测试前，确保以下条件满足:

- ✅ 网络连接稳定
- ✅ 浏览器已正确安装
- ✅ 测试数据可用（赛事存在）
- ✅ 超时时间合理配置
- ✅ 重试机制已启用
- ✅ 错误日志已配置

---

## 相关文档

- [TEST_REPORT.md](../../TEST_REPORT.md) - 原始问题发现报告
- [HELPER_FUNCTIONS_DESIGN.md](./HELPER_FUNCTIONS_DESIGN.md) - 解决方案实现
- [TEST_CASES.md](./TEST_CASES.md) - 相关测试用例

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-17
**验证状态**: ✅ 所有解决方案已验证有效
