#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
selftest.py — 桥 MCP stdio 注册自检（不依赖平台在线）

通过一次完整的 MCP initialize / initialized / tools-list 握手，确认
cyberstrike_mcp.py 能被 mcp SDK 正常拉起并注册全部工具。用于 run-all.sh
在启动 dsh 前做快速健康检查。

用法：
  python3 bridge/selftest.py          # 使用同目录 venv 即可
  退出码 0 = 通过；非 0 = 失败
"""

import json
import os
import select
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BRIDGE = os.path.join(HERE, "cyberstrike_mcp.py")
PY = sys.executable


def main() -> int:
    env = dict(os.environ)
    env.setdefault("ZRE_API_BASE", "http://127.0.0.1:8080/api")
    env.setdefault("ZRE_USERNAME", "admin")
    env.setdefault("ZRE_PASSWORD", "")

    proc = subprocess.Popen(
        [PY, BRIDGE], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, env=env, cwd=HERE,
    )

    def send(msg: dict) -> None:
        assert proc.stdin is not None
        proc.stdin.write(json.dumps(msg).encode() + b"\n")
        proc.stdin.flush()

    def recv(timeout: float = 15.0):
        assert proc.stdout is not None
        ready, _, _ = select.select([proc.stdout], [], [], timeout)
        if not ready:
            return None
        line = proc.stdout.readline()
        return json.loads(line) if line else None

    try:
        send({"jsonrpc": "2.0", "id": 1, "method": "initialize",
              "params": {"protocolVersion": "2024-11-05", "capabilities": {},
                         "clientInfo": {"name": "zre-selftest", "version": "1.0"}}})
        init = recv()
        if not init or "result" not in init:
            err = proc.stderr.read().decode("utf-8", "replace")[-1500:]
            print(f"FAIL initialize: {json.dumps(init, ensure_ascii=False)[:200]}\nstderr: {err}")
            return 1
        send({"jsonrpc": "2.0", "method": "notifications/initialized"})
        send({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
        listed = recv()
        if not listed:
            err = proc.stderr.read().decode("utf-8", "replace")[-1500:]
            print(f"FAIL tools/list: 无响应\nstderr: {err}")
            return 1
        tools = listed.get("result", {}).get("tools", [])
        names = sorted(t["name"] for t in tools)
        expected = {"project_list", "project_create", "asset_search", "asset_add",
                    "vuln_record", "vuln_search", "conversation_get", "platform_status"}
        print(f"OK  tools/list: {len(tools)} 个 → {', '.join(names)}")
        missing = expected - set(names)
        if missing:
            print(f"FAIL 缺少工具: {sorted(missing)}")
            return 2
        return 0
    finally:
        try:
            proc.terminate()
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())
