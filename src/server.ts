import express, { Application } from 'express';
import cookieParser             from "cookie-parser";
import cors                     from 'cors';
import helmet                   from 'helmet';
import rateLimit                from 'express-rate-limit';

import { AppDataSource } from "./config/data-source";

import PatientRoutes from "./routes/PatientRoutes";
import UserRoutes from "./routes/UserRoutes";

const app:  Application = express();
const port: number      = Number(process.env.PORT) || 3000;

app.use(cookieParser());
app.use(express.json());

app.use("/patients", PatientRoutes);
app.use("/users", UserRoutes);

app.get("/", (_req, res) => {
    res.status(201).json({message: "Server is up."});
});

AppDataSource.initialize().then(() => {
    console.log("Data source has been initialized!");
    app.listen(port, () => {
        console.log("Serving is running on port: " + port);
    });
}).catch((e) => {
    console.error("INIT ERROR: " + e);
});
