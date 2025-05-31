// This is a server-side file.
'use server';

/**
 * @fileOverview AI agent that predicts the relevance of an article to the user, based on their reading history.
 *
 * - predictArticleRelevance - A function that predicts the relevance of an article.
 * - PredictArticleRelevanceInput - The input type for the predictArticleRelevance function.
 * - PredictArticleRelevanceOutput - The return type for the predictArticleRelevance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictArticleRelevanceInputSchema = z.object({
  articleContent: z.string().describe('The content of the article to be analyzed.'),
  userReadingHistory: z.string().describe('A summary of the user reading history.'),
});

export type PredictArticleRelevanceInput = z.infer<typeof PredictArticleRelevanceInputSchema>;

const PredictArticleRelevanceOutputSchema = z.object({
  relevanceScore: z
    .number()
    .describe(
      'A score between 0 and 1 indicating the relevance of the article to the user. 0 means not relevant, 1 means highly relevant.'
    ),
  reasoning: z.string().describe('The reasoning behind the relevance score.'),
});

export type PredictArticleRelevanceOutput = z.infer<typeof PredictArticleRelevanceOutputSchema>;

export async function predictArticleRelevance(input: PredictArticleRelevanceInput): Promise<PredictArticleRelevanceOutput> {
  return predictArticleRelevanceFlow(input);
}

const predictArticleRelevancePrompt = ai.definePrompt({
  name: 'predictArticleRelevancePrompt',
  input: {
    schema: PredictArticleRelevanceInputSchema,
  },
  output: {
    schema: PredictArticleRelevanceOutputSchema,
  },
  prompt: `You are an AI assistant that predicts the relevance of an article to a user based on their reading history.

  Analyze the following article content and user reading history to determine how relevant the article is to the user.

  Article Content: {{{articleContent}}}
  User Reading History: {{{userReadingHistory}}}

  Provide a relevance score between 0 and 1 (0 means not relevant, 1 means highly relevant) and explain your reasoning for the score.
  `,
});

const predictArticleRelevanceFlow = ai.defineFlow(
  {
    name: 'predictArticleRelevanceFlow',
    inputSchema: PredictArticleRelevanceInputSchema,
    outputSchema: PredictArticleRelevanceOutputSchema,
  },
  async input => {
    const {output} = await predictArticleRelevancePrompt(input);
    return output!;
  }
);
