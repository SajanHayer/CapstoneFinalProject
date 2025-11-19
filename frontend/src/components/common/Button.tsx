import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...rest
}) => {
  return (
    <button
      className={clsx("btn", `btn-${variant}`, className)}
      {...rest}
    >
      {children}
    </button>
  );
};
