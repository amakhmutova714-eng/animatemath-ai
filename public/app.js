// ════════════════════════════════════════
// GLOBAL BACKGROUND CANVAS
// ════════════════════════════════════════
(function bgAnim() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  const SYMBOLS = ['∫','∑','π','∞','Δ','∂','∇','√','α','β','θ','λ','∮','≈','≠','∈','⊂','∏'];
  const particles = Array.from({length: 28}, () => ({
    sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    x: Math.random(),
    y: Math.random(),
    size: 12 + Math.random() * 22,
    speed: 0.0002 + Math.random() * 0.0004,
    opacity: 0.04 + Math.random() * 0.08,
    drift: (Math.random() - 0.5) * 0.0003,
  }));

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    // floating math symbols
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.x < -0.05 || p.x > 1.05) p.drift *= -1;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.font = `bold ${p.size}px serif`;
      ctx.fillStyle = '#7c3aed';
      ctx.fillText(p.sym, p.x * W, p.y * H);
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ════════════════════════════════════════
// HERO CANVAS
// ════════════════════════════════════════
(function heroAnim() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let t = 0;

  const floats = [
    { text: 'a²+b²=c²', x: 130, y: 105, sz: 22, col: 'rgba(255,255,255,.92)', sp: 0.7 },
    { text: '∫f(x)dx',  x: 295, y: 195, sz: 19, col: 'rgba(200,175,255,.85)', sp: 1.1 },
    { text: 'eⁱᵖ+1=0', x: 115, y: 310, sz: 17, col: 'rgba(255,200,235,.85)', sp: 0.75 },
    { text: 'dy/dx',    x: 345, y: 355, sz: 21, col: 'rgba(175,225,255,.85)', sp: 1.25 },
    { text: 'Σₙ₌₀ aₙ', x: 230, y: 425, sz: 17, col: 'rgba(255,255,255,.65)', sp: 0.6 },
    { text: 'lim x→∞', x: 75,  y: 405, sz: 16, col: 'rgba(190,255,190,.7)',  sp: 0.95 },
    { text: '√(x²+y²)', x: 360, y: 115, sz: 17, col: 'rgba(255,235,140,.85)', sp: 0.85 },
    { text: 'f\'(x)',   x: 195, y: 160, sz: 20, col: 'rgba(255,180,200,.75)', sp: 1.05 },
  ];

  function draw() {
    t += 0.018;
    ctx.clearRect(0, 0, W, H);

    // dark circle bg
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
    bg.addColorStop(0,   '#1a0642');
    bg.addColorStop(0.5, '#27086e');
    bg.addColorStop(1,   '#080318');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(W/2, H/2, W/2, 0, Math.PI*2); ctx.fill();

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 42) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke();
    }

    // sine waves
    [[2.5,'rgba(168,85,247,.65)',60,1.6], [1.5,'rgba(124,58,237,.4)',38,1.0], [1,'rgba(99,102,241,.3)',20,.7]]
      .forEach(([lw, col, amp, spd]) => {
        ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = lw;
        for (let x = 0; x < W; x++) {
          const y = H/2 + Math.sin((x/48)+t*spd)*amp + Math.sin((x/28)+t*.6)*amp*.3;
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.stroke();
      });

    // floating formulas
    floats.forEach((f, i) => {
      const fy = Math.sin(t * f.sp + i * 1.3) * 9;
      ctx.font = `bold ${f.sz}px Inter,sans-serif`;
      ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(168,85,247,.55)';
      ctx.fillStyle = f.col;
      ctx.fillText(f.text, f.x, f.y + fy);
      ctx.shadowBlur = 0;
    });

    // center glow
    const cg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,110);
    cg.addColorStop(0,'rgba(168,85,247,.18)');
    cg.addColorStop(1,'transparent');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(W/2,H/2,110,0,Math.PI*2); ctx.fill();

    // clip
    ctx.globalCompositeOperation='destination-in';
    ctx.beginPath(); ctx.arc(W/2,H/2,W/2,0,Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation='source-over';

    requestAnimationFrame(draw);
  }
  draw();
})();

