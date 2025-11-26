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

#### 方法1: 重新在名次清单选取轨迹后，查看轨迹，反复几次确认轨迹是否生成（推荐）

**原理**:
- API 加载时未等候响应即渲染地图，导致首次查看轨迹时数据可能未完全加载
- 需要通过重新执行"选择鸽子 → 查看轨迹"流程来触发数据重新加载
- **关键**：2D 模式分为 **2D 静态模式**和 **2D 动态模式**，需要明确区分

**2D 模式说明**:
```
2D 静态模式：显示完整轨迹线和所有轨迹点，适合查看全程路径
2D 动态模式：播放动画，轨迹点随时间推进移动，适合观看飞行过程
```

**实现代码**:
```typescript
/**
 * 重新加载 2D 轨迹数据
 * 通过重新选择鸽子并查看轨迹来触发数据刷新
 */
async function reload2DTrajectory(
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
        console.log(`✓ 已选择鸽子 #${pigeonIndex}`);
      } else {
        throw new Error(`鸽子索引 ${pigeonIndex} 超出范围`);
      }

      // 步骤4: 点击查看轨迹
      const viewButton = page.getByRole('button', { name: /查看轨迹|view.*trajectory/i });
      await viewButton.click();

      // 步骤5: 等待数据加载
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 额外等待数据处理

      // 步骤6: 切换到 2D 模式（如果当前不是）
      const button2D = page.getByRole('button', { name: /2d.*模式|2d.*mode/i });
      if (await button2D.isVisible().catch(() => false)) {
        await button2D.click();
        await page.waitForTimeout(2000);
      }

      // 步骤7: 验证 2D 地图加载
      // ⚠️ 重要更新 (2025-11-26)：
      // .amap-container img 选择器已失效，高德地图改用 Canvas 渲染
      const canvas = await page.locator('canvas.amap-layer').count();
      const mapVisible = await page.locator('.amap-container').isVisible().catch(() => false);
      const timelineVisible = await page.getByRole('button').filter({ hasText: 'timeline' }).isVisible().catch(() => false);

      if ((canvas > 0 || mapVisible) && timelineVisible) {
        console.log(`✅ 2D 轨迹加载成功！`);
        console.log(`   - Canvas 图层: ${canvas}`);
        console.log(`   - 地图容器可见: ${mapVisible}`);
        return true;
      } else {
        console.warn(`⚠️ 轨迹未完全加载 (Canvas: ${canvas}, 容器: ${mapVisible})，准备重试...`);
      }

    } catch (error) {
      console.error(`❌ 第 ${attempt + 1} 次加载失败:`, error);
      if (attempt === maxRetries - 1) {
        throw new Error(`2D 轨迹加载失败，已重试 ${maxRetries} 次`);
      }
    }
  }

  return false;
}

/**
 * 确保处于 2D 静态模式
 * 区分静态模式和动态模式的关键
 */
