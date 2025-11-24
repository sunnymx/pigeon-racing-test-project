# Test 1.2: security skill

**Skill**: security
**Category**: Tier 1 - 核心開發
**Priority**: 高

---

## 測試問題

```
檢查 1_dev/src/batch_preparer.py 是否有安全漏洞，特別是 API key 處理和輸入驗證部分。
```

---

## 預期行為

- ✅ security skill 應該自動觸發
- ✅ 檢查硬編碼秘密、SQL 注入、認證問題
- ✅ 提供 OWASP Top 10 相關建議
- ✅ 只使用 allowed-tools: Read, Grep, Glob, Bash

---

## 驗證檢查點

- [ ] Skill 是否自動載入？
- [ ] 是否檢查了 API key 和敏感數據處理？
- [ ] 是否提供了安全最佳實踐建議？
- [ ] 是否參考了 OWASP 標準？

---

## 測試結果

**執行時間**: [待填寫]
**結果**: [ ] ✅ 通過 / [ ] ⚠️ 部分通過 / [ ] ❌ 失敗

**觀察記錄**: [待填寫]
