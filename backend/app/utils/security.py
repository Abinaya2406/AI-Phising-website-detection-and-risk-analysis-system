"""Cybersecurity & SSRF Defense Utilities for PhishGuard AI."""
import socket
import ipaddress
from urllib.parse import urlparse
import requests
from app.utils.exceptions import SSRFError, ValidationError, SecurityError

# Restricted IP networks that must NEVER be accessed by outbound requests
RESTRICTED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network (only valid as source address)
    ipaddress.ip_network("10.0.0.0/8"),         # Private-Use (RFC 1918)
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space (RFC 6598)
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link Local
    ipaddress.ip_network("172.16.0.0/12"),      # Private-Use (RFC 1918)
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1 (RFC 5737)
    ipaddress.ip_network("192.88.99.0/24"),     # 6to4 Relay Anycast (RFC 3068)
    ipaddress.ip_network("192.168.0.0/16"),     # Private-Use (RFC 1918)
    ipaddress.ip_network("198.18.0.0/15"),      # Network Interconnect Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2 (RFC 5737)
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3 (RFC 5737)
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved for Future Use
    ipaddress.ip_network("255.255.255.255/32"), # Limited Broadcast
    # IPv6 blocks
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::ffff:0:0/96"),      # IPv4-mapped IPv6
    ipaddress.ip_network("64:ff9b::/96"),       # IPv4/IPv6 translation
    ipaddress.ip_network("100::/64"),           # Discard prefix
    ipaddress.ip_network("2001:db8::/32"),      # Documentation
    ipaddress.ip_network("fc00::/7"),           # Unique Local Address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-Local Unicast
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

ALLOWED_SCHEMES = {"http", "https"}


def is_ip_restricted(ip_obj):
    """Check if an IPv4 or IPv6 address falls into any private, loopback, or reserved block."""
    # Built-in checks
    if (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    ):
        return True

    # Explicit CIDR range checks
    for network in RESTRICTED_NETWORKS:
        if ip_obj in network:
            return True

    return False


def validate_safe_url(url: str) -> dict:
    """
    Strictly validate a URL against SSRF and syntax requirements.
    
    Returns:
        dict with normalized_url, hostname, resolved_ips
    Raises:
        ValidationError or SSRFError if unsafe.
    """
    if not url or not isinstance(url, str):
        raise ValidationError("URL must be a non-empty string.")

    trimmed = url.strip()
    if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
        trimmed = "https://" + trimmed

    try:
        parsed = urlparse(trimmed)
    except Exception as e:
        raise ValidationError(f"Invalid URL structure: {str(e)}")

    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValidationError(f"Disallowed URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    # Disallow userinfo (e.g. http://victim.com@malicious.com)
    if parsed.username or parsed.password:
        raise SecurityError("URLs containing user authentication credentials are strictly prohibited.")

    hostname = parsed.hostname
    if not hostname:
        raise ValidationError("URL must contain a valid host name.")

    # Reject localhost names
    if hostname.lower() in {"localhost", "localhost.localdomain", "broadcasthost"}:
        raise SSRFError(f"Access to local hostname '{hostname}' is denied by SSRF policy.")

    # Check if host is direct raw IP
    try:
        direct_ip = ipaddress.ip_address(hostname)
        if is_ip_restricted(direct_ip):
            raise SSRFError(f"Access to restricted IP address {direct_ip} is denied by SSRF policy.")
        resolved_ips = [str(direct_ip)]
    except ValueError:
        # Hostname is a domain; resolve all DNS A and AAAA records
        try:
            addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
            resolved_ips = []
            for item in addr_info:
                sockaddr = item[4]
                ip_str = sockaddr[0]
                ip_obj = ipaddress.ip_address(ip_str)
                if is_ip_restricted(ip_obj):
                    raise SSRFError(f"Destination domain '{hostname}' resolves to restricted IP {ip_str}.")
                if ip_str not in resolved_ips:
                    resolved_ips.append(ip_str)
            if not resolved_ips:
                raise SSRFError(f"Unable to resolve valid IP address for host '{hostname}'.")
        except socket.gaierror as e:
            # If domain has valid domain syntax, permit offline or unresolvable dead-phish inspection
            if "." in hostname and not hostname.startswith(".") and not hostname.endswith(".") and not hostname.endswith(".local"):
                resolved_ips = ["DNS_UNRESOLVED_OFFLINE"]
            else:
                raise ValidationError(f"DNS resolution failed for '{hostname}': {str(e)}")

    return {
        "normalized_url": trimmed,
        "hostname": hostname,
        "resolved_ips": resolved_ips,
        "scheme": parsed.scheme.lower(),
        "port": parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    }


def safe_fetch_url(url: str, timeout: int = 8, max_redirects: int = 3) -> requests.Response:
    """
    Safely fetch a remote web resource preventing SSRF at every redirect hop.
    """
    current_url = url
    session = requests.Session()
    session.headers.update({
        "User-Agent": "PhishGuard-AI-Threat-Scanner/1.0 (+https://phishguard.ai/bot)"
    })

    for hop in range(max_redirects + 1):
        validated = validate_safe_url(current_url)
        resp = session.get(
            validated["normalized_url"],
            timeout=timeout,
            allow_redirects=False,
            verify=True
        )

        # If not a redirect, return response
        if resp.status_code not in (301, 302, 303, 307, 308):
            return resp

        # Inspect redirect location
        location = resp.headers.get("Location")
        if not location:
            return resp

        # Resolve relative redirect
        from urllib.parse import urljoin
        current_url = urljoin(validated["normalized_url"], location)

    raise SecurityError(f"Exceeded maximum allowed redirects ({max_redirects}) during safe fetch.")
