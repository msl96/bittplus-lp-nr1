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
- **Formulários** (hero e final): validação nativa + estado de sucesso "Recebemos seus dados!". Hoje o envio é apenas visual — para capturar leads de verdade, conectar a um endpoint (ex.: Formspree, RD Station, webhook) no listener de `submit` em `index.html`.
- **Barra fixa (CTA)**: aparece após rolar ~85% da primeira dobra.
