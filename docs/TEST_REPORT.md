# Skyracing.com.cn 互動測試報告

## 文件資訊
- **專案名稱**: PIGEON_RACING_TEST_PROJECT
- **測試網站**: https://skyracing.com.cn/
- **報告版本**: v0.1.0
- **建立日期**: 2025-11-17
- **測試類型**: 手工互動測試 (Manual Interactive Testing)
- **測試工具**: Playwright MCP
- **測試目標**: 2D軌跡查看功能驗證

---

## 版本歷史

| 版本 | 日期 | 測試範圍 | 主要發現 | 狀態 |
|------|------|----------|----------|------|
| v0.1.0 | 2025-11-17 | 2D軌跡點資訊查看 | 成功複現軌跡點點擊功能 | ✅ 完成 |

---

## 測試範圍 (v0.1.0)

### 已測試功能
1. ✅ 網站首頁載入
2. ✅ 賽事列表顯示
3. ✅ 賽事詳情進入
4. ✅ 鴿子選擇（排名第一）
5. ✅ 軌跡視圖載入
6. ✅ 2D/3D模式切換
7. ✅ 2D軌跡渲染
8. ✅ 軌跡點資訊彈窗

### 未測試功能（待後續版本）
- ⏳ 3D軌跡視圖詳細功能
- ⏳ 多隻鴿子同時軌跡比較
- ⏳ 雷達模式
- ⏳ 時速表顯示
- ⏳ 軌跡動畫播放控制
- ⏳ 鴿舍列表功能
- ⏳ 搜尋功能（環號/名次）
- ⏳ 不同年份賽事切換
- ⏳ 其他賽事測試

---

## 關鍵問題與解決方案

### 問題 #1: 2D軌跡初次載入失敗
**嚴重程度**: 🔴 高
**發現版本**: v0.1.0
**測試步驟**:
1. 選擇鴿子
2. 點擊「查看軌跡」
3. 點擊「2D模式」按鈕

**問題描述**:
- 首次切換到2D模式時，軌跡未正確渲染
- 控制台錯誤: `ERROR Error: pigeon.gpx2d undefined`
- 地圖顯示空白或僅顯示地形，沒有軌跡線

**根本原因**:
- 2D軌跡資料 (gpx2d) 在首次請求時可能尚未完全載入
- 前端在切換模式時未等待資料載入完成就嘗試渲染

**解決方案**:
```
方法1: 3D→2D→3D→2D 切換序列
1. 首次進入軌跡視圖時為3D模式（或2D但未渲染）
2. 點擊切換到3D模式（確保進入3D）
3. 再次點擊切換回2D模式
4. 此時2D軌跡資料已載入，可正常顯示

方法2: 等待載入完成
- 進入軌跡視圖後等待3-5秒
- 確認地圖圖磚完全載入
- 再進行2D模式切換
```

**自動化腳本建議**:
```javascript
// 推薦的2D模式切換流程
async function switchTo2DMode(page) {
  // 1. 確保先在3D模式
  const current3DButton = await page.locator('button:has-text("3D模式")').isVisible();
  if (!current3DButton) {
    await page.locator('button:has-text("2D模式")').click();
    await page.waitForTimeout(1000);
  }

  // 2. 切換到2D模式
  await page.locator('button:has-text("2D模式")').click();
  await page.waitForTimeout(2000);

  // 3. 驗證地圖圖磚載入（檢查img元素數量）
  const tileCount = await page.locator('.amap-container img').count();
  if (tileCount < 50) { // 正常應該有150+個圖磚
    // 重試切換
    await page.locator('button:has-text("3D模式")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("2D模式")').click();
    await page.waitForTimeout(2000);
  }
}
```

**預防措施**:
- ✅ 總是使用3D→2D切換序列
- ✅ 等待地圖圖磚載入完成
- ✅ 檢查軌跡線是否存在（紅色虛線）
- ✅ 失敗時重試切換流程

---

### 問題 #2: 動態/靜態模式混淆
**嚴重程度**: 🟡 中
**發現版本**: v0.1.0
**測試步驟**:
1. 2D模式已載入
2. 點擊timeline按鈕

**問題描述**:
- 點擊timeline按鈕會切換動態/靜態模式
- 動態模式：軌跡動畫播放，時間軸推進
- 靜態模式：顯示完整軌跡，所有軌跡點可見可點擊
- 初次點擊可能進入錯誤模式

