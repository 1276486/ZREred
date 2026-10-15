# ZREstrikeAI × dsh × HexStrike 集成说明

本目录 `ZREstrikeAI` 是 **CyberStrikeAI 平台改名 + DSH 风格 UI 重塑** 后的产品工程
（Go module 名 `cyberstrike-ai` 按既定决策保留，仅用户可见品牌为 ZREstrikeAI）。
本文件描述它与 HexStrike AI、DeepSeek Harness（dsh）三者如何结合、如何运行与验证。

```
浏览器
 │  http://127.0.0.1:8080    ZREstrikeAI (Go/Gin SPA) — 品牌与主题均为 DSH 风格
 ├─ #chat   平台原生 Eino 对话引擎 ── 外部MCP(stdio) ──> hexstrike_mcp.py ──REST:8888──> hex (~180 安全工具)
 ├─ #dsh    侧栏新页面(iframe http://127.0.0.1:3080)   ← dsh web (DeepSeek agent)
 │              └─ dsh 会话可调 MCP: cyberstrike_*  ──> bridge/cyberstrike_mcp.py ──/api──> 平台落库
 └─ 资产/漏洞/项目/… 全部页面走 DSH token 主题（web/static/css/zrestrike-theme.css 覆盖层）
```

## 四条工作流产物（对应实施阶段 W1–W4）

| 阶段 | 产物 | 位置 |
|---|---|---|
| W1 hex 接入 | 平台 config.yaml 外部 MCP（stdio → `hexstrike_mcp.py`） | `config.yaml:external_mcp.servers.hexstrike-ai` |
| W2 品牌 + DSH 主题 | 品牌改名 + 主题覆盖层（不动原 6700 行模板） | `web/static/css/zrestrike-theme.css`、`web/templates/index.html`、`web/static/i18n/*`、`internal/termout/startup.go` |
| W3 dsh 内嵌页 | 侧栏 `data-page="dsh"` + `#page-dsh` iframe 容器 | `web/templates/index.html`、`web/static/js/router.js`、i18n `nav.dsh` |
| W4 落库桥 | stdio MCP 桥 + dsh profile 注入 + 编排 | `bridge/cyberstrike_mcp.py`、`bridge/cordis.cyberstrike.patch.yml.example`、`bridge/selftest.py`、`run-all.sh` |

### W1 说明
平台原生支持外部 MCP（`internal/config/config.go` 的 `ExternalMCPServerConfig`，stdio/sse/http）。
已把 hex 的 stdio MCP 注册为 `hexstrike-ai`：平台启动即 spawn `.venv/bin/python hexstrike_mcp.py
--server http://127.0.0.1:8888`，工具发现/执行/HITL 由平台现成机制承担，无需改 Go 代码。
启动日志出现 `外部MCP客户端已连接 name=hexstrike-ai` 即接入成功。

### W2 说明
设计 token 取自 dsh 源码 `deepseek-harness-master/packages/client/ui-theme/`：
`--dsw-static-deepseek-*`（400/450/500 蓝）、`--dsw-static-neutral-bluish-*` 中性色、
DSW 字体栈（含 SF Mono/JetBrains Mono 代码字体）。`zrestrike-theme.css` 在所有平台 CSS
之后加载，仅覆盖 CSS 变量与少量组件外观（圆角/滚动条/选区/焦点/按钮/聊天气泡/内嵌页）。
主题切换仍由 `theme.js` 的 system/light/dark 驱动（localStorage key 保留原值）。
如需要平台切主题时联动 dsh iframe 主题，可在 `theme.js` 里 `postMessage` 到 `#dsh-frame`。

### W3 说明
侧栏新增「DSH AI 对话」项 → `switchPage('dsh')`；主区新增 `#page-dsh` 容器，iframe 指向
dsh web 默认地址。`router.js` 的 initRouter/hashchange 白名单已含 `dsh`，未知页默认不抛错。