// ════════════════════════════════════════
// TYPEWRITER EFFECT
// ════════════════════════════════════════
(function typewriter() {
  const el = document.getElementById('typed-text');
  if (!el) return;
  const words = ['Animations.', 'Visuals.', 'Insights.', 'Magic.'];
  let wi = 0, ci = 0, deleting = false;
  function tick() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi+1) % words.length; setTimeout(tick, 300); return; }
    }
    setTimeout(tick, deleting ? 60 : 90);
  }
  setTimeout(tick, 800);
})();

// ════════════════════════════════════════
// EXAMPLE CANVASES
// ════════════════════════════════════════
function animCanvas(id, fn) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  let t = 0;
  (function loop() { t += 0.03; fn(ctx, c.width, c.height, t); requestAnimationFrame(loop); })();
}

animCanvas('c1', (ctx, W, H, t) => {
  ctx.fillStyle='#0d1b2a'; ctx.fillRect(0,0,W,H);
  [[2.5,'rgba(168,85,247,.8)',35,1,0],[1.5,'rgba(251,146,60,.75)',35,1,Math.PI/2]].forEach(([lw,col,amp,spd,ph])=>{
    ctx.beginPath(); ctx.strokeStyle=col; ctx.lineWidth=lw;
    for(let x=0;x<W;x++){const y=H/2+Math.sin((x/22)+t*spd+ph)*amp; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);} ctx.stroke();
  });
  // tangent dot
  const tx=W/2+Math.sin(t*0.6)*60, ty=H/2+Math.sin((tx/22)+t)*35;
  ctx.beginPath(); ctx.arc(tx,ty,5,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fill();
  ctx.font='bold 10px monospace'; ctx.fillStyle='rgba(168,85,247,.9)'; ctx.fillText("sin(x)",6,18);
  ctx.fillStyle='rgba(251,146,60,.9)'; ctx.fillText("cos(x)",6,32);
});

animCanvas('c2', (ctx, W, H, t) => {
  ctx.fillStyle='#0d2010'; ctx.fillRect(0,0,W,H);
  const n=Math.floor(4+Math.abs(Math.sin(t*.35))*14);
  const pad=18, a=pad, b=W-pad, dx=(b-a)/n;
  for(let i=0;i<n;i++){
    const x=a+i*dx, xm=x+dx/2;
    const fy=H-pad-((xm-a)/(b-a))*(H-2*pad)*.82;
    ctx.fillStyle=`rgba(16,185,129,${.35+.25*Math.sin(t+i*.4)})`;
    ctx.fillRect(x,fy,dx-1.5,H-pad-fy);
  }
  ctx.strokeStyle='rgba(16,185,129,.9)'; ctx.lineWidth=2; ctx.beginPath();
  for(let x=a;x<=b;x++){const y=H-pad-((x-a)/(b-a))*(H-2*pad)*.82; x===a?ctx.moveTo(x,y):ctx.lineTo(x,y);} ctx.stroke();
  ctx.font='bold 10px monospace'; ctx.fillStyle='rgba(16,185,129,.9)'; ctx.fillText('∫f(x)dx',6,18);
});

animCanvas('c3', (ctx, W, H, t) => {
  ctx.fillStyle='#1a0a2e'; ctx.fillRect(0,0,W,H);
  const cx=W/2-8,cy=H/2+8,a=40,b=30,p=1+Math.sin(t)*.04;
  ctx.lineWidth=1.5;
  [['rgba(255,79,163,.8)','rgba(255,79,163,.1)',cx-a*p,cy-a*p,a*2*p,a*2*p],
   ['rgba(99,179,255,.8)','rgba(99,179,255,.1)',cx+b*.6,cy-b*p,b*2*p,b*2*p]]
  .forEach(([sc,fc,x,y,w,h])=>{
    ctx.strokeStyle=sc; ctx.fillStyle=fc;
    ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
  });
  ctx.strokeStyle='rgba(255,210,0,.9)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(cx-a,cy+a); ctx.lineTo(cx+b+10,cy-b); ctx.lineTo(cx+b+10,cy+a); ctx.closePath(); ctx.stroke();
  ctx.font='bold 11px monospace'; ctx.fillStyle='#fff'; ctx.fillText('a²+b²=c²',6,18);
});

