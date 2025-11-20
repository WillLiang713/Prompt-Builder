#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const defaults = {
  apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen3-max',
  apiKey: '',
};

function resolveConfigValue(envKey, fallback) {
  const value = process.env[envKey];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

const config = {
  apiBase: resolveConfigValue('PROMPT_BUILDER_API_BASE', defaults.apiBase),
  model: resolveConfigValue('PROMPT_BUILDER_MODEL', defaults.model),
  apiKey: resolveConfigValue('PROMPT_BUILDER_API_KEY', defaults.apiKey),
};

const targetPath = path.resolve(__dirname, '..', 'config.js');
const banner = '// 自动生成文件，勿手动编辑；使用 scripts/generate-config.js\n';
const payload = `window.promptBuilderConfig = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(targetPath, banner + payload, 'utf8');
console.log(`config.js 已生成：${targetPath}`);
