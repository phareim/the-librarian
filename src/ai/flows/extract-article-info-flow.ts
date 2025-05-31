
'use server';
/**
 * @fileOverview AI agent that extracts title, summary, and a relevant image URL from a given URL.
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
  imageUrl: z.string().url().nullable().optional().describe('The full URL of the most relevant image from the article. Returns null or is omitted if no suitable image is found or if extraction fails.'),
  dataAiHint: z.string().max(50).nullable().optional().describe('One or two keywords describing the image or article content (e.g., "technology abstract", "mountain landscape"). Used for placeholder image services. If extraction fails, use a generic hint like "content error". Maximum 50 characters.'),
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
Given the following URL, please extract:
1. The main title of the article.
2. A concise summary (2-3 sentences) of its content.
3. The full URL of the most prominent and relevant image in the article (e.g., the main article image or a header image). If no suitable image is found, or if you cannot access image URLs, omit the imageUrl field or set it to null.
4. One or two keywords (e.g., 'technology abstract', 'mountain landscape') for dataAiHint based on the image content. If no image is found, base the hint on the article's main topic. If the extraction fails entirely, use a generic hint like 'content error'.

Article URL: {{{articleUrl}}}

Your response MUST conform to the output schema.
If you cannot access the URL or extract the title and summary, you MUST still provide a title and summary. In such cases, use a title like "Extraction Failed: URL Inaccessible" or "Extraction Failed: Content Unsuitable" and a summary explaining the issue (e.g., "Could not access or process the content at the provided URL."). In these failure cases, imageUrl should be null or omitted, and dataAiHint should reflect the error or be generic.
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
    if (!output) {
        // This case implies a more fundamental issue with the LLM call or output parsing.
        return {
            title: "Extraction Failed: Model Error",
            summary: "The AI model encountered an error and could not process the URL.",
            imageUrl: null,
            dataAiHint: "model error",
        };
    }
    // Ensure the output conforms, especially for optional fields if the model omits them.
    // Zod's schema parsing should handle this based on `optional()` and `nullable()`.
    // If title indicates failure, ensure dataAiHint is generic if not already set by AI for failure.
    if (output.title.toLowerCase().includes("extraction failed") && !output.dataAiHint) {
        return {
            ...output,
            imageUrl: output.imageUrl === undefined ? null : output.imageUrl, // ensure null if undefined
            dataAiHint: "extraction error",
        };
    }
    return {
        ...output,
        imageUrl: output.imageUrl === undefined ? null : output.imageUrl, // ensure null if undefined
        dataAiHint: output.dataAiHint === undefined ? (output.title.toLowerCase().includes("extraction failed") ? "extraction error" : "web content") : output.dataAiHint,
    };
  }
);
