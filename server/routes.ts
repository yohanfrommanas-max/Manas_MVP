import type { Express } from "express";
import { createServer, type Server } from "node:http";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/pin/verify', (req, res) => {
    const { pin } = req.body as { pin: string };
    if (!pin) return res.status(400).json({ success: false, error: 'pin required' });
    if (pin === process.env.DEV_PIN) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false });
  });

  const httpServer = createServer(app);
  return httpServer;
}
