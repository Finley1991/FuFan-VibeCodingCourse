#!/usr/bin/env bash
# backup.sh — 给源项目做带时间戳的完整备份
#
# 用法：
#   ./scripts/backup.sh <源项目路径>
#
# 示例：
#   ./scripts/backup.sh "./Start Project"
#   ./scripts/backup.sh /some/abs/path/figma-make-output
#
# 产物：<源项目路径>.backup-YYYYMMDD-HHMMSS（和源项目同目录）

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法：$0 <源项目路径>" >&2
  echo "示例：$0 \"./Start Project\"" >&2
  exit 1
fi

SRC="$1"

if [ ! -d "$SRC" ]; then
  echo "错误：源项目不存在或不是目录：$SRC" >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${SRC}.backup-${TIMESTAMP}"

if [ -e "$DEST" ]; then
  echo "错误：备份目标已存在：$DEST" >&2
  exit 1
fi

echo "=> 正在备份：$SRC → $DEST"
cp -r "$SRC" "$DEST"

# 可选：把 node_modules 从备份里剔除，节省空间和时间
if [ -d "$DEST/node_modules" ]; then
  echo "=> 剔除备份里的 node_modules（减小体积）"
  rm -rf "$DEST/node_modules"
fi

SIZE="$(du -sh "$DEST" | awk '{print $1}')"

echo "=> 备份完成：$DEST"
echo "=> 体积：$SIZE"
echo ""
echo "提示：备份只作参考用，搬家过程中遇到不懂的原始配置可以来这里查。"
echo "搬家完全跑通后，确认不需要就可以删掉这个备份。"
