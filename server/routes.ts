import type { Express } from "express";
import { createServer, type Server } from "node:http";

const MOOD_LABELS: Record<number, string> = {
  1: 'stormy', 2: 'cloudy', 3: 'neutral', 4: 'breezy', 5: 'sunny',
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/journal/reflect', async (req, res) => {
    try {
      const { content, mood, prompt } = req.body as { content: string; mood: number; prompt: string };
      if (!content) return res.status(400).json({ error: 'content required' });

      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const moodLabel = MOOD_LABELS[mood] ?? 'neutral';
      const userMessage = prompt
        ? `Prompt: "${prompt}"\n\nEntry: "${content}"\n\nMood: ${moodLabel}`
        : `Entry: "${content}"\n\nMood: ${moodLabel}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate wellness coach. In 2–3 sentences, reflect back what you hear, validate the feeling, and offer one gentle insight. Be warm, not clinical.',
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const reflection = response.choices[0]?.message?.content?.trim() ?? null;
      return res.json({ reflection });
    } catch (err: any) {
      console.error('Journal reflect error:', err?.message ?? err);
      return res.status(500).json({ error: 'reflection unavailable' });
    }
  });

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
