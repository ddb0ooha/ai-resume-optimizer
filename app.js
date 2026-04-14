// ============================================================
// Provider configuration
// ============================================================

const PROVIDERS = {
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    placeholder: 'DeepSeek API Key',
    storageKey: 'deepseek-api-key',
    buildFetch(apiKey, systemPrompt, userContent, signal) {
      return {
        url: 'https://api.deepseek.com/chat/completions',
        options: {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            stream: true, temperature: 0.7, max_tokens: 8192
          })
        }
      };
    },
    extractDelta: (json) => json.choices?.[0]?.delta?.content ?? ''
  },

  kimi: {
    id: 'kimi',
    label: 'Kimi',
    placeholder: 'Moonshot API Key',
    storageKey: 'kimi-api-key',
    buildFetch(apiKey, systemPrompt, userContent, signal) {
      return {
        url: 'https://api.moonshot.cn/v1/chat/completions',
        options: {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'moonshot-v1-32k',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            stream: true, temperature: 0.7, max_tokens: 8192
          })
        }
      };
    },
    extractDelta: (json) => json.choices?.[0]?.delta?.content ?? ''
  },

  gemini: {
    id: 'gemini',
    label: 'Gemini',
    placeholder: 'Google AI API Key',
    storageKey: 'gemini-api-key',
    buildFetch(apiKey, systemPrompt, userContent, signal) {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
        options: {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: userContent }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
          })
        }
      };
    },
    extractDelta: (json) => json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }
};

// ============================================================
// 状态与初始化
// ============================================================

// Prompts are defined in prompts.js, loaded before this file.

// ============================================================
// DOM 引用
const apiKeyInput = document.getElementById('api-key');
const toggleKeyBtn = document.getElementById('toggle-key');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file');
const previewSection = document.getElementById('preview-section');
const previewText = document.getElementById('preview-text');
const optimizeBtn = document.getElementById('optimize-btn');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('result-section');
const resultContent = document.getElementById('result-content');
const copyBtn = document.getElementById('copy-btn');
const experienceSelect = document.getElementById('experience-select');
const industrySelect = document.getElementById('industry-select');
const customIndustryRow = document.getElementById('custom-industry-row');
const customIndustryInput = document.getElementById('custom-industry');
const roleRow = document.getElementById('role-row');
const roleSelect = document.getElementById('role-select');
const customRoleRow = document.getElementById('custom-role-row');
const customRoleInput = document.getElementById('custom-role');
const jdInput = document.getElementById('jd-input');
const exportBtn = document.getElementById('export-btn');
const cancelBtn = document.getElementById('cancel-btn');
const loadingText = document.getElementById('loading-text');
const resumeEditorSection = document.getElementById('resume-editor-section');
const resumeEditor = document.getElementById('resume-editor');
const copyResumeBtn = document.getElementById('copy-resume-btn');
const generateVisualBtn = document.getElementById('generate-visual-btn');

let parsedText = '';
let rawResultText = '';
let currentController = null;
let currentProvider = PROVIDERS.deepseek;

// ============================================================
// 评分解析与渲染
// ============================================================

const SCORE_DIMS = [
  { key: 'completeness',    label: '内容完整度', pattern: /内容完整度[:：]\s*(\d+(?:\.\d+)?)\/10/ },
  { key: 'quantification',  label: '成果量化度', pattern: /成果量化度[:：]\s*(\d+(?:\.\d+)?)\/10/ },
  { key: 'structure',       label: '结构清晰度', pattern: /结构清晰度[:：]\s*(\d+(?:\.\d+)?)\/10/ },
  { key: 'expression',      label: '表达专业度', pattern: /表达专业度[:：]\s*(\d+(?:\.\d+)?)\/10/ },
  { key: 'ats',             label: 'ATS友好度',  pattern: /ATS友好度[:：]\s*(\d+(?:\.\d+)?)\/10/  }
];

