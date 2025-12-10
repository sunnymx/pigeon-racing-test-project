# 記錄點 #03: 2D 靜態軌跡 + InfoWindow

**優先級**: P0
**狀態**: 待開發
**對應測試**: `tests/e2e/user-journey/stage-3-2d-static.spec.ts`

---

## 概述

2D 靜態軌跡視圖，顯示鴿子飛行路線和軌跡標記點。點擊標記點可顯示 InfoWindow 資訊。

---

## 進入方式

- 前置記錄點: #1 → #2
- 操作步驟:
  1. 在賽事詳情選擇鴿子
  2. 確認 2D 偏好已選中
  3. 點擊「查看軌跡」

---

## DOM 結構與選擇器

| 區域 | 元素 | 選擇器 | 功能 |
|------|------|--------|------|
| 地圖 | 軌跡線 | Polyline (AMap) | 飛行路線 (白色) |
| 地圖 | 軌跡標記 | `.amap-icon > img` | 軌跡點 (≥15 個) |
| 地圖 | InfoWindow | `.amap-info-window` | 點擊後顯示資訊 |
| 地圖 | Canvas | `canvas.amap-layer` | AMap 圖層 |
| 右側 | 排名榜 | 表格 | 即時排名 |
| 左下 | 動態/靜態 | `button` (timeline icon) | 模式切換 |
| 左下 | 風場 | `button description="查看风场"` | 風場顯示 |
| 左下 | 測量 | `button description="测量距离工具"` | 測量工具 |
| 左下 | 詳情 | `button description="軌跡詳情"` | 軌跡詳情面板 |
| 右下 | 3D切換 | `button "3D模式"` | 切換到 3D |

---

## 測試檢查點

| # | 檢查項目 | 優先級 | 驗證方式 | 狀態 |
|---|---------|--------|---------|------|
| 3.1 | 軌跡視圖載入 | P0 | `canvas.amap-layer` 存在 | ⬜ |
| 3.2 | 軌跡標記點 | P0 | `.amap-icon > img` 數量 ≥ 15 | ⬜ |
| 3.3 | 標記點點擊 | P0 | 點擊 → InfoWindow 顯示 | ⬜ |
| 3.4 | InfoWindow 數據 | P0 | 包含環號/時間/海拔/分速 | ⬜ |
| 3.5 | 排名榜顯示 | P1 | 表格數據正確 | ⬜ |
| 3.6 | 工具按鈕可用 | P1 | 各按鈕可點擊 | ⬜ |

---

## 已知問題

| 問題 | 狀態 | 解決方案 |
|------|------|---------|
| 首次載入失敗 | 已知 | 使用 `reload2DTrajectory()` helper |

---

## 相關參考

- USER_JOURNEY_RECORD_V2: [記錄點 #3](../USER_JOURNEY_RECORD_V2.md#記錄點-3-2d-靜態軌跡--infowindow)
- 現有測試: `tests/e2e/user-journey/stage-3-2d-static.spec.ts`
- Helper: `tests/helpers/trajectory-reload.ts` - `reload2DTrajectory()`
- Helper: `tests/helpers/trajectory-utils.ts` - `getTrajectoryPointsCount()`

---

## 開發日誌

| 日期 | 內容 |
|------|------|
| 2025-12-10 | 建立 spec 模板 |
