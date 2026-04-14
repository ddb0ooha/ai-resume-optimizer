// ============================================================
// Classic Resume Template
// Extracted from Resume001/resume.html
// Usage: generateClassicHTML(data) → full HTML string
// ============================================================

const CONTACT_ICONS = {
  email: `<svg class="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  github: `<svg class="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
  telegram: `<svg class="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>`,
  phone: `<svg class="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  website: `<svg class="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Auto-highlight numeric metrics (e.g. 18%, 9000万, 2x)
function highlightNumbers(text) {
  return esc(text).replace(
    /(\d[\d,\.]*\s*[%万亿千百倍xX×])/g,
    '<span class="m">$1</span>'
  );
}

function renderContact(c) {
  const icon = CONTACT_ICONS[c.type] || CONTACT_ICONS.website;
  const val = esc(c.value);
  const isLink = c.type === 'github' || c.type === 'website';
  const href = isLink
    ? (c.value.startsWith('http') ? esc(c.value) : `https://${esc(c.value)}`)
    : (c.type === 'email' ? `mailto:${val}` : null);

  if (href) {
    return `<a class="contact-item" href="${href}" target="_blank">${icon}${val}</a>`;
  }
  return `<div class="contact-item">${icon}${val}</div>`;
}

function renderJob(job, idx, isLast) {
  const railLine = isLast ? '' : '<div class="rail-line"></div>';
  const note = job.note ? `<div class="job-note">${esc(job.note)}</div>` : '';
  const companyEn = job.companyEn ? `<span class="co-en">${esc(job.companyEn)}</span>` : '';
  const companyCn = job.companyCn
    ? `<span class="co-zh">${companyEn ? ' · ' : ''}${esc(job.companyCn)}</span>`
    : '';
  const positionEn = job.positionEn ? `<span class="jt-en">${esc(job.positionEn)}</span>` : '';
  const positionCn = job.positionCn ? `<span class="jt-zh">${esc(job.positionCn)}</span>` : '';
  const sep = (positionEn && positionCn) ? '<span class="sep">/</span>' : '';

  const bullets = (job.bullets || []).filter(b => b.trim()).map(b =>
    `<li>${highlightNumbers(b)}</li>`
  ).join('\n              ');
  const bulletsList = bullets ? `<ul class="bullets">\n              ${bullets}\n            </ul>` : '';

  return `
        <div class="job">
          <div class="job-rail">
            <div class="dot"></div>
            ${railLine}
          </div>
          <div class="job-body">
            <div class="co-row">
              <div>${companyEn}${companyCn}</div>
              <div class="job-date">${esc(job.date)}</div>
            </div>
            <div class="title-row">
              ${positionEn}${sep}${positionCn}
            </div>
            ${note}
            ${bulletsList}
          </div>
        </div>`;
}

function renderSkillGroup(sg) {
  const tags = (sg.tags || []).filter(t => t.trim()).map(t =>
    `<span class="tag">${esc(t.trim())}</span>`
  ).join('');
  return `
          <div class="skill-group">
            <div class="skill-label">${esc(sg.label)}</div>
            <div class="skill-tags">${tags}</div>
          </div>`;
}

function renderProject(p) {
  const link = p.url
    ? `<a class="os-link" href="${esc(p.url.startsWith('http') ? p.url : 'https://' + p.url)}" target="_blank">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            ${esc(p.url.replace(/^https?:\/\//, ''))}</a>`
    : '';
  return `
          <div class="os-item">
            <div class="os-name">${esc(p.name)}</div>
            <div class="os-desc">${esc(p.desc)}</div>
            ${link}
          </div>`;
}

function generateClassicHTML(data) {
  const {
    name = '',
    title = '',
    titleEn = '',
    experience = '',
    avatarDataUrl = '',
    contacts = [],
    summary = '',
    jobs = [],
    skillGroups = [],
    projects = [],
    education = {}
  } = data;

  // Dynamic job animation delays
  const jobDelayStyles = jobs.map((_, i) =>
    `.job:nth-child(${i + 1}) { animation-delay: ${((i + 1) * 0.08).toFixed(2)}s; }`
  ).join('\n    ');

  // Bottom grid columns: 2-col if no projects
  const hasProjects = projects.length > 0 && projects.some(p => p.name);
  const gridCols = hasProjects ? '2fr 1.5fr 1fr' : '2fr 1fr';

  // Avatar block
  const avatarBlock = avatarDataUrl
    ? `<div class="hdr-avatar"><img src="${avatarDataUrl}" alt="${esc(name)}"></div>`
    : '';

  // Title row
  const titleRow = (titleEn || title) ? `
      <div class="hdr-title">
        ${titleEn ? `<span class="hdr-title-en">${esc(titleEn)}</span>` : ''}
        ${(titleEn && title) ? '<span class="hdr-title-sep">|</span>' : ''}
        ${title ? `<span class="hdr-title-zh">${esc(title)}</span>` : ''}
      </div>` : '';

  // Experience badge
  const expBadge = experience ? `
      <div class="exp-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${esc(experience)}
      </div>` : '';

  // Contact bar
  const contactBar = contacts.filter(c => c.value).length > 0
    ? `<div class="contact-bar">${contacts.filter(c => c.value).map(renderContact).join('\n        ')}</div>`
    : '';

  // Jobs
  const jobsHtml = jobs.map((job, i) => renderJob(job, i, i === jobs.length - 1)).join('');

  // Skills
  const skillsHtml = skillGroups.filter(sg => sg.label || (sg.tags && sg.tags.length)).map(renderSkillGroup).join('');

  // Projects column
  const projectsCol = hasProjects ? `
      <div class="info-card">
        <div class="card-title">Open Source · 项目</div>
        ${projects.filter(p => p.name).map(renderProject).join('')}
      </div>` : '';

  // Education
  const edu = education;
  const eduHtml = `
      <div class="info-card">
        <div class="card-title">Education · 教育</div>
        <div>
          <div class="edu-school">${esc(edu.school || '')}</div>
          ${edu.date ? `<div class="edu-school" style="font-size:11px;font-weight:400;color:var(--text-3)">${esc(edu.date)}</div>` : ''}
          <div class="edu-degree">${esc(edu.degree || '')}</div>
          <div class="edu-major">${esc(edu.major || '')}</div>
        </div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(name)}${title ? ' · ' + esc(title) : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:    #e8894a;
      --accent-lt: #f0a572;
      --hdr-bg:    #1b2d40;
      --body-bg:   #f4f6f9;
      --card-bg:   #ffffff;
      --text-1:    #1b2d40;
      --text-2:    #4a5c6a;
      --text-3:    #8a9aaa;
      --border:    #dde4ec;
      --font-d:    'Cormorant Garamond', Georgia, serif;
      --font-b:    'DM Sans', 'Noto Sans SC', sans-serif;
    }
    html { font-family: var(--font-b); font-size: 13.5px; line-height: 1.65; color: var(--text-1); -webkit-font-smoothing: antialiased; }
    body { background: #d0d8e2; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 48px 20px; }
    .resume { width: 210mm; background: var(--card-bg); box-shadow: 0 24px 64px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.08); border-radius: 3px; overflow: hidden; }
    .hdr { background: linear-gradient(135deg, #203449 0%, #1b2d40 55%, #152233 100%); padding: 32px 40px 28px; display: flex; align-items: center; gap: 28px; position: relative; overflow: hidden; animation: fadeIn .4s ease both; }
    .hdr::before { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(232,137,74,.10) 0%, transparent 65%); pointer-events: none; }
    .hdr::after { content: ''; position: absolute; bottom: -40px; left: 30%; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(232,137,74,.06) 0%, transparent 65%); pointer-events: none; }
    .hdr-avatar { flex-shrink: 0; width: 84px; height: 84px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, var(--accent), var(--accent-lt), #f5c99a); position: relative; z-index: 1; }
    .hdr-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; border: 3px solid var(--hdr-bg); }
    .hdr-info { flex: 1; display: flex; flex-direction: column; gap: 6px; position: relative; z-index: 1; }
    .hdr-name { font-family: var(--font-d); font-size: 30px; font-weight: 700; color: #ffffff; line-height: 1.1; letter-spacing: .02em; }
    .hdr-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .hdr-title-en { font-size: 11.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: var(--accent); }
    .hdr-title-sep { color: rgba(200,216,230,.3); font-size: 12px; }
    .hdr-title-zh { font-size: 11.5px; color: rgba(200,216,230,.7); letter-spacing: .06em; }
    .exp-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border-radius: 30px; background: rgba(232,137,74,.10); border: 1px solid rgba(232,137,74,.22); font-size: 11px; color: var(--accent-lt); font-weight: 500; width: fit-content; }
    .contact-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; margin-top: 4px; }
    .contact-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(200,216,230,.85); text-decoration: none; transition: color .2s; }
    .contact-item:hover { color: #ffffff; }
    .ci-icon { width: 13px; height: 13px; flex-shrink: 0; color: var(--accent); }
    .body { background: var(--body-bg); padding: 36px 40px; display: flex; flex-direction: column; gap: 28px; }
    .sec-head { display: flex; align-items: baseline; gap: 9px; margin-bottom: 14px; animation: fadeUp .4s ease both; }
    .sec-en { font-family: var(--font-d); font-size: 21px; font-weight: 600; color: var(--text-1); letter-spacing: .015em; }
    .sec-zh { font-size: 11px; color: var(--text-3); font-weight: 400; letter-spacing: .08em; }
    .sec-line { flex: 1; height: 1px; background: linear-gradient(to right, var(--border), transparent); margin-left: 6px; }
    .summary-card { background: var(--card-bg); border-radius: 6px; padding: 18px 22px; border-left: 3px solid var(--accent); box-shadow: 0 2px 10px rgba(0,0,0,.04); font-size: 12.5px; line-height: 1.78; color: var(--text-2); animation: fadeUp .4s .06s ease both; }
    .timeline { display: flex; flex-direction: column; }
    .job { display: flex; gap: 16px; animation: fadeUp .4s ease both; }
    ${jobDelayStyles}
    .job-rail { display: flex; flex-direction: column; align-items: center; width: 14px; flex-shrink: 0; }
    .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 5px; box-shadow: 0 0 0 3px rgba(232,137,74,.16); transition: box-shadow .2s; }
    .job:hover .dot { box-shadow: 0 0 0 5px rgba(232,137,74,.26); }
    .rail-line { flex: 1; width: 1px; background: linear-gradient(to bottom, rgba(221,228,236,.9), rgba(221,228,236,.2)); margin: 5px 0 0; }
    .job-body { flex: 1; padding-bottom: 22px; }
    .job:last-child .job-body { padding-bottom: 0; }
    .co-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .co-en { font-family: var(--font-d); font-size: 16.5px; font-weight: 700; color: var(--text-1); }
    .co-zh { font-size: 10.5px; color: var(--text-3); }
    .job-date { font-size: 11px; color: var(--text-3); white-space: nowrap; background: rgba(138,154,170,.10); padding: 2px 8px; border-radius: 3px; flex-shrink: 0; }
    .title-row { display: flex; align-items: center; gap: 7px; margin-top: 3px; }
    .jt-en { font-size: 11.5px; font-weight: 600; color: var(--accent); letter-spacing: .05em; }
    .sep { color: var(--text-3); font-size: 10px; }
    .jt-zh { font-size: 11.5px; color: var(--text-2); }
    .job-note { font-size: 11px; color: var(--text-3); font-style: italic; margin-top: 5px; padding: 4px 10px; background: rgba(138,154,170,.07); border-radius: 3px; line-height: 1.55; }
    .bullets { list-style: none; display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }
    .bullets li { font-size: 12px; color: var(--text-2); line-height: 1.68; padding-left: 14px; position: relative; }
    .bullets li::before { content: '▸'; position: absolute; left: 0; color: var(--accent); font-size: 9px; top: 4px; }
    .bullets li strong { color: var(--text-1); font-weight: 600; }
    .m { color: var(--accent); font-weight: 700; }
    .bottom-grid { display: grid; grid-template-columns: ${gridCols}; gap: 18px; animation: fadeUp .4s .36s ease both; }
    .info-card { background: var(--card-bg); border-radius: 6px; padding: 16px 18px; box-shadow: 0 2px 8px rgba(0,0,0,.04); display: flex; flex-direction: column; gap: 12px; }
    .card-title { font-size: 9.5px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: var(--accent); padding-bottom: 8px; border-bottom: 1px solid rgba(232,137,74,.18); }
    .skill-group { display: flex; flex-direction: column; gap: 7px; }
    .skill-label { font-size: 10px; color: var(--text-3); font-weight: 500; letter-spacing: .04em; }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .tag { font-size: 10.5px; padding: 2px 9px; border-radius: 3px; background: rgba(27,45,64,.06); border: 1px solid rgba(27,45,64,.10); color: var(--text-2); cursor: default; transition: background .2s, color .2s, border-color .2s; }
    .tag:hover { background: rgba(232,137,74,.10); border-color: rgba(232,137,74,.22); color: var(--accent); }
    .os-item { display: flex; flex-direction: column; gap: 3px; }
    .os-name { font-size: 12px; font-weight: 600; color: var(--text-1); }
    .os-desc { font-size: 10.5px; color: var(--text-3); line-height: 1.5; }
    .os-link { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--accent); text-decoration: none; margin-top: 2px; }
    .os-link:hover { text-decoration: underline; }
    .edu-school { font-size: 12.5px; font-weight: 600; color: var(--text-1); }
    .edu-degree { font-size: 11px; color: var(--text-2); margin-top: 3px; }
    .edu-major  { font-size: 10.5px; color: var(--text-3); margin-top: 2px; }
    .export-btn { position: fixed; bottom: 30px; right: 30px; background: var(--text-1); color: #fff; border: none; padding: 11px 20px; border-radius: 6px; font-family: var(--font-b); font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 18px rgba(27,45,64,.28); transition: background .18s, transform .15s, box-shadow .15s; z-index: 200; letter-spacing: .02em; }
    .export-btn:hover { background: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,137,74,.38); }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { size: A4; margin: 0; }
      html::before { content: ''; position: fixed; inset: 0; background: #f4f6f9; z-index: -1; }
      html, body { background: transparent; padding: 0; }
      .resume { box-shadow: none; border-radius: 0; width: 210mm; }
      .export-btn { display: none !important; }
      .job { page-break-inside: avoid; }
      .bottom-grid { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<button class="export-btn" onclick="window.print()">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
  导出 PDF
</button>

<div class="resume">

  <header class="hdr">
    ${avatarBlock}
    <div class="hdr-info">
      <div><span class="hdr-name">${esc(name)}</span></div>
      ${titleRow}
      ${expBadge}
      ${contactBar}
    </div>
  </header>

  <main class="body">

    ${summary ? `<section>
      <div class="sec-head">
        <span class="sec-en">Profile</span>
        <span class="sec-zh">个人总结</span>
        <div class="sec-line"></div>
      </div>
      <div class="summary-card">${esc(summary)}</div>
    </section>` : ''}

    ${jobs.length ? `<section>
      <div class="sec-head">
        <span class="sec-en">Experience</span>
        <span class="sec-zh">工作经历</span>
        <div class="sec-line"></div>
      </div>
      <div class="timeline">${jobsHtml}
      </div>
    </section>` : ''}

    <div class="bottom-grid">

      <div class="info-card">
        <div class="card-title">Skills · 技能</div>
        ${skillsHtml}
      </div>
      ${projectsCol}
      ${eduHtml}

    </div>

  </main>
</div>

</body>
</html>`;
}
