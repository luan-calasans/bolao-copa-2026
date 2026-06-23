# Bolão Copa do Mundo FIFA 2026

SPA para palpites da Copa do Mundo 2026. Os jogos vêm da [football-data.org](https://www.football-data.org/); os palpites são persistidos em **Neon Postgres** via API serverless na **Vercel**.

## Funcionalidades

- Listagem de jogos da Copa 2026 (ao vivo, próximos e encerrados)
- Filtros por data, país, grupo e status
- Classificação por grupos e páginas de seleções
- Ranking de pontuação dos participantes em `/pontuacao` (pontos, exatos, parciais, palpites e aguardando)
- Clique no nome do participante no ranking para ver todos os palpites dele
- Palpite flexível: informe **quem vence** (mandante, empate ou visitante), **placar previsto**, ou **ambos** — cada opção é opcional, exceto que ao menos uma delas é obrigatória (além do nome)
- Sem cruzamento entre opções: vitória de um time no seletor e placar favorável ao adversário são permitidos; cada parte pontua de forma independente
- Complemento de palpite: quem já registrou só o placar pode voltar e informar quem vence (ou empate); o placar registrado não pode ser alterado
- Comprovante visual estilo ticket esportivo com exportação PNG
- Listagem de palpites por jogo e visão geral de todos os palpites
- Filtros pré-prontos em `/palpites`: resultado (exato, parcial, errou), status do jogo (encerrado, ao vivo, agendado), seleção, **participante** e ordem (mais recente / mais antigo por **data do jogo**)
- Cards de resumo em `/palpites` (**Palpites**, **Exatos**, **Parciais**, **Erros**) clicáveis para filtrar por resultado
- Ordenação por coluna em `/palpites` (jogo/data, partida, participante, resultado); a ordem inicial vem do filtro **Ordem** (data do jogo)
- Tema **claro/escuro** no cabeçalho
- Botão flutuante **voltar ao topo** ao rolar a página
- Atalho flutuante para **Palpitar** em `/jogo/:matchId/palpites` (jogos agendados ou ao vivo)
- Cache de requisições no browser (TTL 20s, deduplicação em voo) para jogos, palpites, ranking, classificação e seleções
- Resultado do palpite (exato / parcial / errou / aguardando) com regras visíveis em `/pontuacao`
- Detalhes da partida em `/jogo/:matchId/palpites` e `/palpite/:matchId` (jogos ao vivo ou encerrados):
  - Painéis recolhíveis: **Informações**, **Estatísticas**, **Gols** e **Escalações** (expandidos por padrão); **Histórico** (recolhido por padrão)
  - Gols com minuto, jogador e escudo do time
  - Placar do intervalo
  - Informações do jogo (estádio, cidade, público, árbitro, competição)
  - Estatísticas traduzidas (posse de bola, chutes, escanteios, faltas, etc.)
  - Histórico da partida com eventos em português (gols, cartões, substituições, VAR); substituições no formato **Entra: … · Sai: …**
  - Escalações (titulares e reservas)
  - Atualização automática a cada 60s em `/jogo/:matchId/palpites` e `/palpite/:matchId` (dados do jogo e palpites); detalhes TheSportsDB seguem a mesma cadência em jogos ao vivo ou encerrados
  - Botão **Atualizar dados** só enquanto o jogo não encerrou; botão **Palpitar** no cabeçalho e atalho flutuante (bola) quando o jogo aceita palpites
- Área administrativa com login por senha para visualizar e excluir palpites
- Exclusão de palpites com modal de confirmação (soft delete no banco)
- Layout responsivo (mobile, tablet, desktop)

## Stack

| Camada         | Tecnologia                                                   |
| -------------- | ------------------------------------------------------------ |
| Frontend       | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend        | Vercel Serverless Functions (`api/`)                         |
| Banco          | Neon Postgres (`@neondatabase/serverless`)                   |
| Dados de jogos | [football-data.org](https://www.football-data.org/) v4       |
| Detalhes ao vivo / pós-jogo | [TheSportsDB](https://www.thesportsdb.com/documentation) v1 |
| Fallback opcional de gols | [API-Football](https://www.api-football.com/) (`API_FOOTBALL_KEY`) |
| Exportação     | html-to-image                                                |
| Deploy         | Vercel                                                       |

## Arquitetura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   React     │────▶│  /api/bets       │────▶│  Neon Postgres      │
│   (browser) │     │  /api/ranking    │     │  receipts + bets    │
└─────────────┘     │  /api/admin/*    │     └─────────────────────┘
       │            └──────────────────┘
       ▼
┌──────────────────┐     ┌─────────────────────┐
│ /api/football/*  │────▶│  football-data.org  │
│ /api/crests/*    │     │  (token no servidor)│
└──────────────────┘     └─────────────────────┘
       │
       ▼
┌──────────────────┐     ┌─────────────────────┐
│ /api/sportsdb/*  │────▶│  TheSportsDB v1     │
│                  │     │  (chave no servidor)│
└──────────────────┘     └─────────────────────┘
       │
       ▼
┌──────────────────┐     ┌─────────────────────┐
│ /api/apifootball/*│───▶│  API-Football v3    │
│ (opcional)       │     │  (fallback de gols) │
└──────────────────┘     └─────────────────────┘
```

### MVVM (frontend)

| Camada         | Responsabilidade                                                               |
| -------------- | ------------------------------------------------------------------------------ |
| **Models**     | Tipos de domínio (`Match`, `Team`, `Bet`, `Receipt`, `MatchBetEntry`)          |
| **Services**   | HTTP para APIs (`matchService`, `betStorageService`, `rankingService`, `requestCache`, etc.) |
| **ViewModels** | Estado, regras de apresentação e ações das telas                               |
| **Views**      | Composição das telas                                                           |
| **Components** | UI reutilizável                                                                |
| **Hooks**      | Lógica compartilhada (exportação, confirmação de exclusão)                     |
| **Utils**      | Mapeamento, formatação, validação, ordenação e mensagens de erro               |

Fluxo: **View → ViewModel → Service → API**

### Cache no frontend

O módulo `requestCache.ts` evita chamadas duplicadas à API enquanto o usuário navega ou o React remonta componentes (ex.: Strict Mode em dev):

| Recurso              | Chave / escopo                          | TTL   |
| -------------------- | --------------------------------------- | ----- |
| Jogos da Copa        | bundle `football:wc-matches-bundle`     | 20s   |
| Palpites por jogo    | `bets:match:{id}`                       | 20s   |
| Todos os palpites    | `bets:all`                              | 20s   |
| Ranking              | `ranking:all`                           | 20s   |
| Classificação / times| `football:competition:WC:…`             | 20s   |

Requisições em andamento são compartilhadas (in-flight dedupe). Botões **Tentar novamente**, **Atualizar dados** e polling passam `{ force: true }` para ignorar o cache. Novo palpite invalida cache de palpites e ranking.

A home reconcilia status de jogos ao vivo e kickoff já passado ao recarregar ou voltar à aba.

## Estrutura do projeto

```
bolao/
├── api/                    # Entradas das Serverless Functions (Vercel)
│   ├── bets.js
│   ├── ranking.js
│   ├── football-proxy.js
│   ├── sportsdb-proxy.js
│   ├── apifootball-proxy.js
│   ├── crests-proxy.js
│   └── admin/
│       ├── login.js
│       ├── logout.js
│       ├── session.js
│       └── bets.js
├── server/lib/             # Handlers e lógica compartilhada das APIs
│   ├── betDb.js
│   ├── betsHttp.js
│   ├── rankingDb.js
│   ├── rankingHttp.js
│   ├── adminHttp.js
│   ├── adminAuth.js
│   ├── adminLoginRateLimit.js
│   ├── validateInput.js
│   ├── ensureSchema.js
│   ├── schemaBootstrap.js
│   └── loadLocalEnv.js
├── db/
│   └── schema.sql          # Schema de referência
├── scripts/
│   ├── init-db.mjs         # Aplica schema no Neon
│   └── sync-bet-scores.mjs # Recalcula pontuação dos palpites no banco
├── public/
│   └── ball-button.png     # Ícone do atalho flutuante Palpitar
├── src/
│   ├── components/
│   ├── hooks/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── viewmodels/
│   └── views/
├── dist/                   # Build estático (output do Vite)
└── vercel.json
```

## Rotas da aplicação

| Rota                      | Descrição                                                                |
| ------------------------- | ------------------------------------------------------------------------ |
| `/`                       | Jogos ao vivo, próximos e encerrados                                     |
| `/classificacao`          | Tabelas de classificação por grupo                                       |
| `/pontuacao`              | Ranking de pontuação: tabela ordenada por pontos, regras no botão **i** |
| `/participante/:personNameKey` | Palpites de um participante (acesso pelo ranking)                  |
| `/times`                  | Lista de seleções                                                        |
| `/times/:teamId`          | Detalhes da seleção e jogos                                              |
| `/palpites`               | Todos os palpites registrados em tabela única (filtros + ordenação) |
| `/jogo/:matchId/palpites` | Palpites de um jogo + detalhes da partida (gols, stats, escalações); atalho flutuante para palpitar |
| `/palpite/:matchId`       | Formulário para registrar palpite (vencedor e/ou placar) + detalhes da partida |
| `/comprovante/:receiptId` | Comprovante do palpite (UUID)                                            |
| `/admin/login`            | Login da área administrativa                                             |
| `/admin/palpites`         | Gestão de palpites (visualizar e excluir)                                |
| `/404`                    | Página não encontrada                                                    |

### Filtros em `/palpites`

Acima da busca por texto, a tela oferece filtros pré-prontos:

| Filtro        | Opções                                                         |
| ------------- | -------------------------------------------------------------- |
| **Resultado** | Placar exato, Parcial, Errou (com contagem); cards no topo também filtram por resultado |
| **Status**    | Encerrado, Ao vivo, Agendado (com contagem)                    |
| **Seleção**   | Dropdown com todas as seleções presentes nos jogos palpitados   |
| **Participantes** | Dropdown com todos os participantes que palpitaram (padrão: **Todos**) |
| **Ordem**     | Mais recente ou Mais antigo (por **data do jogo**; empate: ao vivo → agendado → encerrado) |

No mobile, os filtros ficam em um painel recolhível (**Filtrar palpites**). Quando algum filtro está ativo, aparece o botão **Limpar filtros**.

A busca por nome, time ou confronto combina com os filtros acima. Se nada corresponder, a tela mostra uma mensagem específica para busca ou para filtros.

### Ordenação por coluna em `/palpites`

A tabela inicia ordenada pelo filtro **Ordem** (data do jogo), sem seta ativa no cabeçalho. Clique no cabeçalho da coluna para alternar a ordem. O ciclo é:

1. **1º clique** — ordenação padrão (data: mais recente; demais colunas: A–Z)
2. **2º clique** — ordem invertida
3. **3º clique** — remove a ordenação por coluna e volta à ordem do filtro **Ordem**

Colunas ordenáveis: **Jogo / Data**, **Partida**, **Participante** e **Resultado**. Rótulos longos na coluna **Palpite** são truncados com reticências (texto completo no tooltip).

### Tela `/pontuacao`

Exibe o ranking geral do bolão, ordenado por **Pontos** (maior para menor). Quando há palpites registrados, a tabela mostra:

| Coluna         | Descrição                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| **#**          | Posição no ranking                                                        |
| **Participante** | Nome no bolão (link para `/participante/:personNameKey`)                |
| **Pontos**     | Soma total de pontos                                                      |
| **Exatos**     | Quantidade de palpites com placar exato                                   |
| **Parciais**   | Quantidade de acertos parciais (placar previsto, diferença de até 3 gols) |
| **Palpites**   | Total de palpites registrados                                             |
| **Aguardando** | Palpites em jogos ainda não encerrados                                    |

Os três primeiros colocados recebem destaque visual na tabela. No cabeçalho da página, o botão **i** abre um modal com as **regras de pontuação** (Placar exato, Acerto parcial, Quem vence?, Errou). Quando disponível, aparece também a data **Atualizado em** com a última sincronização do ranking.

Se ainda não houver palpites, a tela mostra o estado vazio. Em falha de rede ou limite da API, é possível **Tentar novamente**.

### Detalhes da partida

Nas telas `/jogo/:matchId/palpites` e `/palpite/:matchId`, quando o jogo está **ao vivo** ou **encerrado**, o app busca dados complementares na [TheSportsDB](https://www.thesportsdb.com/documentation) (via proxy `/api/sportsdb/*`), cruzando times + data do jogo com o evento correspondente.

Cada bloco abaixo é um painel com cabeçalho clicável e seta para expandir/recolher:

| Seção          | Padrão    | Fonte                         | Conteúdo                                              |
| -------------- | --------- | ----------------------------- | ----------------------------------------------------- |
| Informações    | Expandido | TheSportsDB `lookupevent`     | Estádio, cidade, público, árbitro, competição         |
| Estatísticas   | Expandido | TheSportsDB `lookupeventstats`| Posse, chutes, escanteios, faltas (rótulos em PT-BR)  |
| Gols           | Expandido | TheSportsDB `lookuptimeline`  | Autor, minuto, time (com escudo)                      |
| Histórico      | Recolhido | TheSportsDB `lookuptimeline`  | Cronologia em PT-BR (gols, cartões, substituições, VAR) |
| Escalações     | Expandido | TheSportsDB `lookuplineup`    | Titulares e reservas                                  |
| Placar / intervalo | —     | football-data.org             | Placar final e placar do 1º tempo (hero do jogo)      |

Eventos do histórico são traduzidos automaticamente (ex.: *Goal Disallowed* → *Gol anulado*). Substituições exibem setas ↑/↓, o jogador que entra em destaque e **Sai: jogador** na linha abaixo.

> A chave **gratuita** (`123`) limita a timeline a 5 eventos por partida. Com chave **premium** (`THESPORTSDB_API_KEY`), a timeline completa fica disponível (até 100 eventos). Se a timeline ainda estiver incompleta, o app tenta fallback via `API_FOOTBALL_KEY` (opcional).

Em jogos ao vivo, os detalhes são atualizados automaticamente a cada **60 segundos**. O botão **Atualizar dados** aparece apenas em jogos que ainda não encerraram.

### Atalhos flutuantes (`/jogo/:matchId/palpites`)

| Elemento            | Quando aparece                          | Ação                               |
| ------------------- | --------------------------------------- | ---------------------------------- |
| **Voltar ao topo**  | Após rolar ~300px (todas as telas)      | Rola suavemente ao topo da página   |
| **Bola (Palpitar)** | Só nesta rota, se o jogo aceita palpite | Abre `/palpite/:matchId`           |

O atalho da bola **não** aparece na home nem nas demais rotas.

### Formulário de palpite (`/palpite/:matchId`)

| Campo              | Obrigatório | Descrição                                                                 |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| Nome no bolão      | Sim         | Identifica o participante (2–80 caracteres)                               |
| Quem vence?        | Não*        | Mandante, empate ou visitante; clique de novo para desmarcar              |
| Placar previsto    | Não*        | Informe com **+** em qualquer time; use **Limpar placar** para remover    |

\* É obrigatório preencher **pelo menos um** entre “Quem vence?” e placar (ou os dois).

Regras adicionais:

- **Não há validação cruzada** entre vencedor e placar — você pode palpitar vitória do Brasil e placar 0×2, por exemplo.
- Em jogos **ao vivo**, o placar informado não pode ser menor que o placar atual da partida (mínimo por time). Um aviso informa que o placar pode mudar durante o registro (legível no tema claro e escuro).
- A sugestão por IA preenche apenas o placar; o vencedor continua opcional e independente.
- Se você já palpitou neste jogo com o mesmo nome, o formulário carrega o palpite anterior: placar já registrado fica bloqueado; dá para complementar só o que faltava.

### Regras de pontuação

Regras aplicadas em `/pontuacao`, nas telas de palpites e no ranking (`bet_scores`). Os pontos **somam** quando o palpite inclui placar e vencedor:

| Resultado       | Pontos | Critério                                                                 |
| --------------- | ------ | ------------------------------------------------------------------------ |
| Placar exato    | 10     | Acertou o placar completo (quando informado)                             |
| Acerto parcial  | 3      | Acertou quem venceu ou o empate pelo placar previsto, com diferença de no máximo 3 gols no total |
| Quem vence?     | 2      | Acertou mandante, visitante ou empate na opção escolhida no palpite      |
| Errou           | 0      | Errou o resultado correspondente à opção informada                       |
| Aguardando      | 0      | Jogo ainda não encerrado                                                 |

Exemplos:

- Final **3×1**, palpite **3×0** → **parcial** (3 pts) — mandante venceu nos dois casos e a diferença total é de 1 gol.
- Final **6×0**, palpite **1×0** → **errou** (0 pts) — mandante venceu, mas a diferença total é de 5 gols (acima do limite de 3).
- Final **2×1**, palpite só **vencedor: mandante** (sem placar) → **2 pts** se acertou quem venceu.
- Final **2×1**, palpite **2×1** + **vencedor: mandante** → **12 pts** (10 + 2).
- Palpite **vencedor: mandante** com placar **0×2** → pontua só pela opção “Quem vence?” (2 pts se acertou); o placar inconsistente não invalida o palpite.

O ranking recalcula palpites ao consultar `/api/ranking`. Para forçar a sincronização manualmente:

```bash
npm run scores:sync
```

## API de palpites (`/api/bets`)

| Método   | Endpoint                     | Descrição                             |
| -------- | ---------------------------- | ------------------------------------- |
| `GET`    | `/api/bets`                  | Lista todos os palpites ativos        |
| `GET`    | `/api/bets?matchId=123`      | Palpites de um jogo                   |
| `GET`    | `/api/bets?receiptId={uuid}` | Busca comprovante                     |
| `POST`   | `/api/bets`                  | Registra palpite + comprovante        |
| `DELETE` | `/api/bets?receiptId={uuid}` | **Bloqueado** (403) — use a API admin |

A exclusão define `deleted_at` em `receipts`; os dados permanecem no banco, mas não aparecem no frontend.

## API de ranking (`/api/ranking`)

| Método | Endpoint       | Descrição                                            |
| ------ | -------------- | ---------------------------------------------------- |
| `GET`  | `/api/ranking` | Ranking de pontuação calculado a partir dos palpites |

## API administrativa (`/api/admin/*`)

| Método   | Endpoint                           | Descrição                                     |
| -------- | ---------------------------------- | --------------------------------------------- |
| `POST`   | `/api/admin/login`                 | Autentica com senha e define cookie de sessão |
| `POST`   | `/api/admin/logout`                | Encerra a sessão                              |
| `GET`    | `/api/admin/session`               | Verifica se a sessão está ativa               |
| `GET`    | `/api/admin/bets`                  | Lista palpites (requer sessão)                |
| `DELETE` | `/api/admin/bets?receiptId={uuid}` | Soft delete do palpite (requer sessão)        |

A sessão usa cookie `HttpOnly` assinado com HMAC. O login tem rate limit por IP (bloqueio temporário após tentativas falhas).

### Banco de dados

```sql
receipts  (id, generated_at, deleted_at)
bets      (receipt_id, match_id, home_score, away_score, winner_pick, person_name, match_snapshot, created_at)
```

`home_score` e `away_score` são opcionais (`NULL` quando o participante palpitou só o vencedor). `winner_pick` é opcional quando o participante palpitou só o placar. `updated_at` registra quando o palpite foi complementado.

O `match_snapshot` (JSONB) guarda o estado do jogo no momento do palpite para o comprovante não depender de nova consulta à API de futebol.

Na primeira conexão SQL da API, `getReadySql()` aplica automaticamente tabelas e índices (`ensureSchemaStructure`), com lock para evitar corrida entre requisições concorrentes. O script `npm run db:init` executa a migração completa, incluindo backfill e deduplicação de palpites legados.

## Pré-requisitos

- Node.js 18+
- Conta na [football-data.org](https://www.football-data.org/client/register) (plano Free inclui `WC`)
- Chave na [TheSportsDB](https://www.thesportsdb.com/pricing) (premium recomendado para detalhes completos da partida)
- Projeto na [Vercel](https://vercel.com/) com **Neon Postgres** conectado (Storage → Marketplace → Neon)

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (não commitar):

```env
# football-data.org — dev local e produção
VITE_FOOTBALL_API_TOKEN=seu_token_aqui
FOOTBALL_API_TOKEN=seu_token_aqui

# Neon Postgres — copie de Vercel → Storage → neon-banco → .env.local
POSTGRES_URL=postgresql://...

# Área administrativa (opcional em dev; obrigatório para /admin)
ADMIN_PASSWORD=sua_senha_forte
ADMIN_SESSION_SECRET=string_aleatoria_longa

# Proteção opcional do bolão (recomendado se a URL for pública)
BOLAO_ACCESS_TOKEN=token_compartilhado_entre_participantes
VITE_BOLAO_ACCESS_TOKEN=token_compartilhado_entre_participantes

# Rate limit distribuído (opcional; recomendado na Vercel)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# TheSportsDB — detalhes da partida (gols, stats, escalações, cronologia)
# Chave gratuita de teste: 123 (timeline limitada a 5 eventos)
THESPORTSDB_API_KEY=sua_chave_premium_aqui

# API-Football — fallback opcional quando a timeline da TheSportsDB estiver incompleta
API_FOOTBALL_KEY=
```

| Variável                   | Onde usar                                                  |
| -------------------------- | ---------------------------------------------------------- |
| `VITE_FOOTBALL_API_TOKEN`  | Proxy do Vite em `npm run dev`                             |
| `FOOTBALL_API_TOKEN`       | Serverless Functions na Vercel                             |
| `POSTGRES_URL`             | API de palpites e ranking (local e Vercel)                 |
| `ADMIN_PASSWORD`           | Login da área administrativa                               |
| `ADMIN_SESSION_SECRET`     | Assinatura do cookie de sessão admin                       |
| `BOLAO_ACCESS_TOKEN`       | Token compartilhado para POST e listagem geral de palpites |
| `VITE_BOLAO_ACCESS_TOKEN`  | Mesmo valor do token acima, enviado pelo frontend          |
| `UPSTASH_REDIS_REST_URL`   | Redis Upstash para rate limit distribuído (opcional)       |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST do Upstash                                      |
| `THESPORTSDB_API_KEY`      | Proxy `/api/sportsdb/*` (detalhes da partida)              |
| `API_FOOTBALL_KEY`         | Proxy `/api/apifootball/*` (fallback opcional de gols)     |

> O token da football-data.org **nunca** vai para o bundle do React. Em produção, o proxy serverless injeta o header `X-Auth-Token`.

> As chaves da TheSportsDB e API-Football ficam **apenas no servidor** (`.env` local / variáveis da Vercel).

> Sem `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET`, a área admin fica desabilitada (503 no login).

## Execução local

```bash
# Frontend + APIs (middleware do Vite)
npm run dev

# Alternativa: ambiente idêntico à Vercel
npm run dev:full

# Build de produção
npm run build

# Preview do build (somente frontend estático)
npm run preview

# Aplicar migração completa no Neon (recomendado após deploy ou upgrade)
npm run db:init
```

Acesse `http://localhost:5173` após `npm run dev`.

> **`npm run preview`** serve apenas o build em `dist/` e o proxy de escudos (`/api/crests`). As APIs de palpites, ranking, admin e futebol **não** estão disponíveis nesse modo. Para testar o app completo localmente (como na Vercel), use **`npm run dev:full`** (`vercel dev`).

> Reinicie o servidor após alterar o `.env`.

## Deploy na Vercel

1. Conecte o repositório à Vercel
2. Em **Storage**, crie/conecte o **neon-banco** ao projeto (Production + Preview)
3. Em **Settings → Environment Variables**, configure:
   - `FOOTBALL_API_TOKEN`
   - `POSTGRES_URL` (injetado automaticamente pelo Neon, se conectado)
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   - `BOLAO_ACCESS_TOKEN` e `VITE_BOLAO_ACCESS_TOKEN` (recomendado)
   - `THESPORTSDB_API_KEY` (detalhes da partida)
   - `API_FOOTBALL_KEY` (opcional; fallback de gols)
   - `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (recomendado)
4. Faça deploy — as rotas em `api/` e o `vercel.json` são aplicados automaticamente
5. Na primeira requisição à API de palpites ou ranking, as **tabelas e índices** são criados automaticamente (`ensureSchemaStructure`). Para migração completa de dados legados (backfill de `person_name_key`, deduplicação), rode `npm run db:init` localmente uma vez após o deploy

O `vercel.json` configura:

- `/api/bets`, `/api/ranking`, `/api/admin/*`, `/api/football/*`, `/api/sportsdb/*`, `/api/apifootball/*`, `/api/crests/*` → Serverless Functions
- Demais rotas → SPA (`dist/index.html`)

## Proxy football-data.org

```
Browser  →  GET /api/football/competitions/WC/matches?season=2026
Servidor →  GET https://api.football-data.org/v4/competitions/WC/matches?season=2026
            Header: X-Auth-Token
```

A conta **Free** da football-data.org inclui a competição `WC` com os jogos da Copa 2026.

Somente estes caminhos são permitidos no proxy:

- `competitions`, `competitions/WC/matches`, `competitions/WC/teams`, `competitions/WC/standings`
- `matches/{id}`, `teams/{id}`, `teams/{id}/matches`

## Proxy TheSportsDB

```
Browser  →  GET /api/sportsdb/lookuptimeline.php?id=2391740
Servidor →  GET https://www.thesportsdb.com/api/v1/json/{THESPORTSDB_API_KEY}/lookuptimeline.php?id=2391740
```

Documentação: [TheSportsDB API](https://www.thesportsdb.com/documentation)

Endpoints permitidos no proxy:

- `searchevents.php`, `searchfilename.php`, `eventsday.php`
- `lookupevent.php`, `lookuptimeline.php`, `lookupeventstats.php`, `lookuplineup.php`

A chave vai na URL (`/api/v1/json/{key}/...`). Use `THESPORTSDB_API_KEY` no servidor; o valor padrão `123` funciona para testes, mas limita a timeline a 5 eventos.

## Proxy API-Football (opcional)

```
Browser  →  GET /api/apifootball/fixtures/events?fixture=1489381
Servidor →  GET https://v3.football.api-sports.io/fixtures/events?fixture=1489381
            Header: x-apisports-key
```

Usado como **fallback** quando a timeline da TheSportsDB traz menos gols que o placar final. Requer `API_FOOTBALL_KEY` (ou `APISPORTS_KEY`). Conta gratuita em [api-football.com](https://www.api-football.com/) (100 req/dia).

Somente `fixtures/events` com `fixture` numérico é permitido.

## Scripts npm

| Script             | Descrição                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `npm run dev`      | Dev server Vite com proxy de APIs                                                             |
| `npm run dev:full` | `vercel dev` (ambiente completo)                                                              |
| `npm run build`    | TypeScript + build para `dist/`                                                               |
| `npm run preview`  | Preview do build estático (`dist/`); sem APIs serverless — use `dev:full` para teste completo |
| `npm run db:init`     | Migração completa no Neon (estrutura + backfill e deduplicação de dados legados)              |
| `npm run scores:sync` | Recalcula `bet_scores` no Neon após mudança nas regras de pontuação                           |
| `npm run lint`        | ESLint                                                                                        |

## Segurança

- Credenciais do Postgres ficam apenas no servidor (Vercel / `.env` local)
- Queries parametrizadas (proteção contra SQL injection)
- Validação de entrada na API (IDs, placares opcionais, vencedor opcional, nome, tamanho do payload)
- **POST /api/bets** valida status e horário do jogo diretamente na football-data.org (snapshot do client não é confiável)
- Proxy `/api/football/*` e `/api/sportsdb/*` com **allowlist** de endpoints (só leitura GET)
- Proxy `/api/apifootball/*` opcional, também com allowlist
- Rate limit por IP no proxy football-data, na **listagem geral** de palpites (`GET /api/bets` sem filtros) e no login admin; **POST** de palpite não tem rate limit dedicado
- Com Upstash Redis configurado, os limites funcionam de forma distribuída na Vercel
- Token opcional `BOLAO_ACCESS_TOKEN` protege registro e listagem completa de palpites
- Comprovantes usam UUID v4
- Exclusão é soft delete (auditoria no banco) e restrita à área administrativa
- Sessão admin com cookie `HttpOnly`, `Secure` em produção e assinatura HMAC

> Consulta por `receiptId` ou `matchId` permanece pública (comprovante e palpites por jogo). Com `BOLAO_ACCESS_TOKEN`, POST e `GET /api/bets` exigem o header `X-Bolao-Token`. Adequado para bolão entre conhecidos; o token impede abuso casual, mas não substitui autenticação forte se a URL for amplamente divulgada.

## Licença

[MIT](LICENSE)
