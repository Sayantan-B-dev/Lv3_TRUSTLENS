from __future__ import annotations

from trustlens.intelligence.domain import analyse_domain
from trustlens.intelligence.messages import analyse_message
from trustlens.intelligence.normalize import normalize_url


def rules(result: dict) -> set[str]:
    return {finding["rule_id"] for finding in result["findings"]}


def test_cyrillic_homograph_is_flagged() -> None:
    result = analyse_domain(normalize_url("https://p\u0430ypal.com/login"))
    assert "domain.idn_homograph" in rules(result)
    assert result["facts"]["brand_matches"]


def test_typosquatting_is_flagged() -> None:
    result = analyse_domain(normalize_url("https://paypa1.com/"))
    assert "domain.typosquatting" in rules(result)


def test_brand_on_unrelated_domain_is_flagged_as_impersonation() -> None:
    result = analyse_domain(normalize_url("https://paypal-secure-login.example/verify"))
    assert "domain.brand_impersonation" in rules(result)
    finding = next(f for f in result["findings"] if f["rule_id"] == "domain.brand_impersonation")
    assert finding["severity"] in {"high", "medium"}


def test_shortener_is_flagged() -> None:
    result = analyse_domain(normalize_url("https://bit.ly/abc123"))
    assert "url.shortener" in rules(result)


def test_plain_domain_has_no_deception_signals() -> None:
    result = analyse_domain(normalize_url("https://example.com/docs"))
    assert not any(rule.startswith("domain.") for rule in rules(result))


def test_message_extracts_indicators_and_costs() -> None:
    text = (
        "URGENT: your account is suspended. Verify your account now and send the OTP "
        "to alice@example.com or visit https://bank-secure.example/verify. "
        "Pay the processing fee with a gift card. Do not tell anyone."
    )
    result = analyse_message(text)
    types = {item["type"] for item in result["indicators"]}
    assert "url" in types
    assert "email" in types
    rule_ids = {finding["rule_id"] for finding in result["findings"]}
    assert "message.credential_request" in rule_ids
    assert "message.payment_request" in rule_ids
    assert "message.urgency" in rule_ids
    assert "message.secrecy" in rule_ids
    assert "alice@example.com" not in result["redacted_text"]


def test_benign_message_does_not_claim_fraud() -> None:
    result = analyse_message("Hi, the meeting is moved to 3pm tomorrow. See you there.")
    assert result["status"] == "completed"
    assert all(finding["severity"] in {"info", "low"} for finding in result["findings"])
    assert "message.no_patterns" in {finding["rule_id"] for finding in result["findings"]}


def test_message_remote_access_is_high() -> None:
    result = analyse_message(
        "Please install AnyDesk remote access so our support team can fix your computer."
    )
    rule_ids = {finding["rule_id"] for finding in result["findings"]}
    assert "message.remote_access" in rule_ids
