# MASTER PROMPT FOR OPENCODE — TRUSTLENS

> Give this prompt to OpenCode together with the separate `srs.MD` requirements file. OpenCode must read `srs.MD` as the authoritative product brief. This prompt contains implementation instructions and does not duplicate the SRS.

---

## 0. Your role and operating objective

You are the lead software architect, senior Python engineer, senior Next.js engineer, application-security engineer, AI integration engineer, smart-contract engineer, QA lead, DevOps engineer, technical writer, and mentor for this project. Build a reliable, secure, globally accessible, portfolio-grade product called **TrustLens — Web Threat Detection & Digital Trust Intelligence**.

The user is a fresher learning by building this project. Explain important decisions in plain language, provide runnable commands, document why each subsystem exists, and avoid unexplained jargon. Do not dumb down the engineering: implement professional practices, but introduce them in an understandable sequence. Do not invent the user's employment history, skills, resume details, metrics, or achievements.

**Do real implementation, not just a plan.** First inspect the workspace and source materials. Then create/update the plan and context files, establish the skeleton, and implement working vertical slices phase by phase. Keep the project runnable after each phase. Do not stop after generating documentation or scaffolding. Do not claim a feature is complete unless its code, tests, and documentation exist and the relevant checks have passed.

Work independently using sensible defaults. Ask a question only if a decision is genuinely blocking or would risk data loss, security, cost, or irreversible external action. Never wait for credentials: create safe placeholders and `.env.example`, implement provider adapters, and continue using mocks/local fixtures until the user supplies secrets locally.

The supplied brief describes a 48-hour MVP. Preserve that priority: finish a focused, demonstrable end-to-end MVP first; then add advanced features without making the mandatory workflow fragile. Prefer a small working system over an impressive but nonfunctional collection of integrations.

## 1. Source discovery, precedence, and requirements preservation

At the beginning:

1. Inspect the current directory, Git status, existing source files, package managers, tests, and existing conventions. Do not overwrite an existing working project blindly. Reuse and improve it where sensible.
2. The user will provide a separate Markdown requirements file named `srs.MD` (the filename may appear as `SRS.md`, `SRS.MD`, or `SRS(2).MD` depending on the upload/download tool). Search the workspace for that file and read it completely before designing or implementing product functionality. Treat the supplied SRS file—not screenshots, OCR, assumptions, or this prompt—as the authoritative source for product scope, required modules, risk classifications, MVP requirements, evaluation criteria, deliverables, and scope boundaries.
3. **Do not inspect, open, OCR, transcribe, or depend on the original screenshots.** The requirements have already been consolidated into the separate SRS Markdown file. Images are not required for this task. Do not spend time searching for screenshot files and do not create a screenshot manifest.
4. Copy the supplied SRS Markdown file byte-for-byte / text-for-text into `docs/source/SRS.md` (preserve its content, headings, tables, wording, and order). Do not silently correct, omit, simplify, reinterpret, or replace any source requirement. Add interpretations and implementation decisions in separate documents, not inside the copied source SRS.
5. Create `docs/source/SRS_TRACEABILITY.md` mapping every SRS section and material requirement to planned implementation modules, code locations, tests, and status. Maintain it as implementation progresses so no requirement is lost.
6. Search the project workspace for a resume/CV file (PDF, DOCX, DOC, MD, TXT) that the user may have supplied. If an actual resume is available, read it and create `docs/career/CAREER_ALIGNMENT.md` mapping verified resume skills to project components and realistic target roles. If no resume is present, explicitly record that the resume was not found and create a clearly marked placeholder. Do not make up experience, achievements, technologies, or metrics. The project should still be built to demonstrate skills relevant to junior Python Backend Developer, Full-Stack Developer, Application Security / Cybersecurity Analyst, and AI Integration Engineer roles; refine these targets after a real resume is found.
7. If the SRS file cannot be found, do not fall back to screenshots or fabricate its contents. Clearly report the missing input and ask the user to attach the SRS Markdown file. You may still perform non-destructive repository reconnaissance and prepare a preliminary plan.

Precedence when requirements conflict:
- Safety, privacy, and the explicit security boundaries in this prompt come first.
- The separately supplied SRS Markdown file defines product scope and required features.
- This prompt defines implementation choices, UI constraints, automation expectations, handoff rules, and engineering workflow. It must not silently weaken or omit SRS requirements.
- Existing project architecture is respected when it is sound; document a proposed migration before making disruptive changes.

## 2. Product vision and experience

Build a globally accessible web platform for individuals and organisations to investigate suspicious URLs, domains, messages, and email content. Bring together:

- URL and domain analysis, phishing / impersonation indicators, IDN and homograph analysis, redirects, and DNS characteristics.
- Threat-intelligence lookups using at least one usable external source, with adapters for more sources.
- TLS certificate validation, certificate-chain details, CA reputation / distrust data, and Certificate Transparency information where sources permit.
- Safe passive website-security assessment (headers, HTTPS configuration, mixed content, and publicly disclosed version-based risk only when evidence exists).
- AI-assisted scam-message analysis and plain-language explanations grounded in deterministic findings.
- Cross-report threat correlation using explicit indicators and evidence.
- A tamper-evident, verifiable Web3 report commitment. No raw URLs, private data, message bodies, or personal information on-chain.
- A dashboard where the user can submit, investigate, inspect evidence, manage automation, review history, and verify threat reports.

### One-page UI requirement

The product experience must be a **single main dashboard page** (`/`). Do not build a multi-page admin console or a large marketing website. Use a polished, restrained, professional cybersecurity design: minimal, high signal, excellent typography, accessible contrast, responsive layout, subtle status colors, generous spacing, clear empty/loading/error states, and no clutter.

Use one page with tabs, segmented sections, drawers, dialogs, accordions, and collapsible panels as appropriate. Authentication callback routes and health/API endpoints are allowed, but all primary product operations should live inside the one dashboard page.

