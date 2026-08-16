# DSH Minecraft Pet · DSH 我的世界桌面宠物

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/lovejavacore/dsh-minecraft-pet?style=social)](https://github.com/lovejavacore/dsh-minecraft-pet)

一个运行在 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) Web GUI 右下角的 **Minecraft 主题桌面宠物**——史蒂夫（Steve）、苦力怕（Creeper）与奥特曼（Ultraman），根据当前 Agent 的工作状态实时切换动作，并在任务完成时播放专属音效。

> A Minecraft-themed desktop pet in the bottom-right corner of the DSH Web GUI — Steve, Creeper and Ultraman react to the agent's working status with animations and per-pet completion sounds.

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
├── src/
│   ├── host.js        # Host 半：Agent 状态跟踪 + Client 私有 RPC
│   └── client.js      # Client 半：宠物 UI / 动画 / 音效 / 交互
└── audio/
    ├── generate.js    # 音效生成脚本（8-bit PCM WAV 程序化合成）
    ├── steve.wav
    ├── ultraman.wav
    └── creeper.wav
```

## 截图 / 演示 Screenshots

> 推荐用 [ScreenToGif](https://www.screentogif.com/) 或 OBS 录制宠物在「待机 / 工作 / 完成」三态下的动图，
> 放入 `assets/` 目录，并在下方以 Markdown 图片引用。

<!-- 示例：
![demo](assets/demo.gif)
-->

## 如何安装 Install

本插件是一个 **Cordis 动态插件（Dynamic Cordis Plugin）**，由「Host 半」和「Client 半」组成。

1. 在 DSH Web GUI 中，将 `src/host.js` 里 `createHostHalf()` 返回的 `{ ... }` 作为 Host 代码（`code.host`），
   将 `src/client.js` 里 `createClientHalf()` 返回的 `{ ... }` 作为 Client 代码（`code.client`）。
2. 通过 `cordis_define` 定义插件，再用 `cordis_run` 激活。
3. 首次使用前，在菜单里点一次「🔊 试听音效」以「预热」浏览器的音频自动播放。

> 这两个文件为了可读性被包装成了 `module.exports` 工厂函数；实际作为动态插件使用时，
> 直接取函数体内 `return { ... }` 的部分即可（`host.js` / `client.js` 的 `return` 行到结尾大括号）。

## 技术实现 Implementation

- **状态来源（Host）**：监听 `agent/status` 事件（`idle ⇄ running`），按 Agent id 精确计数，避免子代理干扰；
  通过 `get-status` 私有 RPC 边沿触发「已完成」。
- **渲染（Client）**：注册到 `shell.overlay` 槽位，用纯 `React.createElement` + 内联 SVG 绘制像素画/矢量宠物。
- **动画**：`styles.insert` 注入 CSS keyframes，对 SVG `<g>` 局部元素（镐子、手臂、腿）做 transform 动画。
- **音效**：客户端没有 `AudioContext`/`fetch`/文件访问，因此用纯 JS 程序化合成 8-bit PCM WAV 数据 URI，
  渲染 `<audio>` 元素播放；`audio/generate.js` 用同一套合成算法生成可试听的 `.wav` 交付物。

## License

[MIT](./LICENSE)
