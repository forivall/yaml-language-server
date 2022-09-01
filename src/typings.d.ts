declare module 'vscode-json-languageservice/lib/umd/services/jsonSchemaService' {
  import { JSONSchemaRef } from 'vscode-json-languageservice/lib/umd/jsonSchema';
  import {
    JSONDocument,
    JSONSchema as JSONSchemaBase,
    SchemaRequestService,
    WorkspaceContextService,
    PromiseConstructor,
    MatchingSchema,
    TextDocument,
  } from 'vscode-json-languageservice';
  interface JSONSchema extends JSONSchemaBase {
    url?: string;
    schemaSequence?: JSONSchema[];
    versions?: { [version: string]: string };
  }
  export interface IJSONSchemaService {
    /**
     * Registers a schema file in the current workspace to be applicable to files that match the pattern
     */
    registerExternalSchema(uri: string, filePatterns?: string[], unresolvedSchema?: JSONSchema): ISchemaHandle;
    /**
     * Clears all cached schema files
     */
    clearExternalSchemas(): void;
    /**
     * Registers contributed schemas
     */
    setSchemaContributions(schemaContributions: ISchemaContributions): void;
    /**
     * Looks up the appropriate schema for the given URI
     */
    getSchemaForResource(resource: string, document?: JSONDocument): Promise<ResolvedSchema | undefined>;
    /**
     * Returns all registered schema ids
     */
    getRegisteredSchemaIds(filter?: (scheme: string) => boolean): string[];
  }
  export interface SchemaAssociation {
    pattern: string[];
    uris: string[];
  }
  export interface ISchemaContributions {
    schemas?: {
      [id: string]: JSONSchema;
    };
    schemaAssociations?: SchemaAssociation[];
  }
  export interface ISchemaHandle {
    /**
     * The schema id
     */
    url: string;
    /**
     * The schema from the file, with potential $ref references
     */
    getUnresolvedSchema(): Promise<UnresolvedSchema>;
    /**
     * The schema from the file, with references resolved
     */
    getResolvedSchema(): Promise<ResolvedSchema>;
  }
  interface IGlobWrapper {
    regexp: RegExp;
    include: boolean;
  }

  namespace JSONSchemaService {
    export interface FilePatternAssociation {
      readonly uris: string[];
      readonly globWrappers: IGlobWrapper[];
      matchesPattern(fileName: string): boolean;
      getURIs(): string[];
    }
  }
  type SchemaDependencies = {
    [uri: string]: true;
  };
  class SchemaHandle implements ISchemaHandle {
    url: string;
    dependencies: SchemaDependencies;
    resolvedSchema: Promise<ResolvedSchema> | undefined;
    unresolvedSchema: Promise<UnresolvedSchema> | undefined;
    service: JSONSchemaService;
    constructor(service: JSONSchemaService, url: string, unresolvedSchemaContent?: JSONSchema);
    getUnresolvedSchema(): Promise<UnresolvedSchema>;
    getResolvedSchema(): Promise<ResolvedSchema>;
    clearSchema(): void;
  }
  export class UnresolvedSchema {
    uri?: string;
    schema: JSONSchema;
    errors: string[];
    constructor(schema: JSONSchema, errors?: string[]);
  }
  export class ResolvedSchema {
    schema: JSONSchema;
    errors: string[];
    constructor(schema: JSONSchema, errors?: string[]);
    getSection(path: string[]): JSONSchema | undefined;
    getSectionRecursive(path: string[], schema: JSONSchemaRef): JSONSchemaRef | undefined;
  }
  export class JSONSchemaService implements IJSONSchemaService {
    contributionSchemas: {
      [id: string]: SchemaHandle;
    };
    contributionAssociations: JSONSchemaService.FilePatternAssociation[];
    schemasById: {
      [id: string]: SchemaHandle;
    };
    protected filePatternAssociations: JSONSchemaService.FilePatternAssociation[];
    registeredSchemasIds: {
      [id: string]: boolean;
    };
    protected contextService: WorkspaceContextService | undefined;
    protected requestService: SchemaRequestService | undefined;
    promiseConstructor: PromiseConstructor;
    cachedSchemaForResource:
      | {
          resource: string;
          resolvedSchema: Promise<ResolvedSchema | undefined>;
        }
      | undefined;
    constructor(
      requestService?: SchemaRequestService,
      contextService?: WorkspaceContextService,
      promiseConstructor?: PromiseConstructor
    );
    getRegisteredSchemaIds(filter?: (scheme: string) => boolean): string[];
    get promise(): PromiseConstructor;
    dispose(): void;
    onResourceChange(uri: string): boolean;
    setSchemaContributions(schemaContributions: ISchemaContributions): void;
    addSchemaHandle(id: string, unresolvedSchemaContent?: JSONSchema): SchemaHandle;
    getOrAddSchemaHandle(id: string, unresolvedSchemaContent?: JSONSchema): SchemaHandle;
    addFilePatternAssociation(pattern: string[], uris: string[]): JSONSchemaService.FilePatternAssociation;
    registerExternalSchema(uri: string, filePatterns?: string[], unresolvedSchemaContent?: JSONSchema): SchemaHandle;
    clearExternalSchemas(): void;
    getResolvedSchema(schemaId: string): Promise<ResolvedSchema | undefined>;
    loadSchema(url: string): Promise<UnresolvedSchema>;
    resolveSchemaContent(
      schemaToResolve: UnresolvedSchema,
      schemaURL: string,
      dependencies: SchemaDependencies
    ): Promise<ResolvedSchema>;
    getSchemaForResource(resource: string, document?: JSONDocument): Promise<ResolvedSchema | undefined>;
    createCombinedSchema(resource: string, schemaIds: string[]): ISchemaHandle;
    getMatchingSchemas(document: TextDocument, jsonDocument: JSONDocument, schema?: JSONSchema): Promise<MatchingSchema[]>;
  }
}
