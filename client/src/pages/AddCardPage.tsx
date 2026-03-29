import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import "../styles/addcard.css";

export const AddCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, login } = useAuth();

  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState({
    cardholderName: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      toast.error("Stripe not loaded yet");
      return;
    }

    if (!form.cardholderName.trim()) {
      toast.error("Please enter cardholder name");
      return;
    }

    setSaving(true);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        toast.error("Card input not found");
        return;
      }
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: form.cardholderName,
        },
      });
      if (error) {
        toast.error(error.message || "Card error");
        return;
      }
      // //
      const res = await fetch("http://localhost:8080/api/stripe/verfify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Verification failed");
        return;
      }

      toast.success("Card verified successfully!");
      // Update user in context with verification status
      if (user) {
        login({ ...user, is_verified: true });
      }
      setTimeout(() => navigate("/account"), 600);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-card-container">
      {/* Header */}
      <div className="ac-card ac-header">
        <div className="ac-header-top">
          <div className="ac-header-content">
            <div className="ac-header-title">Add Payment Method</div>
            <div className="ac-header-subtitle">
              Add a credit card to your wallet.
            </div>
          </div>
          <div className="ac-header-actions">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Processing..." : "Add Card"}
            </Button>
          </div>
        </div>

        {isGuest && (
          <div className="ac-alert ac-alert-info">
            You're in Guest mode — sign in to add a payment method.
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="ac-card">
        <div className="ac-section-title">Card Details</div>

        {/* Name */}
        <div className="ac-input-group">
          <label className="ac-label">Cardholder Name</label>
          <input
            type="text"
            name="cardholderName"
            value={form.cardholderName}
            onChange={handleChange}
            placeholder="John Doe"
            className="ac-input"
          />
        </div>

        {/* Stripe Card Element */}
        <div className="ac-input-group">
          <label className="ac-label">Card Details</label>
          <div className="ac-input">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#e5424d",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
