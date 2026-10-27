"""Custom API Exceptions for PhishGuard AI Backend."""

class PhishGuardException(Exception):
    """Base exception for all PhishGuard domain errors."""
    def __init__(self, message="An internal security processing error occurred", status_code=500, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class ValidationError(PhishGuardException):
    """Raised when user input violates validation constraints."""
    def __init__(self, message="Input validation failed", details=None):
        super().__init__(message=message, status_code=400, details=details)


class SecurityError(PhishGuardException):
    """Raised when a request violates cybersecurity policies."""
    def __init__(self, message="Security policy violation detected", status_code=403, details=None):
        super().__init__(message=message, status_code=status_code, details=details)


class SSRFError(SecurityError):
    """Raised when an outbound URL targets private or reserved network ranges."""
    def __init__(self, message="Target destination denied by SSRF protection policy", details=None):
        super().__init__(message=message, status_code=403, details=details)


class ResourceNotFoundError(PhishGuardException):
    """Raised when a requested resource is not found."""
    def __init__(self, message="Requested resource not found", details=None):
        super().__init__(message=message, status_code=404, details=details)


class ServiceUnavailableError(PhishGuardException):
    """Raised when an external or internal subsystem fails."""
    def __init__(self, message="Service is temporarily unavailable", details=None):
        super().__init__(message=message, status_code=503, details=details)

