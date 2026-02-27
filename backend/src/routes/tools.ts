import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ToolService } from '../services/tools/toolService';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
const toolService = new ToolService();

router.get('/', authenticate, (_req: AuthRequest, res: Response) => {
  res.json(toolService.getAvailableTools());
});

router.post('/execute', authenticate, apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { name, params } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Tool name is required' });
      return;
    }
    const result = await toolService.executeTool(name, params || {});
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
