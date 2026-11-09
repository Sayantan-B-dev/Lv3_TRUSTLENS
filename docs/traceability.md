# Requirements traceability

Source: [`srs.md`](../srs.md), preserved verbatim at [`docs/source/SRS.md`](source/SRS.md). This matrix maps the SRS modules and mandatory constraints to implementation and verification. “Partial” means the capability exists but has an explicit technical or environmental limitation documented below.

## Functional modules

| SRS module | Implementation | Verification |
| --- | --- | --- |
| 1. URL and website analysis: normalisation, validation, safe fetch, DNS, redirects, homographs, typosquatting, reputation, risk | `intelligence/normalize.py`, `security/netguard.py`, `intelligence/http_probe.py`, `intelligence/dns.py`, `intelligence/domain.py`, `intelligence/threat_intel.py`, `intelligence/pipeline.py` | `tests/test_netguard_normalize.py`, `tests/test_domain_messages.py`, `tests/test_api_pipeline.py` (benign + SSRF) |
| 2. TLS certificate and web trust: handshake, chain, SAN/hostname, validity, algorithms, key strength, CT, distrusted CAs, revocation honesty | `intelligence/tls.py`, `security/tlsctx.py`, `intelligence/threat_intel.py` (crt.sh), pipeline `tls` / `ct` checks | Live smoke against `example.com` (trusted chain); API pipeline test uses a labelled synthetic TLS fixture. Revocation is not claimed. |
| 3. AI scam/message analysis: URL/domain/IP/email extraction, social-engineering heuristics, AI classification, deterministic fallback | `intelligence/messages.py`, `intelligence/normalize.py` (`extract_urls`), `ai/*`, pipeline message branch | `tests/test_domain_messages.py`, `tests/test_worker_ai.py`, `tests/test_api_pipeline.py::test_message_analysis_flags_social_engineering` |
| 4. Threat correlation: IOCs, relationships, repeated infrastructure | `intelligence/correlation.py`, `models.Indicator` / `IOCRelationship`, `API /investigations/{id}` indicators | Correlation check runs in every completed pipeline; correlation is evidence-only and never authoritative. No dedicated multi-investigation unit test — see limitation. |
| 5. Website security assessment: HTTPS, headers, redirects, mixed content, configuration findings | `intelligence/headers.py`, fetch redirect chain in `http_probe.py`, pipeline `headers` check | Covered through the API pipeline fixture; header rules are unit-verifiable via `analyse_headers` but not separately tested. |
| 6. Decentralised threat intelligence: canonical JSON, SHA-256, Solidity registry, local deployment, independent digest verification | `security/canonical.py`, `services/reports.py`, `services/chain.py`, `api/reports.py`, `contracts/ReportRegistry.sol` | `tests/test_risk_canonical.py`, `tests/test_api_pipeline.py::test_report_integrity_and_local_verification`, 8 Hardhat tests, live local commit + verify (`verified`) |

## Risk, AI and UX requirements

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Exactly five classifications, consistent across API/UI | `intelligence/risk.py`, `lib/types.ts`, risk panel, `/meta` | `tests/test_risk_canonical.py::test_all_five_classifications_are_declared`, API meta test |
| AI cannot assign/override risk | Pipeline computes `RiskAssessment` first; `ai/explain.py` receives it read-only; UI renders server risk | `tests/test_worker_ai.py` (valid + invalid AI output leaves risk unchanged) |
| Structured AI output + evidence grounding + prompt injection defence | `ai/schema.py`, `ai/provider.py`, `ai/explain.py` | AI tests: unknown evidence triggers fallback; valid evidence accepted |
| Deterministic fallback without credentials | `AI_PROVIDER=auto/none` → deterministic explainer | API pipeline asserts `deterministic-fallback` and `ai_used=False` |
| Single-page dashboard with working controls | `apps/web/components/Dashboard.tsx` and panels; real API client | Vitest formatting tests, `tsc --noEmit`, production build; interactive controls are wired to endpoints (manual checklist) |
| Responsive, restrained visual design + purposeful anime.js motion | `app/globals.css`, components, anime.js in `ScanState` / risk transitions | Production build; visual review is a manual step |
| Investigation history + persistence | `Investigation`, history endpoint, `History.tsx` | API tests for history/delete/ownership |
| Automation automatic/manual + pause/resume | `AutomationSetting`, `/automation`, submit logic | API tests for manual draft, automatic queue, pause behaviour, persisted settings |
| Report export | `GET /investigations/{id}/export` | API export test |
| Feedback capture | `Feedback` model + endpoint | API feedback test |

