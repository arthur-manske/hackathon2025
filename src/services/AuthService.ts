import jwt, { JwtPayload } from "jsonwebtoken";

import { JWT_SECRET, JWT_EXPIRES } from "../config/jwt";

type AuthToken = string | JwtPayload;

export class AuthService {
    public static tokenFrom(payload: object): AuthToken
    {
        return jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: JWT_EXPIRES,
        });
    }

    public static fromToken(token: AuthToken): JwtPayload | Object | null
    {
        try {
            return jwt.verify(token as string, JWT_SECRET) as JwtPayload;
        } catch {
            return null;
        }
    }
}