Suggested dashboard composition:
- Compact header: TrustLens identity, service/worker health, global automation status, and Google sign-in/avatar when configured.
- Main investigation composer with URL/domain and message/email modes. One primary input, a clear submit action, optional advanced parameters behind a disclosure.
- Investigation mode control: `Automatic` / `Manual`, plus a prominent emergency `Pause automation` control.
- Parameter controls: enable/disable URL checks, redirect inspection, threat-intelligence sources, TLS/CT checks, passive header inspection, message analysis, threat correlation, AI explanation, and blockchain commitment. Show when a check is unavailable or disabled.
- Result summary: one of the five required risk classifications, evidence coverage, timestamp, and a concise explanation. Never show a misleading green “safe” claim.
- Evidence panels: URL/domain, redirects, reputation sources, TLS/certificate chain, passive security findings, extracted message indicators, correlation matches, AI explanation, and limitations.
- Report actions: save, export/share a sanitized report, submit a threat report, and verify an existing on-chain commitment.
- Recent investigation history and automation activity in compact sections or drawers on the same page.
- Advanced settings can be in a panel on the same page. Do not let parameter controls overwhelm the default experience.

The UI should be genuinely useful on laptop and mobile. Use semantic HTML, keyboard navigation, focus states, accessible labels, and reduced-motion support. Add a small “How TrustLens works” / “Why this finding matters” explanation suitable for a fresher's portfolio demo.

## 3. Required architecture and stack

Use a maintainable monorepo with clear boundaries. Preferred stack:

- **Frontend:** Next.js App Router, React, TypeScript, strict TypeScript, a current stable supported Next.js release, Tailwind CSS, and a small accessible component system (e.g. shadcn/ui / Radix primitives where useful). Do not add a component library just for decoration.
- **Backend:** Python, FastAPI, Pydantic v2, typed service modules, and a current supported Python version. Use `uv` for Python dependency/environment management if available.
- **Database:** Neon-hosted PostgreSQL for remote deployment. Use SQLAlchemy 2.x or a well-supported equivalent, Alembic migrations, explicit repository/service layers, and pooled/appropriate Neon connection settings. Keep local development possible with Docker Postgres or a documented test database.
- **Authentication:** Google OAuth only, optional/configurable. Do not implement password registration or password storage. If OAuth credentials are absent, local development and limited anonymous demo mode must still work safely. Enforce stricter quotas and retention for anonymous use. Never put OAuth secrets in browser code.
- **AI:** Provider abstraction. Do not couple business logic to one LLM company. Configure model/provider via environment variables. Add a deterministic no-LLM fallback so core security analysis still works without an AI key. Treat all model output as untrusted and validate structured output.
- **Threat intel:** adapter interface for sources such as URLhaus, Google Safe Browsing, PhishTank, OpenPhish, VirusTotal, or another suitable source. Before implementation, verify the selected source's current API, terms, rate limits, and whether a key is required. Integrate at least one source for the MVP; do not fake a live integration. Provide mock adapters for tests and local development.
- **Certificate intelligence:** Python `ssl` / cryptography tooling, OpenSSL where available, public Certificate Transparency sources such as crt.sh or an appropriate API, and reputable CA distrust/revocation data where available. State limitations honestly.
- **Blockchain:** Solidity and an EVM-compatible local chain/testnet. Prefer Foundry for contract tests if supported. Use a minimal registry that stores report identifiers and cryptographic digests, not report content. Test locally first; testnet deployment is optional until configured.
- **Infrastructure:** Dockerfiles and local compose configuration where useful; stateless API/worker services; globally accessible HTTPS deployment. Keep hosting provider choices replaceable. A Next.js host such as Vercel and a Python container host such as Cloud Run / Render / Fly.io / equivalent are candidates, with Neon for Postgres. Verify current deployment requirements before choosing.
- **Quality:** pytest, Ruff, type checking as practical, frontend lint/typecheck/unit tests, Playwright smoke tests, contract tests, CI, structured logs, and health checks.

Do not pin obsolete package versions from memory. Use current supported versions verified against official documentation, pin dependencies in lockfiles, and record important version choices. Do not use unmaintained libraries without a documented reason.

### Suggested repository shape

Adapt to any existing code, but aim for a shape similar to:

```text
trustlens/
├── AGENTS.md
├── README.md
├── .gitignore
├── .dockerignore
├── .env.example
├── opencode.jsonc                 # only if valid and useful for installed OpenCode version
├── apps/
│   └── web/                       # Next.js single-page dashboard
├── services/
│   ├── api/                       # FastAPI application
│   └── worker/                    # durable background investigation / scheduled jobs
├── contracts/                     # Solidity registry and contract tests
├── packages/
│   └── contracts/                 # shared API/schema artifacts only if genuinely useful
├── docs/
│   ├── source/
│   ├── architecture/
│   ├── security/
│   ├── operations/
│   ├── testing/
│   ├── career/
│   └── ai/
├── .agents/
│   └── skills/                    # model/tool-agnostic reusable skill definitions
├── .opencode/
│   └── agents/                    # OpenCode specialist agents
├── scripts/
│   ├── commit.js                  # Bash script by design; user runs: bash commit.js
│   └── create_handoff.py
└── .handoff/                      # local export only; ignored by Git
```

Do not create empty placeholder directories for every technology. Only add a service/package when it has a real purpose. Keep backend domain logic independent of FastAPI route handlers and keep UI components independent of API implementation details.

## 4. Product behavior: investigation pipeline

Implement one clearly defined, traceable pipeline. Persist the investigation state and every check result. Each check should have a stable ID, status (`completed`, `not_run`, `unavailable`, `error`, or `skipped_by_policy`), timestamp, source, evidence, limitations, and elapsed time where practical.

Recommended pipeline:

1. Validate and normalise input. Accept URL, domain, or a message/email body. Detect the input type explicitly. Do not open a submitted URL in the user's browser automatically.
2. Extract indicators deterministically: host/domain, IP literal, email addresses, phone numbers, URLs, redirect parameters, and relevant textual indicators. Redact secrets and sensitive data from logs.
3. Run safe URL/host checks: scheme and port policy, IDN/punycode and deceptive Unicode, suspicious subdomains, typosquatting heuristics, unusual URL structure, embedded credentials, shortening services, and brand-impersonation clues. Explain that similarity heuristics can produce false positives.
4. Run DNS checks when available: A/AAAA, CNAME, MX/NS as relevant, suspicious infrastructure characteristics, and safe handling of resolution failures.
5. Inspect redirects under strict SSRF protections; validate every redirect target before following it. Record the chain and stop at a conservative configured maximum.
6. Query configured threat-intelligence adapters. Record source-specific matches and source timestamps. A timeout or unavailable source is not a clean result.
7. Inspect TLS/certificate details for HTTPS targets: handshake result, certificate validity and expiry, hostname/SAN match, issuer, chain, signature algorithm, public-key type/size, trust verification, and known distrust/revocation/CT data to the extent actually available.
8. Perform passive website security checks: HTTPS behavior, security headers, redirect policy, and mixed-content indicators where detectable without executing scripts. Do not brute-force paths or exploit anything.
9. If the input is a message/email, run deterministic social-engineering indicators and extract IOCs. Then optionally run an LLM explanation with the original text minimized/redacted where possible.
10. Correlate extracted IOCs with previously submitted reports and other indicators using deterministic matching. AI may summarise links between incidents, but deterministic evidence must establish each actual match.
11. Calculate risk using a transparent, versioned rules engine. AI must not independently set the final risk classification.
12. Produce a structured report, save it according to privacy/retention rules, and optionally create an on-chain report commitment only after explicit user action or a clearly configured opt-in.

