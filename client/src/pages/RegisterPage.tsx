import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

// Password policy
const passwordPolicy =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function getPasswordError(password: string): string {
  if (!passwordPolicy.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
  }
  return "";
}

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: `${form.firstName} ${form.lastName}`,
          role: "seller",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Registration failed");
        return;
      }

      
    toast.success("Registration successful! Redirecting to login...");
     navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);

    } catch (err) {
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>Sign up for an Account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
          />
          <Input
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <Button type="submit" className="auth-submit">
            Sign up
          </Button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
};