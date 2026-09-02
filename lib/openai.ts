import OpenAI from "openai";

/**
 * OpenAI API client, constructed on first use.
 *
 * The SDK's constructor throws when the API key is missing or empty (an empty
 * string is not a valid key), so building it at module scope would break
 * `next build` for deployments without an OpenAI key the moment anything
 * imports this file. See ee/features/ai/lib/models/openai.ts for the client
 * the AI features actually use.
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