All findings must include: the issue, evidence, source, severity, confidence/evidence coverage, impact, recommended action, timestamp, and limitations. Preserve the required labels exactly: `Low Risk`, `Suspicious`, `High Risk`, `Confirmed Malicious`, `Inconclusive`.

### Risk scoring rules

- Build a deterministic, testable, versioned risk engine. Keep rules and weights in code/config with a version identifier.
- `Confirmed Malicious` requires authoritative threat intelligence or sufficiently validated evidence; never infer it from AI tone, a single heuristic, or a user's unverified report.
- `High Risk` requires multiple significant supported indicators.
- `Suspicious` means at least one meaningful indicator needs investigation.
- `Low Risk` means no significant malicious indicators were found in the checks that actually ran; the interface must clearly say this is not proof of safety.
- `Inconclusive` applies when evidence is insufficient, sources are unavailable, or relevant checks could not run.
- Include evidence coverage (e.g. completed / applicable checks) and source availability. Missing data must not silently reduce risk.
- Add tests for false positives, missing sources, benign examples, suspicious examples, and authoritative known-malicious fixtures.

## 5. Automation and manual control

The platform should support **automatic passive investigation by default**, with a conspicuous dashboard switch between:

- `Automatic`: submission automatically queues and runs all enabled safe passive checks, AI explanation if configured, and deterministic correlation. It can also refresh approved threat feeds on a schedule and monitor user-opted-in domains for Certificate Transparency changes.
- `Manual`: submission saves the item but does not start the investigation until the user explicitly presses `Run selected checks` or starts the investigation. Show precisely which checks will run.

Provide a global `Pause automation` switch and per-module controls. Persist each user's preferences in the database when signed in; keep safe defaults for anonymous/local demo sessions. Show scheduled jobs, recent runs, last success, next run, and errors. Use a durable database-backed job queue or a simple reliable worker process, not fragile fire-and-forget background tasks as the only persistence mechanism. Design retries with bounded exponential backoff and idempotency keys.

**Critical distinction:** Automatic mode only automates safe passive checks. Active probing/scanning is off by default and must never be started merely because global automation is enabled. If an active test is ever added, require explicit target authorisation, a verified/allowlisted scope, a separate per-target confirmation, rate limits, and an audit record. The MVP should not need intrusive active scanning.

Never perform an action that changes, submits, pays, logs in to, or interacts with a target website as a user. Never attempt exploitation.

## 6. Security architecture — non-negotiable

The product itself must not become an SSRF proxy, malware launcher, data leak, or source of unsafe claims.

### SSRF and safe URL fetching

Treat every submitted URL, DNS answer, redirect, certificate lookup target, and webpage response as hostile input.

- Allow only `http` and `https`, and normally only ports 80 and 443. Reject unsupported schemes, embedded usernames/passwords, malformed URLs, and unexpected ports unless a deliberate safe policy is documented.
- Resolve A and AAAA records and reject loopback, private, link-local, multicast, reserved, unspecified, documentation, carrier-grade NAT, IPv4-mapped IPv6, cloud metadata, and other non-public/special-use addresses. Handle IPv4 and IPv6 comprehensively.
- Revalidate every redirect destination and every DNS resolution. Defend against DNS rebinding; pin the validated destination address for the connection where feasible, while preserving correct Host/SNI verification.
- Do not trust proxy environment variables automatically. Disable inherited proxies unless explicitly configured and controlled.
- Set strict connect/read/total timeouts, a small redirect limit, response byte limits, request quotas, per-user/IP rate limits, and concurrency limits.
- Prefer HEAD where appropriate, with a tightly bounded safe GET fallback only when needed. Stream and cap data. Do not download files, execute JavaScript, render pages in a browser, submit forms, or follow arbitrary subresources.
- Validate the destination IP at connection time, not only before request construction. Apply network egress restrictions at the hosting layer as an additional defence.
- Avoid logging query strings that may contain tokens or personal data. Redact credentials and sensitive parameters.
- Add unit/integration tests for localhost, private IPv4, private IPv6, link-local, metadata addresses, decimal/octal/hex IP tricks, redirects to private IPs, DNS rebinding simulations, encoded URL tricks, and oversized responses.

### AI and prompt-injection safety

- Webpage content, user messages, email text, threat feeds, and extracted reports are untrusted data, never instructions.
- Separate system instructions from untrusted input. Quote/delimit data, strip active markup where applicable, and never let webpage text alter security policy or tool permissions.
- The model may explain evidence and suggest safe actions; it must not execute tools, browse arbitrary URLs, change scores, override deterministic checks, or mark a threat confirmed.
- Validate model output against a strict Pydantic schema. Reject unexpected fields, unsupported claims, and references to evidence IDs that do not exist.
- Require evidence references for material factual statements. Clearly label AI-generated interpretation vs deterministic observation.
- Redact/minimise message contents and personal data sent to external providers. Make external AI use configurable and disclose it.
- Do not send passwords, OTPs, payment credentials, private keys, seed phrases, OAuth tokens, or secrets to any model or external API.

### Authentication, authorisation, and privacy