animCanvas('c4', (ctx, W, H, t) => {
  ctx.fillStyle='#0a0a1e'; ctx.fillRect(0,0,W,H);
  const cx=65,cy=H/2, rs=[28,14,7,4], spds=[1,3,5,7];
  let x=cx,y=cy;
  for(let i=0;i<rs.length;i++){
    const ang=spds[i]*t, nx=x+rs[i]*Math.cos(ang), ny=y+rs[i]*Math.sin(ang);
    ctx.strokeStyle=`rgba(168,85,247,${.55-i*.1})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(x,y,rs[i],0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(nx,ny); ctx.stroke();
    x=nx; y=ny;
  }
  ctx.fillStyle='rgba(255,79,163,.9)'; ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(168,85,247,.55)'; ctx.lineWidth=1.5; ctx.beginPath();
  for(let xi=100;xi<W;xi++){const yi=cy+Math.sin((xi-100)/22-t)*22+Math.sin(3*((xi-100)/22-t))*7+Math.sin(5*((xi-100)/22-t))*3; xi===100?ctx.moveTo(xi,yi):ctx.lineTo(xi,yi);} ctx.stroke();
  ctx.font='bold 10px monospace'; ctx.fillStyle='rgba(168,85,247,.9)'; ctx.fillText('Fourier',6,18);
});

animCanvas('c5', (ctx, W, H, t) => {
  ctx.fillStyle='#0d1520'; ctx.fillRect(0,0,W,H);
  const mu=W/2, sig=38, amp=(H-28)*.85, fill=Math.abs(Math.sin(t*.35));
  ctx.beginPath(); ctx.moveTo(0,H);
  for(let x=0;x<W;x++){const z=(x-mu)/sig; ctx.lineTo(x,H-14-amp*Math.exp(-.5*z*z));} ctx.lineTo(W,H); ctx.closePath();
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,`rgba(251,146,60,${.12+fill*.18})`); g.addColorStop(1,'rgba(251,146,60,.02)');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(251,146,60,.9)'; ctx.lineWidth=2; ctx.beginPath();
  for(let x=0;x<W;x++){const z=(x-mu)/sig; x===0?ctx.moveTo(x,H-14-amp*Math.exp(-.5*z*z)):ctx.lineTo(x,H-14-amp*Math.exp(-.5*z*z));} ctx.stroke();
  [-1,0,1].forEach(k=>{
    ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(mu+k*sig,0); ctx.lineTo(mu+k*sig,H); ctx.stroke(); ctx.setLineDash([]);
  });
  ctx.font='bold 10px monospace'; ctx.fillStyle='rgba(251,146,60,.9)'; ctx.fillText('N(μ,σ²)',6,18);
});

// ════════════════════════════════════════
// STATS CANVAS
// ════════════════════════════════════════
(function statsAnim() {
  const c = document.getElementById('statsCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  let t = 0;
  const syms = ['∫','Σ','π','∞','Δ','∂','∇','√'];
  function draw() {
    t += 0.022;
    ctx.fillStyle = 'rgba(18,8,42,.96)'; ctx.fillRect(0,0,W,H);
    [[2.5,'rgba(168,85,247,.5)',55,1],[1.5,'rgba(255,79,163,.35)',70,.75],[1,'rgba(99,102,241,.3)',35,1.4]]
      .forEach(([lw,col,amp,spd])=>{
        ctx.beginPath(); ctx.strokeStyle=col; ctx.lineWidth=lw;
        for(let x=0;x<W;x++){const y=H/2+Math.sin((x/38)+t*spd)*amp+Math.cos((x/60)+t*.5)*amp*.4; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);} ctx.stroke();
      });
    syms.forEach((s,i)=>{
      const x=30+(i/syms.length)*(W-60), y=H/2+Math.sin(t+i*0.9)*55;
      ctx.font=`bold 26px serif`;
      ctx.globalAlpha=.28+Math.sin(t+i)*.1;
      ctx.fillStyle='#a855f7'; ctx.fillText(s,x,y);
    });
    ctx.globalAlpha=1;
    requestAnimationFrame(draw);
  }
  draw();
})();

// ════════════════════════════════════════
// SCROLL REVEAL
// ════════════════════════════════════════
(function revealOnScroll() {
  const els = document.querySelectorAll('.reveal,.reveal-up');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

// ════════════════════════════════════════
// COUNT-UP STATS
// ════════════════════════════════════════
(function countUp() {
  const nums = document.querySelectorAll('.stat-num[data-target]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const decimal = parseInt(el.dataset.decimal || 0);
      let start = 0, dur = 1400, step = 16;
      const inc = target / (dur / step);
      const timer = setInterval(() => {
        start = Math.min(start + inc, target);
        el.textContent = start.toFixed(decimal) + suffix;
        if (start >= target) clearInterval(timer);
      }, step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
})();

// ════════════════════════════════════════
// ANIMATED STEP PILLS
// ════════════════════════════════════════
(function rotatePills() {
  const pills = document.querySelectorAll('.step-pill');
  if (!pills.length) return;
  let cur = 1;
  setInterval(() => {
    pills.forEach(p => p.classList.remove('active'));
    cur = (cur + 1) % pills.length;
    pills[cur].classList.add('active');
  }, 1800);
})();

// ════════════════════════════════════════
// GENERATE
// ════════════════════════════════════════
function setAndGenerate(text) {
  document.getElementById('hero-prompt').value = text;
  document.getElementById('generate').scrollIntoView({ behavior: 'smooth' });
  setTimeout(generate, 500);
}

function toggleCode() {
  document.getElementById('code-block').classList.toggle('hidden');
}

let selectedFormat  = 'default';
let selectedExplain = 'outside';

function setFormat(btn) {
  btn.closest('.format-picker').querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedFormat = btn.dataset.fmt;
}

function setExplain(btn) {
  btn.closest('.explain-toggle').querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedExplain = btn.dataset.explain;
}

async function generate() {
  const prompt = document.getElementById('hero-prompt').value.trim();
  if (!prompt) return;
  const btn     = document.querySelector('.hero-send-btn');
  const icon    = document.getElementById('hero-btn-icon');
  const spinner = document.getElementById('hero-spinner');
  const resultSec = document.getElementById('result-section');
  const errorBox  = document.getElementById('error-box');
  btn.disabled=true; icon.classList.add('hidden'); spinner.classList.remove('hidden');
  resultSec.classList.add('hidden'); errorBox.classList.add('hidden');
  try {
    const res  = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ prompt, format: selectedFormat, explain: selectedExplain })
    });
    const data = await res.json();
    if (!res.ok) {
      const techDetail = data.detail || '';
      const userMsg = techDetail.includes('timeout') ? 'Render timed out — try a simpler problem or different format.' :
                      techDetail ? `Generation failed: ${techDetail.slice(0, 120)}` :
                      data.error || 'Something went wrong. Please try again.';
      throw new Error(userMsg);
    }
    const video = document.getElementById('result-video');
    video.src = data.videoUrl + '?t=' + Date.now(); video.load();
    document.getElementById('download-btn').href = data.videoUrl;
    document.getElementById('code-content').textContent = data.code;
    document.getElementById('code-block').classList.add('hidden');

    // Show summary
    const summaryBlock = document.getElementById('summary-block');
    const summaryContent = document.getElementById('summary-content');
    if (data.summary && selectedExplain === 'outside') {
      summaryContent.textContent = data.summary;
      summaryBlock.classList.remove('hidden');
      if (window.renderMathInElement) {
        renderMathInElement(summaryContent, {
          delimiters: [
            {left:'$$', right:'$$', display:true},
            {left:'$',  right:'$',  display:false}
          ]
        });
      }
    } else {
      summaryBlock.classList.add('hidden');
    }

    resultSec.classList.remove('hidden');
    resultSec.scrollIntoView({ behavior:'smooth' });
  } catch(err) {
    document.getElementById('error-msg').textContent = err.message;
    errorBox.classList.remove('hidden');
  } finally {
    btn.disabled=false; icon.classList.remove('hidden'); spinner.classList.add('hidden');
  }
}

document.getElementById('hero-prompt').addEventListener('keydown', e => { if(e.key==='Enter') generate(); });
