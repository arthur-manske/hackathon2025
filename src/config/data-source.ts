import "reflect-metadata";

import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

import { Patient } from "../entities/Patient";

dotenv.config()

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

export const AppDataSource = new DataSource({
    type: "mysql",
    host: DB_HOST,
    port: Number(DB_PORT || "3306"),
    username: DB_USERNAME || "avnadmin",
    password: DB_PASSWORD,
    database: DB_NAME,
    synchronize: true,
    logging: true,
    entities: [Patient]
});