# 家庭异常自动告警 — 设计文档

**日期**：2026-05-31
**作者**：JialinShao + Claude
**状态**：设计阶段，待实现

## 1. 背景与目标

"谁便"是一款家庭排便健康记录 APP。当前"家庭"模块支持成员管理、共享动态流（feed）、群聊消息，但**所有信息都是被动浏览**——家人需要主动打开 APP 才能发现问题。

本设计目标：当家庭成员出现健康异常时，**主动通知**其他有查看权限的家人，让"家庭"模块从信息展示升级为协同关怀。

### 用户场景

- 孩子帮老人记录后出现黑便/血便，子女通过告警立即得知，及时陪同就医
- 父母看到孩子健康评分骤降，及时关心饮食和作息
- 家人发现彼此最近排便规律持续异常，互相提醒调整生活习惯

## 2. 范围（MVP）

### 在范围内

| 告警类型 | 严重等级 | 触发条件 |
|---|---|---|
| `DANGER_SIGNAL` | danger | 黑便 / 红色便 / 出血症状（任一） |
| `SCORE_DROP` | warn | 评分 < 40 **或** 较 7 日均值降 ≥ 25 分 |
| `CHRONIC_TREND` | info | 最近 5 条记录中 ≥ 4 条命中便秘/腹泻/低分 |

### 通知渠道（MVP）

- **应用内**：顶部铃铛 + 计数徽标，独立 `/alerts` 告警页，家庭页顶部 danger 告警 banner
- **邮件**（复用 Brevo HTTP API）：danger / warn 级别必发，info 级别不发

### 明确不做（YAGNI）

- 长时间未记录的告警（需要 cron 扫描，与"同步内联"架构冲突）
- Web Push / FCM 推送通知（需要 SW push handler + VAPID key + Capacitor 原生插件，工作量大一个量级）
- 个人订阅设置页（每个成员手动选择"订阅谁"的告警）— 直接复用现有 `FamilyPermission`
- 告警手动重试 / 失败邮件重发队列

## 3. 架构决策

### 决策 1：同步内联触发（方案 A）

在 `POST /api/records` 处理流程末尾，同步调用 `AlertService.evaluateAndDispatch`：

- ✅ 告警实时（用户提交完，家人 ≤ 1 秒可见）
- ✅ 无新增基础设施
- ✅ 错误能被请求 try-catch 捕获
- ❌ POST 响应延迟 +20-50ms

**替代方案对比**：

- 方案 B（NestJS EventEmitter 解耦）：当前只有一个监听器，过度设计
- 方案 C（cron 定时扫描）：danger 信号需要实时，cron 延迟 ≥ 5 分钟不可接受；Render 免费版 spin down 也让 cron 不可靠

### 决策 2：邮件 fire-and-forget

`AlertService` 触发邮件分发后**不 await**，直接 catch 错误记日志。

- POST 响应不被邮件延迟拖慢
- 邮件失败不影响应用内告警入库

### 决策 3：评估规则提取为纯函数

`alert/rules/alert-rules.ts` 不依赖 NestJS，不接 IO，输入 `record + healthScore + history`，输出 `AlertCandidate[]`。

- 单元测试零 mock 开销
- 规则改动不需要启动整个应用

### 决策 4：可见性快照化

`AlertRecipient.visibility` 在告警生成时根据 `FamilyPermission` 锁定，不动态计算：

- 之后权限变更不影响历史告警的可见性
- 查询时无需 JOIN 权限表

### 决策 5：冷却用查询实现，不建专表

24 小时冷却通过 `alerts` 表的索引查询完成（`subjectUserId + type + createdAt`）。`DANGER_SIGNAL` 跳过冷却判断。

**冷却作用域**：`(subjectUserId, type)` 全局唯一，不分家庭。也就是说，如果 subject 同时属于多个家庭，24h 内只创建一条 `alerts` 记录，但 `alert_recipients` 会覆盖所有家庭的全部合格收件人。理由：subject 的健康异常事件本身只有一次，跨家庭重复入库浪费且会让某些收件人在多家庭场景下收到重复告警。

### 决策 6：subject 自己不收告警

告警生成时，收件人列表排除被告警对象自己。理由：自己刚提交记录，APP 已经反馈了健康分和建议，再弹红色告警是双重打击。

## 4. 数据模型

新增 2 张表，不动现有表。

### `alerts`

