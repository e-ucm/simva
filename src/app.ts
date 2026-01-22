import express, { Request, Response } from 'express';

export const app: express.Express = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});