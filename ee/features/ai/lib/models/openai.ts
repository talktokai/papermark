import { OpenAI } from "openai";

/**
 * OpenAI client, constructed on first use.
 *
 * The SDK's constructor throws when the API key is missing or empty, and Next
 * evaluates route modules while collecting page data during `next build`. A
 * client built at module scope therefore breaks the build of any deployment
 * that has no OpenAI key — including self-hosted ones that never use the AI
 * features. Deferring construction keeps the build free of that requirement
 * while still failing loudly at the point an AI route is actually called.
 */
let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
};

export const openai = new Proxy({} as OpenAI, {
  get(_target, property, receiver) {
    return Reflect.get(getClient(), property, receiver);
  },
  has(_target, property) {
    return Reflect.has(getClient(), property);
  },
});
