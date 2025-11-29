import jwt, { SignOptions } from "jsonwebtoken";

import { JWT_SECRET, JWT_EXPIRES } from "../config/jwt";

type AuthToken = string | any;

export class AuthService {
    public static tokenFrom(payload: string | Buffer | object): AuthToken {
        return jwt.sign(payload as string, JWT_SECRET as string, {
            algorithm: "HS256",
            expiresIn: JWT_EXPIRES,
        } as SignOptions);
    }

    public static fromToken(token: AuthToken): any | null {
        try {
            return jwt.verify(token as string, JWT_SECRET as string);
        } catch {
            return null;
        }
    }
}