import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Message from "../models/Message.js";

const router = Router();

router.get("/history", authenticate, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const items = await Message.find({ room: "global" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(items.reverse());
});

export default router;
