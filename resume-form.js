// ============================================================
// Resume Visual Form — Markdown parser + Modal logic
// Depends on: templates/classic.js (generateClassicHTML)
// ============================================================

let _avatarDataUrl = '';

// ── Markdown auto-parser ─────────────────────────────────────

function parseMarkdownToFormData(md) {
  const data = {
    name: '', title: '', titleEn: '', experience: '',
    contacts: [], summary: '', jobs: [],
    skillGroups: [], projects: [],
    education: { school: '', degree: '', major: '', date: '' }
  };

  if (!md || !md.trim()) return data;

  // Extract name from first # heading
  const nameMatch = md.match(/^#\s+(.+)/m);
  if (nameMatch) data.name = nameMatch[1].trim();

  // Extract email
  const emailMatch = md.match(/[\w.+-]+@[\w.-]+\.\w+/);
  if (emailMatch) data.contacts.push({ type: 'email', value: emailMatch[0] });

  // Extract GitHub URL
  const githubMatch = md.match(/github\.com\/[\w-]+(?:\/[\w-]+)?/i);
  if (githubMatch) data.contacts.push({ type: 'github', value: githubMatch[0] });

  // Extract phone: Chinese 11-digit mobile, or labeled international number
  const cnPhoneMatch = md.match(/(?<!\d)(1[3-9]\d{9})(?!\d)/);
  const intlPhoneMatch = md.match(/(?:电话|手机|Tel|Phone)[：: ]*(\+\d[\d\s\-]{6,}\d)/);
  const phoneVal = cnPhoneMatch?.[1] || intlPhoneMatch?.[1];
  if (phoneVal) data.contacts.push({ type: 'phone', value: phoneVal.trim() });

  // Extract experience badge text (e.g. "9年工作经验" or "5+ years")
  const expMatch = md.match(/(\d+\+?\s*年[^\n，。,\.]{0,20}经验|[\d+]+\+?\s*[Yy]ears?\s+[Ee]xperience[^\n]{0,30})/);
  if (expMatch) data.experience = expMatch[1].trim();

  // Split into sections by ## headings
  const sections = splitSections(md);

  // Summary
  const summarySection = findSection(sections, ['个人总结', '个人简介', '职业总结', '个人介绍', '概述', 'summary', 'profile', 'about', 'objective']);
  if (summarySection) data.summary = cleanText(summarySection.content);

  // Work experience
  const expSection = findSection(sections, ['工作经历', '工作经验', '职业经历', '职场经历', '工作', 'experience', 'work experience', 'employment']);
  if (expSection) data.jobs = parseJobs(expSection.content);

  // Skills
  const skillSection = findSection(sections, ['技能', '专业技能', '技术栈', '技术能力', '专业能力', '核心能力', '技术', 'skills', 'technical skills']);
  if (skillSection) data.skillGroups = parseSkillGroups(skillSection.content);

  // Projects / Open Source
  const projSection = findSection(sections, ['项目经历', '开源项目', '项目经验', '项目', 'projects', 'open source']);
  if (projSection) data.projects = parseProjects(projSection.content);

  // Education
  const eduSection = findSection(sections, ['教育背景', '教育经历', '教育', '学历', '学习经历', 'education']);
  if (eduSection) data.education = parseEducation(eduSection.content);

  // Try to extract title from second line or after name
  if (!data.title && data.name) {
    const afterName = md.replace(/^#\s+.+\n/, '');
    const titleMatch = afterName.match(/^([^\n#]{2,40})\n/);
    if (titleMatch) {
      const candidate = titleMatch[1].trim().replace(/^[-*>]+\s*/, '');
      if (candidate && !/^[#*\-]/.test(candidate) && candidate.length < 40) {
        data.title = candidate;
      }
    }
  }

  return data;
}

function splitSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;

  // Primary pass: ## headings
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (current) sections.push(current);
      current = { title: h2[1].trim().toLowerCase(), content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);

  // Fallback 1: if no ## sections found, retry with ### headings
  if (sections.length === 0) {
    current = null;
    for (const line of lines) {
      const h3 = line.match(/^###\s+(.+)/);
      if (h3) {
        if (current) sections.push(current);
        current = { title: h3[1].trim().toLowerCase(), content: '' };
      } else if (current) {
        current.content += line + '\n';
      }
    }
    if (current) sections.push(current);
  }

  // Fallback 2: AI sometimes uses **bold standalone lines** as section headers
  // Only treat as section boundary if the bold text matches known resume section keywords
  if (sections.length === 0) {
    const SECTION_RE = /工作经历|工作经验|职业经历|个人总结|个人简介|个人介绍|职业总结|技能|专业技能|技术栈|技术能力|教育背景|教育经历|学历|项目经历|开源项目|联系方式|个人信息|summary|profile|experience|skills|education|projects/i;
    current = null;
    for (const line of lines) {
      // A section-header bold line: entire line is **text** (no pipe, no digits in content)
      const boldLine = line.trim().match(/^\*\*([^*]+)\*\*\s*$/);
      if (boldLine && SECTION_RE.test(boldLine[1])) {
        if (current) sections.push(current);
        current = { title: boldLine[1].trim().toLowerCase(), content: '' };
      } else if (current) {
        current.content += line + '\n';
      }
    }
    if (current) sections.push(current);
  }

  return sections;
}

function findSection(sections, keywords) {
  return sections.find(s =>
    keywords.some(k => s.title.includes(k.toLowerCase()))
  ) || null;
}

function cleanText(text) {
  return text.replace(/^[#*>\-]+\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

function parseJobs(content) {
  const jobs = [];
  // Split by ### headings (each job starts with ###)
  const jobBlocks = content.split(/\n(?=###\s)/);

  for (const block of jobBlocks) {
    if (!block.trim()) continue;

    const job = { companyEn: '', companyCn: '', date: '', positionEn: '', positionCn: '', note: '', bullets: [] };

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

    // First non-empty line or ### heading → company name
    for (const line of lines) {
      const h3 = line.match(/^###\s*(.+)/);
      if (h3) {
        const raw = h3[1].trim();
        // Try to detect Chinese vs English: if has Chinese chars → cn, else → en
        const cnMatch = raw.match(/[\u4e00-\u9fa5]+/);
        const enMatch = raw.match(/[A-Za-z][\w\s]*/);
        if (cnMatch) job.companyCn = raw;
        else if (enMatch) job.companyEn = raw;
        else job.companyCn = raw;
        break;
      }
    }

    // Date pattern
    const dateMatch = block.match(/(20\d{2}[\.\/-年]\d{1,2}[\.\/-月]?\d{0,2}\s*[-–—~至~]\s*(?:20\d{2}[\.\/-年]\d{1,2}[\.\/-月]?\d{0,2}|至今|Present|Now|current))/i);
    if (dateMatch) job.date = dateMatch[1].trim();

    // Position: look for lines with job title keywords or bold text
    for (const line of lines) {
      if (/^[-*#]/.test(line)) continue;
      if (line === job.companyCn || line === job.companyEn) continue;
      if (dateMatch && line.includes(dateMatch[1])) continue;

      const boldMatch = line.match(/^\*\*(.+)\*\*$/) || line.match(/^__(.+)__$/);
      if (boldMatch) {
        const candidate = boldMatch[1];
        if (/经理|工程师|开发|设计|运营|分析|顾问|主管|总监|实习|Manager|Engineer|Developer|Designer|Analyst|Director|Intern/i.test(candidate)) {
          const hasCn = /[\u4e00-\u9fa5]/.test(candidate);
          if (hasCn) job.positionCn = candidate;
          else job.positionEn = candidate;
        }
        continue;
      }

      if (/经理|工程师|开发|设计|运营|分析|顾问|主管|总监|实习/.test(line) && !job.positionCn && line.length < 50) {
        job.positionCn = line;
        continue;
      }
      if (/Manager|Engineer|Developer|Designer|Analyst|Director|Intern/i.test(line) && !job.positionEn && line.length < 60) {
        job.positionEn = line;
        continue;
      }
    }

    // Bullets: lines starting with - or *
    for (const line of lines) {
      const bulletMatch = line.match(/^[-*]\s+(.+)/);
      if (bulletMatch) {
        job.bullets.push(bulletMatch[1].replace(/\*\*(.*?)\*\*/g, '$1').trim());
      }
    }

    if (job.companyCn || job.companyEn || job.bullets.length) {
      jobs.push(job);
    }
  }

  // Fallback 1: bold company format — **Company** | Position | Date
  if (jobs.length === 0) {
    const lines = content.split('\n');
    let cur = null;

    const DATE_RE = /(20\d{2}|19\d{2})[\.\/-年]\d{1,2}[\.\/-月]?\d{0,2}\s*[-–—~至to]\s*(?:20\d{2}[\.\/-年]\d{1,2}[\.\/-月]?\d{0,2}|至今|Present|Now)/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect job header: bold opening + (pipe separator | date | job title keyword)
      const boldStart = trimmed.match(/^\*\*([^*]+)\*\*/);
      if (boldStart && !/^[-*]\s/.test(trimmed)) {
        const hasDate    = DATE_RE.test(trimmed);
        const hasPipe    = /[|｜]/.test(trimmed);
        const hasTitle   = /经理|工程师|开发|设计|运营|分析|顾问|主管|总监|实习|负责人|Manager|Engineer|Developer|Designer|Analyst|Director|Lead|Intern/i.test(trimmed);

        if (hasDate || hasPipe || hasTitle) {
          if (cur) jobs.push(cur);
          cur = { companyEn: '', companyCn: '', date: '', positionEn: '', positionCn: '', note: '', bullets: [] };

          const parts = trimmed.split(/\s*[|｜]\s*/);
          const company = (parts[0] || '').replace(/\*\*/g, '').trim();
          if (/[\u4e00-\u9fa5]/.test(company)) cur.companyCn = company;
          else cur.companyEn = company;

          if (parts[1]) {
            const p = parts[1].trim();
            if (/[\u4e00-\u9fa5]/.test(p)) cur.positionCn = p;
            else cur.positionEn = p;
          }
          if (parts[2]) cur.date = parts[2].trim();

          if (!cur.date) {
            const dm = trimmed.match(DATE_RE);
            if (dm) cur.date = dm[0];
          }
          continue;
        }
      }

      if (cur) {
        const bullet = trimmed.match(/^[-*]\s+(.+)/);
        if (bullet) {
          cur.bullets.push(bullet[1].replace(/\*\*(.*?)\*\*/g, '$1').trim());
        } else if (!boldStart) {
          // Plain position or date line after company header
          const dm = trimmed.match(DATE_RE);
          if (dm && !cur.date) { cur.date = dm[0]; continue; }
          if (/经理|工程师|开发|设计|运营|分析|顾问|主管|总监|Manager|Engineer|Developer/i.test(trimmed) && !cur.positionCn && trimmed.length < 60) {
            if (/[\u4e00-\u9fa5]/.test(trimmed)) cur.positionCn = trimmed.replace(/\*\*/g, '').trim();
          }
        }
      }
    }
    if (cur && (cur.companyCn || cur.companyEn || cur.bullets.length)) jobs.push(cur);
  }

  // Fallback 2: collect all bullet lines into a single block
  if (jobs.length === 0) {
    const bulletLines = content.split('\n').filter(l => /^[-*]\s/.test(l.trim()));
    if (bulletLines.length > 0) {
      jobs.push({
        companyEn: '', companyCn: '', date: '', positionEn: '', positionCn: '', note: '',
        bullets: bulletLines.map(l => l.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim())
      });
    }
  }

  return jobs;
}

function parseSkillGroups(content) {
  const groups = [];
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let currentGroup = null;

  for (const line of lines) {
    // ### or **bold** → group label
    const h3 = line.match(/^###\s+(.+)/);
    const bold = line.match(/^\*\*(.+)\*\*[：:：]?\s*$/);
    if (h3 || bold) {
      if (currentGroup && (currentGroup.tags.length > 0)) groups.push(currentGroup);
      currentGroup = { label: (h3 || bold)[1].trim(), tags: [] };
      continue;
    }

    // Bullet line → tags (comma or ·/、 separated)
    if (/^[-*]\s/.test(line) || /[,，、·]/.test(line)) {
      const raw = line.replace(/^[-*]\s+/, '');
      const tags = raw.split(/[,，、·|｜]+/).map(t => t.replace(/\*\*(.*?)\*\*/g, '$1').trim()).filter(Boolean);
      if (!currentGroup) currentGroup = { label: '', tags: [] };
      currentGroup.tags.push(...tags);
      continue;
    }

    // Plain line with no bullets → could be a label or single skill
    if (line && !currentGroup) {
      currentGroup = { label: line, tags: [] };
    } else if (line && currentGroup && currentGroup.tags.length === 0) {
      // treat as part of label or first tag
      currentGroup.tags.push(line);
    }
  }

  if (currentGroup && (currentGroup.tags.length > 0 || currentGroup.label)) groups.push(currentGroup);
  return groups;
}

function parseProjects(content) {
  const projects = [];
  const blocks = content.split(/\n(?=###\s)/);

  for (const block of blocks) {
    if (!block.trim()) continue;
    const proj = { name: '', desc: '', url: '' };

    const h3 = block.match(/^###\s+(.+)/m);
    if (h3) proj.name = h3[1].trim();

    const urlMatch = block.match(/https?:\/\/[^\s\)]+/);
    if (urlMatch) proj.url = urlMatch[0];

    const descLines = block.split('\n')
      .filter(l => l.trim() && !l.startsWith('###') && !l.includes(proj.url))
      .map(l => l.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim())
      .filter(Boolean);
    if (descLines.length > 0) proj.desc = descLines[0];

    if (proj.name || proj.desc) projects.push(proj);
  }
  return projects;
}

function parseEducation(content) {
  const edu = { school: '', degree: '', major: '', date: '' };
  const lines = content.split('\n').map(l => l.trim().replace(/^[-*#]+\s*/, '')).filter(Boolean);

  for (const line of lines) {
    const dateMatch = line.match(/(20\d{2}|19\d{2})[\s\S]{0,8}(20\d{2}|至今)/);
    if (dateMatch && !edu.date) { edu.date = line; continue; }

    if (!edu.school && /大学|学院|University|College|Institute/i.test(line)) {
      edu.school = line.replace(/\*\*(.*?)\*\*/g, '$1').trim();
      continue;
    }
    if (!edu.degree && /本科|硕士|博士|专科|Bachelor|Master|PhD|Associate/i.test(line)) {
      edu.degree = line.replace(/\*\*(.*?)\*\*/g, '$1').trim();
      continue;
    }
    if (!edu.major && line.length < 40) {
      edu.major = line.replace(/\*\*(.*?)\*\*/g, '$1').trim();
    }
  }
  return edu;
}

// ── Form state ───────────────────────────────────────────────

let _formData = null;

function getOverlay() { return document.getElementById('resume-form-overlay'); }
function getModal()   { return document.getElementById('resume-form-modal'); }

// ── Open / Close ─────────────────────────────────────────────

function openResumeForm(markdownText) {
  _avatarDataUrl = '';
  _formData = parseMarkdownToFormData(markdownText || '');
  renderForm(_formData);
  getOverlay().hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeResumeForm() {
  getOverlay().hidden = true;
  document.body.style.overflow = '';
}

// ── Form rendering ───────────────────────────────────────────

function renderForm(data) {
  // Basic info
  setVal('rf-name', data.name);
  setVal('rf-title', data.title);
  setVal('rf-title-en', data.titleEn);
  setVal('rf-experience', data.experience);
  setVal('rf-summary', data.summary);

  // Contacts
  renderContacts(data.contacts);

  // Jobs
  renderJobs(data.jobs);

  // Skills
  renderSkillGroups(data.skillGroups);

  // Projects
  renderProjects(data.projects);

  // Education
  setVal('rf-edu-school', data.education.school);
  setVal('rf-edu-degree', data.education.degree);
  setVal('rf-edu-major', data.education.major);
  setVal('rf-edu-date', data.education.date);

  // Avatar preview reset
  document.getElementById('rf-avatar-preview').hidden = true;
  document.getElementById('rf-avatar-preview').src = '';
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

// ── Contacts ─────────────────────────────────────────────────

function renderContacts(contacts) {
  const list = document.getElementById('rf-contacts-list');
  list.innerHTML = '';
  const items = contacts.length > 0 ? contacts : [{ type: 'email', value: '' }];
  items.slice(0, 3).forEach((c, i) => addContactRow(c, i));
}

function addContactRow(c = { type: 'email', value: '' }, idx) {
  const list = document.getElementById('rf-contacts-list');
  if (list.children.length >= 3) return;
  const row = document.createElement('div');
  row.className = 'rf-contact-row';
  row.innerHTML = `
    <select class="rf-contact-type">
      ${['email','github','telegram','phone','website'].map(t =>
        `<option value="${t}"${c.type === t ? ' selected' : ''}>${t}</option>`
      ).join('')}
    </select>
    <input type="text" class="rf-contact-value" placeholder="联系方式内容" value="${escAttr(c.value)}">
    <button type="button" class="rf-remove-btn" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}

// ── Jobs ─────────────────────────────────────────────────────

function renderJobs(jobs) {
  const list = document.getElementById('rf-jobs-list');
  list.innerHTML = '';
  const items = jobs.length > 0 ? jobs : [emptyJob()];
  items.forEach((job, i) => addJobBlock(job, i));
}

function emptyJob() {
  return { companyEn: '', companyCn: '', date: '', positionEn: '', positionCn: '', note: '', bullets: [''] };
}

function addJobBlock(job = emptyJob(), idx) {
  const list = document.getElementById('rf-jobs-list');
  const i = list.children.length;
  const block = document.createElement('div');
  block.className = 'rf-repeatable-block';
  block.innerHTML = `
    <div class="rf-block-header">
      <span class="rf-block-label">工作经历 ${i + 1}</span>
      <button type="button" class="rf-remove-btn" onclick="this.closest('.rf-repeatable-block').remove(); renumberBlocks('rf-jobs-list', '工作经历')">删除</button>
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="公司（中文）" class="rf-job-company-cn" value="${escAttr(job.companyCn)}">
      <input type="text" placeholder="Company (English)" class="rf-job-company-en" value="${escAttr(job.companyEn)}">
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="职位（中文）" class="rf-job-pos-cn" value="${escAttr(job.positionCn)}">
      <input type="text" placeholder="Position (English)" class="rf-job-pos-en" value="${escAttr(job.positionEn)}">
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="时间段（如 2022.01 — 至今）" class="rf-job-date" value="${escAttr(job.date)}" style="flex:1">
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="备注（可选，一行简短描述）" class="rf-job-note" value="${escAttr(job.note)}" style="flex:1">
    </div>
    <div class="rf-bullets-list">
      ${(job.bullets.length > 0 ? job.bullets : ['']).map(b => bulletRow(b)).join('')}
    </div>
    <button type="button" class="rf-add-sub-btn" onclick="addBulletToBlock(this)">+ 添加 bullet</button>`;
  list.appendChild(block);
}

function bulletRow(text = '') {
  return `<div class="rf-bullet-row">
    <span class="rf-bullet-arrow">▸</span>
    <textarea class="rf-bullet-input" rows="2" placeholder="描述内容，数字指标会自动高亮">${escAttr(text)}</textarea>
    <button type="button" class="rf-remove-btn" onclick="this.parentElement.remove()">✕</button>
  </div>`;
}

function addBulletToBlock(btn) {
  const bulletsContainer = btn.previousElementSibling;
  const div = document.createElement('div');
  div.innerHTML = bulletRow('');
  bulletsContainer.appendChild(div.firstElementChild);
}

// ── Skill Groups ──────────────────────────────────────────────

function renderSkillGroups(groups) {
  const list = document.getElementById('rf-skills-list');
  list.innerHTML = '';
  const items = groups.length > 0 ? groups : [{ label: '', tags: [] }];
  items.forEach(sg => addSkillGroupBlock(sg));
}

function addSkillGroupBlock(sg = { label: '', tags: [] }) {
  const list = document.getElementById('rf-skills-list');
  const i = list.children.length;
  const block = document.createElement('div');
  block.className = 'rf-repeatable-block';
  block.innerHTML = `
    <div class="rf-block-header">
      <span class="rf-block-label">技能分组 ${i + 1}</span>
      <button type="button" class="rf-remove-btn" onclick="this.closest('.rf-repeatable-block').remove(); renumberBlocks('rf-skills-list', '技能分组')">删除</button>
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="分组名称（如：产品工具 · Product Tools）" class="rf-skill-label" value="${escAttr(sg.label)}" style="flex:1">
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="技能标签，用逗号分隔（如：Axure, Figma, JIRA）" class="rf-skill-tags" value="${escAttr((sg.tags || []).join(', '))}" style="flex:1">
    </div>`;
  list.appendChild(block);
}

// ── Projects ─────────────────────────────────────────────────

function renderProjects(projects) {
  const list = document.getElementById('rf-projects-list');
  list.innerHTML = '';
  (projects.length > 0 ? projects : []).forEach(p => addProjectBlock(p));
}

function addProjectBlock(p = { name: '', desc: '', url: '' }) {
  const list = document.getElementById('rf-projects-list');
  const i = list.children.length;
  const block = document.createElement('div');
  block.className = 'rf-repeatable-block';
  block.innerHTML = `
    <div class="rf-block-header">
      <span class="rf-block-label">项目 ${i + 1}</span>
      <button type="button" class="rf-remove-btn" onclick="this.closest('.rf-repeatable-block').remove(); renumberBlocks('rf-projects-list', '项目')">删除</button>
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="项目名称" class="rf-proj-name" value="${escAttr(p.name)}" style="flex:1">
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="项目描述" class="rf-proj-desc" value="${escAttr(p.desc)}" style="flex:1">
    </div>
    <div class="rf-form-row">
      <input type="text" placeholder="链接（可选）" class="rf-proj-url" value="${escAttr(p.url)}" style="flex:1">
    </div>`;
  list.appendChild(block);
}

// ── Helpers ──────────────────────────────────────────────────

function renumberBlocks(listId, label) {
  const list = document.getElementById(listId);
  Array.from(list.children).forEach((block, i) => {
    const labelEl = block.querySelector('.rf-block-label');
    if (labelEl) labelEl.textContent = `${label} ${i + 1}`;
  });
}

function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Avatar upload ────────────────────────────────────────────

function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    _avatarDataUrl = e.target.result;
    const preview = document.getElementById('rf-avatar-preview');
    preview.src = _avatarDataUrl;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
}

// ── Collect form data ────────────────────────────────────────

function collectFormData() {
  const g = (id) => (document.getElementById(id) || {}).value || '';

  // Contacts
  const contacts = Array.from(document.querySelectorAll('.rf-contact-row')).map(row => ({
    type: row.querySelector('.rf-contact-type').value,
    value: row.querySelector('.rf-contact-value').value.trim()
  })).filter(c => c.value);

  // Jobs
  const jobs = Array.from(document.querySelectorAll('#rf-jobs-list .rf-repeatable-block')).map(block => ({
    companyCn:  block.querySelector('.rf-job-company-cn').value.trim(),
    companyEn:  block.querySelector('.rf-job-company-en').value.trim(),
    date:       block.querySelector('.rf-job-date').value.trim(),
    positionCn: block.querySelector('.rf-job-pos-cn').value.trim(),
    positionEn: block.querySelector('.rf-job-pos-en').value.trim(),
    note:       block.querySelector('.rf-job-note').value.trim(),
    bullets:    Array.from(block.querySelectorAll('.rf-bullet-input')).map(t => t.value.trim()).filter(Boolean)
  })).filter(j => j.companyCn || j.companyEn || j.bullets.length);

  // Skill groups
  const skillGroups = Array.from(document.querySelectorAll('#rf-skills-list .rf-repeatable-block')).map(block => ({
    label: block.querySelector('.rf-skill-label').value.trim(),
    tags:  block.querySelector('.rf-skill-tags').value.split(/[,，]+/).map(t => t.trim()).filter(Boolean)
  })).filter(sg => sg.label || sg.tags.length);

  // Projects
  const projects = Array.from(document.querySelectorAll('#rf-projects-list .rf-repeatable-block')).map(block => ({
    name: block.querySelector('.rf-proj-name').value.trim(),
    desc: block.querySelector('.rf-proj-desc').value.trim(),
    url:  block.querySelector('.rf-proj-url').value.trim()
  })).filter(p => p.name || p.desc);

  return {
    name:         g('rf-name'),
    title:        g('rf-title'),
    titleEn:      g('rf-title-en'),
    experience:   g('rf-experience'),
    avatarDataUrl: _avatarDataUrl,
    contacts,
    summary:      g('rf-summary'),
    jobs,
    skillGroups,
    projects,
    education: {
      school: g('rf-edu-school'),
      degree: g('rf-edu-degree'),
      major:  g('rf-edu-major'),
      date:   g('rf-edu-date')
    }
  };
}

// ── Preview ──────────────────────────────────────────────────

function previewResume() {
  const data = collectFormData();
  const html = generateClassicHTML(data);
  const win = window.open('', '_blank');
  if (!win) {
    alert('请允许弹出窗口以预览简历。');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── Init listeners (called from init() in app.js) ────────────

function initResumeForm() {
  // Close on overlay click (outside modal)
  document.getElementById('resume-form-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeResumeForm();
  });
}
