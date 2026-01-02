
'use server';

/**
 * @fileOverview This file defines a Genkit flow for requesting a skill swap session.
 * It simulates sending an email to the teacher for them to accept or decline.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This file is now simplified. The email sending logic is removed
// as it requires a proper transactional email service setup which is beyond
// the scope of this example. The front-end will handle the creation of the
// 'requested' session document directly.

// Input schema for the main flow
const RequestSessionInputSchema = z.object({
  teacher: z.object({ name: z.string(), email: z.string().email() }),
  learner: z.object({ name: z.string(), email: z.string().email(), id: z.string() }),
  skill: z.string(),
  sessionDetails: z.string().describe('The day and time slot for the session.'),
  sessionId: z.string(),
});
export type RequestSessionInput = z.infer<typeof RequestSessionInputSchema>;

// Output schema for the main flow
const RequestSessionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type RequestSessionOutput = z.infer<typeof RequestSessionOutputSchema>;

// The main flow for requesting a session
const requestSessionFlow = ai.defineFlow(
  {
    name: 'requestSessionFlow',
    inputSchema: RequestSessionInputSchema,
    outputSchema: RequestSessionOutputSchema,
  },
  async (input) => {
    // The email tool has been removed. 
    // In a real application, you would integrate a service like SendGrid here.
    console.log(`--- SESSION REQUEST (ID: ${input.sessionId}) ---`);
    console.log(`From: ${input.learner.name} (${input.learner.email})`);
    console.log(`To: ${input.teacher.name} (${input.teacher.email})`);
    console.log(`Skill: ${input.skill} at ${input.sessionDetails}`);
    console.log('---------------------------------');

    return {
      success: true,
      message: 'Session requested successfully. The teacher has been notified (simulation).',
    };
  }
);

export async function requestSession(input: RequestSessionInput): Promise<RequestSessionOutput> {
    return requestSessionFlow(input);
}
