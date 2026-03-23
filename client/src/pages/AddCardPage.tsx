import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import "../styles/addcard.css";

export const AddCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  const [form, setForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    cardholderName: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim();
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (/^\d*$/.test(value) && value.length <= 16) {
      setForm((prev) => ({
        ...prev,
        cardNumber: formatCardNumber(value),
      }));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setForm((prev) => ({
        ...prev,
        expiryDate: formatExpiryDate(value),
      }));
    }
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) {
      setForm((prev) => ({
        ...prev,
        cvc: value,
      }));
    }
  };

  const validateForm = () => {
    if (!form.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
      toast.error("Please enter a valid 16-digit card number");
      return false;
    }
    if (!form.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      toast.error("Please enter expiry date in MM/YY format");
      return false;
    }
    if (!form.cvc.match(/^\d{3}$/)) {
      toast.error("Please enter a valid 3-digit CVC");
      return false;
    }
    if (!form.cardholderName.trim()) {
      toast.error("Please enter cardholder name");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Simulate payment processing
      // In a real app, you would send this to your backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Card added successfully!");
      setTimeout(() => navigate("/account"), 650);
    } catch (error) {
      toast.error("Failed to add card. Please try again.");
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
            You're in Guest mode — you need to sign in to add a payment method.
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="ac-card">
        <div className="ac-section-title">Card Details</div>

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

        <div className="ac-input-group">
          <label className="ac-label">Card Number</label>
          <input
            type="text"
            name="cardNumber"
            value={form.cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            className="ac-input"
            maxLength={19}
          />
        </div>

        <div className="ac-grid-2">
          <div className="ac-input-group">
            <label className="ac-label">Expiry (MM/YY)</label>
            <input
              type="text"
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleExpiryChange}
              placeholder="12/25"
              className="ac-input"
              maxLength={5}
            />
          </div>
          <div className="ac-input-group">
            <label className="ac-label">CVC</label>
            <input
              type="text"
              name="cvc"
              value={form.cvc}
              onChange={handleCVCChange}
              placeholder="123"
              className="ac-input"
              maxLength={3}
            />
          </div>
        </div>

        <div className="ac-alert ac-alert-warning">
          This is a simulated payment flow. No real card charges are made.
        </div>
      </div>
    </div>
  );
};
