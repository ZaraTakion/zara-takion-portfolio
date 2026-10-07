# Reforma técnica — Zara Takion.exe

Esta versão preserva a direção visual de desktop retrô/Aqua e corrige a base técnica para deixá-la mais previsível, responsiva e difícil de quebrar em alterações futuras.

## Correções principais

- Corrigido o `aria-labelledby="contact-title"` da página em inglês, que apontava para um ID inexistente.
- A página principal agora mantém um único `h1`; as telas de abertura e boot usam `h2`, sem competir com o título principal do portfólio.
- O desktop simulado agora trata melhor abertura por hash, botão voltar/avançar, Escape no mobile, troca de breakpoint e restauração de foco.
- Links internos dentro do desktop também abrem a janela correta, em vez de depender apenas dos atalhos com `data-app-open`.
- O explorador de projetos adapta a orientação ARIA e as teclas de seta ao layout: vertical em desktop e horizontal em mobile.
- Regras móveis de janela duplicadas foram removidas.
- Janelas mobile deixaram de depender de `width: 100vw`, reduzindo risco de overflow horizontal causado pela largura da scrollbar.
- Foram adicionadas proteções de `min-width: 0` e quebra de texto para cards, URLs, descrições e painéis.
- O build agora exige todos os módulos JavaScript usados em produção.
- O build agora audita HTML gerado: IDs duplicados, referências ARIA quebradas, imagens sem `alt`, links `_blank` sem `noopener noreferrer`, âncoras internas inválidas e arquivos locais ausentes.
- O CI passou a verificar a sintaxe de todos os arquivos em `site/scripts/` automaticamente.
- Foram adicionados testes de regressão para hierarquia de `h1` e referências ARIA.

## Validação local

```bash
python scripts/build_site.py
python -m unittest discover -s tests -v
for file in site/scripts/*.js; do node --check "$file"; done
node --test tests/*.test.mjs
python -m compileall -q api scripts tests
```

Para a API Flask, instale primeiro as dependências:

```bash
python -m pip install -r api/requirements.txt
python -m unittest discover -s api/tests -v
```

## Responsividade

A composição mantém o modo desktop a partir de 801px e troca para uma experiência de aplicativos em tela cheia abaixo desse limite. O CSS também contém direção específica para telas grandes, incluindo 4K, e regras de reflow para telefones estreitos.

O objetivo não é forçar uma resolução fixa: o layout deve se adaptar ao viewport disponível, inclusive em 320 CSS px de largura, sem exigir rolagem horizontal para o conteúdo principal.


## Contrato responsivo final

- **Desktop web (801 px ou mais):** mantém o desktop simulado com janelas, atalhos e widgets; entre 801 e 1199 px, posições e larguras são compactadas para evitar colisões.
- **Mobile web (800 px ou menos):** o desktop vira uma interface touch-first; aplicativos abrem em tela cheia, respeitam safe areas e não usam `100vw`.
- **Telefones estreitos (560 px ou menos):** hero, widgets, arquivo e perfil refluem para uma coluna quando necessário.
- Alvos interativos principais no mobile têm no mínimo 44 px, e a tipografia dos projetos deixa de usar tamanhos excessivamente pequenos.
- O explorador de projetos usa navegação horizontal no mobile, alinhada à orientação ARIA definida pelo JavaScript.


## V2 estrutural — progressive enhancement

A V2 abandona a ideia de transformar o desktop simulado em uma interface mobile.

- Abaixo de **1200 px**, o portfólio é um documento responsivo normal: Hero, projetos, perfil, formação e contato seguem o fluxo da página.
- A partir de **1200 px**, JavaScript ativa a experiência **Zara Takion.exe** com startup opcional, janelas, widgets e atalhos.
- O explorador de projetos também só é montado no modo desktop e é desmontado quando o viewport volta para tablet/mobile.
- Navegação por âncora e menu continuam funcionando sem depender do desktop simulado.
- O breakpoint pode ser atravessado em tempo real: a página volta ao fluxo normal abaixo de 1200 px e reativa a experiência desktop acima dele.
- Os testes em Chromium cobrem 360×800, 390×844, 768×1024, 1024×768, 1366×768 e 1920×1080.
