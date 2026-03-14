/* ═══════════════════════════════════════════════════════
SENYX SOVEREIGN PLATFORM — shared.js
All shared utilities, stars, nav, API layer, agents
═══════════════════════════════════════════════════════ */

‘use strict’;

// ══════════════════════════════════
// 1. API KEY MANAGER
// ══════════════════════════════════
const SNYX = {
_key: localStorage.getItem(‘snyx_api_key’) || ‘’,

get key(){ return this._key; },

set key(v){
this._key = v.trim();
if(v) localStorage.setItem(‘snyx_api_key’, this._key);
else  localStorage.removeItem(‘snyx_api_key’);
this._updateUI();
},

_updateUI(){
const el = document.getElementById(‘apiKeyStatus’);
const btn = document.getElementById(‘apiBtnNav’);
if(el){
if(this._key){
el.innerHTML = `<span style="color:var(--green)">✅ مفتاح نشط — ...${this._key.slice(-6)}</span>`;
} else {
el.innerHTML = `<span style="color:var(--gold2)">⚠️ أدخل مفتاح API لتفعيل الوكلاء</span>`;
}
}
if(btn) btn.style.borderColor = this._key ? ‘rgba(34,170,102,.5)’ : ‘rgba(224,170,48,.4)’;
},

// ── Core API call ──
async ask(messages, systemPrompt = ‘’, opts = {}){
if(!this._key){
openModal(‘apikey’);
return ‘⚠️ أدخل مفتاح API Anthropic أولاً.’;
}
try {
const body = {
model: ‘claude-haiku-4-5-20251001’,
max_tokens: opts.max_tokens || 1000,
messages,
…(systemPrompt && { system: systemPrompt })
};
const res = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: this._key,
‘anthropic-version’: ‘2023-06-01’,
‘anthropic-dangerous-direct-browser-access’: ‘true’
},
body: JSON.stringify(body)
});
if(!res.ok){
const err = await res.json().catch(()=>({}));
if(res.status === 401){ openModal(‘apikey’); return ‘❌ مفتاح API غير صحيح.’; }
if(res.status === 429) return ‘⏳ تجاوزت الحد — انتظر لحظة وحاول مجدداً.’;
return `❌ خطأ ${res.status}: ${err.error?.message || 'حاول مرة أخرى'}`;
}
const data = await res.json();
return data.content?.[0]?.text || ‘لم تصل استجابة.’;
} catch(e) {
return ‘❌ تعذّر الاتصال. تحقق من الإنترنت.’;
}
}
};

// ── Save/clear from modal ──
function saveApiKey(){
const v = document.getElementById(‘apiKeyInput’)?.value?.trim() || ‘’;
if(!v){ alert(‘أدخل المفتاح أولاً!’); return; }
if(!v.startsWith(‘sk-ant-’)){ alert(‘⚠️ المفتاح يجب أن يبدأ بـ sk-ant-\nاحصل عليه من console.anthropic.com’); return; }
SNYX.key = v;
document.getElementById(‘apiKeyInput’).value = ‘’;
closeModal(‘apikey’);
alert(‘✅ تم حفظ مفتاح API — جميع الوكلاء جاهزون!’);
}
function clearApiKey(){
if(!confirm(‘حذف مفتاح API؟’)) return;
SNYX.key = ‘’;
alert(‘تم الحذف.’);
}

// ══════════════════════════════════
// 2. STARS BACKGROUND
// ══════════════════════════════════
function initStars(){
const canvas = document.getElementById(‘starsCanvas’);
if(!canvas) return;
const ctx = canvas.getContext(‘2d’);
let W, H, stars=[], raf;

function resize(){
W = canvas.width  = window.innerWidth;
H = canvas.height = window.innerHeight;
}
function createStars(){
stars = Array.from({length:280}, ()=>({
x: Math.random()*W,
y: Math.random()*H,
r: Math.random()*1.4+.2,
a: Math.random(),
da: (Math.random()-.5)*.008,
vx: (Math.random()-.5)*.08,
vy: (Math.random()-.5)*.04
}));
}
function draw(){
ctx.clearRect(0,0,W,H);
stars.forEach(s=>{
s.a += s.da;
if(s.a>1||s.a<0) s.da=-s.da;
s.x = (s.x+s.vx+W)%W;
s.y = (s.y+s.vy+H)%H;
ctx.beginPath();
ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
ctx.fillStyle=`rgba(255,243,176,${s.a*.8})`;
ctx.fill();
});
raf = requestAnimationFrame(draw);
}

resize(); createStars(); draw();
window.addEventListener(‘resize’,()=>{ resize(); createStars(); });
}

