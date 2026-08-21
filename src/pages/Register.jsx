import { Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import "../css/Register.css";

function Register() {
  return (
    <div className="register-container">
      <div className="register-card">
        <div className="logo">💰</div>

        <h1>Create Account</h1>
        <p className="subtitle">Start managing your expenses today</p>

        <div className="input-box">
          <FaUser className="icon" />
          <input type="text" placeholder="Full Name" />
        </div>

        <div className="input-box">
          <FaEnvelope className="icon" />
          <input type="email" placeholder="Email Address" />
        </div>

        <div className="input-box">
          <FaPhone className="icon" />
          <input type="text" placeholder="Mobile Number" />
        </div>

        <div className="input-box">
          <FaLock className="icon" />
          <input type="password" placeholder="Password" />
        </div>

        <div className="input-box">
          <FaLock className="icon" />
          <input type="password" placeholder="Confirm Password" />
        </div>

        <button className="register-btn">Create Account</button>

        <p className="login-text">
          Already have an account?
          <Link to="/login"> Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
