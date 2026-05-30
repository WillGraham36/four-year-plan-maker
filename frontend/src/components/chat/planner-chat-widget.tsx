"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlannerChatApi } from "@/lib/api/chat/chat.client";
import type { PlannerChatMessage } from "@/lib/api/chat/chat.client";
import { cn } from "@/lib/utils";

type ChatMessage = PlannerChatMessage & {
  id: string;
};

const INTRO_MESSAGE: ChatMessage = {
  id: "intro",
  role: "assistant",
  content: "Hi, what would you like to plan?",
};

export default function PlannerChatWidget() {
  const { sendMessage } = usePlannerChatApi();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
    inputRef.current?.focus();
  }, [isOpen, messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    };
    const conversation = messages
      .filter((message) => message.id !== INTRO_MESSAGE.id)
      .map(({ role, content }) => ({ role, content }));

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsSending(true);

    const response = await sendMessage(trimmedInput, conversation);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response.ok
        ? response.data?.message ||
          response.message ||
          "I do not have a response yet."
        : response.message,
    };

    setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    setIsSending(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section className="flex h-[min(32rem,calc(100vh-6rem))] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="size-4" aria-hidden="true" />
              Planner chat
            </div>
            <Button
              aria-label="Close chat"
              className="size-8"
              onClick={() => setIsOpen(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            ref={scrollAreaRef}
          >
            {messages.map((message) => (
              <div
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                key={message.id}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Thinking
                </div>
              </div>
            ) : null}
          </div>

          <form className="shrink-0 border-t p-3" onSubmit={handleSubmit}>
            <div className="flex items-end gap-2">
              <Textarea
                aria-label="Chat message"
                className="max-h-28 min-h-10 resize-none bg-background text-sm"
                disabled={isSending}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                ref={inputRef}
                rows={1}
                value={input}
              />
              <Button
                aria-label="Send message"
                className="size-10 shrink-0"
                disabled={!input.trim() || isSending}
                size="icon"
                type="submit"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={isOpen ? "Close chat" : "Open chat"}
            className="size-12 rounded-full shadow-lg"
            onClick={() => setIsOpen((currentValue) => !currentValue)}
            size="icon"
            type="button"
          >
            {isOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <MessageCircle className="size-5" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isOpen ? "Close chat" : "Open chat"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
