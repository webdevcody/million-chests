/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useMeasure } from "react-use";
import { BITS_IN_PARTITION } from "../../convex/chests";
import { FixedSizeGrid as Grid } from "react-window";

const NUMBER_OF_CHESTS = 1_000_000;
const ROW_HEIGHT = 100;
const COLUMN_WIDTH = 100;

function Chest({
  rowIndex,
  columnIndex,
  style,
  data,
}: {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
  data: { columnCount: number; onCodeFound(code: string): void };
}) {
  const index = rowIndex * data.columnCount + columnIndex;
  const goldChests = useQuery(api.chests.getGoldChests) ?? [];
  const partitionIndex = Math.floor(index / BITS_IN_PARTITION);
  const openChest = useMutation(api.chests.openChest).withOptimisticUpdate(
    (localStore, arg) => {
      const currentValue = localStore.getQuery(api.chests.getChestPartition, {
        partition: partitionIndex,
      });
      if (currentValue) {
        localStore.setQuery(
          api.chests.getChestPartition,
          {
            partition: partitionIndex,
          },
          {
            ...currentValue,
            bitset: currentValue.bitset | (1 << index % BITS_IN_PARTITION),
          }
        );
      }
    }
  );
  const chestPartition = useQuery(api.chests.getChestPartition, {
    partition: partitionIndex,
  });
  const bit = 1 << index % BITS_IN_PARTITION;
  const isOpen = chestPartition ? (chestPartition.bitset & bit) !== 0 : false;

  if (index >= NUMBER_OF_CHESTS) {
    return null;
  }

  return (
    <div style={style}>
      <button
        key={index}
        disabled={isOpen}
        className="btn w-24 h-24 flex items-center justify-center"
        onClick={() => {
          openChest({ index }).then((code) => {
            if (code) {
              data.onCodeFound(code);
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
    </div>
  );
}

export default function Home() {
  const openBoxSum = useQuery(api.sums.getOpenBoxSum) ?? 0;
  const totalGoldChests = useQuery(api.chests.getTotalGoldChests) ?? 0;
  const [code, setCode] = useState("");
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();
  const goldChests = useQuery(api.chests.getGoldChests) ?? [];

  useEffect(() => {
    setCode(window.localStorage.getItem(`code`) ?? "");
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center h-full">
      <h1 className="text-4xl mb-4">One Million Treasure Chests</h1>
      <p className="text-2xl mb-4">{openBoxSum} of 1,000,000 chests opened</p>

      <p className="text-2xl mb-4">
        {goldChests.length} of {totalGoldChests} gold chests found
      </p>
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
      <div ref={ref} className="w-full h-screen">
        <Grid
          columnCount={Math.floor(width / COLUMN_WIDTH)}
          columnWidth={COLUMN_WIDTH}
          height={height}
          width={width}
          rowCount={NUMBER_OF_CHESTS / Math.ceil(width / COLUMN_WIDTH)}
          rowHeight={ROW_HEIGHT}
          itemData={{
            columnCount: Math.ceil(width / COLUMN_WIDTH),
            onCodeFound(code: string) {
              window.localStorage.setItem(`code`, code);
              setCode(code);
              alert(
                `You found a discount code for my starter kit walkthrough: ${code}!`
              );
            },
          }}
        >
          {Chest}
        </Grid>
      </div>
    </main>
  );
}