**解決方案**:
```
判斷當前模式：
- 靜態模式特徵：
  * 可看到完整紅色虛線軌跡
  * 地圖上有多個軌跡標記點 (generic "2025-26-0053539")
  * 播放控制為暫停圖標

- 動態模式特徵：
  * 僅顯示部分軌跡（動畫進行中）
  * 播放控制為播放/快進/快退
  * 時間持續推進
```

**自動化腳本建議**:
```javascript
async function ensureStaticMode(page) {
  // 檢查是否有多個軌跡標記（靜態模式特徵）
  const markerCount = await page.locator('generic[title*="2025-26-"]').count();

  if (markerCount < 3) {
    // 當前為動態模式，切換到靜態
    await page.locator('button:has(img[alt="timeline"])').click();
    await page.waitForTimeout(1000);
  }

  // 驗證靜態模式：應該看到多個軌跡標記
  const newMarkerCount = await page.locator('generic[title*="2025-26-"]').count();
  return newMarkerCount >= 3;
}
```

---

### 問題 #3: 軌跡點點擊無回應
**嚴重程度**: 🟡 中
**發現版本**: v0.1.0
**測試步驟**:
1. 2D靜態模式已載入
2. 嘗試點擊地圖上的軌跡點

**問題描述**:
- 直接使用座標點擊地圖容器無效
- 點擊`.amap-container`無法觸發軌跡點資訊
- 需要精確點擊軌跡標記元素

**根本原因**:
- 軌跡標記是獨立的DOM元素，不是Canvas繪製
- 需要通過accessibility snapshot找到標記元素的ref
- 標記元素結構: `generic "2025-26-0053539" [ref=eXXXX]`

**解決方案**:
```
正確的點擊方法：
1. 使用browser_snapshot獲取頁面結構
2. 找到軌跡標記元素：generic "2025-26-0053539" [ref=eXXXX]
3. 使用找到的ref進行點擊
4. 不要使用固定座標點擊
```

**成功案例**:
```javascript
// ❌ 錯誤方法
await page.locator('.amap-container').click({ position: { x: 600, y: 400 } });

// ✅ 正確方法
// 1. 先獲取snapshot
const snapshot = await page.accessibility.snapshot();

// 2. 找到軌跡標記元素
await page.click('aria-ref=e5233'); // 使用從snapshot中獲取的ref

// 或使用title選擇器
await page.getByTitle('2025-26-').nth(2).click();
```

**自動化腳本建議**:
```javascript
async function clickTrajectoryPoint(page, pointIndex = 0) {
  // 等待軌跡標記出現
  await page.waitForSelector('generic[title*="2025-26-"]', { timeout: 5000 });

  // 獲取所有軌跡標記
  const markers = await page.locator('generic[title*="2025-26-"]').all();

  if (markers.length === 0) {
    throw new Error('No trajectory markers found');
  }

  // 點擊指定的標記點
  const targetIndex = Math.min(pointIndex, markers.length - 1);
  await markers[targetIndex].click();

  // 等待資訊窗格出現
  await page.waitForSelector('heading:has-text("2025-26-0053539")', { timeout: 3000 });

  return true;
}
```

---

### 問題 #4: 資料載入時序問題
**嚴重程度**: 🟡 中
**發現版本**: v0.1.0

**問題描述**:
- 控制台多次出現資料未定義錯誤
- `ERROR TypeError: Cannot read properties of undefined (reading 'id')`
- `ERROR TypeError: Cannot read properties of undefined (reading 'points')`

**影響**:
- 雖然出現錯誤，但不影響最終功能
- 可能導致首次操作失敗，需要重試

**解決方案**:
- 在所有操作前增加適當的等待時間
- 使用重試機制處理暫時性失敗
- 驗證關鍵元素存在後再進行操作

---

## 成功流程記錄

### 完整操作流程 (v0.1.0 驗證通過)

#### 步驟1: 開啟網站並進入賽事
```javascript
// 1. 導航到網站
await page.goto('https://skyracing.com.cn/');

// 2. 等待頁面載入
await page.waitForLoadState('networkidle');

// 3. 點擊第一個賽事的「進入」按鈕
await page.getByRole('button').filter({ hasText: '进入' }).first().click();
```