function parseScores(text) {
  const scores = {};
  const totalMatch = text.match(/总分[:：]\s*(\d+(?:\.\d+)?)\/10/);
  if (totalMatch) scores.total = parseFloat(totalMatch[1]);
  for (const dim of SCORE_DIMS) {
    const m = text.match(dim.pattern);
    if (m) scores[dim.key] = parseFloat(m[1]);
  }
  return Object.keys(scores).length >= 4 ? scores : null;
}

function scoreColorClass(val, prefix) {
  if (val >= 8) return prefix + 'green';
  if (val >= 6) return prefix + 'amber';
  return prefix + 'red';
}

function renderScoreCard(scores) {
  const card = document.getElementById('score-card');
  if (!card || !scores) return;

  const total = scores.total ?? 0;
  const numEl = document.getElementById('score-number');
  numEl.textContent = total;
  numEl.className = 'score-number ' + scoreColorClass(total, 'score-');

  const dimsEl = document.getElementById('score-dims');
  dimsEl.innerHTML = SCORE_DIMS.map(dim => {
    const val = scores[dim.key] ?? 0;
    const barClass = scoreColorClass(val, 'bar-');
    return `<div class="score-dim">
      <div class="score-dim-header">
        <span class="score-dim-label">${dim.label}</span>
        <span class="score-dim-value">${val}/10</span>
      </div>
      <div class="score-bar-bg">
        <div class="score-bar ${barClass}" style="width:0%" data-target="${val * 10}%"></div>
      </div>
    </div>`;
  }).join('');

  card.hidden = false;

  // Trigger bar animations after layout
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dimsEl.querySelectorAll('.score-bar').forEach(bar => {
        bar.style.width = bar.dataset.target;
      });
    });
  });
}

// Strip score section from rendered markdown (shown in visual card instead)
function stripScoreSection(text) {
  return text.replace(/\n*##\s*评分总览[\s\S]*$/, '').trim();
}

// Extract "优化后的简历" into a separate editable block; return the rest as analysis
function splitResultSections(text) {
  const noScore = stripScoreSection(text);

  const startMatch = noScore.match(/\n##\s*优化后的简历\s*\n/);
  if (!startMatch) return { analysis: noScore, resume: null };

  const contentStart = startMatch.index + startMatch[0].length;
  const afterHeading = noScore.slice(contentStart);

  // Locate next analysis section boundary; do not stop at ## inside resume content
  const endMatch = afterHeading.match(/\n##\s*额外建议/);
  const resumeContent = (endMatch ? afterHeading.slice(0, endMatch.index) : afterHeading).trim();

  const analysis = (
    noScore.slice(0, startMatch.index) +
    (endMatch ? afterHeading.slice(endMatch.index) : '')
  ).trim();

  return { analysis, resume: resumeContent || null };
}

function renderFinalResult() {
  const { analysis, resume } = splitResultSections(rawResultText);
  resultContent.innerHTML = marked.parse(analysis);

  if (resume) {
    resumeEditor.value = resume;
    resumeEditorSection.hidden = false;
    // Auto-size textarea to content
    resumeEditor.style.height = 'auto';
    resumeEditor.style.height = resumeEditor.scrollHeight + 'px';
  }

  renderScoreCard(parseScores(rawResultText));
}

// 初始化
function init() {
  // Restore last-used provider and its API key
  const savedProviderId = localStorage.getItem('current-provider') || 'deepseek';
  loadProvider(PROVIDERS[savedProviderId] || PROVIDERS.deepseek);

  // Save key on input
  apiKeyInput.addEventListener('input', () => {
    localStorage.setItem(currentProvider.storageKey, apiKeyInput.value.trim());
    updateOptimizeBtn();
  });

  // Provider pill clicks
  document.querySelectorAll('.provider-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem(currentProvider.storageKey, apiKeyInput.value.trim());
      localStorage.setItem('current-provider', btn.dataset.provider);
      loadProvider(PROVIDERS[btn.dataset.provider]);
    });
  });

  // 显示/隐藏 API Key
  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
  });

  // 文件上传 - 点击 & 键盘
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  // 文件上传 - 拖拽
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });

  // 移除文件
  removeFileBtn.addEventListener('click', clearFile);

  // 开始优化
  optimizeBtn.addEventListener('click', startOptimize);

  // 行业选择 - 控制"其他"输入框和岗位行
  industrySelect.addEventListener('change', () => {
    const isOther = industrySelect.value === '其他';
    const isIT = industrySelect.value === '互联网/科技';
    customIndustryRow.hidden = !isOther;
    roleRow.hidden = !isIT;
    // 切离互联网时隐藏自定义岗位输入框
    if (!isIT) customRoleRow.hidden = true;
  });

  // 岗位选择 - "其他"时显示输入框
  roleSelect.addEventListener('change', () => {
    customRoleRow.hidden = roleSelect.value !== '其他';
  });

  // JD 输入 - 动态更新按钮文案
  jdInput.addEventListener('input', () => {
    optimizeBtn.textContent = jdInput.value.trim() ? '开始匹配优化' : '开始优化';
  });

  // 复制结果
  copyBtn.addEventListener('click', copyResult);

  // 导出结果
  exportBtn.addEventListener('click', exportResult);

  // 取消分析
  cancelBtn.addEventListener('click', () => {
    if (currentController) currentController.abort('cancel');
  });

  // 复制优化简历
  copyResumeBtn.addEventListener('click', () => {
    const text = resumeEditor.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('简历已复制到剪贴板', 'success');
    });
  });

  // Auto-resize resume editor on input
  resumeEditor.addEventListener('input', () => {
    resumeEditor.style.height = 'auto';
    resumeEditor.style.height = resumeEditor.scrollHeight + 'px';
  });

  // Generate visual resume
  generateVisualBtn.addEventListener('click', () => {
    openResumeForm(resumeEditor.value);
  });

  initResumeForm();

  // CDN 库加载检测
  if (typeof pdfjsLib === 'undefined') showToast('PDF.js 加载失败，PDF 解析不可用');
  if (typeof mammoth === 'undefined') showToast('Mammoth.js 加载失败，DOCX 解析不可用');
  if (typeof marked === 'undefined') showToast('Marked.js 加载失败，结果渲染可能异常');

  // 初始化 pdf.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

