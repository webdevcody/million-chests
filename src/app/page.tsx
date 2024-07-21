"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const NUMBER_OF_CHESTS = 100;

function Chest({ index }: { index: number }) {
  const openChest = useMutation(api.chests.openChest);
  const chest = useQuery(api.chests.getChest, { index });
  const isOpen = chest?.isOpen;

  return (
    <button
      key={index}
      disabled={isOpen}
      className="btn w-24 h-24 flex items-center justify-center"
      onClick={() => {
        openChest({ index });
      }}
    >
      {isOpen ? <img src="/chest-empty.png" /> : <img src="/chest.png" />}
    </button>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <h1 className="text-4xl mb-4">One Million Treasure Chests</h1>
      <p className="text-2xl mb-4">{1} of 1,000,000 chests opened</p>
      <div className="flex flex-wrap gap-1">
        {new Array(NUMBER_OF_CHESTS).fill(null).map((_, index) => (
          <Chest index={index} key={index} />
        ))}
      </div>
    </main>
  );
}
