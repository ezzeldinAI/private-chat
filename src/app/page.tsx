/** biome-ignore-all lint/a11y/noLabelWithoutControl: forget */
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  );
};

export default Page;

function Lobby() {
  const { username } = useUsername();
  const router = useRouter();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom, isPending: isCreatingPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-2xl text-green-500 tracking-tight">
            {">"}private_chat
          </h1>
          <p className="text-sm text-zinc-500">
            A private, self-destructing chat room.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Your Identity
              </label>

              <div className="flex items-center gap-3">
                <div className="flex-1 border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-400">
                  {username}
                </div>
              </div>
            </div>

            <button
              className="mt-2 flex w-full cursor-pointer items-center justify-center bg-zinc-100 p-3 font-bold text-black text-sm transition-colors hover:bg-zinc-50 hover:text-black disabled:opacity-50"
              disabled={isCreatingPending}
              onClick={() => createRoom()}
              type="button"
            >
              {isCreatingPending ? <Spinner /> : "CREATE SECURE ROOM"}
            </button>
          </div>
        </div>
        {wasDestroyed && (
          <div className="rounded-md border border-red-900 bg-red-950/50 p-4 text-center">
            <p className="font-bold text-red-500 text-sm">ROOM DESTROYED</p>
            <p className="mt-1 text-xs text-zinc-500">
              All messages were permanently deleted.
            </p>
          </div>
        )}
        {error === "room-not-found" && (
          <div className="rounded-md border border-red-900 bg-red-950/50 p-4 text-center">
            <p className="font-bold text-red-500 text-sm">ROOM NOT FOUND</p>
            <p className="mt-1 text-xs text-zinc-500">
              This room may have expired or never existed.
            </p>
          </div>
        )}
        {error === "room-full" && (
          <div className="rounded-md border border-red-900 bg-red-950/50 p-4 text-center">
            <p className="font-bold text-red-500 text-sm">ROOM FULL</p>
            <p className="mt-1 text-xs text-zinc-500">
              This room is at maximum capacity.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
