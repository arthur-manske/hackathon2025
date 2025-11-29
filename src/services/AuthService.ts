    import jwt from "jsonwebtoken";

    import { JWT_SECRET, JWT_EXPIRES } from "../config/jwt";

    type AuthToken = string | any;

    export class AuthService {
        public static tokenFrom(payload: string | object): AuthToken
        {
            return jwt.sign(payload, JWT_SECRET, {
                algorithm: "HS256",
                expiresIn: JWT_EXPIRES,
            });
        }

        public static fromToken(token: AuthToken): any | Object | null
        {
            try {
                return jwt.verify(token as string, JWT_SECRET) as any;
            } catch {
                return null;
            }
        }
    }