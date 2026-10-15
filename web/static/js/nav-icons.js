/* ============================================================================
 * ZREstrikeAI - 导航图标集（单色线性图标）
 *
 * 统一的线性图标：24×24 viewBox、fill=none、stroke=currentColor、1.75 描边。
 * 颜色完全由 CSS 的 color 决定，因此浅色/暗色主题下自动跟随 --text-*。
 * 原先导航用 emoji（📊🔧🎯…）承载图标，在黑白主题里是唯一的彩色块，观感很跳，
 * 这里整体换掉。
 *
 * 用法：
 *   navIcon('dashboard')            -> '<svg …>…</svg>'
 *   navIcon('dashboard', 16)        -> 指定像素尺寸
 *   navIcon('dashboard', 16, 'extra-class')
 * ========================================================================== */
(function () {
    'use strict';

    // 每个条目只存路径，外层 <svg> 由 navIcon() 统一包裹，保证风格一致
    var PATHS = {
        // ---------------------------------------------------------- 类别（图标侧栏）
        workbench: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18"/><path d="M9.5 9v12"/>',
        security: '<path d="M12 22s8-4 8-10V5.5a1 1 0 0 0-.68-.95l-7-2.4a1 1 0 0 0-.64 0l-7 2.4A1 1 0 0 0 4 5.5V12c0 6 8 10 8 10z"/><path d="M9.5 12.2l1.9 1.9 3.6-4"/>',
        tools: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
        system: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5a1 1 0 0 1 1 .93l.1 1.5a7.6 7.6 0 0 1 2 1.16l1.32-.72a1 1 0 0 1 1.31.28l.6 1a1 1 0 0 1-.24 1.33l-1.18.95a7.7 7.7 0 0 1 0 2.32l1.18.95a1 1 0 0 1 .24 1.33l-.6 1a1 1 0 0 1-1.31.28l-1.32-.72a7.6 7.6 0 0 1-2 1.16l-.1 1.5a1 1 0 0 1-1 .93h-.01a1 1 0 0 1-1-.93l-.1-1.5a7.6 7.6 0 0 1-2-1.16l-1.32.72a1 1 0 0 1-1.31-.28l-.6-1a1 1 0 0 1 .24-1.33l1.18-.95a7.7 7.7 0 0 1 0-2.32l-1.18-.95a1 1 0 0 1-.24-1.33l.6-1a1 1 0 0 1 1.31-.28l1.32.72a7.6 7.6 0 0 1 2-1.16l.1-1.5A1 1 0 0 1 12 2.5z"/>',

        // ---------------------------------------------------------- 工作台
        dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
        chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.4-.66L3 21l1.76-5.1A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
        dsh: '<path d="M12 3l1.85 5.65a2 2 0 0 0 1.28 1.28L20.8 11.8l-5.67 1.87a2 2 0 0 0-1.28 1.28L12 20.6l-1.85-5.65a2 2 0 0 0-1.28-1.28L3.2 11.8l5.67-1.87a2 2 0 0 0 1.28-1.28z"/><path d="M18.5 3.2v2.6M17.2 4.5h2.6"/>',
        hitl: '<path d="M16 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.7v1.8"/><circle cx="9.5" cy="7.5" r="3.6"/><path d="M15.6 11.3l1.9 1.9 4-4.2"/>',

        // ---------------------------------------------------------- 安全作业
        projects: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M16 20.5V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v15.5"/>',
        'asset-overview': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 3.6 9A14 14 0 0 1 12 21a14 14 0 0 1-3.6-9A14 14 0 0 1 12 3z"/>',
        'asset-library': '<ellipse cx="12" cy="5.5" rx="8.5" ry="3"/><path d="M20.5 12c0 1.66-3.8 3-8.5 3s-8.5-1.34-8.5-3"/><path d="M3.5 5.5v13c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3v-13"/>',
        'info-collect': '<circle cx="10.5" cy="10.5" r="7"/><path d="M20.5 20.5l-5-5"/>',
        vulnerabilities: '<path d="M12 21.5s7.5-3.6 7.5-9.3V5.6a1 1 0 0 0-.68-.95l-6.5-2.2a1 1 0 0 0-.64 0l-6.5 2.2a1 1 0 0 0-.68.95v6.6c0 5.7 7.5 9.3 7.5 9.3z"/><path d="M12 8.6v4"/><path d="M12 15.8h.01"/>',
        tasks: '<path d="M9 11.2l3 3L21.5 4.5"/><path d="M20.5 12.4v6.1a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2h11"/>',
        workflows: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><path d="M6.75 10.5v4.75a2 2 0 0 0 2 2h4.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
        webshell: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M7 10l2.5 2L7 14"/><path d="M12.5 14.5h4.5"/>',
        'chat-files': '<path d="M20.5 18.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4.5l2 2.6h6.5a2 2 0 0 1 2 2z"/>',
        c2: '<circle cx="12" cy="12" r="9"/><path d="M12 2.5v4M12 17.5v4M21.5 12h-4M6.5 12h-4"/><circle cx="12" cy="12" r="2.5"/>',

        // C2 子项
        'c2-listeners': '<path d="M5 19a9.5 9.5 0 0 1 0-14"/><path d="M8 16a5.7 5.7 0 0 1 0-8"/><circle cx="12" cy="12" r="2"/><path d="M19 5a9.5 9.5 0 0 1 0 14"/><path d="M16 8a5.7 5.7 0 0 1 0 8"/>',
        'c2-sessions': '<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
        'c2-tasks': '<path d="M22 12h-4l-3 8.5L9 3.5 6 12H2"/>',
        'c2-payloads': '<path d="M20.5 8a2 2 0 0 0-1-1.73l-6.7-3.83a2 2 0 0 0-2 0L4.1 6.27A2 2 0 0 0 3 8v7.8a2 2 0 0 0 1 1.73l6.8 3.83a2 2 0 0 0 2 0l6.7-3.83a2 2 0 0 0 1-1.73z"/><path d="M3.4 7.2L12 12l8.6-4.8"/><path d="M12 21.5V12"/>',
        'c2-events': '<path d="M8.5 6.5H21M8.5 12H21M8.5 17.5H21"/><path d="M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01"/>',
        'c2-profiles': '<path d="M5 21v-6M5 11V3M12 21v-8M12 9V3M19 21v-4M19 13V3"/><path d="M2.5 13.5h5M9.5 8.5h5M16.5 15.5h5"/>',

        // ---------------------------------------------------------- 工具中心
        mcp: '<rect x="2.5" y="2.5" width="19" height="7.5" rx="2"/><rect x="2.5" y="14" width="19" height="7.5" rx="2"/><path d="M6.5 6.25h.01M6.5 17.75h.01"/>',
        'mcp-monitor': '<circle cx="12" cy="12" r="9"/><path d="M6.5 12h2.3l1.3-2.9 2.2 5.8 1.4-2.9h3.8"/>',
        'mcp-management': '<rect x="2.5" y="2.5" width="19" height="7.5" rx="2"/><rect x="2.5" y="14" width="10.5" height="7.5" rx="2"/><circle cx="18" cy="17.75" r="3.6"/><path d="M18 16.1v3.3M16.35 17.75h3.3"/>',
        skills: '<path d="M13 2.5L4 13.5h7l-1 8 9-11h-7z"/>',
        'skills-monitor': '<path d="M6.5 20.5V12M12 20.5V4.5M17.5 20.5v-5.5"/>',
        'skills-management': '<rect x="2.5" y="5" width="19" height="5.5" rx="2.75"/><circle cx="17" cy="7.75" r="1.7"/><rect x="2.5" y="13.5" width="19" height="5.5" rx="2.75"/><circle cx="7" cy="16.25" r="1.7"/>',
        'agents-management': '<rect x="5" y="5" width="14" height="14" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9.5 2v3M14.5 2v3M9.5 19v3M14.5 19v3M19 9.5h3M19 14.5h3M2 9.5h3M2 14.5h3"/>',
        knowledge: '<path d="M4 19.2A2.7 2.7 0 0 1 6.7 16.5H20"/><path d="M6.7 2.5H20v19H6.7A2.7 2.7 0 0 1 4 18.8V5.2a2.7 2.7 0 0 1 2.7-2.7z"/>',
        'knowledge-management': '<path d="M12 6.5S10 4 6.5 4A3.5 3.5 0 0 0 3 7.5v10.4a1 1 0 0 0 1 1 4.5 4.5 0 0 1 4 2 4.5 4.5 0 0 1 4-2 1 1 0 0 0 1-1V7.5a3.5 3.5 0 0 0-1-2.5"/><path d="M12 6.5S14 4 17.5 4A3.5 3.5 0 0 1 21 7.5v10.4a1 1 0 0 1-1 1 4.5 4.5 0 0 0-4 2 4.5 4.5 0 0 0-4-2 1 1 0 0 1-1-1V7.5a3.5 3.5 0 0 1 1-2.5"/>',
        'knowledge-retrieval-logs': '<circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2"/>',

        // ---------------------------------------------------------- 系统设置
        settings: '<path d="M3 6.5h4M11 6.5h10M3 12h7M14 12h7M3 17.5h6.5M13.5 17.5h7.5"/><circle cx="9" cy="6.5" r="2"/><circle cx="12.5" cy="12" r="2"/><circle cx="11.5" cy="17.5" r="2"/>',
        'roles-management': '<path d="M15.5 20.5v-1.8a3.8 3.8 0 0 0-3.8-3.8H6.3a3.8 3.8 0 0 0-3.8 3.8v1.8"/><circle cx="9" cy="7.6" r="3.8"/><path d="M21.5 20.5v-1.8a3.8 3.8 0 0 0-2.85-3.68"/><path d="M15.5 3.9a3.8 3.8 0 0 1 0 7.4"/>',
        'platform-rbac': '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.6L20.5 2.6"/><path d="M15.5 7.6l2.2 2.2M18.3 4.8l2.2 2.2"/>',
        audit: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5"/><path d="M15.5 13H8.5M15.5 17H8.5"/>'
    };

    /**
     * 取图标的 SVG 字符串。
     * @param {string} name  图标名（见 PATHS）
     * @param {number} [size] 像素尺寸，默认 20
     * @param {string} [extraClass] 追加到 svg 上的类名
     * @returns {string} 未知名称返回空字符串（调用方可据此回退）
     */
    function navIcon(name, size, extraClass) {
        var body = PATHS[name];
        if (!body) {
            return '';
        }
        var px = size || 20;
        var cls = 'nav-icon' + (extraClass ? ' ' + extraClass : '');
        return '<svg class="' + cls + '" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" ' +
            'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
    }

    window.navIcon = navIcon;
    window.NAV_ICONS = PATHS;
})();
