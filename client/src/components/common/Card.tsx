import type { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={clsx(
        "rounded-lg border bg-white p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};
