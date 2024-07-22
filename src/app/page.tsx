/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useMeasure } from "react-use";
import { FixedSizeGrid as Grid } from "react-window";
import Link from "next/link";
import { BITS_IN_PARTITION } from "../../convex/config";

const NUMBER_OF_CHESTS = 1_000_000;
const ROW_HEIGHT = 70;
const COLUMN_WIDTH = 70;

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
    (localStore) => {
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
  const featureFlags = useQuery(api.config.getFeatureFlags) ?? {
    isEnabled: false,
  };
  const bit = 1 << index % BITS_IN_PARTITION;
  const isOpen = chestPartition ? (chestPartition.bitset & bit) !== 0 : false;

  if (index >= NUMBER_OF_CHESTS) {
    return null;
  }

  return (
    <div style={style}>
      <button
        key={index}
        disabled={!featureFlags.isEnabled || isOpen}
        className="size-16 btn btn-secondary flex items-center justify-center"
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
  const columnCount = Math.floor(width / COLUMN_WIDTH);

  useEffect(() => {
    setCode(window.localStorage.getItem(`code`) ?? "");
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center h-full relative">
      <div className="absolute right-4 top-4">
        <Link
          href="https://github.com/webdevcody/million-chests"
          target="_blank"
        >
          <svg
            className="size-8 stroke-white"
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>GitHub</title>
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </Link>
      </div>
      <div className="px-4 text-center">
        <h1 className="text-4xl my-4">
          One Million Treasure Chests (disabled until launch)
        </h1>
        <p className="text-2xl mb-4">{openBoxSum} of 1,000,000 chests opened</p>

        <p className="text-2xl mb-4">
          {goldChests.length} of {totalGoldChests} gold chests found
        </p>
        {code && (
          <p className="text-xl mb-4">
            You found a code! Use the code of{" "}
            <span className="text-blue-400">{code}</span> to get a free copy of
            my{" "}
            <a
              className="link"
              href="https://webdevcody.gumroad.com/l/wdc-saas-starter-kit-walkthrough"
              target="_blank"
            >
              starter kit
            </a>
            .
          </p>
        )}
      </div>
      <div className="px-8 w-full h-full">
        <div ref={ref} className="w-full h-screen">
          <Grid
            columnCount={columnCount}
            columnWidth={COLUMN_WIDTH}
            height={height}
            width={width}
            rowCount={Math.ceil(NUMBER_OF_CHESTS / columnCount)}
            rowHeight={ROW_HEIGHT}
            itemData={{
              columnCount: columnCount,
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
      </div>
    </main>
  );
}
