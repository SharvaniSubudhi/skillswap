
'use server';

/**
 * @fileOverview Skill verification quiz flow using Gemini.
 *
 * - generateSkillQuiz - Generates a 10-question multiple-choice quiz to verify a user's skill.
 * - GenerateSkillQuizInput - Input type for the flow.
 * - GenerateSkillQuizOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z
    .array(z.string())
    .length(4)
    .describe('An array of 4 possible answers.'),
  correctAnswerIndex: z
    .number()
    .min(0)
    .max(3)
    .describe('The index (0-3) of the correct answer in the options array.'),
});

const GenerateSkillQuizInputSchema = z.object({
  skillName: z.string().describe('The skill to be verified, e.g., "React" or "Python".'),
  level: z.enum(['basic', 'intermediate', 'advanced']).describe('The claimed skill level of the user.'),
});
export type GenerateSkillQuizInput = z.infer<typeof GenerateSkillQuizInputSchema>;

const GenerateSkillQuizOutputSchema = z.object({
  questions: z
    .array(QuestionSchema)
    .length(10)
    .describe('An array of 10 multiple-choice quiz questions.'),
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
  prompt: `You are an expert interviewer. Your task is to generate a 10-question multiple-choice quiz to verify a user's proficiency in a specific skill at a given level.

For the skill: {{{skillName}}}
At the level: {{{level}}}

Generate 10 distinct multiple-choice questions that cover fundamental concepts appropriate for that skill and level. Each question must have exactly 4 options.

For each question, identify the index of the correct answer (from 0 to 3).

Return the questions, options, and correct answer index in the required JSON format.
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
