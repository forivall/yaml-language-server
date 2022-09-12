/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DefinitionParams } from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DefinitionLink, LocationLink, Range } from 'vscode-languageserver-types';
import { isAlias, Node } from 'yaml';
import { Telemetry } from '../../languageserver/telemetry';
import { YamlNode } from '../jsonASTTypes';
import { SingleYAMLDocument, yamlDocumentsCache } from '../parser/yaml-documents';
import { matchOffsetToDocument } from '../utils/arrUtils';
import { convertErrorToTelemetryMsg } from '../utils/objects';
import { TextBuffer } from '../utils/textBuffer';
import { LanguageSettings } from '../yamlLanguageService';
import { YAMLSchemaService } from './yamlSchemaService';

export interface DefinitionResolver {
  resolve(node: YamlNode, document: SingleYAMLDocument): Node | undefined;
}

const resolveAlias: DefinitionResolver = {
  resolve(node, document) {
    if (isAlias(node)) {
      const defNode = node.resolve(document.internalDocument);
      if (defNode && defNode.range) {
        return defNode;
      }
    }
  },
};

export class YamlDefinition {
  private resolvers = [resolveAlias];
  private schemaService: YAMLSchemaService;

  constructor(/*private schemaService: YAMLSchemaService, */ private readonly telemetry: Telemetry) {}

  public configure(settings: LanguageSettings): void {
    if (settings) {
      // this.resolvers = [resolveAlias, ...settings.definitionResolvers];
    }
  }

  getDefinition(document: TextDocument, params: DefinitionParams): DefinitionLink[] | undefined {
    try {
      const yamlDocument = yamlDocumentsCache.getYamlDocument(document);
      if (!yamlDocument) {
        throw new Error('Document unavailable');
      }
      const offset = document.offsetAt(params.position);
      const currentDoc = matchOffsetToDocument(offset, yamlDocument);
      if (currentDoc) {
        const [node] = currentDoc.getNodeFromPosition(offset, new TextBuffer(document));
        if (node) {
          for (const resolver of this.resolvers) {
            const resolved = resolver.resolve(node, currentDoc);
            if (resolved?.range) {
              const targetRange = Range.create(document.positionAt(resolved.range[0]), document.positionAt(resolved.range[2]));
              const selectionRange = Range.create(document.positionAt(resolved.range[0]), document.positionAt(resolved.range[1]));
              return [LocationLink.create(document.uri, targetRange, selectionRange)];
            }
          }
        }
      }
    } catch (err) {
      this.telemetry.sendError('yaml.definition.error', { error: convertErrorToTelemetryMsg(err) });
    }

    return undefined;
  }

  async getResolvers(document: TextDocument, doc: SingleYAMLDocument) {
    const schema = await this.schemaService.getSchemaForResource(document.uri, doc);
    // TODO
  }
}
