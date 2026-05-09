import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface Props {
  content: string;
}

export default function MarkdownContent({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-2">{children}</pre>,
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className={className}>{children}</code>
          ) : (
            <code className="bg-gray-700 px-1 rounded text-sm">{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
