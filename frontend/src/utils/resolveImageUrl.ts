import api from '../api';

const API_BASE =
  (api?.defaults?.baseURL?.replace(/\/+$/, '') ?? '') ||
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  '';

export const resolveImageUrl = (p?: string | null) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;             // already absolute
  const clean = p.replace(/^\/?(static)\//, ''); // tolerate variants
  console.log(`${API_BASE}/api/tours-service/${clean}`);
  return `${API_BASE}/api/tours-service/${clean}`;
};