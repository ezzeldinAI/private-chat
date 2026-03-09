"use client";

import { IconSparklesFilled } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRealtime } from "@upstash/realtime/client";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { cn } from "@/lib/utils";

function formatTimeRemaining(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor(seconds / 60) % 60;
  const secs = seconds % 60;

  const time =
    hours !== 0
      ? `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : mins !== 0
        ? `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        : `${secs.toString().padStart(2, "0")}`;
  return time;
}

export default function Room() {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();
  const { username } = useUsername();
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) {
      setTimeRemaining(ttlData.ttl);
    }
  }, [ttlData]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) {
      return;
    }

    if (timeRemaining === 0) {
      router.push("/?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      return res.data;
    },
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      );

      setInput("");
    },
  });

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch();
      }

      if (event === "chat.destroy") {
        router.push("/?destroyed=true");
      }
    },
  });

  const { mutate: destroyRoom, isPending: isDestroyingPending } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } });
    },
  });

  function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("Copied!");
    setTimeout(() => {
      setCopyStatus("Copy");
    }, 700);
  }

  return (
    <main className="flex h-screen max-h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between border-zinc-800 border-b bg-zinc-900/30 p-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">{roomId}</span>
              <button
                className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                disabled={isPending}
                onClick={() => copyLink()}
                type="button"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase">
              Self-Destruct
            </span>
            <span
              className={cn(
                "flex items-center gap-2 font-bold text-sm",
                timeRemaining !== null && timeRemaining < 60
                  ? "text-red-500"
                  : timeRemaining !== null && timeRemaining < 300
                    ? "text-amber-500"
                    : "text-white"
              )}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>

        <button
          className="group flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 font-bold hoveR:text-white text-xs text-zinc-400 transition-all hover:bg-rose-600/25 hover:text-rose-500 disabled:opacity-50"
          disabled={isDestroyingPending}
          onClick={() => destroyRoom()}
          type="button"
        >
          {isDestroyingPending ? (
            <Spinner />
          ) : (
            <>
              <span>
                <IconSparklesFilled className="size-4" />
              </span>
              DESTROY
            </>
          )}
        </button>
      </header>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
        {/* Message */}
        {messages?.messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-zinc-600">
              No messages yet, start the conversation.
            </p>
          </div>
        )}

        {messages?.messages.map((msg) => (
          <div className="flex flex-col items-start" key={msg.id}>
            <div className="group max-w-[80%]">
              <div className="mb-1 flex items-baseline gap-3">
                <span
                  className={`font-bold text-xs ${
                    msg.sender === username ? "text-green-500" : "text-blue-500"
                  }`}
                >
                  {msg.sender === username ? "YOU" : msg.sender}
                </span>

                <span className="text-[10px] text-zinc-600">
                  {format(msg.timestamp, "hh:mm a (zzzz)")}
                </span>
              </div>

              <p className="break-all text-sm text-zinc-300 leading-relaxed">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-zinc-800 border-t bg-zinc-900/30 p-4">
        <div className="gpa-4 flex">
          <div className="group relative flex-1">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 animate-pulse">
              {">"}
            </span>
            <input
              autoFocus
              className="w-full border border-zinc-800 bg-black py-3 pr-4 pl-8 text-sm text-zinc-100 opacity-100 transition-colors placeholder:text-zinc-700 focus:border-zinc-700 focus:outline-none disabled:opacity-50"
              disabled={isPending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              type="text"
              value={input}
            />
          </div>

          <button
            className={cn(
              "cursor-pointer bg-zinc-800 px-6 font-bold text-sm text-zinc-400 opacity-100 transition-all disabled:cursor-not-allowed disabled:opacity-50",
              isPending ? "" : "hover:text-zinc-200"
            )}
            disabled={!input.trim() || isPending}
            onClick={() => {
              sendMessage({ text: input });
              inputRef.current?.focus();
            }}
            type="button"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
}