function loadProvider(provider) {
  currentProvider = provider;
  apiKeyInput.placeholder = provider.placeholder;
  apiKeyInput.value = localStorage.getItem(provider.storageKey) || '';
  document.querySelectorAll('.provider-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === provider.id);
  });
  updateOptimizeBtn();
}

function updateOptimizeBtn() {
  optimizeBtn.disabled = !(apiKeyInput.value.trim() && parsedText);
}

// ============================================================
// 文件解析
// ============================================================

async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const supported = ['pdf', 'docx', 'md', 'txt'];

  if (!supported.includes(ext)) {
    showToast('不支持的文件格式，请上传 PDF / DOCX / MD / TXT 文件');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('文件过大，请上传不超过 10MB 的文件');
    return;
  }

  // 显示文件名
  fileName.textContent = file.name;
  fileInfo.hidden = false;
  dropZone.style.display = 'none';

  try {
    parsedText = await parseFile(file, ext);
    previewText.textContent = parsedText.slice(0, 2000) + (parsedText.length > 2000 ? '\n...(内容已截断)' : '');
    previewSection.hidden = false;
    updateOptimizeBtn();
  } catch (err) {
    showToast('文件解析失败: ' + err.message);
    clearFile();
  }
}

async function parseFile(file, ext) {
  if (ext === 'txt' || ext === 'md') {
    return await file.text();
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text.trim();
  }

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error('不支持的文件格式');
}

function clearFile() {
  parsedText = '';
  fileInput.value = '';
  fileInfo.hidden = true;
  previewSection.hidden = true;
  dropZone.style.display = '';
  updateOptimizeBtn();
}

// ============================================================
// DeepSeek API 调用
// ============================================================

