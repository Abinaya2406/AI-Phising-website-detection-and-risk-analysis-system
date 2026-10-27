// Validation utilities for URL and files

export const isValidUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  
  // Allow format with or without protocol
  const regex = /^(https?:\/\/)?((([a-zA-Z\d]([a-zA-Z\d-]*[a-zA-Z\d])*)\.)+[a-zA-Z]{2,}|\d{1,3}(\.\d{1,3}){3}|localhost)(:\d+)?(\/[-a-zA-Z\d%_.~+]*)*(\?[;&a-zA-Z\d%_.~+=-]*)?(#[-a-zA-Z\d_]*)?$/i;
  return regex.test(trimmed);
};

export const normalizeUrl = (url) => {
  if (!url) return '';
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
};

export const extractHostname = (url) => {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return parsed.hostname;
  } catch (err) {
    return url;
  }
};

export const isValidImageFile = (file) => {
  if (!file) return { valid: false, error: 'No file provided' };
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'File format must be PNG, JPEG, WebP, or BMP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be under 10MB.' };
  }

  return { valid: true, error: null };
};

