import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, enterGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      const userEmail = data.user.email;
      const userRole = data.user.role;
      const userId = data.user.id;
      const isVerified = data.user.is_verified;
      login({ email: userEmail, role: userRole, id: userId, is_verified: isVerified });
      toast.success("Login successful!");
      navigate("/listings");
    } catch (err) {
      toast.error("Unable to login. Please try again.");
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>Login to Lets Ride Canada</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" className="auth-submit">
            Login
          </Button>

          <button
            type="button"
            className="btn btn-outline w-full mt-3"
            onClick={() => {
              enterGuest();
              navigate("/listings");
            }}
          >
            Continue as Guest
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </section>
  );
};
