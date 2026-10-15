#!/usr/bin/env bash
# ============================================================================
# run-all.sh — ZREstrikeAI 三件套本地编排（W1 hex / W3 dsh-web / 平台 :8080 / W4 桥）
#
# 启动顺序与端口：
#   hexstrike_server.py        REST    127.0.0.1:8888   （hex 工具后端，被平台外部 MCP 使用）
#   ZREstrikeAI 平台 (Go/Gin)  HTTPS   127.0.0.1:8080   （默认 self-signed；首次启动打印 admin 密码）
#   dsh web  (需已构建)         HTTP   127.0.0.1:3080   （DeepSeek agent 内嵌页，--patch 注入落库桥）
#
# 用法：
#   ./run-all.sh                          # hex + 平台；随后提示启动 dsh web 的命令
#   ./run-all.sh --with-dsh /abs/dshDir    # 顺带用已构建的 dsh 拉起 web(:3080)
#   ./run-all.sh --http                    # 平台强制 HTTP（跳过 self-signed TLS）
#   ./run-all.sh --stop                    # 停掉本脚本拉起的进程
#
# 环境（dsh 会话与落库桥需要）：
#   DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL   模型凭据（暂无则 dsh 界面可用但不出 token）
#   ZRE_API_BASE / ZRE_USERNAME / ZRE_PASSWORD
#      平台地址与桥登录凭据；未设置时脚本从平台首次启动日志里提取自动生成的 admin 密码，
#      写入 bridge/gen/admin.env 供 source。
# ============================================================================
set -uo pipefail

export PATH="${PATH:-}:/usr/bin:/bin:/usr/local/bin"
ZRE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_WORK="$(cd "$ZRE_DIR/.." && pwd)"               # 三个工程的父目录
HEX_DIR="${ZRE_HEX_DIR:-$ROOT_WORK/hexstrike-ai-master}"
DSH_DIR="${ZRE_DSH_DIR:-$ROOT_WORK/deepseek-harness-master}"
CONFIG="$ZRE_DIR/config.yaml"
GEN="$ZRE_DIR/bridge/gen"
PLATFORM_BIN="$ZRE_DIR/bin/zrestrike-ai"
PIDFILE="$GEN/run-all.pids"
PLATFORM_LOG="$GEN/platform.log"
HEX_LOG="$GEN/hex.log"

info()  { printf '\033[36m[run-all]\033[0m %s\n' "$*"; }
warn()  { printf '\033[33m[run-all][warn]\033[0m %s\n' "$*"; }
die()   { printf '\033[31m[run-all][error]\033[0m %s\n' "$*" >&2; exit 1; }

mkdir -p "$GEN"

# 启动一个完全脱离本脚本会话/任务表的守护进程（setsid + disown），
# 避免 bash 在脚本中后段对后台子进程做阻塞式 waitpid 而拖住脚本退出。
launch_daemon() {  # launch_daemon <pidfile> <logfile> <cmd...>
  local _pf="$1" _lf="$2"; shift 2
  setsid nohup "$@" </dev/null >"$_lf" 2>&1 &
  disown 2>/dev/null || true
  echo $! >> "$_pf"
  info "daemon pid $! : $*"
}

# ---------------------------------------------------------------- 参数解析
PLATFORM_TLS_ARGS=(--config "$CONFIG")
WITH_DSH=""
case "${1:-}" in
  --stop)
    if [ -f "$PIDFILE" ]; then
      while read -r _pid; do
        [ -n "${_pid:-}" ] && kill "$_pid" 2>/dev/null && info "stopped pid $_pid"
      done < "$PIDFILE"
      rm -f "$PIDFILE"
    fi
    info "done."; exit 0 ;;
  --http) PLATFORM_TLS_ARGS+=(--http); shift ;;
esac
if [ "${1:-}" = "--with-dsh" ]; then shift; WITH_DSH="${1:-$DSH_DIR}"; fi
[ -n "$WITH_DSH" ] && [ -d "$WITH_DSH" ] || WITH_DSH=""

