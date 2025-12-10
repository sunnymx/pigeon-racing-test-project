# 記錄點 #05: 3D 模式完整功能

**優先級**: P0
**狀態**: 待開發
**對應測試**: `tests/e2e/user-journey/stage-5-3d-mode.spec.ts`

---

## 概述

3D 模式使用 Cesium 引擎渲染立體軌跡，提供視角切換、顯示控制和播放功能。

---

## 進入方式

- 前置記錄點: #1 → #2
- 操作步驟:
  - 方式 A: 在賽事詳情設定 3D 偏好 → 查看軌跡
  - 方式 B: 在 2D 模式點擊「3D模式」按鈕

---

## DOM 結構與選擇器

| 區域 | 元素 | 選擇器 | 功能 |
|------|------|--------|------|
| 地圖 | Cesium | `.cesium-viewer` / `.cesium-widget` | 3D 渲染 |
| 右側 | 視角1 | `button "视角1"` | 預設視角 |
| 右側 | 視角2 | `button "视角2"` | 替代視角 |
| 右側 | 軌跡點 | `button "显示轨迹点"` | 顯示/隱藏 |
| 右側 | 歸返軌跡 | `button "隐藏归返轨迹"` | 顯示/隱藏 |
| 右側 | 排名榜 | `button "隐藏排名榜"` | 顯示/隱藏 |
| 右側 | 時速表 | `button "隐藏时速表"` | 顯示/隱藏 |
| 右側 | 播放控制 | play_arrow / fast_forward / fast_rewind | 動畫控制 |
| 右下 | 2D切換 | `button "2D模式"` | 切換到 2D |

---

## 檢測 3D 模式

```typescript
// 正確方式: 檢查 Cesium 元素
await page.waitForSelector('[class*="cesium"]');
// 或檢查視角按鈕
await page.getByRole('button', { name: /[视視]角1/ });
```

---

## 測試檢查點

| # | 檢查項目 | 優先級 | 驗證方式 | 狀態 |
|---|---------|--------|---------|------|
| 5.1 | 3D 切換 | P0 | Cesium 元素存在 | ⬜ |
| 5.2 | Cesium 初始化 | P0 | `.cesium-viewer` 可見 | ⬜ |
| 5.3 | 視角1 按鈕 | P0 | 按鈕可點擊 | ⬜ |
| 5.4 | 視角2 按鈕 | P0 | 按鈕可點擊 | ⬜ |
| 5.5 | 軌跡點顯示 | P1 | 切換功能正常 | ⬜ |
| 5.6 | 歸返軌跡顯示 | P1 | 切換功能正常 | ⬜ |
| 5.7 | 排名榜顯示 | P1 | 切換功能正常 | ⬜ |
| 5.8 | 時速表顯示 | P1 | 切換功能正常 | ⬜ |

---

## 已知問題

| 問題 | 狀態 | 解決方案 |
|------|------|---------|
| 無已知問題 | - | - |

---

## 相關參考

- USER_JOURNEY_RECORD_V2: [記錄點 #5](../USER_JOURNEY_RECORD_V2.md#記錄點-5-3d-模式完整功能)
- 現有測試: `tests/e2e/user-journey/stage-5-3d-mode.spec.ts`
- Helper: `tests/helpers/mode-switching.ts` - `switchTo3DReliably()`
- Helper: `tests/helpers/adaptive-wait.ts` - `cesium3DReady()`

---

## 開發日誌

| 日期 | 內容 |
|------|------|
| 2025-12-10 | 建立 spec 模板 |
