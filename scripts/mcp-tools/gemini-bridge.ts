import { z } from 'zod';
import type { ToolDef } from './mfe-tools.js';

/**
 * Bridge: converts Zod-based tool definitions to Gemini FunctionDeclaration format.
 *
 * The Google Gemini SDK uses its own schema format (Type.STRING, Type.OBJECT, etc.).
 * This bridge converts our Zod schemas into that format, eliminating the need
 * to maintain duplicate declarations in server/index.ts and functions/src/index.ts.
 */

// Gemini Type enum values (from @google/genai)
// We use string literals to avoid importing the SDK at module level
const GeminiType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

type GeminiSchemaType = (typeof GeminiType)[keyof typeof GeminiType];

interface GeminiSchema {
  type: GeminiSchemaType;
  description?: string;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
  enum?: string[];
}

interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: GeminiSchema;
}

/**
 * Convert a Zod schema to a Gemini parameter schema.
 * Supports: z.string(), z.number(), z.boolean(), z.array(), z.object(), z.optional(), z.enum()
 */
function zodToGeminiSchema(schema: z.ZodTypeAny): GeminiSchema {
  // Unwrap optional/nullable
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodToGeminiSchema(schema.unwrap());
  }

  // String
  if (schema instanceof z.ZodString) {
    return {
      type: GeminiType.STRING,
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Number
  if (schema instanceof z.ZodNumber) {
    return {
      type: GeminiType.NUMBER,
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Boolean
  if (schema instanceof z.ZodBoolean) {
    return {
      type: GeminiType.BOOLEAN,
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Array
  if (schema instanceof z.ZodArray) {
    return {
      type: GeminiType.ARRAY,
      items: zodToGeminiSchema(schema.element),
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Enum
  if (schema instanceof z.ZodEnum) {
    return {
      type: GeminiType.STRING,
      enum: schema.options as string[],
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Object
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, GeminiSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToGeminiSchema(value);
      // If not optional, it's required
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: GeminiType.OBJECT,
      ...(Object.keys(properties).length > 0 ? { properties } : {}),
      ...(required.length > 0 ? { required } : {}),
      ...(schema.description ? { description: schema.description } : {}),
    };
  }

  // Fallback for unknown types
  return { type: GeminiType.STRING };
}

/**
 * Convert an array of ToolDefs to Gemini FunctionDeclaration format.
 * Use this in server/index.ts and functions/src/index.ts to replace inline declarations.
 */
export function toGeminiFunctionDeclarations(tools: ToolDef[]): GeminiFunctionDeclaration[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: zodToGeminiSchema(tool.parameters),
  }));
}
