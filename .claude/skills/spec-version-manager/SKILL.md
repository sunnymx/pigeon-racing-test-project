---
name: spec-version-manager
description: Automate specification document version updates with comprehensive version history tracking, format consistency validation, and multi-file synchronization. Use when updating technical specification documents (e.g., GPX fields, API specs, database schemas) to ensure complete version tracking, standardized formatting, and synchronized updates across main specs and README files. Validates version numbering, change types, file links, and generates detailed update reports.
---

# Specification Document Version Manager

## Overview

This skill automates the complete workflow for updating technical specification documents with proper version control, ensuring version history completeness, format consistency, and multi-file synchronization. It follows a standardized 6-phase process to transform specification updates into well-documented, traceable changes suitable for team collaboration.

**Key Capabilities:**
- Automatic version history tracking with detailed change records
- Multi-file synchronization (main spec + README)
- Version numbering validation and consistency checks
- Format standardization and quality verification
- Comprehensive update report generation

**When to use this skill:**
- Updating specification documents (e.g., data field specs, API specifications, database schemas)
- Adding new versions with proper version history tracking
- Ensuring all related documentation is synchronized
- Validating specification document quality and consistency
- Need automated checks for version number consistency, date formats, and file links

## Workflow Overview

The version update process follows 6 sequential phases:

1. **Analysis & Validation** - Read and analyze existing documentation structure
2. **Version History Recording** - Add comprehensive version history entries
3. **Version Number Update** - Update all version references in main spec
4. **README Synchronization** - Sync all changes to README index file
5. **File Renaming** - Rename specification file to new version
6. **Validation & Reporting** - Verify consistency and generate report

Each phase must be completed before proceeding to the next to ensure data integrity.

## Phase 1: Analysis & Validation

### Purpose
Analyze existing documentation to understand structure, identify current version, and verify required components exist.

### Steps

1. **Read main specification document** (latest version)
   - Identify current version number from title
   - Check for version history section
   - Verify version numbering rules are defined
   - Record document structure

2. **Read README.md index document**
   - Check directory structure section
   - Check version index section
   - Verify metadata section exists

3. **Validate structure completeness**
   - Confirm version history table exists
   - Confirm version update summary exists
   - Confirm document metadata at bottom

**Reference:** See `references/update-checklist.md` → "階段 1: 分析與驗證"

### Example Output

```markdown
## Analysis Results

**Current Version:** v2.0
**Specification File:** gpx-fields-specification-v2.0.md
**README File:** README.md (found ✅)

**Structure Check:**
- ✅ Version History section exists
- ✅ Version Numbering Rules defined
- ✅ Document metadata present
- ✅ README version index present

**Ready to proceed to Phase 2**
```

## Phase 2: Version History Recording

### Purpose
Add new version entry to version history table and create detailed change description section.

### Steps

1. **Determine new version number**
   - Ask user for change type: Major (X), Minor (Y), or Patch (Z)
   - Calculate new version based on semantic versioning rules
   - Confirm with user: "Updating from v2.0 to v2.1. Proceed?"

2. **Add version history table entry**
   - Insert new row at top of version history table (after header)
   - Fill required columns:
     - Version: `**v{new_version}**` (bold)
     - Release Date: Today's date in ISO 8601 format (YYYY-MM-DD)
     - Change Type: Icon + name (e.g., 🔧 硬體環境調整)
     - Change Summary: One-sentence summary (15-30 characters)
     - Change Details: Bullet list with `<br>` separators

3. **Create detailed change description section**
   - Add new section: `### v{new_version} 版本變更詳細說明`
   - Fill subsections:
     - **變更背景**: Why this change was needed
     - **硬體/軟體環境**: Environment details (if applicable)
     - **關鍵變更**: Key changes with before/after comparison
     - **精度/性能比較**: Accuracy/performance comparison (if applicable)

4. **Update version summary (quick index)**
   - Add new version section to "版本更新摘要（快速索引）"
   - List 3-5 main changes

**Reference:**
- See `references/version-management-standards.md` → "版本歷史表格格式"
- See `references/update-checklist.md` → "階段 2: 版本歷史記錄"

### Example

