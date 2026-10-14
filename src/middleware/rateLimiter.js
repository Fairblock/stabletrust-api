import rateLimit from "express-rate-limit";

// 30 requests per minute, applied to every route.
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: "Too many requests, please try again later." },
});

export default rateLimiter;
