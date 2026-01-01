
'use server';

/**
 * @fileOverview This file defines a Genkit flow for requesting a skill swap session.
 * It simulates sending an email to the teacher for them to accept or decline.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for sending an email
const SendEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML body of the email.'),
});

// Tool to "send" an email (logs to console for this example)
const sendEmail = ai.defineTool(
  {
    name: 'sendSessionRequestEmail',
    description: 'Sends an email notification for a session request.',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    // In a real app, you would integrate a transactional email service.
    console.log('--- SENDING SESSION REQUEST EMAIL ---');
    console.log('To:', input.to);
    console.log('Subject:', input.subject);
    console.log('Body:', input.body);
    console.log('---------------------------------');

    return {
      success: true,
      message: `Session request email sent to ${input.to}`,
    };
  }
);

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
    tools: [sendEmail],
  },
  async (input) => {
    const { teacher, learner, skill, sessionDetails, sessionId } = input;

    const emailBody = `
      <h1>New SkillSwap Session Request!</h1>
      <p><strong>${learner.name}</strong> has requested a session with you.</p>
      <p><strong>Skill:</strong> ${skill}</p>
      <p><strong>When:</strong> ${sessionDetails}</p>
      <p>Please log in to your SkillSwap dashboard to accept or decline this request (Session ID: ${sessionId}).</p>
      <p><em>(In a real app, this email would contain unique accept/decline links that trigger an API.)</em></p>
    `;

    await sendEmail({
      to: teacher.email,
      subject: `New SkillSwap Request from ${learner.name} for ${skill}`,
      body: emailBody,
    });

    return {
      success: true,
      message: 'Session requested successfully. The teacher has been notified.',
    };
  }
);

export async function requestSession(input: RequestSessionInput): Promise<RequestSessionOutput> {
    return requestSessionFlow(input);
}

    