import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

type MdastNode = { type: string; name?: string | null; children?: MdastNode[] };

/**
 * 한국어 외 로케일에서는 이미지·영상을 들어낸다. 화면 캡처가 전부 한국어 UI라
 * 다른 언어 독자에게는 안내가 아니라 소음이고, 번역본마다 캡처를 다시 찍을 수도 없다.
 *
 * MDX 안의 `<img />` 는 리터럴 JSX 라 컴포넌트 매핑으로는 가로챌 수 없어서
 * 트리 단계에서 지운다.
 */
function stripMediaOutsideKorean() {
  const isMedia = (node: MdastNode) =>
    node.type === 'image' ||
    ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
      (node.name === 'img' || node.name === 'video'));

  return (tree: MdastNode, file: { path?: string }) => {
    if (/[\\/]content[\\/]docs[\\/]ko[\\/]/.test(file.path ?? '')) return;

    const walk = (node: MdastNode) => {
      if (!node.children) return;
      node.children = node.children.filter((child) => !isMedia(child));
      for (const child of node.children) walk(child);
    };
    walk(tree);
  };
}

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (v) => [...v, stripMediaOutsideKorean],
  },
});
