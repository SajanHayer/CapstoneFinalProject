import React from "react";
import clsx from "clsx";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: "primary" | "outline" | "ghost";
  options?: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  variant = "primary",
  className,
  options,
  children,
  ...rest
}) => {
  return (
    <select
      className={clsx("select", `select-${variant}`, className)}
      {...rest}
    >
      {children
        ? children
        : options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
    </select>
  );
};
