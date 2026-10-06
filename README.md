# Zara Takion — Portfólio

Portfólio de Rodrigo Araújo Maciel Pinheiro (Zara Takion), desenvolvedor web júnior com foco em back-end Python, Django, APIs REST e aplicações full-stack. A experiência é estática, bilíngue e apresenta os projetos em um desktop retrô Aqua, com inicialização opcional, janelas organizadas, explorador de projetos, status do sistema e links diretos.

## Estrutura

- site/: páginas localizadas (`/` em português e `/en/` em inglês), políticas de privacidade nos dois idiomas, estilos, scripts, dados e imagens do portfólio.
- site/styles/: tokens e folhas CSS organizadas por fundação, navegação, seções, movimento e responsividade. O build as reúne em um único arquivo para publicação.
- site/styles/retro-desktop.css: interface de desktop retrô em Aqua e creme, com detalhes vinho.
- site/scripts/: módulos JavaScript nativos separados para navegação, filtros, desktop e explorador de projetos.
- site/scripts/project-filters.js: filtros acessíveis para localizar projetos por aplicações web, APIs ou dados; os projetos continuam visíveis sem JavaScript.
- scripts/build_site.py: valida os dados e monta a pasta dist para publicação estática.
- wrangler.jsonc: configuração do Cloudflare Workers Static Assets para publicar os arquivos de dist.
- site/_headers: cabeçalhos de segurança aplicados pelo Cloudflare Workers.
- api/: API Flask independente mantida no repositório, mas não conectada aos links de contato do site.
- api/tests/: testes da API.

## Gerar e visualizar o site

Requer Python 3.10 ou superior.

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

Depois, acesse http://localhost:8000. Para encerrar o servidor, pressione Ctrl+C no PowerShell. O contato abre o aplicativo de e-mail escolhido pela pessoa visitante; GitHub e LinkedIn abrem seus respectivos perfis.

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

## Publicação automática no Cloudflare Workers

O site está preparado para o endereço `https://zara-takion-portfolio.rodzmaciel21.workers.dev/`. O `wrangler.jsonc` aponta os arquivos estáticos para `dist`; o build é `python scripts/build_site.py` e o comando de deploy é `npx wrangler deploy`.

Para ativar publicação automática a cada atualização da branch `main`:

1. No painel Cloudflare, abra **Workers & Pages** e conecte o repositório `ZaraTakion/zara-takion-portfolio` em **Builds**.
2. Escolha a branch `main`.
3. Configure o comando de build como `python scripts/build_site.py` e o comando de deploy como `npx wrangler deploy`.
4. Salve e acompanhe o primeiro build. Depois, cada push para `main` inicia uma nova publicação.

Também é possível publicar pela CLI com `npx wrangler deploy`, depois de autenticar o Wrangler na conta Cloudflare. O build produz `dist/404.html`, mantém páginas em português e inglês e aplica `site/_headers` à saída estática.

As páginas em `/privacidade.html` e `/en/privacy.html` explicam que o portfólio não coleta mensagens por formulário e que os links externos seguem as políticas dos respectivos serviços.

## Hospedar a API Flask

A API Flask permanece independente e precisa de um serviço Python separado. Ela não faz parte do Worker estático nem está ligada ao contato do portfólio. Se for usada separadamente, um exemplo de hospedagem é o Render:

1. Crie um Web Service ligado a este repositório.
2. Use pip install -r api/requirements.txt como comando de build.
3. Use gunicorn --chdir api app:app como comando de inicialização.
4. Configure as variáveis secretas descritas em .env.example no painel do serviço.
5. Defina ALLOWED_ORIGINS com o domínio autorizado e configure as credenciais SMTP no painel, nunca no Git.
6. Defina CONTACT_API_ENV=production e RATELIMIT_STORAGE_URI com a URL privada `rediss://` de um Redis gerenciado. A API aplica até cinco envios por endereço IP por hora e não inicia em produção sem armazenamento compartilhado protegido por TLS para esse limite.

O endpoint GET /api/health permite verificar se a API está respondendo. Seu endpoint POST /api/contact valida os dados, aplica um campo honeypot e limita tentativas antes de encaminhar o e-mail sem manter uma cópia própria na API. Defina TRUSTED_PROXY_HOPS apenas com a quantidade de proxies confiáveis documentada pelo host; não confie em cabeçalhos de proxy enviados diretamente pelo visitante.

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
