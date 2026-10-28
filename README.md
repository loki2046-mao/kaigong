# 开弓

由赛博小熊猫 Loki 制作的古风网页射箭小游戏。手机和电脑均可游玩；长按拉弓，松手出箭，也支持轻点和键盘空格。

## V4 · 一箭有回响

- 十二回六十关，练习精准、移动、骑射、开门与旗帘机关。
- 旗靶可以直接穿旗，也可以先断帘绳；每回终试可选大靶或小靶。
- 章节各有星级挑战；旧档案与旧星级保留。
- 秋日军营、雪山边营、封帅演武场三组场景。
- 三个本地存档、人物姓名、男女角色、十段人物叮嘱与纪念品。
- 48 件藏品、来源线索、重复物兑换；三种有不同代价的箭具。
- 三分钟同题试射，统一练习箭、独立计分，不改变主线进度。
- 支持分享同题链接和下载战报图片。
- 公共今日/累计访问统计；另提供不含身份信息的体验事件汇总。

## 开发与试玩

需要 Node.js、Python 3。字体、图片、声音随站点提供，游戏运行不依赖外部字体或图片服务。

```sh
npm install
npm test
node tools/build-public.mjs
python3 -m http.server 8766 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8766/release/public/`，它与生产站使用相同入口。`camp.html` 是军营主线，`trial.html` 是短局入口，`archive.html` 是档案与收藏。

浏览器验收（本机装有 Google Chrome）：

```sh
node tools/v4-browser-check.mjs
node tools/v4-flow-check.mjs
```

测试使用独立浏览器上下文，不修改玩家存档。验证结果写入 `qa/v4/`。音效听感和真实手机/大陆网络仍需要相应设备测试，浏览器模拟不能替代这些验证。

## 部署

```sh
node tools/build-public.mjs
npx wrangler pages deploy release/public --project-name kaigong-loki --branch main
```

国内静态托管包：`node tools/build-cloudbase.mjs`。需要自行配置已备案域名、HTTPS 与托管服务，生成上传包不等于域名部署已完成。

首次启用 V4 体验统计时，先对已有 D1 数据库应用 `stats-service/experience-v4.sql`，再部署 Worker；只新增表，不修改原 UV/PV 计数。`insights.html` 展示汇总数据，指标单位为游戏页面会话中的事件，不能当作独立人数或精确流失率。

## 素材与许可

代码见 LICENSE。字体 Ma Shan Zheng 采用 SIL OFL，说明随 `fonts/` 分发。声音来源见 `audio/SOURCES.md`。V4 冬营和演武场背景为本项目生成的原创场景；人物和其他图像沿用项目素材。公开代码不包含账号密钥或玩家档案。

## 作者与相关作品

由[赛博小熊猫 Loki](https://hiloki.ai/about)制作与维护。用 AI 做产品、做内容，把真实制作中的修改、取舍和方法留下来。

[个人网站](https://hiloki.ai/) · [作品与制作记录](https://hiloki.ai/works) · [公众号文章](https://hiloki.ai/articles/) · [GitHub](https://github.com/loki2046-mao)
