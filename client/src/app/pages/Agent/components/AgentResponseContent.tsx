import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentResponseContentProps {
  content: string;
}

export const AgentResponseContent: React.FC<AgentResponseContentProps> = ({ content }) => {
  return <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>;
};
