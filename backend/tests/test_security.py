"""Unit tests for Cybersecurity Validations, SSRF Defense, and Upload Security."""
import io
import pytest
from app.utils.security import validate_safe_url
from app.utils.exceptions import SSRFError, ValidationError, SecurityError
from app.utils.file_security import verify_file_signature, is_allowed_extension, save_secure_upload


def test_ssrf_blocks_loopback_and_private_ips():
    """Verify SSRF blocks loopback, private RFC1918, link-local, and AWS metadata."""
    dangerous_urls = [
        "http://127.0.0.1",
        "http://127.0.0.1:8080/admin",
        "http://localhost",
        "http://10.0.0.1",
        "http://172.16.0.5/api",
        "http://192.168.1.1/router",
        "http://169.254.169.254/latest/meta-data/",
        "http://0.0.0.0",
    ]
    for url in dangerous_urls:
        with pytest.raises(SSRFError):
            validate_safe_url(url)


def test_ssrf_blocks_unauthorized_schemes_and_userinfo():
    """Verify non-HTTP schemes and embedded credentials in URLs are blocked."""
    invalid_schemes = [
        "file:///etc/passwd",
        "ftp://ftp.example.com",
        "gopher://example.com",
        "javascript:alert(1)"
    ]
    for url in invalid_schemes:
        with pytest.raises(ValidationError):
            validate_safe_url(url)

    with pytest.raises(SecurityError):
        validate_safe_url("http://user:password@example.com")


def test_ssrf_allows_public_resolvable_urls():
    """Verify safe public domains are accepted and normalized."""
    result = validate_safe_url("https://github.com")
    assert result["hostname"] == "github.com"
    assert result["scheme"] == "https"
    assert len(result["resolved_ips"]) > 0


def test_upload_extension_whitelist():
    """Verify file extension validation rules."""
    assert is_allowed_extension("screenshot.png") is True
    assert is_allowed_extension("snapshot.jpg") is True
    assert is_allowed_extension("evidence.webp") is True
    assert is_allowed_extension("malware.exe") is False
    assert is_allowed_extension("script.php") is False
    assert is_allowed_extension("noextension") is False


def test_upload_magic_bytes_detection():
    """Verify image magic bytes verification."""
    # Valid PNG header: \x89PNG\r\n\x1a\n
    valid_png_stream = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...")
    assert verify_file_signature(valid_png_stream, "png") is True

    # Valid JPEG header: \xff\xd8\xff
    valid_jpeg_stream = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF...")
    assert verify_file_signature(valid_jpeg_stream, "jpg") is True

    # Fake PNG (actually text/script)
    fake_png_stream = io.BytesIO(b"<?php echo 'malicious'; ?>")
    assert verify_file_signature(fake_png_stream, "png") is False

