# CS2 道具点位速查网站 - 前端设计

## 概述

CS2 道具点位速查网站前端，2 个页面（登录页 + 主页面），暗夜绿色主题，CS2 简洁风格。

- **框架**：React 18 + Vite + TypeScript
- **UI 库**：Ant Design 5（暗色主题定制）
- **路由**：React Router v6
- **HTTP**：Axios（统一拦截器）

## 页面结构

| 路由 | 页面 | 权限 |
|------|------|------|
| `/login` | 登录页 | 公开 |
| `/` | 主页面 | 需登录 |

## 认证流程

1. 访问 `/` → 检查 localStorage 有无 token
2. 无 token → 重定向 `/login`
3. 登录成功 → 存 token 到 localStorage → 跳转 `/`
4. 401 响应 → 清除 token → 跳转 `/login`
5. 登出 → 调用 `POST /api/auth/logout` → 清除 token → 跳转 `/login`

## 配色方案（暗夜绿色风）

| 用途 | 色值 | 说明 |
|------|------|------|
| 主背景 | `#0d1117` | 页面底色 |
| 卡片/侧边栏 | `#161b22` | 次级背景 |
| 边框 | `#21262d` | 分隔线、卡片边框 |
| 强调色 | `#4ade80` | Logo、选中态、按钮 |
| 主文字 | `#e0e0e0` | 标题、正文 |
| 次文字 | `#8b949e` | 描述、标签、说明文字 |

禁止使用：蓝紫渐变、emoji。

## Ant Design 主题配置

```js
{
  token: {
    colorPrimary: '#4ade80',
    colorBgContainer: '#161b22',
    colorBgLayout: '#0d1117',
    colorBorder: '#21262d',
    colorText: '#e0e0e0',
    colorTextSecondary: '#8b949e',
    borderRadius: 6,
  }
}
```

## 页面设计

### 登录页（居中卡片）

- 居中显示，上方 "脑力学院" Logo + 副标题 "CS2 道具点位速查"
- 下方登录卡片：用户名输入框、密码输入框、登录按钮
- 登录失败显示错误提示

### 主页面

**顶部 Header：**
- 左侧：Logo "脑力学院"
- 右侧：当前用户名 + 登出按钮（带确认气泡）

**左侧 Sidebar（筛选栏）：**
- 地图选择：2 列网格按钮，10 张地图
- 道具类型：2 列网格按钮（烟雾弹/闪光弹/燃烧瓶/手雷）
- 阵营选择：CT / T 两个按钮
- 选中项绿色高亮背景，未选中为边框样式

**右侧内容区（两个视图切换）：**

1. **LineupGrid（卡片网格）**
   - 顶部显示搜索结果数量 "找到 N 个点位"
   - 卡片网格布局（响应式 2-4 列）
   - 每张卡片：缩略图 + 点位名称 + 小标签（阵营/道具类型）
   - hover 时微抬升 + 边框变绿
   - 点击卡片 → 切换到详情视图

2. **LineupDetail（点位详情，页面替换）**
   - 顶部左侧 "< 返回列表" 链接
   - 点位名称 + 标签（地图/阵营/道具类型）
   - 媒体区域：多张图片用 Carousel 轮播，视频直接播放
   - 描述文本
   - 底部辅助信息（坐标、创建者）
   - 点返回 → 回到 LineupGrid，保留筛选状态

## 组件树

```
App
├── LoginPage
│   └── LoginForm
│
└── MainLayout
    ├── Header
    │   ├── Logo "脑力学院"
    │   └── UserArea（用户名 + 登出按钮）
    ├── Sidebar
    │   ├── MapFilter（地图网格）
    │   ├── UtilityFilter（道具类型网格）
    │   └── SideFilter（CT/T）
    └── ContentArea
        ├── LineupGrid
        │   └── LineupCard[]
        └── LineupDetail
            ├── InfoBar（名称 + 标签）
            ├── MediaViewer（图片轮播 / 视频播放）
            └── Description（描述 + 坐标）
```

## 项目结构

```
frontend/
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 路由配置 + 主题 Provider
│   ├── api/
│   │   ├── client.ts           # Axios 实例 + 拦截器（token 注入、401 处理）
│   │   ├── auth.ts             # login / logout / me
│   │   ├── maps.ts             # list maps
│   │   └── lineups.ts          # list / get detail
│   ├── components/
│   │   ├── LoginPage.tsx       # 登录页
│   │   ├── MainLayout.tsx      # 主布局（Header + Sidebar + Content）
│   │   ├── Header.tsx          # 顶部栏
│   │   ├── Sidebar.tsx         # 筛选栏
│   │   ├── LineupGrid.tsx      # 卡片网格
│   │   ├── LineupCard.tsx      # 单个卡片
│   │   └── LineupDetail.tsx    # 点位详情
│   ├── hooks/
│   │   └── useAuth.ts          # 认证状态 + token 管理
│   └── types.ts                # TS 类型定义（对应后端 schema）
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts              # proxy /api → localhost:8000
```

## Vite 代理配置

开发环境代理 API 请求到后端：

```js
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://127.0.0.1:8000',
    '/uploads': 'http://127.0.0.1:8000',
  }
}
```

## 交互细节

- 侧边栏筛选：点击即切换，支持组合筛选（地图 + 道具 + 阵营三个维度）
- 卡片 hover：微抬升（transform: translateY(-2px)）+ 边框变绿
- 详情页返回：左侧文字链接 "< 返回列表"
- 图片展示：多图用 Ant Design Carousel，单图直接展示，视频用 HTML5 video
- 登出：Popconfirm 确认气泡，防止误触
- 加载状态：列表和详情加载时显示 Spin

## 静态资源

- 地图图片通过 `/uploads/map/de_dust2.png` 访问
- 点位媒体通过 media 的 `file_path` 字段拼接访问
- 无需额外图标库，Ant Design 内置图标足够
