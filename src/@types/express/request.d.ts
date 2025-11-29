import { User } from "../../entities/User";
import { Patient } from "../../entities/Patient";

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
      patient?: Patient | null;
    }
  }
}