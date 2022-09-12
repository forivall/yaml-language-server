import { CST, visit } from 'yaml';
import { SourceToken } from 'yaml/dist/parse/cst';
import { ASTNode } from '../jsonASTTypes';

export class FlowStyleRewriter {
  constructor(private readonly indentation: string) {}

  public write(node: ASTNode): string | null {
    if (node.internalNode.srcToken?.['type'] !== 'flow-collection') {
      return null;
    }
    const collection: CST.FlowCollection = node.internalNode.srcToken as CST.FlowCollection;
    const blockType = collection.start.type === 'flow-map-start' ? 'block-map' : 'block-seq';
    const parentType = node.parent?.type;

    type BlockItem = (CST.BlockMap | CST.BlockSequence)['items'][number];
    const blockStyle = {
      type: blockType,
      offset: collection.offset,
      indent: collection.indent,
      items: [] as BlockItem[],
    };

    for (const item of collection.items) {
      CST.visit(item, ({ start: flowStart, key, sep, value }) => {
        if (blockType === 'block-map') {
          const offset = key?.offset ?? flowStart[0].offset;
          const start = [{ type: 'space', indent: 0, offset, source: this.indentation } as SourceToken];
          if (parentType === 'property') {
            // add a new line if part of a map
            start.unshift({ type: 'newline', indent: 0, offset, source: '\n' } as SourceToken);
          }
          blockStyle.items.push({
            start: start,
            key: key,
            sep: sep,
            value: value,
          } as BlockItem);
        } else if (blockType === 'block-seq') {
          const offset = value?.offset ?? flowStart[0].offset;
          blockStyle.items.push({
            start: [
              { type: 'newline', indent: 0, offset, source: '\n' } as SourceToken,
              { type: 'space', indent: 0, offset, source: this.indentation } as SourceToken,
              { type: 'seq-item-ind', indent: 0, offset, source: '-' } as SourceToken,
              { type: 'space', indent: 0, offset, source: ' ' } as SourceToken,
            ],
            value: value,
          });
        }
        if (value?.type === 'flow-collection') {
          return visit.SKIP;
        }
      });
    }
    return CST.stringify(blockStyle as CST.Token);
  }
}
