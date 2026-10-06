# Zara Takion — Portfólio

Portfólio de Rodrigo Araújo Maciel Pinheiro (Zara Takion), desenvolvedor web júnior com foco em back-end Python, Django, APIs REST e aplicações full-stack. A experiência é estática, rápida e disponível em português e inglês; uma API independente em Python/Flask pode processar o formulário de contato.

## Estrutura

- site/: páginas localizadas (`/` em português e `/en/` em inglês), políticas de privacidade nos dois idiomas, estilos, scripts, dados e imagens do portfólio.
- site/styles/: tokens e folhas CSS organizadas por fundação, navegação, seções, movimento e responsividade. O build as reúne em um único arquivo para publicação.
- site/styles/retro-desktop.css: camada visual da interface retrô de janelas, com contornos fortes e paleta vinho, vermelho, carvão e off-white.
- site/scripts/: módulos JavaScript nativos separados para navegação, contato e inicialização.
- site/scripts/project-filters.js: filtros acessíveis para localizar projetos por aplicações web, APIs ou dados; os projetos continuam visíveis sem JavaScript.
- scripts/build_site.py: valida os dados e monta a pasta dist para Netlify.
- api/: API Flask independente para validar e encaminhar mensagens de contato.
- api/tests/: testes da API.

## Gerar e visualizar o site

Requer Python 3.13 para acompanhar a versão configurada no Netlify.

~~~bash
python scripts/build_site.py
python -m http.server 8000 --directory dist
~~~

Abra http://localhost:8000.

Para validar a geração estática e o conteúdo PT/EN:

~~~bash
python -m unittest tests.test_build_site -v
~~~

A suíte também verifica as categorias de projeto, os filtros nas duas línguas e a geração das páginas estáticas.

### Prévia no Windows (PowerShell)

Com Python instalado, abra o PowerShell na pasta do projeto e execute:

~~~powershell
py scripts/build_site.py
py -m http.server 8000 --directory dist
~~~

Depois, acesse http://localhost:8000. Para encerrar o servidor, pressione Ctrl+C no PowerShell. Na prévia local, o formulário abre um rascunho no aplicativo de e-mail; o envio pelo site depende da configuração do provedor de contato em produção.

## Testar a API de contato

Requer Python 3.10+.

~~~bash
python -m venv .venv
~~~

Ative o ambiente virtual, instale as dependências e rode os testes:

~~~bash
python -m pip install -r api/requirements.txt
python -m unittest discover -s api/tests -v
~~~

Para iniciar a API localmente:

~~~bash
python -m api.app
~~~

A API responde em http://127.0.0.1:5000. Sem variáveis SMTP, o endpoint de contato retorna uma mensagem clara e não envia nem armazena dados.

## Publicação do site no Netlify

O netlify.toml configura o comando python3 scripts/build_site.py, publica dist e seleciona Python 3.13. Conecte o repositório ao Netlify usando a branch main.

O formulário tem dois caminhos de produção. Se PORTFOLIO_API_BASE_URL estiver configurada no Netlify, ele envia para a API Flask e esta encaminha por SMTP. Sem essa variável, o formulário usa Netlify Forms. A detecção de formulários e as notificações por e-mail devem ser confirmadas no painel do Netlify e com um envio de teste; a aceitação de uma submissão não comprova a entrega na caixa de entrada. A prévia local, onde nenhum desses serviços está ativo, abre um rascunho de e-mail para revisão.

As submissões do Netlify Forms também ficam disponíveis no painel da hospedagem. Na alternativa SMTP, defina CONTACT_TO=rm20022101@gmail.com junto com as credenciais SMTP no serviço da API; sem elas, a API recusa o envio.

O site inclui políticas de privacidade em `/privacidade.html` e `/en/privacy.html`, que descrevem os campos do formulário e as diferenças entre os fluxos Netlify Forms e SMTP. Revise o texto se mudar os provedores ou o tratamento de dados.

## Hospedar a API Flask

A API precisa de um serviço Python separado, pois o Netlify Functions não executa Flask. Um exemplo de hospedagem é o Render:

1. Crie um Web Service ligado a este repositório.
2. Use pip install -r api/requirements.txt como comando de build.
3. Use gunicorn --chdir api app:app como comando de inicialização.
4. Configure as variáveis secretas descritas em .env.example no painel do serviço.
5. Defina ALLOWED_ORIGINS com o domínio Netlify real e configure as credenciais SMTP no painel, nunca no Git.
6. Defina CONTACT_API_ENV=production e RATELIMIT_STORAGE_URI com a URL privada `rediss://` de um Redis gerenciado. A API aplica até cinco envios por endereço IP por hora e não inicia em produção sem armazenamento compartilhado protegido por TLS para esse limite.

O endpoint GET /api/health permite verificar se a API está respondendo. O formulário usa POST /api/contact, valida os dados, aplica um campo honeypot e limita tentativas antes de encaminhar o e-mail sem manter uma cópia própria na API. Defina TRUSTED_PROXY_HOPS apenas com a quantidade de proxies confiáveis documentada pelo host; não confie em cabeçalhos de proxy enviados diretamente pelo visitante.

## Projetos apresentados

O portfólio destaca três trabalhos alinhados ao foco em back-end Python, APIs REST e aplicações full-stack. Os demais ficam organizados em um arquivo complementar; os sete continuam acessíveis no site.

### Em destaque

- [UPA — Portal Acadêmico](https://github.com/ZaraTakion/upa-portal-academico) — aplicação full-stack com React/Vite, Django REST, JWT e PostgreSQL.
- [Task Manager API](https://github.com/ZaraTakion/task-manager-backend) — API FastAPI com persistência SQLite e teste de continuidade após reinício.
- [Chamados API](https://github.com/ZaraTakion/chamados-api) — API Django REST com JWT, permissões de solicitante/equipe, filtros e comentários.

### Arquivo

- [Brazil Traffic Insight](https://github.com/ZaraTakion/brazil-traffic-insight) — análise de acidentes de trânsito no Brasil (2017–2023), classificação e dashboard.
- [NBA Dashboard](https://github.com/ZaraTakion/nba-dashboard) — dashboard de estatísticas de equipes da NBA no período coberto pelo projeto.
- [Steam Price Predictor](https://github.com/ZaraTakion/steam-price-predictor) — demonstração de estimativa de preços históricos de jogos.
- [Air Quality Analysis](https://github.com/ZaraTakion/air-quality-analysis) — dashboard e análise explicativa de um recorte estático; os resultados não demonstram desempenho preditivo acima do baseline da média.

As imagens de Air Quality, Brazil Traffic Insight e NBA são gráficos próprios feitos a partir dos dados dos projetos. A capa do UPA é uma ilustração vetorial conceitual, não uma captura de tela. As descrições acompanham a documentação dos repositórios; métricas e qualificações não são inferidas.