```typescript
@Entity('alerts')
class Alert {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() @Index() familyId: string;
  @Column() subjectUserId: string;       // 被告警对象（出现异常的家人）
  @Column({ nullable: true }) recordId: string | null; // CHRONIC_TREND 可为 null

  @Column({ type: 'enum', enum: AlertType }) type: AlertType;
  @Column({ type: 'enum', enum: AlertSeverity }) severity: AlertSeverity;

  @Column() title: string;               // "妈妈出现血便"
  @Column({ type: 'text' }) summary: string;
  @Column({ type: 'jsonb' }) payload: object;  // 触发证据

  @CreateDateColumn() @Index() createdAt: Date;
}

enum AlertType {
  DANGER_SIGNAL = 'danger_signal',
  SCORE_DROP = 'score_drop',
  CHRONIC_TREND = 'chronic_trend',
}

enum AlertSeverity {
  DANGER = 'danger',
  WARN = 'warn',
  INFO = 'info',
}
```

**索引**：
- `(familyId, createdAt DESC)` — 家庭最近告警
- `(subjectUserId, type, createdAt DESC)` — 冷却查询

### `alert_recipients`

```typescript
@Entity('alert_recipients')
class AlertRecipient {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() @Index() alertId: string;
  @ManyToOne(() => Alert) @JoinColumn({ name: 'alertId' }) alert: Alert;

  @Column() recipientUserId: string;
  @Column({ type: 'enum', enum: Visibility }) visibility: Visibility; // 锁定时刻的权限

  @Column({ type: 'timestamp', nullable: true }) readAt: Date | null;
  @Column({ default: false }) emailSent: boolean;

  @CreateDateColumn() createdAt: Date;
}

enum Visibility {
  FULL = 'full',       // 看完整 title + summary + payload
  SUMMARY = 'summary', // 仅看简化文案
}
```

**索引**：
- `(recipientUserId, readAt)` — 个人未读查询

### 关于"长时间未记录"

不在 MVP 范围。如以后要加，需要 cron 定时任务扫描，跟同步内联架构冲突，届时重新评估。

## 5. 告警规则详细规格

### 5.1 `DANGER_SIGNAL`

| 字段 | 值 |
|---|---|
| severity | `danger` |
| 邮件 | 必发 |
| 冷却 | 无 |

**触发条件**（命中任一）：
- `record.color === 'black'`
- `record.color === 'red'`
- `record.symptoms?.includes('出血')`

**文案规则**：

| 命中 | summary 拼接 |
|---|---|
| 黑便 | "粪便颜色异常发黑，可能提示上消化道出血，建议尽快就医检查" |
| 红色便 | "粪便颜色发红，可能有下消化道出血，建议尽快就医检查" |
| 出血症状 | "本次记录伴随出血症状，建议关注并及时就医" |

多条命中：先按"黑便、红色便、出血症状"固定顺序拼接对应文案，文案间已包含句号无需额外分隔符；末尾追加 `"。强烈建议 24 小时内就医。"`。例如黑便+出血 → `"粪便颜色异常发黑，可能提示上消化道出血，建议尽快就医检查。本次记录伴随出血症状，建议关注并及时就医。强烈建议 24 小时内就医。"`

**payload**：
```json
{
  "color": "black",
  "symptoms": ["出血"],
  "bristolType": 6,
  "rules": ["color_black", "symptom_blood"]
}
```

### 5.2 `SCORE_DROP`

| 字段 | 值 |
|---|---|
| severity | `warn` |
| 邮件 | 必发 |
| 冷却 | 24h |

**触发条件**（命中任一）：
- 绝对低分：`healthScore.score < 40`
- 相对骤降：本次评分 ≤ (subject 用户最近 7 天 healthScore 均值) - 25，且 7 天内至少 3 条历史记录

**文案**：
- 绝对低分：`"本次健康评分 {score}（< 40），建议关注饮食与休息"`
- 相对骤降：`"本次健康评分 {score}，较 7 日均值（{avg}）下降 {delta} 分"`

**payload**：
```json
{
  "currentScore": 35,
  "avgScore7d": 72,
  "delta": -37,
  "rule": "absolute_low"
}
```

### 5.3 `CHRONIC_TREND`

| 字段 | 值 |
|---|---|
| severity | `info` |
| 邮件 | 不发 |
| 冷却 | 24h |

**触发条件**（命中任一，需 subject 至少有 5 条历史记录）：

| pattern | 条件 |
|---|---|
| `constipation` | 最近 5 条中 ≥ 4 条 `bristolType ∈ {1, 2}` |
| `diarrhea` | 最近 5 条中 ≥ 4 条 `bristolType ∈ {6, 7}` |
| `low_score` | 最近 5 条中 ≥ 4 条 `score < 60` |

**文案**：
- constipation: `"近 5 次记录中 {matchCount} 次出现便秘症状，建议关注饮食与运动"`
- diarrhea: `"近 5 次记录中 {matchCount} 次出现腹泻症状，建议关注饮食卫生"`
- low_score: `"近 5 次记录平均健康评分偏低，建议整体关注肠道健康"`