// ══════════════════════════════════
// 3. MODAL SYSTEM
// ══════════════════════════════════
function openModal(id){
const el = document.getElementById(‘modal-’+id);
if(el){ el.classList.add(‘open’); el.addEventListener(‘click’, e=>{ if(e.target===el) closeModal(id); }); }
}
function closeModal(id){
document.getElementById(‘modal-’+id)?.classList.remove(‘open’);
}
document.addEventListener(‘keydown’, e=>{ if(e.key===‘Escape’) document.querySelectorAll(’.modal-overlay.open’).forEach(m=>m.classList.remove(‘open’)); });

// ══════════════════════════════════
// 4. LANGUAGE TOGGLE
// ══════════════════════════════════
let currentLang = localStorage.getItem(‘snyx_lang’) || ‘ar’;

function toggleLang(){
currentLang = currentLang===‘ar’ ? ‘en’ : ‘ar’;
localStorage.setItem(‘snyx_lang’, currentLang);
applyLang();
}
function applyLang(){
document.body.dir    = currentLang===‘ar’ ? ‘rtl’ : ‘ltr’;
document.documentElement.lang = currentLang;
const btn = document.getElementById(‘langBtn’);
if(btn) btn.textContent = currentLang===‘ar’ ? ‘EN’ : ‘ع’;
document.querySelectorAll(’[data-ar]’).forEach(el=>{
el.textContent = currentLang===‘ar’ ? el.dataset.ar : (el.dataset.en||el.dataset.ar);
});
}

// ══════════════════════════════════
// 5. CHAT HELPER
// ══════════════════════════════════
function appendMsg(bodyId, role, text){
const body = document.getElementById(bodyId);
if(!body) return;
const d = document.createElement(‘div’);
d.className = `msg msg-${role}`;
d.innerHTML = role===‘ai’ ? text.replace(/\n/g,’<br>’) : escHtml(text);
body.appendChild(d);
body.scrollTop = body.scrollHeight;
return d;
}

function escHtml(t){ return t.replace(/&/g,’&’).replace(/</g,’<’).replace(/>/g,’>’); }

async function chatSend(opts){
// opts: { inputId, bodyId, btnId, system, history }
const input = document.getElementById(opts.inputId);
const text  = input?.value?.trim();
if(!text) return;
input.value = ‘’;
appendMsg(opts.bodyId, ‘user’, text);
const btn = document.getElementById(opts.btnId);
if(btn){ btn.disabled=true; btn.innerHTML=’<span class="loader"></span>’; }
opts.history.push({ role:‘user’, content:text });
const reply = await SNYX.ask(opts.history, opts.system);
opts.history.push({ role:‘assistant’, content:reply });
appendMsg(opts.bodyId, ‘ai’, reply);
if(btn){ btn.disabled=false; btn.textContent=‘إرسال’; }
}

// Enter key support
function bindChatEnter(inputId, sendFn){
document.getElementById(inputId)?.addEventListener(‘keydown’, e=>{
if(e.key===‘Enter’ && !e.shiftKey){ e.preventDefault(); sendFn(); }
});
}

// ══════════════════════════════════
// 6. REVEAL ON SCROLL
// ══════════════════════════════════
function initReveal(){
const obs = new IntersectionObserver(entries=>{
entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add(‘visible’); obs.unobserve(e.target); } });
}, { threshold:.1 });
document.querySelectorAll(’.reveal’).forEach(el=>obs.observe(el));
}

// ══════════════════════════════════
// 7. TICKER
// ══════════════════════════════════
function buildTicker(items){
const inner = document.getElementById(‘tickerInner’);
if(!inner) return;
const html = items.map(i=>`<span class="ticker-item">${i}</span>`).join(’’);
inner.innerHTML = html+html; // duplicate for seamless loop
}

// ══════════════════════════════════
// 8. COUNTER ANIMATION
// ══════════════════════════════════
function animateCounter(el, target, duration=1800, prefix=’’, suffix=’’){
let start=0, startTime=null;
function step(ts){
if(!startTime) startTime=ts;
const p = Math.min((ts-startTime)/duration,1);
const ease = 1-Math.pow(1-p,3);
const val = Math.round(ease*target);
el.textContent = prefix + val.toLocaleString(‘ar-SA’) + suffix;
if(p<1) requestAnimationFrame(step);
}
requestAnimationFrame(step);
}
function initCounters(){
const obs = new IntersectionObserver(entries=>{
entries.forEach(e=>{
if(e.isIntersecting){
const el=e.target;
animateCounter(el, +el.dataset.target, 1800, el.dataset.prefix||’’, el.dataset.suffix||’’);
obs.unobserve(el);
}
});
}, {threshold:.3});
document.querySelectorAll(’[data-target]’).forEach(el=>obs.observe(el));
}

// ══════════════════════════════════
// 9. INIT
// ══════════════════════════════════
document.addEventListener(‘DOMContentLoaded’, ()=>{
initStars();
initReveal();
initCounters();
applyLang();
SNYX._updateUI();

// Auto show API modal if no key
if(!SNYX.key){
setTimeout(()=>{ if(typeof openModal===‘function’) openModal(‘apikey’); }, 1200);
}
});