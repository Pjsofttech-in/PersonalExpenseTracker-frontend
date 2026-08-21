import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import "../css/Login.css";

function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">💰</div>

        <h1>Welcome Back</h1>

        <p className="subtitle">Login to your account</p>

        {/* Email */}

        <div className="input-box">
          <FaEnvelope className="icon" />
          <input type="email" placeholder="Enter your email" />
        </div>

        {/* Password */}

        <div className="input-box">
          <FaLock className="icon" />
          <input type="password" placeholder="Enter your password" />
        </div>

        <div className="options">
          <label>
            <input type="checkbox" />
            Remember Me
          </label>

          <a href="#">Forgot Password?</a>
        </div>

        <button className="login-btn">Login</button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="google-btn">
          <FaGoogle />
          Continue with Google
        </button>

        <p className="register-text">
          Don't have an account?
          <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