**驗證點**:
- ✅ 頁面標題: "Skyracing GPS pigeon tracker"
- ✅ 賽事卡片顯示
- ✅ 進入按鈕可點擊

---

#### 步驟2: 選擇鴿子並查看軌跡
```javascript
// 1. 勾選排名第一的鴿子
await page.getByRole('row', { name: '2025-26-0053539' }).getByLabel('').click();

// 2. 驗證勾選清單更新
// 應該看到「勾选清单 1」

// 3. 點擊「查看軌跡」按鈕
await page.getByRole('button', { name: '查看轨迹' }).click();

// 4. 等待軌跡視圖載入
await page.waitForTimeout(3000);
```

**驗證點**:
- ✅ 勾選清單顯示 "1"
- ✅ 查看軌跡按鈕已啟用
- ✅ 載入對話框出現後消失
- ✅ 軌跡詳情面板顯示

---

#### 步驟3: 切換到2D模式
```javascript
// 重要：使用3D→2D切換序列確保資料載入

// 1. 先確保在3D模式
const button2D = await page.getByRole('button', { name: '2d 2D模式' });
const is2DMode = await button2D.isVisible();

if (!is2DMode) {
  // 當前已在3D，需先切到2D再切回3D
  await page.getByRole('button', { name: 'view_in_ar 3D模式' }).click();
  await page.waitForTimeout(1000);
}

// 2. 切換到2D模式
await page.getByRole('button', { name: '2d 2D模式' }).click();
await page.waitForTimeout(2000);

// 3. 驗證地圖圖磚載入
const tileCount = await page.locator('.amap-container img').count();
console.log(`Map tiles loaded: ${tileCount}`);
```

**驗證點**:
- ✅ 按鈕文字變更為「3D模式」（表示當前在2D）
- ✅ 地圖圖磚載入（>100個img元素）
- ✅ 紅色軌跡線可見

---

#### 步驟4: 確保靜態模式
```javascript
// 1. 檢查軌跡標記數量
const markerCount = await page.locator('[title*="2025-26-"]').count();

// 2. 如果少於3個標記，表示在動態模式，需切換
if (markerCount < 3) {
  await page.locator('button:has(img[alt="timeline"])').click();
  await page.waitForTimeout(1000);
}

// 3. 再次驗證
const finalMarkerCount = await page.locator('[title*="2025-26-"]').count();
console.log(`Trajectory markers visible: ${finalMarkerCount}`);
```

**驗證點**:
- ✅ 可見多個軌跡標記點（≥3個）
- ✅ 完整紅色軌跡線顯示
- ✅ 時間不再自動推進

---

#### 步驟5: 點擊軌跡點查看資訊
```javascript
// 1. 獲取所有軌跡標記
const markers = await page.locator('[title*="2025-26-"]').all();
console.log(`Found ${markers.length} trajectory markers`);

// 2. 點擊中間的一個標記
const middleIndex = Math.floor(markers.length / 2);
await markers[middleIndex].click();

// 3. 等待資訊窗格顯示
await page.waitForSelector('heading:has-text("2025-26-0053539")');

// 4. 截圖記錄
await page.screenshot({ path: 'trajectory-point-info.png' });
```

**驗證點**:
- ✅ 白色資訊窗格出現
- ✅ 顯示完整軌跡點資訊：
  - 公環號: 2025-26-0053539
  - 時間: YYYY-MM-DD HH:MM:SS
  - 速度: XXXX m/min
  - 方向: 東/西/南/北
  - 海拔: XXX m
  - 名次: 1
- ✅ 底部黃色資訊條同步更新
- ✅ 關閉按鈕 (×) 可見

---

## 測試數據記錄

### 成功案例數據
**測試案例**: 點擊軌跡點查看資訊
**測試日期**: 2025-11-17
**測試結果**: ✅ 成功

**軌跡點資訊範例1**:
```
公環號: 2025-26-0053539
時間: 2025-11-14 07:46:54
速度: 1380 m/min
方向: 西南
海拔: 169 m
名次: 1
```

**軌跡點資訊範例2**:
```
公環號: 2025-26-0053539
時間: 2025-11-14 08:59:56
速度: 1380 m/min
方向: 西南
海拔: 193 m
名次: 1
```