- Google OAuth only; no password database. Use secure, HttpOnly, SameSite cookies and appropriate CSRF/state protections. Validate OAuth state and callback URLs.
- Keep anonymous mode rate-limited and limited in history/retention. Users must only access their own investigations and automation settings.
- Enforce ownership checks server-side for every history/report/settings endpoint. Never rely on hidden UI controls for authorisation.
- Minimise personal-data collection; define retention and deletion policies and document them.
- Do not put raw submitted URLs, email/message body, user identity, secrets, or personal information on a public blockchain. Store only a cryptographic digest and non-sensitive protocol metadata.
- No user password/OTP/private-key collection. Do not ask the user to paste secrets into AI chat.

### Operational safety

- No malware execution, exploit execution, vulnerability exploitation, brute forcing, credential testing, or intrusive unauthorised scans.
- Passive checks only for arbitrary public targets. Active checks, if ever added, require separately verified authorisation.
- Do not claim a site is safe because HTTPS works, a certificate is valid, one threat source returns no match, or automated tests pass.
- A blockchain proves the commitment/history of the submitted bytes; it does not prove that the report is true.

Create a threat model with assets, trust boundaries, abuse cases, mitigations, residual risks, and a security testing checklist in `docs/security/`.

## 7. Backend domain model and API contract

Use typed domain models and a versioned API prefix (e.g. `/api/v1`). At minimum design and implement these entities/tables, adapting names as needed:

- `users`: Google provider subject ID, email (only if needed), display name, created/last-seen timestamps, minimal profile data.
- `investigations`: ID, owner or anonymous session reference, input type, encrypted-or-minimised input storage policy, redacted display value, status, risk classification, evidence coverage, ruleset version, AI provider/model/prompt version (when used), timestamps, retention expiry.
- `check_results`: investigation ID, check type, status, severity, evidence JSON, source, source timestamp, explanation, limitations, duration.
- `indicators`: normalised IOC type/value or keyed digest as appropriate, source, first/last seen, confidence, provenance.
- `threat_reports`: report ID, submitter reference, canonical payload version, payload digest, moderation/validation status, dispute/revision history, off-chain evidence references, created timestamp.
- `automation_settings`: owner/session, mode, global pause, enabled modules, schedule, last/next run.
- `job_runs` / `investigation_jobs`: queued/running/succeeded/failed/cancelled state, retries, idempotency, error category, timestamps.
- `audit_events`: security-sensitive changes, report publication, authorisation, automation changes, and moderation decisions; never store secrets.

Implement migrations and seed fixtures. Use indexes and unique constraints where justified. Do not over-normalise or overbuild. Use JSONB only for genuinely variable evidence payloads; keep queryable core fields relational.

Minimum API surface (adjust naming if needed but document the final contract):

- `GET /health` and `GET /ready` (health must not disclose secrets).
- `POST /api/v1/investigations` — submit a URL/domain or message and create an investigation/job.
- `GET /api/v1/investigations/{id}` — status and structured report with ownership checks.
- `GET /api/v1/investigations` — paginated current-user history.
- `POST /api/v1/investigations/{id}/run` — start selected checks in Manual mode.
- `POST /api/v1/messages/analyze` if a separate message endpoint is justified; otherwise use the common investigation pipeline.
- `GET/PATCH /api/v1/automation/settings` — read/update mode and safe checks.
- `POST /api/v1/threat-reports` — submit a threat report with explicit user action.
- `GET /api/v1/threat-reports/{id}` and `POST /api/v1/threat-reports/{id}/verify` — inspect and verify integrity.
- `POST /api/v1/threat-reports/{id}/commit` — create on-chain commitment only when configured and explicitly requested/opted in.

Use consistent error response shapes, request IDs, pagination, validation, timeouts, rate limiting, and API docs. Never expose stack traces or secrets to clients.

## 8. Database and Google OAuth configuration

Neon PostgreSQL is the preferred hosted database. Implement migrations and connection handling suitable for Neon, including pooled connection URL guidance and connection cleanup. Use environment-based configuration and separate local/test/production settings. Never hardcode hostnames, passwords, OAuth client IDs/secrets, API keys, RPC URLs containing secrets, or private keys.

Google OAuth is optional and must be the only interactive login provider. Create `.env.example` with variable names and harmless placeholders only. Include a setup guide describing where the user should place credentials locally and how to configure authorised redirect URLs in the Google Cloud Console. Do not ask the user to paste credentials into this chat or commit them. Ensure browser-exposed variables are explicitly prefixed and contain no secrets.

If the OAuth environment variables are absent:
- Local development should still run in clearly identified demo/anonymous mode.
- Do not silently enable anonymous access in a deployed production environment without explicit configuration.
- The production app must fail closed for private user data if auth is required but misconfigured.

## 9. Web3 threat-report integrity

Implement a small, understandable EVM registry. The chain should record only a report ID and cryptographic digest (plus minimal timestamp/submitter metadata if needed). Keep report content and any user information off-chain.

- Define a versioned canonical report serialization. Prefer a documented canonical JSON scheme (e.g. RFC 8785/JCS) or a rigorously specified stable canonical representation shared by Python and Solidity tooling.
- Compute a cryptographic digest (e.g. SHA-256 or keccak256; choose one and document it consistently).
- Store the digest with an event and an optional minimal on-chain record. Do not store the raw domain, URL, email, message, IP address, evidence body, or personal details.
- Implement independent verification that reloads the report, recomputes the digest, queries the chain, and reports match/mismatch/unavailable. Include the chain ID, contract address, transaction hash, block number, and verification timestamp where available.
- Add contract unit tests, access-control tests, duplicate/report revision behaviour, and verification integration tests using a local chain.
- Public testnet deployment is optional and must be reproducible. Never put a funded wallet private key in source code or `.env.example`. Do not deploy or spend funds without the user's explicit action.

The interface must explicitly explain: “Blockchain verification confirms that the committed report data has not changed; it does not prove that the report's claims are true.”

## 10. Continuous improvement — safely and measurably

The system should improve through a controlled learning and quality loop, **not self-modifying production code**.

Implement:

