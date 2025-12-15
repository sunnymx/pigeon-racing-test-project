# 详细测试用例文档

## 文档信息
- **项目名称**: PIGEON_RACING_TEST_PROJECT
- **文档版本**: v1.1.0 (UPDATED 2025-11-27)
- **创建日期**: 2025-11-17
- **最后更新**: 2025-11-27
- **总测试用例数**: 38 (P0: 11, P1: 19, P2: 8)
- **P0 实现状态**: ✅ **100% 通过 (15/15 tests)**
- **优先级分布**: P0 (11), P1 (19), P2 (8)

---

## 测试用例索引

| 序号 | 测试文件 | 用例数 | 优先级 | 实现状态 | 预计时间 |
|------|---------|--------|--------|----------|---------|
| 01 | race-list.spec.ts | 5 | P1 | ⏳ 待实现 | 2 min |
| 02 | tc-02-001-2d-static.spec.ts | 3 | P0 | ✅ **100%** | 1 min |
| 03 | tc-03-001-mode-switch.spec.ts | 5 | P0 | ✅ **100%** | 1 min |
| 04 | tc-04-001-3d-mode.spec.ts | 7 | P0 | ✅ **100%** | 1 min |
| 05 | loft-list.spec.ts | 4 | P1 | ⏳ 待实现 | 3 min |
| 06 | trajectory-detail.spec.ts | 4 | P1 | ⏳ 待实现 | 2 min |
| 07 | ui-elements.spec.ts | 6 | P2 | ⏳ 待实现 | 3 min |

**实现进度** (2025-11-27):
- **P0 测试**: ✅ **15/15 通过 (100%)**
  - TC-02-001: 3 tests ✅
  - TC-03-001: 5 tests ✅
  - TC-04-001: 7 tests ✅
- **P1 测试**: ⏳ 0/19 (待实现)
- **P2 测试**: ⏳ 0/8 (待实现)

**优先级说明**:
- **P0**: 核心功能，必须通过 → ✅ **已全部通过**
- **P1**: 重要功能，高优先级 → ⏳ 待实现
- **P2**: 辅助功能，中优先级 → ⏳ 待实现

---

## 01. 赛事列表测试 (race-list.spec.ts)

### TC-01-001: 首页加载验证
**优先级**: P1
**前置条件**: 浏览器已启动
**测试步骤**:
1. 导航到 https://skyracing.com.cn
2. 等待页面加载完成（networkidle）
3. 验证页面标题
4. 验证赛事卡片显示

**预期结果**:
- ✅ 页面标题为 "Skyracing GPS pigeon tracker"
- ✅ 至少显示 10 个赛事卡片
- ✅ 无控制台错误

**验证方法**:
```typescript
await expect(page).toHaveTitle(/Skyracing/);
const cards = await page.locator('mat-card').count();
expect(cards).toBeGreaterThanOrEqual(10);
```

---

### TC-01-002: 赛事搜寻功能
**优先级**: P1
**前置条件**: 首页已加载
**测试步骤**:
1. 定位搜寻文本框
2. 输入搜寻关键词（例如: "2024"）
3. 等待结果过滤
4. 验证显示的赛事包含关键词

**预期结果**:
- ✅ 搜寻框可输入
- ✅ 结果自动过滤
- ✅ 显示的赛事名称包含关键词

**验证方法**:
```typescript
await page.getByRole('textbox', { name: '搜寻赛事' }).fill('2024');
await page.waitForTimeout(1000);
const firstCard = await page.locator('mat-card').first();
const text = await firstCard.textContent();
expect(text).toContain('2024');
```

---

### TC-01-003: 年份筛选功能
**优先级**: P1
**前置条件**: 首页已加载
**测试步骤**:
1. 点击年份选择器
2. 选择特定年份（例如: 2024）
3. 等待结果刷新
4. 验证显示的赛事为该年份

**预期结果**:
- ✅ 年份选择器可操作
- ✅ 赛事列表更新
- ✅ 赛事年份正确

**验证方法**:
```typescript
await page.getByRole('combobox').click();
await page.getByRole('option', { name: '2024' }).click();
await page.waitForTimeout(1000);
// 验证赛事卡片包含 2024
```

---