# ---------------------------------------------------------------- 平台 admin 凭据
export ZRE_API_BASE="${ZRE_API_BASE:-}"
export ZRE_USERNAME="${ZRE_USERNAME:-admin}"
export ZRE_PASSWORD="${ZRE_PASSWORD:-}"
if [ -z "$ZRE_PASSWORD" ] && [ -f "$GEN/admin.env" ]; then
  # shellcheck disable=SC1090
  . "$GEN/admin.env"
fi

# ---------------------------------------------------------------- 1) hex REST :8888
if ! curl -sf -m 2 http://127.0.0.1:8888/health >/dev/null 2>&1; then
  HEX_PY=""
  [ -x "$HEX_DIR/.venv/bin/python" ] && HEX_PY="$HEX_DIR/.venv/bin/python"
  if [ -z "$HEX_PY" ]; then
    [ -x "$HEX_DIR/.venv/bin/python" ] || die "未找到 hex venv：先执行  cd $HEX_DIR && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  fi
  info "启动 hex 工具后端  :8888  ($HEX_PY $HEX_DIR/hexstrike_server.py --port 8888)"
  launch_daemon "$PIDFILE" "$HEX_LOG" "$HEX_PY" "$HEX_DIR/hexstrike_server.py" --port 8888
  sleep 3
  curl -sf -m 3 http://127.0.0.1:8888/health >/dev/null 2>&1 && info "hex /health OK" || warn "hex 未就绪（看 $HEX_LOG；可能缺系统工具，但 MCP 层仍可注册）"
else
  info "hex 已在 :8888 运行，跳过"
fi

# ---------------------------------------------------------------- 2) 平台 Go :8080
if ! curl -skf -m 2 "http://127.0.0.1:8080/" >/dev/null 2>&1 && ! curl -skf -m 2 "https://127.0.0.1:8080/" >/dev/null 2>&1; then
  GO="$(command -v go || true)"
  [ -x /usr/local/go/bin/go ] && GO=/usr/local/go/bin/go
  [ -n "$GO" ] || die "未找到 go（请安装 Go 1.24+ 或放入 PATH）"
  info "构建平台二进制 ..."
  (cd "$ZRE_DIR" && "$GO" build -o "$PLATFORM_BIN" ./cmd/server) || die "go build 失败"
  info "启动平台 :8080  ${PLATFORM_TLS_ARGS[*]}"
  (cd "$ZRE_DIR" && launch_daemon "$PIDFILE" "$PLATFORM_LOG" "$PLATFORM_BIN" "${PLATFORM_TLS_ARGS[@]}")
  # 等待上线并抓首次 admin 密码
  for _ in $(seq 1 20); do
    curl -skf -m 2 https://127.0.0.1:8080/ >/dev/null 2>&1 && break
    curl -sf  -m 2 http://127.0.0.1:8080/  >/dev/null 2>&1 && break
    sleep 1
  done
  sleep 2
  PW="$(awk '/^  Password /{print $2; exit}' "$PLATFORM_LOG")"
  if [ -n "$PW" ]; then
    printf 'export ZRE_API_BASE="%s"\nexport ZRE_USERNAME="admin"\nexport ZRE_PASSWORD="%s"\n' \
      "$ZRE_API_BASE" "$PW" > "$GEN/admin.env"
    info "平台首次启动已生成 admin 密码 → 已写入 bridge/gen/admin.env（请妥善保存）"
  fi
  if curl -skf -m 2 https://127.0.0.1:8080/ >/dev/null 2>&1; then
    info "平台 ONLINE https://127.0.0.1:8080/"
  elif curl -sf -m 2 http://127.0.0.1:8080/ >/dev/null 2>&1; then
    info "平台 ONLINE http://127.0.0.1:8080/"
  else
    warn "平台未就绪，看 $PLATFORM_LOG"
  fi
else
  info "平台已在 :8080 运行，跳过"
fi

