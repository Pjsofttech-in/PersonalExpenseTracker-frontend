import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNavigation from "./components/navigation/TopNavigation";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddIncome from "./pages/income/AddIncome";
import Settings from "./pages/Settings";
import List from "./pages/List";

function App() {
  return (
    <BrowserRouter>
      <TopNavigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/income/add" element={<AddIncome />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/list" element={<List />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
