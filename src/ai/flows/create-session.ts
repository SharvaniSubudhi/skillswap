
'use server';

/**
 * @fileOverview This file defines a Genkit flow for creating a session,
 * which includes creating a Google Calendar event with a Meet link and sending an email notification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';

// Define schemas for tool inputs
const CreateEventInputSchema = z.object({
  summary: z.string().describe('The title of the event.'),
  description: z.string().describe('The description of the event.'),
  attendees: z.array(z.string().email()).describe('A list of attendee emails.'),
  startTime: z.string().datetime().describe('The start time of the event in ISO 8601 format.'),
  endTime: z.string().datetime().describe('The end time of the event in ISO 8601 format.'),
});

const SendEmailInputSchema = z.object({
  to: z.string().email().describe('The recipient\'s email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML body of the email.'),
});

// Define Genkit tools
const createCalendarEvent = ai.defineTool(
  {
    name: 'createCalendarEvent',
    description: 'Creates a Google Calendar event with a Google Meet link.',
    inputSchema: CreateEventInputSchema,
    outputSchema: z.object({
      hangoutLink: z.string().describe('The Google Meet link for the event.'),
      htmlLink: z.string().describe('The link to view the event in Google Calendar.'),
    }),
  },
  async (input) => {
    // In a real app, you'd use OAuth2 to authenticate the user.
    // For this example, we'll use a service account for simplicity.
    // Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment.
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const event = {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: input.endTime,
        timeZone: 'UTC',
      },
      attendees: input.attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `session-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        // @ts-ignore
        resource: event,
        conferenceDataVersion: 1,
      });

      if (!res.data.hangoutLink || !res.data.htmlLink) {
        throw new Error('Failed to create Google Meet link.');
      }

      return {
        hangoutLink: res.data.hangoutLink,
        htmlLink: res.data.htmlLink,
      };
    } catch (e: any) {
      console.error('Error creating calendar event:', e);
      throw new Error('Failed to create calendar event.');
    }
  }
);

const sendEmail = ai.defineTool(
    {
      name: 'sendEmail',
      description: 'Sends an email notification.',
      inputSchema: SendEmailInputSchema,
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
    async (input) => {
      // In a real app, you would integrate a transactional email service (e.g., SendGrid, Mailgun).
      // For this example, we'll just log the email to the console.
      console.log('--- SENDING EMAIL ---');
      console.log('To:', input.to);
      console.log('Subject:', input.subject);
      console.log('Body:', input.body);
      console.log('---------------------');
      
      return {
        success: true,
        message: `Email sent to ${input.to}`,
      };
    }
  );
  

// Define the main flow schema
export const CreateSessionInputSchema = z.object({
  teacher: z.object({ name: z.string(), email: z.string().email() }),
  learner: z.object({ name: z.string(), email: z.string().email() }),
  skill: z.string(),
  sessionDate: z.string().datetime(),
  duration: z.number().describe('Duration in hours'),
});
export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;

export const CreateSessionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  meetLink: z.string().optional(),
  calendarLink: z.string().optional(),
});
export type CreateSessionOutput = z.infer<typeof CreateSessionOutputSchema>;


// Define the main flow
export const createSession = ai.defineFlow(
  {
    name: 'createSessionFlow',
    inputSchema: CreateSessionInputSchema,
    outputSchema: CreateSessionOutputSchema,
    tools: [createCalendarEvent, sendEmail],
  },
  async (input) => {
    const { teacher, learner, skill, sessionDate, duration } = input;
    
    const startTime = new Date(sessionDate);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const eventDetails = {
        summary: `SkillSwap Session: ${skill}`,
        description: `A ${duration}-hour skill swap session for ${skill} between ${teacher.name} (Teacher) and ${learner.name} (Learner).`,
        attendees: [teacher.email, learner.email],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
    };

    const calendarEvent = await createCalendarEvent(eventDetails);

    const emailBody = `
        <h1>SkillSwap Session Confirmed!</h1>
        <p>Your session for <strong>${skill}</strong> is confirmed.</p>
        <p><strong>Teacher:</strong> ${teacher.name}</p>
        <p><strong>Learner:</strong> ${learner.name}</p>
        <p><strong>Time:</strong> ${startTime.toLocaleString()}</p>
        <p>Join the session using this link: <a href="${calendarEvent.hangoutLink}">Google Meet</a></p>
        <p>View the event on your calendar: <a href="${calendarEvent.htmlLink}">Google Calendar</a></p>
    `;

    await sendEmail({
        to: teacher.email,
        subject: `Your SkillSwap session for ${skill} is confirmed!`,
        body: emailBody,
    });
    
    await sendEmail({
        to: learner.email,
        subject: `Your SkillSwap session for ${skill} is confirmed!`,
        body: emailBody,
    });

    return {
      success: true,
      message: 'Session created and notifications sent successfully.',
      meetLink: calendarEvent.hangoutLink,
      calendarLink: calendarEvent.htmlLink,
    };
  }
);