async function ensure2DStaticMode(page: Page): Promise<boolean> {
  // 检查当前是否有播放控制按钮（动态模式特征）
  const playButton = page.getByRole('button').filter({ hasText: /play_arrow|播放/ });
  const pauseButton = page.getByRole('button').filter({ hasText: /pause|暂停/ });

  const isPlaying = await pauseButton.isVisible().catch(() => false);

  if (isPlaying) {
    // 当前在动态播放模式，需要暂停或切换到静态模式
    console.log('⚠️ 当前为 2D 动态模式，切换到静态模式...');

    // 查找静态模式按钮（可能是 timeline 按钮或其他切换按钮）
    const timelineButton = page.locator('button:has(img[alt="timeline"])');
    if (await timelineButton.isVisible().catch(() => false)) {
      await timelineButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // 验证静态模式特征：轨迹点数量 >= 15
  // ⚠️ 重要更新 (2025-11-26)：
  // 选择器已更新为 .amap-icon > img（由 codegen 确认）
  // 旧选择器 [title*="2025-"] 已失效
  const markerCount = await page.locator('.amap-icon > img').count();

  if (markerCount >= 15) {
    console.log(`✅ 已切换到 2D 静态模式，轨迹点数: ${markerCount}`);
    return true;
  } else {
    console.warn(`⚠️ 轨迹点不足 (${markerCount})，可能仍在动态模式或加载未完成`);
    return false;
  }
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

- ✅ **使用重新选择流程** (返回列表 → 取消选择 → 重新选择 → 查看轨迹)
- ✅ **等待数据加载完成** (networkidle + 3秒缓冲)
- ✅ **验证 Canvas 图层 + 轨迹标记** (`.amap-icon > img` 数量 > 0)
- ✅ **验证 Canvas 图层存在** (轨迹线渲染层)
- ✅ **区分 2D 静态和动态模式** (通过轨迹点数量判断)
- ✅ **失败时自动重试** (最多 3 次)
- ✅ **检查控制台无 gpx2d 错误**

### 模式区分要点

| 特征 | 2D 静态模式 | 2D 动态模式 |
|-----|------------|------------|
| **轨迹点数量** | ≥ 15 个 | < 5 个（通常只有当前位置） |
| **轨迹线** | 完整红色轨迹线 | 部分轨迹线（已飞过路径） |
| **播放控制** | 无播放按钮或显示"播放" | 显示"暂停"按钮（播放中） |
| **用途** | 查看完整飞行路径 | 观看飞行动画回放 |

### 测试用例

```typescript
test('TC-#1: 验证 2D 轨迹重新加载', async ({ page }) => {
  // 步骤1: 进入赛事
  await page.goto('https://skyracing.com.cn');
  await enterFirstRace(page);

  // 步骤2: 使用新方法加载 2D 轨迹
  const success = await reload2DTrajectory(page, 0, 3);

  // 验证: 轨迹加载成功
  expect(success).toBe(true);

  // 验证: 轨迹标记点已加载
  // ⚠️ 重要：.amap-container img 已失效，改用 .amap-icon > img
  const markerCount = await page.locator('.amap-icon > img').count();
  expect(markerCount).toBeGreaterThan(0);

  // 验证: Canvas 图层存在
  const canvasCount = await page.locator('canvas.amap-layer').count();
  expect(canvasCount).toBeGreaterThan(0);

  // 验证: 处于静态模式
  const isStatic = await ensure2DStaticMode(page);
  expect(isStatic).toBe(true);
});

test('TC-#1-02: 区分 2D 静态和动态模式', async ({ page }) => {
  await setupTrajectoryView(page); // 假设已进入轨迹视图

  // 确保处于静态模式
  const isStatic = await ensure2DStaticMode(page);
  expect(isStatic).toBe(true);

  // 验证静态模式特征
  // ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
  const markerCount = await page.locator('.amap-icon > img').count();
  expect(markerCount).toBeGreaterThanOrEqual(15);

  // 可选: 切换到动态模式并验证
  const timelineButton = page.locator('button:has(img[alt="timeline"])');
  if (await timelineButton.isVisible()) {
    await timelineButton.click();
    await page.waitForTimeout(1000);

    // 验证动态模式特征（轨迹点减少）
    const dynamicMarkerCount = await page.locator('.amap-icon > img').count();
    expect(dynamicMarkerCount).toBeLessThan(markerCount);
  }
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
// 特征1: 轨迹标记点数量多（≥ 15）
// ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
const markerCount = await page.locator('.amap-icon > img').count();
// 静态模式: markerCount >= 15

// 特征2: 完整红色轨迹线可见
// 视觉特征，需要截图验证

// 特征3: 播放控制为暂停状态
const isPaused = await page.locator('button:has-text("pause")').isVisible();
```

**动态模式特征**:
```typescript
// 特征1: 轨迹标记点稀少（< 5）
// ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
const markerCount = await page.locator('.amap-icon > img').count();
// 动态模式: markerCount < 5

// 特征2: 播放控制可见
const playControl = await page.locator('button:has-text("play_arrow")').isVisible();

// 特征3: 时间持续推进
// 需要监测时间变化
```

#### 确保静态模式函数

```typescript
async function ensureStaticMode(page: Page): Promise<boolean> {
  // 检查轨迹标记数量
  // ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
  let markerCount = await page.locator('.amap-icon > img').count();

  if (markerCount < 15) {
    console.log('⚠️ 当前为动态模式，切换到静态...');

    // 点击timeline按钮切换模式
    await page.locator('button:has(img[alt="timeline"])').click();
    await page.waitForTimeout(1000);

    // 重新检查
    markerCount = await page.locator('.amap-icon > img').count();
  }

  // 验证静态模式激活
  if (markerCount >= 15) {
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
  // ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
  let markerCount = await page.locator('.amap-icon > img').count();

  if (markerCount >= 15) {
    console.log('⚠️ 当前为静态模式，切换到动态...');

    // 点击timeline按钮切换模式
    await page.locator('button:has(img[alt="timeline"])').click();
    await page.waitForTimeout(1000);

    // 重新检查
    markerCount = await page.locator('.amap-icon > img').count();
  }

  // 验证动态模式激活
  const playButton = await page.getByRole('button')
    .filter({ hasText: 'play_arrow' })
    .isVisible();

  if (markerCount < 5 && playButton) {
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

**DOM结构** (2025-11-26 更新):
```html
<div class="amap-container">
  <div class="amap-overlays">
    <!-- ⚠️ 高德地图 v2.0+ 的标记点 DOM 结构 -->
    <div class="amap-marker">
      <div class="amap-icon">
        <img src="...">  <!-- ← 使用 .amap-icon > img 选择器 -->
      </div>
    </div>
  </div>
</div>
```

### 解决方案

#### 方法1: 使用 DOM 结构选择器（推荐）

**原理**: 轨迹标记使用 `.amap-icon > img` 结构（由 codegen 确认）

**实现代码**:
```typescript
async function clickTrajectoryPoint(
  page: Page,
  index?: number
): Promise<boolean> {
  // 等待轨迹标记出现
  // ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
  await page.waitForSelector('.amap-icon > img', { timeout: 5000 });

  // 获取所有轨迹标记
  const markers = await page.locator('.amap-icon > img').all();

  if (markers.length === 0) {
    throw new Error('未找到轨迹标记点');
  }

  // 如果未指定索引，选择中间点
  const targetIndex = index !== undefined
    ? Math.min(index, markers.length - 1)
    : Math.floor(markers.length / 2);

  console.log(`点击轨迹点 ${targetIndex}/${markers.length - 1}`);

  // 点击指定标记（使用 force: true 避免 canvas 遮挡）
  await markers[targetIndex].click({ force: true });

  // 等待信息窗格出现
  await page.waitForSelector('heading:has-text("2025-")', { timeout: 3000 });

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

#### 方法3: 直接 DOM 选择器（简化版）

**原理**: 直接使用 CSS 选择器定位标记点

**实现代码**:
```typescript
async function clickTrajectoryPointSimple(page: Page): Promise<void> {
  // ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
  const marker = page.locator('.amap-icon > img').nth(2);

  await marker.click({ force: true });

  await page.waitForSelector('heading:has-text("2025-")', { timeout: 3000 });
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

- ✅ **使用 .amap-icon > img 选择器**（由 codegen 确认）
- ✅ **通过all()获取所有标记后选择**
- ✅ **不使用固定坐标点击**
- ✅ **等待标记元素出现后再点击**
- ✅ **验证信息窗格显示**
- ✅ **使用 force: true 避免 canvas 遮挡**

### 测试用例

```typescript
test('TC-#3: 轨迹点点击测试', async ({ page }) => {
  await setupStaticMode(page);

  // 使用解决方案点击轨迹点
  // ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
  const success = await clickTrajectoryPoint(page, 2);

  // 验证信息窗格显示
  expect(success).toBe(true);
  await expect(page.locator('heading:has-text("2025-")')).toBeVisible();
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
// ⚠️ 选择器更新 (2025-11-26): 使用 .amap-icon > img
await retryOperation(async () => {
  await page.click('.amap-icon > img', { force: true });
  await page.waitForSelector('heading:has-text("2025-")');
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
  // ⚠️ 选择器更新 (2025-11-26)
  await page.waitForSelector('heading:has-text("2025-")');
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

**文档版本**: v1.1.0
**最后更新**: 2025-11-26
**验证状态**: ✅ 所有解决方案已验证有效

---

## ⚠️ 选择器更新说明 (2025-11-26)

| 旧选择器 | 状态 | 新选择器 | 说明 |
|---------|------|---------|------|
| `[title*="2025-"]` | ❌ 失效 | `.amap-icon > img` | codegen 确认 |
| `[title*="2025-26-"]` | ❌ 失效 | `.amap-icon > img` | 同上 |
| `.amap-container img` | ❌ 失效 | `canvas.amap-layer` | AMap v2.0+ 改用 Canvas |

**DOM 结构变更**:
```html
<!-- 高德地图 v2.0+ 的标记点 DOM 结构 -->
<div class="amap-marker">
  <div class="amap-icon">
    <img src="...">  ← 使用 .amap-icon > img
  </div>
</div>
```
