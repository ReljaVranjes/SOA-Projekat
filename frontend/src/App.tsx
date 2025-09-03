import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tours from './pages/Tours';
import MyTours from './pages/MyTours';
import ProtectedRoute from './components/ProtectedRoute';
import { ROUTES } from './constants/routes';

function App() {
  return (
    <AuthProvider>
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
              path={ROUTES.MY_TOURS}
              element={
                <ProtectedRoute requireRoles={["Guide"]}>
                  <MyTours />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
