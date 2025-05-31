
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
  async (input): Promise<ExtractArticleInfoOutput> => {
    const llmResponse = await extractArticleInfoPrompt(input);
    const rawOutput = llmResponse.output;

    if (!rawOutput) {
        return {
            title: "Extraction Failed: Model Error",
            summary: "The AI model encountered an error and could not process the URL.",
            imageUrl: null,
            dataAiHint: "model error",
        };
    }

    const finalOutput: ExtractArticleInfoOutput = {
        title: rawOutput.title,
        summary: rawOutput.summary,
        imageUrl: undefined, 
        dataAiHint: undefined,
    };

    // Process imageUrl
    if (rawOutput.imageUrl === null) {
        finalOutput.imageUrl = null;
    } else if (typeof rawOutput.imageUrl === 'string' && rawOutput.imageUrl.trim() !== '') {
        try {
            // Validate if it's a URL structure. z.string().url() in the prompt's output schema
            // guides the LLM, but this is a fallback check.
            new URL(rawOutput.imageUrl);
            finalOutput.imageUrl = rawOutput.imageUrl;
        } catch (e) {
            // If AI returns a string that's not a valid URL, treat as no image found.
            finalOutput.imageUrl = null;
        }
    } else {
        // If imageUrl is undefined or an empty string from rawOutput
        finalOutput.imageUrl = null;
    }

    // Process dataAiHint
    if (rawOutput.dataAiHint === null) {
        // If AI explicitly returns null, respect it for now, default logic below will handle it
        finalOutput.dataAiHint = null;
    } else if (typeof rawOutput.dataAiHint === 'string' && rawOutput.dataAiHint.trim() !== '') {
        finalOutput.dataAiHint = rawOutput.dataAiHint.substring(0, 50);
    } else {
        // If dataAiHint is undefined or an empty string
        finalOutput.dataAiHint = undefined; 
    }
    
    const titleIndicatesFailure = finalOutput.title.toLowerCase().includes("extraction failed");

    // Set default for dataAiHint if it's still undefined or null
    if (finalOutput.dataAiHint === undefined || finalOutput.dataAiHint === null) {
        finalOutput.dataAiHint = titleIndicatesFailure ? "extraction error" : "web content";
    }

    // If title indicates failure and imageUrl wasn't explicitly set to null by AI, make it null.
    if (titleIndicatesFailure && finalOutput.imageUrl === undefined) {
        finalOutput.imageUrl = null;
    }
    
    // Ensure imageUrl is null if it ended up undefined (and not a failure case that already set it to null)
    if (finalOutput.imageUrl === undefined) {
        finalOutput.imageUrl = null;
    }
    
    // Ensure dataAiHint is a string (it should be by now)
    if (finalOutput.dataAiHint === undefined || finalOutput.dataAiHint === null) {
         finalOutput.dataAiHint = "general content"; // Ultimate fallback
    }

    return finalOutput;
  }
);
