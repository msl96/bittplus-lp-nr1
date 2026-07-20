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

  const str = (v) => String(v || '').trim();

  const lead = {
    nome: str(body.nome),
    empresa: str(body.empresa),
    email: str(body.email),
    whatsapp: str(body.whatsapp),
    colaboradores: str(body.colaboradores),
    origem: str(body.origem) || 'landing-nr1',
    recebido_em: new Date().toISOString(),

    // Atribuição de campanha
    utm_source: str(body.utm_source),
    utm_medium: str(body.utm_medium),
    utm_campaign: str(body.utm_campaign),
    utm_term: str(body.utm_term),
    utm_content: str(body.utm_content),
    gclid: str(body.gclid),
    fbclid: str(body.fbclid),
    referrer: str(body.referrer),
    landing_page: str(body.landing_page),
    pagina: str(body.pagina),

    // Metadados da requisição
    ip: str(req.headers['x-forwarded-for']).split(',')[0].trim(),
    user_agent: str(req.headers['user-agent']),
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
      })
        .then(async (r) => {
          // fetch não rejeita em 4xx/5xx: é preciso checar o status explicitamente
          if (r.ok) {
            console.log('[LEAD] webhook OK:', r.status);
          } else {
            console.error('[LEAD] webhook recusou:', r.status, (await r.text()).slice(0, 300));
          }
        })
        .catch((err) => console.error('[LEAD] webhook falhou (rede):', err))
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
      `<p><b>Origem:</b> ${esc(lead.origem)}</p>` +
      `<hr><p><b>Campanha:</b> ${esc(lead.utm_source || '—')} / ${esc(lead.utm_medium || '—')} / ${esc(lead.utm_campaign || '—')}</p>` +
      `<p><b>Referrer:</b> ${esc(lead.referrer || '—')}</p>`;
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
