# Nog — Desenvolvimento

Sistema de conferência de repasses médicos para Dra. Luana Carolina Fontana (Otorrino, iGUT Clínicas, Brasília/DF).

---

## Fases do Desenvolvimento

### Fase 1: Setup do Projeto
- [x] Criar projeto Next.js 15 + React 19 + TypeScript
- [x] Instalar dependências (zustand, tanstack-query, tanstack-table, echarts, xlsx, supabase, date-fns, zod, lucide-react)
- [x] Inicializar shadcn/ui + 15 componentes base
- [x] Criar schema SQL do Supabase (17 tabelas + seed data)
- [x] Criar tipos TypeScript correspondentes ao schema
- [x] Criar layout do dashboard (sidebar colapsável + header com breadcrumbs)

### Fase 2: Core ETL em TypeScript
- [x] Portar normalizers do Python (normalizeText, normalizePatientName, normalizeConvenio, normalizeDate)
- [x] Portar classifiers (classifyProcedure — 13 categorias, extractProductionProcedures)
- [x] Portar matching engine (exact → fuzzy name → fuzzy convênio, com indexação O(1))
- [x] Portar divergence detector (5 tipos: PRODUZIDO_SEM_REPASSE, REPASSE_SEM_PRODUCAO, EXAME_NAO_PAGO, GLOSA_INESPERADA, PERCENTUAL_INCORRETO)
- [x] Criar parser de produção (Excel/SheetJS — auto-detecta header e sheet)
- [x] Criar parser de repasse (CSV — pula ESTORNO, normaliza campos)

### Fase 3: API Routes + Upload
- [ ] Configurar Supabase client (server + browser)
- [ ] Criar `.env.local` com credenciais do Supabase
- [ ] Rodar migration SQL no Supabase
- [ ] API route: POST /api/upload (arquivo → Supabase Storage → parse → DB)
- [ ] API route: POST /api/conference/create (match + análise)
- [ ] API route: GET /api/conference/[sessionId]/divergences (com filtros)
- [ ] API route: GET /api/conference/[sessionId]/export (CSV)
- [ ] Conectar página de upload ao backend

### Fase 4: Dashboard + UI
- [x] KPI cards (Total Produzido, Total Repassado, Divergências, Taxa de Conferência)
- [x] Gráfico donut — Divergências por Tipo (ECharts)
- [x] Gráfico barra horizontal — Divergências por Convênio (ECharts)
- [x] Página de upload com drag-and-drop + parsing client-side + preview
- [ ] Tabela de divergências com TanStack Table (paginação, filtros, sort)
- [ ] Gráfico Produção × Repasse mensal (line chart)
- [ ] Gráfico Waterfall de valores (Bruto → Glosas → Impostos → Líquido)
- [ ] Slide-over de detalhe da divergência
- [ ] Fluxo completo de conferência (wizard: upload → match → resultado)

### Fase 5: Settings + Deploy
- [x] Página de regras de repasse (display)
- [x] Página de regras de impostos (display)
- [x] Página de deduções mensais (display)
- [ ] Tornar regras editáveis (CRUD com Supabase)
- [ ] Conectar Supabase Auth (login da doutora)
- [ ] Deploy no Vercel
- [ ] Domínio customizado (opcional)

---

## Estrutura de Arquivos

```
nog/
├── supabase/migrations/001_initial_schema.sql    # 17 tabelas + seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx                             # Root (providers, fonts, lang=pt-BR)
│   │   └── (dashboard)/
│   │       ├── layout.tsx                         # Sidebar + Header
│   │       ├── page.tsx                           # Dashboard (KPIs + gráficos)
│   │       ├── upload/page.tsx                    # Upload + parsing client-side
│   │       ├── conference/page.tsx                # Lista de conferências
│   │       ├── convenios/page.tsx                 # Convênios cadastrados
│   │       └── settings/
│   │           ├── tax-rules/page.tsx
│   │           ├── repasse-rules/page.tsx
│   │           └── deductions/page.tsx
│   ├── components/
│   │   ├── ui/                                    # 15 componentes shadcn/ui
│   │   ├── layout/{sidebar,header}.tsx
│   │   ├── dashboard/{kpi-cards,divergence-charts}.tsx
│   │   └── shared/{severity-badge,divergence-type-badge,currency-display}.tsx
│   ├── lib/
│   │   ├── types/database.ts                      # Tipos TS do schema
│   │   ├── utils/{constants,formatting}.ts
│   │   ├── etl/
│   │   │   ├── normalizers.ts                     # Normalização de texto/nome/convênio/data
│   │   │   ├── classifiers.ts                     # Classificação de procedimentos (13 categorias)
│   │   │   ├── matching/matcher.ts                # Engine de matching (3 estratégias)
│   │   │   ├── analysis/divergence-detector.ts    # Detecção de divergências (5 tipos)
│   │   │   └── parsers/{production,repasse}-parser.ts
│   │   └── stores/app-store.ts                    # Zustand (sidebar, doctor/clinic ativos)
│   └── providers/query-provider.tsx               # TanStack Query
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 + React 19 + TypeScript |
| Estilização | Tailwind CSS 4 + shadcn/ui |
| Tabelas | TanStack Table |
| Gráficos | Apache ECharts |
| Estado | Zustand + TanStack Query |
| Banco | Supabase (PostgreSQL) |
| Parsing Excel | SheetJS (xlsx) |
| Deploy | Vercel |

---

## Dados de Referência

- **2.587** atendimentos (Jan/25 — Jan/26)
- **110** registros de repasse (Jan/26)
- **1.240** produzidos sem repasse identificados
- **205** atendimentos QUALLITY PRÓ SAÚDE sem repasse (~R$15k+ perdidos)
- Alíquota padrão: 17,03% (consultas), 7,93% (cirurgias)
- Deduções mensais: PRO LABORE R$375,72 + TAXA ADM R$300,00

---

## Próximos Passos

1. **Configurar Supabase** — Criar projeto, rodar migration, configurar `.env.local`
2. **API routes** — Upload → parse → DB → match → divergências
3. **Tabela de divergências** — TanStack Table com filtros e paginação
4. **Fluxo de conferência** — Wizard end-to-end
5. **Deploy Vercel** — Preview deployment funcional
