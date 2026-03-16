import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize from "rehype-sanitize";

function shouldOpenInNewTab(href: string) {
  return /^(?:https?:)?\/\//i.test(href) || /^mailto:/i.test(href);
}

function rehypeNormalizeLinkTargets() {
  function visit(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }

    const element = node as {
      type?: string;
      tagName?: string;
      properties?: Record<string, unknown>;
      children?: unknown[];
    };

    if (element.type === "element" && element.tagName === "a") {
      const href = typeof element.properties?.href === "string"
        ? element.properties.href
        : "";

      if (shouldOpenInNewTab(href)) {
        element.properties = {
          ...element.properties,
          target: "_blank",
          rel: "noopener noreferrer",
        };
      } else if (element.properties) {
        const nextProperties = { ...element.properties };
        delete nextProperties.target;
        delete nextProperties.rel;
        element.properties = nextProperties;
      }
    }

    for (const child of element.children ?? []) {
      visit(child);
    }
  }

  return (tree: unknown) => {
    visit(tree);
  };
}

export async function renderMarkdown(source: string): Promise<string> {
  const normalizedSource = source.replace(/\r\n?/g, "\n");
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeNormalizeLinkTargets)
    .use(rehypeStringify)
    .process(normalizedSource);

  return String(result);
}
