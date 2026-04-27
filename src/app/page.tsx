"use client";

import { Thread } from "assistant-ui";
import {
  AssistantRuntimeProvider,
  useAui,
  AuiProvider,
  Suggestions,
  Toolkit,
  Tools,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { z } from "zod";

const clientToolkit: Toolkit = {
  calculate: {
    description: "Perform calculations",
    parameters: z.object({
      expression: z.string(),
    }),
    execute: async ({ expression }) => {
      return eval(expression); // Use proper parser in production
    },
  },
};

function ThreadWithSuggestions() {
  const aui = useAui({
    suggestions: Suggestions([
      {
        title: "What's the weather",
        label: "in Tokyo right now?",
        prompt: "What's the weather in Tokyo?",
      },
      {
        title: "Tell me a fun fact",
        label: "about any topic",
        prompt: "Tell me a fun fact about space.",
      },
    ]),
    tools: Tools({ toolkit: clientToolkit }),
  });
  return (
    <AuiProvider value={aui}>
      <Thread />
    </AuiProvider>
  );
}

export default function Home() {
  const runtime = useChatRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-screen">
        <ThreadWithSuggestions />
      </div>
    </AssistantRuntimeProvider>
  );
}
