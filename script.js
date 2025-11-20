const template = `## 角色定位
我是与OpenAI首席提示词工程师比肩的顶级专家，精通「重新生成」与「提示词优化」两种核心模式，始终以第一人称视角交付专业级提示词。

## 工作模式
- **重新生成**：精准提炼需求，构建全新结构化专业提示词
- **提示词优化**：深度分析原提示词，保留核心意图，以更专业结构重构

## 核心要素
- 任务目标：
- 预期成果：
- 关键要求：
- 原提示词分析（若无原始提示词，写“新构建提示词”）：

## 专业提示词框架
### 角色设定
[用第一人称的角色自述，明确专业背景与主要使命]
### 背景与目标
[说明场景与最终要实现的结果]
### 执行流程
1. ...
2. ...
### 输出标准
- ...
### 语言风格
- ...
### 专业准则
- ...

## 优化建议
- 可深入的关键点 / 补充信息`;

const outputTemplate = `### 角色设定
[用第一人称的角色自述，明确专业背景与主要使命]
### 背景与目标
[说明场景与最终要实现的结果]
### 执行流程
1. ...
2. ...
### 输出标准
- ...
### 语言风格
- ...
### 专业准则
- ...`;

const defaultApiConfig = {
  apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen3-max',
  apiKey: '',
};

const coreInput = document.getElementById('corePrompt');
const outputEl = document.getElementById('promptOutput');
const statusEl = document.getElementById('statusMessage');
const copyButton = document.getElementById('copyButton');
const generateButton = document.getElementById('generateButton');
const themeToggleButton = document.getElementById('themeToggle');

const idlePreviewText = '输入您的需求，我将为您生成专业级提示词。点击生成按钮即可获得高质量结构化模板。';
const copyButtonDefaultLabel = copyButton?.textContent?.trim() || '复制提示词';
const themeStorageKey = 'promptBuilder.theme';
const themeIcons = {
  light: `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
    <circle cx="12" cy="12" r="4" stroke-width="1.6" fill="none" />
    <path stroke-width="1.6" stroke-linecap="round" fill="none" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.07-6.07-1.41 1.41M7.34 16.66l-1.41 1.41m0-12.02 1.41 1.41m10.32 10.32 1.41 1.41" />
  </svg>`,
  dark: `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
    <path stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M21 15.5A8.5 8.5 0 0 1 8.5 3 9 9 0 1 0 21 15.5Z" />
  </svg>`,
};

let isAiPreview = false;
let isLoading = false;
let copyFeedbackTimer;
let currentTheme = 'light';

function resetForm() {
  coreInput.value = '';
}

function setIdlePreview() {
  if (isLoading) return;
  outputEl.value = idlePreviewText;
}

function copyPrompt() {
  outputEl.select();
  outputEl.setSelectionRange(0, outputEl.value.length);

  const handleSuccess = () => {
    setStatus('专业提示词已成功复制到剪贴板', 'success');
    triggerCopyFeedback();
    setTimeout(() => {
      setStatus('');
    }, 2400);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(outputEl.value)
      .then(handleSuccess)
      .catch(() => fallbackCopy(handleSuccess));
  } else {
    fallbackCopy(handleSuccess);
  }
}

function triggerCopyFeedback() {
  if (!copyButton) return;
  copyButton.dataset.state = 'copied';
  copyButton.textContent = '已复制';
  copyButton.disabled = true;
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    copyButton.dataset.state = 'idle';
    copyButton.textContent = copyButtonDefaultLabel;
    copyButton.disabled = false;
  }, 1400);
}

function fallbackCopy(onSuccess) {
  try {
    document.execCommand('copy');
    onSuccess();
  } catch (err) {
    setStatus('复制遇到问题，请手动选择文本进行复制。', 'error');
  }
}

function setStatus(message, type = 'neutral') {
  statusEl.textContent = message;
  statusEl.dataset.state = type;
}

function setLoading(state, label = '') {
  isLoading = state;
  generateButton.disabled = state;
  if (state) {
    setStatus(label, 'neutral');
  }
}

function buildMessages(mode) {
  const corePrompt = coreInput.value.trim();

  const baseSystemPrompt = `我是一名提示词结构化助手。任务是根据用户输入，在【角色设定】【背景与目标】【执行流程】【输出标准】【语言风格】【专业准则】这些章节中填入内容，保持语言清晰、可执行且符合用户提供的语气。不要自创默认角色或背景，如用户未提供信息，可提示其补充。`;
  const modeDirective =
    mode === 'optimize'
      ? '当前执行【提示词优化】任务。我将深入分析原提示词的核心意图，识别其亮点与改进空间，然后以更清晰、更专业的结构重新构建，确保优化后的提示词更具执行力和专业性。'
      : '当前执行【重新生成】任务。我将精准提炼用户需求中的关键信息，构建全新的结构化提示词，确保其具备专业水准和高度可执行性。';
  const formatHint = `直接返回结构化正文内容，按照以下章节顺序输出，不需要额外的“提示词正文”前缀或系统说明：
${outputTemplate}`;

  const userMessage = corePrompt ? `任务需求：\n${corePrompt}` : '任务需求：\n用户暂无具体需求，我将提供专业的结构化提示词模板以供参考。';

  return [
    { role: 'system', content: `${baseSystemPrompt}\n${modeDirective}\n${formatHint}` },
    { role: 'user', content: userMessage },
  ];
}

