/**
 * @fileoverview Generates the API **reference** section of the Diataxis documentation set.
 *
 * The generator reads `api.yaml` (the OpenAPI 3.0 contract that is also the runtime
 * authorization matrix) and produces Markdown reference pages under `docs/reference/api/`:
 *
 * - `index.md`                    : hub + compact table of every documented operation.
 * - `<resource>.md`               : one page per top level resource, with full operation detail
 *                                  (description, parameters, request body, responses).
 * - `rbac-matrix.md`              : role -> allowed operations matrix, mirroring how
 *                                  `src/middlewares/auth.middleware.ts` derives roles from tags.
 * - `spec-vs-implementation.md`   : drift report between the contract and the Express router tree.
 *
 * The drift report works by statically scanning `src/app.ts` plus every route module under
 * `src/routes`, resolving `app.use(prefix, identifier)` and `router.use(sub, identifier)`
 * mounts against the import statements in those files, and collecting `router.method(path)` calls.
 *
 * This script provides:
 * - Deterministic, sorted Markdown output (stable diffs in git).
 * - `$ref` resolution into `components` so pages read standalone.
 * - A "generated file" banner with the git commit used, so stale pages are obvious in review.
 *
 * @module updateDocs
 * @requires fs
 * @requires path
 * @requires yaml
 *
 * @example
 * ```bash
 * npm run update-docs
 * # or
 * npx tsx updateDocs.ts
 * ```
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { execSync } from 'child_process';

const API_SPEC_FILE = 'api.yaml';
const APP_FILE = 'src/app.ts';
const ROUTES_DIR = 'src/routes';
const DOCS_DIR = 'docs/reference/api';

/** HTTP methods that may appear as keys in an OpenAPI `paths` object. */
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

/** Methods that Express route files may register. */
const ROUTER_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'all'];

/**
 * Read and parse the OpenAPI specification.
 *
 * @returns {any} Parsed OpenAPI document
 */
function loadSpec(): any {
  return yaml.parse(fs.readFileSync(API_SPEC_FILE, 'utf8'));
}

/**
 * Resolve a local `$ref` pointer (`#/components/...`) against the specification.
 *
 * Local pointers only: external references are not supported by design, the contract
 * is meant to be a single self contained file.
 *
 * @param root - Whole specification document
 * @param ref - Reference string, e.g. `#/components/schemas/Simlet`
 * @returns {any} The referenced value, or `undefined` when the pointer cannot be resolved
 */
function resolveRef(root: any, ref: string): any {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) {
    return undefined;
  }
  const segments = ref
    .slice(2)
    .split('/')
    .map((segment: string) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = root;
  for (const segment of segments) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/**
 * Resolve every `$ref` found in a value, one level deep.
 *
 * @param root - Whole specification document
 * @param value - Any value taken from the specification
 * @returns {any} Value with local references inlined
 */
function deref(root: any, value: any): any {
  if (Array.isArray(value)) {
    return value.map((entry: any) => deref(root, entry));
  }
  if (value && typeof value === 'object') {
    if (typeof value.$ref === 'string') {
      const target = resolveRef(root, value.$ref);
      return target === undefined ? value : deref(root, target);
    }
    const out: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = deref(root, entry);
    }
    return out;
  }
  return value;
}

/**
 * Flatten a (possibly `$ref`ed) schema into a short human readable type description.
 *
 * @param root - Whole specification document
 * @param schema - Schema object, possibly a `$ref`
 * @returns {string} Type description such as `object` or `array<string>`
 */
function describeType(root: any, schema: any): string {
  if (!schema) {
    return 'unknown';
  }
  const resolved = deref(root, schema);
  if (!resolved || typeof resolved !== 'object') {
    return 'unknown';
  }
  if (resolved.oneOf) {
    return resolved.oneOf.map((entry: any) => describeType(root, entry)).join(' \\| ');
  }
  if (resolved.anyOf) {
    return resolved.anyOf.map((entry: any) => describeType(root, entry)).join(' \\| ');
  }
  if (resolved.allOf) {
    return resolved.allOf.map((entry: any) => describeType(root, entry)).join(' & ');
  }
  const base = resolved.type || (resolved.properties ? 'object' : 'unknown');
  if (base === 'array') {
    return `array<${describeType(root, resolved.items)}>`;
  }
  if (resolved.enum) {
    return `${base} (${resolved.enum.map((entry: any) => JSON.stringify(entry)).join(' \\| ')})`;
  }
  return String(base);
}

