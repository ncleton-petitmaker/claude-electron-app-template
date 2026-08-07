# Design systems

yaka-bridge supports project-level design systems. The default is `claude`, but
a customer ERP can replace the design system for every module and Bridge surface
without rewriting the product architecture.

## Design system contract

A yaka-bridge design system lives in:

```text
design-systems/<id>/
  DESIGN.md
  design-system.config.json
  tokens.css
  assets/app-mark.svg
  assets/bridge-mark.svg
```

Required files:

- `DESIGN.md`: human and agent-readable rules.
- `design-system.config.json`: machine-readable manifest.
- `tokens.css`: CSS variables consumed by app, modules and Tailwind aliases.
- `brand`: logo and module-icon charter embedded in the manifest.

Optional files:

- `assets/app-mark.svg`
- `assets/bridge-mark.svg`

The active system is recorded in `design-system.config.json` at the repo root.

## Logo and module-icon charter

Every design system must describe its visual identity rules in
`design-system.config.json` under `brand`.

The `brand` block covers:

- `appMark`: primary application mark, normally copied to `public/app-mark.svg`;
- `bridgeMark`: desktop Bridge and packaged-app mark, normally copied to
  `public/bridge-mark.svg` or `public/bridge-mark.png`;
- `moduleIcons`: in-product module icons and launcher glyphs;
- `thirdPartyMarks`: external provider marks such as Jan, LM Studio, OpenAI or
  cloud vendors.

Rules:

- App and Bridge marks must stay in the same visual family.
- Marks and module icons must use design-system tokens, currentColor or the
  active asset files; they must not introduce a separate palette.
- Module navigation and action buttons should use the shared `Icon` component.
- A third-party provider logo is not a module icon by default. Use a neutral
  product icon plus the provider name until license and trademark usage have
  been reviewed.
- Do not copy upstream product logos into the public yaka-bridge repo before
  license, trademark and distribution audit.
- Icon-only launchers must have an accessible label and a tooltip/title. If the
  launcher starts a local runtime, the action must be explicit and auditable.

## Importing a design system

Use `design:import` for OpenDesign outputs or a customer-owned `DESIGN.md`:

```bash
npm run design:import -- \
  --id customer-system \
  --source /absolute/path/to/DESIGN.md \
  --apply
```

For a local `nexu-io/open-design` checkout:

```bash
npm run design:import -- \
  --id customer-system \
  --opendesign-root /Volumes/Docker/code/opendesign \
  --source-id customer-system \
  --apply
```

The importer normalizes the source into:

```text
design-systems/<id>/
  DESIGN.md
  design-system.config.json
  tokens.css
  assets/app-mark.svg
  assets/bridge-mark.svg
```

It extracts usable colors/fonts from the source document, derives missing app
and Bridge tokens, and keeps the original `DESIGN.md` auditable. Generated
tokens are a starting point: high-risk customer systems still need visual
review and accessibility checks.

## Applying a design system

Use:

```bash
npm run design:apply -- --design-system claude
```

For an imported yaka-bridge contract:

```bash
npm run design:apply -- \
  --design-system customer-system \
  --source /absolute/path/to/customer-system
```

The script writes:

```text
app/design-system.css
DESIGN.md
bridge/design-system.json
public/app-mark.svg
public/bridge-mark.svg
design-system.config.json
```

`app/layout.tsx` imports `app/design-system.css` after `globals.css`. Shared
shell classes stay generic; all visual values come from the active generated
tokens.

Bridge reads `bridge/design-system.json` in its setup window and the Bridge
build copies that file into `dist/bridge/`.

## Brief field

New projects choose a design system at first setup:

```yaml
DESIGN_SYSTEM: claude
```

To use an imported source during generation:

```yaml
DESIGN_SYSTEM: customer-system
DESIGN_SYSTEM_SOURCE: /absolute/path/to/DESIGN.md
```

`DESIGN_SYSTEM_SOURCE` can be a raw OpenDesign/customer `DESIGN.md`, a folder
containing one, or a yaka-bridge design-system folder with
`design-system.config.json`. Raw sources are imported into the generated app
before `design:apply` runs.

If absent, the factory uses `claude`.

## Refactoring all modules and Bridge

Applying tokens is only the first step. A full visual migration must use the
global skill:

```text
Use the yaka-bridge-refactor-design-system skill to apply this design system to
all modules, admin pages and Bridge surfaces.
```

That skill audits:

- `app/`
- `components/`
- `modules/`
- `bridge/`
- `public/`
- `tailwind.config.ts`
- docs and screenshots when relevant

It must remove stale visual assumptions, preserve agentic/business behavior,
and run the full verification suite.

## Using nexu-io/open-design

Recommended option for creating a new customer design system:

1. Use `nexu-io/open-design` to explore and generate a design direction:
   <https://github.com/nexu-io/open-design>
2. Export or write a clear `DESIGN.md`.
3. Run `npm run design:import -- --id <id> --source <path> --apply`.
4. Run the refactor skill if the design changes layout density, typography or
   component behavior.
5. Verify with build, factory and visual review.

Do not import an open-design output blindly. The final yaka-bridge contract
must be auditable, tokenized, accessible, and free of customer secrets.

## Required token families

Every design system must provide:

- surfaces: `--bg`, `--surface`, `--subtle`, `--bg-muted`;
- borders: `--border`, `--border-strong`, `--border-soft`;
- text: `--fg`, `--fg-strong`, `--muted`, `--soft`, `--faint`;
- accent: `--accent`, `--accent-strong`, `--accent-soft`, `--accent-tint`, `--on-accent`;
- status: green, blue, purple, red, amber;
- elevation: `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`;
- shape: `--radius-sm`, `--radius`, `--radius-lg`, `--radius-pill`;
- type: `--serif`, `--sans`, `--mono`;
- motion: `--ease`, `--t-fast`.
- local UI sizing: `--modal-padding`.
- brand contract: `brand.logoCharterVersion`, `brand.appMark`,
  `brand.bridgeMark`, `brand.moduleIcons`, `brand.thirdPartyMarks`.

## Acceptance checklist

Before merging a design system change:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm run security:grep
npm run factory:check
```

Also verify:

- generated ERP receives the selected design system;
- Bridge setup window receives the Bridge token subset;
- no module keeps hardcoded legacy colors;
- no text overflows after typography/radius/spacing changes;
- light and dark modes are readable if both are supported;
- screenshots or browser review cover desktop and mobile widths.
