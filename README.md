# Prompt Builder

一款基于 AI 的提示词生成工具，帮助用户将需求描述快速转化为结构化的专业提示词。

## ✨ 功能特性

- **智能生成**：输入需求描述，自动生成包含角色设定、背景目标、执行流程等完整结构的专业提示词
- **实时预览**：流式响应实时展示生成内容
- **深浅主题**：支持深色/浅色模式切换，跟随系统偏好
- **一键复制**：快速复制生成的提示词到剪贴板
- **完整预览**：模态框全屏预览生成结果

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/WillLiang713/Prompt-Builder.git
cd Prompt-Builder
```

### 2. 配置 API Key

复制配置示例文件并填入你的 API Key：

```bash
cp config.example.js config.js
```

编辑 `config.js`，填入你的阿里云通义千问 API Key：

```javascript
window.promptBuilderConfig = {
  apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen3-max',
  apiKey: '你的API Key',
};
```

或者使用环境变量生成配置文件：

```bash
export PROMPT_BUILDER_API_KEY="你的API Key"
node scripts/generate-config.js
```

### 3. 启动项目

由于是纯前端项目，可以直接用浏览器打开 `index.html`，或使用任意静态服务器：

```bash
# 使用 Python
python3 -m http.server 8080

# 或使用 Node.js 的 serve
npx serve .
```

然后访问 `http://localhost:8080` 即可。

## 📁 项目结构

```
Prompt-Builder/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 主逻辑脚本
├── config.example.js   # 配置示例文件
├── config.js           # 实际配置文件（需自行创建，已被 .gitignore 忽略）
└── scripts/
    └── generate-config.js  # 配置生成脚本
```

## 🎯 使用方法

1. 在左侧输入区填写你的需求描述
2. 点击「开始生成」按钮
3. 右侧预览区将实时展示生成的结构化提示词
4. 点击「复制」按钮将结果复制到剪贴板
5. 点击预览图标可全屏查看完整内容

## ⚙️ 配置说明

| 配置项 | 环境变量 | 说明 |
|--------|----------|------|
| `apiBase` | `PROMPT_BUILDER_API_BASE` | API 基础地址，默认使用阿里云通义千问 |
| `model` | `PROMPT_BUILDER_MODEL` | 模型名称，默认 `qwen3-max` |
| `apiKey` | `PROMPT_BUILDER_API_KEY` | API 密钥（必填） |

## 📄 许可证

MIT License