/**
 * Compute the anchor GitHub generates for a heading.
 *
 * Matches github-slugger: lowercase, drop everything that is not a word character, a hyphen
 * or a space, then turn spaces into hyphens. Emitting anchors we compute ourselves is the
 * only way the links in the index page can be guaranteed to resolve.
 *
 * @param text - Heading text
 * @returns {string} Anchor slug
 */
function anchor(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\- ]/g, '')
    .trim()
    .replace(/ /g, '-');
}

/**
 * Escape the characters that would break a Markdown table cell.
 *
 * @param value - Any value
 * @returns {string} Table safe string
 */
function cell(value: any): string {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/**
 * Collapse an operation description into a single table friendly line.
 *
 * @param value - Operation description
 * @returns {string} Single line description
 */
function oneLine(value: any): string {
  return cell(value).replace(/\s{2,}/g, ' ');
}

/**
 * Return the git commit the documentation was generated from.
 *
 * @returns {string} Short commit hash, or `unknown` when git is unavailable
 */
function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

/**
 * A single documented operation, flattened out of the OpenAPI `paths` object.
 */
interface Operation {
  method: string;
  path: string;
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  roles: string[];
  openForEveryone: boolean;
  deprecated: boolean;
  parameters: any[];
  requestBody: any;
  responses: Array<{ status: string; description: string; schema: any }>;
  /** Anchor of the operation inside its resource page. */
  heading: string;
}

/**
 * A route registered in the Express application, discovered by static analysis.
 */
interface ImplementedRoute {
  method: string;
  /** Express style path, e.g. `/simlets/:simlet_id/sessions`. */
  expressPath: string;
  /** Source file that registers the route. */
  file: string;
  /** Line number of the registration. */
  line: number;
  /** Import specifier of the mounted router, when the route comes from a sub-router. */
  handler: string;
}

/**
 * Replace every path parameter with a positional placeholder.
 *
 * Used to tell "same endpoint, different parameter name" apart from "different endpoint",
 * for example `/groups/{groupid}/participants/{userid}` in the contract against
 * `/groups/:group_id/participants/:participant_id` in the router.
 *
 * @param value - Path in either dialect
 * @returns {string} Positional shape such as `/simlets/0/groups/0`
 */
function pathShape(value: string): string {
  return normalizePath(value)
    .replace(/\{[^}]*\}/g, '0');
}

/**
 * Derive the SIMVA role from an OpenAPI tag, exactly as the runtime does it.
 *
 * Mirrors `Authenticator.initPaths()` in `src/middlewares/auth.middleware.ts`:
 * lowercase the tag and drop the trailing `s`.
 *
 * @param tag - OpenAPI tag, e.g. `teachers`
 * @returns {string} Role key, e.g. `teacher`
 */
function roleFromTag(tag: string): string {
  return tag.toLowerCase().slice(0, -1);
}

/**
 * Normalize a path so Express and OpenAPI spellings compare equal.
 *
 * `/simlets/:simlet_id` and `/simlets/{simletid}` both become `/simlets/{simletid}`.
 *
 * @param value - Path in either dialect
 * @returns {string} Canonical comparison key
 */
function normalizePath(value: string): string {
  return String(value)
    .replace(/:([A-Za-z0-9_]+)/g, (_match: string, name: string) => `{${name.toLowerCase().replace(/_/g, '')}}`)
    .replace(/\{([A-Za-z0-9_]+)\}/g, (_match: string, name: string) => `{${name.toLowerCase().replace(/_/g, '')}}`)
    .replace(/\/+$/, '')
    .toLowerCase();
}

/**
 * Flatten the OpenAPI `paths` object into a list of operations.
 *
 * @param spec - Parsed OpenAPI document
 * @returns {Operation[]} Every documented operation
 */
