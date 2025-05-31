
'use server';
/**
 * @fileOverview AI agent that extracts title and summary from a given URL.
 *
 * - extractArticleInfo - A function that extracts article information.
 * - ExtractArticleInfoInput - The input type for the extractArticleInfo function.
 * - ExtractArticleInfoOutput - The return type for the extractArticleInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractArticleInfoInputSchema = z.object({
  articleUrl: z.string().url().describe('The URL of the article to process.'),
});
export type ExtractArticleInfoInput = z.infer<typeof ExtractArticleInfoInputSchema>;

const ExtractArticleInfoOutputSchema = z.object({
  title: z.string().describe('The extracted title of the article. If extraction fails, this should indicate failure (e.g., "Extraction Failed: URL Inaccessible").'),
  summary: z.string().describe('A concise summary of the article content. If extraction fails, this should explain the issue (e.g., "Could not access or process the content at the provided URL.").'),
});
export type ExtractArticleInfoOutput = z.infer<typeof ExtractArticleInfoOutputSchema>;

export async function extractArticleInfo(input: ExtractArticleInfoInput): Promise<ExtractArticleInfoOutput> {
  return extractArticleInfoFlow(input);
}

const extractArticleInfoPrompt = ai.definePrompt({
  name: 'extractArticleInfoPrompt',
  input: {schema: ExtractArticleInfoInputSchema},
  output: {schema: ExtractArticleInfoOutputSchema},
  prompt: `You are an expert at extracting information from web pages.
Given the following URL, please extract the main title of the article and provide a concise summary (2-3 sentences) of its content.

Article URL: {{{articleUrl}}}

Your response MUST conform to the output schema.
If you cannot access the URL or extract the information, you MUST still provide a title and summary. In such cases, use a title like "Extraction Failed: URL Inaccessible" or "Extraction Failed: Content Unsuitable" and a summary explaining the issue (e.g., "Could not access or process the content at the provided URL.").
`,
});

const extractArticleInfoFlow = ai.defineFlow(
  {
    name: 'extractArticleInfoFlow',
    inputSchema: ExtractArticleInfoInputSchema,
    outputSchema: ExtractArticleInfoOutputSchema,
  },
  async (input) => {
    const {output} = await extractArticleInfoPrompt(input);
    // Genkit ensures 'output' conforms to 'ExtractArticleInfoOutputSchema' if the LLM successfully responds.
    // If 'output' is null or undefined, it means the LLM call itself failed or did not produce structured output,
    // which Genkit's 'generate' would typically throw an error for, or the prompt layer would.
    // So, if we reach here, 'output' should be valid according to the schema.
    if (!output) {
        // This case should ideally be rare if the LLM and Genkit are working correctly.
        // It implies a more fundamental issue with the LLM call or output parsing.
        return {
            title: "Extraction Failed: Model Error",
            summary: "The AI model encountered an error and could not process the URL.",
        };
    }
    return output;
  }
);
