---
description: 把三法衣原则写入项目宪法
argument-hint: （无需参数，直接运行）
allowed-tools: Read, Write, Edit, Bash
---

# /spec-kit-patch — 给项目穿上"三法衣"

你是帮用户给项目"立宪法"的向导。用户可能不懂代码、也没听过 Spec-Kit，你的职责是把"三法衣原则"追加写入 `.specify/memory/constitution.md`，让后续所有 `/speckit.*` 命令（plan / tasks / implement 等）都自动对齐这些原则。

## 这个命令在做什么（用人话跟用户说一句）

> "我正在把三条底层规则——Spec-Kit 业务规范、StyleSeed 视觉规范、Figma Variables 设计规范——追加写进你项目的宪法文件。以后 AI 帮你写代码，都会自动遵守它们。"

---

## 执行步骤（严格按顺序做）

### 第 1 步：体检——检查 Spec-Kit 是否已初始化

用 **Read 工具**按顺序探测：

1. 读 `.specify/memory/constitution.md`
   - 如果读不到（文件不存在），**停下**，给用户下面这段提示并结束命令：

     > "我看了一下，这个项目还没有 `.specify/memory/constitution.md`，说明 Spec-Kit 还没初始化。
     > 请先在终端里跑一次 `/speckit.constitution`，让它生成初始宪法，再回来跑 `/spec-kit-patch`。
     > （Spec-Kit 是一套'先写规范再写代码'的开发框架，`/spec-kit-patch` 是在它基础上加三条我们团队的底层规则。）"

   - 如果能读到，继续第 2 步。

2. （可选）顺手读一下 `.specify/` 下还有什么，心里有数就行。

### 第 2 步：先备份，再追加

**这一步的铁律：只追加，绝不覆盖。**

#### 2.1 备份原文件

用 **Bash 工具**执行：

```bash
cp .specify/memory/constitution.md .specify/memory/constitution.backup.md
```

备份成功后告诉用户："已经把原 constitution.md 备份到 `.specify/memory/constitution.backup.md`，改坏了随时能恢复。"

#### 2.2 追加三法衣到文件末尾

**方式（任选其一，推荐第一种）：**

- **推荐**：用 **Edit 工具**，把原文件最后几行作为 `old_string`，`new_string` 在其后拼接下面的三法衣段落（保留原内容完整）。
- **备选**：用 **Bash 工具**的 `>>` 重定向，例如 `cat >> .specify/memory/constitution.md <<'EOF' ... EOF`。

**要追加的完整内容**（从下一行 `---` 开始，一字不差地写进文件末尾）：

```markdown

---

# 三法衣原则（由 /spec-kit-patch 注入）

本段落定义 AgentHub 项目的三条底层法衣，所有后续 `/speckit.plan` / `/speckit.tasks` / `/speckit.implement` 必须对齐。

## 第一法衣：Spec-Kit 业务法衣

### 原则 1：Spec First（先规范，后代码）

在写任何代码之前，必须先有 spec（通过 `/speckit.specify` 产出）。每个 spec 必须包含：

- **User story**：用用户视角描述"谁、在什么场景、想达成什么"
- **Acceptance criteria**：可验证、可勾选的完成标准
- **Constraints**：技术约束、业务约束、边界条件

### 原则 2：Plan Before Implement（先规划，后动手）

Spec 完成后必须跑 `/speckit.plan` 做技术规划，规划需通过 `/speckit.analyze` 一致性检查，才能进入 implement 阶段。禁止跳过 plan 直接写代码。

### 原则 3：Quality Gate（质量闸门）

implement 之前必须依次通过：

- `/speckit.clarify` —— 发现需求盲点和歧义
- `/speckit.checklist` —— 验证需求本身是否清晰可执行

闸门未过，implement 禁开工。

## 第二法衣：StyleSeed 视觉法衣

本项目视觉规范共 69 条，统一维护在 `.styleseed/rules.md`（Single Source of Truth）。

以下列出 4 条最高频红线，完整清单一切以 `.styleseed/rules.md` 为准：

- **颜色**：所有颜色必须走 Tailwind `@theme` 变量，禁止 hardcoded hex（禁止 `#3B82F6` 这种写法）
- **间距**：所有 padding / margin / gap 必须走 4px 阶梯（4/8/12/16/24/32…），禁止 10/15/22 这种任意值
- **交互态**：所有可交互元素必须完整支持 5 态——default / hover / active / focus / disabled
- **图标**：功能图标必须用 `lucide-react`，禁止用 emoji 充当功能图标

> 如何查完整 69 条：`cat .styleseed/rules.md`。新增或修改规则请改那里，不要改这段。

## 第三法衣：Figma Variables 设计法衣

### 原则 1：Variables 化

所有设计稿必须 Variables 化，分层命名：`bg` / `fg` / `border` / `primary` / `secondary` / … 禁止在 Figma 里直接填色值。

### 原则 2：语义命名，禁止值语义

命名必须表达"用途"，禁止表达"长相"：

- 正例：`color.primary.default` / `color.bg.surface` / `color.fg.muted`
- 反例：`color.blue500` / `color.gray200` / `color.red`

### 原则 3：Figma 与代码双向同步

Figma 里的 Variables 必须和代码里的 Tailwind `@theme` 变量一一对应，通过 Figma MCP 定期校验，发现漂移立即对齐。

---

（三法衣注入结束。如需查看备份，请看 `.specify/memory/constitution.backup.md`。）
```

**注意事项：**

- 追加前先确认原文件末尾是否以换行结尾，不是就先补一个空行，避免粘连
- 追加过程中 **绝对不要** 删除、改写原有任何一行内容
- 追加完后，用 Read 工具再读一次 `.specify/memory/constitution.md`，确认：
  1. 原内容完好
  2. 三法衣段落完整出现在末尾

### 第 3 步：生成"三法衣生效清单"报告

用中文、豆包风格（轻松但清晰），给用户输出下面这份清单：

```
三法衣生效清单（/spec-kit-patch 执行完毕）

[ok] 原 constitution.md 已备份到 .specify/memory/constitution.backup.md
[ok] 第一法衣（Spec-Kit 业务法衣）已注入，共 3 条原则
[ok] 第二法衣（StyleSeed 视觉法衣）已注入，完整 69 条见 .styleseed/rules.md
[ok] 第三法衣（Figma Variables 设计法衣）已注入，共 3 条原则

从现在开始，你跑 /speckit.plan、/speckit.tasks、/speckit.implement 的时候，
它们都会自动读 constitution.md，并对齐这三法衣。

如果想回滚：
  cp .specify/memory/constitution.backup.md .specify/memory/constitution.md

下一步建议：
  1. 跑 /speckit.specify 写第一个 spec，体验三法衣的约束力
  2. 如果发现某条法衣太严/太松，直接编辑 constitution.md 里对应的段落
```

清单打印完，命令结束。不要再额外闲聊。

---

## 给 Claude 的四条铁律（执行前默念）

1. **只追加，绝不覆盖**——用 Edit 的追加模式或 Bash 的 `>>`，永远不要 Write 整个 constitution.md
2. **先备份，再动手**——`cp` 到 `.backup.md` 是任何修改的前置动作
3. **读不到 constitution.md 就停**——不要自作主张帮用户跑 `/speckit.constitution`，让用户自己跑
4. **中文输出，不要翻译腔**——所有解释和报告用人话中文，不要"我将要…"这种 AI 味
