# Playwright Browser MCP — Always Prefer for Browser Work

This rule applies to **every session**. Browser control goes through **Playwright MCP** (`@playwright/mcp`), registered on this platform as the external MCP server `playwright`（工具名形如 `playwright::browser_navigate`）。

## Mandatory tool routing

Whenever the user asks to do any of the following, **do not** use shell/`npx playwright` scripts, raw Chrome CDP hacks, or built-in `web_fetch`/`open_page` as a substitute for interactive control:

- open / control a real browser
- click, type, scroll, fill forms, submit
- take page snapshots / screenshots of a live UI
- verify UI after code changes
- navigate multi-step web flows
- extract content that needs JS rendering or authenticated pages
- generate PDF from a page
- run browser-based QA / smoke checks

**Always:**

1. Call `tool_search` with query like `playwright browser navigate snapshot click` (or the needed action) first.
2. 用 `tool_search` 返回的完整工具名直接调用，例如 `playwright::browser_navigate`、`playwright::browser_snapshot`、`playwright::browser_click`。
3. Prefer **accessibility snapshots** over screenshots when understanding page structure; use vision/screenshot tools when visual verification is required.
4. Keep the browser session open across multi-step tasks; do not relaunch unnecessarily.

## When NOT to use Playwright MCP

- Pure static HTTP fetch of a public URL with no interaction → built-in `web_fetch` / `web_search` is fine.
- Local file edits, git, terminal, code analysis → built-in tools only.
- The `playwright` MCP server is disabled or `tool_search` returns no playwright tools → report that clearly and fall back.

## Auto-invocation checklist

Before answering browser-related requests with only text or shell:

- [ ] Did I `tool_search` for playwright?
- [ ] Did I use `playwright::*` tools for actual control?
- [ ] Did I avoid inventing bash one-liners to drive the browser?

If any checkbox fails and the task needs a real browser, **stop and call the MCP**.

## Session expectation

Playwright MCP is **always enabled** in `config.yaml` 的 `external_mcp.servers.playwright`. Treat it as a first-class tool path, not an optional plugin the user must re-enable each time.

## 双槽并发（本平台特有）

启动器 `bin/playwright-dual-slot.mjs` 维护**两个** Chromium 槽位（CDP 9222 / 9223），**一个会话占一个**：

- 先启动的会话拿 9222，后启动的拿 9223；**两个槽位各自独立**，不要代理、不要抢占另一个槽位的浏览器。
- 两个槽位都忙时会话会起不来（退出码 2）。此时先关掉另一个 Playwright 会话再重试，不要 kill 别人的浏览器。
- 浏览器**常驻**：会话结束后 Chromium 仍留在槽位上，下次直接复用；启动器只在**本槽位 CDP 不在线**时才拉起新实例，从不杀已有浏览器。

## 截图 / 文件落盘位置

`browser_take_screenshot`、`browser_pdf_save` 等写文件的工具**只能写到工作目录下的 `.playwright-mcp/`**，写绝对路径（如 `/tmp/x.png`）会被拒：`File access denied: ... is outside allowed roots`。**用相对文件名**，例如 `filename: "shot.png"`。

