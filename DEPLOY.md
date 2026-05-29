# 谁便 ShuiBian — 部署指南

把项目部署到 Render（前后端全免费） + Neon（免费 Postgres） + 用 PWABuilder 生成安卓 APK 发给朋友。

---

## 一、准备 Neon 数据库（5 分钟）

1. 打开 https://console.neon.tech，用 GitHub 账号登录
2. 点 **Create Project**，地区选 `Asia Pacific (Singapore)`
3. 项目建好后，在 **Connection Details** 复制 **Connection string**，长得像：
   ```
   postgresql://user:password@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. 这串就是后面要填的 `DATABASE_URL`

---

## 二、代码推送到 GitHub（10 分钟）

```bash
# 在项目根目录
git init
git add .
git commit -m "Initial commit"
git branch -M main

# 在 github.com 建一个新仓库（取名 shuibian 或随你），不要勾 README
git remote add origin https://github.com/你的用户名/shuibian.git
git push -u origin main
```

如果 push 报权限错误，需要先在 GitHub 设置 Personal Access Token 或用 SSH 密钥。

---

## 三、Render 一键部署（10 分钟）

1. 打开 https://render.com，用 GitHub 登录
2. 右上角 **New +** → **Blueprint**
3. 选你刚推的 GitHub 仓库 → 它会自动读到 `render.yaml`
4. 第一次会让你填三个**敏感环境变量**（render.yaml 里标了 `sync: false` 的）：
   - **DATABASE_URL** → 粘贴 Neon 的连接字符串
   - **CORS_ORIGINS** → 先随便填一个（比如 `https://temp.com`），第一次部署完后再回来改成实际前端 URL
   - **VITE_API_URL** → 同上，先随便填，后面改
5. 点 **Apply**，等 5-10 分钟

部署完成后，Render 会给你两个 URL：
- 前端：`https://shuibian.onrender.com`（或类似）
- 后端：`https://shuibian-api.onrender.com`

---

## 四、回填环境变量（重要！）

部署完了拿到真实 URL 后：

1. **后端 `shuibian-api` Service** → Environment → 改 `CORS_ORIGINS`：
   ```
   https://shuibian.onrender.com
   ```
   保存后 Render 会自动重启后端

2. **前端 `shuibian` Service** → Environment → 改 `VITE_API_URL`：
   ```
   https://shuibian-api.onrender.com/api
   ```
   保存后 → **Manual Deploy** → **Deploy latest commit**（前端要重新 build 才会用上新的 env）

3. 等前端 build 完，打开前端 URL，注册账号试试

---

## 五、用 PWABuilder 生成安卓 APK（5 分钟）

1. 打开 https://www.pwabuilder.com
2. 把前端 URL `https://shuibian.onrender.com` 粘进搜索框 → **Start**
3. 它会扫描 PWA 配置，全部应该是绿色对勾
4. 点 **Package For Stores** → 选 **Android**
5. 表单大部分用默认即可，关键字段：
   - **Package ID**：`com.shuibian.app`（这个唯一标识 app，定了就别改）
   - **App name**：`谁便`
   - **Signing Key**：选 **New**（PWABuilder 会自动生成签名密钥并放在 zip 里，下载后**务必保存**，以后更新 APK 必须用同一个签名）
6. 点 **Download Package**，得到一个 zip
7. 解压后里面有 `app-release-signed.apk`
8. 发到 QQ 给朋友，朋友安装时会提示"未知来源"，允许即可

---

## 六、Render 免费层须知

- **冷启动**：15 分钟无访问后，后端会休眠。下次访问要等 30-60 秒（前端是静态站不受影响）
  - 解法：用 https://uptimerobot.com 每 5 分钟 ping 一次 `https://shuibian-api.onrender.com/api/auth/me`，能保持后端常活
- **Neon 免费**：永久免费，但 7 天无连接会自动暂停（Render 周期访问会让它保持活跃）
- **每月限额**：750 实例小时/月，一个 web 服务跑满 30 天约 720 小时，刚好够

---

## 七、本地开发依然能用

部署不影响本地：
```bash
docker compose up -d
```
访问 http://localhost:5173，本地用本地数据库，公网用 Neon，两套环境完全独立。

---

## 故障排查

| 现象 | 原因 | 解法 |
|------|------|------|
| 前端能开，登录提示网络错误 | CORS 或 VITE_API_URL 没改 | 检查后端 CORS_ORIGINS、前端 VITE_API_URL 是否对 |
| 部署后白屏 | Vite build 没把 sw.js 输出 | 检查 vite-plugin-pwa 是否正确装上 |
| 后端启动报数据库错 | Neon 连接串不对 / 缺 sslmode | 确认连接串结尾有 `?sslmode=require` |
| APK 装上无法打开 | 网络问题/后端冷启动 | 等一分钟再开，或挂 UptimeRobot |
