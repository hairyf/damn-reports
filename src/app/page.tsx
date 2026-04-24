'use client'

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { ThreadList } from "assistant-ui";
import { Thread } from "assistant-ui";

export default function Page() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <main className="h-screen flex flex-col">
        <ThreadList />
        <Thread />
      </main>
    </AssistantRuntimeProvider>
  );
}