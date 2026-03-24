import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readCosts, saveCosts } from '@/lib/infrastructure';

export const prerender = false;

const costItemSchema = z.object({
  name: z.string().min(1).max(100),
  monthlyCost: z.number().min(0),
  currency: z.string().default('EUR'),
  notes: z.string().max(200).default(''),
});

const costsArraySchema = z.array(costItemSchema).min(0).max(50);

export const GET: APIRoute = async () => {
  try {
    const costs = readCosts();
    return new Response(JSON.stringify(costs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to read costs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to read costs' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = costsArraySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    saveCosts(parsed.data);

    return new Response(
      JSON.stringify({ message: 'Costs saved', costs: parsed.data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Failed to save costs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save costs' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