async function startOptimize() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showToast(`请先输入 ${currentProvider.label} API Key`);
    return;
  }
  if (!parsedText) {
    showToast('请先上传简历文件');
    return;
  }

  // UI 状态
  optimizeBtn.disabled = true;
  loading.hidden = false;
  loadingText.textContent = 'AI 正在分析你的简历...';
  resultSection.hidden = true;
  resultSection.classList.remove('show');
  resultContent.innerHTML = '';
  rawResultText = '';
  resumeEditorSection.hidden = true;
  resumeEditor.value = '';
  const scoreCard = document.getElementById('score-card');
  if (scoreCard) scoreCard.hidden = true;

  try {
    // 构建 prompt
    const jdText = jdInput.value.trim();
    let systemPrompt = buildSystemPrompt(
      experienceSelect.value,
      industrySelect.value === '其他' ? (customIndustryInput.value.trim() || '通用') : industrySelect.value,
      industrySelect.value === '互联网/科技'
        ? (roleSelect.value === '其他' ? (customRoleInput.value.trim() || '') : roleSelect.value)
        : ''
    );
    if (jdText) systemPrompt += JD_PROMPT_ADDON;

    const userContent = jdText
      ? `请优化以下简历：\n\n${parsedText}\n\n---\n\n目标职位描述：\n\n${jdText}`
      : `请优化以下简历：\n\n${parsedText}`;

    const controller = new AbortController();
    currentController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      const { url, options } = currentProvider.buildFetch(apiKey, systemPrompt, userContent, controller.signal);
      response = await fetch(url, options);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        if (controller.signal.reason === 'cancel') throw new Error('__CANCEL__');
        throw new Error('请求超时，请检查网络后重试');
      }
      throw new Error('网络连接失败，请检查网络后重试');
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) throw new Error('API Key 无效，请检查');
      if (response.status === 429) throw new Error('请求过于频繁，请稍后再试');
      if (response.status === 500) throw new Error(`${currentProvider.label} 服务异常，请稍后重试`);
      if (response.status === 503) throw new Error(`${currentProvider.label} 服务暂时不可用，请稍后重试`);
      throw new Error(`请求失败 (${response.status})`);
    }

    // 显示结果区
    resultSection.hidden = false;
    resultSection.classList.add('show');
    loading.hidden = true;

    // 流式读取
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留不完整的行

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const json = JSON.parse(data);
            const delta = currentProvider.extractDelta(json);
            if (delta) {
              rawResultText += delta;
              resultContent.innerHTML = marked.parse(stripScoreSection(rawResultText));
              loadingText.textContent = `AI 正在分析...（已接收 ${rawResultText.length} 字）`;
              const rp = document.getElementById('right-panel');
              if (rp) rp.scrollTop = rp.scrollHeight;
            }
          } catch (e) {
            // 忽略单行解析错误，继续处理下一行
          }
        }
      }
    } catch (streamErr) {
      const isCancelled = controller.signal.aborted && controller.signal.reason === 'cancel';
      if (rawResultText.trim()) {
        showToast(isCancelled ? '分析已取消，以下为部分结果' : '接收数据中断，以下为已收到的部分结果');
      } else {
        throw new Error(isCancelled ? '__CANCEL__' : '接收数据中断，请重试');
      }
    }

    if (!rawResultText.trim()) {
      throw new Error('未收到 AI 响应内容，请重试');
    }

    renderFinalResult();
  } catch (err) {
    if (err.message !== '__CANCEL__') {
      showToast(err.message || '发生未知错误，请重试');
    }
    loading.hidden = true;
  } finally {
    currentController = null;
    optimizeBtn.disabled = false;
    loading.hidden = true;
  }
}

// ============================================================
// UI 工具
// ============================================================

function copyResult() {
  if (!rawResultText) return;
  navigator.clipboard.writeText(rawResultText).then(() => {
    showToast('已复制到剪贴板', 'success');
  });
}

function exportResult() {
  if (!rawResultText) return;
  const blob = new Blob([rawResultText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '简历优化建议.md';
  a.click();
  URL.revokeObjectURL(url);
}

function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'success' ? ' toast-success' : '');
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// 启动
init();
