/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Dispatch, SetStateAction, useState } from "react";
import { BITS_IN_PARTITION } from "../../convex/chests";

const NUMBER_OF_CHESTS = 100;

function Chest({
  index,
  onCodeFound,
}: {
  index: number;
  onCodeFound: (code: string) => void;
}) {
  const goldChests = useQuery(api.chests.getGoldChests) ?? [];
  const openChest = useMutation(api.chests.openChest);
  const chestPartition = useQuery(api.chests.getChestPartition, {
    partition: Math.floor(index / BITS_IN_PARTITION),
  });
  const bit = 1 << index % BITS_IN_PARTITION;
  const isOpen = chestPartition ? (chestPartition.bitset & bit) !== 0 : false;

  return (
    <button
      key={index}
      disabled={isOpen}
      className="btn w-24 h-24 flex items-center justify-center"
      onClick={() => {
        openChest({ index }).then((code) => {
          if (code) {
            onCodeFound(code);
          }
        });
      }}
    >
      {isOpen ? (
        goldChests.some((c) => c.index === index) ? (
          <img src="/chest-gold.png" />
        ) : (
          <img src="/chest-empty.png" />
        )
      ) : (
        <img src="/chest.png" />
      )}
    </button>
  );
}

export default function Home() {
  const [code, setCode] = useState(window.localStorage.getItem(`code`));

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <h1 className="text-4xl mb-4">One Million Treasure Chests</h1>
      <p className="text-2xl mb-4">{1} of 1,000,000 chests opened</p>
      {code && (
        <p className="text-xl mb-4">
          You found a code! Use the code of{" "}
          <span className="text-blue-400">{code}</span> to get a free copy of my{" "}
          <a className="link" href="https://google.com" target="_blank">
            starter kit
          </a>
          .
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {new Array(NUMBER_OF_CHESTS).fill(null).map((_, index) => (
          <Chest
            onCodeFound={(code) => {
              window.localStorage.setItem(`code`, code);
              setCode(code);
              alert(
                `You found a discount code for my starter kit walkthrough: ${code}!`
              );
            }}
            index={index}
            key={index}
          />
        ))}
      </div>
    </main>
  );
}
