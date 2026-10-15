# ZREstrikeAI UI Redesign Plan - Discord/Slack Style Layout

## Goal
Transform the current left-sidebar layout into a modern Discord/Slack-style triple-pane layout with:
- Narrow icon-only left sidebar (64px)
- Secondary context sidebar (200-240px) 
- Main content area
- Optional right details panel

## Current Architecture Analysis

### HTML Structure
- **Container**: `.container` with header + `.main-layout`
- **Main Layout**: Flex container with `.main-sidebar` + `.content-area`
- **Sidebar**: 224px wide, collapsible to 64px, contains navigation items
- **Navigation**: Hierarchical menu with icons, labels, and submenus

### CSS Key Points
- Black/white theme already applied
- Flexbox-based layout
- Responsive sidebar collapse functionality exists
- Navigation items styled in `style.css` (~46k lines)

### JavaScript Behavior
- `router.js`: Page switching via `switchPage(pageId)`
- `toggleSidebar()`: Collapse functionality
- Navigation state management in place

## Proposed Implementation

### Phase 1: Icon Sidebar (Left - 64px)
**Purpose**: Primary navigation with icon-only buttons

**Structure**:
```html
<aside class="icon-sidebar">
  <div class="icon-sidebar-brand">ZRE</div>
  <nav class="icon-sidebar-nav">
    <button class="icon-nav-item active" data-category="workbench">🏠</button>
    <button class="icon-nav-item" data-category="security">🎯</button>
    <button class="icon-nav-item" data-category="tools">🔧</button>
    <button class="icon-nav-item" data-category="settings">⚙️</button>
  </nav>
</aside>
```

**Categories**:
- Workbench (Dashboard, Chat, DSH, HITL)
- Security Operations (Projects, Assets, Vulnerabilities, Tasks)
- Tools (MCP, Skills, Agents, Knowledge, C2)
- System (Settings, Roles, Audit)

### Phase 2: Context Sidebar (Secondary - 240px)
**Purpose**: Show items relevant to selected icon category

**Structure**:
```html
<aside class="context-sidebar">
  <div class="context-sidebar-header">
    <h2 class="context-title">Workbench</h2>
    <input type="search" placeholder="Search...">
  </div>
  <nav class="context-sidebar-nav">
    <!-- Dynamic content based on icon selection -->
    <div class="context-item">Dashboard</div>
    <div class="context-item active">Chat</div>
    <div class="context-item">Projects</div>
  </nav>
</aside>
```

### Phase 3: Main Content Area
**Purpose**: Display selected page content (unchanged structure, updated styling)

Keep existing page content but update wrapper styles for the new layout.

### Phase 4: Details Panel (Optional Right - 300px)
**Purpose**: Show contextual information, recent activity, properties

**Structure**:
```html
<aside class="details-panel">
  <div class="details-header">Details</div>
  <div class="details-content">
    <!-- Context-specific info -->
  </div>
</aside>
```

## Implementation Steps

### Step 1: Create New Layout Structure
1. Add `icon-sidebar` before existing `main-sidebar`
2. Convert `main-sidebar` to `context-sidebar` 
3. Add `details-panel` after `content-area`
4. Update `.main-layout` flex structure

### Step 2: Update CSS
**File**: `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/static/css/style.css`

Key changes:
- `.main-layout`: Change to 3-4 column grid
- `.icon-sidebar`: Fixed 64px, vertical icon buttons
- `.context-sidebar`: Rename from `.main-sidebar`, adjust width
- `.details-panel`: New right panel, collapsible
- Update navigation styles for new hierarchy

### Step 3: Update JavaScript
**File**: `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/static/js/router.js`

New functions:
- `switchCategory(category)`: Handle icon sidebar clicks
- `updateContextSidebar(category)`: Populate secondary sidebar
- `toggleDetailsPanel()`: Show/hide right panel
- Update `switchPage()` to work with new structure

### Step 4: Reorganize Navigation Items
Group existing navigation items into categories:

**Workbench** (🏠):
- Dashboard
- Chat
- DSH AI
- HITL

**Security Ops** (🎯):
- Projects
- Assets (with submenu)
- Vulnerabilities
- Tasks
- Workflows
- WebShell
- C2 (with submenu)
- Files

**Tools** (🔧):
- MCP (with submenu)
- Skills (with submenu)
- Agents
- Knowledge (with submenu)

**System** (⚙️):
- Settings
- Roles
- Platform RBAC
- Audit

### Step 5: Update HTML Template
**File**: `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/templates/index.html`

1. Insert icon sidebar structure
2. Modify existing sidebar to context sidebar
3. Add details panel
4. Update header if needed

## CSS Implementation Details

### Icon Sidebar Styles
```css
.icon-sidebar {
  width: 64px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.icon-nav-item {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-nav-item.active {
  background: var(--accent-color);
  color: var(--bg-primary);
}
```

### Context Sidebar Styles
```css
.context-sidebar {
  width: 240px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.context-item {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 6px;
  margin: 0 8px;
  transition: background 0.2s;
}

.context-item:hover {
  background: var(--bg-tertiary);
}

.context-item.active {
  background: var(--bg-tertiary);
  font-weight: 600;
}
```

### Main Layout Grid
```css
.main-layout {
  display: grid;
  grid-template-columns: 64px 240px 1fr;
  /* Optional 4th column: 300px for details panel */
}

.main-layout.with-details {
  grid-template-columns: 64px 240px 1fr 300px;
}
```

## Benefits of This Approach

1. **Unique Identity**: Completely different from CyberStrike's single sidebar
2. **Better Organization**: Categorical grouping reduces visual clutter
3. **Modern UX**: Follows Discord/Slack/Figma patterns users know
4. **Scalable**: Easy to add new features to appropriate categories
5. **Black/White Theme**: Clean, professional look already applied

## Rollback Plan

If issues arise, we can:
1. Keep both layouts with a toggle
2. Revert HTML changes (sidebar structure is modular)
3. CSS is additive, old styles remain

## Testing Checklist

- [ ] All navigation items accessible
- [ ] Page switching works correctly
- [ ] Sidebar collapse/expand functional
- [ ] Responsive behavior on smaller screens
- [ ] Theme (light/dark) applies correctly
- [ ] No JavaScript errors in console
- [ ] All submenus work properly
- [ ] Search functionality (if added) works

## Files to Modify

1. `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/templates/index.html` - Structure
2. `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/static/css/style.css` - Styling
3. `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/static/js/router.js` - Navigation logic
4. Optionally create new file: `/home/kali/claude/work/ZREredAI/ZREstrikeAI/web/static/css/layout-v2.css` for cleaner separation

## Estimated Changes

- HTML: ~200 lines of restructuring
- CSS: ~500-800 lines new/modified
- JavaScript: ~150-250 lines new functions

Total: ~1000 lines of changes, mostly additive
