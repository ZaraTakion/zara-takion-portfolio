# Auditoria profissional inicial

Data da inspeção: 15/10/2026 UTC (14/10 à noite em Fortaleza).

## Portfólio
- HEAD main cc7b6dda4280e1ffb583ec4fce6243d03dfb1a71, PR #12 já integrado.
- Identidade Aqua Workstation distinta e preservável; desktop exige entrada antes de exibir perfil.
- Posicionamento como desenvolvedor web contrasta com foco desejado em Back-End Python.
- Três capas conceituais do PR #12 e outras capas SVG não demonstram o produto real.
- Takion Campus e UPA duplicam o mesmo projeto; URL UPA antiga.
- Ausência de downloads diretos do currículo e identificação de projeto pessoal/acadêmico.
- Bird possui repositório privado: link público para o código falha para recrutadores.
- CI main 38499416611 falhou no teste `React locale content mismatch`: teste espera Construo e conteúdo foi trocado para Desenvolvo no PR #12.
- Baseline local: typecheck, build, 2 Vitest, 1 Node e 12 Python passaram.
- Fontes locais, CSP sem unsafe-inline/eval, reduced-motion e adaptação mobile já presentes.

## Currículo
- HEAD main a60b57a8720430bad794cad66975efb7dc82b897, CI 37994832956 aprovado.
- PDF e DOCX PT/EN existentes, uma página segundo validador do projeto.
- Usa UPA e URL anterior; não referencia portfólio nem LinkedIn.
- Marcadores 'conclusão informada' e referências a número de PR ocupam espaço de recrutamento.
- Nível de inglês detalhado conflita com preferência mais conservadora do usuário (inglês básico).
- Gerador não fixa A4 e depende exclusivamente do nome executável libreoffice.

## Projetos obrigatórios
- Chamados API: main e6ea48d, CI 37995773863 aprovado; DRF/JWT, papéis, outbox, testes SQLite/PostgreSQL. Sem API hospedada publicamente. Release contém screenshot Swagger real do Chrome CI, sem dados pessoais.
- Takion Campus: main 777884a, CI 38023189124 aprovado; React/Vite e Django REST, perfis, uploads autorizados, domínio público abre tela de acesso. Não valida login sem credenciais nem cobrança real.
- Biya: main 6ed584e, quality gate e verificação de produção aprovados. Site público observado e screenshot original realizado no navegador. Galeria, Crystal/Ghost, PT/EN; artes mantêm direitos de Biya e titulares. Não alegar contrato pago.
- Bird: main ae4a23c, quality gate 37798963218 aprovado; publicação 37799109418 skipped. Código privado lido pela conexão autenticada; README, dados e lightbox conferidos. Site público observado com PT/EN/JA e créditos @Najinajimi no retrato. Não converter repositório em público.

## Prioridades
P0: remover capas conceituais, corrigir CI e links inválidos; manter nenhuma publicação com falhas.
P1: entrada imediata, foco Back-End, CV PT/EN, estudos de caso e capturas com origem/crédito.
P2: evidência acessível, imagens sem recorte, mobile/desktop/4K, downloads e SEO coerentes.

## Limites
Auditoria de produto/recrutamento e revisão técnica direcionada. Não equivale a pentest nem certificação WCAG. Não se alegam clientes, experiência profissional, ganhos ou métricas de usuários.