### TC-01-004: 进入赛事详情
**优先级**: P1
**前置条件**: 首页已加载，至少有一个赛事
**测试步骤**:
1. 定位第一个赛事的"进入"按钮
2. 点击按钮
3. 等待页面跳转
4. 验证赛事详情页加载

**预期结果**:
- ✅ "进入"按钮可点击
- ✅ 页面跳转成功
- ✅ 显示排名列表表格

**验证方法**:
```typescript
await page.getByRole('button').filter({ hasText: '进入' }).first().click();
await page.waitForLoadState('networkidle');
await expect(page.getByRole('table')).toBeVisible();
```

---

### TC-01-005: 赛事卡片信息完整性
**优先级**: P2
**前置条件**: 首页已加载
**测试步骤**:
1. 定位第一个赛事卡片
2. 验证卡片包含必要信息

**预期结果**:
- ✅ 赛事名称显示
- ✅ 赛事日期显示
- ✅ "进入"按钮显示

**验证方法**:
```typescript
const firstCard = await page.locator('mat-card').first();
await expect(firstCard).toBeVisible();
await expect(firstCard.getByRole('button', { name: '进入' })).toBeVisible();
```

---

## 02. 2D 静态轨迹测试 (track-2d-static.spec.ts)

### TC-02-001: 选择鸽子并查看轨迹
**优先级**: P0
**前置条件**: 已进入赛事详情页
**测试步骤**:
1. 勾选排名第一的鸽子
2. 验证"勾选清单"计数更新为 1
3. 验证"查看轨迹"按钮启用
4. 点击"查看轨迹"按钮
5. 等待轨迹视图加载

**预期结果**:
- ✅ 复选框可勾选
- ✅ 勾选清单显示 "1"
- ✅ 查看轨迹按钮从禁用变为启用
- ✅ 轨迹视图加载成功

**验证方法**:
```typescript
await page.getByRole('row').first().getByLabel('').click();
await expect(page.getByText('勾选清单 1')).toBeVisible();
const button = page.getByRole('button', { name: '查看轨迹' });
await expect(button).toBeEnabled();
await button.click();
await page.waitForTimeout(3000);
```

---

### TC-02-002: 切换到2D模式（关键测试）
**优先级**: P0
**前置条件**: 轨迹视图已加载
**测试步骤**:
1. 检查当前模式
2. 如果不在 3D 模式，先切换到 3D
3. 切换到 2D 模式
4. 等待地图瓦片加载
5. 验证地图渲染成功

**预期结果**:
- ✅ 按钮文字变为 "3D模式"（表示当前在2D）
- ✅ 地图瓦片加载（>50 个 img 元素）
- ✅ 无 gpx2d undefined 错误

**验证方法**:
```typescript
// 3D→2D 切换序列（基于 TEST_REPORT.md）
const is2D = await page.getByRole('button', { name: '3D模式' }).isVisible();
if (is2D) {
  await page.getByRole('button', { name: '3D模式' }).click();
  await page.waitForTimeout(1000);
}
await page.getByRole('button', { name: '2d 2D模式' }).click();
await page.waitForTimeout(2000);

// 验证地图瓦片
// ⚠️ 已棄用: .amap-container img (AMap v2.0+ 改用 Canvas 渲染)
const tileCount = await page.locator('canvas.amap-layer').count();
expect(tileCount).toBeGreaterThan(0);
```

