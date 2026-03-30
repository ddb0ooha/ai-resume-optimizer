![banner](assets/banner.png)

# AI 简历优化助手

上传简历文件，获取 AI 驱动的专业优化建议。


## 功能

- 支持上传 PDF / DOCX / Markdown / TXT 格式简历
- 前端解析文件内容，调用 DeepSeek API 进行流式分析
- 用户画像选择：工作年限、目标行业、岗位细分（互联网/科技行业支持产品经理、Java开发、iOS开发等岗位，含深度评估维度、量化指标引导与 ATS 关键词）
- JD 匹配优化：粘贴目标职位描述，AI 额外输出匹配度评分和定向建议
- 分析过程可随时取消，支持流式进度显示
- 结果支持一键复制、导出为 Markdown 文件
- CDN 依赖加载失败自动检测提示

## 技术栈

- 纯 HTML + CSS + JavaScript，无框架无构建工具
- 纯前端架构，无需后端服务器
- CDN 依赖：pdf.js、mammoth.js、marked.js

## 使用方式

1. 双击 `index.html` 或用浏览器打开
2. 输入你的 DeepSeek API Key（存储在浏览器本地，不会上传）
3. 上传简历文件
4. 选择工作年限和目标行业（可选填目标岗位）
5. 可选：粘贴目标职位 JD，获取匹配度分析
6. 点击「开始优化」，等待 AI 分析结果
7. 查看结果，可复制或导出 Markdown

## 文件结构

```
index.html   - 页面结构 + CDN 引入
style.css    - 全部样式（仅桌面端）
app.js       - 全部业务逻辑（Prompt 模板、文件解析、API 调用、流式渲染、导出）
```

## 更新日志

- **v1.0** — MVP 核心功能上线（上传 → 解析 → AI分析 → 展示）
- **v1.1** — 用户画像选择（工作年限 + 行业 + 互联网岗位细分）
- **v1.2** — JD 匹配优化（粘贴 JD，AI 输出匹配度分析）；导出为 Markdown 文件
- **v1.3** — UI/UX 升级（CSS 变量体系、渐变、动效、无障碍）
- **v1.4** — Prompt 深度优化（互联网行业框架 + 产品经理/Java开发/iOS开发岗位评估维度、量化指标、ATS 关键词）
- **v1.5** — 可靠性与体验提升（max_tokens 8192、取消分析按钮、流式进度提示、CDN 加载检测）
- **v1.6** — 端到端测试验证通过（真实 API Key + 简历文件全流程测试）
- **v1.7** — UI 全局重设计（双栏工具式布局：左侧配置栏 + 右侧结果栏；API Key 移至顶栏；步骤编号引导；结果区白色卡片；纯 CSS 空态控制）

## 需要

- DeepSeek API Key（从 https://platform.deepseek.com 获取）
- 现代浏览器（Chrome / Edge / Firefox / Safari）
