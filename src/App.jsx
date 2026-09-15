import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import TopNavigation from "./components/navigation/TopNavigation";

import { getCurrentUser, AUTH_ENABLED } from "./utils/auth";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import OAuth2Success from "./pages/OAuth2Success";
import Register from "./pages/Register";
import AddIncome from "./pages/income/AddIncome";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Liabilities from "./pages/Liabilities";
import List from "./pages/List";
import Assets from "./pages/Assets";

/* =========================================
   AUTH GUARDS
   ========================================= */

function PrivateRoute({ children }) {
  if (!AUTH_ENABLED) {
    return children;
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const currentUser = getCurrentUser();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* =========================================
   NAVIGATION
   ========================================= */

function ConditionalNavigation() {
  const location = useLocation();

  const hideNavigation =
    location.pathname === "/login" || location.pathname === "/register";

  if (hideNavigation) {
    return null;
  }

  return <TopNavigation />;
}

/* =========================================
   APP
   ========================================= */

function App() {
  return (
    <BrowserRouter>
      <ConditionalNavigation />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route path="/oauth2/success" element={<OAuth2Success />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/income/add"
          element={
            <PrivateRoute>
              <AddIncome />
            </PrivateRoute>
          }
        />

        <Route
          path="/list"
          element={
            <PrivateRoute>
              <List />
            </PrivateRoute>
          }
        />

        <Route
          path="/assets"
          element={
            <PrivateRoute>
              <Assets />
            </PrivateRoute>
          }
        />

        <Route
          path="/liabilities"
          element={
            <PrivateRoute>
              <Liabilities />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/add-income"
          element={<Navigate to="/income/add" replace />}
        />

        {/* REST — dashboard वर पाठवा */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
