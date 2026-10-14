import app from "./app.js";
import { PORT } from "./config/index.js";

app.listen(PORT, () => {
  console.log(`StableTrust server listening on http://localhost:${PORT}`);
  console.log(
    `  POST /account/create - provision a confidential account (idempotent)`,
  );
  console.log(
    `  POST /deposit   - deposit ERC-20 tokens into confidential account`,
  );
  console.log(
    `  POST /transfer  - confidential token transfer between accounts`,
  );
  console.log(
    `  POST /apply     - apply pending balance (received funds) to available`,
  );
  console.log(
    `  POST /withdraw  - withdraw confidential tokens to public ERC-20`,
  );
  console.log(
    `  POST /balance   - get decrypted confidential balance (read-only)`,
  );
});
