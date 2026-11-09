from __future__ import annotations

import socket

import pytest

from trustlens.config import get_settings
from trustlens.intelligence.http_probe import follow
from trustlens.intelligence.normalize import (
    InvalidInput,
    detect_input_type,
    normalize_url,
    safe_fetch_ready,
)
from trustlens.security.netguard import (
    UnsafeTargetError,
    is_public_ip,
    parse_possibly_obfuscated_ip,
    resolve_public,
)


@pytest.mark.parametrize(
    "address",
    [
        "127.0.0.1",
        "10.1.2.3",
        "172.16.5.4",
        "192.168.1.1",
        "169.254.169.254",
        "100.64.0.1",
        "0.0.0.0",
        "224.0.0.1",
        "::1",
        "fe80::1",
        "fc00::1",
        "::ffff:127.0.0.1",
        "2001:db8::1",
    ],
)
def test_private_and_special_addresses_are_rejected(address: str) -> None:
    assert is_public_ip(address) is False


@pytest.mark.parametrize("address", ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700:4700::1111"])
def test_public_addresses_are_accepted(address: str) -> None:
    assert is_public_ip(address) is True


def test_decimal_octal_and_hex_ip_forms_are_recognised() -> None:
    assert str(parse_possibly_obfuscated_ip("2130706433")) == "127.0.0.1"
    assert str(parse_possibly_obfuscated_ip("0177.0.0.1")) == "127.0.0.1"
    assert str(parse_possibly_obfuscated_ip("0x7f000001")) == "127.0.0.1"
    assert str(parse_possibly_obfuscated_ip("127.0.0.1")) == "127.0.0.1"


def test_dns_answer_with_any_private_address_is_refused(monkeypatch) -> None:
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.4", 443)),
        ],
    )
    with pytest.raises(UnsafeTargetError):
        resolve_public("rebind.example", 443)


def test_private_dns_answer_is_refused(monkeypatch) -> None:
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.0.10", 80)),
        ],
    )
    with pytest.raises(UnsafeTargetError):
        resolve_public("internal.example", 80)


def test_fetching_loopback_fails_without_connecting() -> None:
    result = follow("http://127.0.0.1/admin", get_settings())
    assert result.status is None
    assert result.error is not None
    assert "non-public" in result.error or "refused" in result.error


def test_url_with_embedded_credentials_is_not_fetched() -> None:
    info = normalize_url("https://user:secret@example.com/login")
    assert info.had_credentials is True
    ready, reason = safe_fetch_ready(info)
    assert ready is False
    assert "credentials" in reason


def test_unsupported_schemes_are_rejected() -> None:
    for value in ("javascript:alert(1)", "file:///etc/passwd", "ftp://example.com"):
        with pytest.raises(InvalidInput):
            normalize_url(value)


def test_unusual_port_is_marked_not_fetchable() -> None:
    info = normalize_url("https://example.com:8443/")
    assert info.port == 8443
    ready, _ = safe_fetch_ready(info)
    assert ready is False


def test_obfuscated_decimal_ip_is_detected_as_literal() -> None:
    info = normalize_url("http://2130706433/")
    assert info.is_ip_literal is True


def test_idn_host_is_converted_to_punycode() -> None:
    info = normalize_url("https://münchen.example/")
    assert info.host.startswith("xn--")
    assert "ü" in info.unicode_host or "ü" in info.original


def test_message_detection() -> None:
    assert detect_input_type("https://example.com/path") == "url"
    assert detect_input_type("example.com") == "url"
    assert detect_input_type("Hello, your account is suspended. Please verify immediately.") == "message"
    assert detect_input_type("line one\nline two") == "message"


def test_url_length_limit() -> None:
    with pytest.raises(InvalidInput):
        normalize_url("https://example.com/" + "a" * 5000)
