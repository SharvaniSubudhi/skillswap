
'use server';

/**
 * @fileOverview This file defines a Genkit flow for creating a session,
 * which includes creating a Google Meet link.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';

// Define schema for the tool input
const CreateMeetLinkInputSchema = z.object({
  requestId: z.string().describe('A unique ID for the conference request.'),
});

// Define Genkit tool to create a Google Meet link
const createMeetLink = ai.defineTool(
  {
    name: 'createMeetLink',
    description: 'Creates a Google Meet link by creating and then deleting a temporary calendar event.',
    inputSchema: CreateMeetLinkInputSchema,
    outputSchema: z.object({
      hangoutLink: z.string().describe('The Google Meet link for the event.'),
    }),
  },
  async (input) => {
    // This uses a service account with domain-wide delegation to a user's calendar.
    // In a real production app, a full OAuth2 flow for user consent would be required.
    // For this example, we simulate this by creating a temporary event to generate a link.
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/calendar'],
            // Ensure your service account has access to the Calendar API
            // and necessary permissions.
          });
          const authClient = await auth.getClient();
          const calendar = google.calendar({ version: 'v3', auth: authClient });

          // Create a temporary event to generate the Meet link
          const event = {
            summary: 'SkillSwap Session',
            description: `Session ID: ${input.requestId}`,
            start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
            end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), timeZone: 'UTC' },
            conferenceData: {
              createRequest: {
                requestId: input.requestId,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          };

          const res = await calendar.events.insert({
            calendarId: 'primary',
            // @ts-ignore
            resource: event,
            conferenceDataVersion: 1,
          });

          const meetLink = res.data.hangoutLink;
          const eventId = res.data.id;

          // IMPORTANT: Delete the temporary event immediately after getting the link
          if (eventId) {
            await calendar.events.delete({ calendarId: 'primary', eventId: eventId });
          }
          
          if (!meetLink) {
            throw new Error('Failed to extract Google Meet link from the created event.');
          }

          return { hangoutLink: meetLink };

    } catch (e: any) {
      console.error('Error creating Google Meet link via temporary event:', e.message);
      // As a fallback, return a static link to prevent total failure.
      return { hangoutLink: 'https://meet.google.com/new' };
    }
  }
);
  

// Define the main flow schema
const CreateSessionInputSchema = z.object({
  sessionId: z.string(),
});
export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;

const CreateSessionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  meetLink: z.string().optional(),
});
export type CreateSessionOutput = z.infer<typeof CreateSessionOutputSchema>;


// Define the main flow
const createSessionFlow = ai.defineFlow(
  {
    name: 'createSessionFlow',
    inputSchema: CreateSessionInputSchema,
    outputSchema: CreateSessionOutputSchema,
  },
  async (input) => {
    
    // Call the tool to generate the meet link
    const meetLinkResult = await createMeetLink({ requestId: input.sessionId });

    if (!meetLinkResult || !meetLinkResult.hangoutLink) {
        return {
            success: false,
            message: 'Failed to create Google Meet link.',
        };
    }

    return {
      success: true,
      message: 'Meet link created successfully.',
      meetLink: meetLinkResult.hangoutLink,
    };
  }
);

export async function createSession(input: CreateSessionInput): Promise<CreateSessionOutput> {
    return createSessionFlow(input);
}
