#!/usr/bin/env bash
# 在 Linux 服务器上执行（已 SSH 登录后）：
#   chmod +x scripts/deploy-on-server.sh
#   APP_DIR=/root/CupidFlowerShop ./scripts/deploy-on-server.sh
#
# 更新部署前先停掉占用 3000 的进程： pm2 stop cupid-flower-shop 或 kill <PID>
# 环境变量：复制 .env.example 为 .env.production 并设置 AUTH_SECRET
set -euo pipefail

PORT="${PORT:-3000}"
REPO_URL="${REPO_URL:-https://github.com/Lanewoo/CupidFlowerShop.git}"
APP_DIR="${APP_DIR:-$(pwd)}"

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -tlnp 2>/dev/null | grep -E ":${PORT}[[:space:]]" | grep -q LISTEN
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1
    return $?
  fi
  echo "ERROR: 请安装 iproute2(ss) 或 lsof 以检查端口。" >&2
  return 2
}

show_listeners() {
  if command -v ss >/dev/null 2>&1; then
    ss -tlnp 2>/dev/null | grep -E ":${PORT}[[:space:]]" || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$PORT" -sTCP:LISTEN -Pn 2>/dev/null || true
  fi
}

if [ "${SKIP_PORT_CHECK:-0}" != "1" ]; then
  echo "检查端口 ${PORT} …"
  if port_in_use; then
    echo "端口 ${PORT} 已被占用："
    show_listeners
    echo "请先停止现有服务后再部署，或 SKIP_PORT_CHECK=1 仅拉代码构建。"
    exit 1
  fi
  echo "端口 ${PORT} 空闲。"
fi

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "克隆到 ${APP_DIR} …"
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git fetch origin
git checkout main
git pull origin main

if [ ! -f .env.production ] && [ ! -f .env.local ]; then
  echo "提示：未找到 .env.production，请 cp .env.example .env.production 并设置 AUTH_SECRET"
fi

# 若已 export NODE_ENV=production，npm ci 会跳过 devDependencies，导致 next build 失败
(
  unset NODE_ENV
  npm ci
)
NODE_ENV=production npm run build

echo ""
echo "构建完成。启动（监听 0.0.0.0:3000）："
echo "  cd ${APP_DIR} && NODE_ENV=production npm run start"
echo "或使用 PM2： pm2 start ecosystem.config.cjs"
