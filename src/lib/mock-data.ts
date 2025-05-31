import type { Article, Tag } from '@/types';

export const MOCK_TAGS: Tag[] = [
  { id: 'webdev', name: 'Web Development' },
  { id: 'machinelearning', name: 'Machine Learning' },
  { id: 'nextjs', name: 'Next.js' },
  { id: 'uidesign', name: 'UI Design' },
  { id: 'career', name: 'Career' },
  { id: 'research', name: 'Research' },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Future of Web Development with Next.js 15',
    url: 'https://example.com/nextjs-15',
    sourceName: 'Tech Trends Weekly',
    summary: 'An in-depth look at the new features in Next.js 15 and how they are shaping the future of web development. Explores server components, improved build times, and new routing capabilities.',
    content: `
# The Future of Web Development with Next.js 15

Next.js continues to push the boundaries of web development, and version 15 is no exception. This release brings a host of new features and improvements designed to enhance developer experience and application performance.

## Key Features

### Advanced Server Components
Server Components are now more powerful and easier to use, allowing for more efficient data fetching and rendering strategies.

### Blazing Fast Build Times
The build process has been significantly optimized, leading to faster deployments and a more streamlined development workflow.

### Enhanced Routing Capabilities
The App Router introduced in previous versions has received further enhancements, offering more flexibility and control over application routing.

## Impact on Developers
These changes mean developers can build more complex and performant applications with less boilerplate and configuration. The focus on developer experience ensures that Next.js remains a top choice for modern web projects.

Stay tuned for more updates as Next.js 15 rolls out!
    `,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'technology coding',
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
    dateAdded: new Date(2023, 10, 15).toISOString(),
    isRead: false,
  },
  {
    id: '2',
    title: 'Understanding Large Language Models',
    url: 'https://example.com/llms-explained',
    sourceName: 'AI Insights',
    summary: 'A comprehensive guide to understanding how Large Language Models (LLMs) work, their applications, and their ethical implications. Covers transformers, training data, and potential biases.',
    content: `
# Understanding Large Language Models

Large Language Models (LLMs) have taken the world by storm. From chatbots to code generation, their capabilities are vast. But how do they actually work?

## Core Concepts

### Transformers
At the heart of most modern LLMs is the transformer architecture, which allows models to process sequences of text with attention mechanisms.

### Training Data
LLMs are trained on massive datasets of text and code. The quality and diversity of this data significantly impact the model's performance and potential biases.

### Ethical Considerations
As LLMs become more powerful, it's crucial to address the ethical implications, including bias, misinformation, and job displacement.

## Applications
LLMs are being used in a wide range of applications, including:
- Natural Language Understanding and Generation
- Code Completion and Generation
- Translation
- Summarization

The field is rapidly evolving, and understanding these models is key to harnessing their potential responsibly.
    `,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'artificial intelligence',
    tags: [MOCK_TAGS[1]],
    dateAdded: new Date(2023, 11, 1).toISOString(),
    isRead: true,
  },
  {
    id: '3',
    title: 'Mastering Productivity: Tips and Tricks for Modern Professionals',
    url: 'https://example.com/productivity-hacks',
    sourceName: 'Work Smarter',
    summary: 'Discover effective strategies and tools to boost your productivity in today\'s fast-paced world. From time management techniques to leveraging technology for efficiency.',
    content: `
# Mastering Productivity

In an era of constant connectivity and information overload, mastering productivity is more important than ever. This guide offers actionable tips and tricks for modern professionals.

## Time Management
- **The Pomodoro Technique:** Work in focused 25-minute intervals with short breaks.
- **Eisenhower Matrix:** Prioritize tasks based on urgency and importance.

## Tools and Technology
- **Task Management Apps:** Utilize tools like Todoist, Asana, or Trello.
- **Calendar Blocking:** Schedule specific blocks of time for tasks.

## Mindset
- **Minimize Distractions:** Create a focused work environment.
- **Set Clear Goals:** Define what you want to achieve daily and weekly.

By implementing these strategies, you can significantly enhance your focus and achieve more.
    `,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'office work',
    tags: [MOCK_TAGS[4]],
    dateAdded: new Date(2024, 0, 5).toISOString(),
    isRead: false,
  },
];

export const USER_READING_HISTORY = "The user has shown interest in articles about Next.js, web development, artificial intelligence, large language models, and productivity techniques. They prefer in-depth technical content and practical guides.";
