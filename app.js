// ============================================================
// 状态与初始化
// ============================================================

// ============================================================
// Prompt 模板系统
// ============================================================

const BASE_PROMPT = `你是一位资深的人力资源专家和简历优化顾问。请对用户提供的简历进行全面分析和优化建议。

请按以下结构输出你的分析：

## 总体评价
对简历的整体质量给出简短评价（2-3句话），并给出1-10的评分。

## 优点
列出简历中做得好的地方（3-5条）。

## 需要改进的地方
列出主要问题，每条包含：
- 具体问题描述
- 为什么这是个问题
- 具体的修改建议

## 优化后的简历
基于以上分析，给出完整的优化后简历文本。保留原有信息，但改进表达、结构和格式。

## 额外建议
针对求职的通用建议（2-3条）。

注意事项：
- 使用 STAR 法则优化工作经历描述
- 量化成果（用数字说话）
- 确保关键词对 ATS（简历筛选系统）友好
- 保持简洁，去除冗余信息
- 输出使用与简历相同的语言`;

const EXPERIENCE_PROMPTS = {
  '应届生': '【经验维度】该候选人为应届毕业生。重点关注教育背景、实习经历、校园项目、技能证书、社团活动。弱化工作经验要求，强调潜力和学习能力。建议简历控制在1页以内。',
  '1-3年': '【经验维度】该候选人有1-3年工作经验。重点关注核心技能成长、项目贡献、可量化的工作成果。适度保留教育背景，突出从初级到独当一面的成长轨迹。',
  '3-5年': '【经验维度】该候选人有3-5年工作经验。重点关注专业深度、独立负责的项目、带来的业务价值。弱化教育背景篇幅，强调行业经验和专业技能。',
  '5年以上': '【经验维度】该候选人有5年以上工作经验。重点关注战略视角、团队管理、行业影响力、标志性成就。教育背景精简，突出领导力和决策能力。'
};

const INDUSTRY_PROMPTS = {
  '互联网/科技': '【行业维度】目标行业为互联网/科技。关注技术栈、架构设计、性能优化数据、用户增长指标、敏捷开发经验。',
  '金融/银行': '【行业维度】目标行业为金融/银行。关注合规经验、风控能力、AUM/业绩指标、专业资质（CFA/CPA等）。',
  '外贸/跨境电商': '【行业维度】目标行业为外贸/跨境电商。关注语言能力、客户开发数量、成交额、市场开拓经验、平台运营数据。',
  '教育/培训': '【行业维度】目标行业为教育/培训。关注教学成果、学生评价、课程开发、教研成果。',
  '制造业/工程': '【行业维度】目标行业为制造业/工程。关注项目规模、成本控制、质量指标、安全记录、专业认证。',
  '医疗/生物': '【行业维度】目标行业为医疗/生物。关注临床/研究经验、论文发表、专利、执业资格。'
};

const ROLE_PROMPTS = {
  '产品经理': '【岗位维度】目标岗位为产品经理。关注需求分析能力、用户研究方法、数据驱动决策、跨部门协作经验、产品上线成果（DAU/转化率等指标）、原型工具使用。',
  'Java开发工程师': '【岗位维度】目标岗位为Java开发工程师。关注Java技术栈深度（Spring/MyBatis/微服务等）、系统设计能力、高并发/高可用经验、性能优化案例、代码质量意识。',
  'iOS开发工程师': '【岗位维度】目标岗位为iOS开发工程师。关注Swift/ObjC技能、UIKit/SwiftUI经验、App Store上线经历、性能调优、架构模式（MVVM/VIPER等）、苹果生态工具链。'
};

const JD_PROMPT_ADDON = `

用户同时提供了目标职位描述（JD），请在原有分析基础上增加以下内容：

## JD 匹配度分析
- 匹配度评分（1-10）及简要理由
- 简历中与 JD 匹配的关键技能/经验（逐条列出）
- JD 要求但简历中缺失或薄弱的部分（逐条列出）
- 针对该职位的定向优化建议（3-5条）`;

function buildSystemPrompt(experience, industry, role) {
  const expPart = EXPERIENCE_PROMPTS[experience] || '';
  const indPart = INDUSTRY_PROMPTS[industry]
    || `【行业维度】目标行业为${industry}。请根据该行业的特点，判断关键评价标准并给出针对性建议。`;
  let prompt = BASE_PROMPT + '\n\n' + expPart + '\n\n' + indPart;
  if (role) {
    const rolePart = ROLE_PROMPTS[role]
      || `【岗位维度】目标岗位为${role}。请根据该岗位的特点，判断关键评价标准并给出针对性建议。`;
    prompt += '\n\n' + rolePart;
  }
  return prompt;
}

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

let parsedText = '';
let rawResultText = '';

// 初始化
function init() {
  // 恢复 API Key
  const savedKey = localStorage.getItem('deepseek-api-key');
  if (savedKey) apiKeyInput.value = savedKey;

  // API Key 变化时保存
  apiKeyInput.addEventListener('input', () => {
    localStorage.setItem('deepseek-api-key', apiKeyInput.value.trim());
    updateOptimizeBtn();
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

  // 初始化 pdf.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
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
    showToast('请先输入 DeepSeek API Key');
    return;
  }
  if (!parsedText) {
    showToast('请先上传简历文件');
    return;
  }

  // UI 状态
  optimizeBtn.disabled = true;
  loading.hidden = false;
  resultSection.hidden = true;
  resultSection.classList.remove('show');
  resultContent.innerHTML = '';
  rawResultText = '';

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

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('API Key 无效，请检查');
      if (response.status === 429) throw new Error('请求过于频繁，请稍后再试');
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
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            rawResultText += delta;
            resultContent.innerHTML = marked.parse(rawResultText);
            // 自动滚动到底部
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        } catch (e) {
          // 忽略解析错误，继续处理下一行
        }
      }
    }
  } catch (err) {
    showToast(err.message || '网络连接失败');
    loading.hidden = true;
  } finally {
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
