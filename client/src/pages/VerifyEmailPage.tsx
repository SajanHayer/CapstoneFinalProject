import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Missing email. Please register again.");
      return;
    }

    if (!code || code.length !== 5) {
      toast.error("Please enter the 5-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Verification failed");
        return;
      }

      toast.success("Email verified successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      toast.error("Server error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
          />

          <Button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <p className="auth-switch">
          Back to <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
};
