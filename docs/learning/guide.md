# Learning and interview guide

## The one-paragraph explanation

TrustLens investigates untrusted links and messages without becoming an attack tool. It normalises input, fetches public pages behind layered SSRF defences, gathers DNS/TLS/header/reputation evidence, and runs a versioned deterministic risk engine. An optional AI layer explains the evidence but cannot change the verdict. Reports are canonicalised to SHA-256 and can be anchored in a Solidity registry so anyone can check that the report bytes have not changed.

## Concepts to be able to explain

### SSRF

Server-Side Request Forgery tricks a server into fetching internal resources. Defences here: allow only HTTP(S) on 80/443; reject embedded credentials; resolve DNS and reject private/special-use IPs; pin the validated IP for the connection; revalidate every redirect; cap redirects, time and response size. DNS rebinding is addressed by validating every answer and using the validated address.

### Deterministic vs probabilistic decisions

Security verdicts must be reproducible and auditable. The risk engine is a pure function of findings and coverage, with a version string. AI is probabilistic, so it is restricted to prose and citations. This is a deliberate trust boundary, not a lack of ambition.

### Evidence coverage and Inconclusive

`Low Risk` is not `safe`. If checks could not run, the product says so. Coverage below 0.5, or degraded sources with coverage below 0.75, produce `Inconclusive`. This avoids the dangerous failure mode where an outage looks like a clean scan.

### Canonical JSON

Hashing JSON requires deterministic bytes. TrustLens normalises Unicode (NFC), sorts keys, removes whitespace, rounds floats to four decimals and hashes UTF-8 with SHA-256. The report reference is `bytes32(sha256("trustlens.report/v1:{id}:v{version}"))`. Without canonicalisation, key order or float formatting would change the digest.

### Durable jobs

Jobs are rows, not in-memory tasks. Claiming uses a transaction and a lease. PostgreSQL uses `SELECT … FOR UPDATE SKIP LOCKED`; SQLite uses an optimistic conditional update. Retries use bounded exponential backoff. Expired leases are recovered. This survives process restarts and prevents double processing.

### TLS trust

The client verifies the chain with certifi roots and checks the hostname/SAN. It reports validity, algorithms, key sizes and chain details. It does not claim revocation completeness or that a valid certificate means the site is trustworthy. The dashboard itself is served over HTTPS in production.

### AI grounding

The provider receives structured evidence, not raw instructions. Output must satisfy a schema and cite evidence IDs that exist in this investigation. Unknown citations trigger fallback. The model has no tools and cannot mutate the risk class.

### Report integrity vs truth

A blockchain commitment proves the report existed in a particular form. It does not prove the investigation's conclusions are correct. The UI states this explicitly. Only the digest and reference go on-chain.

## Design decisions and trade-offs

| Decision | Why | Cost |
| --- | --- | --- |
| SQLite default, PostgreSQL supported | Zero-setup local runnable demo | Some dialect-specific code for job claiming |
| One API + worker process | Fits Render free tier; simpler ops | Worker competes with API for resources; sleeps with the service |
| Deterministic risk, AI explanation | Auditability and safety | Less “AI magic”; rules require maintenance |
| Passive-only checks | Safe to point at hostile input | No JS rendering, no authenticated pages, limited coverage |
| No Docker/Redis/K8s | Reviewers can run it quickly | Less production-like scaling |
| Owner-only local registry | Simple, auditable integrity demo | No decentralised governance or public verifier UI |

## Questions to expect

1. **How do you stop SSRF?** Walk through scheme/port/credential checks, DNS resolution, private-range rejection, IP pinning, redirect revalidation and size/time caps.
2. **Why can't AI decide risk?** Reproducibility, prompt injection, hallucinated citations, accountability. Show the validation/fallback tests.
3. **What happens when URLhaus is down?** The check is marked unavailable; coverage drops; the result may be Inconclusive. Missing data is not a clean result.
4. **How do you prevent duplicate jobs?** Idempotency keys + transactional claim + lease + status checks.
5. **How is the report digest reproducible?** Canonical JSON rules, stored schema version, independent recomputation, contract read.
6. **What does the blockchain prove?** Integrity of the committed digest, not truthfulness or identity.
7. **How is privacy handled?** Redaction, masked reports, retention, no raw messages on-chain, no payload logging.
8. **What would you build next?** Shared rate limiter, egress proxy, Playwright flows, graph visualisation for correlations, revocation checks, dedicated worker, observability.

## Exercises

- Add a new deterministic rule with a boundary test and a ruleset version bump.
- Add a header rule and a unit test; verify it affects coverage/score correctly.
- Reproduce the digest in a standalone script from an exported report.
- Break the AI citation set and confirm the fallback path.
- Kill the worker mid-job and confirm lease recovery.
