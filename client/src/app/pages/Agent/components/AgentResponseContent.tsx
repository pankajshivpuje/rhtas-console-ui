import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentResponseContentProps {
  content: string;
}

export const AgentResponseContent: React.FC<AgentResponseContentProps> = ({ content }) => {
  return (
    <div style={{ overflowX: "auto", fontSize: "var(--pf-t--global--font--size--sm)", wordBreak: "break-word" }}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children, ...props }) => (
            <div style={{ overflowX: "auto", marginBlock: "var(--pf-t--global--spacer--sm)" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: "var(--pf-t--global--font--size--xs)",
                }}
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              style={{
                border: "1px solid var(--pf-t--global--border--color--default)",
                padding: "var(--pf-t--global--spacer--xs) var(--pf-t--global--spacer--sm)",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              style={{
                border: "1px solid var(--pf-t--global--border--color--default)",
                padding: "var(--pf-t--global--spacer--xs) var(--pf-t--global--spacer--sm)",
              }}
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