**payload**：
```json
{
  "pattern": "constipation",
  "windowSize": 5,
  "matchCount": 4,
  "lastRecordIds": ["...", "..."]
}
```

## 6. 模块结构

```
backend/src/alert/
├── alert.entity.ts          # Alert + AlertRecipient + 枚举
├── alert.module.ts
├── alert.service.ts         # 评估 + 写库 + 邮件分发 + 查询
├── alert.controller.ts      # GET 列表 / 未读数 / POST 已读
└── rules/
    ├── alert-rules.ts       # 纯函数 evaluate(input): AlertCandidate[]
    └── alert-rules.spec.ts  # 单元测试
```

`AlertService` 注入：`Repository<Alert>`、`Repository<AlertRecipient>`、`Repository<Record>`、`Repository<HealthScore>`、`FamilyService`（用现有方法查家庭关系和权限）、`MailService`。

## 7. 数据流

### 提交记录时（POST /api/records）

```
RecordController.create(req, dto)
  ├─ record = RecordService.create(userId, dto)
  ├─ healthScore = HealthService.calculateAndSave(record)
  ├─ try {
  │    AlertService.evaluateAndDispatch(record, healthScore)
  │      ├─ history = loadHistory(record.userId)
  │      │             // 最近 7 天 healthScore + 最近 5 条 record
  │      ├─ candidates = alertRules.evaluate({record, healthScore, history})
  │      ├─ for each candidate:
  │      │    if (candidate.type !== DANGER_SIGNAL):
  │      │      if (existsCooldownAlert(...)) continue;
  │      │    alert = save(alerts);
  │      │    families = getFamiliesContaining(subject = record.userId);
  │      │    for each family:
  │      │      recipients = members(family) excluding subject
  │      │        .filter(perm => perm.level !== NONE OR alert.severity === DANGER);
  │      │      for each recipient:
  │      │        visibility = perm.level === FULL ? FULL : SUMMARY;
  │      │        save(alert_recipients);
  │      │    if (alert.severity in [DANGER, WARN]):
  │      │      dispatchEmails(alert, recipients).catch(logError); // fire-and-forget
  │  } catch (err) {
  │    logger.error('Alert dispatch failed', err);
  │  }
  └─ return { record, healthScore };
```

### 用户查告警

```
GET /api/alerts?unread=true&page=1&limit=20
  └─ 查 alert_recipients WHERE recipientUserId = req.user.id [AND readAt IS NULL]
       JOIN alerts ORDER BY alerts.createdAt DESC
       根据 recipient.visibility 转换输出（FULL = 完整，SUMMARY = 简化）

GET /api/alerts/unread-count
  └─ COUNT(*) FROM alert_recipients WHERE recipientUserId = req.user.id AND readAt IS NULL

POST /api/alerts/:id/read
  └─ UPDATE alert_recipients SET readAt = NOW() WHERE id = :id AND recipientUserId = req.user.id

POST /api/alerts/read-all
  └─ UPDATE alert_recipients SET readAt = NOW() WHERE recipientUserId = req.user.id AND readAt IS NULL
```

## 8. 前端结构

```
frontend/src/features/alert/
├── AlertBell.tsx          # 顶部铃铛 + 徽标计数
├── AlertListPage.tsx      # /alerts 列表页
├── AlertCard.tsx          # 单条告警卡片
├── FamilyAlertBanner.tsx  # 家庭页顶部 danger 横条
└── alertApi.ts            # 接口封装
```

### `AlertBell`

- 挂在 `AppLayout` 顶部右侧（在用户头像旁边）
- 进入需登录页面后，每 60 秒轮询 `/api/alerts/unread-count`
- 计数 > 0 时显示红色徽标
- 点击跳转 `/alerts`

### `AlertListPage` (`/alerts`)

- 顶部 tab：未读 / 全部
- 列表项使用 `AlertCard`，severity 决定颜色
- 单条点 "已读" 调 `POST /alerts/:id/read`，本地状态立即更新
- 顶部按钮 "全部已读" 调 `POST /alerts/read-all`
- 分页：每页 20 条，下滑加载

### `AlertCard`

- 颜色：danger 红 / warn 橙 / info 黄
- `visibility = summary` 时显示简化文案：`"{昵称} 健康记录有异常，请关注"`
- 显示时间相对值：5 分钟前 / 2 小时前 / 昨天
- 已读样式：灰色背景 + 不透明度降低

### `FamilyAlertBanner`

- 渲染在 `FamilyDetail` 页顶部
- 查询当前家庭最近 24h 内 `severity = danger` 的未读告警
- 最多显示 2 条，点击跳 `/alerts/:id` 或滚动到详情

### 路由

- 在 `App.tsx` 加 `/alerts` 路由
- 受 `RequireAuth` 守卫

## 9. 错误处理

