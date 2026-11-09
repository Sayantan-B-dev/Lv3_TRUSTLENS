from __future__ import annotations

import os
import pathlib
import sys

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DB = BACKEND_DIR / "test_trustlens.db"
for suffix in ("", "-wal", "-shm"):
    candidate = pathlib.Path(str(TEST_DB) + suffix)
    if candidate.exists():
        candidate.unlink()

os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{TEST_DB.as_posix()}"
os.environ["WORKER_ENABLED"] = "false"
os.environ["AUTO_CREATE_SCHEMA"] = "true"
os.environ["AI_PROVIDER"] = "deterministic"
os.environ["THREAT_INTEL_ENABLED"] = "false"
os.environ["CT_LOOKUP_ENABLED"] = "false"
os.environ["SESSION_SECRET"] = "test-session-secret-not-for-production"
os.environ["COOKIE_SECURE"] = "false"
os.environ["ALLOW_PRIVATE_TARGETS_FOR_TESTS"] = "false"
os.environ["CHAIN_CONTRACT_ADDRESS"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from trustlens.config import get_settings  # noqa: E402

get_settings.cache_clear()

from trustlens.db import Base, SessionLocal, engine  # noqa: E402
from trustlens.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db():
    with SessionLocal() as session:
        yield session


@pytest.fixture()
def stub_network(monkeypatch):
    """Deterministic replacements for DNS, HTTP and TLS network calls."""
    from trustlens.intelligence import pipeline
    from trustlens.intelligence.http_probe import FetchResult

    def fake_follow(url: str, settings):
        return FetchResult(
            url=url,
            final_url=url,
            status=200,
            headers={
                "content-type": "text/html; charset=utf-8",
                "strict-transport-security": "max-age=31536000; includeSubDomains",
                "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
                "x-content-type-options": "nosniff",
                "x-frame-options": "DENY",
                "referrer-policy": "strict-origin-when-cross-origin",
                "permissions-policy": "geolocation=()",
            },
            body="<html><body>Test fixture page</body></html>",
            redirect_chain=[],
            elapsed_ms=7,
            resolved_ip="93.184.216.34",
            tls_verified=True,
        )

    def fake_dns(host: str):
        return {
            "status": "completed",
            "records": {"A": ["93.184.216.34"], "AAAA": [], "CNAME": [], "MX": [], "NS": [], "TXT": []},
            "facts": {"resolves": True, "has_mx": False, "has_spf": False, "has_dmarc_hint": False},
            "findings": [],
            "source": "test resolver",
        }

    def fake_tls(host: str, port: int = 443, ip: str | None = None):
        return {
            "status": "completed",
            "severity": "info",
            "summary": "TLS trust chain is valid in this fixture.",
            "evidence": {"host": host, "trusted": True, "leaf": {"san": [host]}},
            "findings": [],
            "limitations": ["Synthetic TLS fixture used in tests."],
            "elapsed_ms": 3,
        }

    monkeypatch.setattr(pipeline, "follow", fake_follow)
    monkeypatch.setattr(pipeline, "analyse_dns", fake_dns)
    monkeypatch.setattr(pipeline, "analyse_tls", fake_tls)
    return {"follow": fake_follow, "dns": fake_dns, "tls": fake_tls}
