#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cyberstrike_mcp.py — ZREstrikeAI 落库桥（stdio MCP 服务）

作用：把 dsh（DeepSeek Harness）会话里 AI 确认的 资产 / 漏洞 / 项目 / 会话，
经 ZREstrikeAI 平台自身的 REST API 落库，使 dsh 侧的发现回流到平台「项目管理 /
资产库 / 漏洞管理」，与平台内建的 Eino #chat 侧产生的结果同库可查。

设计（对照 DesRedTeam 二开 kit 里的 mcp/pentrack，但针对本项目 API 自研）：
  * 纯 stdlib HTTP（urllib），除 `mcp` Python SDK 外无第三方依赖；
  * 登录态自动维护：首次调用时用 ZRE_USERNAME/ZRE_PASSWORD 登录取 Bearer token，
    401 时自动重登重试一次；
  * 所有写操作都通过平台原生的 RBAC / HITL 边界（admin 会话），与 #chat 一致。

用法：
  export ZRE_API_BASE=http://127.0.0.1:8080/api
  export ZRE_USERNAME=admin
  export ZRE_PASSWORD=xxxxxxxx
  python3 bridge/cyberstrike_mcp.py          # stdio（供 dsh - insert mcp-cyberstrike 使用）

参数（也可用命令行覆盖环境变量）：
  --base-url / --username / --password / --conversation-title

落库纪律（presets/agent 侧配合）：
  只有用户在会话中确认的发现才写库；写库前先 asset_search 去重、project_list 找到归属项目。
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

try:
    from mcp.server.mcpserver import MCPServer as FastMCP
except Exception:  # pragma: no cover
    sys.stderr.write(
        "缺少 mcp Python SDK（pip install mcp>=2.0 或复用 hexstrike venv）\n"
    )
    sys.exit(1)


# --------------------------------------------------------------------------- #
# 配置
# --------------------------------------------------------------------------- #

DEFAULT_BASE = os.environ.get("ZRE_API_BASE", "http://127.0.0.1:8080/api")
DEFAULT_USER = os.environ.get("ZRE_USERNAME", "admin")
DEFAULT_PASS = os.environ.get("ZRE_PASSWORD", "")
# dsh 会话未提供 conversation_id 时，落库复用的后台会话标题
DEFAULT_CONV_TITLE = "DSH 落库会话（自动）"


def parse_args(argv=None) -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="ZREstrikeAI 落库桥 stdio MCP")
    ap.add_argument("--base-url", default=DEFAULT_BASE)
    ap.add_argument("--username", default=DEFAULT_USER)
    ap.add_argument("--password", default=DEFAULT_PASS)
    ap.add_argument("--conversation-title", default=DEFAULT_CONV_TITLE)
    ap.add_argument("--transport", default="stdio", choices=["stdio"])
    return ap.parse_args(argv)


ARGS = parse_args()

# 允许自签名（run.sh 默认 TLS auto self-sign），仅针对 ZRE_API_BASE 的 https
_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE


