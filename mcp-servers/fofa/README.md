# FOFA 资产测绘 MCP

通过 External MCP 给平台加上 FOFA 资产搜索能力：按域名 / IP / 端口 / 主机名 / 网页内容 / 图标哈希 / ICP / 状态码组合查询，**三个 FOFA 账号自动轮换**——主号遇到 429、`820041`、请求频繁或当日上限时自动切到 backup，再切 backup2。

本目录来自上游 [hnking-star/fofa_MCP](https://github.com/hnking-star/fofa_MCP)（MIT），三账号轮换逻辑位于 `_account_list()` / `_is_rate_limited()` / `_exhausted`。

## 工具

| 工具 | 说明 |
|------|------|
| `get_alerts` | FOFA 资产搜索。参数：`domain` / `ip` / `port` / `host` / `body` / `icon_hash` / `icp` / `status_code`（默认 200，传空串取消该条件）。至少给一个条件。 |

工具在平台内的完整调用名是 `fofa::get_alerts`。

### 三账号轮换

`fofa.py` 按 `主号 → backup → backup2` 顺序尝试，被限流的账号记入会话内的 `_exhausted` 集合、排到队尾。返回结果里的 `account_used` 告诉你这次用的是哪个号，`account_tried` 列出这次试过的所有号。

## 依赖

- Python 3.10+
- `httpx`、`python-dotenv`、`mcp`（见 `requirements.txt`）

## 安装

```bash
cd mcp-servers/fofa
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 配置

Key 有**两个**可放的位置，二选一（`fofa.py` 先读环境变量，再读 `.env`）：

1. **推荐**：`config.yaml` 的 `external_mcp.servers.fofa.env`，用环境变量展开避免明文入库：

```yaml
    fofa:
      type: stdio
      command: /绝对路径/mcp-servers/fofa/.venv/bin/python
      args: [/绝对路径/mcp-servers/fofa/fofa.py]
      env:
        FOFA_EMAIL: "${FOFA_EMAIL:-}"
        FOFA_KEY: "${FOFA_KEY:-}"
        FOFA_KEY_BACKUP: "${FOFA_KEY_BACKUP:-}"
        FOFA_KEY_BACKUP2: "${FOFA_KEY_BACKUP2:-}"
      description: "FOFA 资产测绘（三账号限流自动轮换）"
      external_mcp_enable: true
```

2. 或复制 `.env.example` 为 `.env` 直接填。

**主号需要 `email` + `key`；backup 类账号通常只传 `key` 即可。**

> 改完 env 需要重启平台（或重启该 MCP）才会进进程。

## 在平台里启用

1. **设置 → 外部 MCP**（或直接编辑 `config.yaml` 的 `external_mcp.servers`）
2. 粘贴上面的配置，把路径换成你的实际绝对路径
3. 保存后点 **启动**，`get_alerts` 即出现在对话的工具列表里

## 安全提示

- API Key 只放 `config.yaml` 或 `.env`，**不要**写进提示词、技能文件或对话
- 遵守 FOFA API 使用条款；仅对授权范围内目标使用
- 三个账号都限流时不要空转重试，转去挖已经入库的资产

## 许可

[MIT License](https://github.com/hnking-star/fofa_MCP)
