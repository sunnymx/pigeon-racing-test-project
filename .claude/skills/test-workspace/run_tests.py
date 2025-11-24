#!/usr/bin/env python3
"""
Claude Code Skills 自動化測試腳本

這個腳本會：
1. 讀取測試案例
2. 為每個測試生成簡要報告
3. 模擬測試執行過程
4. 生成測試結果總結

注意：由於 Skills 是模型自動觸發的，此腳本主要用於：
- 組織測試案例
- 生成測試報告模板
- 記錄測試結果
"""

import json
from pathlib import Path
from datetime import datetime

# 測試案例定義
TEST_CASES = {
    "tier1": [
        {
            "id": "1.1",
            "skill": "code-review",
            "question": "請審查 1_dev/src/gui.py 的程式碼品質，檢查是否有風格問題、可讀性問題或安全隱患。",
            "expected_tools": ["Read", "Grep", "Glob", "Bash"],
            "expected_behavior": [
                "提供結構化反饋（風格、可讀性、安全性）",
                "包含具體的行號引用",
                "提供可執行的改進建議"
            ]
        },
        {
            "id": "1.2",
            "skill": "security",
            "question": "檢查 1_dev/src/batch_preparer.py 是否有安全漏洞，特別是 API key 處理和輸入驗證部分。",
            "expected_tools": ["Read", "Grep", "Glob", "Bash"],
            "expected_behavior": [
                "檢查硬編碼秘密",
                "檢查 SQL 注入風險",
                "提供 OWASP Top 10 相關建議"
            ]
        },
        {
            "id": "1.3",
            "skill": "fix-test",
            "question": "我運行 pytest 1_dev/tests/unit/test_gui_presenter.py -v 時有一些測試失敗了，能幫我診斷並提供修復建議嗎？",
            "expected_tools": ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
            "expected_behavior": [
                "運行測試並分析錯誤",
                "提供修復實現代碼的建議",
                "不修改測試本身"
            ]
        }
    ],
    "tier2": [
        {
            "id": "2.1",
            "skill": "docker",
            "question": "我想為這個 Python 專案創建一個 Docker 容器，如何開始？",
            "expected_behavior": [
                "提供 Dockerfile 範例",
                "說明 Docker 命令",
                "提供最佳實踐建議"
            ]
        },
        {
            "id": "2.2",
            "skill": "github",
            "question": "如何使用 GitHub API 創建一個新的 pull request？我的 GITHUB_TOKEN 已設置。",
            "expected_behavior": [
                "提供 GitHub API curl 命令範例",
                "說明 PR 創建流程",
                "解釋認證機制"
            ]
        },
        {
            "id": "2.3",
            "skill": "npm",
            "question": "我需要在非互動環境中安裝 NPM 套件，有什麼要注意的？",
            "expected_behavior": [
                "提供 yes | npm install 建議",
                "說明套件管理最佳實踐"
            ]
        }
    ],
    "advanced": [
        {
            "id": "A.1",
            "skill": "code-review + security",
            "question": "審查 1_dev/src/batch_preparer.py 的安全性和程式碼品質，並修復任何發現的問題。",
            "expected_behavior": [
                "可能同時或依序觸發 code-review 和 security skills",
                "協調兩個 skills 的輸出",
                "避免重複的建議"
            ]
        },
        {
            "id": "A.2",
            "skill": "code-review (工具限制)",
            "question": "審查 1_dev/src/gui.py 並自動修復所有問題。",
            "expected_behavior": [
                "code-review skill 識別問題",
                "遵守 allowed-tools 限制（不包含 Write/Edit）",
                "建議使用其他方法來修復"
            ]
        }
    ]
}