```markdown
| 版本 | 發布日期 | 變更類型 | 變更摘要 | 變更詳情 |
|------|---------|---------|---------|---------|
| **v2.1** | 2025-11-07 | 🔧 硬體環境調整 | 根據實際硬體規格修正感測器欄位 | • 修正 `ele` 欄位資料來源：僅來自 GPS 晶片（移除氣壓計）<br>• 氣壓計單位修正：hPa → **Pa** (101325 Pa)<br>• 重組感測器欄位：新增「1.2.3 氣壓與環境感測器」專區<br>• 新增計算欄位：**2.2.3 氣壓高度計算** (altitude_barometric) |

### v2.1 版本變更詳細說明

**變更背景**：將 AI 生成的基礎規格文件調整為符合實際硬體環境的團隊協作規格書。

**硬體環境**：
- GPS 晶片：提供經緯度、海拔高度、速度、航向
- 腳環感測器（外部晶片）：氣壓計 (Pa)、溫度計 (°C)、濕度計 (%)

**關鍵變更**：

1. **GPS 高度欄位修正** (line 65)
   ```markdown
   # 修正前
   | `ele` | ... | 海拔高度 (氣壓計或 GPS) | GPS/氣壓計 | ... |

   # 修正後
   | `ele` | ... | 海拔高度 (GPS) | GPS 晶片 | ... |
   ```
```

## Phase 3: Version Number Update

### Purpose
Update all version number references in the main specification document.

### Steps

1. **Update document title**
   - Change: `# {title} v{old_version}` → `# {title} v{new_version}`

2. **Update document description**
   - Change: `本文件定義...規格 **v{old_version} 版本**`
   - To: `本文件定義...規格 **v{new_version} 版本**`

3. **Update version summary section**
   - Update section title to reference new version
   - Add new version changes at top
   - Keep previous version for comparison

4. **Update document metadata (bottom of file)**
   - **文件版本**: `{new_version}`
   - **更新日期**: `{today's date in YYYY-MM-DD}`
   - **狀態**: `穩定版本 (v{new_version})`
   - Add: **v{new_version} 變更摘要**: One-sentence summary

**Reference:** See `references/update-checklist.md` → "階段 3: 版本號更新"

### Validation Checklist

- [ ] Title version number updated
- [ ] Document description version number updated
- [ ] Version summary section updated
- [ ] Document metadata version number updated
- [ ] Document metadata date updated to today
- [ ] All version references consistent

## Phase 4: README Synchronization

### Purpose
Synchronize all changes from main specification to README.md index file.

### Steps

1. **Update directory structure section**
   - Add new version file: `├── {spec-name}-v{new_version}.md  # v{new_version} 規格文件（最新版）⭐`
   - Mark old version as archived or remove it
   - Update comments

2. **Update version index section**
   - Add new version entry at top
   - Fill: Version number, release date, change type
   - List major changes (consistent with main spec)
   - Add change background and environment info
   - Convert previous "最新版" to historical version entry

3. **Update all version references throughout README**
   Search and replace all occurrences of old version:
   - Section titles (e.g., "欄位分類總覽 (vX.Y)")
   - Quick start commands
   - File path references
   - Migration guide references
   - Related documentation links

4. **Update database schema section** (if new fields added)
   - Add new field definitions
   - Mark with: `-- NEW in v{new_version}`
   - Add field description comments

5. **Update data source classification** (if applicable)
   - Mark new fields with: `🆕 v{new_version}`

6. **Update migration section**
   - Update title: "從 v{old_version} 遷移到 v{new_version}"
   - Update migration steps
   - Update migration script path references

7. **Update document metadata (bottom of README)**
   - Same as main spec metadata update

**Reference:** See `references/update-checklist.md` → "階段 4: README.md 同步更新"

### Common Update Locations in README

```
✓ ## 📁 目錄結構
✓ ## 📚 版本索引
✓ ## 🎯 欄位分類總覽 (vX.Y)
✓ ## 📊 關鍵欄位說明 (vX.Y 更新)
✓ ## 🔧 資料庫 Schema (vX.Y 更新)
✓ ## 📝 資料驗證規則 (vX.Y)
✓ ## 🚀 快速開始
✓ ## 📚 相關文件
✓ ## 💡 重要提醒 (vX.Y 更新)
✓ ## 🔄 版本遷移
✓ 文檔元資訊（底部）
```

## Phase 5: File Renaming

### Purpose
Rename main specification file to reflect new version number.

### Steps

1. **Confirm new filename**
   - Format: `{spec-name}-v{new_version}.md`
   - Example: `gpx-fields-specification-v2.1.md`

2. **Execute rename using Bash tool**
   ```bash
   mv "/path/to/{spec-name}-v{old_version}.md" "/path/to/{spec-name}-v{new_version}.md"
   ```

3. **Verify rename success**
   ```bash
   ls -la "/path/to/spec/directory/"
   ```

4. **Handle old version file**
   - Decide with user: Keep or delete old version file
   - If keeping: Ensure README marks it as "舊版保留"
   - If deleting: Remove file

**Reference:** See `references/update-checklist.md` → "階段 5: 文件重命名"

### Example

```bash
# Rename file
mv "/Users/tf/Downloads/軌跡filter/spec/gpx-data-specification/gpx-fields-specification-v2.0.md" \
   "/Users/tf/Downloads/軌跡filter/spec/gpx-data-specification/gpx-fields-specification-v2.1.md"

# Verify
ls -la "/Users/tf/Downloads/軌跡filter/spec/gpx-data-specification/"
```

