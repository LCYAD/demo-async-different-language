import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

const delayGetQuerySchema = z.object({
  delaySecs: z.coerce.number().min(1).max(10).default(2),
  numOfCalls: z.coerce.number().min(2).max(50).default(10)
});

app.get('/healthz', (c: Context) => {
  return c.json({ status: 'ok' });
});

// Sequential delay endpoint
app.get(
  '/delay/sequential',
  zValidator('query', delayGetQuerySchema),
  async (c) => {
    const { delaySecs, numOfCalls } = c.req.valid('query');

    const results = [];
    const startTime = Date.now();

    // Execute requests sequentially
    for (let i = 0; i < numOfCalls; i++) {
      try {
        const response = await fetch(`https://httpbin.org/delay/${delaySecs}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        results.push({
          requestNumber: i + 1,
          data
        });
      } catch (error) {
        return c.json({ error: 'Failed to fetch from httpbin' }, 500);
      }
    }

    const totalTime = Date.now() - startTime;

    return c.json({
      totalRequests: numOfCalls,
      delayPerRequest: delaySecs,
      totalTimeMs: totalTime,
      results
    });
  }
);

// Parallel delay endpoint
app.get(
  '/delay/parallel',
  zValidator('query', delayGetQuerySchema),
  async (c) => {
    const { delaySecs, numOfCalls } = c.req.valid('query');
    const startTime = Date.now();

    try {
      // Create array of promises for parallel execution
      // this need some refactoring
      const promises = Array.from({ length: numOfCalls }).map(async (_, i) => {
        const response = await fetch(`https://httpbin.org/delay/${delaySecs}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
          requestNumber: i + 1,
          data
        };
      });

      // Execute all requests in parallel
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      return c.json({
        totalRequests: numOfCalls,
        delayPerRequest: delaySecs,
        totalTimeMs: totalTime,
        results
      });
    } catch (error) {
      return c.json({ error: 'Failed to fetch from httpbin' }, 500);
    }
  }
);

export default {
  fetch: app.fetch,
  idleTimeout: 120
};
