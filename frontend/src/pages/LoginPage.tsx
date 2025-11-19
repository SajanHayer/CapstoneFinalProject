import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please enter both fields");
      return;
    }

    // fake login
    localStorage.setItem("fakeToken", "demo-token");
    navigate("/listings");
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>Login to Power BIDZ</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" className="auth-submit">
            Login
          </Button>
        </form>
        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </section>
  );
};
