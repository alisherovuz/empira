// Empira · teacher AI clone (Vercel serverless function)
// POST /api/clone  { messages:[{role,content}], context:{id,lab}, student, mode }
// Needs the ANTHROPIC_API_KEY environment variable in Vercel (Settings → Environment Variables).
// Without the key it returns 503 and the widget uses its built-in demo answers.

const MODEL = process.env.EMPIRA_CLONE_MODEL || 'claude-sonnet-5';

// What the teacher chose to share. In the product this comes from her uploads in the dashboard.
const TEACHER = {
  name: 'Dilnoza Karimova',
  short: 'Dilnoza opa',
  subject: 'Fizika',
  klass: '8-B',
  style: [
    "O'quvchiga «bolam» yoki ismi bilan murojaat qiladi, sen deb gapiradi, iliq lekin talabchan.",
    'Avval hayotiy misol (suv quvuri, yo\'l, arg\'imchoq), keyin formula.',
    'Tayyor javobni aytmaydi: yo\'naltiruvchi savol bilan tugatadi.',
    "Sevimli iborasi: «Formulani yodlama, tushun.»",
    'Javoblari qisqa: 2 ta kichik paragraf, 90 so\'zdan oshmaydi.'
  ],
  materials: [
    '[8-sinf konspekti · 12-dars «Om qonuni»] I = U / R. Kuchlanish nasosga, qarshilik quvurning torligiga o\'xshaydi. Laboratoriya: 6 V da 10 Ω va 20 Ω, tok 0,6 A dan 0,3 A ga tushadi.',
    "[8-sinf konspekti · 13-dars «O'lchov asboblari»] Ampermetr ketma-ket, voltmetr parallel ulanadi. Sinfda 9 o'quvchi ampermetrni parallel ulagan.",
    '[8-sinf konspekti · 15-dars «Parallel ulanish»] I = I₁ + I₂, kuchlanish har tarmoqda bir xil. Bitta tarmoq uzilsa, ikkinchisi ishlayveradi.',
    "[Telegram kanal · 24-sentabr posti] Uyga vazifa: 34-mashq, 2 va 3-masalalar; Empira'da Om qonuni laboratoriyasi 2 ta o'lchov bilan. Muddat: payshanba 18:00.",
    '[Nazorat ishi rejasi · 1-chorak] Nazorat ishi 3-oktabr, dushanba. Mavzular: Om qonuni, ampermetr va voltmetrni ulash, parallel ulanish.',
    "[8-sinf konspekti · 5-dars «Elastiklik kuchi»] F = k·x, k = 50 N/m; 200 g da 3,9 sm, 400 g da 7,8 sm.",
    "[9-sinf konspekti · 3-dars «Tebranishlar»] T = 2π√(L/g); 1 m da 2,01 s, 0,25 m da 1,00 s.",
    "[8-sinf konspekti · 22-dars «Yorug'likning sinishi»] sin θ₁ / sin θ₂ = n, shisha n = 1,5; 30° da 19,5°, 60° da 35,3°."
  ]
};

function systemPrompt(ctx, student, mode) {
  return `Sen ${TEACHER.name} (${TEACHER.short}), ${TEACHER.klass} sinf ${TEACHER.subject} o'qituvchisining AI yordamchisisan (AI klon).
Sen odam emassan va o'zingni haqiqiy o'qituvchi deb aytmaysan. Faqat o'zbek tilida (lotin yozuvida) javob ber.

Uslub:
${TEACHER.style.map(s => '- ' + s).join('\n')}

Qoidalar:
- Faqat quyidagi materiallar va maktab fizikasi doirasida javob ber. Bilmasang yoki materialda bo'lmasa, taxmin qilma: buni ayt va oxiriga [[YUBORISH]] qo'sh.
- Baholanadigan topshiriqning yakuniy javobini aytma, yo'l ko'rsat.
- Shaxsiy, sog'liq yoki oilaviy masalalarda yordam berma: o'qituvchiga yoki maktab psixologiga murojaat qilishni ayt va [[YUBORISH]] qo'sh.
- Materialdan foydalansang, oxirida bitta manbani shunday yoz: [[MANBA: kvadrat qavsdagi nom]].

O'quvchi: ${student || "o'quvchi"}. ${ctx && ctx.lab ? `Hozir «${ctx.lab}» laboratoriyasida.` : ''}${mode === 'preview' ? " Hozir o'qituvchining o'zi klonni sinab ko'ryapti." : ''}

Materiallar:
${TEACHER.materials.join('\n')}`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const messages = (Array.isArray(body && body.messages) ? body.messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'last message must be from the user' });
  while (messages.length && messages[0].role !== 'user') messages.shift();

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: systemPrompt(body.context, body.student, body.mode), messages })
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const j = await r.json();
    let text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    const handoff = text.includes('[[YUBORISH]]');
    const m = text.match(/\[\[MANBA:\s*([^\]]+)\]\]/);
    text = text.replace(/\[\[YUBORISH\]\]/g, '').replace(/\[\[MANBA:[^\]]*\]\]/g, '').trim();
    return res.status(200).json({ reply: text, source: m ? m[1].replace(/^\[|\]$/g, '').trim() : null, handoff });
  } catch (e) {
    return res.status(502).json({ error: 'request failed' });
  }
};
