/* ============================================================================
 * ZREstrikeAI - Layout v2 Navigation Logic
 * Discord/Slack风格的三栏导航系统
 *
 * icon 字段是 nav-icons.js 里的图标名（不再是 emoji）——黑白主题下 emoji 是
 * 屏幕上唯一的彩色块，观感很跳，统一换成单色线性图标。
 * ========================================================================== */

// 导航类别定义
const navigationCategories = {
    workbench: {
        title: '工作台',
        items: [
            { page: 'dashboard', label: '仪表盘', icon: 'dashboard' },
            { page: 'chat', label: '对话', icon: 'chat' },
            { page: 'dsh', label: 'DSH AI 对话', icon: 'dsh' },
            { page: 'hitl', label: '人机协同', icon: 'hitl' }
        ]
    },
    security: {
        title: '安全作业',
        items: [
            { page: 'projects', label: '项目管理', icon: 'projects' },
            { page: 'asset-overview', label: '资产概览', icon: 'asset-overview' },
            { page: 'asset-library', label: '资产库', icon: 'asset-library' },
            { page: 'info-collect', label: '信息收集', icon: 'info-collect' },
            { page: 'vulnerabilities', label: '漏洞管理', icon: 'vulnerabilities' },
            { page: 'tasks', label: '任务管理', icon: 'tasks' },
            { page: 'workflows', label: '工作流', icon: 'workflows' },
            { page: 'webshell', label: 'WebShell管理', icon: 'webshell' },
            { page: 'chat-files', label: '对话文件', icon: 'chat-files' },
            {
                label: 'C2管理',
                icon: 'c2',
                submenu: [
                    { page: 'c2-listeners', label: 'Listeners', icon: 'c2-listeners' },
                    { page: 'c2-sessions', label: 'Sessions', icon: 'c2-sessions' },
                    { page: 'c2-tasks', label: 'Tasks', icon: 'c2-tasks' },
                    { page: 'c2-payloads', label: 'Payloads', icon: 'c2-payloads' },
                    { page: 'c2-events', label: 'Events', icon: 'c2-events' },
                    { page: 'c2-profiles', label: 'Profiles', icon: 'c2-profiles' }
                ]
            }
        ]
    },
    tools: {
        title: '工具中心',
        items: [
            {
                label: 'MCP工具',
                icon: 'mcp',
                submenu: [
                    { page: 'mcp-monitor', label: 'MCP状态监控', icon: 'mcp-monitor' },
                    { page: 'mcp-management', label: 'MCP管理', icon: 'mcp-management' }
                ]
            },
            {
                label: 'Skills技能',
                icon: 'skills',
                submenu: [
                    { page: 'skills-monitor', label: 'Skills监控', icon: 'skills-monitor' },
                    { page: 'skills-management', label: 'Skills管理', icon: 'skills-management' }
                ]
            },
            { page: 'agents-management', label: 'Agents管理', icon: 'agents-management' },
            {
                label: '知识库',
                icon: 'knowledge',
                submenu: [
                    { page: 'knowledge-management', label: '知识管理', icon: 'knowledge-management' },
                    { page: 'knowledge-retrieval-logs', label: '检索日志', icon: 'knowledge-retrieval-logs' }
                ]
            }
        ]
    },
    system: {
        title: '系统设置',
        items: [
            { page: 'settings', label: '配置', icon: 'settings' },
            { page: 'roles-management', label: '角色管理', icon: 'roles-management' },
            { page: 'platform-rbac', label: '平台RBAC', icon: 'platform-rbac' },
            { page: 'audit', label: '日志审计', icon: 'audit' }
        ]
    }
};

// 当前激活的类别
let currentCategory = 'workbench';

// 切换类别
function switchCategory(category) {
    if (!navigationCategories[category]) return;

    currentCategory = category;

    // 更新图标侧边栏激活状态
    document.querySelectorAll('.icon-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });

    // 更新内容侧边栏
    updateContextSidebar(category);
}

// 渲染单色线性图标；nav-icons.js 未加载时退化为占位方块，避免布局塌陷
function renderNavIcon(name, size) {
    if (typeof window.navIcon === 'function') {
        const svg = window.navIcon(name, size || 18);
        if (svg) {
            return `<span class="context-item-icon">${svg}</span>`;
        }
    }
    return '<span class="context-item-icon context-item-icon--fallback"></span>';
}

// 更新内容侧边栏
function updateContextSidebar(category) {
    const categoryData = navigationCategories[category];
    const contextTitle = document.getElementById('context-title');
    const contextNav = document.getElementById('context-sidebar-nav');

    if (!contextTitle || !contextNav) return;

    // 更新标题
    contextTitle.textContent = categoryData.title;

    // 清空并重建导航项
    contextNav.innerHTML = '';

    categoryData.items.forEach(item => {
        if (item.submenu) {
            // 有子菜单的项：父项负责展开/收起，子项负责跳转
            const itemEl = document.createElement('div');
            itemEl.className = 'context-item context-item-group';
            itemEl.innerHTML = renderNavIcon(item.icon, 18) +
                `<span class="context-item-label">${item.label}</span>` +
                `<span class="context-item-caret">▾</span>`;
            contextNav.appendChild(itemEl);

            // 添加子菜单（默认展开）
            const submenu = document.createElement('div');
            submenu.className = 'context-submenu';
            item.submenu.forEach(subitem => {
                const subEl = document.createElement('div');
                subEl.className = 'context-submenu-item';
                subEl.dataset.page = subitem.page;
                subEl.innerHTML = renderNavIcon(subitem.icon, 15) +
                    `<span class="context-item-label">${subitem.label}</span>`;
                subEl.onclick = () => switchPage(subitem.page);
                submenu.appendChild(subEl);
            });
            contextNav.appendChild(submenu);

            itemEl.onclick = () => {
                const collapsed = submenu.classList.toggle('collapsed');
                itemEl.classList.toggle('collapsed', collapsed);
            };
        } else {
            // 普通导航项
            const itemEl = document.createElement('div');
            itemEl.className = 'context-item';
            itemEl.dataset.page = item.page;
            itemEl.innerHTML = renderNavIcon(item.icon, 18) +
                `<span class="context-item-label">${item.label}</span>`;
            itemEl.onclick = () => switchPage(item.page);
            contextNav.appendChild(itemEl);
        }
    });
}

// 更新当前页面的激活状态
function updateContextActivePage(pageId) {
    document.querySelectorAll('.context-item, .context-submenu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
            // 命中的子项若处于收起的分组内，自动展开
            const submenu = item.closest('.context-submenu');
            if (submenu && submenu.classList.contains('collapsed')) {
                submenu.classList.remove('collapsed');
                submenu.previousElementSibling?.classList.remove('collapsed');
            }
        }
    });
}

// 初始化新布局
function initLayoutV2() {
    // 默认加载工作台类别
    switchCategory('workbench');

    // 监听页面切换，更新激活状态
    const originalSwitchPage = window.switchPage;
    if (originalSwitchPage) {
        window.switchPage = function(pageId) {
            originalSwitchPage(pageId);
            updateContextActivePage(pageId);
        };
    }
}

// 暴露函数到全局
window.switchCategory = switchCategory;
window.updateContextSidebar = updateContextSidebar;
window.updateContextActivePage = updateContextActivePage;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayoutV2);
} else {
    initLayoutV2();
}
