-- Module sales_crm : contrat Bridge du CRM commercial independant.
--
-- Cette migration ne cree AUCUNE table metier, et c'est deliberé. Le CRM
-- embarque un cluster Postgres complet par tenant : dupliquer ici ses
-- entreprises, contacts et interactions creerait deux referentiels a
-- reconcilier, chacun se croyant la source de verite.
--
-- Le module est donc en dataStrategy "external-api". Bridge garde ce qui
-- releve de lui, et de lui seul : la declaration du module dans le
-- catalogue, les portees qu'un utilisateur doit detenir, et l'adresse du
-- service. Les donnees restent chez le CRM.
--
-- Cf. modules/sales_crm/module.config.json et ULTRAPLAN-YAKA-BRIDGE-CRM.md.

insert into public.erp_modules (module_key, name, category, description, default_data_strategy, required_scopes, manifest)
values (
  'sales_crm',
  'CRM commercial',
  'business',
  'Contrat Bridge du CRM commercial independant : donnees hors Bridge, actions proxifiees, ouverture par billet.',
  'external-api',
  array[
    'erp:core:read',
    'erp:events:publish',
    'service:sales_crm:read',
    'service:sales_crm:write',
    'service:sales_crm:admin'
  ],
  '{
    "deployment": {
      "kind": "external-service",
      "serviceSlug": "crm",
      "defaultDomainPattern": "crm.<client-domain>",
      "localDevUrl": "http://127.0.0.1:3950",
      "serviceUrlEnv": "NEXT_PUBLIC_SALES_CRM_SERVICE_URL",
      "healthPath": "/health",
      "launchCallbackPath": "/bridge/launch",
      "coolify": {
        "required": false,
        "resource": "external"
      },
      "supabase": {"strategy": "dedicated", "sharedAllowed": false}
    },
    "routes": [
      "/crm",
      "/admin/sales-crm"
    ],
    "actions": [
      {"id": "sales_crm.customer.lookup"},
      {"id": "sales_crm.contact.lookup"},
      {"id": "sales_crm.interaction.log"},
      {"id": "sales_crm.service.health"}
    ],
    "events": [
      {"type": "sales_crm.customer.updated"},
      {"type": "sales_crm.interaction.created"}
    ],
    "tables": []
  }'::jsonb
)
on conflict (module_key) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  default_data_strategy = excluded.default_data_strategy,
  required_scopes = excluded.required_scopes,
  manifest = excluded.manifest;
