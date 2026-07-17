// Vercel Serverless Function — recebe os leads da landing page.
//
// Destino do lead (configure em Settings → Environment Variables na Vercel):
//   LEAD_WEBHOOK_URL  → URL de webhook (RD Station, Zapier, Make, n8n, etc.).
//                       Recebe um POST JSON com os dados do lead.
//   RESEND_API_KEY    → (opcional) chave da Resend para enviar por e-mail.
//   LEAD_TO_EMAIL     → (opcional) e-mail que recebe o lead (default: contato@bittplus.com.br).
//   LEAD_FROM_EMAIL   → (opcional) remetente verificado na Resend.
//
// Enquanto nenhum destino estiver configurado, o lead é registrado nos
// Runtime Logs da Vercel (nada é perdido) e a resposta continua sendo 200.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const lead = {
    nome: String(body.nome || '').trim(),
    empresa: String(body.empresa || '').trim(),
    email: String(body.email || '').trim(),
    whatsapp: String(body.whatsapp || '').trim(),
    colaboradores: String(body.colaboradores || '').trim(),
    origem: String(body.origem || 'landing-nr1').trim(),
    recebido_em: new Date().toISOString(),
  };

  // Validação mínima
  if (!lead.nome || !lead.empresa || !lead.email) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  // Sempre registra nos logs (garante que nenhum lead se perca antes do webhook)
  console.log('[LEAD]', JSON.stringify(lead));

  const tasks = [];

  if (process.env.LEAD_WEBHOOK_URL) {
    tasks.push(
      fetch(process.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch((err) => console.error('[LEAD] webhook falhou:', err))
    );
  }

  if (process.env.RESEND_API_KEY) {
    const to = process.env.LEAD_TO_EMAIL || 'contato@bittplus.com.br';
    const from = process.env.LEAD_FROM_EMAIL || 'BittPlus LP <onboarding@resend.dev>';
    const html =
      `<h2>Novo lead — Landing NR-1</h2>` +
      `<p><b>Nome:</b> ${esc(lead.nome)}</p>` +
      `<p><b>Empresa:</b> ${esc(lead.empresa)}</p>` +
      `<p><b>E-mail:</b> ${esc(lead.email)}</p>` +
      `<p><b>WhatsApp:</b> ${esc(lead.whatsapp)}</p>` +
      `<p><b>Colaboradores:</b> ${esc(lead.colaboradores)}</p>` +
      `<p><b>Origem:</b> ${esc(lead.origem)}</p>`;
    tasks.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject: `Novo lead NR-1: ${lead.empresa}`, html }),
      }).catch((err) => console.error('[LEAD] resend falhou:', err))
    );
  }

  await Promise.allSettled(tasks);
  return res.status(200).json({ ok: true });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