- Versioned deterministic detection rules, weights, source adapters, prompt templates, and output schemas.
- Recording of the exact rule/prompt/model/source versions used for each investigation so results can be reproduced.
- User feedback controls such as `Helpful`, `False positive`, `Missed threat`, and `Report abuse`. Feedback is untrusted until reviewed/adjudicated.
- A curated evaluation dataset with at least three benign and three suspicious cases for the required demo, plus synthetic edge cases for IDN, redirects, expired certificates, missing sources, and scam messages. Do not use live malware or interact with actual victims.
- An evaluation runner measuring precision, recall, false-positive rate, source availability, coverage, and latency where labels exist. Report dataset limitations; do not pretend synthetic data is representative of the whole Internet.
- A review queue for proposed rule changes. Feedback may suggest changes, but cannot directly change global risk rules or train/deploy a model automatically.
- Scheduled, bounded refresh of approved threat feeds and opted-in CT/domain monitoring; use rate limits, deduplication, retries, retention, and audit logs.
- A dashboard section showing detection-rule version, provider status, source freshness, evaluation date, feedback counts, and automation status.
- A documented release process: tests + evaluation + human review + explicit deployment. No autonomous production code modifications, merges, commits, or deployments.

Continuous improvement must never weaken SSRF protections, authorisation requirements, privacy, evidence thresholds, or safe defaults.

## 11. Professional UI and design system

Build a polished single-page dashboard that looks like a real product, not a tutorial template. Use a coherent neutral palette with one restrained accent, excellent hierarchy, subtle borders, and consistent spacing. Prefer clear text and evidence over decorative charts. Do not use scary red warnings for low-confidence signals. Risk colors must be accessible and paired with text/icons, not color alone.

Deliver:
- Responsive dashboard shell, loading skeletons, empty states, error states, offline/provider-unavailable states, and accessible toast/alert patterns.
- A clear distinction between observed evidence, heuristic indicators, AI interpretation, and unavailable checks.
- Expandable evidence details and source attribution.
- An explanation of what each risk class means and why a result is not a guarantee of safety.
- A small advanced-controls disclosure rather than a dense form by default.
- A demo mode indicator when mocks are being used.
- A privacy notice near input submission explaining how submitted content is handled, subject to the configured retention policy.

Add a basic visual regression/screenshot smoke test if practical. Avoid fake charts, fake ratings, fabricated threat counts, and nonfunctional controls.

## 12. OpenCode project instructions, agents, and reusable skills

This project must remain understandable across OpenCode sessions, providers, and models.

### Root `AGENTS.md`

Create a detailed, practical root `AGENTS.md` containing:
- Product objective and source-of-truth links.
- Exact repository map and subsystem boundaries.
- Supported local setup, environment configuration, and run commands.
- Build/lint/typecheck/test commands, in the correct order.
- Architecture invariants and security boundaries.
- Database migration/seeding procedure.
- API/worker/frontend/contracts development workflow.
- Code conventions, naming, error handling, logging, and testing expectations.
- Explicit instruction: never commit, push, deploy, run destructive DB operations, or use real private keys without the user's explicit action.
- Context handoff requirements and startup protocol.

Keep it concise enough to remain useful but complete enough that a different model can safely continue.

### Specialist OpenCode agents

Create real, non-empty specialist agent definitions under `.opencode/agents/`. Use the installed OpenCode documentation and schema for the actual version; do not guess unsupported configuration keys. Avoid model-specific hardcoding so the user can change models freely. Include at least:

1. `architect.md` — read-first architecture and scope decisions; can write plans/ADRs but must not make broad unreviewed rewrites.
2. `python-backend.md` — FastAPI, domain services, DB and worker implementation.
3. `frontend-ui.md` — Next.js/TypeScript single-page UI, accessibility and API integration.
4. `security-reviewer.md` — read-only review of SSRF, auth, privacy, AI prompt injection, supply chain, and API security. Must not edit files or execute scans against targets.
5. `qa-engineer.md` — test design, regression suite, fixtures, test reports, and CI checks.
6. `smart-contract.md` — Solidity registry, local-chain tests, digest compatibility, and deployment safety.
7. `docs-handoff.md` — maintain architecture, learning guide, project state and model-agnostic handoff files.

Use least privilege. The security reviewer should be read-only. Agents should not run `git commit`, `git push`, production deployment, destructive database commands, or external security tests. The primary build agent may edit files but must still obey the manual commit policy below.

### Reusable skills

Create complete reusable skill files with proper YAML frontmatter (`name`, `description`) and actionable instructions under `.agents/skills/<skill-id>/SKILL.md`. Use OpenCode-supported discovery conventions. Keep skills vendor-neutral so other compatible agents can also use them. Do not create only empty skill names. Each skill must include: when to use it, inputs, safe workflow, required checks, outputs, common failure modes, and links to relevant project docs.

Required skills (create each one):

- `repo-onboarding` — inspect repository, identify stack, read instructions and preserve existing work.
- `python-fastapi-engineering` — FastAPI structure, Pydantic models, dependency injection, async boundaries and API tests.
- `nextjs-typescript-dashboard` — App Router, strict TypeScript, accessible single-page dashboard and frontend tests.
- `secure-url-inspection` — URL parsing, SSRF prevention, redirects, DNS rebinding, response caps and safe networking.
- `phishing-domain-analysis` — IDN/homograph, typosquatting, domain patterns, brand impersonation and false-positive handling.
- `tls-certificate-analysis` — certificate parsing, SAN/hostname, chain, CA trust, algorithms, revocation limitations and CT.
- `threat-intelligence-adapters` — source interfaces, provider terms, rate limits, caching, provenance and outage behaviour.
- `scam-message-analysis` — message parsing, IOC extraction, social-engineering indicators and privacy-safe AI explanations.
- `evidence-risk-engine` — explainable deterministic risk scoring, confidence, coverage and versioned rules.
- `threat-correlation` — deterministic IOC relationships, provenance and AI summarisation boundaries.
- `passive-web-security-assessment` — security headers, HTTPS and safe passive assessment only.
- `neon-postgres-data` — schema, migrations, connection pooling, transaction handling, retention and ownership isolation.
- `google-oauth-security` — Google OAuth, state/CSRF, cookies, callback validation and optional auth mode.
- `solidity-report-attestation` — minimal on-chain digest commitment and independent verification.
- `privacy-secrets-data-retention` — data minimisation, redaction, secret handling, logging and retention.
- `testing-quality-engineering` — Python, frontend, contract, integration, security regression and evaluation tests.
- `accessible-product-ui` — visual hierarchy, accessibility, responsive states and evidence presentation.
- `git-commit-discipline` — explicit feature-scoped commit batches, manual execution only and self-clearing script policy.
- `ai-context-handoff` — maintain persistent project state and export uncommitted work for provider/model switching.
- `global-deployment-operations` — global hosting, environment management, migrations, observability and rollback.

