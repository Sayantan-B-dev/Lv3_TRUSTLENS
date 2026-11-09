---
name: ssrf-safe-fetching
description: Use when touching URL fetching, DNS resolution, redirects, proxies, ports or network timeouts.
---

# SSRF-safe fetching

Primary files: `security/netguard.py`, `intelligence/http_probe.py`, `intelligence/normalize.py`, `intelligence/dns.py`.

Mandatory controls:

- Accept only `http` and `https`; reject `file:`, `javascript:`, FTP and other schemes.
- Only ports 80/443 (`ALLOWED_PORTS`); mark other ports and never connect.
- Reject URLs with embedded credentials; analyse but do not fetch.
- Resolve every hostname; reject any private, loopback, link-local, multicast, documentation, CGNAT or IPv6 unique-local answer.
- Pin the validated IP for the actual connection. Revalidate on every redirect (max 5).
- Bound connect/read time and body size (64 KiB default). Do not execute JS or download files.
- Use the shared TLS context; never `verify=False`.
- Return unavailable/error outcomes instead of inventing clean results.

Tests to extend in `tests/test_netguard_normalize.py`:

- obfuscated IP forms, mixed public/private DNS answers, IPv4-mapped IPv6, redirect-to-private, credentials, unusual ports.

Do not add a “test mode” bypass to production paths.