function collectOperations(spec: any): Operation[] {
  const operations: Operation[] = [];
  for (const rawPath of Object.keys(spec.paths ?? {})) {
    const pathItem = spec.paths[rawPath];
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method];
      if (!operation || typeof operation !== 'object') {
        continue;
      }
      const tags: string[] = Array.isArray(operation.tags) ? operation.tags : [];
      const roles = tags.map(roleFromTag);
      const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]
        .map((parameter: any) => deref(spec, parameter))
        .filter((parameter: any) => parameter && (parameter.in === 'path' || parameter.in === 'query' || parameter.in === 'header'));
      const requestBody = operation.requestBody ? deref(spec, operation.requestBody) : undefined;
      const responses = Object.entries(operation.responses ?? {})
        .map(([status, response]: [string, any]) => {
          const resolved: any = deref(spec, response);
          const mediaTypes: string[] = resolved?.content ? Object.keys(resolved.content) : [];
          return {
            status,
            description: resolved?.description ?? '',
            schema: mediaTypes.length > 0 ? resolved.content[mediaTypes[0]]?.schema : undefined
          };
        })
        .sort((a: any, b: any) => a.status.localeCompare(b.status));

      operations.push({
        method: method.toUpperCase(),
        path: rawPath,
        summary: oneLine(operation.summary) || '(no summary)',
        description: String(operation.description ?? '').trim(),
        operationId: operation.operationId ?? '',
        tags,
        roles,
        openForEveryone: tags.length === 0,
        deprecated: operation.deprecated === true,
        parameters,
        requestBody,
        responses,
        heading: anchor(operation.operationId || `${method} ${rawPath}`)
      });
    }
  }
  return operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

/**
 * Group operations under the resource named by the first path segment.
 *
 * Also assigns each operation a unique anchor *within its resource page*, because the
 * contract contains duplicate `operationId` values (`getSimletCount`, `getSimletTagsForUser`
 * and `getGroupCount` each appear twice) and GitHub disambiguates duplicate headings by
 * appending an index.
 *
 * @param operations - Flattened operations
 * @returns {Map<string, Operation[]>} Resource name to its operations
 */
function groupByResource(operations: Operation[]): Map<string, Operation[]> {
  const groups = new Map<string, Operation[]>();
  for (const operation of operations) {
    const segment = operation.path.split('/').filter(Boolean)[0] ?? 'root';
    const resource = segment.replace(/[{}]/g, '').replace(/_/g, '-');
    if (!groups.has(resource)) {
      groups.set(resource, []);
    }
    groups.get(resource)!.push(operation);
  }
  for (const resourceOperations of groups.values()) {
    const seen = new Map<string, number>();
    for (const operation of resourceOperations) {
      const base = operation.heading;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      operation.heading = count === 0 ? base : `${base}-${count}`;
    }
  }
  return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

/* -------------------------------------------------------------------------- */
/* Static analysis of the Express router tree                                  */
/* -------------------------------------------------------------------------- */

const routerFileCache = new Map<string, string>();

/**
 * Strip line and block comments from TypeScript source while preserving string literals.
 *
 * Commented out route registrations are dead code and must not be reported as routes,
 * which is how they read if you only run a regex over the raw file.
 *
 * @param source - Raw file contents
 * @returns {string} Source with comment characters replaced by spaces (line numbers preserved)
 */
function stripComments(source: string): string {
  const out = source.split('');
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  let inTemplate = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      } else {
        out[i] = ' ';
      }
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        out[i] = ' ';
        out[i + 1] = ' ';
        i++;
        inBlockComment = false;
      } else if (char !== '\n') {
        out[i] = ' ';
      }
      continue;
    }
    if (inString) {
      if (char === '\\') {
        i++;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      continue;
    }
    if (inTemplate) {
      if (char === '\\') {
        i++;
        continue;
      }
      if (char === '`') {
        inTemplate = false;
      }
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      out[i] = ' ';
      out[i + 1] = ' ';
      i++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      out[i] = ' ';
      out[i + 1] = ' ';
      i++;
      continue;
    }
    if (char === "'" || char === '"') {
      inString = char;
      continue;
    }
    if (char === '`') {
      inTemplate = true;
    }
  }
  return out.join('');
}

/**
 * Read a file, caching the result for the lifetime of the process.
 *
 * @param file - Path relative to the repository root
 * @returns {string} File contents
 */