## Phase 6: Validation & Reporting

### Purpose
Perform comprehensive validation checks and generate detailed update report.

### Validation Checks

#### 6.1 Version Number Consistency

Verify version number appears correctly in:
- [ ] Main spec title
- [ ] Main spec document description
- [ ] Main spec metadata (bottom)
- [ ] README directory structure
- [ ] README version index
- [ ] README metadata (bottom)
- [ ] All section titles mentioning version

**Method:** Use Grep tool to search for old version number
```bash
# Search for any remaining old version references
grep -r "v{old_version}" /path/to/spec/directory/
```

#### 6.2 Date Consistency

Verify all dates are:
- [ ] Today's date (YYYY-MM-DD format)
- [ ] ISO 8601 compliant
- [ ] Consistent across all files

Check in:
- Version history table
- Main spec metadata
- README version index
- README metadata

#### 6.3 File Link Validity

Verify all file links work:
- [ ] README → main spec link
- [ ] README → migration guide link
- [ ] README → related documentation links
- [ ] Main spec → cross-reference links

#### 6.4 Format Standards

- [ ] Version history table format correct (Markdown table)
- [ ] Change details use `<br>` for line breaks
- [ ] Change type icons display correctly
- [ ] Version numbers use bold `**vX.Y**`
- [ ] Code blocks use correct language tags

#### 6.5 Content Completeness

- [ ] Version history records complete (all versions)
- [ ] Detailed change description includes all required sections
- [ ] Change comparisons complete (before/after)
- [ ] README contains all new version information
- [ ] All new fields have documentation

**Reference:** See `references/update-checklist.md` → "階段 6: 驗證與檢查"

### Generate Update Report

Create a comprehensive report documenting all changes:

```markdown
# 規格文檔版本更新報告

## 更新摘要
- 舊版本: v{old_version}
- 新版本: v{new_version}
- 變更類型: {icon} {change_type}
- 發布日期: {date}

## 更新文件清單
- ✅ {spec-name}-v{new_version}.md (主規格文檔)
- ✅ README.md (版本索引)
- ❌ sql/migration_v{new_version}.sql (未創建，建議添加)

## 執行的操作
1. ✅ 添加版本歷史記錄
2. ✅ 更新版本號 ({count} 處)
3. ✅ 更新 README.md ({count} 處)
4. ✅ 重命名文件
5. ✅ 驗證所有連結

## 驗證結果
- ✅ 版本號一致性檢查通過 ({count} 處確認)
- ✅ 日期一致性檢查通過 ({count} 處確認)
- ✅ 文件連結有效性檢查通過 ({count} 個連結)
- ✅ 格式規範檢查通過
- ✅ 內容完整性檢查通過

## 建議
- [ ] 建議添加遷移腳本: sql/migration_v{new_version}.sql
- [ ] 建議更新相關系統文檔引用新版本
- [ ] 建議通知團隊成員規格更新
```

## Important Guidelines

### Version Numbering Rules

Follow semantic versioning principles:

- **Major (X)**: Breaking changes, incompatible with previous version
  - Example: v1.0 → v2.0 (complete restructure)

- **Minor (Y)**: Backward-compatible additions or modifications
  - Example: v2.0 → v2.1 (add new sensor fields)

- **Patch (Z)**: Backward-compatible bug fixes
  - Example: v2.1.0 → v2.1.1 (fix documentation typos)

**Reference:** See `references/version-management-standards.md` → "版本編號規則"

### Change Type Icons

Use standardized icons for change types:

- 🎉 初始版本 (Initial Version)
- 🏗️ 架構重構 (Architecture Refactor)
- 🔧 硬體環境調整 (Hardware Environment Adjustment)
- 📦 欄位擴充 (Field Extension)
- ✨ 功能新增 (Feature Addition)
- 🐛 錯誤修正 (Bug Fix)
- 📝 文檔更新 (Documentation Update)

**Reference:** See `references/version-management-standards.md` → "變更類型分類"

### Quality Standards

Ensure all updates meet these quality standards:

1. **Clarity**: Change summaries must be clear and specific (15-30 characters)
2. **Completeness**: All required sections filled with relevant information
3. **Consistency**: Version numbers and dates consistent across all files
4. **Traceability**: Before/after comparisons for all key changes
5. **Validation**: All links verified and format checks passed

### Common Pitfalls to Avoid

1. **Inconsistent version numbers** across files
   - Solution: Use search and replace systematically

2. **Missing version history entries**
   - Solution: Always add to version history table first

3. **Broken file links** after renaming
   - Solution: Update all file references before renaming

