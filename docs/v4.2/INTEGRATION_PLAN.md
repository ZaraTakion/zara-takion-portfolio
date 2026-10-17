# V4.2 Ateliê Obsidiana — roteiro de integração React (pré-PR)
**Decisão:** direção visual aceita para a etapa de integração; **nenhum merge/deploy autorizado**.
**Base da branch:** main `c9d6036e934234e6679a9b645f0acfdfe50011cb`.
**Material de origem:** `Zara_Takion_V4.2_Proposta_React.zip`, `Zara_Takion_V4.1_Fonte_Completo.zip` e dossiê V4.2, fornecidos pelo proprietário na conversa. **Os ZIPs ainda não estão incorporados nesta branch.**

## P0 — preservar produção e integrar corretamente
- Importar **seletivamente** os componentes React/TS/Vite da V4.2. Não sobrepor às cegas a `main`, `site/`, `api/`, `.github/workflows/`, `wrangler.jsonc` ou scripts de publicação.
- Manter o Cloudflare Worker existente `portfolio`, assets em `./dist`, PT `/`, EN `/en/`, 404, cabeçalhos, sitemap, robots e páginas de privacidade.
- Corrigir a saída V4.2 de **`/version.json`**, atualmente limitada a `version/stage`: adicionar identificador do commit real (SHA completo e shortRevision), preservando rastreabilidade e verificação de deploy. Preview sem Git deve indicar claramente revisão indisponível, nunca fingir SHA de produção.
- **Mesclar os quality gates**, preservando auditoria e testes Python (`pip-audit`, `unittest`), testes TypeScript/Node, validações de conteúdo, imagens e downloads. Substituir apenas testes legados incompatíveis com UX V4, com cobertura equivalente documentada.
- Não acionar deploy, merge, atualização de Worker ou alteração de credenciais. Cloudflare Builds publica automaticamente a partir de `main`.

## P1 — polimento e conteúdo
- Aumentar identificações móveis e legendas muito pequenas (ex.: `0.49rem` no cabeçalho V4.2); confirmar layout em 320px e zoom.
- Testar `Header`, `Signature`, `RequestJourney` e `TransactionDiagram`: PT/EN, modo simples/técnico, seleção das etapas, ARIA, teclado, Escape e foco, tema e movimento reduzido.
- Expandir os cadernos técnicos dos demais projetos conforme evidências reais, sem replicar desenhos genéricos. Não inventar métricas, serviços funcionando ou experiência comercial.
- Preservar quatro currículos PDF/DOCX, certificado original Udemy classificado como conclusão de curso, capturas **reais** e seus créditos/hashes (a main tem quatro capturas; a prévia React embala apenas duas diretamente em `public/assets/img`).
- Não gerar, modificar ou publicar imagens por IA. Não adicionar fotografia pessoal ou ilustração da personagem sem autorização de uso separada.

## Critérios de aceite
- PR mantida em **draft**; mudanças aplicadas à branch com comparação V3→V4.2 e histórico de decisões.
- CI com Node/TypeScript, build React, Python, dependências, testes unitários e navegador; evidências sobre PT/EN, 320–3840px, acessibilidade automatizada e limitações manuais.
- `/version.json` rastreável; metadados corretos para preview versus produção; PDFs e certificado íntegros; imagens autênticas e créditos preservados.
- Revisão manual e autorização expressa **antes de merge/deploy**.

## Status deste documento
Este commit cria **apenas o roteiro de integração** para o Codex. Não contém ainda a implementação React da V4.2 e seu CI não pode ser tomado como homologação dela. É necessário anexar os ZIPs na tarefa do Codex e transferir os componentes reais para esta branch antes de solicitar revisão final.
