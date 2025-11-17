# Git 仓库配置指南

## 文档信息
- **创建日期**: 2025-11-17
- **维护者**: 项目团队
- **文档版本**: v1.0.0

---

## 📋 目录

1. [仓库概览](#仓库概览)
2. [远程仓库配置](#远程仓库配置)
3. [常用命令](#常用命令)
4. [工作流程](#工作流程)
5. [疑难排解](#疑难排解)

---

## 仓库概览

本项目同时维护两个 GitHub 远程仓库：

| 仓库名称 | 组织/用户 | 用途 | 远程名称 |
|---------|----------|------|---------|
| **主仓库** | sunnymx | 个人开发仓库 | `origin` |
| **团队仓库** | MinXinCorp | 公司/团队仓库 | `minxin` |

### 仓库链接

- **主仓库**: https://github.com/sunnymx/pigeon-racing-test-project
- **团队仓库**: https://github.com/MinXinCorp/pigeon-racing-test-project

---

## 远程仓库配置

### 当前配置

```bash
origin (主仓库)
  Fetch: https://github.com/sunnymx/pigeon-racing-test-project.git
  Push:  https://github.com/sunnymx/pigeon-racing-test-project.git

minxin (团队仓库)
  Fetch: https://github.com/MinXinCorp/pigeon-racing-test-project.git
  Push:  https://github.com/MinXinCorp/pigeon-racing-test-project.git
```

### 验证配置

```bash
# 查看所有远程仓库
git remote -v

# 预期输出：
# minxin  https://github.com/MinXinCorp/pigeon-racing-test-project.git (fetch)
# minxin  https://github.com/MinXinCorp/pigeon-racing-test-project.git (push)
# origin  https://github.com/sunnymx/pigeon-racing-test-project.git (fetch)
# origin  https://github.com/sunnymx/pigeon-racing-test-project.git (push)
```

### 首次配置步骤

如果你是新克隆的仓库或需要重新配置，请按以下步骤操作：

```bash
# 1. 克隆主仓库（如果还没有）
git clone https://github.com/sunnymx/pigeon-racing-test-project.git
cd pigeon-racing-test-project

# 2. 添加第二个远程仓库
git remote add minxin https://github.com/MinXinCorp/pigeon-racing-test-project.git

# 3. 验证配置
git remote -v

# 4. 拉取所有远程分支信息
git fetch --all
```

---

## 常用命令

### 推送代码

#### 推送到单个仓库

```bash
# 推送到主仓库 (sunnymx)
git push origin main

# 推送到团队仓库 (MinXinCorp)
git push minxin main
```

#### 同时推送到两个仓库

```bash
# 方法1: 使用 && 连接
git push origin main && git push minxin main

# 方法2: 使用别名（需要先配置，见下方）
git pushall
```

### 拉取更新

```bash
# 从主仓库拉取
git pull origin main

# 从团队仓库拉取
git pull minxin main

# 拉取所有远程仓库的信息
git fetch --all
```

### 查看状态

```bash
# 查看本地分支与远程分支的关系
git branch -vv

# 查看远程仓库详细信息
git remote show origin
git remote show minxin

# 查看所有分支（包括远程）
git branch -a
```

---

## 工作流程

### 标准开发流程

```bash
# 1. 确保在 main 分支
git checkout main

# 2. 拉取最新代码
git pull origin main

# 3. 创建功能分支（可选）
git checkout -b feature/your-feature-name

# 4. 进行开发工作
# ... 编写代码 ...

# 5. 添加变更
git add .

# 6. 提交变更
git commit -m "描述你的变更"

# 7. 推送到主仓库
git push origin main  # 或 feature/your-feature-name

# 8. 同步到团队仓库
git push minxin main  # 或 feature/your-feature-name
```

### 同步两个仓库的最佳实践

**推荐做法**：

1. **origin (sunnymx)** 作为主开发仓库
2. **minxin (MinXinCorp)** 作为同步备份/团队协作仓库

**同步策略**：

```bash
# 方案1: 每次提交都同步（适合小改动）
git add .
git commit -m "Your message"
git push origin main && git push minxin main

# 方案2: 阶段性同步（适合大功能开发）
# 平时只推送到 origin
git push origin main

# 功能完成后再同步到 minxin
git push minxin main
```

---

## 配置 Git 别名

为了简化操作，可以配置 Git 别名：

### 配置推送别名

```bash
# 配置 pushall 别名，一次推送到两个仓库
git config alias.pushall '!git push origin main && git push minxin main'

# 使用别名
git pushall
```

### 其他有用的别名

```bash
# 查看美化的日志
git config alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# 查看状态简写
git config alias.st "status -s"

# 查看所有别名
git config --get-regexp alias
```

### 别名配置文件位置

- **项目级别**: `.git/config`
- **全局级别**: `~/.gitconfig`

---

## 分支管理

### 查看分支

```bash
# 查看本地分支
git branch

# 查看所有分支（包括远程）
git branch -a

# 查看远程分支
git branch -r
```

### 跟踪远程分支

```bash
# 设置 main 分支跟踪 origin/main
git branch --set-upstream-to=origin/main main

# 或在推送时自动设置跟踪
git push -u origin main
```

### 同步分支到两个仓库

```bash
# 创建新分支并推送到两个仓库
git checkout -b feature/new-feature
git push -u origin feature/new-feature
git push -u minxin feature/new-feature

# 删除远程分支
git push origin --delete feature/old-feature
git push minxin --delete feature/old-feature
```

---

## 疑难排解

### 问题 1: 推送被拒绝

**错误信息**:
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs
```

**解决方案**:
```bash
# 先拉取远程更新
git pull origin main

# 解决可能的冲突后再推送
git push origin main
```

### 问题 2: 远程仓库不存在

**错误信息**:
```
fatal: repository 'https://github.com/...' not found
```

**解决方案**:
```bash
# 检查远程仓库 URL 是否正确
git remote -v

# 更新远程仓库 URL
git remote set-url origin <correct-url>
git remote set-url minxin <correct-url>
```

### 问题 3: 认证失败

**错误信息**:
```
remote: Invalid username or password.
fatal: Authentication failed
```

**解决方案**:

1. **使用 Personal Access Token (PAT)**:
   - 前往 GitHub Settings → Developer settings → Personal access tokens
   - 生成新的 token
   - 使用 token 作为密码

2. **配置 SSH**:
   ```bash
   # 生成 SSH 密钥
   ssh-keygen -t ed25519 -C "your_email@example.com"

   # 添加到 SSH agent
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519

   # 复制公钥到 GitHub
   cat ~/.ssh/id_ed25519.pub

   # 更改远程 URL 为 SSH 格式
   git remote set-url origin git@github.com:sunnymx/pigeon-racing-test-project.git
   git remote set-url minxin git@github.com:MinXinCorp/pigeon-racing-test-project.git
   ```

### 问题 4: 两个仓库内容不同步

**情况**: 两个仓库的提交历史不一致

**解决方案**:
```bash
# 1. 从主仓库强制同步到团队仓库（谨慎使用）
git push minxin main --force

# 2. 或者手动同步
git fetch origin
git fetch minxin
git checkout main
git reset --hard origin/main
git push minxin main --force
```

⚠️ **警告**: 使用 `--force` 会覆盖远程历史，请确保团队成员知晓。

### 问题 5: 忘记添加远程仓库

**情况**: 只配置了一个远程仓库

**解决方案**:
```bash
# 检查当前远程仓库
git remote -v

# 添加缺失的远程仓库
git remote add minxin https://github.com/MinXinCorp/pigeon-racing-test-project.git

# 验证
git remote -v
```

---

## 安全建议

### 1. 不要提交敏感信息

确保以下文件已在 `.gitignore` 中：

```gitignore
.env
.env.local
*.key
*.pem
credentials.json
config/secrets.json
```

### 2. 使用 SSH 密钥（推荐）

SSH 密钥比 HTTPS 更安全且无需每次输入密码。

### 3. 定期更新 Token

如果使用 Personal Access Token，建议设置过期时间并定期更新。

### 4. 保护主分支

建议在 GitHub 上为 `main` 分支设置保护规则：
- 前往仓库 Settings → Branches
- 添加 branch protection rule
- 启用 "Require pull request reviews before merging"

---

## 团队协作指南

### Pull Request 流程

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature

# 2. 开发并提交
git add .
git commit -m "Implement feature"

# 3. 推送到远程
git push origin feature/your-feature

# 4. 在 GitHub 上创建 Pull Request
# 5. 代码审查通过后合并到 main
# 6. 同步到 minxin 仓库
git checkout main
git pull origin main
git push minxin main
```

### 代码审查清单

- [ ] 代码符合项目风格指南
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 无安全隐患
- [ ] 无敏感信息泄露

---

## 快速参考

### 常用命令速查表

| 操作 | 命令 |
|------|------|
| 查看远程仓库 | `git remote -v` |
| 推送到 origin | `git push origin main` |
| 推送到 minxin | `git push minxin main` |
| 同时推送 | `git push origin main && git push minxin main` |
| 拉取更新 | `git pull origin main` |
| 查看状态 | `git status` |
| 查看日志 | `git log --oneline` |
| 添加远程仓库 | `git remote add <name> <url>` |
| 删除远程仓库 | `git remote remove <name>` |

---

## 相关文档

- [README.md](../README.md) - 项目主文档
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南（如有）
- [GitHub 官方文档](https://docs.github.com/)
- [Git 官方文档](https://git-scm.com/doc)

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0.0 | 2025-11-17 | 初始版本，包含双仓库配置说明 |

---

**文档维护者**: 项目团队
**最后更新**: 2025-11-17
**反馈**: 如有问题请在 [GitHub Issues](https://github.com/sunnymx/pigeon-racing-test-project/issues) 提出