function readCached(file: string): string {
  if (!routerFileCache.has(file)) {
    routerFileCache.set(file, stripComments(fs.readFileSync(file, 'utf8')));
  }
  return routerFileCache.get(file)!;
}

/**
 * Resolve an import specifier written inside `fromFile` to a repository relative path.
 *
 * @param fromFile - Repository relative path of the importing file
 * @param specifier - Import specifier, e.g. `@/routes/users/user.routes`
 * @returns {string | null} Repository relative file path, or null when unresolvable
 */
function resolveImport(fromFile: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith('@/')) {
    base = path.join('src', specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = path.join(path.dirname(fromFile), specifier);
  } else {
    return null;
  }
  for (const candidate of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

/**
 * Collect the default import bindings of a TypeScript module.
 *
 * @param file - Repository relative file path
 * @returns {Map<string, string>} Local binding to repository relative file path
 */
function importBindings(file: string): Map<string, string> {
  const bindings = new Map<string, string>();
  const source = readCached(file);
  const importRe = /import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(source)) !== null) {
    const target = resolveImport(file, match[2]);
    if (target) {
      bindings.set(match[1], target);
    }
  }
  return bindings;
}

/**
 * Statically discover every route registered in the Express application.
 *
 * Walks `app.use(prefix, router)` mounts in `src/app.ts`, then each router file, following
 * `router.use(subPath, subRouter)` mounts recursively.
 *
 * @returns {ImplementedRoute[]} Every registered route
 */
