import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const { SECRET_KEY } = process.env;

export interface AuthenticatedRequest extends Request {
  user?: any; // Replace `any` with your user type if available
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  try {
    if (!SECRET_KEY) {
      throw new Error("Secret key is not defined in environment variables");
    }

    const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    req.user = decoded.data;
    next();
  } catch (e) {
    return res.status(401).json({ error: (e as Error).message });
  }
};
