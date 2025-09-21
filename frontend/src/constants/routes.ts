export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TOURS: '/tours',
  MY_TOURS: '/my-tours',
  EDIT_TOUR: '/tour/:tourId',
  FOLLOW_USERS: '/follow-users',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];