function collectImplementedRoutes(): ImplementedRoute[] {
  const routes: ImplementedRoute[] = [];
  const mounted = new Set<string>();

  const walk = (file: string, prefix: string): void => {
    if (mounted.has(file)) {
      return;
    }
    mounted.add(file);

    const source = readCached(file);
    const bindings = importBindings(file);

    const registerRe = /\b(?:app|router)\s*\.\s*(get|post|put|patch|delete|head|options|all)\s*\(\s*['"]([^'"]*)['"]\s*,\s*([A-Za-z0-9_.$]+)/g;
    let match: RegExpExecArray | null;
    while ((match = registerRe.exec(source)) !== null) {
      const method = match[1] === 'all' ? 'ALL' : match[1].toUpperCase();
      routes.push({
        method,
        expressPath: `${prefix}${match[2] === '/' && prefix !== '' ? '' : match[2]}` || '/',
        file,
        line: source.slice(0, match.index).split('\n').length,
        handler: match[3]
      });
    }

    const mountRe = /\b(?:app|router)\s*\.\s*use\s*\(\s*['"]([^'"]*)['"]\s*,\s*([A-Za-z0-9_$]+)\s*\)/g;
    while ((match = mountRe.exec(source)) !== null) {
      const subPath = match[1];
      const target = bindings.get(match[2]);
      if (!target) {
        continue;
      }
      const nextPrefix = `${prefix}${subPath === '/' ? '' : subPath}`;
      walk(target, nextPrefix);
    }
  };

  if (fs.existsSync(APP_FILE)) {
    walk(APP_FILE, '');
  }
  return routes;
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Render the "generated by" banner.
 *
 * @param spec - Parsed OpenAPI document
 * @returns {string} Markdown blockquote banner
 */
function banner(spec: any): string {
  return [
    '> **Generated file. Do not edit by hand.**',
    '>',
    `> Regenerate with \`npm run update-docs\` (reads \`${API_SPEC_FILE}\`, commit \`${gitCommit()}\`).`,
    `> Source of truth: \`${API_SPEC_FILE}\` (v${spec?.info?.version ?? 'unknown'}), which is also the`,
    '> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.',
    ''
  ].join('\n');
}

/**
 * Render the hub page with a compact table per resource.
 *
 * @param spec - Parsed OpenAPI document
 * @param groups - Operations grouped by resource
 * @returns {string} Markdown page
 */
function renderIndex(spec: any, groups: Map<string, Operation[]>): string {
  const all = [...groups.values()].flat();
  const lines: string[] = [];

  lines.push('# API endpoint reference');
  lines.push('');
  lines.push(banner(spec));
  lines.push('Every operation below is taken verbatim from `api.yaml`. Request and response');
  lines.push('bodies are **validated at runtime** by `express-openapi-validator`');
  lines.push('(`src/app.ts`), so this document and the server behaviour cannot drift silently.');
  lines.push('');
  lines.push('## Contents');
  lines.push('');
  lines.push('| Resource | Operations | Page |');
  lines.push('| --- | ---: | --- |');
  for (const [resource, operations] of groups) {
    lines.push(`| \`/${resource}\` | ${operations.length} | [details](./${resource}.md) |`);
  }
  lines.push('');
  lines.push('Related reference pages:');
  lines.push('');
  lines.push('- [Role / endpoint matrix](./rbac-matrix.md) — which role may call which operation.');
  lines.push('- [Spec vs implementation](./spec-vs-implementation.md) — contract drift, generated by scanning `src/routes`.');
  lines.push('- [Authentication](../authentication.md) — how to obtain and present a token.');
  lines.push('- [Errors](../errors.md) — error classes and their HTTP status codes.');
  lines.push('- [Configuration](../configuration.md) — environment variables.');
  lines.push('- [Activity types](../activity-types.md) — the pluggable activity vocabulary.');
  lines.push('- [Data model](../data-model.md) — tables, views and their relationships.');
  lines.push('- [How-to guides](../../how-to/README.md) — task oriented recipes.');
  lines.push('');

  for (const [resource, operations] of groups) {
    lines.push(`## \`/${resource}\``);
    lines.push('');
    lines.push('| Method | Path | Summary | Roles |');
    lines.push('| --- | --- | --- | --- |');
    for (const operation of operations) {
      const roles = operation.openForEveryone ? 'all roles' : operation.roles.join(', ');
      lines.push(
        `| \`${operation.method}\` | [\`${operation.path}\`](./${resource}.md#${operation.heading}) | ${cell(
          operation.summary
        )}${operation.deprecated ? ' *(deprecated)*' : ''} | ${cell(roles)} |`
      );
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`Total documented operations: **${all.length}**.`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Render the per operation detail page of one resource.
 *
 * @param spec - Parsed OpenAPI document
 * @param resource - Resource name, e.g. `simlets`
 * @param operations - Operations of that resource
 * @returns {string} Markdown page
 */
function renderResource(spec: any, resource: string, operations: Operation[]): string {
  const lines: string[] = [];

  lines.push(`# \`/${resource}\` endpoint reference`);
  lines.push('');
  lines.push(banner(spec));
  lines.push('## Contents');
  lines.push('');
  lines.push('| Method | Path | operationId |');
  lines.push('| --- | --- | --- |');
  for (const operation of operations) {
    lines.push(`| \`${operation.method}\` | \`${operation.path}\` | [${operation.operationId}](#${operation.heading}) |`);
  }
  lines.push('');

  for (const operation of operations) {
    lines.push(`## ${operation.operationId || operation.path}`);
    lines.push('');
    lines.push(`\`${operation.method} ${operation.path}\``);
    lines.push('');
    lines.push(`**${operation.summary}**`);
    lines.push('');
    if (operation.description) {
      lines.push(operation.description);
      lines.push('');
    }
    lines.push(`- Allowed roles: ${operation.openForEveryone ? 'all roles (untagged operation)' : operation.roles.join(', ')}`);
    if (operation.deprecated) {
      lines.push('- **Deprecated** in the contract.');
    }
    lines.push('');
    lines.push('```bash');
    lines.push(`curl -X ${operation.method} "${'$'}{SIMVA_URL}${operation.path}" \\`);
    if (!operation.openForEveryone) {
      lines.push(`  -H "Authorization: Bearer ${'$'}{TOKEN}" \\`);
    }
    if (['POST', 'PUT', 'PATCH'].includes(operation.method)) {
      lines.push('  -H "Content-Type: application/json" \\');
    }
    lines.push(`  --data @body.json    # see the request body below, omit for ${operation.method === 'GET' || operation.method === 'DELETE' ? 'this verb' : 'bodies you do not send'}`);
    lines.push('```');
    lines.push('');

    if (operation.parameters.length > 0) {
      lines.push('### Parameters');
      lines.push('');
      lines.push('| In | Name | Type | Required | Description |');
      lines.push('| --- | --- | --- | --- | --- |');
      for (const parameter of operation.parameters) {
        lines.push(
          `| ${parameter.in} | \`${parameter.name}\` | ${cell(describeType(spec, parameter.schema))} | ${
            parameter.required ? 'yes' : 'no'
          } | ${cell(oneLine(parameter.description))} |`
        );
      }
      lines.push('');
    }

    if (operation.requestBody) {
      const content = operation.requestBody.content ?? {};
      const mediaTypes = Object.keys(content);
      lines.push('### Request body');
      lines.push('');
      lines.push(`\`Content-Type: ${mediaTypes.join(', ') || 'n/a'}\`, ${
        operation.requestBody.required ? 'required' : 'optional'
      }.`);
      lines.push('');
      if (content[mediaTypes[0]]?.schema) {
        lines.push('```json');
        lines.push(JSON.stringify(content[mediaTypes[0]].schema, null, 2).split('\n').slice(0, 80).join('\n'));
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('### Responses');
    lines.push('');
    lines.push('| Status | Description | Body type |');
    lines.push('| --- | --- | --- |');
    for (const response of operation.responses) {
      lines.push(`| \`${response.status}\` | ${cell(oneLine(response.description))} | ${cell(describeType(spec, response.schema))} |`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Render the role to operation matrix.
 *
 * @param spec - Parsed OpenAPI document
 * @param operations - Every documented operation
 * @returns {string} Markdown page
 */
function renderRbacMatrix(spec: any, operations: Operation[]): string {
  const roles = [...new Set(operations.flatMap((operation) => operation.roles))].sort();
  const lines: string[] = [];

  lines.push('# Role and endpoint matrix');
  lines.push('');
  lines.push(banner(spec));
  lines.push('## How the server derives this table');
  lines.push('');
  lines.push('`api.yaml` uses OpenAPI `tags` for a non-standard purpose: the pluralised name of the');
  lines.push('role allowed to call the operation. `Authenticator.initPaths()` in');
  lines.push('`src/middlewares/auth.middleware.ts` reads `api.yaml` at startup, lowercases each tag and');
  lines.push('drops the trailing `s` to obtain the role key:');
  lines.push('');
  lines.push('```ts');
  lines.push("const roleTag = methodConfig.tags[i].toLowerCase().slice(0, -1); // 'teachers' -> 'teacher'");
  lines.push('```');
  lines.push('');
  lines.push('Operations **without** tags land in a `' + '`*`' + '` bucket that every role may call.');
  lines.push('');
  lines.push('Two consequences worth knowing before you edit the contract:');
  lines.push('');
  lines.push('1. Editing a tag is an authorization change, not a documentation change.');
  lines.push('2. A role name must be singular and must not end in `s`, otherwise the de-pluralisation');
  lines.push('   produces a role key that `getAccess()` in `src/controlers/users/user.helper.ts` does not');
  lines.push('   recognise.');
  lines.push('');
  lines.push('The role used for the check is the one stored in the database (`req.user.sql.role`),');
  lines.push('mapped from Keycloak realm roles by `getRoleFromKeycloakJWT()`, not a role read from the');
  lines.push('token at request time.');
  lines.push('');

  lines.push('## Matrix');
  lines.push('');
  lines.push('Legend: `x` allowed, `-` rejected by `roleAllowed` (401), blank means the role has no');
  lines.push('entry for that method at all and the request is rejected with 404.');
  lines.push('');
  lines.push(`| Operation | ${roles.join(' | ')} |`);
  lines.push(`| --- | ${roles.map(() => '---').join(' | ')} |`);
  for (const operation of operations) {
    const cells = roles.map((role) => (operation.openForEveryone || operation.roles.includes(role) ? 'x' : '-'));
    lines.push(`| \`${operation.method} ${operation.path}\` | ${cells.join(' | ')} |`);
  }
  lines.push('');
  lines.push(`Operations: **${operations.length}**. Roles: **${roles.length}**.`);
  lines.push('');

  lines.push('## Per request capabilities');
  lines.push('');
  lines.push('`getAccess()` (`src/controlers/users/user.helper.ts`) turns the role into the four flags');
  lines.push('that services and mappers branch on:');
  lines.push('');
  lines.push('| Role | `allocated` | `is_admin` | `canImpersonate` |');
  lines.push('| --- | --- | --- | --- |');
  lines.push('| `administrator` | false | true | true |');
  lines.push('| `garbagecollector` | false | true | false |');
  lines.push('| `lrsmanager` | true | false | true |');
  lines.push('| `teacher` | false | false | false |');
  lines.push('| `student` | true | false | false |');
  lines.push('| anything else | `AuthentificationError` | | |');
  lines.push('');
  lines.push('- `allocated: true` means "participant shaped": callers are rejected from management');
  lines.push('  endpoints and only ever see their own data.');
  lines.push('- `is_admin: true` is **not** an authorization flag. It bypasses the "only own data" row');
  lines.push('  filters, including the `AND (deletedAt IS NULL OR :is_admin IS TRUE)` clauses in the SQL');
  lines.push('  views. The `garbagecollector` service account relies on the tag matrix above to stay');
  lines.push('  read-only.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render the drift report between the contract and the Express router tree.
 *
 * Differences are split in three buckets so that the actionable gaps are not buried under
 * cosmetic ones:
 *
 * 1. Same endpoint shape, different path parameter name (`{userid}` vs `:participant_id`).
 * 2. Documented in `api.yaml`, no Express route at all: the endpoint does not exist.
 * 3. Express route, no `api.yaml` entry: requests are rejected by the validator middleware.
 *
 * @param spec - Parsed OpenAPI document
 * @param operations - Every documented operation
 * @param routes - Routes discovered in `src/app.ts` and the route modules
 * @returns {string} Markdown page
 */
function renderDrift(spec: any, operations: Operation[], routes: ImplementedRoute[]): string {
  const key = (method: string, path: string): string => `${method === 'ALL' ? '*' : method} ${normalizePath(path)}`;
  const shapeKey = (method: string, path: string): string => `${method === 'ALL' ? '*' : method} ${pathShape(path)}`;

  const implementedKeys = new Set(routes.map((route) => key(route.method, route.expressPath)));
  const documentedKeys = new Set(operations.map((operation) => key(operation.method, operation.path)));

  // A documented HEAD is served by the Express GET handler, so compare HEAD against GET.
  const matchesHeadViaGet = (operation: Operation): boolean =>
    operation.method === 'HEAD' && implementedKeys.has(`GET ${normalizePath(operation.path)}`);

  const implementedShapes = new Set(routes.map((route) => shapeKey(route.method, route.expressPath)));
  const documentedShapes = new Set(operations.map((operation) => shapeKey(operation.method, operation.path)));

  const nameMismatch = operations
    .filter(
      (operation) =>
        !implementedKeys.has(key(operation.method, operation.path)) &&
        !matchesHeadViaGet(operation) &&
        implementedShapes.has(shapeKey(operation.method, operation.path))
    )
    .map((operation) => {
      const route = routes.find((candidate) => shapeKey(candidate.method, candidate.expressPath) === shapeKey(operation.method, operation.path))!;
      return { operation, route };
    })
    .sort((a, b) => a.operation.path.localeCompare(b.operation.path));

  const documentedWithoutRoute = operations
    .filter(
      (operation) =>
        !implementedKeys.has(key(operation.method, operation.path)) &&
        !matchesHeadViaGet(operation) &&
        !implementedShapes.has(shapeKey(operation.method, operation.path))
    )
    .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const routeWithoutSpec = routes
    .filter((route) => !documentedKeys.has(key(route.method, route.expressPath)))
    .filter((route) => !documentedShapes.has(shapeKey(route.method, route.expressPath)))
    .sort((a, b) => a.expressPath.localeCompare(b.expressPath) || a.method.localeCompare(b.method));

  const lines: string[] = [];
  lines.push('# Contract versus implementation');
  lines.push('');
  lines.push(banner(spec));
  lines.push('This page is produced by statically scanning `src/app.ts` and every route module under');
  lines.push('`src/routes`: each `app.use(prefix, router)` and `router.use(subPath, router)` mount is');
  lines.push('followed recursively and each `router.method(path)` registration is collected (commented out');
  lines.push('registrations are ignored), then the result is compared with `api.yaml`.');
  lines.push('');
  lines.push('Three kinds of difference are reported:');
  lines.push('');
  lines.push('- **Documented, not implemented** — the contract describes an endpoint that no handler');
  lines.push('  answers. Requests return `404` from Express.');
  lines.push('- **Implemented, not documented** — a handler exists but `api.yaml` has no matching');
  lines.push('  operation. `express-openapi-validator` rejects those requests, so the handler is dead');
  lines.push('  code until the contract is updated.');
  lines.push('- **Parameter name mismatch** — same endpoint, different spelling of a path parameter.');
  lines.push('  These work, because `roleAllowed()` treats `{...}` segments as wildcards.');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('| --- | ---: |');
  lines.push(`| Operations documented in \`api.yaml\` | ${operations.length} |`);
  lines.push(`| Routes registered in the Express app | ${routes.length} |`);
  lines.push(`| Documented, not implemented | ${documentedWithoutRoute.length} |`);
  lines.push(`| Implemented, not documented | ${routeWithoutSpec.length} |`);
  lines.push(`| Path parameter name mismatches | ${nameMismatch.length} |`);
  lines.push('');

  lines.push('## Documented, not implemented');
  lines.push('');
  if (documentedWithoutRoute.length === 0) {
    lines.push('_None._');
    lines.push('');
  } else {
    lines.push('| Method | Path | Summary | operationId |');
    lines.push('| --- | --- | --- | --- |');
    for (const operation of documentedWithoutRoute) {
      lines.push(`| \`${operation.method}\` | \`${operation.path}\` | ${cell(operation.summary)} | \`${operation.operationId}\` |`);
    }
    lines.push('');
  }

  lines.push('## Implemented, not documented');
  lines.push('');
  if (routeWithoutSpec.length === 0) {
    lines.push('_None._');
    lines.push('');
  } else {
    lines.push('| Method | Express path | File | Handler |');
    lines.push('| --- | --- | --- | --- |');
    for (const route of routeWithoutSpec) {
      lines.push(`| \`${route.method}\` | \`${route.expressPath}\` | \`${route.file}:${route.line}\` | \`${route.handler}\` |`);
    }
    lines.push('');
  }

  lines.push('## Path parameter name mismatches');
  lines.push('');
  if (nameMismatch.length === 0) {
    lines.push('_None._');
    lines.push('');
  } else {
    lines.push('| Method | Contract path | Express path | File |');
    lines.push('| --- | --- | --- | --- |');
    for (const entry of nameMismatch) {
      lines.push(
        `| \`${entry.operation.method}\` | \`${entry.operation.path}\` | \`${entry.route.expressPath}\` | \`${entry.route.file}:${entry.route.line}\` |`
      );
    }
    lines.push('');
  }

  lines.push('## All registered routes');
  lines.push('');
  lines.push('| Method | Express path | Normalized key | File |');
  lines.push('| --- | --- | --- | --- |');
  for (const route of routes.slice().sort((a, b) => a.expressPath.localeCompare(b.expressPath) || a.method.localeCompare(b.method))) {
    lines.push(
      `| \`${route.method}\` | \`${route.expressPath}\` | \`${normalizePath(route.expressPath)}\` | \`${route.file}:${route.line}\` |`
    );
  }
  lines.push('');

  return lines.join('\n');
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

try {
  const spec = loadSpec();
  const operations = collectOperations(spec);
  const groups = groupByResource(operations);
  const routes = collectImplementedRoutes();

  fs.mkdirSync(DOCS_DIR, { recursive: true });

  const written: string[] = [];
  const write = (file: string, content: string): void => {
    fs.writeFileSync(file, content);
    written.push(file);
  };

  write(path.join(DOCS_DIR, 'index.md'), renderIndex(spec, groups));
  for (const [resource, resourceOperations] of groups) {
    write(path.join(DOCS_DIR, `${resource}.md`), renderResource(spec, resource, resourceOperations));
  }
  write(path.join(DOCS_DIR, 'rbac-matrix.md'), renderRbacMatrix(spec, operations));
  write(path.join(DOCS_DIR, 'spec-vs-implementation.md'), renderDrift(spec, operations, routes));

  console.log(`Wrote ${written.length} reference page(s) to ${DOCS_DIR}/`);
  for (const file of written) {
    console.log(`  ${file}`);
  }
  console.log(`Documented operations: ${operations.length}. Registered Express routes: ${routes.length}.`);
} catch (error) {
  console.error('Error while generating API reference documentation:', error);
  process.exitCode = 1;
}