import cors from "cors";
import express from "express";
import morgan from "morgan";
import routes from "./routes";
import path from "path";

// const NODE_ENV = process.env.NODE_ENV || "development";

// const frontendDistPath = path.join(
// 	__dirname,
// 	NODE_ENV === "production"
// 		? "../../../../frondend/dist"
// 		: "../../frontend/dist"
// );

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Use dem routes
app.use(routes);

export default app;