# ---------------------------------------------------------------- 3) 桥 venv + dsh profile 注入
BRIDGE_PY=""
[ -x "$ZRE_DIR/bridge/.venv/bin/python" ] && BRIDGE_PY="$ZRE_DIR/bridge/.venv/bin/python"
[ -z "$BRIDGE_PY" ] && [ -x "$HEX_DIR/.venv/bin/python" ] && "$HEX_DIR/.venv/bin/python" -c "import mcp" 2>/dev/null && BRIDGE_PY="$HEX_DIR/.venv/bin/python"
if [ -z "$BRIDGE_PY" ]; then
  warn "未找到含 mcp SDK 的 python，正在创建 bridge/.venv ..."
  python3 -m venv "$ZRE_DIR/bridge/.venv" || die "创建 venv 失败"
  "$ZRE_DIR/bridge/.venv/bin/pip" install -q 'mcp[fastmcp]' || die "pip install mcp 失败"
  BRIDGE_PY="$ZRE_DIR/bridge/.venv/bin/python"
fi
info "落库桥 python: $BRIDGE_PY"

if [ -z "$ZRE_API_BASE" ]; then
  curl -skf -m 2 https://127.0.0.1:8080/ >/dev/null 2>&1 && ZRE_API_BASE="https://127.0.0.1:8080/api" || ZRE_API_BASE="http://127.0.0.1:8080/api"
fi

# 渲染带绝对路径的 dsh profile 覆盖层
sed -e "s|@ZRE_BRIDGE_PY@|$BRIDGE_PY|g" \
    -e "s|@ZRE_BRIDGE_DIR@|$ZRE_DIR/bridge|g" \
    -e "s|@ZRE_API_BASE@|$ZRE_API_BASE|g" \
    -e "s|@ZRE_USERNAME@|${ZRE_USERNAME:-admin}|g" \
    "$ZRE_DIR/bridge/cordis.cyberstrike.patch.yml.example" > "$GEN/cordis.cyberstrike.patch.yml"
info "dsh profile 注入文件已生成：$GEN/cordis.cyberstrike.patch.yml"

# 桥自检（stdio tools/list）；有 timeout 时兜底，避免偶发阻塞拖住脚本
TMO=""
command -v timeout >/dev/null 2>&1 && TMO="timeout 60"
info "桥 MCP 自检 ..."
if [ -n "${ZRE_PASSWORD:-}" ]; then
  if ZRE_API_BASE="$ZRE_API_BASE" ZRE_USERNAME="$ZRE_USERNAME" ZRE_PASSWORD="$ZRE_PASSWORD" \
       $TMO "$BRIDGE_PY" "$ZRE_DIR/bridge/selftest.py"; then
    info "桥工具注册 OK"
  else
    warn "桥自检失败（平台未就绪时忽略）"
  fi
else
  warn "未设置 ZRE_PASSWORD，跳过在线自检（平台首启密码见 bridge/gen/admin.env）"
fi

# ---------------------------------------------------------------- 4) dsh web
DSH_WEB_CMD="dsh web --patch $GEN/cordis.cyberstrike.patch.yml"
if [ -n "$WITH_DSH" ]; then
  if [ -x "$WITH_DSH/packages/cli/bin/dsh.js" ] || command -v dsh >/dev/null 2>&1; then
    info "启动 dsh web :3080（$DSH_WEB_CMD）"
    # shellcheck disable=SC2086
    set -- $DSH_WEB_CMD
    (cd "$WITH_DSH" && launch_daemon "$PIDFILE" "$GEN/dsh.log" "$@")
  else
    warn "--with-dsh 但 dsh 未构建/未在 PATH：先 cd $DSH_DIR && pnpm install && pnpm run build"
  fi
else
  cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  平台已就绪。把「DSH AI 对话」嵌入页接上 dsh web：

  1) 模型凭据（暂无也能开界面，只是不出 token）
       export DEEPSEEK_API_KEY=sk-...
       export DEEPSEEK_BASE_URL=...            # 可选

  2) 让 dsh 会话可写回平台（落库桥）
       source $GEN/admin.env                    # 注入平台 admin 密码
       $DSH_WEB_CMD

  3) 浏览器打开 http://127.0.0.1:8080/  → 侧栏「DSH AI 对话」
     平台 UI 会 iframe 拉取 http://127.0.0.1:3080/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
fi
