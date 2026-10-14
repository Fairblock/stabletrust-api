import { Router } from "express";
import { deposit, transfer, withdraw } from "../controllers/transaction.controller.js";
import { getBalance, createAccount, applyPending } from "../controllers/account.controller.js";
import { health } from "../controllers/health.controller.js";

const router = Router();

router.post("/deposit", deposit);
router.post("/transfer", transfer);
router.post("/withdraw", withdraw);
router.post("/balance", getBalance);
router.post("/account/create", createAccount);
router.post("/apply", applyPending);
router.get("/health", health);

export default router;
