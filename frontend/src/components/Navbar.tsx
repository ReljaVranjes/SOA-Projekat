import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useCart } from "../contexts/CartContext";
import { User } from "../types/user";

interface NavbarProps {
  isAuthenticated: boolean;
  user?: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();
  const { itemCount } = useCart();

  const handleLogout = () => {
    onLogout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="text-white text-xl font-bold">
              SOA Tours
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex ml-10 space-x-8">
                <Link
                  to={ROUTES.DASHBOARD}
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to={ROUTES.TOURS}
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Tours
                </Link>
                <Link
                  to={ROUTES.FOLLOW_USERS}
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Follow Users
                </Link>
                {user?.role === "Guide" && (
                  <Link
                    to={ROUTES.MY_TOURS}
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    My Tours
                  </Link>
                )}

                {(user?.role === "Tourist" || user?.role === "Guide") && (
                  <Link
                    to={ROUTES.BLOGS}
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Blogs
                  </Link>
                )}
                {user?.role === "Tourist" && (
                  <Link
                    to={ROUTES.ORDERS}
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    My Orders
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user?.role === "Tourist" && (
                  <Link
                    to={ROUTES.CART}
                    className="relative text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-5M9.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                      />
                    </svg>
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                )}
                <span className="text-white text-sm">
                  Welcome, {user?.email}
                </span>
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                  {user?.role}
                </span>
                {user?.balance !== undefined && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                    ${user.balance.toFixed(2)}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
