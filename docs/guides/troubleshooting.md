# 問題排解指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md#critical-gotchas)
**詳細文檔**: [Known Issues Solutions](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)

本指南提供 MVP 測試發現的 4 個關鍵問題的快速排解方法。

---

## 問題 #1: 2D 軌跡首次加載失敗 (HIGH)

### 症狀
- 首次查看軌跡時，軌跡數據未完全加載
- 控制台錯誤: `ERROR Error: pigeon.gpx2d undefined`
- AMap 顯示空白或不完整的紅線
- 軌跡標記可能缺失

### 快速解決
**方法 1 (推薦)**: 重新加載軌跡
```typescript
// 重新執行「選擇鴿子 → 查看軌跡」流程
// 1. 返回鴿子列表
await page.getByRole('button', { name: /返回|關閉/ }).click();

// 2. 取消之前的選擇
await page.locator('input[type="checkbox"]:checked').first().click();

// 3. 重新選擇並查看軌跡
await page.locator('input[type="checkbox"]').first().click();
await page.getByRole('button', { name: '查看軌跡' }).click();
await page.waitForTimeout(3000);
```

**方法 2 (備選)**: 使用 3D→2D 切換序列
```typescript
// 1. 先進入 3D 模式
await page.getByRole('button', { name: '查看軌跡' }).click();
await page.waitForTimeout(2000);

// 2. 切換到 2D
await page.getByRole('button', { name: '2d 2D模式' }).click();
await page.waitForTimeout(2000);
```

📖 完整方案：[Known Issues #1](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1-2d軌跡初次加載失敗)

---

## 問題 #2: 靜態/動態模式混淆 (MEDIUM)

### 症狀
- 不確定當前是靜態還是動態播放模式
- 2D 有兩種模式容易混淆

### 快速辨別
```typescript
// 計算可見標記點
const markers = await page.locator('[title*="2025-"]').count();

if (markers >= 15) {
  console.log('靜態模式 - 顯示完整軌跡');
} else {
  console.log('動態模式 - 播放動畫');
}
```

📖 完整說明：[Known Issues #2](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#problem-2)

---

## 問題 #3: 軌跡點點擊無響應 (MEDIUM)

### 症狀
- 直接點擊軌跡點無反應
- Canvas 遮擋問題

### 快速解決
使用 accessibility tree 定位：
```typescript
// 使用 title 屬性定位
await page.locator('[title*="2025-"]').first().click();
```

📖 完整方案：[Known Issues #3](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#problem-3)

---

## 問題 #4: 數據加載時序問題 (MEDIUM)

### 症狀
- 軌跡數據未立即加載
- 模式切換後數據缺失

### 快速解決
增加等待時間：
```typescript
// 模式切換後等待
await page.waitForTimeout(2000-3000);

// 或等待特定元素
await page.waitForSelector('[title*="2025-"]', { timeout: 5000 });
```

📖 完整策略：[Wait Strategies](testing-strategies.md#wait-strategies)

---

## 故障排除檢查清單

遇到測試失敗時：

- [ ] 確認使用正確的模式選擇方法（按鈕文字）
- [ ] 檢查是否等待足夠時間（2-3秒）
- [ ] 驗證網路連接穩定
- [ ] 檢查 API 請求是否成功
- [ ] 查看瀏覽器控制台錯誤
- [ ] 參考已知問題解決方案

---

**完整文檔**: [Known Issues Solutions](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)
**最後更新**: 2025-11-18
