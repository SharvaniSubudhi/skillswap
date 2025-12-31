'use server';

/**
 * @fileOverview This file defines a Genkit flow for automated teacher/learner matching based on skills and availability.
 *
 * The flow takes a user profile as input and returns a list of recommended matches.
 * - recommendMatches - A function that handles the automated matching process.
 * - RecommendMatchesInput - The input type for the recommendMatches function.
 * - RecommendMatchesOutput - The return type for the recommendMatches function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AvailabilitySchema = z.object({
  day: z.string(),
  timeSlot: z.string(),
});

const SkillSchema = z.object({
  skillName: z.string(),
  level: z.enum(['basic', 'intermediate', 'advanced']),
});

const UserProfileSchema = z.object({
  userId: z.string(),
  skillsKnown: z.array(SkillSchema),
  skillsWanted: z.array(SkillSchema),
  availability: z.array(AvailabilitySchema),
  rating: z.number(),
});

export type RecommendMatchesInput = z.object({
  userProfile: UserProfileSchema,
});

export type RecommendMatchesOutput = z.array(z.object({
  userId: z.string(),
  matchScore: z.number().describe('A score indicating the strength of the match.'),
  reason: z.string().describe('Explanation of why this user is a good match'),
}));

export async function recommendMatches(input: RecommendMatchesInput): Promise<RecommendMatchesOutput> {
  return recommendMatchesFlow(input);
}

const recommendMatchesPrompt = ai.definePrompt({
  name: 'recommendMatchesPrompt',
  input: {schema: RecommendMatchesInput},
  output: {schema: z.array(z.object({
    userId: z.string(),
    matchScore: z.number().describe('A score indicating the strength of the match.'),
    reason: z.string().describe('Explanation of why this user is a good match'),
  }))},
  prompt: `You are an AI assistant designed to recommend potential matches between users for skill swapping.

  Given a user's profile, identify other users who might be good matches either as teachers or learners.

  Consider the skills the user knows, the skills they want to learn, their availability, and their rating.

  Prioritize matches where there is a strong overlap between skills known and skills wanted, and where availability aligns.

  Return a list of potential matches, including the user ID of the match, a match score (higher is better), and a brief explanation of why the user is a good match.

  User Profile:
  {{json userProfile}}

  Format your response as a JSON array of objects, where each object has the following structure:
  {
  "userId": "user id",
    "matchScore": 0.8, 
    "reason": "This user knows Javascript and you want to learn Javascript, and they are available on Mondays."
  }
  `,
});

const recommendMatchesFlow = ai.defineFlow(
  {
    name: 'recommendMatchesFlow',
    inputSchema: RecommendMatchesInput,
    outputSchema: RecommendMatchesOutput,
  },
  async input => {
    const {output} = await recommendMatchesPrompt(input);
    return output!;
  }
);
