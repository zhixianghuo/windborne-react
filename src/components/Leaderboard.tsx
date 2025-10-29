"use client";

import React from "react";
import { LeaderboardItem } from '../types';
import { scoreColor } from '../utils/formatters';

interface LeaderboardProps {
  leaderboard: LeaderboardItem[];
  onSelect: (id: string) => void;
}

export default function Leaderboard({ leaderboard, onSelect }: LeaderboardProps) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="font-medium mb-2">Top Consistency (wind vs drift)</h3>
      <ol className="space-y-1 text-sm">
        {leaderboard.map(row => (
          <li key={row.id} className="flex items-center justify-between">
            <button 
              className="text-left hover:underline" 
              onClick={() => onSelect(row.id)}
            >
              {row.id}
            </button>
            <span style={{ color: scoreColor(row.avg) }}>
              {row.avg.toFixed(2)}
            </span>
          </li>
        ))}
        {!leaderboard.length && (
          <div className="text-slate-500">No data yet.</div>
        )}
      </ol>
    </div>
  );
}
