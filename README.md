# BittPlus — Landing Page NR-1

Landing page de captação da BittPlus focada na adequação de empresas à **NR-1** (gestão de riscos psicossociais).

Site estático, sem build: um único `index.html` com HTML/CSS/JS vanilla e imagens em `assets/`. Rápido, indexável (SEO/Open Graph) e sem dependências de runtime externo.

## Estrutura

```
.
├── index.html        # página completa
├── assets/           # logos e imagens
└── vercel.json       # config de deploy (headers de cache)
```

## Desenvolvimento local

Qualquer servidor estático serve. Por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 3000
```

Depois abra http://localhost:3000.

## Deploy (Vercel)

O projeto é servido como site estático. O deploy é automático a cada push na branch `main` via integração com a Vercel.

## Interações

- **FAQ**: accordion (abre um item por vez).
- **Formulários** (hero e final): validação nativa → `POST /api/lead` → redireciona para `/obrigado`.
- **Barra fixa (CTA)**: aparece após rolar ~85% da primeira dobra.

## Captura de leads (`/api/lead`)

Os formulários enviam para a serverless function em [`api/lead.js`](api/lead.js). Ela sempre registra o lead nos **Runtime Logs** da Vercel (nada se perde) e encaminha para o destino configurado via variáveis de ambiente (Settings → Environment Variables):

| Variável | Função |
|---|---|
| `LEAD_WEBHOOK_URL` | URL de webhook que recebe o lead em JSON (RD Station, Zapier, Make, n8n…). **Recomendado.** |
| `RESEND_API_KEY` | (opcional) chave [Resend](https://resend.com) para enviar o lead por e-mail. |
| `LEAD_TO_EMAIL` | (opcional) e-mail que recebe o lead. Default: `contato@bittplus.com.br`. |
| `LEAD_FROM_EMAIL` | (opcional) remetente verificado na Resend. |

Enquanto nenhum destino estiver setado, os leads ficam visíveis apenas nos logs da Vercel. Após configurar uma variável, faça um novo deploy para aplicar.
