# Rodrigo Pinheiro — Zara Aqua Workstation

Portfólio bilíngue de **Rodrigo Araújo Maciel Pinheiro / Zara Takion**, com foco em **Back-End Python Júnior** e serviços de APIs, manutenção e integração web.

- Site: https://portfolio.zaratakion.workers.dev/
- English: https://portfolio.zaratakion.workers.dev/en/
- Currículo: https://github.com/ZaraTakion/Curriculo

## Perfil e projetos

A identidade Aqua Workstation é preservada: desktop com janelas, explorador, terminal de navegação e atalhos; no celular, documento responsivo. O perfil abre imediatamente. A introdução permanece opcional no desktop.

Três estudos de caso em destaque:

1. **Chamados API** — Django REST, JWT, autorização, histórico e outbox transacional. Demonstração local, sem servidor público de API.
2. **Takion Campus** — plataforma acadêmica independente com React/Vite e API Django REST. Evolução do UPA, apresentada uma única vez.
3. **Biya — Parallel Worlds** — interface React/TypeScript, galeria, mundos visuais e PT/EN. Sem alegar contrato pago.

Bird possui demonstração pública e código privado; a interface sinaliza isso e não oferece um link de código inacessível ao visitante. Outros projetos e estudos ficam no arquivo. Nenhum projeto é apresentado como emprego formal ou resultado comercial comprovado.

## Capturas autênticas

As capas conceituais foram removidas. As três capturas de sites públicos foram feitas diretamente no navegador; a de Chamados API vem do Chrome headless do CI da release `v1.0.0-local.1`. Nenhuma imagem foi gerada, editada, recortada ou reencodificada por IA.

`site/data/image-provenance.json` registra origem, método, dimensões, créditos e SHA-256 dos quatro arquivos. O build valida os hashes e os textos PT/EN. Biya, Bird e demais titulares mantêm os direitos sobre as artes; o retrato da Bird continua creditado a `@Najinajimi`. O retrato original de Zara foi preservado byte a byte.

Projetos de arquivo sem captura validada são apresentados em texto. Não há imagens genéricas usadas para representar produtos.

## Desenvolvimento e verificação

Requer Node.js 22+ e Python 3.

```bash
npm ci
npm run check
node --test tests/*.test.mjs
python -m unittest discover -s tests -p 'test_*.py' -v
```

O comando de produção existente foi preservado:

```bash
python scripts/build_site.py
```

Para os testes completos de interface:

```bash
npx playwright install --only-shell chromium
python -m http.server 4173 --directory dist
# Em outro terminal:
npm run test:ui
```

A bateria cobre 320–3840 px, PT/EN, menu, teclado, explorador, terminal, atalhos, links de download e capturas. Axe verifica violações graves/críticas nas regras WCAG A/AA em mobile e desktop. Isso não é certificação integral de acessibilidade.

A API Flask em `api/` permanece independente. Para seus testes:

```bash
python -m pip install -r api/requirements.txt
python -m unittest discover -s api/tests -v
```

## Currículos

Os PDFs e DOCX PT/EN em `site/downloads/` correspondem aos documentos gerados no repositório Curriculo. Ao atualizá-los, copie os quatro arquivos validados para esta pasta antes do build. Cada PDF tem uma página A4, texto selecionável e links clicáveis.

## Publicação

`dist/` é o artefato Cloudflare. `version.json` identifica a revisão do código. O quality gate executa tipos, testes, build, auditoria das dependências Python, regressões de conteúdo e testes de navegador. Alterações são entregues em PR, sem merge ou deploy automático nesta revisão.

## English

Bilingual portfolio for junior Python back-end opportunities. The Aqua desktop identity is retained, with immediate access to the profile and responsive document navigation on smaller screens. Projects include source/evidence links and explicit operational limits. Screenshots are authentic browser captures; image sources, rights and hashes are recorded in the provenance manifest. No professional experience, paid clients or business metrics are invented.
