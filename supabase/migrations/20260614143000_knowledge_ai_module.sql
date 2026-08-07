create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.knowledge_ai_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  name text not null,
  description text,
  context_policy text not null default 'organization-local',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_contents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  project_id uuid references public.knowledge_ai_projects(id) on delete set null,
  title text not null,
  source_type text not null default 'file',
  source_ref text,
  mime_type text,
  status text not null default 'draft'
    check (status in ('draft', 'processing', 'ready', 'error', 'archived')),
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  content_id uuid not null references public.knowledge_ai_contents(id) on delete cascade,
  project_id uuid references public.knowledge_ai_projects(id) on delete set null,
  section_index integer not null default 0,
  heading text,
  body text not null,
  embedding vector,
  citations jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  project_id uuid references public.knowledge_ai_projects(id) on delete set null,
  title text not null default 'Nouveau chat',
  mode text not null default 'rag'
    check (mode in ('rag', 'local_llm', 'bridge_codex')),
  provider text not null default 'lmstudio_local'
    check (provider in ('bridge_codex', 'lmstudio_local', 'dgx_spark_lan')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  conversation_id uuid not null references public.knowledge_ai_conversations(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  provider text check (provider in ('bridge_codex', 'lmstudio_local', 'dgx_spark_lan')),
  citations jsonb not null default '[]'::jsonb,
  tool_calls jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  project_id uuid references public.knowledge_ai_projects(id) on delete set null,
  file_name text not null,
  mime_type text,
  source_type text not null default 'file',
  storage_ref text,
  status text not null default 'prepared'
    check (status in ('prepared', 'extracting', 'embedding', 'ready', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  project_id uuid references public.knowledge_ai_projects(id) on delete set null,
  name text not null,
  system_instructions text not null,
  provider text not null default 'lmstudio_local'
    check (provider in ('bridge_codex', 'lmstudio_local', 'dgx_spark_lan')),
  slash_commands jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_ai_shortcuts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  agent_id uuid references public.knowledge_ai_agents(id) on delete cascade,
  command text not null,
  description text not null,
  instruction text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, command)
);

create table if not exists public.knowledge_ai_runtime_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bridge_organizations(id) on delete cascade,
  provider_mode text not null default 'local_only'
    check (provider_mode = 'local_only'),
  lmstudio_base_url text not null default 'http://127.0.0.1:1234/v1',
  dgx_base_url text,
  dgx_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index if not exists knowledge_ai_projects_org_idx
  on public.knowledge_ai_projects(organization_id, created_at desc);
create index if not exists knowledge_ai_contents_org_status_idx
  on public.knowledge_ai_contents(organization_id, status, created_at desc);
create index if not exists knowledge_ai_sections_content_idx
  on public.knowledge_ai_sections(organization_id, content_id, section_index);
create index if not exists knowledge_ai_conversations_org_idx
  on public.knowledge_ai_conversations(organization_id, created_at desc);
create index if not exists knowledge_ai_messages_conversation_idx
  on public.knowledge_ai_messages(organization_id, conversation_id, created_at);
create index if not exists knowledge_ai_uploads_org_idx
  on public.knowledge_ai_uploads(organization_id, status, created_at desc);
create index if not exists knowledge_ai_agents_org_idx
  on public.knowledge_ai_agents(organization_id, name);

alter table public.knowledge_ai_projects enable row level security;
alter table public.knowledge_ai_contents enable row level security;
alter table public.knowledge_ai_sections enable row level security;
alter table public.knowledge_ai_conversations enable row level security;
alter table public.knowledge_ai_messages enable row level security;
alter table public.knowledge_ai_uploads enable row level security;
alter table public.knowledge_ai_agents enable row level security;
alter table public.knowledge_ai_shortcuts enable row level security;
alter table public.knowledge_ai_runtime_settings enable row level security;

drop policy if exists "knowledge ai readers read projects" on public.knowledge_ai_projects;
create policy "knowledge ai readers read projects"
  on public.knowledge_ai_projects for select
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:read')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:write')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai writers manage projects" on public.knowledge_ai_projects;
create policy "knowledge ai writers manage projects"
  on public.knowledge_ai_projects for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:write')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:write')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai readers read contents" on public.knowledge_ai_contents;
create policy "knowledge ai readers read contents"
  on public.knowledge_ai_contents for select
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:read')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:write')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai ingesters manage contents" on public.knowledge_ai_contents;
create policy "knowledge ai ingesters manage contents"
  on public.knowledge_ai_contents for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:write')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:write')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai readers read sections" on public.knowledge_ai_sections;