class PlatformClient:
    """ZREstrikeAI 平台 REST 客户端（Bearer 登录态自动维护）。"""

    def __init__(self, base: str, username: str, password: str, conv_title: str):
        self.base = base.rstrip("/")
        self.username = username
        self.password = password
        self.conv_title = conv_title
        self.token: Optional[str] = None
        self._bg_conversation_id: Optional[str] = None

    # -- HTTP 基元 --------------------------------------------------------- #

    def _open(self, method: str, path: str, body: Any = None,
              query: Optional[Dict[str, Any]] = None, retry: bool = True):
        url = self.base + path
        if query:
            pairs = []
            for k, v in query.items():
                if v is None or v == "":
                    continue
                pairs.append(f"{urllib.parse.quote(k)}={urllib.parse.quote(str(v))}")
            if pairs:
                url += "?" + "&".join(pairs)
        headers = {"Accept": "application/json"}
        data = None
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
                raw = resp.read().decode("utf-8", "replace")
                return resp.status, _parse_json(raw)
        except urllib.error.HTTPError as e:
            detail = _parse_json(e.read().decode("utf-8", "replace"))
            if e.code == 401 and retry and self.token:
                # token 过期：清掉重登一次
                self.token = None
                self._ensure_token()
                return self._open(method, path, body, query, retry=False)
            err = detail.get("error") if isinstance(detail, dict) else detail
            raise ApiError(e.code, err or f"HTTP {e.code} {e.reason}", path)

    def _ensure_token(self):
        if self.token:
            return
        if not self.password:
            raise ApiError(0, "缺少密码：请设置 ZRE_PASSWORD（或用平台控制台重置 admin 密码）")
        status, data = self._open("POST", "/auth/login",
                                  {"username": self.username, "password": self.password},
                                  retry=False)
        token = data.get("token") if isinstance(data, dict) else None
        if not token:
            raise ApiError(status, f"登录失败：{json.dumps(data, ensure_ascii=False)}")
        self.token = token

    # -- 会话 -------------------------------------------------------------- #

    def conversation_ensure(self, title: Optional[str] = None,
                            project_id: Optional[str] = None) -> str:
        """确保返回一个会话 id。带 project_id 时每次新建（与该项目绑定）；否则复用后台会话。"""
        if project_id:
            conv = self.create_conversation(title or f"{self.conv_title} · {project_id}", project_id)
            return conv["id"]
        if self._bg_conversation_id:
            return self._bg_conversation_id
        conv = self.create_conversation(self.conv_title, None)
        self._bg_conversation_id = conv["id"]
        return conv["id"]

    def create_conversation(self, title: str, project_id: Optional[str]) -> dict:
        body: Dict[str, Any] = {"title": title}
        if project_id:
            body["projectId"] = project_id
        _, data = self.request("POST", "/conversations", body=body)
        return data if isinstance(data, dict) else {}

    def request(self, method: str, path: str, body: Any = None,
                query: Optional[Dict[str, Any]] = None) -> tuple:
        self._ensure_token()
        return self._open(method, path, body, query)


class ApiError(Exception):
    def __init__(self, code, message, path=""):
        super().__init__(f"[{code}] {message}" + (f" @ {path}" if path else ""))
        self.code = code


def _parse_json(raw: str):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def _fmt(data: Any, keys: Optional[list] = None) -> str:
    """把 API 返回体收敛成一段可读 JSON，便于 dsh 的模型消费。"""
    return json.dumps(data, ensure_ascii=False, indent=2)


def _trim_list(data: Any, cap: int = 60) -> str:
    if isinstance(data, list) and len(data) > cap:
        head = json.dumps(data[:cap], ensure_ascii=False, indent=2)
        return f"{head}\n…(共 {len(data)} 条，仅展示前 {cap} 条)"
    return _fmt(data)


# --------------------------------------------------------------------------- #
# MCP 服务
# --------------------------------------------------------------------------- #

mcp = FastMCP("zrestrike-bridge")
_client = PlatformClient(ARGS.base_url, ARGS.username, ARGS.password, ARGS.conversation_title)


@mcp.tool()
def platform_status() -> str:
    """检查 ZREstrikeAI 平台连通性与登录态。返回平台在线状态 / 当前用户 / token 有效期。"""
    try:
        status, _ = _client.request("GET", "/auth/validate")
        return _fmt({"ok": status == 200, "base": _client.base, "user": _client.username})
    except ApiError as e:
        return _fmt({"ok": False, "error": str(e)})


@mcp.tool()
def project_list(search: str = "", limit: int = 50) -> str:
    """列出 ZREstrikeAI 平台的项目。search 按名称模糊匹配；limit 上限 500。返回 {projects,total}。"""
    status, data = _client.request("GET", "/projects",
                                   query={"search": search, "limit": min(max(limit, 1), 500)})
    return _fmt(data)


@mcp.tool()
def project_create(name: str, description: str = "") -> str:
    """在 ZREstrikeAI 平台新建项目（授权作业的归属容器）。返回新建项目对象（含 id）。"""
    if not name or not name.strip():
        return _fmt({"error": "name 不能为空"})
    status, data = _client.request("POST", "/projects",
                                   body={"name": name.strip(), "description": description})
    return _fmt(data)


@mcp.tool()
def asset_search(q: str = "", host: str = "", ip: str = "", domain: str = "",
                 project_id: str = "", page: int = 1, page_size: int = 20) -> str:
    """在平台资产库检索资产（写库前去重用）。返回 {assets,total,...}。"""
    status, data = _client.request("GET", "/assets",
                                   query={"q": q, "host": host, "ip": ip, "domain": domain,
                                          "project_id": project_id, "page": page,
                                          "page_size": min(max(page_size, 1), 100)})
    return _fmt(data)


