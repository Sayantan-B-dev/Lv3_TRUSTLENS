from __future__ import annotations

from fastapi.testclient import TestClient

from trustlens.main import app
from trustlens.worker.runner import process_one


def submit(client: TestClient, value: str, *, mode: str = "manual", input_type: str = "url"):
    return client.post(
        "/api/v1/investigations",
        json={"input": value, "input_type": input_type, "mode": mode},
    )


def run_and_process(client: TestClient, investigation_id: str) -> dict:
    response = client.post(f"/api/v1/investigations/{investigation_id}/run", json={})
    assert response.status_code == 202
    assert process_one() is True
    detail = client.get(f"/api/v1/investigations/{investigation_id}")
    assert detail.status_code == 200
    return detail.json()


def test_manual_submission_is_saved_without_a_job(client: TestClient) -> None:
    response = submit(client, "https://example.com", mode="manual")
    assert response.status_code == 202
    body = response.json()
    assert body["queued"] is False
    assert body["investigation"]["status"] == "draft"
    history = client.get("/api/v1/investigations").json()
    assert history["total"] == 1


def test_automatic_submission_queues_a_job(client: TestClient) -> None:
    response = submit(client, "https://example.com", mode="automatic")
    assert response.status_code == 202
    assert response.json()["queued"] is True
    assert response.json()["investigation"]["status"] == "queued"


def test_url_pipeline_produces_evidence_and_low_risk_for_benign_fixture(
    client: TestClient, stub_network
) -> None:
    investigation = submit(client, "https://example.com", mode="manual").json()["investigation"]
    detail = run_and_process(client, investigation["id"])

    assert detail["status"] == "completed"
    assert detail["risk_classification"] == "Low Risk"
    assert detail["checks_completed"] == detail["checks_total"]
    assert detail["coverage"] == 1.0
    check_ids = {check["check_id"] for check in detail["checks"]}
    assert {"url.structure", "domain.heuristics", "dns", "redirects", "headers", "tls", "correlation"} <= check_ids
    assert detail["ai_explanation"]["mode"] == "deterministic-fallback"
    assert detail["ai_used"] is False
    assert detail["indicators"]


def test_ssrf_target_is_never_fetched_and_cannot_be_low_risk(client: TestClient) -> None:
    investigation = submit(client, "http://127.0.0.1/admin", mode="manual").json()["investigation"]
    detail = run_and_process(client, investigation["id"])
    assert detail["risk_classification"] != "Low Risk"
    fetch_checks = [
        check for check in detail["checks"] if check["check_id"] in {"redirects", "headers"}
    ]
    assert fetch_checks
    assert all(check["status"] in {"unavailable", "error"} for check in fetch_checks)


def test_message_analysis_flags_social_engineering(client: TestClient, stub_network) -> None:
    message = (
        "URGENT: your bank account is suspended. Share the OTP now and pay the processing fee "
        "with a gift card. Verify at https://bank-secure-login.example/verify"
    )
    investigation = submit(client, message, mode="manual", input_type="message").json()["investigation"]
    detail = run_and_process(client, investigation["id"])
    assert detail["risk_classification"] in {"Suspicious", "High Risk", "Confirmed Malicious"}
    assert any(check["check_id"] == "message.heuristics" for check in detail["checks"])
    assert any(check["check_id"].startswith("url.structure:link1") for check in detail["checks"])


def test_ownership_is_enforced_server_side(client: TestClient) -> None:
    investigation = submit(client, "https://example.com", mode="manual").json()["investigation"]
    with TestClient(app) as other_client:
        other_client.get("/api/v1/auth/me")
        assert other_client.get(f"/api/v1/investigations/{investigation['id']}").status_code == 404
        assert other_client.post(f"/api/v1/investigations/{investigation['id']}/run", json={}).status_code == 404
        assert other_client.delete(f"/api/v1/investigations/{investigation['id']}").status_code == 404
    assert client.get(f"/api/v1/investigations/{investigation['id']}").status_code == 200


def test_invalid_and_oversized_inputs_are_rejected(client: TestClient) -> None:
    assert submit(client, "javascript:alert(1)").status_code == 422
    assert submit(client, "a" * 20050).status_code == 422
    bad_check = client.post(
        "/api/v1/investigations",
        json={"input": "example.com", "checks": ["not.a.check"]},
    )
    assert bad_check.status_code == 422


def test_report_integrity_and_local_verification(client: TestClient, stub_network) -> None:
    investigation = submit(client, "https://example.com", mode="manual").json()["investigation"]
    run_and_process(client, investigation["id"])

    report_response = client.post(
        "/api/v1/threat-reports", json={"investigation_id": investigation["id"]}
    )
    assert report_response.status_code == 201
    report = report_response.json()
    assert len(report["digest"]) == 64
    assert report["report_ref"].startswith("0x") and len(report["report_ref"]) == 66
    assert "payload" in report
    assert "pasted message" not in str(report["payload"]).lower()

    verify = client.post(f"/api/v1/threat-reports/{report['id']}/verify")
    assert verify.status_code == 200
    body = verify.json()
    assert body["digest_consistent"] is True
    assert body["chain"]["status"] == "unavailable"
    assert "does not prove" in body["explanation"]


def test_export_contains_sanitised_report(client: TestClient, stub_network) -> None:
    investigation = submit(client, "https://example.com", mode="manual").json()["investigation"]
    run_and_process(client, investigation["id"])
    export = client.get(f"/api/v1/investigations/{investigation['id']}/export")
    assert export.status_code == 200
    payload = export.json()
    assert payload["schema"] == "trustlens.report/v1"
    assert payload["investigation_id"] == investigation["id"]


def test_feedback_is_stored_for_review(client: TestClient, stub_network) -> None:
    investigation = submit(client, "https://example.com", mode="manual").json()["investigation"]
    run_and_process(client, investigation["id"])
    response = client.post(
        f"/api/v1/investigations/{investigation['id']}/feedback",
        json={"kind": "false_positive", "comment": "This is a known good site."},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "open"


def test_automation_settings_are_persisted(client: TestClient) -> None:
    initial = client.get("/api/v1/automation").json()
    assert initial["mode"] == "automatic"
    assert initial["paused"] is False
    updated = client.patch(
        "/api/v1/automation", json={"mode": "manual", "paused": True}
    ).json()
    assert updated["mode"] == "manual"
    assert updated["paused"] is True
    retrieved = client.get("/api/v1/automation").json()
    assert retrieved["mode"] == "manual"
    assert retrieved["paused"] is True


def test_paused_automation_saves_submissions_without_queueing(client: TestClient) -> None:
    client.patch("/api/v1/automation", json={"paused": True})
    response = submit(client, "https://example.com", mode="automatic")
    assert response.status_code == 202
    assert response.json()["queued"] is False
    assert response.json()["paused"] is True
    assert response.json()["investigation"]["status"] == "draft"


def test_delete_removes_investigation(client: TestClient) -> None:
    investigation = submit(client, "https://example.com", mode="manual").json()["investigation"]
    assert client.delete(f"/api/v1/investigations/{investigation['id']}").status_code == 204
    assert client.get(f"/api/v1/investigations/{investigation['id']}").status_code == 404


def test_status_and_meta_do_not_leak_secrets(client: TestClient) -> None:
    status = client.get("/api/v1/system/status").json()
    assert status["app"] == "TrustLens"
    assert "session_secret" not in str(status).lower()
    assert "api_key" not in str(status).lower()
    meta = client.get("/api/v1/meta").json()
    assert len(meta["risk_classes"]) == 5