create policy "knowledge ai readers read sections"
  on public.knowledge_ai_sections for select
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:read')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai ingesters manage sections" on public.knowledge_ai_sections;
create policy "knowledge ai ingesters manage sections"
  on public.knowledge_ai_sections for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai chat reads conversations" on public.knowledge_ai_conversations;
create policy "knowledge ai chat reads conversations"
  on public.knowledge_ai_conversations for select
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:read')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai chat manages conversations" on public.knowledge_ai_conversations;
create policy "knowledge ai chat manages conversations"
  on public.knowledge_ai_conversations for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai chat reads messages" on public.knowledge_ai_messages;
create policy "knowledge ai chat reads messages"
  on public.knowledge_ai_messages for select
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:read')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai chat manages messages" on public.knowledge_ai_messages;
create policy "knowledge ai chat manages messages"
  on public.knowledge_ai_messages for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai ingesters manage uploads" on public.knowledge_ai_uploads;
create policy "knowledge ai ingesters manage uploads"
  on public.knowledge_ai_uploads for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai agents read agents" on public.knowledge_ai_agents;
create policy "knowledge ai agents read agents"
  on public.knowledge_ai_agents for select
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:read')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:agents')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai agents manage agents" on public.knowledge_ai_agents;
create policy "knowledge ai agents manage agents"
  on public.knowledge_ai_agents for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:agents')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:agents')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai agents manage shortcuts" on public.knowledge_ai_shortcuts;
create policy "knowledge ai agents manage shortcuts"
  on public.knowledge_ai_shortcuts for all
  using (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:agents')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  )
  with check (
    public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:agents')
    or public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin')
  );

drop policy if exists "knowledge ai admins manage runtime settings" on public.knowledge_ai_runtime_settings;
create policy "knowledge ai admins manage runtime settings"
  on public.knowledge_ai_runtime_settings for all
  using (public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin'))
  with check (public.bridge_has_scope(organization_id, 'knowledge_ai', 'service:knowledge_ai:admin'));

insert into public.erp_modules (module_key, name, category, description, default_data_strategy, required_scopes, manifest)
values (
  'knowledge_ai',
  'Connaissance',
  'business',
  'Contrat Bridge du service Connaissance independant en mode local-only.',
  'service-supabase',
  array[
    'erp:core:read',
    'erp:events:publish',
    'erp:events:consume',
    'service:knowledge_ai:read',
    'service:knowledge_ai:write',
    'service:knowledge_ai:ingest',
    'service:knowledge_ai:chat',
    'service:knowledge_ai:agents',
    'service:knowledge_ai:admin',
    'codex:run'
  ],
  '{
    "deployment": {
      "kind": "external-service",
      "serviceSlug": "connaissance",
      "defaultDomainPattern": "connaissance.<client-domain>",
      "localDevUrl": "http://localhost:3200",
      "serviceUrlEnv": "NEXT_PUBLIC_KNOWLEDGE_AI_SERVICE_URL",
      "healthPath": "/healthz",
      "launchCallbackPath": "/bridge/launch",
      "coolify": {
        "required": true,
        "resource": "application",
        "config": "services/connaissance/coolify.json",
        "dockerfile": "services/connaissance/Dockerfile"
      },
      "supabase": {"strategy": "dedicated", "sharedAllowed": false}
    },
    "routes": [
      "/connaissance",
      "/admin/knowledge-ai"
    ],
    "actions": [
      {"id": "knowledge_ai.runtime.status"},
      {"id": "knowledge_ai.source.inventory"},
      {"id": "knowledge_ai.chat.send"},
      {"id": "knowledge_ai.chat.stream"},
      {"id": "knowledge_ai.upload.prepare"},
      {"id": "knowledge_ai.project.create"},
      {"id": "knowledge_ai.agent.create"}
    ],
    "events": [
      {"type": "knowledge_ai.chat.message_created"},
      {"type": "knowledge_ai.upload.prepared"},
      {"type": "knowledge_ai.job.completed"}
    ],
    "runtime": {
      "providerMode": "local_only",
      "providers": ["bridge_codex", "lmstudio_local", "dgx_spark_lan"],
      "dgxEnabledByDefault": false
    },
    "tables": [
      "knowledge_ai_projects",
      "knowledge_ai_contents",
      "knowledge_ai_sections",
      "knowledge_ai_conversations",
      "knowledge_ai_messages",
      "knowledge_ai_uploads",
      "knowledge_ai_agents",
      "knowledge_ai_shortcuts",
      "knowledge_ai_runtime_settings"
    ]
  }'::jsonb
)
on conflict (module_key) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  default_data_strategy = excluded.default_data_strategy,
  required_scopes = excluded.required_scopes,
  manifest = excluded.manifest,
  updated_at = now();
