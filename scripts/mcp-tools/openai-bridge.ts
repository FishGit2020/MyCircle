import { z } from 'zod';
import type { ToolDef } from './mfe-tools.js';

/**
 * Bridge: converts Zod-based tool definitions to OpenAI chat completion tool format.
 *
 * Parallel to gemini-bridge.ts — used when routing AI chat to an
 * OpenAI-compatible provider (e.g., Ollama with qwen2.5).
 */

interface JSONSchema {
  type: string;
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: string[];
}

interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JSONSchema;
  };
}

/**
 * Convert a Zod schema to a JSON Schema object (subset used by OpenAI function calling).
 * Supports: z.string(), z.number(), z.boolean(), z.array(), z.object(), z.optional(), z.enum()
 */
function zodToJSONSchema(schema: z.ZodTypeAny): JSONSchema {
  // Unwrap optional/nullable
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodToJSONSchema(schema.unwrap());
  }

  if (schema instanceof z.ZodString) {
    return {
      type: 'string',
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  if (schema instanceof z.ZodNumber) {
    return {
      type: 'number',
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  if (schema instanceof z.ZodBoolean) {
    return {
      type: 'boolean',
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToJSONSchema(schema.element),
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema.options as string[],
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJSONSchema(value);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      ...(Object.keys(properties).length > 0 ? { properties } : {}),
      ...(required.length > 0 ? { required } : {}),
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Fallback
  return { type: 'string' };
}

/**
 * Convert an array of ToolDefs to OpenAI chat completion tool format.
 * Use with the `openai` SDK's `chat.completions.create({ tools })`.
 */
export function toOpenAITools(tools: ToolDef[]): OpenAITool[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJSONSchema(tool.parameters),
    },
  }));
}
