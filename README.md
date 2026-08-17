# DSH Minecraft Pet · DSH 我的世界桌面宠物

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/lovejavacore/dsh-minecraft-pet?style=social)](https://github.com/lovejavacore/dsh-minecraft-pet)

一个运行在 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) Web GUI 右下角的 **Minecraft 主题桌面宠物**——史蒂夫（Steve）、苦力怕（Creeper）与奥特曼（Ultraman），根据当前 Agent 的工作状态实时切换动作，并在任务完成时播放专属音效。

> A Minecraft-themed desktop pet in the bottom-right corner of the DSH Web GUI — Steve, Creeper and Ultraman react to the agent's working status with animations and per-pet completion sounds.

## 目录 Contents

- [特性 Features](#特性-features)
- [目录结构](#目录结构)
- [截图 / 演示 Screenshots](#截图--演示-screenshots)
- [如何安装 Install](#如何安装-install)
- [技术实现 Implementation](#技术实现-implementation)
- [常见问题 FAQ](#常见问题-faq)
- [贡献 Contributing](#贡献-contributing)
- [致谢 Acknowledgments](#致谢-acknowledgments)
- [免责声明 Disclaimer](#免责声明-disclaimer)
- [License](#license)

## 特性 Features

### 🐾 三只宠物

| 宠物 | 说明 | 皮肤 |
|---|---|---|
| ⛏ 史蒂夫 Steve | 左手拿钻石镐，像素画 | 普通 / 钻石甲 |
| 💥 苦力怕 Creeper | 侧视四腿，像素画 | — |
| 🦸 奥特曼 Ultraman | SVG 矢量，红银条纹 | 初代 / 赛文 / 泰罗 / 迪迦 / 泽塔 |

### 🎬 三态动作

| 状态 | 动作 |
|---|---|
| 待机 idle | 轻微上下浮动 |
| 工作 working | 史蒂夫挥镐、奥特曼出拳 + 踏步、苦力怕渐进变红膨胀（蓄力） |
| 完成 completed | 专属必杀 + 音效 |

### ✨ 完成专属必杀

| 宠物 | 必杀 | 音效 |
|---|---|---|
| 史蒂夫 | 跳跃 + 矿石掉落粒子 | 「叮叮」上行琶音 |
| 苦力怕 | 爆炸光球 + 火光粒子 | 「嘶嘶 → Boom」 |
| 奥特曼·初代 | 斯派修姆光线（蓝白光） | 变身英雄登场 |
| 奥特曼·赛文 | 冰斧投掷（旋转飞出 + 命中闪光） | 变身英雄登场 |
| 奥特曼·泰罗 | 斯特利姆光线（五彩光束） | 变身英雄登场 |
| 奥特曼·迪迦 | 哉佩利敖光线（双手十字 + 紫光） | 变身英雄登场 |
| 奥特曼·泽塔 | 泽斯蒂姆光线（双手并拢 + 蓝光） | 变身英雄登场 |

### 🖱 交互

| 操作 | 效果 |
|---|---|
| 左键点击 | 切换宠物（史蒂夫 → 苦力怕 → 奥特曼） |
| 右键点击 | 打开 / 关闭设置菜单 |
| 拖拽 | 移动宠物 |
| 菜单内 | 切换皮肤、四角定位、试听音效、静音、复位、隐藏 |

## 目录结构

```
dsh-minecraft-pet/
├── README.md
├── LICENSE
├── package.json
├── .gitignore
├── src/                       # 动态插件形态（临时运行，重启消失）
│   ├── host.js        # Host 半：Agent 状态跟踪 + Client 私有 RPC
│   └── client.js      # Client 半：宠物 UI / 动画 / 音效 / 交互
├── plugin/                    # 正式插件形态（随 DSH 启动自动加载，推荐）
│   ├── package.json   # dsh.client 声明：lib/client.js 进入浏览器 boot 图
│   └── lib/
│       ├── index.js   # Host 半：agent/status 跟踪 + SSE 状态推送
│       └── client.js  # Client 半：CJS bundle，EventSource 订阅 + overlay UI
└── audio/
    ├── generate.js    # 音效生成脚本（8-bit PCM WAV 程序化合成）
    ├── steve.wav
    ├── ultraman.wav
    └── creeper.wav
```

## 截图 / 演示 Screenshots

![史蒂夫 Steve](assets/Steve.png)

> 更多宠物（苦力怕 / 奥特曼）与三态动作（待机 / 工作 / 完成）的动图可继续补充到 `assets/` 目录。

## 如何安装 Install

### 环境要求

- DeepSeek Harness (DSH) Web GUI（支持 Cordis 动态插件）
- 可选：Node.js ≥ 14（用于运行 `npm run audio` 重新生成音效交付物）

本插件有两种安装方式：

### 方式一：正式插件，随 DSH 启动自动加载（推荐）

把 `plugin/` 目录安装到 DSH 的 profile 依赖里，并在 profile 的 patch 层追加一行即可；
DSH 每次启动都会自动加载宠物，无需手动定义/运行。

```powershell
# 1) 安装插件包（路径按你的 DSH_HOME / profile 调整）
$dst = "$env:USERPROFILE\.dsh\profiles\node_modules\dsh-desktop-pet"
Copy-Item "plugin" $dst -Recurse

# 2) 在 $env:USERPROFILE\.dsh\profiles\web\cordis.patch.yml 末尾追加：
#    - insert:
#        - id: desktop-pet
#          name: 'dsh-desktop-pet'

# 3) 重启 DSH（patch 在启动时应用）
```

> 两种形态行为一致（宠物、皮肤、音效、三态动画完全相同）；
> 区别仅在于状态通道：动态插件用 `get-status` 私有 RPC 轮询，正式插件用 host 的 SSE 端点
> `/plugins/dsh-desktop-pet/events` 实时推送。

### 方式二：Cordis 动态插件（临时体验，重启后消失）

本插件也是一个 **Cordis 动态插件（Dynamic Cordis Plugin）**，由「Host 半」和「Client 半」组成。

1. 在 DSH Web GUI 中，将 `src/host.js` 里 `createHostHalf()` 返回的 `{ ... }` 作为 Host 代码（`code.host`），
   将 `src/client.js` 里 `createClientHalf()` 返回的 `{ ... }` 作为 Client 代码（`code.client`）。
2. 通过 `cordis_define` 定义插件，再用 `cordis_run` 激活。
3. 首次使用前，在菜单里点一次「🔊 试听音效」以「预热」浏览器的音频自动播放。

> 这两个文件为了可读性被包装成了 `module.exports` 工厂函数；实际作为动态插件使用时，
> 直接取函数体内 `return { ... }` 的部分即可（`host.js` / `client.js` 的 `return` 行到结尾大括号）。

> 注意：动态插件只存在于 DSH 进程内存中，**重启后自动消失**，需要重新定义。

## 技术实现 Implementation

- **状态来源（Host）**：监听 `agent/status` 事件（`idle ⇄ running`），按 Agent id 精确计数，避免子代理干扰。
  - 动态插件形态：通过 `get-status` 私有 RPC 边沿触发「已完成」。
  - 正式插件形态：通过 `webServer` 注册 SSE 端点 `/plugins/dsh-desktop-pet/events` 实时推送三态与序号。
- **渲染（Client）**：注册到 `shell.overlay` 槽位，用纯 `React.createElement` + 内联 SVG 绘制像素画/矢量宠物。
- **动画**：注入 CSS keyframes（正式插件用 `<style>` 标签，动态插件用 `styles.insert`），
  对 SVG `<g>` 局部元素（镐子、手臂、腿）做 transform 动画。
- **音效**：客户端没有 `AudioContext`/`fetch`/文件访问，因此用纯 JS 程序化合成 8-bit PCM WAV 数据 URI，
  渲染 `<audio>` 元素播放；`audio/generate.js` 用同一套合成算法生成可试听的 `.wav` 交付物。

## 常见问题 FAQ

- **音效不响？** 浏览器自动播放策略要求页面至少有过一次用户交互。先在菜单里点「🔊 试听音效」一次即可「预热」。
- **如何切换奥特曼皮肤？** 右键打开菜单，选中奥特曼后会出现「初代 / 赛文 / 泰罗 / 迪迦 / 泽塔」按钮。
- **宠物位置怎么复位？** 菜单里点「↺ 复位位置」，或直接拖拽到任意位置后用四角定位按钮重新固定。
- **想加新宠物 / 新皮肤？** 参考 `src/client.js` 里的 `PETS`、`ULTRA_SKINS` 与对应的 Art 渲染函数即可扩展，欢迎 PR。

## 贡献 Contributing

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库并克隆到本地。
2. 修改 `src/host.js` / `src/client.js`（纯 JavaScript，无 TypeScript / JSX / 打包）。
3. 保持代码风格一致，提交信息清晰。
4. 推送到你的 fork，发起 Pull Request 到 `main` 分支。

## 致谢 Acknowledgments

- [Minecraft](https://www.minecraft.net/)（© Mojang / Microsoft）—— 史蒂夫、苦力怕形象来源
- 奥特曼系列（© 圆谷制作株式会社 Tsuburaya Productions）—— 奥特曼形象与必杀技来源
- [DeepSeek Harness](https://github.com/deepseek-ai) —— 运行平台

## 免责声明 Disclaimer

本项目仅用于**学习与技术演示**，为粉丝致敬性质，与 Mojang / Microsoft 及圆谷制作株式会社**无关**。

- 「Minecraft」「Steve」「Creeper」及相关形象版权归 **Mojang / Microsoft** 所有。
- 「奥特曼 / Ultraman」及相关角色、必杀技名称版权归 **圆谷制作株式会社** 所有。

本项目不包含任何官方素材、音频或图像资源；所有宠物造型均为代码绘制的原创近似风格，音效为程序化合成。请勿将本项目用于任何商业用途。

## License

[MIT](./LICENSE)