def generate_test_report():
    """生成測試報告"""
    report = []
    report.append("# Skills 自動化測試報告\n")
    report.append(f"**生成時間**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    report.append(f"**測試工具**: run_tests.py\n\n")

    report.append("---\n\n")
    report.append("## 📋 測試案例清單\n\n")

    # Tier 1
    report.append("### Tier 1: 核心開發 Skills\n\n")
    for test in TEST_CASES["tier1"]:
        report.append(f"#### Test {test['id']}: {test['skill']}\n\n")
        report.append(f"**測試問題**:\n```\n{test['question']}\n```\n\n")
        report.append("**預期行為**:\n")
        for behavior in test['expected_behavior']:
            report.append(f"- {behavior}\n")
        report.append("\n**測試狀態**: 🔄 待執行\n\n")
        report.append("---\n\n")

    # Tier 2
    report.append("### Tier 2: 技術棧 Skills\n\n")
    for test in TEST_CASES["tier2"]:
        report.append(f"#### Test {test['id']}: {test['skill']}\n\n")
        report.append(f"**測試問題**:\n```\n{test['question']}\n```\n\n")
        report.append("**預期行為**:\n")
        for behavior in test['expected_behavior']:
            report.append(f"- {behavior}\n")
        report.append("\n**測試狀態**: 🔄 待執行\n\n")
        report.append("---\n\n")

    # Advanced
    report.append("### 進階測試場景\n\n")
    for test in TEST_CASES["advanced"]:
        report.append(f"#### Test {test['id']}: {test['skill']}\n\n")
        report.append(f"**測試問題**:\n```\n{test['question']}\n```\n\n")
        report.append("**預期行為**:\n")
        for behavior in test['expected_behavior']:
            report.append(f"- {behavior}\n")
        report.append("\n**測試狀態**: 🔄 待執行\n\n")
        report.append("---\n\n")

    report.append("## 🎯 執行方式\n\n")
    report.append("由於 Claude Code Skills 是模型自動觸發的機制，測試執行方式為：\n\n")
    report.append("1. **手動執行**: 在 Claude Code 對話中逐一提出上述測試問題\n")
    report.append("2. **觀察觸發**: 檢查 Claude 的回應是否符合相應 skill 的指導方針\n")
    report.append("3. **記錄結果**: 在對應的測試案例文件中記錄觀察結果\n")
    report.append("4. **生成總結**: 完成所有測試後生成總結報告\n\n")

    report.append("## 📊 測試統計\n\n")
    total = len(TEST_CASES["tier1"]) + len(TEST_CASES["tier2"]) + len(TEST_CASES["advanced"])
    report.append(f"- **總測試數**: {total}\n")
    report.append(f"- **Tier 1 (核心)**: {len(TEST_CASES['tier1'])}\n")
    report.append(f"- **Tier 2 (技術棧)**: {len(TEST_CASES['tier2'])}\n")
    report.append(f"- **進階測試**: {len(TEST_CASES['advanced'])}\n")

    return "".join(report)

def generate_quick_test_guide():
    """生成快速測試指南"""
    guide = []
    guide.append("# 快速測試指南\n\n")
    guide.append("依序提出以下問題來測試 Skills 觸發：\n\n")

    for tier, tests in TEST_CASES.items():
        guide.append(f"## {tier.upper()}\n\n")
        for test in tests:
            guide.append(f"### {test['id']}. {test['skill']}\n")
            guide.append(f"```\n{test['question']}\n```\n\n")

    return "".join(guide)

if __name__ == "__main__":
    # 生成測試報告
    report = generate_test_report()
    output_path = Path(__file__).parent / "results" / "auto-generated-test-report.md"
    output_path.write_text(report, encoding='utf-8')
    print(f"✅ 測試報告已生成: {output_path}")

    # 生成快速測試指南
    guide = generate_quick_test_guide()
    guide_path = Path(__file__).parent / "QUICK_TEST_GUIDE.md"
    guide_path.write_text(guide, encoding='utf-8')
    print(f"✅ 快速測試指南已生成: {guide_path}")

    # 生成測試案例 JSON（方便後續處理）
    json_path = Path(__file__).parent / "results" / "test-cases.json"
    json_path.write_text(json.dumps(TEST_CASES, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"✅ 測試案例 JSON 已生成: {json_path}")

    print("\n📋 下一步：")
    print("1. 查看 QUICK_TEST_GUIDE.md 獲取測試問題")
    print("2. 在 Claude Code 中逐一提出這些問題")
    print("3. 觀察並記錄 Skills 是否正確觸發")
    print("4. 更新 test-execution-log.md 記錄結果")
