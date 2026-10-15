<div align="center">
  <img src="images/logo.png" alt="ZREstrikeAI" width="200">
</div>

<h1 align="center">ZREstrikeAI</h1>

<p align="center">
  <strong>AI 原生的安全运营平台 —— 意图转化为受管控的执行，<br>
  证据沉淀为可复用的作战记忆，每一次操作都在改进下一次。</strong>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="docs/zh-CN/README.md">中文文档</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#配置">配置</a> ·
  <a href="#许可与署名">许可</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.25%2B-00ADD8?logo=go&logoColor=white" alt="Go 1.25+">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/MCP-native-6E4AFF" alt="MCP native">
  <img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="Apache-2.0">
</p>

---

## 项目简介

ZREstrikeAI 是一个面向**授权安全测试**的自托管平台。它把规划、执行、人工审核、证据留存与回放统一在同一套可审计的工作区中，使 AI Agent 的每一步动作都处于管控之下、可复核、可复现。

项目使用 Go 编写，Agent 运行时基于 [Eino](https://github.com/cloudwego/eino)，整合了多 Agent 编排、MCP 原生工具链、RAG 知识检索、可视化图工作流与攻击链建模能力。

| | |
|---|---|
| **开发语言** | Go 1.25+ / Python 3.10+ |
| **Agent 运行时** | Eino —— 单 Agent、Deep、Plan-Execute、Supervisor 四种模式 |
| **工具协议** | MCP（HTTP / stdio / SSE / 外部联邦） |
| **接入方式** | Web 控制台、REST API、MCP stdio、聊天机器人桥接 |
| **开源许可** | Apache-2.0 |

---

## 核心能力

### Agent 编排

- **意图到执行** —— 自然语言目标被翻译为受管控、可审计的安全动作。
- **四种执行模式** —— 单 Agent、Deep 深度推理、Plan-Execute 计划执行、Supervisor 多 Agent 协同。
- **图工作流** —— 将 Agent、工具、条件分支、审批节点与输出组合为可复用流程。
- **角色化测试** —— 内置 14 个角色，各自带有专属提示词与工具权限策略。

### 工具与知识

- **90 个精选工具配方** —— 声明式 YAML 定义，支持自定义扩展与角色级访问控制。
- **MCP 原生集成** —— 支持 HTTP、stdio、SSE、外部联邦与动态工具发现。
- **弹性执行** —— 阻塞式工具调用在 worker 中执行，具备有界等待、可续跑的 `execution_id` 轮询、取消、单服务熔断与并发上限。
- **Agent Skills** —— 遵循标准 `SKILL.md` 结构，支持渐进式按需加载（内置 24 个）。
- **RAG 知识库** —— 查询改写、向量检索、重排序与结果后处理。
- **视觉分析** —— 独立视觉模型处理截图、验证码与界面识别，仅保留文本摘要。

### 管控与审计

- **人工介入（HITL）** —— 审批模式、工具白名单、审计 Agent 复核与可追溯的决策记录。
- **平台级 RBAC** —— 多用户体系，支持系统角色与自定义角色、细粒度权限与显式归属。
- **证据留存** —— 鉴权访问、审计日志、SQLite 持久化与工具结果容量上限。
- **结果治理** —— Agent 看到的结果与落库结果完全一致，避免超大历史输出破坏续跑路径。详见 [工具执行治理](docs/zh-CN/tool-execution-governance.md)。

### 安全运营

- **资产管理** —— 域名、IP、端口与服务的归一化去重；支持 XLSX/CSV 导入导出、筛选视图、跨页批量维护与扫描覆盖率追踪。详见[资产管理指南](docs/zh-CN/asset-management.md)。
- **漏洞管理** —— 危险等级划分、生命周期跟踪、筛选与统计。
- **项目与攻击链** —— 跨会话事实关联、风险评分、图谱视图与逐步回放。
- **批量任务** —— 排队执行、编辑、状态跟踪与结果保留。
- **WebShell 管理** —— 连接管理、虚拟终端、文件操作与 AI 辅助流程。
- **内置 C2** —— 监听器、加密 beacon、会话管理、任务队列与 payload 辅助生成。
- **聊天机器人接入** —— 个人微信、企业微信、钉钉、飞书、Telegram、Slack、Discord、QQ 机器人。

> WebShell、C2 等高风险能力**仅限**用于你自有或已取得书面授权的系统。启用前请阅读[安全模型](docs/zh-CN/security-model.md)与[安全加固指南](docs/zh-CN/security-hardening.md)。

---

## 界面预览

<div align="center">

<table>
<tr>
<td width="50%" align="center"><strong>控制台 · 浅色</strong><br>
<img src="./images/dashboard.png" alt="系统控制台 浅色模式" width="100%"></td>
<td width="50%" align="center"><strong>控制台 · 深色</strong><br>
<img src="./images/dark.png" alt="系统控制台 深色模式" width="100%"></td>
</tr>
</table>

<details>
<summary><strong>展开更多界面截图</strong></summary>
<br>

<table>
<tr>
<td width="33.33%" align="center"><strong>Web 控制台</strong><br><img src="./images/web-console.png" alt="Web 控制台" width="100%"></td>
<td width="33.33%" align="center"><strong>任务管理</strong><br><img src="./images/task-management.png" alt="任务管理" width="100%"></td>
<td width="33.33%" align="center"><strong>漏洞管理</strong><br><img src="./images/vulnerability-management.png" alt="漏洞管理" width="100%"></td>
</tr>
<tr>
<td width="33.33%" align="center"><strong>WebShell 管理</strong><br><img src="./images/webshell-management.png" alt="WebShell 管理" width="100%"></td>
<td width="33.33%" align="center"><strong>MCP 管理</strong><br><img src="./images/mcp-management.png" alt="MCP 管理" width="100%"></td>
<td width="33.33%" align="center"><strong>知识库</strong><br><img src="./images/knowledge-base.png" alt="知识库" width="100%"></td>
</tr>
<tr>
<td width="33.33%" align="center"><strong>Skills 管理</strong><br><img src="./images/skills.png" alt="Skills 管理" width="100%"></td>
<td width="33.33%" align="center"><strong>Agent 管理</strong><br><img src="./images/agent-management.png" alt="Agent 管理" width="100%"></td>
<td width="33.33%" align="center"><strong>角色管理</strong><br><img src="./images/role-management.png" alt="角色管理" width="100%"></td>
</tr>
<tr>
<td width="33.33%" align="center"><strong>系统设置</strong><br><img src="./images/settings.png" alt="系统设置" width="100%"></td>
<td width="33.33%" align="center"><strong>MCP stdio 模式</strong><br><img src="./images/mcp-stdio2.png" alt="MCP stdio 模式" width="100%"></td>
<td width="33.33%" align="center"><strong>Burp Suite 插件</strong><br><img src="./images/plugins.png" alt="Burp Suite 插件" width="100%"></td>
</tr>
</table>

</details>

</div>

---

## 项目结构

```
ZREstrikeAI/
├── cmd/                 # 入口：server、MCP stdio、辅助工具
├── internal/            # 31 个包 —— agent、multiagent、mcp、eino*、c2、hitl、knowledge、security、workflow
├── web/                 # Web 控制台（静态 SPA + 模板）
├── tools/               # 90 个声明式 YAML 工具配方
├── roles/               # 14 个预置安全测试角色
├── skills/              # 24 个 Agent Skills（SKILL.md 结构）
├── agents/              # 16 个多 Agent 定义（orchestrator + 子 Agent）
├── plugins/             # Burp Suite 扩展、Chrome/Edge 扩展
├── docs/                # 32 篇英文 / 34 篇中文专题文档
├── images/              # 截图与示意图
├── config.example.yaml  # 配置模板
├── run.sh               # 一键启动脚本
├── run-all.sh           # 全栈启动脚本
└── upgrade.sh           # 原地升级脚本
```

---

## 快速开始

**环境要求**

- **Go 1.25+** —— [下载](https://go.dev/dl/)
- **Python 3.10+** —— [下载](https://www.python.org/downloads/)

**一键部署**

```bash
git clone https://github.com/1276486/ZREred.git
cd ZREred
chmod +x run.sh && ./run.sh
```

`run.sh` 会自动完成：Go 与 Python 环境检查、创建 Python 虚拟环境、安装 Python 依赖、下载 Go 依赖、编译项目、启动服务。

**启动验证**

1. 终端显示 `● ONLINE` 及实际 Web UI 地址。
2. 打开该地址。默认 HTTPS 模式使用本地自签名证书，首次访问需在浏览器中接受一次警告。
3. 全新安装时，复制 `ADMIN SETUP REQUIRED` 下方显示的一次性 `admin` 密码登录，并立即修改。

**网络默认值** —— `run.sh` 默认以 `--https` 加载 `config.yaml` 启动（自签名 TLS，更适合多路并发流）。需要明文 HTTP 时使用 `./run.sh --http`。生产环境请在 `config.yaml` 中设置 `server.tls_cert_path` 与 `server.tls_key_path`。手动运行时追加 `--https` 或设置环境变量 `CYBERSTRIKE_HTTPS=1`。

**其他启动方式**

```bash
# 直接运行
go run cmd/server/main.go --https

# 手动编译（产物名与 run.sh 保持一致）
go build -o cyberstrike-ai cmd/server/main.go
./cyberstrike-ai --https
```

若日志出现 `client sent an HTTP request to an HTTPS server`，说明客户端仍在用 `http://` 访问仅监听 TLS 的端口，请将地址改为 `https://`。

---

## 配置

以 [`config.example.yaml`](config.example.yaml) 为准，仅复制你的环境所需的字段。至少需要配置服务端与一个 AI 通道：

```yaml
server:
  host: "127.0.0.1"
  port: 8080

ai:
  default_channel: openai-main
  channels:
    openai-main:
      provider: openai_compatible
      api_key: "${OPENAI_API_KEY}"
      base_url: "https://api.openai.com/v1"
      model: "your-model"
```

顶层的 `openai` 字段为向后兼容保留，新模型配置请统一写在 `ai.channels` 下。`ai.default_channel` 用于新建会话及未显式指定通道的任务；聊天页面仍可按会话临时切换通道。

> **切勿提交真实密钥。** `config.yaml`、`data/`、`chat_uploads/` 已在 [`.gitignore`](.gitignore) 中排除。密钥请通过环境变量注入，例如 `${OPENAI_API_KEY}`。

在将服务暴露到 localhost 之外以前，请先阅读[配置参考](docs/zh-CN/configuration.md)、[推荐配置档](docs/zh-CN/configuration-profiles.md)与[安全加固指南](docs/zh-CN/security-hardening.md)。

**安全工具（可选）** —— 按需从 `tools/` 安装；缺失的工具在运行时会跳过或自动替换。

```bash
# macOS
brew install nmap masscan sqlmap nikto gobuster ffuf hydra hashcat nuclei subfinder

# Debian / Ubuntu / Kali
sudo apt update
sudo apt install -y nmap masscan sqlmap nikto gobuster hydra hashcat john binwalk
# ffuf / nuclei / subfinder 通常通过 go install 或上游 release 安装
```

---

## 工具覆盖

ZREstrikeAI 内置 90 个精选工具配方，覆盖完整杀伤链。

<details>
<summary><strong>展开全部工具分类</strong></summary>
<br>

| 分类 | 工具 |
|---|---|
| 网络扫描 | nmap、masscan、rustscan、arp-scan、nbtscan |
| Web 与应用扫描 | sqlmap、nikto、dirb、gobuster、feroxbuster、ffuf、httpx |
| 漏洞扫描 | nuclei、wpscan、wafw00f、dalfox、xsser |
| 子域枚举 | subfinder、amass、findomain、dnsenum、fierce |
| 网络空间测绘 | fofa、zoomeye、quake、shodan |
| API 安全 | graphql-scanner、arjun、api-fuzzer、api-schema-analyzer |
| 容器安全 | trivy、clair、docker-bench-security、kube-bench、kube-hunter |
| 云安全 | prowler、scout-suite、cloudmapper、pacu、terrascan、checkov |
| 二进制分析 | gdb、radare2、ghidra、objdump、strings、binwalk |
| 漏洞利用 | metasploit、msfvenom、pwntools、ropper、ropgadget |
| 口令破解 | hashcat、john、hashpump |
| 取证分析 | volatility、volatility3、foremost、steghide、exiftool |
| 后渗透 | linpeas、winpeas、mimikatz、bloodhound、impacket、responder |
| CTF 工具 | stegsolve、zsteg、hash-identifier、fcrackzip、pdfcrack、cyberchef |
| 系统辅助 | exec、create-file、delete-file、list-files、modify-file |

</details>

配方定义、自定义方式与使用说明见 [`tools/README.md`](tools/README.md)。

---

## 插件

可选集成位于 `plugins/` 目录。

**Burp Suite 扩展** —— 抓取并转发已认证流量至 ZREstrikeAI，用于 AI 辅助分析。

```
源码：  plugins/burp-suite/cyberstrikeai-burp-extension/
产物：  plugins/burp-suite/cyberstrikeai-burp-extension/dist/cyberstrikeai-burp-extension.jar
文档：  plugins/burp-suite/cyberstrikeai-burp-extension/README.md
```

**浏览器扩展（Chrome / Edge）** —— 在 DevTools 中捕获网络流量并转发至 ZREstrikeAI，与 Burp 插件能力对齐。

```
源码：  plugins/browser-extension/cyberstrikeai-browser-extension/
安装：  chrome://extensions/ → 加载已解压的扩展程序 → F12 → "CyberStrikeAI" 标签页
打包：  plugins/browser-extension/cyberstrikeai-browser-extension/dist/cyberstrikeai-browser-extension.zip
文档：  plugins/browser-extension/cyberstrikeai-browser-extension/README.zh-CN.md
```

---

## 使用示例

**直接请求**

```
扫描 192.168.1.1 的开放端口
对 192.168.1.1 做一次全端口扫描，重点关注 80、443、22
检测 https://example.com/page?id=1 是否存在 SQL 注入
扫描 https://example.com 的隐藏目录与过期组件
枚举 example.com 的子域名，并对结果运行 nuclei
```

**多步编排**

```
加载 recon-engagement 模板，运行 amass/subfinder，然后对所有存活主机做目录爆破。
接入基于 Burp 的外部 MCP 服务做已认证流量重放，把发现结果回传用于绘制图谱。
压缩这份 5 MB 的 nuclei 报告，汇总其中的高危 CVE，并把产物挂到会话中。
为最近一次任务构建攻击链，导出危险等级 >= 高 的节点列表。
```

---

## 文档索引

| 读者 | 推荐阅读顺序 |
|---|---|
| **初次使用** | [部署](docs/zh-CN/deployment.md) → [配置](docs/zh-CN/configuration.md) → [故障排查](docs/zh-CN/troubleshooting.md) |
| **运维人员** | [配置档](docs/zh-CN/configuration-profiles.md) → [安全加固](docs/zh-CN/security-hardening.md) → [运维手册](docs/zh-CN/runbooks.md) |
| **集成开发** | [API 参考](docs/zh-CN/api-reference.md) → [API 配方](docs/zh-CN/api-recipes.md) → [MCP 联邦](docs/zh-CN/mcp-federation.md) |
| **贡献代码** | [开发者指南](docs/zh-CN/developer-guide.md) → [测试](docs/zh-CN/testing.md) → [贡献指南](docs/zh-CN/contributing-guide.md) |

完整索引：[中文文档](docs/zh-CN/README.md) · [双语文档总览](docs/README.md)

---

## 升级

```bash
chmod +x upgrade.sh          # 仅首次需要
./upgrade.sh --yes           # 可选参数：--tag vX.Y.Z、--no-venv
```

脚本会备份 `config.yaml` 与 `data/`，从发布源同步代码，更新 `version` 字段并重启服务。本地的 `tools/`、`roles/`、`skills/` 始终保留。如需回滚，从 `.upgrade-backup/` 恢复后重新执行 `./run.sh` 即可。

**依赖** —— 下载需要 `curl` 或 `wget`；安全的代码同步建议安装 `rsync`。若遇到 GitHub API 限流，先导出 `GITHUB_TOKEN`。

> **升级前**请先阅读目标版本的 release notes，确认配置、数据库与 API 变更。即便是补丁版本升级也应先备份 —— 版本号本身不构成兼容性保证。

---

## 安全与合规使用

本项目是面向安全研究人员、渗透测试工程师与 IT 从业者的专业安全测试平台，**仅限在取得明确授权的前提下**开展安全评估。

**使用本软件即表示你同意：**

- 仅对你持有明确书面授权的系统进行测试
- 遵守所有适用的法律法规与职业准则
- 对任何未授权或不当使用承担全部责任

WebShell、C2、凭证攻击与后渗透工具等高风险能力均受到显式配置与 RBAC 的双重管控。请将控制台绑定在 `127.0.0.1` 或可信网络内，并在启用前阅读[安全模型](docs/zh-CN/security-model.md)。

漏洞上报与加固建议请参见 [SECURITY.md](SECURITY.md)。

---

## 许可与署名

本项目基于 **Apache License 2.0** 许可发布，完整条款见 [LICENSE](LICENSE)。

ZREstrikeAI 是基于 [CyberStrikeAI](https://github.com/Ed1s0nZ/CyberStrikeAI)（同为 Apache-2.0 许可）的衍生作品，由 [@1276486](https://github.com/1276486) 进行重命名、重构与功能扩展。依据 Apache-2.0 第 4 条，原始版权、专利、商标及署名声明均原样保留。

文中提及的第三方工具名称归各自所有者所有。

---

## 贡献

欢迎提交 Issue 与 Pull Request。涉及较大改动时，建议先开 Issue 讨论方案后再动手实现。
