<div align="center">
  <img src="MyAIMeter_Logo.png" alt="AI Usage Meter Logo" width="128" height="128">
  
  # AI Usage Meter
  ### ⏰ AI 使用统计插件
  
  *追踪您在 ChatGPT、Gemini 和 Claude 上的使用时间和提问次数*
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![Chrome](https://img.shields.io/badge/Chrome-Extension-green)
  ![License](https://img.shields.io/badge/license-MIT-orange)
</div>

---

## ✨ 功能特点

- ⏱️ **自动计时**：在 ChatGPT、Gemini、Claude 页面自动开始计时
- 💬 **提问统计**：自动记录您的每一次提问
- 📈 **数据可视化**：清晰展示每日使用情况和各平台详情
- 🎯 **智能识别**：离开页面自动停止计时，重新进入继续计时
- 💾 **本地存储**：所有数据保存在本地，保护隐私

## 🚀 安装步骤

### 1. 准备插件图标

由于 Chrome 插件需要图标文件，您需要准备三个尺寸的图标：
- `icons/icon16.png` (16x16 像素)
- `icons/icon48.png` (48x48 像素)
- `icons/icon128.png` (128x128 像素)

您可以：
- 使用在线工具生成图标（搜索 "favicon generator"）
- 使用任何图片编辑软件创建
- 或者暂时使用任意 PNG 图片（虽然可能显示效果不佳）

**快速方法**：访问 https://favicon.io/ 生成图标，选择 "Text" 输入 "AI" 或 "📊"，下载后重命名为对应尺寸。

### 2. 加载插件到 Chrome

1. 打开 Chrome 浏览器
2. 在地址栏输入 `chrome://extensions/` 并回车
3. 在右上角打开「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `MyAIMeter` 文件夹
6. 插件安装完成！

### 3. 固定插件图标（可选）

1. 点击 Chrome 工具栏右侧的拼图图标
2. 找到「AI Usage Meter」
3. 点击图钉图标固定到工具栏

## 📖 使用说明

### 自动追踪

插件会在以下网站自动开始追踪：
- **ChatGPT**: https://chat.openai.com 或 https://chatgpt.com
- **Gemini**: https://gemini.google.com
- **Claude**: https://claude.ai

只需正常使用这些 AI 服务，插件会：
- ✅ 自动计时您的使用时长
- ✅ 自动记录您的提问次数
- ✅ 离开页面时停止计时
- ✅ 返回页面时继续计时

### 查看统计（侧边栏）

点击插件图标，会在浏览器右侧打开侧边栏，显示：
- 📊 今日总使用时间和提问次数（大卡片显示）
- 🤖 各个 AI 平台的详细数据和进度条
- 📈 使用分布条形图
- 🏆 使用最多的平台会高亮显示

侧边栏的优势：
- 🎯 更宽敞的显示空间
- 📊 可以查看更多详细信息
- 🔄 实时自动刷新数据
- 💡 不遮挡主页面内容

### 数据管理

- **🔄 刷新数据**：手动刷新显示的统计信息
- **🗑️ 重置今日数据**：清空当天的所有统计（谨慎使用）

## 🎯 支持的 AI 平台

| 平台 | 网址 | 状态 |
|------|------|------|
| ChatGPT | chat.openai.com, chatgpt.com | ✅ 支持 |
| Gemini | gemini.google.com | ✅ 支持 |
| Claude | claude.ai | ✅ 支持 |

## 💡 工作原理

### 计时机制
1. **页面检测**：使用 Chrome Tabs API 检测当前活动页面
2. **自动计时**：检测到 AI 平台时启动计时器
3. **智能暂停**：切换标签页或失去焦点时自动暂停
4. **继续计时**：返回 AI 平台时自动继续

### 提问检测
1. **DOM 监听**：使用 MutationObserver 监听页面变化
2. **多重策略**：
   - 检测消息元素的增加
   - 监听输入框的提交事件
   - 监听发送按钮的点击
3. **智能识别**：针对不同平台使用不同的检测策略

### 数据存储
- 使用 Chrome Storage API 本地存储
- 按日期组织数据
- 每秒更新一次时间统计
- 实时同步到弹窗界面

## 🔒 隐私说明

- ✅ **完全本地**：所有数据保存在您的浏览器本地
- ✅ **不收集内容**：只统计使用时间和提问次数
- ✅ **不联网**：不会上传任何数据到服务器
- ✅ **开源透明**：所有代码均可审查

## 🛠️ 技术栈

- Chrome Extension Manifest V3
- Vanilla JavaScript (无框架依赖)
- Chrome Storage API
- Chrome Tabs API
- MutationObserver API

## 📁 项目结构

```
MyAIMeter/
├── manifest.json          # 插件配置文件
├── background.js          # 后台服务脚本（计时逻辑）
├── content.js            # 内容脚本（提问检测）
├── sidepanel.html        # 侧边栏界面
├── sidepanel.js          # 侧边栏逻辑
├── sidepanel.css         # 侧边栏样式
├── popup.html            # 弹窗界面（备用）
├── popup.js              # 弹窗逻辑（备用）
├── styles.css            # 弹窗样式（备用）
├── README.md             # 说明文档
└── icons/                # 图标文件夹
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── README.md
```

## 🐛 故障排除

### 插件无法加载
- 确保已启用「开发者模式」
- 检查是否有所有必需的文件
- 查看 Chrome 扩展页面的错误信息

### 计时不准确
- 刷新 AI 平台页面
- 重新加载插件（在 chrome://extensions/ 点击刷新图标）
- 检查浏览器控制台是否有错误

### 提问未被记录
- 确保在支持的 AI 平台上
- 检查是否正确发送了消息
- AI 平台更新可能导致检测失效，需要更新插件

### 缺少图标文件
- 如果暂时没有图标，可以：
  1. 找任意 PNG 图片
  2. 使用图片编辑工具调整为 16x16, 48x48, 128x128
  3. 保存到 `icons/` 文件夹
  4. 重新加载插件

## 🔄 更新日志

### Version 1.0.0 (2024-12-24)
- ✨ 首次发布
- ✅ 支持 ChatGPT、Gemini、Claude 三大平台
- ✅ 自动计时功能
- ✅ 提问统计功能
- ✅ 美观的弹窗界面
- ✅ 数据重置功能

## 📝 开发说明

如果您想修改或扩展此插件：

1. **添加新的 AI 平台**：
   - 在 `background.js` 的 `AI_SITES` 中添加域名
   - 在 `content.js` 中添加相应的检测逻辑
   - 在 `popup.html` 和 `styles.css` 中添加显示卡片

2. **修改界面**：
   - 编辑 `popup.html` 更改布局
   - 编辑 `styles.css` 更改样式
   - 编辑 `popup.js` 更改交互逻辑

3. **调整计时精度**：
   - 在 `background.js` 中修改 `setInterval` 的间隔
   - 注意：更高频率会消耗更多资源

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 自由使用和修改

## 💖 致谢

感谢所有 AI 平台提供优秀的服务，让我们的工作更高效！

---

**注意**：此插件仅供个人使用统计，帮助您了解自己的 AI 使用习惯。请遵守各 AI 平台的使用条款。