**参考文档**: [TEST_REPORT.md - 问题#1](../../TEST_REPORT.md#问题-1-2d轨迹初次载入失败)

---

### TC-02-003: 确保静态模式
**优先级**: P0
**前置条件**: 2D 模式已激活
**测试步骤**:
1. 检查轨迹标记点数量
2. 如果少于 3 个，点击 timeline 按钮切换
3. 验证静态模式激活

**预期结果**:
- ✅ 可见多个轨迹标记点（≥3 个）
- ✅ 红色轨迹线完整显示
- ✅ 时间不自动推进

**验证方法**:
```typescript
let markerCount = await page.locator('.amap-icon > img').count();
if (markerCount < 3) {
  await page.locator('button:has(img[alt="timeline"])').click();
  await page.waitForTimeout(1000);
}
markerCount = await page.locator('.amap-icon > img').count();
expect(markerCount).toBeGreaterThanOrEqual(3);
```

**参考文档**: [TEST_REPORT.md - 问题#2](../../TEST_REPORT.md#问题-2-動態靜態模式混淆)

---

### TC-02-004: 点击轨迹点查看信息
**优先级**: P0
**前置条件**: 2D 静态模式已激活
**测试步骤**:
1. 获取所有轨迹标记点
2. 点击中间的一个标记点
3. 等待信息窗格显示
4. 验证信息完整性

**预期结果**:
- ✅ 白色信息窗格出现
- ✅ 显示公环号
- ✅ 显示时间、速度、方向、海拔、名次

**验证方法**:
```typescript
const markers = await page.locator('.amap-icon > img').all();
const middleIndex = Math.floor(markers.length / 2);
await markers[middleIndex].click();

await expect(page.locator('heading:has-text("2025-26-")')).toBeVisible();
await expect(page.locator('text=時間：')).toBeVisible();
await expect(page.locator('text=速度：')).toBeVisible();
await expect(page.locator('text=方向：')).toBeVisible();
await expect(page.locator('text=海拔：')).toBeVisible();
await expect(page.locator('text=名次：')).toBeVisible();
```

**参考文档**: [TEST_REPORT.md - 步骤5](../../TEST_REPORT.md#步驟5-點擊軌跡點查看資訊)

---

### TC-02-005: 轨迹线渲染验证
**优先级**: P1
**前置条件**: 2D 静态模式已激活
**测试步骤**:
1. 截取地图区域截图
2. 验证红色轨迹线可见

**预期结果**:
- ✅ 红色虚线轨迹显示
- ✅ 轨迹连续完整

**验证方法**:
```typescript
await page.locator('.amap-container').screenshot({
  path: 'screenshots/2d-trajectory-line.png'
});
// 视觉验证或像素颜色检测
```

---

### TC-02-006: 网络请求验证
**优先级**: P1
**前置条件**: 准备查看轨迹
**测试步骤**:
1. 设置网络请求监听
2. 点击"查看轨迹"
3. 验证 API 请求发送
4. 验证响应成功

**预期结果**:
- ✅ `ugetPigeonAllJsonInfo` API 被调用
- ✅ 响应状态码 200
- ✅ 返回数据包含轨迹点

**验证方法**:
```typescript
let apiCalled = false;
page.on('request', request => {
  if (request.url().includes('ugetPigeonAllJsonInfo')) {
    apiCalled = true;
  }
});

await page.getByRole('button', { name: '查看轨迹' }).click();
await page.waitForTimeout(3000);
expect(apiCalled).toBe(true);
```

---

## 03. 2D 动画播放测试 (track-2d-playback.spec.ts)

### TC-03-001: 切换到动态播放模式
**优先级**: P0
**前置条件**: 2D 模式已激活
**测试步骤**:
1. 检查当前标记点数量
2. 如果 ≥3 个（静态模式），点击 timeline 切换
3. 验证进入动态模式

**预期结果**:
- ✅ 标记点数量 < 3
- ✅ 播放控制按钮显示
- ✅ 时间开始自动推进

**验证方法**:
```typescript
let markerCount = await page.locator('.amap-icon > img').count();
if (markerCount >= 3) {
  await page.locator('button:has(img[alt="timeline"])').click();
  await page.waitForTimeout(1000);
}
// 验证播放控制可见
await expect(page.getByRole('button').filter({ hasText: 'play_arrow' })).toBeVisible();
```

---

### TC-03-002: 播放功能测试
**优先级**: P0
**前置条件**: 动态播放模式已激活
**测试步骤**:
1. 记录初始时间
2. 点击播放按钮
3. 等待 2 秒
4. 记录当前时间
5. 验证时间已更新

**预期结果**:
- ✅ 播放按钮变为暂停图标
- ✅ 时间戳持续更新
- ✅ Canvas 内容变化

**验证方法**:
```typescript
const initialTime = await page.locator('text=/2025-\\d{2}-\\d{2} \\d{2}:\\d{2}/').textContent();

await page.getByRole('button').filter({ hasText: 'play_arrow' }).click();
await page.waitForTimeout(2000);

const currentTime = await page.locator('text=/2025-\\d{2}-\\d{2} \\d{2}:\\d{2}/').textContent();
expect(currentTime).not.toBe(initialTime);
```

---

### TC-03-003: 暂停功能测试
**优先级**: P0
**前置条件**: 正在播放
**测试步骤**:
1. 点击暂停按钮
2. 记录当前时间
3. 等待 2 秒
4. 验证时间未变化

**预期结果**:
- ✅ 暂停图标变为播放图标
- ✅ 时间停止更新

**验证方法**:
```typescript
await page.getByRole('button').filter({ hasText: 'pause' }).click();
const pausedTime = await page.locator('text=/2025-\\d{2}-\\d{2} \\d{2}:\\d{2}/').textContent();

await page.waitForTimeout(2000);
const stillTime = await page.locator('text=/2025-\\d{2}-\\d{2} \\d{2}:\\d{2}/').textContent();
expect(stillTime).toBe(pausedTime);
```

---

### TC-03-004: 快进功能测试
**优先级**: P1
**前置条件**: 动态播放模式已激活
**测试步骤**:
1. 记录当前时间
2. 点击快进按钮
3. 等待 1 秒
4. 验证时间大幅跳跃

**预期结果**:
- ✅ 时间快速前进
- ✅ 时间跳跃 > 正常播放

**验证方法**:
```typescript
const beforeFastForward = await page.locator('text=/\\d{2}:\\d{2}/').textContent();
await page.getByRole('button').filter({ hasText: 'fast_forward' }).click();
await page.waitForTimeout(1000);
const afterFastForward = await page.locator('text=/\\d{2}:\\d{2}/').textContent();
// 验证时间差
```

---

### TC-03-005: 快退功能测试
**优先级**: P1
**前置条件**: 动态播放模式已激活，时间已前进
**测试步骤**:
1. 记录当前时间
2. 点击快退按钮
3. 等待 1 秒
4. 验证时间回退

**预期结果**:
- ✅ 时间向后退
- ✅ 轨迹回退显示

**验证方法**:
```typescript
const beforeRewind = await page.locator('text=/\\d{2}:\\d{2}/').textContent();
await page.getByRole('button').filter({ hasText: 'fast_rewind' }).click();
await page.waitForTimeout(1000);
const afterRewind = await page.locator('text=/\\d{2}:\\d{2}/').textContent();
// 验证时间回退
```

---

### TC-03-006: 速度调整功能
**优先级**: P1
**前置条件**: 动态播放模式已激活
**测试步骤**:
1. 定位速度滑块
2. 调整到 1x 速度
3. 验证播放速度变慢
4. 调整到 180x 速度
5. 验证播放速度变快

**预期结果**:
- ✅ 滑块可调整
- ✅ 速度显示更新
- ✅ 播放速度实际改变

**验证方法**:
```typescript
const slider = page.locator('slider');
await slider.fill('1');
// 验证速度文本显示 "1x"

await slider.fill('180');
// 验证速度文本显示 "180x"
```

---

### TC-03-007: Canvas 更新验证
**优先级**: P0
**前置条件**: 正在播放
**测试步骤**:
1. 截取 Canvas 初始截图
2. 等待 1 秒
3. 截取 Canvas 当前截图
4. 对比两张截图

**预期结果**:
- ✅ 两张截图不同
- ✅ Canvas 持续更新

**验证方法**:
```typescript
const canvas = page.locator('canvas').first();
const screenshot1 = await canvas.screenshot();
await page.waitForTimeout(1000);
const screenshot2 = await canvas.screenshot();
expect(screenshot1).not.toEqual(screenshot2);
```

---

### TC-03-008: 查看轨迹按钮 2D/3D 模式选择
**优先级**: P1
**前置条件**: 已进入赛事，准备选择鸽子
**测试步骤**:
1. 在排名列表页面，观察"查看轨迹"按钮组中的2D/3D切换按钮
2. 验证按钮显示文本（"2D" 或 "3D"）
3. 测试 **按钮显示"3D"** 时: 选择鸽子，点击"查看轨迹"，验证进入 3D 模式
4. 返回列表，点击切换按钮改为显示"2D"
5. 选择鸽子，点击"查看轨迹"，验证进入 2D 模式

**预期结果**:
- ✅ 2D/3D 切换按钮存在并可点击
- ✅ 按钮显示"3D"时: 进入 3D 播放模式（Cesium引擎，视角1/2按钮，播放控制）
- ✅ 按钮显示"2D"时: 进入 2D 静态模式（AMap 2.0，红色轨迹线，无3D控制）

**验证方法**:
```typescript
// 步骤1: 验证按钮存在
const modeButton = page.getByRole('button', { name: /2D|3D/ });
await expect(modeButton).toBeVisible();

// 步骤2: 测试按钮显示"3D"时进入3D模式
const buttonText = await modeButton.textContent();
if (buttonText.includes('3D')) {
  // 选择鸽子
  await page.locator('input[type="checkbox"]').first().click();
  await page.getByRole('button', { name: '查看轨迹' }).click();

  // 验证进入 3D 模式
  await page.waitForTimeout(3000);
  await expect(page.getByRole('button', { name: '视角1' })).toBeVisible();
  await expect(page.getByRole('button', { name: '视角2' })).toBeVisible();
}

// 步骤3: 切换到"2D"状态并测试
await page.getByRole('button', { name: '退出赛事' }).click();
await page.getByRole('button', { name: '进入' }).first().click();
await modeButton.click(); // 切换到显示"2D"
await page.locator('input[type="checkbox"]').first().click();
await page.getByRole('button', { name: '查看轨迹' }).click();

// 验证进入 2D 模式（无3D控制，有AMap瓦片）
await page.waitForTimeout(3000);
await expect(page.getByRole('button', { name: '视角1' })).not.toBeVisible();
await expect(page.getByRole('button', { name: 'view_in_ar 3D模式' })).toBeVisible();
```

**实际测试结果** (2025-11-17):
- ✅ **测试通过**: 按钮显示的文本（"2D"或"3D"）准确指示点击"查看轨迹"后将进入的模式
- ✅ **3D模式测试**: 按钮显示"3D" → 点击"查看轨迹" → 成功进入3D模式（Cesium 3D渲染，视角1/2按钮可见）
- ✅ **2D模式测试**: 按钮显示"2D" → 点击"查看轨迹" → 成功进入2D模式（AMap平面地图，红色轨迹线，无3D控制）
- 📝 **关键发现**: 按钮显示的文本是模式指示器，而非checkbox勾选状态

**参考截图**:
- `test-3d-mode-confirmed.png` - 按钮显示"3D"时进入3D模式
- `test-2d-mode-confirmed.png` - 按钮显示"2D"时进入2D模式

---

## 04. 3D 轨迹播放测试 (track-3d-playback.spec.ts)

### TC-04-001: 切换到3D模式
**优先级**: P0
**前置条件**: 轨迹视图已加载
**测试步骤**:
1. 点击 "3D模式" 按钮
2. 等待 Cesium 加载
3. 验证 3D 视图渲染

**预期结果**:
- ✅ 按钮文字变为 "2D模式"
- ✅ Cesium 地球显示
- ✅ 3D 轨迹渲染

**验证方法**:
```typescript
await page.getByRole('button').filter({ hasText: '3D模式' }).click();
await page.waitForTimeout(3000);

// 验证 Cesium 初始化
await page.waitForFunction(() => window.Cesium !== undefined);
await expect(page.getByRole('button', { name: '2d 2D模式' })).toBeVisible();
```

---

### TC-04-002: Cesium 引擎加载验证
**优先级**: P0
**前置条件**: 已切换到 3D 模式
**测试步骤**:
1. 检查 window.Cesium 对象
2. 检查 viewer 对象
3. 验证地球瓦片加载

**预期结果**:
- ✅ window.Cesium 已定义
- ✅ window.viewer 已定义
- ✅ 地球瓦片加载完成

**验证方法**:
```typescript
const cesiumReady = await page.evaluate(() => {
  return window.Cesium !== undefined &&
         window.viewer !== undefined;
});
expect(cesiumReady).toBe(true);

// 等待瓦片加载
await page.waitForFunction(() => {
  return window.viewer?.scene.globe.tilesLoaded;
}, { timeout: 30000 });
```

---

### TC-04-003: 3D 播放控制测试
**优先级**: P0
**前置条件**: 3D 模式已激活
**测试步骤**:
1. 点击播放按钮
2. 验证播放状态
3. 点击暂停按钮
4. 验证暂停状态

**预期结果**:
- ✅ 播放/暂停功能正常
- ✅ 按钮图标切换正确

**验证方法**:
```typescript
await page.getByRole('button').filter({ hasText: 'play_arrow' }).click();
await expect(page.getByRole('button').filter({ hasText: 'pause' })).toBeVisible();

await page.getByRole('button').filter({ hasText: 'pause' }).click();
await expect(page.getByRole('button').filter({ hasText: 'play_arrow' })).toBeVisible();
```

---

### TC-04-004: 视角切换功能
**优先级**: P1
**前置条件**: 3D 模式已激活
**测试步骤**:
1. 点击 "视角1" 按钮
2. 截图记录视角1
3. 点击 "视角2" 按钮
4. 截图记录视角2
5. 对比两个视角

**预期结果**:
- ✅ 视角1、视角2 按钮可点击
- ✅ 视角切换后画面改变

**验证方法**:
```typescript
await page.getByRole('button', { name: '视角1' }).click();
const view1 = await page.screenshot();

await page.getByRole('button', { name: '视角2' }).click();
await page.waitForTimeout(1000);
const view2 = await page.screenshot();

expect(view1).not.toEqual(view2);
```

---

### TC-04-005: 显示轨迹点开关
**优先级**: P1
**前置条件**: 3D 模式已激活
**测试步骤**:
1. 点击 "显示轨迹点" 按钮
2. 验证轨迹点显示状态切换

**预期结果**:
- ✅ 按钮文字切换（显示/隐藏）
- ✅ 轨迹点可见性改变

**验证方法**:
```typescript
await page.getByRole('button', { name: '显示轨迹点' }).click();
await page.waitForTimeout(500);
// 验证按钮文字或状态变化
```

---

### TC-04-006: 3D 视觉截图验证
**优先级**: P1
**前置条件**: 3D 模式已激活，轨迹已显示
**测试步骤**:
1. 等待 3D 渲染完成
2. 截取全屏截图
3. 保存为基准图

**预期结果**:
- ✅ 截图清晰
- ✅ 3D 地球可见
- ✅ 轨迹线可见

**验证方法**:
```typescript
await page.waitForTimeout(3000);
await page.screenshot({
  path: 'screenshots/baseline/3d-trajectory.png',
  fullPage: false
});
```

---

## 05. 鸽舍列表测试 (loft-list.spec.ts)

### TC-05-001: 切换到鸽舍列表Tab
**优先级**: P1
**前置条件**: 已进入赛事详情页
**测试步骤**:
1. 定位 "鸽舍列表" Tab
2. 点击切换
3. 验证鸽舍列表显示

**预期结果**:
- ✅ Tab 切换成功
- ✅ 显示鸽舍列表

**验证方法**:
```typescript
await page.getByRole('tab', { name: '鸽舍列表' }).click();
await page.waitForLoadState('networkidle');
// 验证鸽舍列表元素可见
```

---

### TC-05-002: 选择鸽舍
**优先级**: P1
**前置条件**: 鸽舍列表 Tab 已激活
**测试步骤**:
1. 定位第一个鸽舍
2. 点击选择
3. 验证鸽舍展开显示鸽子列表

**预期结果**:
- ✅ 鸽舍可选择
- ✅ 鸽子列表展开

**验证方法**:
```typescript
await page.locator('.loft-item').first().click();
await page.waitForTimeout(1000);
// 验证鸽子列表可见
```

---

### TC-05-003: 勾选鸽舍鸽子并查看轨迹
**优先级**: P1
**前置条件**: 鸽舍已选择，鸽子列表已展开
**测试步骤**:
1. 勾选第一只鸽子
2. 勾选第二只鸽子
3. 验证勾选计数为 2
4. 点击 "查看轨迹"
5. 验证多轨迹显示

**预期结果**:
- ✅ 可勾选多只鸽子
- ✅ 勾选清单显示 "2"
- ✅ 同时显示 2 条轨迹

**验证方法**:
```typescript
await page.locator('.pigeon-checkbox').nth(0).click();
await page.locator('.pigeon-checkbox').nth(1).click();
await expect(page.getByText('勾选清单 2')).toBeVisible();

await page.getByRole('button', { name: '查看轨迹' }).click();
await page.waitForTimeout(5000);
// 验证多条轨迹显示
```

---

### TC-05-004: 多轨迹网络请求验证
**优先级**: P1
**前置条件**: 准备查看多鸽轨迹
**测试步骤**:
1. 设置网络监听
2. 点击 "查看轨迹"
3. 验证多个 API 请求

**预期结果**:
- ✅ 发送多个轨迹数据请求
- ✅ 每只鸽子都有对应请求

**验证方法**:
```typescript
let apiCallCount = 0;
page.on('request', request => {
  if (request.url().includes('ugetPigeonAllJsonInfo')) {
    apiCallCount++;
  }
});

await page.getByRole('button', { name: '查看轨迹' }).click();
await page.waitForTimeout(5000);
expect(apiCallCount).toBeGreaterThanOrEqual(2);
```

---

## 06. 轨迹详情测试 (trajectory-detail.spec.ts)

### TC-06-001: 侧边栏数据完整性验证
**优先级**: P1
**前置条件**: 轨迹视图已加载
**测试步骤**:
1. 定位侧边栏详情面板
2. 提取所有栏位数据
3. 验证数据格式和合理性

**预期结果**:
- ✅ 所有栏位都有值
- ✅ 数据格式正确
- ✅ 数值在合理范围内

**验证方法**:
```typescript
// 验证公环号格式
const ringNumber = await page.locator('text=公環號').locator('..').textContent();
expect(ringNumber).toMatch(/\d{4}-\d{2}-\d{7}/);

// 验证时间格式
const startTime = await page.locator('text=起點時間').locator('..').textContent();
expect(startTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);

// 验证分速 > 0
const avgSpeed = await page.locator('text=平均分速').locator('..').textContent();
const speed = parseInt(avgSpeed);
expect(speed).toBeGreaterThan(0);

// 验证距离 > 0
const distance = await page.locator('text=實際距離').locator('..').textContent();
expect(parseFloat(distance)).toBeGreaterThan(0);
```

---

### TC-06-002: 轨迹统计数据验证
**优先级**: P1
**前置条件**: 轨迹视图已加载
**测试步骤**:
1. 提取统计数据
2. 验证数据逻辑关系

**预期结果**:
- ✅ 最高分速 ≥ 平均分速
- ✅ 最大高度 ≥ 平均高度
- ✅ 实际距离 ≥ 直线距离

**验证方法**:
```typescript
const avgSpeed = parseInt(await page.locator('text=平均分速').locator('..').textContent());
const maxSpeed = parseInt(await page.locator('text=最高分速').locator('..').textContent());
expect(maxSpeed).toBeGreaterThanOrEqual(avgSpeed);

const avgAlt = parseInt(await page.locator('text=平均高度').locator('..').textContent());
const maxAlt = parseInt(await page.locator('text=最大高度').locator('..').textContent());
expect(maxAlt).toBeGreaterThanOrEqual(avgAlt);
```

---

### TC-06-003: 轨迹点窗格信息验证
**优先级**: P1
**前置条件**: 2D 静态模式，轨迹点已点击
**测试步骤**:
1. 点击轨迹点
2. 验证弹窗显示
3. 提取所有信息字段
4. 验证数据完整性

**预期结果**:
- ✅ 公环号、时间、速度、方向、海拔、名次都显示
- ✅ 数据格式正确

**验证方法**:
```typescript
await markers[0].click();

const popup = page.locator('.trajectory-point-popup');
await expect(popup.locator('heading:has-text("2025-26-")')).toBeVisible();
await expect(popup.locator('text=時間：')).toBeVisible();
await expect(popup.locator('text=速度：')).toBeVisible();
await expect(popup.locator('text=方向：')).toBeVisible();
await expect(popup.locator('text=海拔：')).toBeVisible();
await expect(popup.locator('text=名次：')).toBeVisible();
```

---

### TC-06-004: 实时数据更新验证
**优先级**: P2
**前置条件**: 动态播放模式
**测试步骤**:
1. 开始播放
2. 记录侧边栏当前数据
3. 等待播放
4. 验证数据更新

**预期结果**:
- ✅ 当前速度实时更新
- ✅ 当前海拔实时更新
- ✅ 已飞行时间持续增加

**验证方法**:
```typescript
const initialSpeed = await page.locator('text=當前分速').locator('..').textContent();

await page.getByRole('button').filter({ hasText: 'play_arrow' }).click();
await page.waitForTimeout(3000);

const currentSpeed = await page.locator('text=當前分速').locator('..').textContent();
// 验证速度可能已变化
```

---

## 07. 界面元素综合测试 (ui-elements.spec.ts)

### TC-07-001: 按钮状态测试
**优先级**: P2
**前置条件**: 赛事详情页已加载
**测试步骤**:
1. 验证 "查看轨迹" 按钮初始为禁用
2. 勾选鸽子后验证按钮启用
3. 取消勾选后验证按钮禁用

**预期结果**:
- ✅ 按钮状态正确切换
- ✅ 禁用时不可点击

**验证方法**:
```typescript
const button = page.getByRole('button', { name: '查看轨迹' });
await expect(button).toBeDisabled();

await page.getByRole('row').first().getByLabel('').click();
await expect(button).toBeEnabled();

await page.getByRole('row').first().getByLabel('').click();
await expect(button).toBeDisabled();
```

---

### TC-07-002: 勾选清单计数测试
**优先级**: P2
**前置条件**: 赛事详情页已加载
**测试步骤**:
1. 勾选 1 只鸽子，验证显示 "1"
2. 再勾选 1 只，验证显示 "2"
3. 取消 1 只，验证显示 "1"

**预期结果**:
- ✅ 计数准确更新

**验证方法**:
```typescript
await page.getByRole('row').nth(0).getByLabel('').click();
await expect(page.getByText('勾选清单 1')).toBeVisible();

await page.getByRole('row').nth(1).getByLabel('').click();
await expect(page.getByText('勾选清单 2')).toBeVisible();

await page.getByRole('row').nth(0).getByLabel('').click();
await expect(page.getByText('勾选清单 1')).toBeVisible();
```

---

### TC-07-003: 播放图标切换测试
**优先级**: P2
**前置条件**: 轨迹播放页已加载
**测试步骤**:
1. 验证初始显示播放图标
2. 点击播放，验证变为暂停图标
3. 点击暂停，验证变为播放图标

**预期结果**:
- ✅ 图标正确切换

**验证方法**:
```typescript
await expect(page.locator('button:has-text("play_arrow")')).toBeVisible();
await page.locator('button:has-text("play_arrow")').click();
await expect(page.locator('button:has-text("pause")')).toBeVisible();
```

---

### TC-07-004: 加载对话框行为测试
**优先级**: P2
**前置条件**: 准备查看轨迹
**测试步骤**:
1. 点击 "查看轨迹"
2. 验证加载对话框出现
3. 等待加载完成
4. 验证对话框消失

**预期结果**:
- ✅ 加载对话框显示
- ✅ 加载完成后自动消失

**验证方法**:
```typescript
await page.getByRole('button', { name: '查看轨迹' }).click();
// 验证加载提示（如果有）
await page.waitForLoadState('networkidle');
// 验证轨迹视图已显示
```

---

### TC-07-005: 表格行数验证
**优先级**: P2
**前置条件**: 赛事详情页已加载
**测试步骤**:
1. 获取排名表格行数
2. 验证行数合理

**预期结果**:
- ✅ 表格至少有 10 行

**验证方法**:
```typescript
const rows = await page.getByRole('row').count();
expect(rows).toBeGreaterThanOrEqual(10);
```

---

### TC-07-006: 控制台错误监控
**优先级**: P2
**前置条件**: 任何页面
**测试步骤**:
1. 设置控制台监听
2. 执行各种操作
3. 收集错误日志
4. 验证无严重错误

**预期结果**:
- ✅ 无 JavaScript 错误（或仅已知错误）

**验证方法**:
```typescript
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});

// 执行测试操作...

// 验证错误列表
const criticalErrors = errors.filter(e => !e.includes('known issue'));
expect(criticalErrors.length).toBe(0);
```

---

## 附录

### A. 测试数据说明

**默认测试赛事**: 首页第一个赛事
**默认测试鸽子**: 排名第一的鸽子
**默认轨迹点**: 中间位置的轨迹点

### B. 截图命名规范

```
screenshots/
├── baseline/                  # 基准截图
│   ├── 2d-trajectory.png
│   ├── 3d-trajectory.png
│   └── trajectory-point.png
├── actual/                    # 实际截图
│   └── {test-case-id}-{timestamp}.png
└── diff/                      # 差异截图
    └── {test-case-id}-diff.png
```

### C. 优先级定义

- **P0 (Critical)**: 核心功能，必须 100% 通过
- **P1 (High)**: 重要功能，通过率 ≥ 95%
- **P2 (Medium)**: 辅助功能，通过率 ≥ 90%
- **P3 (Low)**: 增强功能，可选

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-17
**总测试用例数**: 35
