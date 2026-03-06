declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";

  type Options = {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  };

  export default function markdownItTaskLists(
    md: MarkdownIt,
    options?: Options,
  ): void;
}
