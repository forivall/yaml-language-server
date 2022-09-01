declare module 'vscode-json-languageservice/lib/umd/services/jsonSchemaService' {
  import {
    JSONDocument,
    JSONSchema as JSONSchemaBase,
    SchemaRequestService,
    WorkspaceContextService,
    PromiseConstructor,
  } from 'vscode-json-languageservice';
  import { JSONSchemaRef } from 'vscode-json-languageservice/lib/umd/jsonSchema';

  interface JSONSchema extends JSONSchemaBase {
    url?: string;
    schemaSequence?: JSONSchema[];
    versions?: { [version: string]: string };
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
    dependencies: SchemaDependencies;
    /**
     * The schema from the file, with potential $ref references
     */
    getUnresolvedSchema(): Promise<UnresolvedSchema>;
    /**
     * The schema from the file, with references resolved
     */
    getResolvedSchema(): Promise<ResolvedSchema>;
  }

  namespace JSONSchemaService {
    export interface FilePatternAssociation {
      readonly uris: string[];
      matchesPattern(fileName: string): boolean;
      getURIs(): string[];
    }
  }
  type SchemaDependencies = {
    [uri: string]: true;
  };
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
  export class JSONSchemaService {
    schemasById: {
      [id: string]: ISchemaHandle;
    };
    protected filePatternAssociations: JSONSchemaService.FilePatternAssociation[];
    protected contextService: WorkspaceContextService | undefined;
    protected requestService: SchemaRequestService | undefined;
    constructor(
      requestService?: SchemaRequestService,
      contextService?: WorkspaceContextService,
      promiseConstructor?: PromiseConstructor
    );
    /**
     * Returns all registered schema ids
     */
    getRegisteredSchemaIds(filter?: (scheme: string) => boolean): string[];
    dispose(): void;
    onResourceChange(uri: string): boolean;
    /**
     * Registers contributed schemas
     */
    setSchemaContributions(schemaContributions: ISchemaContributions): void;
    getOrAddSchemaHandle(id: string, unresolvedSchemaContent?: JSONSchema): ISchemaHandle;
    /**
     * Registers a schema file in the current workspace to be applicable to files that match the pattern
     */
    registerExternalSchema(uri: string, filePatterns?: string[], unresolvedSchema?: JSONSchema): ISchemaHandle;
    /**
     * Clears all cached schema files
     */
    clearExternalSchemas(): void;
    getResolvedSchema(schemaId: string): Promise<ResolvedSchema | undefined>;
    loadSchema(url: string): Promise<UnresolvedSchema>;
    resolveSchemaContent(
      schemaToResolve: UnresolvedSchema,
      schemaURL: string,
      dependencies: SchemaDependencies
    ): Promise<ResolvedSchema>;
    /**
     * Looks up the appropriate schema for the given URI
     */
    getSchemaForResource(resource: string, document?: JSONDocument): Promise<ResolvedSchema | undefined>;
    createCombinedSchema(resource: string, schemaIds: string[]): ISchemaHandle;
  }
}
