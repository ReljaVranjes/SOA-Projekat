import api from '../api';

const API_BASE =
  (api?.defaults?.baseURL?.replace(/\/+$/, '') ?? '') ||
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  '';

export const resolveImageUrl = (p?: string | null) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;             // already absolute
  
  // If path doesn't start with uploads/, prepend it
  const cleanPath = p.startsWith('/') ? p.substring(1) : p;
  if (!cleanPath.startsWith('uploads/')) {
    return `${API_BASE}/uploads/${cleanPath}`;
  }
  
  return `${API_BASE}/${cleanPath}`;
};