> 帧内嵌注意：dsh web 仅绑 127.0.0.1:3080（CLI 刻意不支持 `--host 0.0.0.0`）。若浏览器与
> 平台/ dsh 同机（本地运营场景），直嵌即可；若 dsh 响应头带 `X-Frame-Options`/`frame-ancestors`
> 禁帧，则走**方案 B**：在 `internal/app/app.go` 受保护路由组加 `GET/POST /dsh/*` →
> `httputil.ReverseProxy` 到 `127.0.0.1:3080`，iframe 改 `src="/dsh/"`（dsh 的 /api 浏览器信任
> 围栏需配合 `dsh web --trusted-host <host>`）。

### W4 说明（落库桥）
`bridge/cyberstrike_mcp.py` 是 python stdio MCP 服务（仅依赖 `mcp` SDK，HTTP 用 stdlib）：
- 登录态自动维护：`POST /api/auth/login`（admin）→ Bearer token，401 自动重登；
- 工具：`platform_status / project_list / project_create / asset_search / asset_add /
  vuln_record / vuln_search / conversation_get`；写库前先 search 去重、project_list 找归属；
- 落库纪律：仅记录会话中**确认**的发现；vuln_record 未给 conversation_id 时自动复用后台落库会话。

dsh 侧注入（无需改 dsh 源码）：`bridge/cordis.cyberstrike.patch.yml.example` 是一个
`- insert` 的 dsh-mcp-client 行。`run-all.sh` 会渲染出带绝对路径的
`bridge/gen/cordis.cyberstrike.patch.yml`，然后用 `dsh web --patch …` 叠加（覆盖优先组合模型，
不污染 DSH_HOME）。`ZRE_PASSWORD` 走 `!!js process.env.ZRE_PASSWORD` 运行时求值，不明文入库。
注意：dsh-mcp-client 的 stdio spawn 会“清洗”凭据形状环境变量，故密码必须在 patch 的 `env` 里显式给出。

## 运行（run-all.sh）

```bash
# 1) 三个源码工程就位：
#    ZREstrikeAI/（本目录）  hexstrike-ai-master/  deepseek-harness-master/
#    它们的父目录为 run-all 默认探测路径（可用 ZRE_HEX_DIR / ZRE_DSH_DIR 覆盖）。

# 2) 一键拉起 hex(:8888) + 平台(:8080)，生成 dsh patch 并自检桥
./run-all.sh                 # 平台默认 HTTPS self-signed；可加 --http 强制 HTTP
#    首次启动平台会生成一次性 admin 密码 → 写入 bridge/gen/admin.env

# 3) 第二次运行会复用已在跑的进程，并做一次桥的在线自检
./run-all.sh

# 4) 停服
./run-all.sh --stop

# 5) 把 dsh web 嵌进平台侧栏的「DSH AI 对话」
source bridge/gen/admin.env
export DEEPSEEK_API_KEY=sk-...      # 暂无则界面可用但不出 token（预期）
export DEEPSEEK_BASE_URL=...        # 可选：OpenAI 兼容端点
# 先构建 dsh：cd deepseek-harness-master && pnpm install && pnpm run build
dsh web --patch "$PWD/bridge/gen/cordis.cyberstrike.patch.yml"
```

## 验证清单

- [ ] `go build ./...` 通过；`curl -k https://127.0.0.1:8080/` 标题为 ZREstrikeAI
- [ ] 平台启动日志出现 `外部MCP客户端已连接 name=hexstrike-ai`（W1）
- [ ] 侧栏出现「DSH AI 对话」，点击后 iframe 载入 dsh web（W3，需 dsh 已构建并运行）
- [ ] `bridge/selftest.py` 返回 `tools/list: 8 个`（W4 注册）
- [ ] 平台「项目管理 / 资产库 / 漏洞管理」出现 dsh 会话经桥写入的数据（W4 落库）
- [ ] 原 Eino #chat、资产/漏洞/项目、登录/RBAC 回归正常

## 合规
HexStrike 为真实命令执行层，仅限授权靶标/本地实验环境使用；平台 HITL 为兜底。本集成不含
DesRedTeam 代码，落库桥针对本项目 API 自研；dsh 仅作引擎/界面与主题 token 来源。
