/* Empira · teacher AI clone widget
   A floating launcher (bottom right, like the MyGov assistant) that opens a chat
   with an AI assistant trained on one teacher's own materials and style.
   Config: set window.EMPIRA_CLONE before this script loads (all keys optional).
   Live answers: POST to cfg.api (see /api/clone.js). If that is unavailable,
   the widget falls back to built-in demo answers so the demo always works. */
(function () {
  if (window.EmpiraClone) return;
  const cfg = Object.assign({
    teacher: 'Dilnoza Karimova',
    short: 'Dilnoza opa',
    initials: 'DK',
    subject: 'Fizika',
    klass: '8-B',
    student: 'Aziz',
    mode: 'student',            // 'student' or 'preview' (teacher testing her clone)
    api: '../api/clone',
    context: () => ({})         // returns { id, lab } for the page the student is on
  }, window.EMPIRA_CLONE || {});

  /* ---------- styles ---------- */
  const css = `
.ecw{--ecw-card:#FFFFFF;--ecw-bg:#F6F7FB;--ecw-ink:#0B1026;--ecw-text2:#3E445C;--ecw-muted:#5B6178;--ecw-border:#E1E4EE;--ecw-blue:#3B4CFF;--ecw-blue-soft:#EEF0FF;--ecw-amber:#FFB21E;--ecw-amber-soft:#FFF4DC;--ecw-green:#12805C;--ecw-shadow:0 24px 60px -20px rgba(11,16,38,.35);
  font-family:"Instrument Sans","Segoe UI",system-ui,sans-serif;font-size:15px;line-height:1.5;color:var(--ecw-ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ecw{--ecw-card:#141A36;--ecw-bg:#0F1430;--ecw-ink:#F1F3FA;--ecw-text2:#C3C8DD;--ecw-muted:#9AA1BD;--ecw-border:#262E55;--ecw-blue:#6F7CFF;--ecw-blue-soft:#1D2555;--ecw-amber-soft:#3A2E10;--ecw-green:#3FCB95;--ecw-shadow:0 24px 60px -20px rgba(0,0,0,.7)}}
:root[data-theme="dark"] .ecw{--ecw-card:#141A36;--ecw-bg:#0F1430;--ecw-ink:#F1F3FA;--ecw-text2:#C3C8DD;--ecw-muted:#9AA1BD;--ecw-border:#262E55;--ecw-blue:#6F7CFF;--ecw-blue-soft:#1D2555;--ecw-amber-soft:#3A2E10;--ecw-green:#3FCB95;--ecw-shadow:0 24px 60px -20px rgba(0,0,0,.7)}
.ecw *{box-sizing:border-box}
.ecw button,.ecw textarea{font:inherit;color:inherit}
.ecw-launch{position:fixed;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:70;width:60px;height:60px;border-radius:50%;border:3px solid #fff;padding:0;cursor:pointer;
  background:linear-gradient(140deg,#4C5CFF 0%,#2A36C7 100%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 28px -8px rgba(42,54,199,.7),0 2px 6px rgba(11,16,38,.2);transition:transform .15s}
.ecw-launch:hover{transform:translateY(-2px) scale(1.03)}
.ecw-launch:focus-visible{outline:3px solid var(--ecw-amber);outline-offset:3px}
.ecw-ini{font-family:Sora,"Segoe UI",system-ui,sans-serif;font-weight:700;font-size:19px;letter-spacing:.02em}
.ecw-launch img,.ecw-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.ecw-ai{position:absolute;top:-6px;right:-8px;height:20px;padding:0 6px;border-radius:999px;background:var(--ecw-amber);color:#0B1026;border:2px solid #fff;font:700 10.5px/16px "Instrument Sans",system-ui,sans-serif;letter-spacing:.04em}
.ecw-on{position:absolute;bottom:1px;right:1px;width:13px;height:13px;border-radius:50%;background:#1FB57A;border:2px solid #fff}
.ecw-tip{position:fixed;right:calc(92px + env(safe-area-inset-right,0px));bottom:calc(28px + env(safe-area-inset-bottom,0px));z-index:70;max-width:250px;background:var(--ecw-card);color:var(--ecw-ink);border:1px solid var(--ecw-border);border-radius:14px 14px 4px 14px;padding:10px 32px 10px 14px;font-size:14px;box-shadow:var(--ecw-shadow)}
.ecw-tip b{display:block;font-size:14px}
.ecw-tip button{position:absolute;top:6px;right:6px;width:22px;height:22px;border:0;background:none;color:var(--ecw-muted);cursor:pointer;border-radius:6px}
.ecw-panel{position:fixed;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:71;width:380px;height:min(600px,calc(100vh - 120px));display:flex;flex-direction:column;
  background:var(--ecw-card);border:1px solid var(--ecw-border);border-radius:20px;box-shadow:var(--ecw-shadow);overflow:hidden;transform-origin:bottom right;animation:ecw-in .18s ease-out}
@keyframes ecw-in{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ecw-panel{animation:none}.ecw-launch{transition:none}.ecw-dots i{animation:none!important}}
.ecw-head{display:flex;align-items:center;gap:12px;padding:14px 12px 12px 16px;border-bottom:1px solid var(--ecw-border)}
.ecw-av{position:relative;width:42px;height:42px;border-radius:50%;flex:none;background:linear-gradient(140deg,#4C5CFF,#2A36C7);color:#fff;display:flex;align-items:center;justify-content:center}
.ecw-av .ecw-ini{font-size:15px}
.ecw-av .ecw-on{width:11px;height:11px;border-color:var(--ecw-card)}
.ecw-who{flex:1;min-width:0}
.ecw-who b{display:flex;align-items:center;gap:6px;font-family:Sora,"Segoe UI",system-ui,sans-serif;font-size:15.5px;line-height:1.2}
.ecw-who small{display:block;color:var(--ecw-muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ecw-tag{font:700 10px/1 "Instrument Sans",system-ui,sans-serif;letter-spacing:.05em;padding:4px 6px;border-radius:6px;background:var(--ecw-amber);color:#0B1026}
.ecw-ib{width:34px;height:34px;border:0;border-radius:10px;background:transparent;color:var(--ecw-muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none}
.ecw-ib:hover{background:var(--ecw-bg);color:var(--ecw-ink)}
.ecw-ib[aria-expanded="true"]{background:var(--ecw-blue-soft);color:var(--ecw-blue)}
.ecw-disc{padding:9px 16px;background:var(--ecw-blue-soft);font-size:12.5px;color:var(--ecw-text2);line-height:1.45}
.ecw-disc b{color:var(--ecw-ink)}
.ecw-disc ul{margin:6px 0 2px;padding-left:16px}
.ecw-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--ecw-bg);overscroll-behavior:contain}
.ecw-msg{max-width:86%;display:flex;flex-direction:column;gap:6px}
.ecw-msg.bot{align-self:flex-start}
.ecw-msg.me{align-self:flex-end}
.ecw-b{padding:10px 13px;border-radius:16px 16px 16px 4px;background:var(--ecw-card);border:1px solid var(--ecw-border);white-space:pre-wrap;word-wrap:break-word}
.ecw-msg.me .ecw-b{background:var(--ecw-blue);border-color:transparent;color:#fff;border-radius:16px 16px 4px 16px}
.ecw-src{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;font-size:12px;color:var(--ecw-muted);padding:0 4px}
.ecw-hand{align-self:flex-start;height:34px;padding:0 12px;border-radius:10px;border:1px solid var(--ecw-border);background:var(--ecw-card);font-weight:600;font-size:13.5px;color:var(--ecw-blue);cursor:pointer}
.ecw-hand:hover{border-color:var(--ecw-blue)}
.ecw-hand:disabled{color:var(--ecw-green);cursor:default;border-color:transparent;background:transparent;padding:0 4px}
.ecw-dots{display:inline-flex;gap:4px;padding:14px 14px}
.ecw-dots i{width:7px;height:7px;border-radius:50%;background:var(--ecw-muted);animation:ecw-b 1s infinite}
.ecw-dots i:nth-child(2){animation-delay:.15s}.ecw-dots i:nth-child(3){animation-delay:.3s}
@keyframes ecw-b{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}
.ecw-sug{display:flex;gap:6px;overflow-x:auto;padding:10px 12px 2px;scrollbar-width:none;background:var(--ecw-card)}
.ecw-sug::-webkit-scrollbar{display:none}
.ecw-sug button{flex:none;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--ecw-border);background:var(--ecw-card);font-size:13px;font-weight:600;color:var(--ecw-text2);cursor:pointer;white-space:nowrap}
.ecw-sug button:hover{border-color:var(--ecw-blue);color:var(--ecw-blue)}
.ecw-form{display:flex;align-items:flex-end;gap:8px;padding:10px 12px 12px;background:var(--ecw-card)}
.ecw-form textarea{flex:1;min-height:44px;max-height:120px;resize:none;border:1px solid var(--ecw-border);border-radius:14px;padding:11px 14px;background:var(--ecw-bg);outline:none}
.ecw-form textarea:focus{border-color:var(--ecw-blue)}
.ecw-send{width:44px;height:44px;border-radius:50%;border:0;background:var(--ecw-blue);color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none}
.ecw-send:disabled{opacity:.45;cursor:default}
.ecw-foot{padding:0 16px 10px;background:var(--ecw-card);font-size:11.5px;color:var(--ecw-muted);text-align:center}
.ecw[data-open="true"] .ecw-tip{display:none}
@media (max-width:560px){
  .ecw-launch{width:56px;height:56px;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px))}
  .ecw-tip{right:calc(80px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));max-width:210px}
  .ecw-panel{inset:0;width:auto;height:auto;border-radius:0;border:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
  .ecw[data-open="true"] .ecw-launch{display:none}
}`;

  /* ---------- helpers ---------- */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => ' ' + String(s).toLowerCase().replace(/[ʻʼ‘’`´]/g, "'").replace(/\s+/g, ' ') + ' ';
  const has = (q, words) => words.some(w => q.includes(w));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const ctx = () => { try { return cfg.context() || {}; } catch (e) { return {}; } };
  const avatar = cls => `<span class="${cls}">${cfg.photo ? `<img src="${esc(cfg.photo)}" alt="">` : `<span class="ecw-ini">${esc(cfg.initials)}</span>`}<span class="ecw-on" aria-hidden="true"></span></span>`;
  const ICON = {
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    doc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h5"/></svg>',
    spark: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/></svg>'
  };

  /* ---------- built-in demo knowledge (from the teacher's own materials) ---------- */
  const SRC = {
    ohm: "8-sinf konspekti · 12-dars «Om qonuni»",
    meters: "8-sinf konspekti · 13-dars «O'lchov asboblari»",
    parallel: "8-sinf konspekti · 15-dars «Parallel ulanish»",
    hw: "Telegram kanal · 24-sentabr posti",
    test: "Nazorat ishi rejasi · 1-chorak",
    style: "Dars uslubi · Dilnoza opa izohlari",
    hooke: "8-sinf konspekti · 5-dars «Elastiklik kuchi»",
    pendulum: "9-sinf konspekti · 3-dars «Tebranishlar»",
    refraction: "8-sinf konspekti · 22-dars «Yorug'likning sinishi»"
  };
  const A = {
    ohm: ["Bolam, suv quvurini tasavvur qil. Kuchlanish bu nasos, qarshilik esa quvurning torligi. Quvur toraysa, suv kamroq oqadi, to'g'rimi? Tok ham xuddi shunday.\n\nEndi o'zing ayt: qarshilik 2 barobar oshsa, tok nima bo'ladi? Laboratoriyada 10 Ω va 20 Ω da o'lchab tekshir.", SRC.ohm],
    meters: ["Eslab qol: ampermetr navbatda turgan odamga o'xshaydi, zanjirga ketma-ket ulanadi, tok undan o'tishi shart. Voltmetr esa chetdan kuzatadi, parallel ulanadi.\n\nSinfimizda 9 kishi aynan shu joyda adashdi. Sen sxemangga qarab ayt: ampermetring qayerda turibdi?", SRC.meters],
    parallel: ["Ikki yo'lni tasavvur qil: mashinalar ikkalasidan ham o'ta oladi. Bitta yo'l yopilsa, ikkinchisi ishlayveradi. Parallel ulanishda ham har bir chiroqning o'z yo'li bor.\n\nUmumiy tok nimaga teng bo'ladi deb o'ylaysan? I₁ va I₂ ni o'lchab, qo'shib ko'r.", SRC.parallel],
    hw: ["Uyga vazifa: darslikdagi 34-mashq, 2 va 3-masalalar. Yana Empira'da Om qonuni laboratoriyasini 2 ta o'lchov bilan tugat.\n\nMuddat: payshanba, 18:00 gacha. Kechiktirma, bolam.", SRC.hw],
    test: ["Nazorat ishi 3-oktabr, dushanba kuni. Takrorla: Om qonuni, ampermetr va voltmetrni ulash, parallel ulanish.\n\nFormulani yodlama, tushun: har bir masalada avval sxema chiz, keyin hisobla.", SRC.test],
    formula: ["Formulani yodlama, tushun. I = U / R ni yodlagan bola masalada adashadi, tushungan bola esa formulani o'zi chiqarib oladi.\n\nQani, ayt-chi: kuchlanish oshsa, tok nima bo'ladi?", SRC.style],
    hooke: ["Prujinani qo'lingda cho'zib ko'rgansan-a? Qancha kuchli tortsang, shuncha ko'p cho'ziladi. Guk qonuni shu: F = k·x.\n\nLaboratoriyada 200 g va 400 g osib, cho'zilishni solishtir. Nechchi barobar oshdi?", SRC.hooke],
    pendulum: ["Arg'imchoqni esla: uzun arg'imchoq sekinroq tebranadi. Qiziq joyi bor: ipni 4 barobar qisqartirsang, davr 4 barobar emas, 2 barobar kamayadi.\n\nNega shunday bo'lishini o'ylab ko'r. Formulaga qara: T = 2π√(L/g). Ildiz nima qilyapti?", SRC.pendulum],
    refraction: ["Hovuzga qarasang, oyoqlaring kaltaroq ko'rinadi, to'g'rimi? Bu nurning sinishi. Nur shishaga kirganda normalga yaqinlashadi.\n\n30° va 60° da o'lchab ko'r: sinish burchagi ham 2 barobar oshadimi? Oshmasa, sinuslarni solishtir.", SRC.refraction],
    answer: ["Javobni tayyor aytmayman, kelishganmiz-ku. Lekin yordam beraman: qaysi qadamda to'xtab qolding? O'lchovlaringni yoz, birga ko'ramiz.", SRC.style],
    thanks: ["Arzimaydi, bolam. Savol berayotgan bo'lsang, demak o'ylayapsan. Bu eng muhimi.", null],
    hello: ["Va alaykum assalom! Qaysi mavzuda yordam kerak?", null]
  };
  const LAB_INTENT = { ohm: 'ohm', parallel: 'parallel', hooke: 'hooke', pendulum: 'pendulum', refraction: 'refraction' };

  function localAnswer(text) {
    const q = norm(text), c = ctx();
    let k = null;
    if (has(q, ['javobini ayt', 'javob nima', 'javobi nima', 'javobni ayt', 'tayyor javob'])) k = 'answer';
    else if (has(q, ['ampermetr', 'voltmetr', "o'lchov asbob", 'ulanadi', 'ulayman'])) k = 'meters';
    else if (has(q, ['parallel', 'ketma-ket', 'tarmoq'])) k = 'parallel';
    else if (has(q, [' om ', 'om qonun', 'qarshilik', 'tok kuchi', 'ohm'])) k = 'ohm';
    else if (has(q, ['vazifa', 'uy ish', 'uyga'])) k = 'hw';
    else if (has(q, ['nazorat', 'test', 'imtihon', 'takrorla'])) k = 'test';
    else if (has(q, ['prujina', 'guk', 'cho\'zil'])) k = 'hooke';
    else if (has(q, ['mayatnik', 'tebran', 'davr'])) k = 'pendulum';
    else if (has(q, ['sinish', 'nur', 'lazer', 'shisha'])) k = 'refraction';
    else if (has(q, ['formula', 'yodla'])) k = 'formula';
    else if (has(q, ['rahmat', 'raxmat', 'tashakkur'])) k = 'thanks';
    else if (has(q, ['salom', 'assalom'])) k = 'hello';
    else if (c.id && LAB_INTENT[c.id] && has(q, ['tushunmadim', 'tushuntir', 'qanday', 'nega', 'nima uchun', 'yordam'])) k = LAB_INTENT[c.id];
    if (k) return { reply: A[k][0], source: A[k][1] };
    return { reply: `Bu savolga aniq javobim yo'q, taxmin qilib aytmayman. Istasang, savolingni ${cfg.short}ning o'ziga yuboraman.`, handoff: true };
  }

  async function liveAnswer(history) {
    if (!cfg.api || !/^https?:/.test(location.protocol)) throw new Error('no api');
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
    try {
      const r = await fetch(cfg.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ac.signal,
        body: JSON.stringify({ messages: history.slice(-10), context: ctx(), student: cfg.student, mode: cfg.mode }) });
      if (!r.ok) throw new Error('api ' + r.status);
      const j = await r.json(); if (!j || !j.reply) throw new Error('empty');
      return j;
    } finally { clearTimeout(t); }
  }

  /* ---------- DOM ---------- */
  const style = el('style'); style.textContent = css; document.head.appendChild(style);
  const root = el('div', 'ecw'); root.dataset.open = 'false';
  const launch = el('button', 'ecw-launch', avatar('') .replace('<span class="">', '<span style="display:contents">') + '<span class="ecw-ai" aria-hidden="true">AI</span>');
  launch.type = 'button';
  launch.setAttribute('aria-label', `${cfg.short}ning AI yordamchisini ochish`);
  launch.setAttribute('aria-expanded', 'false');
  root.appendChild(launch);

  const firstName = cfg.student;
  let tip = null;
  if (cfg.mode === 'student' && !ss.get('ecw-tip')) {
    tip = el('div', 'ecw-tip', `<b>Savol bormi, ${esc(firstName)}?</b>Men ${esc(cfg.short)}ning AI yordamchisiman.<button type="button" aria-label="Yopish">${ICON.close}</button>`);
    tip.querySelector('button').addEventListener('click', () => { tip.remove(); ss.set('ecw-tip', '1'); });
    root.appendChild(tip);
    setTimeout(() => { if (tip && tip.isConnected) { tip.remove(); ss.set('ecw-tip', '1'); } }, 9000);
  }
  document.body.appendChild(root);

  let panel, log, input, sendBtn, sug, disc, infoBtn, busy = false;
  const history = [];

  function build() {
    panel = el('section', 'ecw-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', `${cfg.short} · AI yordamchi`);
    const sub = cfg.mode === 'preview' ? 'Sinov rejimi · faqat siz ko\'rasiz' : `${cfg.subject} o'qituvchisi · ${cfg.klass} sinf`;
    panel.innerHTML = `
      <div class="ecw-head">${avatar('ecw-av')}
        <div class="ecw-who"><b>${esc(cfg.short)} <span class="ecw-tag">AI</span></b><small>${esc(sub)}</small></div>
        <button class="ecw-ib" type="button" data-a="info" aria-label="Bu qanday ishlaydi" aria-expanded="false">${ICON.info}</button>
        <button class="ecw-ib" type="button" data-a="close" aria-label="Yopish">${ICON.close}</button>
      </div>
      <div class="ecw-disc" id="ecw-disc"><b>Bu AI klon.</b> ${esc(cfg.short)}ning konspektlari, nazorat ishlari va Telegram kanal postlari asosida, uning uslubida javob beradi.</div>
      <div class="ecw-log" aria-live="polite"></div>
      <div class="ecw-sug" aria-label="Tayyor savollar"></div>
      <form class="ecw-form"><textarea rows="1" placeholder="Savolingni yoz…" aria-label="Savol"></textarea><button class="ecw-send" type="submit" aria-label="Yuborish" disabled>${ICON.send}</button></form>
      <div class="ecw-foot">Javoblar xato bo'lishi mumkin. Muhim savollar ${esc(cfg.short)}ga yuboriladi.</div>`;
    log = panel.querySelector('.ecw-log'); input = panel.querySelector('textarea'); sendBtn = panel.querySelector('.ecw-send');
    sug = panel.querySelector('.ecw-sug'); disc = panel.querySelector('.ecw-disc'); infoBtn = panel.querySelector('[data-a="info"]');
    panel.querySelector('[data-a="close"]').addEventListener('click', close);
    infoBtn.addEventListener('click', toggleInfo);
    panel.querySelector('form').addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
    input.addEventListener('input', () => { sendBtn.disabled = !input.value.trim() || busy; input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    root.appendChild(panel);
    greet();
  }

  function toggleInfo() {
    const open = infoBtn.getAttribute('aria-expanded') !== 'true';
    infoBtn.setAttribute('aria-expanded', String(open));
    disc.innerHTML = open
      ? `<b>Bu AI klon.</b> ${esc(cfg.short)} o'zi tanlagan materiallardan o'rgangan:<ul><li>dars konspektlari va nazorat ishlari</li><li>Telegram kanalidagi e'lonlar va tushuntirishlar</li><li>uning tushuntirish uslubi va sevimli misollari</li></ul>O'quvchilar bilan shaxsiy yozishmalar olinmagan. Klon tayyor javobni aytmaydi, bilmasa o'qituvchiga yuboradi.`
      : `<b>Bu AI klon.</b> ${esc(cfg.short)}ning konspektlari, nazorat ishlari va Telegram kanal postlari asosida, uning uslubida javob beradi.`;
  }

  function suggestions() {
    const c = ctx(), list = [];
    if (c.lab) list.push(`Opa, «${c.lab}»ni tushuntiring`);
    list.push('Uyga vazifa nima edi?', 'Nazorat ishiga nimani takrorlay?');
    if (!c.lab || c.id === 'ohm' || c.id === 'parallel') list.push('Ampermetr qanday ulanadi?');
    if (!c.lab) list.push('Om qonunini tushuntiring');
    sug.innerHTML = '';
    list.forEach(t => { const b = el('button', null, esc(t)); b.type = 'button'; b.addEventListener('click', () => ask(t.replace(/«(.+)»ni tushuntiring/, '$1 mavzusini tushunmadim'))); sug.appendChild(b); });
  }

  function greet() {
    const c = ctx();
    const text = cfg.mode === 'preview'
      ? `Bu klonning sinov rejimi, ${cfg.short}. O'quvchi kabi savol bering: javob sizning uslubingizga mos kelmasa, «Klon uslubi» bo'limida tuzatasiz.`
      : `Assalomu alaykum, ${firstName}! Men ${cfg.short}ning AI yordamchisiman.${c.lab ? ` «${c.lab}» laboratoriyasida ekansan, ko'rib turibman.` : ''}\n\nQayeri tushunarsiz bo'lsa, yoz. Faqat javobni birdan aytmayman: birga topamiz.`;
    bot({ reply: text });
    suggestions();
  }

  function bubble(who, text) {
    const m = el('div', 'ecw-msg ' + who);
    m.appendChild(el('div', 'ecw-b', esc(text)));
    log.appendChild(m); log.scrollTop = log.scrollHeight;
    return m;
  }
  function bot(r) {
    const m = bubble('bot', r.reply);
    if (r.source) m.appendChild(el('span', 'ecw-src', `${ICON.doc}Manba: ${esc(r.source)}`));
    if (r.handoff) {
      const b = el('button', 'ecw-hand', `${esc(cfg.short)}ga yuborish`); b.type = 'button';
      b.addEventListener('click', () => {
        b.disabled = true; b.textContent = 'Yuborildi ✓';
        setTimeout(() => bot({ reply: `Savolingni ${cfg.short}ga yubordim. U odatda darsdan keyin javob beradi, javob shu yerda chiqadi.` }), reduced() ? 0 : 500);
        document.dispatchEvent(new CustomEvent('empira-clone-handoff'));
      });
      m.appendChild(b);
    }
    log.scrollTop = log.scrollHeight;
  }

  async function ask(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    busy = true; input.value = ''; input.style.height = 'auto'; sendBtn.disabled = true;
    bubble('me', text); history.push({ role: 'user', content: text });
    const typing = el('div', 'ecw-msg bot', '<div class="ecw-b ecw-dots" aria-label="Yozmoqda"><i></i><i></i><i></i></div>');
    log.appendChild(typing); log.scrollTop = log.scrollHeight;
    const started = performance.now();
    let r;
    try { r = await liveAnswer(history); } catch (e) { r = localAnswer(text); }
    const wait = reduced() ? 0 : Math.max(0, 700 - (performance.now() - started));
    setTimeout(() => {
      typing.remove(); bot(r); history.push({ role: 'assistant', content: r.reply });
      busy = false; sendBtn.disabled = !input.value.trim();
      document.dispatchEvent(new CustomEvent('empira-clone-question', { detail: { text } }));
    }, wait);
  }

  function open() {
    if (!panel) build(); else { panel.hidden = false; suggestions(); }
    if (tip && tip.isConnected) { tip.remove(); ss.set('ecw-tip', '1'); }
    root.dataset.open = 'true'; launch.setAttribute('aria-expanded', 'true');
    setTimeout(() => input && input.focus(), 50);
  }
  function close() {
    if (panel) panel.hidden = true;
    root.dataset.open = 'false'; launch.setAttribute('aria-expanded', 'false'); launch.focus();
  }
  launch.addEventListener('click', () => (root.dataset.open === 'true' ? close() : open()));

  window.EmpiraClone = { open, close, ask: t => { open(); ask(t); } };
})();
