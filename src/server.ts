import express, { Application } from 'express';
import cors                     from 'cors';
import helmet                   from 'helmet';
import rateLimit                from 'express-rate-limit';

import { AppDataSource } from "./config/data-source";

import PatientRoutes from "./routes/PatientRoutes";
import UserRoutes from "./routes/UserRoutes";

const app:  Application = express();
const port: number      = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors({
	origin: "*"
}))

app.use((req, res, next) => {
  console.log("REQ >", req.method, req.url);
  res.on("finish", () => console.log("RES <", req.method, req.url, res.statusCode));
  next();
});

app.use("/patients", PatientRoutes);
app.use("/users", UserRoutes);

app.use((_, res) => res.status(404).json({ message: "rota não encontrada" }));

AppDataSource.initialize().then(() => {
    console.log("Data source has been initialized!");
    app.listen(port, () => {
        console.log("Serving is running on port: " + port);
    });
}).catch((e) => {
    console.error("INIT ERROR: " + e);
});
