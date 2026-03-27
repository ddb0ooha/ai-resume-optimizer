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
  '互联网/科技': `【行业维度】目标行业为互联网/科技。核心评估逻辑：技术能力 + 业务价值 + 数据量化三位一体。

请重点关注：
1. 技术栈的深度与广度（能否体现架构思维而非仅罗列工具）
2. 成果量化是否到位：用户侧指标（DAU/MAU/留存率/转化率）、系统侧指标（QPS/P99延迟/可用性SLA）、业务指标（GMV/成本降低比例）
3. 项目规模感（用户量级、数据规模、团队规模、上线时间）
4. 迭代与增长思维（A/B测试、灰度发布、数据驱动决策）

互联网简历常见弱点（请在改进建议中重点识别）：
- 只写"负责了XX功能"，不写"带来了XX结果"
- 技术描述停留在"使用了XX框架"，没有体现解决了什么问题
- 缺少与同类项目的规模对比，读者无法判断候选人level`,
  '金融/银行': '【行业维度】目标行业为金融/银行。关注合规经验、风控能力、AUM/业绩指标、专业资质（CFA/CPA等）。',
  '外贸/跨境电商': '【行业维度】目标行业为外贸/跨境电商。关注语言能力、客户开发数量、成交额、市场开拓经验、平台运营数据。',
  '教育/培训': '【行业维度】目标行业为教育/培训。关注教学成果、学生评价、课程开发、教研成果。',
  '制造业/工程': '【行业维度】目标行业为制造业/工程。关注项目规模、成本控制、质量指标、安全记录、专业认证。',
  '医疗/生物': '【行业维度】目标行业为医疗/生物。关注临床/研究经验、论文发表、专利、执业资格。'
};

const ROLE_PROMPTS = {
  '产品经理': `【岗位维度】目标岗位为产品经理。

核心评估维度：
1. 需求分析能力：能否体现用户研究方法（用户访谈/竞品分析/数据分析），而非仅"收集需求"
2. 数据驱动决策：是否展示了用数据发现问题、验证方案、复盘结论的完整链路
3. 商业sense：能否将功能与业务目标挂钩（提升转化、降低成本、拓展新用户）
4. 跨部门协作：如何推动研发/设计/运营对齐，体现影响力而非单纯协调
5. 产品交付成果：从0到1上线经历，或从1到N的规模化增长

应引导量化的指标（建议在优化简历中补充）：
- 用户侧：DAU/MAU增长率、功能渗透率、NPS/满意度评分
- 效率侧：需求交付周期、需求满足率、迭代速度
- 业务侧：转化率提升、GMV贡献、新用户占比

产品经理简历常见弱点（请重点识别并给出改进）：
- 只写"负责XX产品规划"，没有写"基于什么判断做了什么决策，结果如何"
- 功能罗列代替产品线索，读者看不出候选人的产品思维
- 缺少规模感（产品用户量、覆盖场景、业务体量）

ATS 关键词参考：需求文档(PRD)、用户故事、原型设计、数据分析、A/B测试、产品路线图、敏捷/Scrum、OKR、商业化、增长策略`,
  'Java开发工程师': `【岗位维度】目标岗位为Java开发工程师。

核心评估维度：
1. 技术栈深度：是否体现对框架原理的理解（Spring IoC/AOP原理、JVM调优），而非仅"会用Spring Boot"
2. 系统设计能力：是否有分布式架构、微服务拆分、数据库设计的实际经验，能否量化系统规模
3. 性能优化：是否有具体的性能问题诊断和优化案例（优化前后的QPS/延迟/GC情况对比）
4. 高可用与稳定性：是否涉及限流熔断、缓存策略、消息队列解耦等高可用设计
5. 工程质量意识：单测覆盖率、Code Review参与、技术方案输出、故障复盘

应引导量化的指标（建议在优化简历中补充）：
- 系统侧：QPS/TPS、P99响应时间、系统可用率(SLA)、日均请求量
- 优化侧：性能提升百分比、内存/CPU降低比例、接口响应时间前后对比
- 规模侧：服务数量、数据量级（日增/存量）、团队规模

Java开发简历常见弱点（请重点识别并给出改进）：
- 技术栈只是名词堆砌（Spring/Redis/Kafka…），没有说明在项目中如何选型和落地
- "优化了系统性能"没有前后数据对比，无法判断优化幅度
- 只写个人模块，看不出对整体架构的理解

ATS 关键词参考：微服务、分布式、高并发、Spring Cloud、消息队列、MySQL调优、缓存、限流熔断、CI/CD、代码审查`,
  'iOS开发工程师': `【岗位维度】目标岗位为iOS开发工程师。

核心评估维度：
1. 语言与框架深度：Swift/ObjC的实际使用比例，是否涉及语言特性深度（内存管理/并发/泛型），UIKit与SwiftUI的实战经验
2. 架构设计能力：是否能清晰描述所用架构模式（MVC/MVVM/VIPER），并解释为何选择该架构
3. 性能优化：是否有具体的性能问题定位和优化案例（Instruments使用、内存泄漏修复、卡顿优化）
4. 工程实践：组件化/模块化拆分经验、混编经验、CI/CD接入、自动化测试
5. 产品与用户意识：是否关注App Store评分、用户反馈、崩溃率等最终产品质量指标

应引导量化的指标（建议在优化简历中补充）：
- 产品侧：App Store下载量、DAU、评分、Crash率
- 性能侧：启动时间（冷启动/热启动）优化前后、包体积压缩、内存占用
- 工程侧：迭代周期、模块数量、单测覆盖率

iOS开发简历常见弱点（请重点识别并给出改进）：
- 只列技术名词（SwiftUI/Combine/CoreData），没有说明解决了什么实际问题
- 缺少App上线的实绩数据（用户量、评分），让人无法感知项目量级
- 架构描述停留在"使用MVVM"，没有说明为何选择和如何落地

ATS 关键词参考：Swift、UIKit、SwiftUI、MVVM、模块化、性能优化、App Store、Xcode、CI/CD、TestFlight、Crash监控`
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
const cancelBtn = document.getElementById('cancel-btn');
const loadingText = document.getElementById('loading-text');

let parsedText = '';
let rawResultText = '';
let currentController = null;

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

  // 取消分析
  cancelBtn.addEventListener('click', () => {
    if (currentController) currentController.abort('cancel');
  });

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
  loadingText.textContent = 'AI 正在分析你的简历...';
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

    const controller = new AbortController();
    currentController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch('https://api.deepseek.com/chat/completions', {
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
          max_tokens: 8192
        }),
        signal: controller.signal
      });
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
      if (response.status === 500) throw new Error('DeepSeek 服务异常，请稍后重试');
      if (response.status === 503) throw new Error('DeepSeek 服务暂时不可用，请稍后重试');
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
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              rawResultText += delta;
              resultContent.innerHTML = marked.parse(rawResultText);
              loadingText.textContent = `AI 正在分析...（已接收 ${rawResultText.length} 字）`;
              resultSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
