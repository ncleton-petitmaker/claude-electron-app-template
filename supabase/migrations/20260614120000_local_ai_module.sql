insert into public.erp_modules (module_key, name, category, description, default_data_strategy, required_scopes, manifest)
values (
  'local_ai',
  'IA locale',
  'business',
  'Module de reference pour l''interface AnythingLLM, Jan, LM Studio et les futurs providers IA locaux compatibles Bridge.',
  'external-api',
  array[
    'erp:core:read',
    'erp:events:consume',
    'service:local_ai:read',
    'service:local_ai:write',
    'service:local_ai:admin'
  ],
  '{
    "actions": [
      {"id": "local_ai.jan.status"},
      {"id": "local_ai.jan.instructions"}
    ],
    "events": [],
    "tables": [],
    "externalSources": [
      {
        "key": "anythingllm-upstream",
        "repository": "https://github.com/Mintplex-Labs/anything-llm.git",
        "defaultRef": "master",
        "localPathEnv": "YAKA_ANYTHINGLLM_SOURCE_DIR",
        "defaultLocalPath": "/Volumes/Docker/anythingllm-upstream",
        "policy": "read-only-ui-reference"
      },
      {
        "key": "anythingllm-yaka-bridge",
        "repository": "https://github.com/Mintplex-Labs/anything-llm.git",
        "defaultRef": "yaka-bridge-integration",
        "localPathEnv": "YAKA_ANYTHINGLLM_WORKTREE_DIR",
        "defaultLocalPath": "/Volumes/Docker/anythingllm-yaka-bridge",
        "policy": "bridge-ui-adaptation-worktree"
      },
      {
        "key": "jan-upstream",
        "repository": "https://github.com/janhq/jan.git",
        "defaultRef": "main",
        "localPathEnv": "YAKA_JAN_SOURCE_DIR",
        "defaultLocalPath": "/Volumes/Docker/jan-upstream",
        "policy": "read-only-reference"
      },
      {
        "key": "jan-yaka-bridge",
        "repository": "https://github.com/janhq/jan.git",
        "defaultRef": "yaka-bridge-integration",
        "localPathEnv": "YAKA_JAN_WORKTREE_DIR",
        "defaultLocalPath": "/Volumes/Docker/jan-yaka-bridge",
        "policy": "bridge-adaptation-worktree"
      }
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