**軌跡總體資訊**:
```
起點時間: 2025-11-14 07:06:00
終點時間: 2025-11-14 13:44:12
持續時間: 06:38:12
平均分速: 1295 m/min
最高分速: 1560 m/min
平均高度: 159 m
最大高度: 296 m
實際距離: 519.62 km
直線距離: 507.99 km
```

---

## 自動化腳本框架建議

### 推薦的腳本結構
```javascript
// test-trajectory-2d.spec.js

const { test, expect } = require('@playwright/test');

test.describe('Skyracing 2D Trajectory Test', () => {

  test.beforeEach(async ({ page }) => {
    // 基礎設置
    await page.goto('https://skyracing.com.cn/');
    await page.waitForLoadState('networkidle');
  });

  test('應能成功查看2D軌跡點資訊', async ({ page }) => {
    // 步驟1: 進入賽事
    await enterFirstRace(page);

    // 步驟2: 選擇鴿子
    await selectFirstPigeon(page);

    // 步驟3: 查看軌跡
    await viewTrajectory(page);

    // 步驟4: 切換到2D模式（使用重試機制）
    await switchTo2DMode(page);

    // 步驟5: 確保靜態模式
    await ensureStaticMode(page);

    // 步驟6: 點擊軌跡點
    const success = await clickTrajectoryPoint(page, 2);
    expect(success).toBe(true);

    // 步驟7: 驗證資訊窗格
    await verifyTrajectoryPointInfo(page);
  });

  // 輔助函數
  async function enterFirstRace(page) {
    await page.getByRole('button').filter({ hasText: '进入' }).first().click();
    await page.waitForTimeout(2000);
  }

  async function selectFirstPigeon(page) {
    await page.getByRole('row', { name: /2025-26-/ }).first().getByLabel('').click();
    await expect(page.getByText('勾选清单 1')).toBeVisible();
  }

  async function viewTrajectory(page) {
    await page.getByRole('button', { name: '查看轨迹' }).click();
    await page.waitForTimeout(3000);
  }

  async function switchTo2DMode(page, retries = 2) {
    for (let i = 0; i < retries; i++) {
      // 3D→2D切換序列
      const is2D = await page.locator('button:has-text("3D模式")').isVisible();

      if (!is2D) {
        await page.locator('button:has-text("2D模式")').click();
        await page.waitForTimeout(1000);
      }

      await page.locator('button:has-text("2D模式")').click();
      await page.waitForTimeout(2000);

      // 驗證載入
      const tileCount = await page.locator('.amap-container img').count();
      if (tileCount > 50) {
        return true;
      }
    }
    throw new Error('Failed to switch to 2D mode');
  }

  async function ensureStaticMode(page) {
    const markerCount = await page.locator('[title*="2025-26-"]').count();

    if (markerCount < 3) {
      await page.locator('button:has(img[alt="timeline"])').click();
      await page.waitForTimeout(1000);
    }

    const finalCount = await page.locator('[title*="2025-26-"]').count();
    expect(finalCount).toBeGreaterThanOrEqual(3);
  }

  async function clickTrajectoryPoint(page, index = 0) {
    await page.waitForSelector('[title*="2025-26-"]', { timeout: 5000 });
    const markers = await page.locator('[title*="2025-26-"]').all();

    if (markers.length === 0) return false;

    const targetIndex = Math.min(index, markers.length - 1);
    await markers[targetIndex].click();

    await page.waitForSelector('heading:has-text("2025-26-")', { timeout: 3000 });
    return true;
  }

  async function verifyTrajectoryPointInfo(page) {
    // 驗證主要資訊欄位
    await expect(page.locator('heading:has-text("2025-26-")')).toBeVisible();
    await expect(page.locator('text=時間：')).toBeVisible();
    await expect(page.locator('text=速度：')).toBeVisible();
    await expect(page.locator('text=方向：')).toBeVisible();
    await expect(page.locator('text=海拔：')).toBeVisible();
    await expect(page.locator('text=名次：')).toBeVisible();

    // 截圖
    await page.screenshot({
      path: `trajectory-point-${Date.now()}.png`,
      fullPage: false
    });
  }
});
```

---

## 經驗教訓總結

### ✅ 成功經驗

1. **3D→2D切換序列是關鍵**
   - 不要直接切換到2D
   - 總是先確保在3D，再切到2D
   - 這樣可確保gpx2d資料載入

