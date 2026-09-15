import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { saveToken } from "../utils/api";
import { loginUser } from "../utils/auth";
import { ensureDefaultsOnBackend } from "../utils/backendData";

import "../css/Login.css";

function OAuth2Success() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("Google login failed — no token received.");
      return;
    }

    saveToken(token);

    let email = "";
    let name = params.get("name") || "";

    try {
      const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(part));
      email = payload.sub || "";
    } catch (err) {
      email = "";
    }

    if (!name) {
      name = email ? email.split("@")[0] : "Google User";
    }

    (async () => {
      try {
        await ensureDefaultsOnBackend();

        loginUser(
          {
            name: name,
            email: email,
            mobile: "",
          },
          true,
        );

        navigate("/", { replace: true });
      } catch (err) {
        setError(err.message || "Google login failed. Please try again.");
      }
    })();
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">💰</div>

        {error ? (
          <>
            <h1>Login Failed</h1>

            <p className="subtitle">Google login could not be completed.</p>

            <div className="form-error">{error}</div>

            <p className="register-text">
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Logging in...</h1>

            <p className="subtitle">Google login successful — please wait...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuth2Success;
