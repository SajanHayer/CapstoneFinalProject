import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...rest }) => {
  return (
    <label className="input-field">
      {label && <span className="input-label">{label}</span>}
      <input className="input-control" {...rest} />
      {error && <span className="input-error">{error}</span>}
    </label>
  );
};
