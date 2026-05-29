# 谁便 (ShuiBian) — 设计文档

## 概述

"谁便"是一款排便健康记录与分析应用。用户每次上厕所后通过专业问卷记录体验，系统基于 Bristol Stool Scale 等医学标准给出即时健康评分，并提供周/月维度的趋势报告和健康洞察。支持家庭多用户使用，成员间可灵活控制数据可见权限。

## 产品形态

- 第一阶段：Web 原型（SPA），本地 docker-compose 开发，内网穿透供他人试用
- 后续规划：部署到云服务器，封装为移动端 App 供朋友下载使用

## 技术架构

```
┌─────────────────────────────────────────────┐
│           Frontend (React SPA)              │
│  Vite + React 18 + TypeScript              │
│  Framer Motion + TailwindCSS + Recharts    │
└──────────────────┬──────────────────────────┘
                   │ REST API (JWT)
┌──────────────────▼──────────────────────────┐
│           Backend (NestJS)                  │
│  Modules: Auth | Record | Health |         │
│           Family | Stats                    │
│  TypeORM + PostgreSQL                      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           PostgreSQL 15                     │
└─────────────────────────────────────────────┘
```

### 前端技术栈

- Vite — 构建工具
- React 18 + TypeScript — UI 框架
- Framer Motion — 动画引擎（页面转场、问卷步骤动画、数据可视化动效）
- TailwindCSS — 样式系统
- Recharts — 图表库
- React Router v6 — 路由
- Axios — HTTP 客户端

### 后端技术栈

- NestJS — 框架（模块化 + 依赖注入 + Guard/Interceptor）
- TypeORM — ORM
- PostgreSQL 15 — 数据库
- JWT — 认证
- class-validator — 请求校验

### 部署

- docker-compose 编排前端、后端、数据库三个容器
- 前端 Nginx 容器提供静态文件 + 反向代理 API
- 未来云部署时只需调整 docker-compose 配置和环境变量

## 数据模型

### 用户与认证

```
User {
  id: UUID (PK)
  email: string (unique)
  passwordHash: string
  nickname: string
  avatar: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 家庭组

```
Family {
  id: UUID (PK)
  name: string
  createdBy: UUID (FK -> User)
  createdAt: timestamp
}

FamilyMember {
  id: UUID (PK)
  userId: UUID (FK -> User)
  familyId: UUID (FK -> Family)
  role: enum(admin, member)
  joinedAt: timestamp
}

FamilyPermission {
  id: UUID (PK)
  familyId: UUID (FK -> Family)
  ownerId: UUID (FK -> User)       // 数据所有者
  viewerId: UUID (FK -> User)      // 查看者
  level: enum(none, summary, full) // 可见级别
}
```

### 排便记录

```
Record {
  id: UUID (PK)
  userId: UUID (FK -> User)
  mode: enum(quick, detailed)
  bristolType: int (1-7)
  color: enum(brown, dark_brown, yellow, green, black, red, pale)
  duration: int (分钟)
  effort: enum(easy, moderate, hard)
  comfort: int (1-5)
  amount: enum(small, moderate, large)
  symptoms: string[] (腹痛, 出血, 黏液, 气味异常, 不尽感)
  notes: string (nullable)
  createdAt: timestamp
}
```

### 生活方式（详细模式）

```
LifestyleEntry {
  id: UUID (PK)
  recordId: UUID (FK -> Record)
  userId: UUID (FK -> User)
  meals: string
  waterIntake: int (ml)
  exercise: enum(none, light, moderate, intense)
  exerciseDuration: int (分钟, nullable)
  mood: enum(calm, anxious, stressed, happy, tired)
  sleepHours: float
  fiberIntake: enum(low, medium, high)
  createdAt: timestamp
}
```

### 健康评分与报告

```
HealthScore {
  id: UUID (PK)
  recordId: UUID (FK -> Record)
  score: int (1-100)
  factors: JSON  // 各维度得分明细
  advice: string
  createdAt: timestamp
}

