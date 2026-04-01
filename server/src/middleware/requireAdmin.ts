import { requireAuth } from "./requireAuth";

export function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    const user = req.user;

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  });
}