## Security and privacy requirements

| Requirement | Implementation | Verification |
| --- | --- | --- |
| SSRF-safe inspection | `security/netguard.py`, `http_probe.py` | 13 private/special IP cases, mixed DNS answers, loopback fetch, credentials, ports, schemes |
| DNS pinning / rebinding protection | `resolve_public` per connection, pinned IP, revalidation on each redirect | DNS rebinding and mixed-answer tests |
| Redirect revalidation | `http_probe.follow` re-normalises and re-resolves every hop; max 5 | Pipeline SSRF test confirms private target is never fetched; redirect logic reviewed |
| Passive only; no exploitation | No payload/exploit code; GET only; bounded body; no JS execution | Code review; API test uses synthetic responses |
| TLS verification never disabled | Shared `certifi` context in `security/tlsctx.py` | Live trusted handshake smoke; no `verify=False` in code |
| Redaction and privacy | `security/redaction.py`, report masking, retention fields and expiry | Message redaction assertion; report payload assertion |
| Secrets optional and never committed | `config.py` defaults; `.env.example` only; `.gitignore` | Repository inspection; no secret values in docs |
| Ownership isolation | Principal dependency + `owned_investigation` / `_owned_report` | Cross-session 404 test |
| Rate limiting | `security/ratelimit.py`; per-instance limits | Not load-tested; documented as per-instance |
| Durable jobs and recovery | `services/jobs.py`, `worker/runner.py` | Retry backoff, expired lease recovery, max-attempt failure tests |

## Mandatory MVP and deliverables

| Item | Status |
| --- | --- |
| Working URL/domain investigation | Implemented and tested |
| TLS and certificate intelligence | Implemented; live smoke passed, automated coverage uses fixture |
| Message/IOC analysis | Implemented and tested |
| AI analysis with fallback | Implemented and tested |
| Risk engine with five classes | Implemented and tested |
| Next.js dashboard | Implemented; build/typecheck/tests pass |
| Reports and blockchain verification | Implemented; local commit/verify passed |
| Database persistence and migrations | Implemented; initial Alembic migration applied in smoke checks |
| Tests | 66 backend, 5 frontend, 8 contract tests pass |
| Documentation | This docs tree, README, SRS copy, AGENTS.md |
| Reproducible demo | [`docs/demo.md`](demo.md) |
| Fixtures / evaluation data | [`docs/evaluation/fixtures.json`](evaluation/fixtures.json) |

## Known gaps and honest limitations

1. **Correlation depth:** IOCs and relationships are extracted and surfaced, but there is no graph database or multi-tenant graph visualisation. Correlation is limited to stored indicators and shared infrastructure signals.
2. **TLS/CT completeness:** crt.sh is rate-limited and can be unavailable; revocation is not asserted. Certificate analysis reflects the observed chain, not a guarantee of operator intent.
3. **Header checks:** only the final response is inspected; proxy/CDN protections can be invisible.
4. **AI:** optional, evidence-bound and explain-only. It can be unavailable without affecting the deterministic result.
5. **Rate limiting:** in-process, per instance. Multi-instance deployments need a shared limiter.
6. **Blockchain:** local Hardhat validation only; no testnet deployment was performed (requires explicit approval and funds). Integrity ≠ truth.
7. **Frontend tests:** Vitest covers formatting helpers; one optional Playwright smoke flow covers the real message → report → verify path. It is not exhaustive visual/interaction coverage and is not part of CI.
8. **Free-tier hosting:** not deployed by the agent; configuration and caveats are documented.
