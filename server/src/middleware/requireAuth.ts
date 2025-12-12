// import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

export function requireAuth(req: any, res: any, next?: any) {
  const token = req.cookies.jwt; // <-- this is how you read the cookie
    console.log("---------");
    console.log("cookies:", req.cookies);
    console.log("token:", req.cookies.jwt);
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log(decoded);
    req.user = decoded; // attach user to request
    next(); // allow request to continue
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}
