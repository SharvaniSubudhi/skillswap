'use server';

/**
 * @fileOverview Skill level verification flow using Gemini to assess user skills.
 *
 * - verifySkillLevel - A function that verifies the skill level of a user.
 * - SkillLevelVerificationInput - The input type for the verifySkillLevel function.
 * - SkillLevelVerificationOutput - The return type for the verifySkillLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SkillLevelVerificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose skill is being verified.'),
  skill: z.string().describe('The skill to be verified (e.g., React, Python).'),
  level: z
    .enum(['basic', 'intermediate', 'advanced'])
    .describe('The claimed skill level (basic, intermediate, or advanced).'),
});
export type SkillLevelVerificationInput = z.infer<typeof SkillLevelVerificationInputSchema>;

const SkillLevelVerificationOutputSchema = z.object({
  testResult: z
    .enum(['pending', 'passed', 'failed'])
    .describe('The result of the skill verification test.'),
  feedback: z.string().describe('Feedback from the Gemini model on the skill level.'),
});
export type SkillLevelVerificationOutput = z.infer<typeof SkillLevelVerificationOutputSchema>;

export async function verifySkillLevel(input: SkillLevelVerificationInput): Promise<SkillLevelVerificationOutput> {
  return verifySkillLevelFlow(input);
}

const skillVerificationPrompt = ai.definePrompt({
  name: 'skillVerificationPrompt',
  input: {schema: SkillLevelVerificationInputSchema},
  output: {schema: SkillLevelVerificationOutputSchema},
  prompt: `You are an expert skill assessor. Given a user's claimed skill and level, you will assess whether the user's claimed skill level is accurate.

  User ID: {{{userId}}}
  Skill: {{{skill}}}
  Claimed Level: {{{level}}}

  Respond with a testResult of 'passed' or 'failed'. Provide specific feedback to the user explaining your assessment.
  Considerations:
  - A "basic" level indicates foundational knowledge and the ability to perform simple tasks.
  - An "intermediate" level suggests a solid understanding and the ability to handle moderately complex tasks.
  - An "advanced" level implies mastery and the ability to tackle highly complex and novel problems.
  - Consider the specific skill, and determine reasonable expectations for each level.
  `,
});

const verifySkillLevelFlow = ai.defineFlow(
  {
    name: 'verifySkillLevelFlow',
    inputSchema: SkillLevelVerificationInputSchema,
    outputSchema: SkillLevelVerificationOutputSchema,
  },
  async input => {
    const {output} = await skillVerificationPrompt(input);
    return output!;
  }
);
