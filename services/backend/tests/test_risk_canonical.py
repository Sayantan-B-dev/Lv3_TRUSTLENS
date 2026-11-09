from __future__ import annotations

from trustlens.intelligence.risk import RISK_CLASSES, RiskFinding, assess
from trustlens.security.canonical import canonical_json, report_digest, report_ref_hex


def finding(severity: str, rule_id: str = "rule", authoritative: bool = False) -> RiskFinding:
    return RiskFinding(
        rule_id=rule_id,
        severity=severity,
        title=f"{severity} finding",
        check_id="check",
        authoritative=authoritative,
    )


def test_only_authoritative_evidence_confirms_malicious() -> None:
    result = assess(
        [finding("critical", authoritative=True)],
        completed_checks=8,
        applicable_checks=8,
        input_type="url",
    )
    assert result.classification == "Confirmed Malicious"


def test_multiple_high_findings_are_high_risk() -> None:
    result = assess(
        [finding("high", "a"), finding("high", "b")],
        completed_checks=8,
        applicable_checks=8,
        input_type="url",
    )
    assert result.classification == "High Risk"


def test_single_high_finding_is_suspicious() -> None:
    result = assess(
        [finding("high", "a")],
        completed_checks=8,
        applicable_checks=8,
        input_type="url",
    )
    assert result.classification == "Suspicious"


def test_clean_full_coverage_is_low_risk_not_safe() -> None:
    result = assess([], completed_checks=8, applicable_checks=8, input_type="url")
    assert result.classification == "Low Risk"
    assert any("prove" in limitation.lower() for limitation in result.limitations)


def test_missing_evidence_is_inconclusive_not_low() -> None:
    result = assess([], completed_checks=2, applicable_checks=8, input_type="url")
    assert result.classification == "Inconclusive"


def test_degraded_sources_never_silently_become_low_risk() -> None:
    result = assess(
        [],
        completed_checks=5,
        applicable_checks=8,
        input_type="url",
        unavailable_sources=["tls", "headers"],
    )
    assert result.classification == "Inconclusive"
    assert any("Unavailable sources" in limitation for limitation in result.limitations)


def test_all_five_classifications_are_declared() -> None:
    assert set(RISK_CLASSES) == {
        "Low Risk",
        "Suspicious",
        "High Risk",
        "Confirmed Malicious",
        "Inconclusive",
    }


def test_canonical_digest_is_order_independent() -> None:
    left = {"b": 2, "a": {"z": [1, 2], "y": "hello"}}
    right = {"a": {"y": "hello", "z": [1, 2]}, "b": 2}
    assert canonical_json(left) == canonical_json(right)
    assert report_digest(left) == report_digest(right)


def test_canonical_digest_changes_with_content() -> None:
    assert report_digest({"risk": "Low Risk"}) != report_digest({"risk": "High Risk"})


def test_report_ref_is_bytes32() -> None:
    ref = report_ref_hex("abc", 1)
    assert ref.startswith("0x")
    assert len(ref) == 66
    int(ref, 16)
