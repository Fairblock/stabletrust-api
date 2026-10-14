// Loads .env before anything reads process.env.
import "dotenv/config";

export { RPC_URLS } from "./chains.js";

export const PORT = process.env.PORT || 3000;