If a skill becomes large, keep supporting checklists and reference docs beside its `SKILL.md` and link to them. Avoid duplicating the same long policy in every skill; point to the root `AGENTS.md` and security docs.

## 13. Model-agnostic persistent memory and safe handoff

Chat history is not the project's source of truth. Any important decision, discovery, limitation, incomplete task, command result, or next step must be written to repository files immediately so a different model/provider can continue without this conversation.

Create and maintain these files:

- `docs/ai/PROJECT_CONTEXT.md` — canonical product purpose, stack, scope, invariants, and terminology.
- `docs/ai/PROJECT_STATUS.md` — current completed/in-progress/blocked work, last verified build state, and exact next action.
- `docs/ai/SESSION_HANDOFF.md` — concise handoff for the next AI agent, including current task, files changed, commands run/results, unresolved problems, and first next command.
- `docs/ai/DECISIONS.md` — dated architecture decision records with context, decision, alternatives, consequences, and status.
- `docs/ai/IMPLEMENTATION_PLAN.md` — phased task list with stable IDs and `not_started / in_progress / blocked / done` status.
- `docs/ai/TEST_STATUS.md` — last known test/build/lint/typecheck status with timestamps and exact commands.
- `docs/ai/SECURITY_BOUNDARIES.md` — concise non-negotiable security rules and threat model pointers.
- `docs/ai/API_CONTRACT.md` — current endpoints, schemas, auth rules, and error conventions.
- `docs/ai/ENVIRONMENT.md` — variable names, purpose, required/optional flags, and configuration status only; never values or secrets.
- `docs/ai/LEARNING_GUIDE.md` — beginner-friendly explanation of architecture, how to run/debug/test each layer, glossary, and links to code.
- `docs/ai/NEXT_ACTIONS.md` — ordered list of the next 3–10 concrete tasks.
- `docs/career/CAREER_ALIGNMENT.md` — honest skill evidence and resume mapping; mark missing resume information clearly.

### Mandatory agent startup protocol

