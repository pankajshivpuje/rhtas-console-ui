import { useEffect, useRef, useState } from "react";

export function useStreamingMessage(
  content: string | undefined,
  isActive: boolean
): { displayedContent: string; isStreaming: boolean } {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!content || !isActive) {
      return;
    }

    setIsStreaming(true);
    setDisplayedContent("");
    let index = 0;

    intervalRef.current = window.setInterval(() => {
      index += Math.floor(Math.random() * 3) + 1;
      if (index >= content.length) {
        setDisplayedContent(content);
        setIsStreaming(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayedContent(content.slice(0, index));
      }
    }, 15);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [content, isActive]);

  return { displayedContent, isStreaming };
}
