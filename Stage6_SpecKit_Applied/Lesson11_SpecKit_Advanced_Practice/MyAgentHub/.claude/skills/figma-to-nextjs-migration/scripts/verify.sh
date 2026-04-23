#!/usr/bin/env bash
# verify.sh — 搬家后一键验证
#
# 用法（在 Next.js 新项目根目录里跑）：
#   ./scripts/verify.sh [PORT]
#
# 默认 PORT=3000。脚本会：
#   1. 跑一次 pnpm build（抓 TS 类型错误）
#   2. 后台启 pnpm dev
#   3. 访问 7 个路由，抓 HTTP 状态和 stderr 的 Hydration warning
#   4. 停掉 dev server
#   5. 汇总结果
#
# 退出码：
#   0 = 全绿
#   非 0 = 有失败项（错误详情打在 stdout）

set -uo pipefail

PORT="${1:-3000}"
BASE_URL="http://localhost:${PORT}"

# 7 个预期路由
ROUTES=(
  "/"
  "/pricing"
  "/gallery"
  "/agent/agent-1"
  "/runs"
  "/settings"
  "/pipeline"
)

echo "=========================================="
echo "  figma-to-nextjs-migration · verify.sh"
echo "=========================================="
echo "项目目录：$PWD"
echo "端口：$PORT"
echo ""

# ─── 检查 1：package.json 存在 ─────────────────
if [ ! -f "package.json" ]; then
  echo "✗ 找不到 package.json。请 cd 到 Next.js 项目根目录后再跑。"
  exit 1
fi

# ─── 检查 2：next 依赖存在 ─────────────────────
if ! grep -q '"next"' package.json; then
  echo "✗ package.json 里没有 next 依赖。这不是 Next.js 项目。"
  exit 1
fi

# ─── 检查 3：pnpm build ────────────────────────
echo "[1/4] 跑 pnpm build（检查 TS 类型错误）..."
BUILD_LOG="$(mktemp)"
if pnpm build > "$BUILD_LOG" 2>&1; then
  echo "      ✓ build 通过"
else
  echo "      ✗ build 失败。日志："
  tail -50 "$BUILD_LOG"
  rm -f "$BUILD_LOG"
  exit 1
fi
rm -f "$BUILD_LOG"
echo ""

# ─── 检查 4：启 dev server ─────────────────────
echo "[2/4] 后台启 pnpm dev..."
DEV_LOG="$(mktemp)"
pnpm dev > "$DEV_LOG" 2>&1 &
DEV_PID=$!

# 清理函数
cleanup() {
  if kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
  rm -f "$DEV_LOG"
}
trap cleanup EXIT

# 等 dev server 起来（最多 30s）
echo "      等 dev server 起来..."
READY=0
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" 2>/dev/null | grep -q "200\|307\|308"; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "      ✗ dev server 30s 内没起来。最后的日志："
  tail -30 "$DEV_LOG"
  exit 1
fi
echo "      ✓ dev server 已就绪"
echo ""

# ─── 检查 5：逐个访问 7 个路由 ─────────────────
echo "[3/4] 访问 7 个预期路由..."
FAILED_ROUTES=()
for route in "${ROUTES[@]}"; do
  STATUS="$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${route}")"
  if [ "$STATUS" = "200" ]; then
    printf "      ✓ %-20s → %s\n" "$route" "$STATUS"
  else
    printf "      ✗ %-20s → %s\n" "$route" "$STATUS"
    FAILED_ROUTES+=("$route")
  fi
done
echo ""

# ─── 检查 6：Hydration warning 扫描 ─────────────
echo "[4/4] 扫描 Hydration warning..."
HYDRATION_HITS=0
if grep -qE "Hydration failed|Text content did not match|did not match the client" "$DEV_LOG"; then
  HYDRATION_HITS=1
  echo "      ✗ 检测到 Hydration warning。相关日志："
  grep -E "Hydration|did not match" "$DEV_LOG" | head -10
else
  echo "      ✓ 无 Hydration warning"
fi
echo ""

# ─── 汇总 ──────────────────────────────────────
echo "=========================================="
echo "  汇总"
echo "=========================================="

EXIT=0
if [ "${#FAILED_ROUTES[@]}" -gt 0 ]; then
  echo "✗ 有 ${#FAILED_ROUTES[@]} 条路由没返回 200："
  for r in "${FAILED_ROUTES[@]}"; do
    echo "    - $r"
  done
  EXIT=1
fi

if [ "$HYDRATION_HITS" -eq 1 ]; then
  echo "✗ 有 Hydration warning——查 references/hydration-fixes.md 修复"
  EXIT=1
fi

if [ "$EXIT" -eq 0 ]; then
  echo "✅ 全绿。搬家验证通过。"
fi

exit "$EXIT"
