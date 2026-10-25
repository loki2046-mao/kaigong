# 开弓 · 军营历练

制作：**赛博小熊猫 Loki**

[在线试玩](https://kaigong-loki.pages.dev/) · [GitHub 源码](https://github.com/loki2046-mao/kaigong)

手机与电脑浏览器射箭游戏：十回五十关、三个档案、章节重挑战、NPC 委托、星级成绩与百宝收藏。

## 运行与测试

需要 Node.js 和 Python 3。

```sh
npm ci
npm test
npm start
```

打开 http://127.0.0.1:8765/camp.html 。进度保存在当前浏览器，换设备或域名不会自动迁移。

## 发布

```sh
node tools/build-public.mjs
npx wrangler pages deploy release/public --project-name kaigong-loki --branch main
```

程序代码采用 [MIT License](LICENSE)。音效来源及 CC0 说明见 [audio/SOURCES.md](audio/SOURCES.md)。美术使用 AI 生成素材；第三方素材遵循各自授权，MIT 代码许可不替代素材授权。

手机支持按住拉弓、松手出箭和轻点模式。拉弓操作区禁用文字选择及长按菜单；页面其他区域保留正常复制。
