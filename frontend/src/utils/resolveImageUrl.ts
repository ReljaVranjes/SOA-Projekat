import { toursApi } from '../services/toursService';

const API_BASE =
  (toursApi?.defaults?.baseURL?.replace(/\/+$/, '') ?? '') ||
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  '';

export const resolveImageUrl = (p?: string | null) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;             // already absolute
  const clean = p.replace(/^\/?(uploads|static)\//, ''); // tolerate variants
  return `${API_BASE}/${clean}`;
};