At the start of every session, regardless of provider/model:
1. Read root `AGENTS.md` and relevant nested instructions.
2. Read `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `SESSION_HANDOFF.md`, `IMPLEMENTATION_PLAN.md`, `NEXT_ACTIONS.md`, and relevant ADRs.
3. Inspect `git status --short`, current branch, recent commits, staged diff, unstaged diff, and untracked files. Do not discard or overwrite the user's changes.
4. Inspect the relevant source/tests before editing.
5. State a concise understanding of the current state and next action, then proceed.

### Mandatory agent shutdown / handoff protocol

Before ending a work session, switching model/provider, or finishing a major phase:
1. Update all relevant context files with truthful current state.
2. Record commands actually run and their actual pass/fail status; distinguish not-run from passed.
3. List exact modified, added, deleted, and untracked paths.
4. Record any uncommitted work, staged work, known risks, and next steps.
5. Run the handoff exporter described below when possible. Never include secrets in a handoff archive.
6. Never summarise an untested feature as complete.

### Portable uncommitted-work exporter

Implement `scripts/create_handoff.py` and document its use. It must create a local export under `.handoff/` containing:
- Current branch and Git status.
- Binary-safe patch for tracked staged/unstaged changes relative to `HEAD`.
- Copies of safe untracked source/docs/config/test files, preserving relative paths.
- Copies of current AI context/handoff documents.
- A manifest containing file names, sizes, hashes, timestamp, and skipped-file reasons.
- A concise handoff summary with next steps.

Exclude `.git`, `node_modules`, `.next`, `dist`, build outputs, caches, virtual environments, test artifacts, logs, database dumps, `.env*`, private keys, certificates containing private keys, wallet files, credentials, tokens, and likely secret-bearing files. Detect and skip suspicious secret files; do not copy them. The exporter must not modify the worktree, stage files, commit, push, or delete anything. Add `.handoff/` to `.gitignore`. Explain how to carry the archive to another machine/provider and how to inspect/apply the patch safely. Do not automatically apply a handoff archive over existing work.

The source workspace remains the canonical copy. The handoff archive is a safety/portability aid, not a replacement for Git or a secret backup.

## 14. Git, security hygiene, and the unusual `commit.js` requirement

Create a comprehensive `.gitignore` for Node/Next.js, Python, virtual environments, IDE/OS files, logs, test output, coverage, build artefacts, local databases, `.env*`, secrets, private keys/wallets, `.handoff/`, and generated files. Add safe exceptions so `.env.example` is tracked. Add `.dockerignore` where relevant. Include a secret-scanning step (e.g. Gitleaks or a currently maintained equivalent) in CI. Keep dependencies locked and review dependency advisories.

### Manual-only commit policy

- The AI must **never** run `git commit`, `git push`, amend, rebase, reset, force push, or rewrite history on its own.
- The AI must not stage the entire repository blindly (`git add .` or `git add -A`).
- Prepare coherent, feature-scoped commit batches only after the feature is implemented and verified.
- Every commit batch must have a conventional, descriptive message and an explicit allowlist of paths belonging to that feature.
- Do not mix unrelated features into one commit. Do not commit secrets, `.env` files, build outputs, handoff archives, test databases, or generated files.
- Preserve any pre-existing user-staged changes. If the index is already staged before the script runs, stop and explain; never mix user staging with planned commits.
- Do not invent a commit for incomplete/unverified work.

### Exact requested command: `bash commit.js`

Create a file named **`commit.js`**. Because the user explicitly wants to execute it as `bash commit.js`, this file must intentionally be a **Bash script despite its `.js` extension**. State that clearly in its opening comments and README; do not write JavaScript syntax that Bash cannot run. The user must run exactly:

```bash
bash commit.js
```

The script must:
1. Check that it is running at the Git repository root and that Git is available.
2. Check for an existing staged index; if user changes are already staged, abort safely without modifying the index.
3. Contain an explicit, ordered list of feature commit batches. Each batch has one conventional commit message and an explicit list of file paths for that feature. No wildcard-all or repository-wide add.
4. For each batch, stage only the listed existing paths, verify there is a staged diff, print the proposed message and paths, and commit that batch. Skip an empty batch safely. Stop on the first error and preserve the remaining commit plan for inspection/retry.
5. Never push, amend, force, reset, delete user work, run migrations, deploy, or execute project code as part of committing.
6. Only after **all** planned batches have completed successfully (or safely skipped because empty), overwrite its own contents with only its small initial comment/header stating that the script is empty and ready for the next planned batch. Keep the file name. This self-clearing behavior must not happen after a failed/partial run.
7. Leave the worktree's unrelated uncommitted files untouched. Do not include `commit.js` in a commit batch.
8. Make it obvious that running the command performs real commits. Since this is the user's manual command, no additional AI confirmation is needed, but the script must print the exact operations before each commit.

After new features are implemented and tested, the AI may populate `commit.js` with new, explicit feature batches, but must never execute it. If changes within one file cannot be cleanly separated by path, do not pretend path staging separates the features; keep them in one coherent commit or provide a carefully reviewed interactive staging procedure.

Use conventional commit messages, e.g. `feat(api): add safe URL investigation`, `feat(ui): add evidence report dashboard`, `test(security): cover SSRF redirect protections`, `docs: add model-agnostic handoff guide`. These are examples only; derive actual messages and paths from actual completed work.

## 15. Tests, CI, observability, and quality gates

Create a test strategy and implement it as code, not merely a document.

### Backend
- Unit tests for URL normalisation, IDN/punycode, domain heuristics, redirect decisions, IP safety, TLS parsing, message IOC extraction, risk scoring, correlation, canonical report hashing, and retention/redaction.
- Mock external providers and network calls by default. Live external tests must be opt-in and clearly labelled.
- Security regression tests for SSRF and prompt injection.
- Integration tests for API, persistence, ownership checks, job retries/idempotency, and provider outage behaviour.

### Frontend
- Component tests for input validation, automation/manual mode, pause state, risk labels, unavailable sources, evidence expansion, and auth states.
- Playwright smoke flow: submit a benign fixture, submit a suspicious fixture, inspect evidence, switch Automatic/Manual, and inspect history.

### Smart contracts
- Local chain tests for digest storage, event correctness, access control, duplicate IDs/revisions and independent verification.

### Required demonstration dataset
- At least three benign and three suspicious cases, with expected findings and limitations documented. Use synthetic safe fixtures and/or documented harmless test data. Never visit or execute actual malicious payloads for demo testing.

### Quality gates

Before marking a phase complete, run the relevant commands and record exact output/status:
- Backend formatting/lint/type checks and `pytest`.
- Frontend lint, `tsc --noEmit`, unit tests, and build.
- Contract tests.
- Migration check and API integration tests.
- Security regression checks.
- Full CI-equivalent test command.

Add GitHub Actions (or equivalent) to run backend, frontend, contract tests, and secret scanning on pull requests. No deployment from a pull request without an explicit configured release policy.

Use structured logs with request/investigation IDs, safe redaction, sensible log levels, and no secrets or raw sensitive message content. Add `/health` and `/ready` checks and document operational monitoring. Do not add analytics that track users unnecessarily.

## 16. Global deployment and operations

The service must be reachable over HTTPS by users worldwide. Design for global use:
- Store timestamps in UTC; display localised time in the browser.
- Support IDN domains and IPv4/IPv6 safely.
- Keep API stateless apart from database-backed state/jobs.
- Configure explicit CORS origins, secure cookies, rate limits, request size limits, and per-provider timeouts.
- Use environment variables / secret manager; never commit credentials.
- Separate development, preview, and production environments and databases.
- Provide Dockerfiles or reproducible deploy configurations, release/migration steps, rollback notes, and a deployment checklist.
- Add bounded caching for external intelligence with source timestamps and staleness labels.
- Make provider failures visible rather than silently assuming no threat.
- Design regional deployment as a future option; do not overcomplicate the MVP with multi-region writes.

Do not deploy, create paid resources, register domains, create OAuth applications, or spend testnet/mainnet funds without explicit user permission. Prepare the deployment guide and verify the build locally first.

## 17. Beginner-friendly documentation and job-readiness deliverables

Create a professional README with: product pitch, problem, screenshots placeholder, architecture diagram, feature list, stack, prerequisites, local setup, env configuration, run commands, tests, demo workflow, API docs, security limitations, deployment, roadmap, and contribution workflow.

Create a learning guide that explains:
- How a request moves from the Next.js dashboard to FastAPI, database/job queue, analysis modules, and back to the UI.
- How Python URL parsing, DNS, TLS, threat intelligence, scoring and evidence work.
- How the model is used and what it is forbidden to decide.
- How Postgres/Neon and Google OAuth work.
- How report hashing and blockchain verification work.
- How to run and debug every service.
- What to say in a technical interview, what trade-offs were made, and what the product cannot prove.

Create portfolio materials based only on implemented/tested facts:
- `docs/career/PROJECT_WALKTHROUGH.md` — a 5–10 minute demo script.
- `docs/career/INTERVIEW_PREP.md` — likely interview questions and honest answers about architecture, Python, Next.js, database, security, AI and Web3.
- `docs/career/RESUME_BULLETS_DRAFT.md` — bullet templates with placeholders for verified metrics; do not invent numbers or claim unbuilt features.
- `docs/career/CAREER_ALIGNMENT.md` — after reading a real resume if present, map proven prior skills to project evidence and identify gaps. If no resume is present, state this plainly and leave tailored sections as TODO.

## 18. Execution plan — work from foundations to finished product

Follow these phases in order. Maintain task IDs and update `docs/ai/IMPLEMENTATION_PLAN.md` and `PROJECT_STATUS.md` as you go. You may parallelise independent review/design/test tasks via specialist agents, but do not let parallel agents overwrite each other's work. Integrate and verify every result.

### Phase 0 — Reconnaissance and source preservation
- Inspect repo, Git state, files, the separately supplied SRS Markdown file, and resume presence.
- Copy the supplied SRS to `docs/source/SRS.md` exactly, preserving all content and formatting.
- Create and maintain `docs/source/SRS_TRACEABILITY.md`; do not inspect screenshots or perform OCR.
- Record current state and pre-existing user changes.
- Write a concise architecture proposal and task plan before major code changes.

### Phase 1 — Engineering skeleton and AI continuity
- Create/repair monorepo structure and package manager setup.
- Add root `AGENTS.md`, specialist agents, all required reusable skills, context files, `.gitignore`, `.dockerignore`, `.env.example`, and CI skeleton.
- Implement `scripts/create_handoff.py` and test that secrets are excluded and untracked files are captured.
- Implement `commit.js` with no commit batches initially; test its validation/dry-run logic without creating commits. Never run actual commits.
- Make the simplest frontend, backend, worker and database health paths run.

### Phase 2 — Database and API foundation
- Implement environment/config validation, SQL schema, Alembic migrations, repositories, ownership abstraction, health/readiness, API error contracts and request IDs.
- Add anonymous demo mode with rate limits and optional Google OAuth integration scaffolding.
- Add DB-backed jobs with safe state transitions and idempotency.

### Phase 3 — URL/domain investigation vertical slice
- Implement strict input validation and normalisation.
- Implement SSRF-safe resolver/fetcher and redirect analysis.
- Implement IDN/homograph and domain heuristics with clear confidence/limitations.
- Implement DNS metadata and first threat-intelligence adapter with real provider provenance and mocked tests.
- Return structured findings and a working risk classification.
- Demonstrate benign and suspicious fixtures end-to-end.

### Phase 4 — TLS and digital trust
- Implement certificate handshake/chain parsing, expiry, SAN/hostname, trust, algorithm/key details, and documented revocation/CT availability.
- Add CT source integration and known CA distrust data where reliable.
- Clearly distinguish misconfiguration from evidence of CA compromise.
- Include an eMudhra-like scenario only as intelligence-based detection of certificates associated with known compromised/distrusted CAs. Do not claim to infer a CA's private key-generation defect from a URL.

### Phase 5 — Passive website security assessment
- Check HTTPS, key security headers, redirect policy, mixed content where detectable, and public version disclosures only where reliable.
- Include severity, evidence, impact, remediation and limitations.
- Ensure arbitrary targets receive passive inspection only.

### Phase 6 — Scam/message analysis and threat correlation
- Build deterministic IOC extraction and social-engineering indicators.
- Add AI provider adapter with strict structured output and safe redaction.
- Correlate repeated domains, infrastructure and message similarities using deterministic IDs/evidence.
- AI may summarise relationships, not create them without evidence.

### Phase 7 — Risk report and dashboard
- Build the single-page responsive dashboard and integrate the complete investigation API.
- Implement all risk labels, evidence/limitations/source details, history, errors, empty states, manual/automatic controls and pause control.
- Make every visible control functional; no dead buttons or mocked claims in production mode.

### Phase 8 — Automation and continuous improvement
- Implement persistent user automation settings, durable jobs, retries, schedules and per-module safe toggles.
- Implement versioned rules, feedback collection/moderation, evaluation dataset/runner, metrics and source freshness.
- Ensure nothing self-modifies, auto-commits, auto-merges, or auto-deploys.

### Phase 9 — Web3 integrity
- Implement Solidity registry, canonical report digest and off-chain/on-chain boundary.
- Test on a local chain and provide repeatable verification.
- Add optional testnet deployment instructions, but do not deploy or use real funds without approval.

### Phase 10 — Hardening and deployment readiness
- Run the complete security, unit, integration, UI, contract and build suites.
- Add CI and secret scanning.
- Review CORS, OAuth, cookies, ownership, rate limits, SSRF, AI prompt injection, log redaction, migrations and data retention.
- Prepare global deployment guide, env checklist, health checks and rollback plan.
- Do not deploy or create paid resources without permission.

### Phase 11 — Portfolio and handoff finish
- Complete README, architecture diagram, learning guide, test report, demo script, interview preparation and honest resume alignment.
- Export an uncommitted handoff archive and update all AI context docs.
- Prepare feature-scoped commit batches in `commit.js`, but do not run it.
- Report exactly what works, what was tested, what is unavailable without credentials, and the next best steps.

## 19. Definition of done / acceptance checklist

The MVP is not complete until all applicable items below are true:

- [ ] A user can submit a URL/domain and receive a structured investigation report.
- [ ] A user can submit a suspicious message/email and receive an evidence-based analysis.
- [ ] URL normalisation, IDN/homograph indicators, redirect chain, DNS, and at least one real threat-intelligence adapter are implemented.
- [ ] TLS certificate details and relevant trust issues are inspected for HTTPS targets.
- [ ] Passive security-header/HTTPS checks return evidence and remediation.
- [ ] The risk engine uses exactly the five required classifications and does not equate no known matches with safety.
- [ ] Each result exposes sources, timestamps, evidence coverage, confidence/limitations, and precautions.
- [ ] AI output is validated, evidence-bound, and cannot set the final risk class.
- [ ] There are at least three benign and three suspicious documented test cases.
- [ ] The single-page dashboard is polished, responsive, accessible, and has no inert controls.
- [ ] Automatic/Manual modes and Pause automation work; active testing is separately gated and off by default.
- [ ] User data and reports are isolated by owner; Google OAuth is optional and uses only Google if configured.
- [ ] Neon/Postgres migrations are reproducible.
- [ ] A report can be hashed, committed on a local EVM chain, and independently verified; sensitive data is not on-chain.
- [ ] SSRF, redirect, DNS, prompt injection, privacy and auth regression tests exist.
- [ ] Frontend, backend, worker and contracts have documented run/test commands.
- [ ] README, architecture, security, test, learning, and AI handoff documents are maintained.
- [ ] `.gitignore`, `.env.example`, secret scanning, specialist agents and skills exist.
- [ ] `bash commit.js` is prepared for manual, explicit feature commits and self-clears after a successful run; the AI has not run it.
- [ ] No secrets, real private keys, user data, or sensitive report content are committed or placed on-chain.
- [ ] The project is globally deployable over HTTPS once the user supplies credentials and explicitly authorises deployment.

## 20. How to work with the user

The user is learning and expects step-by-step progress. For each phase:
- Explain what is being built and why in 2–5 concise sentences.
- Implement it, do not only describe it.
- Show exact commands to run and actual test outcomes.
- Point to the important files and explain what to study.
- Update persistent context files before moving on.
- Keep a short “Completed / Verified / Not yet done / Next” summary.

Do not overwhelm the user with a huge questionnaire. Do not request credentials in chat. Do not claim perfection or “100% secure”; describe residual risk honestly. Do not stop at a plan: begin Phase 0 immediately, then continue with the highest-priority implementation work possible in the current session.
