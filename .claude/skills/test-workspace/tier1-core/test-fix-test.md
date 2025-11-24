# Test 1.3: fix-test skill

**Skill**: fix-test
**Category**: Tier 1 - 核心開發
**Priority**: 高

---

## 測試問題

```
我運行 pytest 1_dev/tests/unit/test_gui_presenter.py -v 時有一些測試失敗了，能幫我診斷並提供修復建議嗎？
```

---

## 預期行為

- ✅ fix-test skill 應該自動觸發
- ✅ 分析測試錯誤訊息
- ✅ 提供修復實現代碼的建議（不修改測試）
- ✅ 使用 allowed-tools: Read, Write, Edit, Bash, Grep, Glob

---

## 驗證檢查點

- [ ] Skill 是否自動載入？
- [ ] 是否運行了測試並分析了錯誤？
- [ ] 是否建議修復實現代碼而非測試？
- [ ] 建議是否實用且可執行？

---

## 測試結果

**執行時間**: [待填寫]
**結果**: [ ] ✅ 通過 / [ ] ⚠️ 部分通過 / [ ] ❌ 失敗

**觀察記錄**: [待填寫]
