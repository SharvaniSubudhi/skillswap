
'use server';

/**
 * @fileOverview This file defines a Genkit flow for creating a session,
 * which includes creating a Google Meet link. This flow ensures only one
 * link is ever created per session using a "get-or-create" pattern.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/server-init';

// Define schema for the tool input
const CreateMeetLinkInputSchema = z.object({
  requestId: z.string().describe('A unique ID for the conference request.'),
});

// Define Genkit tool to create a Google Meet link
const createMeetLink = ai.defineTool(
  {
    name: 'createMeetLink',
    description: 'Creates a Google Meet link for a session.',
    inputSchema: CreateMeetLinkInputSchema,
    outputSchema: z.object({
      hangoutLink: z.string().describe('The Google Meet link for the event.'),
    }),
  },
  async (input) => {
    try {
      // Use Application Default Credentials.
      // In a Google Cloud environment, 'googleapis' will automatically find the service account.
      const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      const authClient = await auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });

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
        resource: event,
        conferenceDataVersion: 1,
      });

      const meetLink = res.data.hangoutLink;

      if (!meetLink) {
        throw new Error('Failed to extract Google Meet link from the created event.');
      }

      return { hangoutLink: meetLink };

    } catch (e: any) {
      console.error('Error creating Google Meet link:', e.message);
      // In case of an API error, we must throw to prevent inconsistent states.
      throw new Error('Could not create Google Meet link via API. Please check service account permissions and ensure the Google Calendar API is enabled.');
    }
  }
);
  

// Define the main flow schema
const CreateSessionInputSchema = z.object({
  sessionId: z.string(),
  userId: z.string(), // ID of the user requesting the link
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
    const { sessionId, userId } = input;
    const sessionRef = doc(firestore, 'sessions', sessionId);

    try {
      // ATOMIC GET-OR-CREATE LOGIC
      // 1. Get the latest session data from Firestore.
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        throw new Error('Session document not found.');
      }

      const sessionData = sessionSnap.data();

      // 2. If a link already exists, return it immediately.
      if (sessionData.googleMeetLink) {
        return {
          success: true,
          message: 'Meet link already exists.',
          meetLink: sessionData.googleMeetLink,
        };
      }

      // 3. If no link, check if the current user is the teacher. Only teachers can create links.
      if (sessionData.teacherId !== userId) {
        return {
            success: false,
            message: 'Waiting for the teacher to start the session and create the link.',
            meetLink: undefined,
        };
      }
      
      // 4. If link doesn't exist and user is teacher, create it.
      const meetLinkResult = await createMeetLink({ requestId: sessionId });

      if (!meetLinkResult || !meetLinkResult.hangoutLink) {
          throw new Error('Tool did not return a Google Meet link.');
      }

      // 5. Atomically save the new link back to the document.
      await updateDoc(sessionRef, {
        googleMeetLink: meetLinkResult.hangoutLink,
        status: 'ongoing', // Also update the status
      });

      // 6. Return the newly created link.
      return {
        success: true,
        message: 'Meet link created successfully.',
        meetLink: meetLinkResult.hangoutLink,
      };

    } catch (error: any) {
        console.error(`[createSessionFlow] Error for session ${sessionId}:`, error.message);
        return {
            success: false,
            message: error.message || 'An unexpected error occurred.',
            meetLink: undefined,
        };
    }
  }
);

export async function createSession(input: CreateSessionInput): Promise<CreateSessionOutput> {
    return createSessionFlow(input);
}
