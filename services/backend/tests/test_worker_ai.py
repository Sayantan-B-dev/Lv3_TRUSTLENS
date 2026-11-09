from __future__ import annotations

import importlib
from datetime import timedelta

from fastapi.testclient import TestClient

from trustlens.ai.explain import explain
from trustlens.ai.provider import ProviderResult
from trustlens.config import get_settings
from trustlens.db import SessionLocal
from trustlens.intelligence.pipeline import Outcome
from trustlens.intelligence.risk import assess
from trustlens.models import Job, Investigation, utcnow
from trustlens.services.jobs import recover_expired_leases
import trustlens.worker.runner as runner


def create_queued_job(client: TestClient) -> str:
    investigation_id = client.post(
        "/api/v1/investigations",
        json={"input": "https://example.com", "input_type": "url", "mode": "manual"},
    ).json()["investigation"]["id"]
    assert client.post(f"/api/v1/investigations/{investigation_id}/run", json={}).status_code == 202
    return investigation_id


def outcome() -> Outcome:
    return Outcome(
        check_id="url.structure",
        category="url",
        status="completed",
        severity="info",
        title="URL normalised",
        summary="The URL was normalised safely.",
        evidence={"host": "example.com"},
        findings=[],
    )


def test_failed_job_retries_with_bounded_backoff(client: TestClient, monkeypatch) -> None:
    investigation_id = create_queued_job(client)

    def boom(*args, **kwargs):
        raise RuntimeError("synthetic pipeline failure")

    monkeypatch.setattr(runner, "run_pipeline", boom)
    assert runner.process_one() is False

    with SessionLocal() as session:
        job = session.query(Job).filter(Job.investigation_id == investigation_id).one()
        assert job.status == "queued"
        assert job.attempts == 1
        assert job.available_at.replace(tzinfo=None) > utcnow().replace(tzinfo=None)
        assert job.last_error
        investigation = session.get(Investigation, investigation_id)
        assert investigation.status == "queued"


def test_expired_lease_is_recovered(client: TestClient) -> None:
    investigation_id = create_queued_job(client)
    with SessionLocal() as session:
        job = session.query(Job).filter(Job.investigation_id == investigation_id).one()
        job.status = "running"
        job.attempts = 1
        job.lease_expires_at = utcnow() - timedelta(minutes=5)
        session.commit()
        assert recover_expired_leases(session, get_settings()) == 1
        session.refresh(job)
        assert job.status == "queued"
        assert job.lease_expires_at is None


def test_expired_lease_after_max_attempts_fails_the_investigation(client: TestClient) -> None:
    investigation_id = create_queued_job(client)
    with SessionLocal() as session:
        job = session.query(Job).filter(Job.investigation_id == investigation_id).one()
        job.status = "running"
        job.attempts = job.max_attempts
        job.lease_expires_at = utcnow() - timedelta(minutes=5)
        session.commit()
        recover_expired_leases(session, get_settings())
        session.refresh(job)
        assert job.status == "failed"
        investigation = session.get(Investigation, investigation_id)
        assert investigation.status == "failed"


class BadProvider:
    name = "bad-provider"
    model = "bad-model"

    def complete(self, system_prompt: str, user_prompt: str) -> ProviderResult:
        return ProviderResult(
            payload={
                "summary": "Invented summary.",
                "why": [{"claim": "This cites evidence that does not exist.", "evidence_ids": ["fake.evidence"]}],
                "next_steps": ["Do something."],
                "limitations": [],
                "confidence_note": "High confidence.",
            },
            provider=self.name,
            model=self.model,
            used=True,
        )


class GoodProvider:
    name = "mock-provider"
    model = "mock-model"

    def complete(self, system_prompt: str, user_prompt: str) -> ProviderResult:
        return ProviderResult(
            payload={
                "summary": "Deterministic evidence was reviewed without changing the risk class.",
                "why": [
                    {
                        "claim": "The URL was normalised and validated.",
                        "evidence_ids": ["url.structure"],
                    }
                ],
                "next_steps": ["Verify the domain independently."],
                "limitations": ["Passive checks only."],
                "confidence_note": "Confidence follows evidence coverage.",
            },
            provider=self.name,
            model=self.model,
            used=True,
        )


def test_ai_with_unknown_evidence_reference_falls_back(monkeypatch) -> None:
    explain_module = importlib.import_module("trustlens.ai.explain")
    monkeypatch.setattr(explain_module, "get_provider", lambda settings: BadProvider())
    risk = assess([], completed_checks=1, applicable_checks=1, input_type="url")
    result = explain(get_settings(), risk, [outcome()], input_type="url", target="example.com")
    assert result.used is False
    assert result.provider == "deterministic-fallback"
    assert result.payload["mode"] == "deterministic-fallback"
    assert "unknown evidence" in (result.fallback_reason or "").lower()
    assert risk.classification == "Low Risk"


def test_valid_ai_output_is_accepted_and_risk_is_unchanged(monkeypatch) -> None:
    explain_module = importlib.import_module("trustlens.ai.explain")
    monkeypatch.setattr(explain_module, "get_provider", lambda settings: GoodProvider())
    risk = assess(
        [],
        completed_checks=3,
        applicable_checks=3,
        input_type="url",
    )
    result = explain(get_settings(), risk, [outcome()], input_type="url", target="example.com")
    assert result.used is True
    assert result.provider == "mock-provider"
    assert risk.classification == "Low Risk"
    assert result.payload["why"][0]["evidence_ids"] == ["url.structure"]


def test_ai_cannot_reference_another_investigations_evidence(monkeypatch) -> None:
    explain_module = importlib.import_module("trustlens.ai.explain")
    monkeypatch.setattr(explain_module, "get_provider", lambda settings: BadProvider())
    risk = assess([], completed_checks=0, applicable_checks=0, input_type="url")
    result = explain(get_settings(), risk, [], input_type="url", target="example.com")
    assert result.used is False
    assert result.payload["mode"] == "deterministic-fallback"