2. **使用Accessibility Snapshot**
   - Playwright的snapshot提供完整DOM結構
   - 可精確找到軌跡標記元素
   - 比座標點擊更可靠

3. **適當的等待時間**
   - 每次操作後增加1-3秒等待
   - 確保地圖圖磚完全載入
   - 避免操作過快導致失敗

4. **動靜態模式識別**
   - 通過軌跡標記數量判斷模式
   - 靜態模式：多個標記可見（≥3）
   - 動態模式：標記稀少或無

### ❌ 失敗教訓

1. **不要使用固定座標點擊**
   - 地圖會縮放、平移
   - 軌跡位置不固定
   - 座標點擊不可靠

2. **不要忽略控制台錯誤**
   - gpx2d undefined 表示資料未載入
   - 需要重試載入流程
   - 錯誤會導致功能異常

3. **不要跳過驗證步驟**
   - 每個關鍵步驟都要驗證
   - 確認元素存在再操作
   - 避免連鎖失敗

---

## 待測試項目（下一版本）

### v0.2.0 計劃
- [ ] 3D軌跡視圖功能測試
- [ ] 視角切換（視角1、視角2）
- [ ] 軌跡點顯示開關
- [ ] 歸返軌跡隱藏功能

### v0.3.0 計劃
- [ ] 雷達模式測試
- [ ] 時速表顯示功能
- [ ] 動畫播放控制（播放/暫停/快進/快退）
- [ ] 時間軸拖動功能

### v0.4.0 計劃
- [ ] 多隻鴿子比較
- [ ] 勾選清單功能
- [ ] 鴿舍列表功能
- [ ] 環號搜尋
- [ ] 名次搜尋

### v0.5.0 計劃
- [ ] 不同賽事測試
- [ ] 年份切換測試
- [ ] 性能測試
- [ ] 錯誤恢復測試

---

## 已知限制

1. **瀏覽器要求**
   - 需要Playwright瀏覽器
   - Chrome/Chromium推薦

2. **網路要求**
   - 需要穩定網路連線
   - 地圖圖磚載入需要時間

3. **資料依賴**
   - 測試依賴線上資料
   - 賽事資料可能變更

---

## 附錄

### A. 關鍵元素選擇器

```javascript
// 賽事列表
const raceCards = 'mat-card';
const enterButton = 'button:has-text("进入")';

// 鴿子列表
const pigeonRow = 'role=row';
const pigeonCheckbox = 'label=""';

// 軌跡控制
const viewTrajectoryButton = 'button:has-text("查看轨迹")';
const mode2DButton = 'button:has-text("2D模式")';
const mode3DButton = 'button:has-text("3D模式")';
const timelineButton = 'button:has(img[alt="timeline"])';

// 地圖元素
const mapContainer = '.amap-container';
const mapTiles = '.amap-container img';
const trajectoryMarker = '[title*="2025-26-"]';

// 資訊窗格
const infoPopup = 'heading:has-text("2025-26-")';
const closeButton = 'text=×';
```

### B. 錯誤代碼對照

| 錯誤訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `pigeon.gpx2d undefined` | 2D資料未載入 | 使用3D→2D切換序列 |
| `Cannot read properties of undefined (reading 'id')` | 資料請求失敗 | 重試操作，增加等待時間 |
| `Cannot read properties of undefined (reading 'points')` | 軌跡點資料缺失 | 重新載入軌跡視圖 |
| `_leaflet_id' in undefined` | Leaflet地圖初始化失敗 | 重新整理頁面 |

### C. 截圖命名規範

```
格式: {功能}_{狀態}_{時間戳}.png

範例:
- skyracing-homepage.png
- skyracing-event-details.png
- skyracing-2d-trajectory.png
- skyracing-2d-trajectory-loaded.png
- skyracing-trajectory-point-popup.png
- trajectory-point-clicked.png
```

---

## 文件維護

### 更新規則
1. 每次新測試後更新版本號
2. 記錄新發現的問題和解決方案
3. 更新測試範圍和待測項目
4. 保留歷史版本記錄

### 版本號規則
- 主版本(Major): 重大功能測試完成
- 次版本(Minor): 新功能測試完成
- 修訂版(Patch): 問題修復和小更新

### 聯絡資訊
- 測試執行: Claude Code + Playwright MCP
- 報告維護: 測試團隊
- 最後更新: 2025-11-17

---

**報告結束**
