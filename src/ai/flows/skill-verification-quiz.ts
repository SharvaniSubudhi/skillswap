
'use server';

/**
 * @fileOverview Skill verification quiz flow using Gemini.
 *
 * - generateSkillQuiz - Generates a short quiz to verify a user's skill.
 * - GenerateSkillQuizInput - Input type for the flow.
 * - GenerateSkillQuizOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  answer: z
    .string()
    .describe('A brief description of the correct answer or key concepts to look for.'),
});

export const GenerateSkillQuizInputSchema = z.object({
  skillName: z.string().describe('The skill to be verified, e.g., "React" or "Python".'),
});
export type GenerateSkillQuizInput = z.infer<typeof GenerateSkillQuizInputSchema>;

export const GenerateSkillQuizOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('An array of 3 quiz questions.'),
});
export type GenerateSkillQuizOutput = z.infer<typeof GenerateSkillQuizOutputSchema>;

export async function generateSkillQuiz(
  input: GenerateSkillQuizInput
): Promise<GenerateSkillQuizOutput> {
  return generateSkillQuizFlow(input);
}

const skillQuizPrompt = ai.definePrompt({
  name: 'skillQuizPrompt',
  input: { schema: GenerateSkillQuizInputSchema },
  output: { schema: GenerateSkillQuizOutputSchema },
  prompt: `You are an expert interviewer. Your task is to generate a short, 3-question conceptual quiz to verify a user's proficiency in a specific skill.

For the skill: {{{skillName}}}

Generate 3 distinct questions that cover fundamental concepts. For each question, also provide a brief, ideal answer. This is for a self-assessment, so the answers should guide the user.

Return the questions and answers in the required JSON format.
`,
});

const generateSkillQuizFlow = ai.defineFlow(
  {
    name: 'generateSkillQuizFlow',
    inputSchema: GenerateSkillQuizInputSchema,
    outputSchema: GenerateSkillQuizOutputSchema,
  },
  async (input) => {
    const { output } = await skillQuizPrompt(input);
    return output!;
  }
);