| 失败点 | 处理 |
|---|---|
| `AlertService.evaluateAndDispatch` 整体异常 | try-catch 吞掉，记日志，不影响 POST 响应 |
| 冷却查询失败 | 视为"无冷却"放行，记日志 |
| 写 `alerts` 表失败 | 记日志，跳过该候选告警，继续下一个 |
| 写 `alert_recipients` 失败 | 已建的 alert 保留，部分 recipient 失败记日志 |
| 邮件发送失败 | catch 后记日志，`emailSent` 保持 false |
| 前端轮询 401 | 走 `client.ts` 现有跳登录逻辑 |
| 前端轮询网络错误 | 静默失败，下次重试，不弹 toast |

## 10. 测试策略

### 后端单元测试（`alert-rules.spec.ts`）— 必须有

**DANGER_SIGNAL**：
- 黑便单独触发
- 红色便单独触发
- 出血症状单独触发
- 多条同时命中 → summary 合并 + 强烈建议就医
- 不命中任何危险 → 不触发

**SCORE_DROP**：
- 评分 < 40 触发（绝对低分）
- 评分 65 但 7 日均值 95、降 30 分 → 触发（相对骤降）
- 评分 65 但 7 日均值 70 → 不触发
- 历史不足 3 条 → 跳过相对判断，仅看绝对低分

**CHRONIC_TREND**：
- 5 条中 4 条 bristol ∈ {1,2} → 触发 constipation
- 5 条中 4 条 bristol ∈ {6,7} → 触发 diarrhea
- 5 条混合 → 不触发
- 历史 < 5 条 → 不触发

### 后端集成测试（`alert.service.spec.ts`）

- 同 type 24h 内重复 → 第二次不入库
- DANGER_SIGNAL 24h 内重复 → 第二次仍入库
- 收件人按 FamilyPermission 过滤（NONE 不收，SUMMARY 收简化版）
- DANGER 告警 NONE 也收
- subject 自己不在收件人列表
- 邮件发送失败不影响 alert/recipient 入库

### 前端测试

- `AlertCard` 渲染 3 种 severity 各自颜色
- `summary` 权限的告警显示简化文案
- 点击"已读"调用接口并本地状态更新

## 11. 实施顺序

每步可独立 commit：

1. **数据层 + 规则纯函数**：Alert/AlertRecipient entity、`alert-rules.ts` 纯函数、`alert-rules.spec.ts` 全绿。不接 DB、不接 controller。
2. **AlertService 服务层**：加载 history、家庭关系、权限，写 alerts + alert_recipients。暂不发邮件。集成测试。
3. **接入 RecordController**：注入 AlertService，在 create 末尾调用 try-catch 包裹。后端 MVP 可用。
4. **邮件分发**：`MailService.sendAlertEmail`，AlertService 中 fire-and-forget 调用。
5. **前端**：AlertBell + `/alerts` 页 + FamilyAlertBanner + AlertController 接口。

## 12. 风险与开放问题

### 风险

1. **TypeORM `synchronize: true` 在生产**：新 entity 部署后会自动建表（已验证 `app.module.ts:21,31`），无需手写 migration。但同步建表理论上有竞态风险（多实例同时启动），目前单实例部署可接受。
2. **冷却查询的并发问题**：用户 1 秒内连续提交 2 条相同异常记录，理论上两条都过冷却检查。家庭场景几乎不会发生，多发一条非致命，不加事务/锁。
3. **历史数据查询性能**：SCORE_DROP 查 7 天 healthScore，CHRONIC_TREND 查最近 5 条 record。两个查询都是小数据量（< 20 行），有现有索引覆盖。

### 当前已明确不做

- 长时间未记录告警（需 cron）
- Web Push / FCM
- 手动订阅设置
- 告警重试 / 失败队列
- 告警删除 / 归档

## 13. 部署变更

- 后端：合并代码后 Render 自动重新部署，TypeORM 自动建新表
- 前端：合并代码后 Render 静态站点自动重新构建
- APK：无需重打包，远程加载模式自动获取新前端
- 环境变量：不需要新增

## 14. 附录：决策日志

- **2026-05-31**：选 MVP 范围 = DANGER_SIGNAL + SCORE_DROP + CHRONIC_TREND（不含长时间未记录）
- **2026-05-31**：选通知渠道 = 应用内 + 邮件
- **2026-05-31**：选接收者 = 所有有查看权限的家人（NONE 仍收 DANGER）
- **2026-05-31**：选防骚扰 = 同类型 24h 冷却，DANGER 例外
- **2026-05-31**：选 UI = 铃铛计数 + 独立告警页 + 家庭页 danger banner
- **2026-05-31**：选架构 = 方案 A 同步内联（拒绝 B 解耦和 C cron）