WeeklyReport {
  id: UUID (PK)
  userId: UUID (FK -> User)
  weekStart: date
  avgScore: float
  recordCount: int
  bristolDistribution: JSON
  insights: string[]
  createdAt: timestamp
}

MonthlyReport {
  id: UUID (PK)
  userId: UUID (FK -> User)
  month: date
  avgScore: float
  recordCount: int
  bristolDistribution: JSON
  lifestyleCorrelations: JSON
  insights: string[]
  createdAt: timestamp
}
```

## 问卷流程

### 快速模式（3 步，约 30 秒）

1. **Bristol 分类** — 7 个图示卡片选择
2. **基础信息** — 颜色 + 用力程度 + 舒适度（一页内完成）
3. **伴随症状** — 多选标签，无则跳过 → 提交

### 详细模式（7 步，在快速模式基础上展开）

4. **排便量 + 用时**
5. **饮食关联** — 最近一餐分类/描述
6. **生活方式** — 饮水量、运动、睡眠、情绪、膳食纤维
7. **备注** — 可选自由文字 → 提交

### 交互设计

- 默认进入快速模式，Step 3 完成后可选择"记录更多"切换到详细模式
- 步骤间滑动转场动画
- 选中选项弹性缩放反馈
- 提交后评分数字翻转动画呈现

## 健康评分算法

基于加权评分模型，满分 100 分：

| 维度 | 权重 | 评分规则 |
|------|------|----------|
| Bristol 分类 | 35% | Type 3/4 → 100, Type 2/5 → 70, Type 1/6 → 40, Type 7 → 20 |
| 颜色 | 20% | 棕色/深棕 → 100, 黄色/绿色 → 70, 黑色/红色 → 20（触发警告） |
| 舒适度 | 20% | 1-5 分线性映射到 0-100 |
| 用力程度 | 15% | 轻松 → 100, 适中 → 70, 费力 → 30 |
| 症状 | 10% | 无症状 → 100, 每个症状扣 20%, 出血直接扣 50% |

### 即时反馈分级

- **80-100**：状态良好，保持当前习惯
- **60-79**：基本正常，附 1-2 条改善建议
- **40-59**：需要关注，建议调整饮食/作息
- **<40**：建议就医，标记红旗信号（异常颜色/出血）

### 趋势报告内容

- 平均评分变化曲线
- Bristol 类型分布饼图
- 排便频率统计（每日/隔日/不规律）
- 生活方式关联分析（如运动日 vs 非运动日评分差异）
- 异常事件时间线

## 前端界面设计

### 视觉风格

- 圆润卡片式设计，大圆角 + 柔和阴影
- 主色调：健康绿 (#4CAF50) + 暖白背景
- 健康度用渐变色表示（绿 → 黄 → 红）
- 深色模式支持
- 移动优先响应式布局

### 核心页面

#### 1. Dashboard（首页）

- 今日状态卡片：最近一次评分 + 动态波纹效果
- 本周趋势迷你图（sparkline）
- 快速记录入口：大按钮 + 呼吸动画
- 家庭成员状态概览（权限范围内）

#### 2. 记录页（问卷流）

- 步骤间 Framer Motion layoutAnimation 滑动转场
- Bristol 图示卡片选中时弹性放大 + 光晕
- 颜色选择器用实际色块圆点
- 症状标签点选弹跳效果
- 提交后评分数字从 0 翻转到最终值 + 粒子动效

#### 3. 趋势报告页

- 周/月切换滑动过渡
- 图表入场动画（线条绘制、柱状图升起）
- 洞察卡片依次淡入
- 下拉刷新弹性回弹

#### 4. 家庭页

- 成员头像环形排列
- 邀请链接生成 + 复制反馈动画
- 权限设置滑动开关 + 即时预览

#### 5. 个人设置页

- 偏好设置、通知、数据导出

### 关键动效

| 场景 | 动效 | 技术实现 |
|------|------|----------|
| 页面切换 | 共享元素过渡 | Framer Motion AnimatePresence |
| 问卷步骤 | 左右滑动 + 淡入淡出 | Framer Motion variants |
| 选项选中 | 弹性缩放 + 边框光晕 | spring animation |
| 评分展示 | 数字翻转 + 环形进度条填充 | 自定义 counter + SVG 动画 |
| 图表 | 线条绘制、数据点弹入 | Recharts + CSS animation |
| 列表项 | 交错淡入 (stagger) | Framer Motion staggerChildren |
| 下拉刷新 | 弹性回弹 | spring physics |
| 健康度变化 | 颜色渐变过渡 | CSS transition on gradient |

## 家庭权限系统

### 家庭组规则

- 一个用户可属于多个家庭组
- 每个家庭组有一个 admin（创建者），可转让
- 成员通过邀请链接加入（链接有效期 7 天）
- 退出家庭组后，历史数据对其他成员不再可见

### 权限粒度

每个成员可对家庭中每个其他成员独立设置可见级别：

- **none**：完全不可见
- **summary**：只能看到趋势摘要（平均分、频率、趋势方向）
- **full**：可以看到每条详细记录

默认值：新成员加入时对所有人默认 none，需主动开放。

### 后端实现要点

- 查询他人数据时，后端根据 FamilyPermission 过滤返回字段
- summary 级别只返回聚合数据（WeeklyReport/MonthlyReport），不返回单条 Record
- full 级别返回完整 Record 列表
- 权限变更即时生效

## 后端 API 概览

### Auth

- `POST /auth/register` — 注册
- `POST /auth/login` — 登录，返回 JWT
- `GET /auth/me` — 当前用户信息

### Records

- `POST /records` — 创建记录（含即时评分）
- `GET /records` — 查询自己的记录列表（分页）
- `GET /records/:id` — 单条记录详情

### Health

- `GET /health/score/:recordId` — 获取某条记录的评分
- `GET /health/weekly` — 本周报告
- `GET /health/monthly` — 本月报告

### Family

- `POST /family` — 创建家庭组
- `POST /family/:id/invite` — 生成邀请链接
- `POST /family/join/:token` — 通过邀请加入
- `GET /family/:id/members` — 成员列表
- `PUT /family/:id/permission` — 设置权限
- `GET /family/:id/member/:userId/summary` — 查看成员摘要
- `GET /family/:id/member/:userId/records` — 查看成员记录（需 full 权限）

### Stats

- `GET /stats/trends` — 趋势数据（图表用）
- `GET /stats/correlations` — 生活方式关联分析

## 项目结构

```
shuibian/
├── docker-compose.yml
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/            # API 客户端
│   │   ├── components/     # 通用组件
│   │   ├── features/       # 按功能模块组织
│   │   │   ├── auth/
│   │   │   ├── record/
│   │   │   ├── health/
│   │   │   ├── family/
│   │   │   └── stats/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── utils/
│   └── Dockerfile
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   ├── record/
│   │   ├── health/
│   │   ├── family/
│   │   ├── stats/
│   │   └── common/        # Guards, Interceptors, DTOs
│   └── Dockerfile
└── docs/
```

## UI 实现策略

前端界面使用 ui-ux-pro-max skill 辅助设计和实现，确保：
- 专业的色彩系统和字体搭配
- 符合 UX 最佳实践的交互设计
- 高质量的动效和过渡效果
- 移动端优先的响应式体验
- 无障碍可访问性

## 未来规划

- 云服务器部署（Docker + Nginx + 域名）
- 封装为移动端 App（React Native 或 Capacitor）供朋友下载
- 后端 API 保持不变，移动端直接复用

## 非功能性需求

- 响应式设计：优先适配手机屏幕（375px+），兼容桌面
- 性能：问卷提交到评分返回 < 500ms
- 安全：密码 bcrypt 加密，JWT 过期时间 7 天，API 请求校验
- 数据隐私：排便数据仅本人和授权家庭成员可见
- 可扩展：后端模块化设计，未来可独立部署为微服务
