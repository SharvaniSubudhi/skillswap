
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating user recommendations.
 * - getRecommendations - A function that recommends teachers based on a learner's wanted skills.
 * - GetRecommendationsInput - The input type for the getRecommendations function.
 * - GetRecommendationsOutput - The return type for the getRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SkillSchema = z.object({
    skillName: z.string(),
    level: z.enum(['basic', 'intermediate', 'advanced']),
    isVerified: z.boolean().optional(),
});

const WantedSkillSchema = z.object({
    skillName: z.string(),
});

const AvailabilitySchema = z.object({
  day: z.string(),
  timeSlot: z.string(),
});

const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  skillsKnown: z.array(SkillSchema),
  skillsWanted: z.array(WantedSkillSchema),
  availability: z.array(AvailabilitySchema),
  rating: z.number(),
  status: z.string(),
  avatarUrl: z.string(),
  badges: z.array(z.string()),
});

export const GetRecommendationsInputSchema = z.object({
  currentUser: UserProfileSchema,
  allUsers: z.array(UserProfileSchema),
});
export type GetRecommendationsInput = z.infer<typeof GetRecommendationsInputSchema>;

export const GetRecommendationsOutputSchema = z.array(UserProfileSchema);
export type GetRecommendationsOutput = z.infer<typeof GetRecommendationsOutputSchema>;


export async function getRecommendations(input: GetRecommendationsInput): Promise<GetRecommendationsOutput> {
    return getRecommendationsFlow(input);
}


const recommendationPrompt = ai.definePrompt({
    name: 'recommendationPrompt',
    input: { schema: GetRecommendationsInputSchema },
    output: { schema: GetRecommendationsOutputSchema },
    prompt: `You are a recommendation engine for a skill-sharing app.
Your goal is to recommend users (teachers) to the current user (learner) based on the skills they want to learn.

Here is the current user's profile:
{{json currentUser}}

Here is the list of all users in the platform:
{{json allUsers}}

Please return a list of recommended users.
The PERFECT MATCH is a user who:
1. Knows a skill that the current user wants to learn.
2. Has that skill VERIFIED (skillsKnown[].isVerified is true). This is the most important factor.
3. Is available.

Rank the recommended users based on the number of matching verified skills. If there's a tie, higher rating is better.
Return ONLY the user objects of the recommended users, in the ranked order. Do not include the current user in the recommendations.
Your output should be a valid JSON array of user profiles.
`,
});


const getRecommendationsFlow = ai.defineFlow(
    {
        name: 'getRecommendationsFlow',
        inputSchema: GetRecommendationsInputSchema,
        outputSchema: GetRecommendationsOutputSchema,
    },
    async (input) => {
        const { output } = await recommendationPrompt(input);
        return output || [];
    }
);
