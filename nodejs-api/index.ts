import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import pLimit from 'p-limit';
import { zValidator } from '@hono/zod-validator';

async function fetchFromHttpBin(delaySecs: number): Promise<unknown> {
  const response = await fetch(`https://httpbin.org/delay/${delaySecs}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

const app = new Hono();

const delayGetQuerySchema = z.object({
  delaySecs: z.coerce.number().min(1).max(10).default(2),
  numOfCalls: z.coerce.number().min(2).max(50).default(10)
});

const delayParallelQuerySchema = delayGetQuerySchema.extend({
  callLimit: z.coerce.number().min(1).max(20).optional()
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

    const startTime = Date.now();
    const limit = pLimit(1);

    try {
      // Create array of promises with p-limit to control concurrency
      const promises = Array.from({ length: numOfCalls }).map((_, i) => 
        limit(async () => {
          const result = await fetchFromHttpBin(delaySecs);
          return { result, requestNumber: i + 1 };
        })
      );

      // Execute requests with concurrency limit of 1
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

// Parallel delay endpoint
app.get(
  '/delay/parallel',
  zValidator('query', delayParallelQuerySchema),
  async (c) => {
    const { delaySecs, numOfCalls, callLimit } = c.req.valid('query');
    const startTime = Date.now();
    const limit = callLimit ? pLimit(callLimit) : null;

    try {
      // Create array of promises with p-limit to control concurrency
      const promises = Array.from({ length: numOfCalls }).map((_, i) => {
        const func = async () => {
          const result = await fetchFromHttpBin(delaySecs);
          return {
            result,
            requestNumber: i + 1
          };
      
        }
        return limit ? limit(func) : func(); 
      });

      // Execute all requests
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
