# 开弓访问统计

公开界面：今日 UV/PV、累计 UV/PV。北京时间划分日期，从上线开始记录，不回填历史。UV 是匿名浏览器去重，不是实名人数；PV 是页面加载，不是按钮点击或实际开局。同一浏览器跨天再次到访会增加当天 UV，但不增加累计 UV。换设备、清除数据、禁用存储、拦截请求、机器人等都会影响结果。

客户端只读取 `kg-visitor-v1`，保留一个随机 UUID。不会读取、上传人物姓名、存档、关卡或收藏。服务端保存 UUID 的 SHA-256 摘要；数据库不保存 IP、用户代理或完整 URL。IP 仅作为 Cloudflare 限流的临时 key。日级去重记录保留约三天，累计去重摘要及每日汇总持续保留。更换统计身份会改变 UV，应按估算值理解。

架构：国外 Pages `/api/visits/{stats,visit}` → 服务绑定 → Worker → D1；国内 `kaigong.hiloki.cn` 跨域直连公开 Worker（`workers_dev`）的 `/stats`、`/visit`，共用同一 D1。游戏资源仍走静态托管。不提供个人明细、存档、删除、管理或任意查询接口。Pages 预览/自定义域名访问 `/api/visits/*` 仍为 403（仅正式 `kaigong-loki.pages.dev`）；国内与跨域测试用公开 Worker。

防护：POST 来源检查、字段白名单、512 字节流式上限、参数化 SQL、每 IP 每边缘节点每分钟 60 次限流、事件 ID 去重、只读汇总 30 秒缓存。来源检查不是身份认证，限流不能完全阻挡分布式刷量。统计失败不会阻断游戏。使用现有 Free 计划；配额耗尽时统计可能不可用，不要据此宣称永远免费或无限容量。

部署：
1. `npx wrangler d1 execute kaigong-visit-stats --remote --file stats-service/schema.sql --config stats-service/wrangler.jsonc`
2. `npx wrangler deploy --config stats-service/wrangler.jsonc`
3. `node tools/build-public.mjs`
4. `npx wrangler pages deploy release/public --project-name kaigong-loki --branch main`

只公开 `release/public`；不要上传项目目录、凭据或 `.wrangler`。移植到自己的 Cloudflare 账号须重新创建数据库并替换绑定 ID、站点域名。
