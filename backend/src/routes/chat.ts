import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Orchestrator } from '../orchestrator/orchestrator';
import { apiLimiter } from '../middleware/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const orchestrator = new Orchestrator();

router.post('/', authenticate, apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationId, model, useMemory, useTools } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const result = await orchestrator.process({
      userId: req.userId!,
      conversationId: conversationId || uuidv4(),
      message,
      model,
      useMemory,
      useTools,
    });

    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Chat processing failed';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/models', authenticate, apiLimiter, (_req: AuthRequest, res: Response) => {
  res.json(orchestrator.getAvailableModels());
});

router.get('/conversations', authenticate, apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await orchestrator.getMemoryService().getUserConversations(req.userId!);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id/history', authenticate, apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const history = await orchestrator.getMemoryService().getConversationHistory(
      req.userId!,
      req.params.id as string
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

router.delete('/conversations/:id', authenticate, apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    await orchestrator.getMemoryService().clearConversation(req.userId!, req.params.id as string);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
