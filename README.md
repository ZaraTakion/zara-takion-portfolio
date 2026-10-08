# ZARA // AQUA WORKSTATION V3

Portfólio profissional bilíngue de **Zara Takion**, desenvolvido com **React, TypeScript e Vite**. O produto apresenta estudos de caso reais de web development e back-end Python por meio de um pequeno ambiente desktop interativo, com estética Aqua, céu pixelado e detalhes em vinho.

**Site:** https://portfolio.zaratakion.workers.dev/  
**Código:** https://github.com/ZaraTakion/zara-takion-portfolio

## Arquitetura

- **`src/`**: aplicação React em TypeScript; componentes de home, estudos de caso, explorador, perfil, arquivo, educação, contato, terminal e paleta rápida, estado e internacionalização.
- **`src/copy.ts`**: textos independentes em português e inglês.
- **`src/model.ts`**: definição dos nomes de rotas, aliases e seleção dos projetos.
- **`src/styles/upgrade.css`**: identidade visual V3, animações, layouts e estados acessíveis.
- **`site/styles/aqua-workstation.css`**: direção de arte Aqua anterior preservada e importada como base pela aplicação React.
- **`site/assets/img/`**: retrato original da Zara, capas e gráficos já existentes, **sem geração ou alteração por IA**.
- **`site/data/projects.json`**: única fonte do acervo de sete projetos. Descrições em PT/EN e estudos de caso preservados. Não fabricamos métricas.
- **`site/_headers`**: política CSP e cabeçalhos de segurança aplicáveis ao site publicado.
- **`api/`**: API Flask independente. O contato na interface continua usando links diretos, sem fingir que há um serviço de e-mail conectado.
- **`scripts/copy-public.mjs`**: copia apenas os assets, dados, páginas legais, sitemap, robots e 404 para `dist/` após o build.
- **`scripts/build_site.py`**: comando de build histórico mantido para compatibilidade com o Cloudflare. Valida dados e executa o build Vite.
- **`scripts/ui-smoke.mjs`**: testes Chromium reais em 320, 360, 390, 768, 1024, 1200, 1366, 1920 e 3840px, com navegação e ações.

## Execução local

Requisitos: Node.js 22+ e npm. Python 3.13+ é necessário para as validações/rotina histórica de build e para a API.

```bash
npm install
npm run dev
```

Para preparar produção:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run preview
```

O comando Cloudflare legado segue funcionando:

```bash
python scripts/build_site.py
```

Ele faz a verificação do JSON e, se faltar `node_modules/vite`, instala as dependências JavaScript antes de executar o build Vite. A saída continua sendo `dist/`, usada por `wrangler.jsonc`.

Para testes completos de interface em navegador, rode o build, inicie o servidor local na porta 4173 e execute `npm run test:ui`. A GitHub Actions automatiza o fluxo.

## Como usar

**Desktop ≥1200px:** após carregar a página, escolha entrar direto ou observar a inicialização curta opcional. Os aplicativos incluem Home, Projetos, Sobre, Arquivo, Formação, Contato e Terminal. Só um aplicativo fica ativo de cada vez; janelas têm controles de minimizar, expandir/restaurar e fechar. Use a barra lateral para trocar de aplicativo. A paleta **Ctrl+K** fornece acesso rápido; **Alt+1–7** abre aplicativos, e **Esc** volta para Home.

**Celular e tablet:** as mesmas seções são apresentadas como documento navegável e responsivo, sem obrigar a usar a metáfora de janelas. Botão de menu, âncoras e links funcionam com toque e teclado.

**Explorador:** no desktop, os projetos são apresentados como pastas com abas de teclado (setas, Home e End). Em telas pequenas, voltam à grade de cards, preservando as informações. Filtros Web, APIs e Dados usam os projetos reais do JSON. A opção Todos mostra os três estudos de caso principais; filtros específicos procuram em todo o acervo.

**Terminal:** interpreta exclusivamente comandos conhecidos de **navegação**, como `help`, `projects`, `about`, `archive`, `skills`, `education`, `contact`, `home`, `clear`. Não executa código arbitrário nem comandos de sistema.

## Acessibilidade e desempenho

- Contraste, estados `:focus-visible`, labels, feedback `aria-live`, imagens com alt significativo, projeto com `details/summary` e navegação PT/EN.
- A paleta de comandos gerencia foco e fecha com Esc; o menu mobile oferece estados acessíveis.
- Animações de janelas, céu e microinterações são leves, sem vídeo em autoplay, bibliotecas de partículas, rastreamento ou dependências externas de fontes.
- `prefers-reduced-motion: reduce` desativa as animações não essenciais; o conteúdo permanece visível. `forced-colors` também tem fallback.
- O build carrega React/CSS empacotados localmente e mantém CSP `script-src 'self'`.
- Os arquivos de arte originais são copiados sem alteração. A integridade do retrato é verificada por testes.

## Testes e publicação

O workflow [React Aqua Workstation quality gate](.github/workflows/ci.yml) valida:

1. TypeScript e testes de unidade React.
2. Testes legados Node e suíte Python Flask.
3. Auditoria de dependências Python.
4. Build de produção Vite, conteúdo PT/EN, integridade de assets, páginas legais e cabeçalhos.
5. Navegação Playwright Chromium real de 320 a 3840px, incluindo mobile, terminal, paleta, alternância de páginas e viewport desktop/tablet.

O arquivo `/version.json` contém a revisão completa do Git associada ao build e recebe `Cache-Control: no-store`. Após a publicação, compare sua propriedade `revision` com o SHA de `main` para evitar confundir a versão anterior com a recém-publicada.

**Publicação:** a branch `main` mantém a produção. Mudanças grandes passam por PR e CI primeiro. Cloudflare Workers publica a partir da branch configurada com `python scripts/build_site.py` e `npx wrangler deploy`; o Worker usa `./dist`.

## Ética do portfólio

Os projetos expõem o que suas documentações efetivamente comprovam, inclusive limites e condições de produção. Ilustrações conceituais são identificadas como tais e gráficos derivados de dados próprios permanecem intactos. Não acrescentamos imagens fabricadas, métricas fictícias ou testemunhos inexistentes.

A identidade Aqua é o enquadramento. O conteúdo e a experiência de navegação são o produto.
