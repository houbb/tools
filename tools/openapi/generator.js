// 简化选择器
const $ = id => document.getElementById(id);

// UI 元素
const specText = $('specText');
const detectedType = $('detectedType');
const alertBox = $('alertBox');

// === 辅助函数 ===
function showAlert(message, type = 'info', timeout = 4000) {
  alertBox.className = 'alert alert-' + type;
  alertBox.innerHTML = message;
  alertBox.style.display = 'block';
  if (timeout) setTimeout(() => alertBox.style.display = 'none', timeout);
}

function detectFormat(text) {
  if (!text.trim()) return '未检测';
  if (text.trim().startsWith('{')) return 'JSON';
  return 'YAML';
}

function parseSpecFromText(text) {
  const format = detectFormat(text);
  return (format === 'JSON') ? JSON.parse(text) : jsyaml.load(text);
}

// 简单校验 OpenAPI 对象的关键字段
function validateSpec(spec) {
  const errs = [];
  if (!spec.openapi) errs.push('缺少字段：openapi');
  if (!spec.info) errs.push('缺少字段：info');
  if (!spec.paths) errs.push('缺少字段：paths');
  return errs;
}

// === 核心逻辑 ===

// 从 URL 加载 openapi json
async function loadFromUrl() {
  const url = $('apiUrl').value.trim();
  if (!url) return showAlert('请输入 OpenAPI 地址！', 'warning');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const text = await res.text();
    specText.value = text;
    detectedType.innerText = detectFormat(text);
    showAlert('✅ 已从 URL 加载成功！', 'success');
  } catch (e) {
    showAlert('加载失败：' + e.message, 'danger', 8000);
  }
}

// 清空输入框
function clearAll() {
  $('apiUrl').value = '';
  specText.value = '';
  detectedType.innerText = '未检测';
  showAlert('已清空。', 'secondary');
}

// === HTML 生成逻辑 ===
function escapeHtml(s){
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

function generateStandaloneHtml(specObject, title = 'API Docs') {
  let specJson = JSON.stringify(specObject, null, 2)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; font-family: Inter, Roboto, Arial, sans-serif; }
  </style>
</head>
<body>
  <div id="redoc-container"></div>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    const spec = ${specJson};
    const options = { theme: { colors: { primary: { main: '#0b5cff' } } } };
    document.addEventListener('DOMContentLoaded',()=>Redoc.init(spec, options, document.getElementById('redoc-container')));
  </script>
</body>
</html>`;
}

function downloadHtmlFile(specObj) {
  const title = (specObj.info && specObj.info.title) ? specObj.info.title : 'api-doc';
  const html = generateStandaloneHtml(specObj, title);
  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[^0-9a-zA-Z-_]/g, '_') + '.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
  showAlert('🎉 已生成 HTML 文件：' + a.download, 'success');
}

// === 事件绑定 ===
$('btnLoad').addEventListener('click', loadFromUrl);
$('btnClear').addEventListener('click', clearAll);
specText.addEventListener('input', () => detectedType.innerText = detectFormat(specText.value));

$('btnValidate').addEventListener('click', () => {
  try {
    const spec = parseSpecFromText(specText.value);
    const errs = validateSpec(spec);
    if (errs.length === 0)
      showAlert('✅ 规范合法：OpenAPI v' + spec.openapi, 'success');
    else
      showAlert('❌ 发现问题：<br>' + errs.join('<br>'), 'danger', 8000);
  } catch (err) {
    showAlert('解析失败：' + err.message, 'danger', 8000);
  }
});

$('btnDownload').addEventListener('click', () => {
  try {
    const spec = parseSpecFromText(specText.value);
    const errs = validateSpec(spec);
    if (errs.length > 0)
      return showAlert('请先修复错误：<br>' + errs.join('<br>'), 'danger', 8000);
    downloadHtmlFile(spec);
  } catch (err) {
    showAlert('生成失败：' + err.message, 'danger', 8000);
  }
});

// 默认示例
const sample = `openapi: 3.0.3
info:
  title: 示例 API
  version: 1.0.0
paths:
  /hello:
    get:
      summary: 打招呼
      responses:
        '200':
          description: OK`;
specText.value = sample;
detectedType.innerText = detectFormat(sample);
