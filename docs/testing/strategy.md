# Testing strategy

## What is automated

| Suite | Command | Scope |
| --- | --- | --- |
| Backend (66 tests) | `cd services/backend && ./.venv/Scripts/python.exe -m pytest` | SSRF/netguard, URL normalisation, domain heuristics, message IOC extraction, risk boundaries, canonical digests, API ownership, automation, reports, SSRF pipeline behaviour, worker retries/leases, AI validation/fallback |
| Frontend unit (5 tests) | `pnpm --dir apps/web test` | Formatting/display helpers |
| Frontend typecheck | `pnpm --dir apps/web typecheck` | Strict TypeScript across components and API types |
| Frontend production build | `pnpm --dir apps/web build` | Next.js/Turbopack compilation, route generation |
| Contracts (8 tests) | `pnpm --dir contracts test` | Storage, events, metadata, duplicate rejection, zero digest, owner-only, ownership transfer, missing reference |
| Browser smoke (1 flow) | `pnpm --dir apps/web test:e2e` | Message investigation, deterministic risk render, report creation and local digest verification through the real UI |

Backend tests use SQLite and stub DNS/HTTP/TLS for deterministic API runs. They never contact the public internet.

## Important backend cases

- Private, link-local, multicast, documentation, IPv6 unique-local and IPv4-mapped addresses are rejected.
- Decimal/octal/hex IP obfuscation is detected.
- Mixed public+private DNS answers are rejected.
- Embedded credentials and non-80/443 ports are not fetched.
- Homograph, typosquatting, brand impersonation and shortener heuristics produce findings without claiming proof.
- Message analysis extracts URLs/emails, detects urgency/credential/payment/secrecy/remote-access patterns, and redacts emails.
- Risk boundaries: authoritative => Confirmed; two significant => High; one significant => Suspicious; clean full coverage => Low; insufficient coverage/degraded => Inconclusive.
- Canonical digests are order-independent and content-sensitive; report refs are bytes32.
- A manual submission is a draft; automatic queues; paused automation saves without queueing.
- One browser session cannot read, run or delete another session's investigation (404).
- Oversized/invalid input returns the structured 422 error contract.
- Report creation is idempotent for an uncommitted report; local verification is digest-consistent when chain is unconfigured.
- Failed jobs requeue with backoff and reset the investigation; expired leases recover or fail after max attempts.
- AI output citing unknown evidence is rejected; valid evidence is accepted; risk never changes.

## Deterministic network fixtures

`tests/conftest.py` monkeypatches the pipeline's `follow`, `analyse_dns` and `analyse_tls` with labelled synthetic results. This keeps tests fast and offline while exercising real serialisation and persistence. It does not claim that live network behaviour is tested; live smoke tests are separate.

## Manual / smoke checks performed

- Live Next.js proxy flow: anonymous session, automatic queued message investigation (`High Risk`), report digest verification, feedback, automation persistence.
- `https://example.com` → `Low Risk`, all applicable checks complete, coverage 1.0, deterministic AI fallback.
- SSRF target `http://127.0.0.1/admin` → never fetched, not `Low Risk`.
- Report create → local digest verification with chain unavailable.
- Local Hardhat: deploy registry, commit a real report, verify `verified` with matching digest and report status `verified`.
- TLS verification against a real public site using certifi roots (this Windows machine's system store lacks a root that certifi includes).

## What is not covered

- The Playwright flow is a single smoke path, not exhaustive interaction or visual-regression coverage; it requires local Chrome and running services.
- Live URLhaus/crt.sh/OpenAI integrations (external, rate-limited, credential-dependent).
- Load/performance testing and multi-instance rate limiting.
- Penetration testing or exploitation (out of scope by design).
- Visual regression/screenshot comparison.

## Adding tests

- Prefer unit tests for pure logic (`normalize`, `domain`, `messages`, `risk`, `canonical`).
- For API tests, use the `client` and `stub_network` fixtures; never call the public internet.
- Any new rule must include a boundary test and a version bump if it changes classification behaviour.
- Any new SSRF bypass shape belongs in `test_netguard_normalize.py`.
- Do not weaken assertions or skip tests to make a change pass; document a genuine environment limitation instead.
