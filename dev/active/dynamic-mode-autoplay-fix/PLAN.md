# 修復計畫：動態模式自動播放導致測試失敗

## 問題摘要

**測試案例**: `tc-03-001-mode-switch.spec.ts:113` - 動態模式播放功能應該正常

**失敗原因**: 切換到動態模式後，系統**自動開始播放**，按鈕已顯示 `pause` 而非 `play_arrow`，導致測試找不到播放按鈕而超時。

## 白話文解釋

就像你打開影片播放器，有些播放器會自動播放，有些需要你手動按播放。這個賽鴿系統切換到動態模式時會自動播放，但測試程式以為需要手動按播放，所以一直在找「播放按鈕」，但畫面上顯示的是「暫停按鈕」。

## 證據

Page snapshot 顯示：
```yaml
- button [ref=e216] [cursor=pointer]:
  - img [ref=e217]: pause  # ← 已經是暫停按鈕
```

測試程式碼期望：
```typescript
const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });
await playButton.click();  // ← 找不到 play_arrow，超時失敗
```

---

## 修改計畫

### 修改位置

`tests/e2e/tc-03-001-mode-switch.spec.ts` 第 113-144 行

### 修改內容

**原本邏輯**：
1. 切換到動態模式
2. 找 `play_arrow` 按鈕並點擊
3. 驗證變成 `pause`

**修改後邏輯**：
1. 切換到動態模式
2. **檢查當前播放狀態**（可能已自動播放）
3. 若已播放，先暫停
4. 點擊 `play_arrow` 開始播放
5. 驗證變成 `pause`

### 程式碼變更

```typescript
// 修改前 (第 124-131 行)
// 點擊播放按鈕
const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });
await playButton.click();
await page.waitForTimeout(2000);

// 驗證播放圖標變為暫停
const pauseButton = page.getByRole('button').filter({ hasText: 'pause' });
await expect(pauseButton).toBeVisible({ timeout: 5000 });
```

```typescript
// 修改後
// 檢查當前播放狀態 - 動態模式可能自動播放
const pauseButton = page.getByRole('button').filter({ hasText: 'pause' });
const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });

const isPlaying = await pauseButton.isVisible().catch(() => false);

if (isPlaying) {
  console.log('  ℹ️ 動態模式已自動播放，先暫停再測試');
  await pauseButton.click();
  await page.waitForTimeout(500);
}

// 確認播放按鈕可見
await expect(playButton).toBeVisible({ timeout: 5000 });
console.log('  ✓ 播放按鈕已就緒');

// 點擊播放按鈕
await playButton.click();
await page.waitForTimeout(2000);

// 驗證播放圖標變為暫停
await expect(pauseButton).toBeVisible({ timeout: 5000 });
console.log('  ✓ 播放按鈕變為暫停按鈕');
```

---

## 預期結果

- 測試能正確處理「自動播放」和「手動播放」兩種情況
- 無論系統是否自動播放，測試都能通過

## 影響範圍

| 項目 | 影響 |
|------|------|
| 修改檔案 | 僅 `tc-03-001-mode-switch.spec.ts` |
| 修改行數 | ~15 行 |
| 其他測試 | 無影響 |
| Helper 函數 | 無需修改 |

## 風險評估

**低風險** - 僅增加狀態檢查邏輯，不改變測試驗證目標。

---

## 待確認

請確認是否執行此修改？
