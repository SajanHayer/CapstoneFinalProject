import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...rest }, ref) => (
    <label className="input-field">
      {label && <span className="input-label">{label}</span>}
      <input ref={ref} className="input-control" {...rest} />
      {error && <span className="input-error">{error}</span>}
    </label>
  ),
);
