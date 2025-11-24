// utility module that provides all authentication-related helper functions for backend
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (plain: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

export const signToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "secret", {
    expiresIn: "1d",
  });
};
