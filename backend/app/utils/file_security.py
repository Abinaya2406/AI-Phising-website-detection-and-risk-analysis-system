"""File Upload Security & Content Sanitization for PhishGuard AI."""
import os
import uuid
from werkzeug.utils import secure_filename
from app.utils.exceptions import ValidationError, SecurityError

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Magic bytes (file signatures)
FILE_SIGNATURES = {
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "webp": [b"RIFF"],  # followed by WEBP at offset 8
}


def is_allowed_extension(filename: str) -> bool:
    """Check if file extension is explicitly whitelisted."""
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def verify_file_signature(stream, extension: str) -> bool:
    """Inspect the first bytes of the file stream to ensure signature matches extension."""
    pos = stream.tell()
    stream.seek(0)
    header = stream.read(32)
    stream.seek(pos)

    ext = extension.lower()
    if ext == "png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if ext in ("jpg", "jpeg"):
        return header.startswith(b"\xff\xd8\xff")
    if ext == "webp":
        return header.startswith(b"RIFF") and b"WEBP" in header[8:16]

    return False


def save_secure_upload(file_storage, upload_folder: str) -> dict:
    """
    Validate, sanitize, and safely save an uploaded screenshot file.
    
    Returns:
        dict: { "filename": str, "saved_path": str, "size": int, "extension": str }
    """
    if not file_storage or not file_storage.filename:
        raise ValidationError("No file was uploaded.")

    original_filename = secure_filename(file_storage.filename)
    if not is_allowed_extension(original_filename):
        raise SecurityError(
            f"File extension not permitted. Allowed extensions are: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    ext = original_filename.rsplit(".", 1)[1].lower()

    # Check magic bytes
    if not verify_file_signature(file_storage.stream, ext):
        raise SecurityError("File contents do not match the expected image signature (magic bytes mismatch).")

    # Check size
    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)

    if size > MAX_FILE_SIZE:
        raise ValidationError(f"File size exceeds maximum threshold of {MAX_FILE_SIZE // (1024*1024)}MB.")

    os.makedirs(upload_folder, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    destination_path = os.path.join(upload_folder, unique_filename)

    file_storage.save(destination_path)

    return {
        "original_filename": original_filename,
        "stored_filename": unique_filename,
        "saved_path": destination_path,
        "size": size,
        "extension": ext
    }

