/* ============================================================
   Personal Résumé Webpage — interactions
   1. Chinese text-to-speech via the browser's Web Speech API
   2. Form validation (Name, Class, Student ID required)
   3. Submit opens an email draft (mailto:) with the form data
   ============================================================ */

// ---------- 1. Speech (Web Speech API) ----------
const speakBtn = document.getElementById('speakBtn');
const speakIcon = document.getElementById('speakIcon');
const speakLabel = document.getElementById('speakLabel');
const speakStatus = document.getElementById('speakStatus');

let voices = [];
let isSpeaking = false;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}
loadVoices();
if (typeof window.speechSynthesis !== 'undefined' &&
    'onvoiceschanged' in window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Prefer a zh-CN voice, then any Chinese voice, then browser default
function pickChineseVoice() {
  return voices.find((v) => /^zh[-_]CN/i.test(v.lang)) ||
         voices.find((v) => /^zh/i.test(v.lang)) ||
         null;
}

function setSpeaking(speaking) {
  isSpeaking = speaking;
  speakIcon.textContent = speaking ? '⏹' : '🔊';
  speakLabel.textContent = speaking ? '停止朗读' : '播放语音朗读';
  speakBtn.classList.toggle('speaking', speaking);
  if (!speaking) speakStatus.textContent = '';
}

speakBtn.addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    speakStatus.textContent = '当前浏览器不支持语音朗读，请使用 Chrome 或 Edge。';
    return;
  }

  // Click again to stop
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    return;
  }

  // Collect the two intro sentences from the page
  const lines = document.querySelectorAll('.intro-line');
  const text = Array.from(lines)
    .map((el) => el.textContent.trim())
    .join('。');

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  const voice = pickChineseVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => setSpeaking(false);
  utterance.onerror = () => {
    setSpeaking(false);
    speakStatus.textContent = '朗读失败，请重试。';
  };

  window.speechSynthesis.cancel(); // clear any queued speech
  window.speechSynthesis.speak(utterance);
  speakStatus.textContent = '正在朗读…';
});

// ---------- 2. Form validation + email draft ----------
const form = document.getElementById('resumeForm');
const formStatus = document.getElementById('formStatus');
const requiredIds = ['name', 'class', 'studentId'];

// Clear the error style as soon as the user starts typing
for (const id of requiredIds) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => input.classList.remove('invalid'));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  // Validate required fields: Name, Class, Student ID
  let firstInvalid = null;
  for (const id of requiredIds) {
    const input = document.getElementById(id);
    const valid = input.value.trim() !== '';
    input.classList.toggle('invalid', !valid);
    if (!valid && !firstInvalid) firstInvalid = input;
  }

  if (firstInvalid) {
    formStatus.textContent = '请先填写所有必填项（姓名、班级、学号）。';
    firstInvalid.focus();
    return;
  }

  // Build the email draft
  const get = (id) => document.getElementById(id).value.trim() || '—';
  const lines = [
    '个人信息',
    '==============================',
    `姓名：${get('name')}`,
    `班级：${get('class')}`,
    `学号：${get('studentId')}`,
    `学校/院系：${get('school')}`,
    `国家/地区：${get('country')}`,
    `语言：${get('languages')}`,
    `爱好：${get('hobbies')}`,
    `关于我：${get('about')}`,
  ];

  const subject = `个人信息 - ${get('name')}`;
  const body = lines.join('\n');

  formStatus.textContent = '校验通过 ✓ 正在打开邮件草稿…';
  window.location.href =
    'mailto:?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
});
