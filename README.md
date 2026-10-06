# Zara Takion — Portfólio

Portfólio pessoal de Rodrigo Araújo Maciel Pinheiro (Zara Takion), desenvolvedor web júnior. O projeto combina um site estático em HTML, CSS e JavaScript com uma API de contato em Python/Flask.

## Estrutura

- site/: páginas, estilos, scripts, dados e imagens do portfólio.
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

O formulário tem dois caminhos de produção. Se PORTFOLIO_API_BASE_URL estiver configurada no Netlify, ele envia para a API Flask e esta encaminha por SMTP. Sem essa variável, o formulário usa Netlify Forms. A prévia local, onde nenhum desses serviços está ativo, abre um rascunho de e-mail para revisão.

Para ativar Netlify Forms, habilite a detecção de formulários no painel Netlify antes do deploy. Configure também uma notificação por e-mail em Forms > Submission notifications para receber cada mensagem. As submissões ficam disponíveis no painel Netlify. O site informa esse encaminhamento junto ao formulário.

## Hospedar a API Flask

A API precisa de um serviço Python separado, pois o Netlify Functions não executa Flask. Um exemplo de hospedagem é o Render:

1. Crie um Web Service ligado a este repositório.
2. Use pip install -r api/requirements.txt como comando de build.
3. Use gunicorn --chdir api app:app como comando de inicialização.
4. Configure as variáveis secretas descritas em .env.example no painel do serviço.
5. Defina ALLOWED_ORIGINS com o domínio Netlify real e configure as credenciais SMTP no painel, nunca no Git.

O endpoint GET /api/health permite verificar se a API está respondendo. O formulário usa POST /api/contact, valida os dados, aplica um campo honeypot e encaminha o e-mail sem manter uma cópia no site.

## Projetos apresentados

- Air Quality Analysis — análise estatística, modelagem e dashboard interativo sobre qualidade do ar: https://github.com/ZaraTakion/air-quality-analysis
- Brazil Traffic Insight — análise de acidentes de trânsito no Brasil (2017–2023), modelagem e dashboard: https://github.com/ZaraTakion/brazil-traffic-insight
- NBA Dashboard — dashboard de estatísticas de equipes da NBA (2000–2023): https://github.com/ZaraTakion/nba-dashboard
- UPA — Portal Acadêmico — portal full-stack com React e Django REST Framework: https://github.com/ZaraTakion/upa-portal-academico

As descrições devem acompanhar o estado real dos repositórios; métricas e qualificações não são inferidas.