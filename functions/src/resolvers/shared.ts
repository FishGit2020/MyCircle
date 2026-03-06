import { GraphQLScalarType, Kind } from 'graphql';

// JSON scalar for arbitrary JSON values in GraphQL
function parseLiteralJSON(ast: import('graphql').ValueNode): unknown {
  if (ast.kind === Kind.STRING) return ast.value;
  if (ast.kind === Kind.INT) return parseInt(ast.value, 10);
  if (ast.kind === Kind.FLOAT) return parseFloat(ast.value);
  if (ast.kind === Kind.BOOLEAN) return ast.value;
  if (ast.kind === Kind.NULL) return null;
  if (ast.kind === Kind.LIST) return ast.values.map(parseLiteralJSON);
  if (ast.kind === Kind.OBJECT) {
    const obj: Record<string, unknown> = {};
    for (const field of ast.fields) {
      obj[field.name.value] = parseLiteralJSON(field.value);
    }
    return obj;
  }
  return null;
}

export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral: parseLiteralJSON,
});