@mcp.tool()
def asset_add(host: str = "", ip: str = "", domain: str = "", port: int = 0,
              protocol: str = "", title: str = "", server: str = "",
              project_id: str = "", tags: str = "", criticality: str = "") -> str:
    """把一条资产写入平台资产库（upsert，按 host/ip/domain 去重）。port 为 0 时不填。
    criticality 取值 critical/high/medium/low/info。tags 用逗号分隔。"""
    asset: Dict[str, Any] = {}
    for k, v in (("host", host), ("ip", ip), ("domain", domain), ("protocol", protocol),
                 ("title", title), ("server", server), ("project_id", project_id),
                 ("criticality", criticality)):
        if v:
            asset[k] = v
    if port:
        asset["port"] = int(port)
    if not (asset.get("host") or asset.get("ip") or asset.get("domain")):
        return _fmt({"error": "host/ip/domain 至少填一个"})
    if tags:
        asset["tags"] = [t.strip() for t in tags.split(",") if t.strip()]
    asset["source"] = "dsh-cyberstrike-bridge"
    status, data = _client.request("POST", "/assets/import",
                                   body={"assets": [asset], "source": "dsh-cyberstrike-bridge"})
    return _fmt(data)


@mcp.tool()
def vuln_record(conversation_id: str = "", project_id: str = "", title: str = "",
                severity: str = "medium", description: str = "", type_: str = "",
                target: str = "", evidence: str = "", reproduction_steps: str = "",
                impact: str = "", recommendation: str = "", status: str = "") -> str:
    """把已确认的漏洞写入平台漏洞库（severity: critical/high/medium/low/info）。
    conversation_id 可留空（桥会自动关联一个后台落库会话）；project_id 建议给出以便归集。
    仅记录用户/方法已验证的漏洞，不做批量灌库。"""
    if not title or not title.strip():
        return _fmt({"error": "title 不能为空"})
    severity = (severity or "medium").lower()
    if severity not in ("critical", "high", "medium", "low", "info"):
        return _fmt({"error": f"severity 非法: {severity}（critical/high/medium/low/info）"})
    try:
        cid = conversation_id or _client.conversation_ensure(project_id=project_id or None)
    except ApiError as e:
        return _fmt({"error": f"获取会话失败：{e}"})
    body: Dict[str, Any] = {
        "conversation_id": cid,
        "project_id": project_id or "",
        "title": title.strip(),
        "severity": severity,
    }
    for src, dst in (("description", "description"), ("type_", "type"),
                     ("target", "target"), ("evidence", "evidence"),
                     ("reproduction_steps", "reproduction_steps"),
                     ("impact", "impact"), ("recommendation", "recommendation"),
                     ("status", "status")):
        val = locals().get(src)
        if val:
            body[dst] = val
    try:
        status, data = _client.request("POST", "/vulnerabilities", body=body)
    except ApiError as e:
        return _fmt({"error": f"写入漏洞失败：{e}"})
    return _fmt(data)


@mcp.tool()
def vuln_search(project_id: str = "", q: str = "", severity: str = "",
                status: str = "", page: int = 1, page_size: int = 20) -> str:
    """检索平台漏洞库（写库前可复查是否已记录）。返回 {vulnerabilities,total,...}。"""
    status, data = _client.request("GET", "/vulnerabilities",
                                   query={"project_id": project_id, "q": q,
                                          "severity": severity, "status": status,
                                          "page": page,
                                          "page_size": min(max(page_size, 1), 100)})
    return _fmt(data)


@mcp.tool()
def conversation_get(conversation_id: str) -> str:
    """读取平台某个会话的详情（消息/项目绑定），用于把 dsh 会话与平台会话对齐、取证或审计。"""
    if not conversation_id:
        return _fmt({"error": "conversation_id 不能为空"})
    status, data = _client.request("GET", f"/conversations/{conversation_id}")
    return _fmt(data)


def main() -> None:
    mcp.run(transport=ARGS.transport)


if __name__ == "__main__":
    main()