4. **Incorrect date formats** (e.g., MM/DD/YYYY instead of YYYY-MM-DD)
   - Solution: Always use ISO 8601 format (YYYY-MM-DD)

5. **Incomplete change descriptions**
   - Solution: Use checklist from `references/update-checklist.md`

## Usage Examples

### Example 1: Minor Version Update (Hardware Adjustment)

**User Request:** "Update GPX specification from v2.0 to v2.1 to reflect actual hardware sensor specifications."

**Workflow:**

1. **Phase 1**: Read gpx-fields-specification-v2.0.md and README.md
2. **Phase 2**: Add v2.1 entry to version history with change type 🔧 硬體環境調整
3. **Phase 3**: Update all v2.0 references to v2.1 in main spec
4. **Phase 4**: Sync all changes to README.md
5. **Phase 5**: Rename gpx-fields-specification-v2.0.md → v2.1.md
6. **Phase 6**: Validate and generate report

### Example 2: Major Version Update (Architecture Refactor)

**User Request:** "Update API specification from v1.5 to v2.0 with complete REST to GraphQL migration."

**Workflow:**

1. **Phase 1**: Analyze current v1.5 structure
2. **Phase 2**: Add v2.0 entry with change type 🏗️ 架構重構, detailed migration guide
3. **Phase 3**: Update version numbers with clear breaking change warnings
4. **Phase 4**: Update README with migration instructions
5. **Phase 5**: Rename file, keep v1.5 for reference
6. **Phase 6**: Extensive validation, generate migration checklist

## Resources

### references/version-management-standards.md

Comprehensive standards for version management including:
- Semantic versioning rules
- Change type classification with icons
- Version history table format and examples
- Detailed change description structure
- Document metadata format
- File naming conventions
- Date format standards

**When to load:** During Phase 2 (Version History Recording) when adding version entries, or when unsure about formatting standards.

### references/update-checklist.md

Complete phase-by-phase checklist covering:
- Phase 1: Analysis & Validation (18 checks)
- Phase 2: Version History Recording (10 checks)
- Phase 3: Version Number Update (6 checks)
- Phase 4: README Synchronization (31 checks)
- Phase 5: File Renaming (4 checks)
- Phase 6: Validation & Reporting (31 checks)
- Common issues checklist (12 checks)

**When to load:** At the beginning of each phase to ensure all steps are completed, or when generating the final validation report.

## Best Practices

1. **Always follow the 6-phase sequence** - Don't skip phases to ensure data integrity

2. **Ask for clarification early** - Confirm version number and change type with user before proceeding

3. **Use the checklists** - Load `references/update-checklist.md` for each phase

4. **Verify before committing** - Always run Phase 6 validation before considering the update complete

5. **Generate detailed reports** - Provide comprehensive update reports for documentation and team communication

6. **Keep history intact** - Never delete or modify existing version history entries

7. **Maintain consistency** - Use search and replace systematically for version number updates

8. **Document rationale** - Always explain why changes were made in "變更背景" section

---

## 如何觸發此技能

### 自動觸發

當你在 Claude Code 中輸入包含以下關鍵詞的請求時，UserPromptSubmit Hook 會自動推薦此技能：

**英文關鍵詞**:
- specification, spec, version, update spec, spec update
- gpx field, field spec, data specification
- version control, version history, version number
- changelog, release notes, document version

**中文關鍵詞**:
- **動詞**：更新, 升級, 修改, 維護, 發布
- **技術術語**：規格, 版本, 版本號, 規格文檔, 版本歷史, 變更紀錄, 欄位規格, 數據規格

### 手動啟用

```bash
# 使用 Skill tool
Skill(skill="spec-version-manager")
```

### 推薦輸入示例

✅ **觸發率高**：
- "更新 GPX 欄位規格文檔版本到 2.2.0"
- "升級規格到新版本，添加 altitude_agl 欄位"
- "修改規格版本號並同步 README"
- "請幫我發布規格 1.5.0 版本"
- "維護規格文檔的版本歷史記錄"

⚠️ **觸發率低**：
- "改個版本"（缺少上下文）
- "更新文檔"（太通用）
- "添加欄位"（未提及規格或版本）

### 技能觸發機制

此技能通過以下方式被觸發：
1. **關鍵詞匹配**：輸入包含「規格」、「版本」、「spec」等關鍵詞
2. **意圖模式匹配**：匹配如 `(update|upgrade|更新|升級).*?(spec|version|規格|版本)` 的模式
3. **文件路徑觸發**：編輯 `spec/**/*-specification.md` 等規格文件

**推薦使用方式**：
- 在輸入中明確提及「規格」或「spec」
- 說明版本號（如 2.2.0）和變更類型（major/minor/patch）
- 描述具體的變更內容或添加的欄位
