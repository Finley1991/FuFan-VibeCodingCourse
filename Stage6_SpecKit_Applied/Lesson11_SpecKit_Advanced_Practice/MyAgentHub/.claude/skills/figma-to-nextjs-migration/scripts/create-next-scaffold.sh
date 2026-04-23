#!/usr/bin/env bash
# create-next-scaffold.sh — 起一个对齐 AgentHub 约定的 Next.js 15 脚手架
#
# 用法：
#   ./scripts/create-next-scaffold.sh <新项目名>
#
# 示例：
#   ./scripts/create-next-scaffold.sh agenthub
#
# 产物：./<新项目名>/（Next.js 15 + TS + Tailwind + App Router + src-dir + @/ alias）
# 附带：自动装齐 shadcn/ui 需要的 Radix UI 依赖，避免漏装导致编译炸
#
# 约定选项（和 AgentHub 课程对齐）：
#   --typescript          TS
#   --tailwind            Tailwind v4
#   --app                 App Router（不要 Pages Router）
#   --src-dir             代码放 src/ 下
#   --no-eslint           搬家阶段先不开 ESLint（避免警告干扰）
#   --no-turbopack        先用稳定 Webpack（Turbopack 在某些 shadcn 场景有兼容问题）
#   --import-alias "@/*"  路径别名 @/

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法：$0 <新项目名>" >&2
  echo "示例：$0 agenthub" >&2
  exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="${PWD}/${PROJECT_NAME}"

if [ -e "$PROJECT_DIR" ]; then
  echo "错误：目标目录已存在：$PROJECT_DIR" >&2
  exit 1
fi

# 检查 pnpm 可用性
if ! command -v pnpm >/dev/null 2>&1; then
  echo "错误：没检测到 pnpm。请先安装：npm i -g pnpm" >&2
  exit 1
fi

echo "=> 在 $PWD 下创建 Next.js 项目：$PROJECT_NAME"
echo ""

pnpm create next-app@latest "$PROJECT_NAME" \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --no-turbopack \
  --import-alias "@/*" \
  --use-pnpm

echo ""
echo "=> 进入新项目目录并装齐 shadcn/ui 依赖"

cd "$PROJECT_DIR"

# Radix UI —— shadcn 组件依赖，一次性装全
pnpm add \
  @radix-ui/react-accordion @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio @radix-ui/react-avatar \
  @radix-ui/react-checkbox @radix-ui/react-collapsible \
  @radix-ui/react-context-menu @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-hover-card \
  @radix-ui/react-label @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu @radix-ui/react-popover \
  @radix-ui/react-progress @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slider \
  @radix-ui/react-slot @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toggle-group \
  @radix-ui/react-toggle @radix-ui/react-tooltip

# 其他 shadcn 相关库
pnpm add \
  class-variance-authority clsx tailwind-merge \
  tw-animate-css cmdk date-fns lucide-react \
  react-day-picker react-hook-form react-resizable-panels \
  recharts sonner embla-carousel-react input-otp vaul

echo ""
echo "=> 脚手架和依赖就绪：$PROJECT_DIR"
echo ""
echo "下一步："
echo "  cd $PROJECT_NAME"
echo "  pnpm dev    # 确认欢迎页能跑起来"
echo "  # 然后开始 Step 2：样式层迁移"
