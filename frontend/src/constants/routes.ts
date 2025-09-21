export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TOURS: '/tours',
  TOUR_DETAILS: '/tour/:tourId/details',
  MY_TOURS: '/my-tours',
  EDIT_TOUR: '/tour/:tourId',
  PROFILE: '/profile',
  ADMIN: '/admin',
  BLOGS: '/blogs',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];