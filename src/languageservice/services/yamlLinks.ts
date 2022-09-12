/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { findLinks as JSONFindLinks } from 'vscode-json-languageservice/lib/umd/services/jsonLinks';
import { DocumentLink } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Telemetry } from '../../languageserver/telemetry';
import { yamlDocumentsCache } from '../parser/yaml-documents';
import { convertErrorToTelemetryMsg } from '../utils/objects';

export class YamlLinks {
  constructor(private readonly telemetry: Telemetry) {}

  async findLinks(document: TextDocument): Promise<DocumentLink[] | undefined> {
    try {
      const doc = yamlDocumentsCache.getYamlDocument(document);
      if (!doc) {
        throw new Error('Document unavailable');
      }
      // Find links across all YAML Documents then report them back once finished
      const linkPromises: DocumentLink[] = [];
      for (const yamlDoc of doc.documents) {
        linkPromises.push(JSONFindLinks(document, yamlDoc));
      }
      // Wait for all the promises to return and then flatten them into one DocumentLink array
      const yamlLinkArray = await Promise.all(linkPromises);
      return [...yamlLinkArray];
    } catch (err) {
      this.telemetry.sendError('yaml.documentLink.error', { error: convertErrorToTelemetryMsg(err) });
    }
  }
}
