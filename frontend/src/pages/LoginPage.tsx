import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Please enter both fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,     // backend expects email
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // backend sends { message: "Invalid credentials" } etc.
        setError(data.message || "Login failed");
        return;
      }

      // store token + user from backend
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // go to listings (or account/dashboard if you prefer)
      navigate("/listings");
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error, please try again.");
    } finally {
      setLoading(false);
    }
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
          <Button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </section>
  );
};