async function requestCompletion(mode) {
  if (isLoading) return;

  const { apiBase, apiKey, model } = getApiConfig();

  if (!apiKey) {
    setStatus('请在 config.js 中配置您的 API Key 后再试。', 'error');
    return;
  }

  const payload = {
    model,
    messages: buildMessages(mode),
    temperature: mode === 'optimize' ? 0.3 : 0.7,
    stream: true,
  };

  try {
    isAiPreview = false;
    outputEl.value = '';
    setLoading(true, mode === 'optimize' ? '正在进行专业提示词优化…' : '正在生成专业级提示词…');
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(tryParseError(errorText) || `请求失败（${response.status}）`);
    }

    let streamStarted = false;
    const streamResult = await consumeResponseStream(response, (delta) => {
      if (!delta) return;
      if (!streamStarted) {
        streamStarted = true;
        isAiPreview = true;
      }
      appendStreamingText(delta);
    });

    if (streamResult?.sse) {
      if (!streamStarted) {
        throw new Error('流式接口未返回任何内容，请检查模型或参数。');
      }
      setStatus('专业提示词生成完成，可直接复制使用或继续优化。', 'success');
      return;
    }

    const fallbackText = streamResult?.fallbackText ?? '';
    const aiText = extractMessageFromJson(fallbackText);
    if (!aiText) {
      throw new Error('接口未返回有效内容，请检查模型或参数。');
    }
    isAiPreview = true;
    outputEl.value = aiText;
    setStatus('专业提示词已准备就绪，可直接复制使用或继续优化。', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || '调用模型时出现未知错误。', 'error');
  } finally {
    setLoading(false);
  }
}

function tryParseError(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed.error?.message || text;
  } catch (err) {
    return text;
  }
}

function init() {
  initTheme();
  resetForm();
  setIdlePreview();
  if (copyButton) {
    copyButton.dataset.state = 'idle';
  }

  coreInput.addEventListener('input', () => {
    isAiPreview = false;
    setIdlePreview();
  });

  copyButton.addEventListener('click', copyPrompt);
  generateButton.addEventListener('click', () => requestCompletion('generate'));
}

init();

function initTheme() {
  currentTheme = detectInitialTheme();
  applyTheme(currentTheme);
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      persistThemePreference(currentTheme);
    });
  }
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode', nextTheme === 'dark');
  document.body.classList.toggle('light-mode', nextTheme === 'light');
  updateThemeToggleLabel(nextTheme);
}

function updateThemeToggleLabel(theme) {
  if (!themeToggleButton) return;
  const isDark = theme === 'dark';
  const icon = themeToggleButton.querySelector('.theme-toggle__icon');
  if (icon) {
    icon.innerHTML = isDark ? themeIcons.dark : themeIcons.light;
  }
  themeToggleButton.setAttribute('aria-label', isDark ? '切换为浅色' : '切换为深色');
  themeToggleButton.setAttribute('aria-pressed', isDark ? 'true' : 'false');
}

function detectInitialTheme() {
  const stored = readThemePreference();
  if (stored) return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function persistThemePreference(theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch (err) {
    console.warn('无法保存主题偏好', err);
  }
}

function readThemePreference() {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    return stored === 'dark' || stored === 'light' ? stored : '';
  } catch (err) {
    console.warn('无法读取主题偏好', err);
    return '';
  }
}

function appendStreamingText(text) {
  if (!text) return;
  outputEl.value += text;
  outputEl.scrollTop = outputEl.scrollHeight;
  setStatus('正在生成专业提示词…', 'neutral');
}

function consumeDeltaContent(delta) {
  if (!delta) return '';
  const { content } = delta;
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        if (typeof item.text === 'string') return item.text;
        if (item.text?.value) return item.text.value;
        if (typeof item.content === 'string') return item.content;
        return '';
      })
      .join('');
  }
  return '';
}

async function consumeResponseStream(response, onDelta) {
  const reader = response.body?.getReader();
  if (!reader) {
    return { sse: false, fallbackText: await response.text() };
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fallbackText = '';
  let sawSse = false;

  while (true) {
    const { value, done } = await reader.read();
    const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
    if (!sawSse) {
      fallbackText += chunk;
    }
    buffer += chunk;

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      if (!event) continue;

      const dataLines = event
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s*/, ''));
      if (!dataLines.length) continue;

      sawSse = true;
      const payload = dataLines.join('\n').trim();
      if (!payload || payload === '[DONE]') {
        return { sse: true };
      }
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta;
        const text = consumeDeltaContent(delta);
        if (text) onDelta(text);
      } catch (err) {
        console.error('解析流式数据失败', err, payload);
      }
    }

    if (done) break;
  }

  return sawSse ? { sse: true } : { sse: false, fallbackText };
}

function extractMessageFromJson(text) {
  if (!text) return '';
  try {
    const data = JSON.parse(text);
    const content = data.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (!item) return '';
          if (typeof item === 'string') return item;
          if (typeof item.text === 'string') return item.text;
          if (item.text?.value) return item.text.value;
          if (typeof item.content === 'string') return item.content;
          return '';
        })
        .join('')
        .trim();
    }
    return '';
  } catch (err) {
    console.error('解析 JSON 响应失败', err, text);
    return '';
  }
}

function getApiConfig() {
  const cfg = window.promptBuilderConfig || {};
  const apiBase = (cfg.apiBase || defaultApiConfig.apiBase || '').toString().trim().replace(/\/$/, '');
  const model = (cfg.model || defaultApiConfig.model || '').toString().trim();
  const apiKey = (cfg.apiKey || defaultApiConfig.apiKey || '').toString().trim();
  return { apiBase, model, apiKey };
}
