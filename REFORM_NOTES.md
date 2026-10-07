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
