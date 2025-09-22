import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tours from './pages/Tours';
import TourDetails from './pages/TourDetails';
import PurchasedTours from './pages/PurchasedTours';
import MyTours from './pages/MyTours';
import EditTour from './pages/EditTour';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Blogs from './pages/Blogs';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import FollowUsers from "./pages/FollowUsers";
import ProtectedRoute from './components/ProtectedRoute';
import TourExecution from './pages/TourExecution';
import { ROUTES } from './constants/routes';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
        <Routes>
          <Route path={ROUTES.HOME} element={<Layout />}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TOURS}
              element={
                <ProtectedRoute>
                  <Tours />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TOUR_DETAILS}
              element={
                <ProtectedRoute>
                  <TourDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MY_TOURS}
              element={
                <ProtectedRoute requireRoles={["Guide"]}>
                  <MyTours />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TOUR_EXECUTION}
              element={
                <ProtectedRoute requireRoles={["Tourist"]}>
                  <TourExecution />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.EDIT_TOUR}
              element={
                <ProtectedRoute requireRoles={["Guide"]}>
                  <EditTour />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.FOLLOW_USERS}
              element={
                <ProtectedRoute>
                  <FollowUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN}
              element={
                <ProtectedRoute requireRoles={["Admin"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.BLOGS}
              element={
                <ProtectedRoute>
                  <Blogs />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CART}
              element={
                <ProtectedRoute requireRoles={["Tourist"]}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ORDERS}
              element={
                <ProtectedRoute requireRoles={["Tourist"]}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PURCHASED_TOURS}
              element={
                <ProtectedRoute requireRoles={["Tourist"]}>
                  <PurchasedTours />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
