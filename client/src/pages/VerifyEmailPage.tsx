import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Missing email. Please register again.");
      return;
    }

    if (!code || code.length !== 5) {
      setError("Please enter the 5-digit verification code.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Verification failed");
        return;
      }

      setMessage("Email verified successfully. You can now log in.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError("Server error");
      console.error(err);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>Verify Your Email</h2>
        <p style={{ marginBottom: "1rem" }}>
          Enter the 5-digit code sent to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Verification Code"
            name="code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 5))
            }
          />

          {error && <p className="form-error">{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}

          <Button type="submit" className="auth-submit">
            Verify Email
          </Button>
        </form>

        <p className="auth-switch">
          Back to <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
};