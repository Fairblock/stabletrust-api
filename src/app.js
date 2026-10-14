import express from "express";
import cors from "cors";
import rateLimiter from "./middleware/rateLimiter.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimiter);
app.use(routes);

// Default export lets Vercel run the app directly; src/server.js starts it locally.
export default app;
