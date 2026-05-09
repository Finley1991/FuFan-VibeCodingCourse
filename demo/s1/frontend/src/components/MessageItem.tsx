import MarkdownContent from "./MarkdownContent";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export default function MessageItem({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`py-6 px-4 ${isUser ? "bg-gray-800" : "bg-gray-900"}`}>
      <div className="max-w-3xl mx-auto">
        <div className="font-semibold text-sm text-gray-400 mb-1">{isUser ? "You" : "Assistant"}</div>
        <div className={isUser ? "text-white" : "text-gray-200"}>
          {isUser ? <p className="whitespace-pre-wrap">{content}</p> : <MarkdownContent content={content} />}
        </div>
      </div>
    </div>
  );
}
