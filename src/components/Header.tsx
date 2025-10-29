"use client";

import React from "react";
import { RefreshCcw, Wind, Search, X } from "lucide-react";

interface HeaderProps {
  isClient: boolean;
  lastUpdated: number | null;
  tracksCount: number;
  enableWindData: boolean;
  onWindDataToggle: (enabled: boolean) => void;
  showTrails: boolean;
  onTrailsToggle: (show: boolean) => void;
  maxBalloons: number;
  onMaxBalloonsChange: (count: number) => void;
  loading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
}

export default function Header({
  isClient,
  lastUpdated,
  tracksCount,
  enableWindData,
  onWindDataToggle,
  showTrails,
  onTrailsToggle,
  maxBalloons,
  onMaxBalloonsChange,
  loading,
  onRefresh,
  searchQuery,
  onSearchChange,
  onSearchClear,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <Wind className="w-5 h-5" />
        <h1 className="text-lg font-semibold">Windborne Constellation — 24h Live (React)</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search balloon ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-8 py-1 text-sm border rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={onSearchClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {isClient && lastUpdated && (
            <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
          <span className="text-xs text-gray-500">Tracks: {tracksCount}</span>
          
          <label className="flex items-center gap-1 text-xs">
            <input 
              type="checkbox" 
              checked={enableWindData} 
              onChange={(e) => onWindDataToggle(e.target.checked)}
              className="rounded"
            />
            Wind Data
          </label>
          
          <label className="flex items-center gap-1 text-xs">
            <input 
              type="checkbox" 
              checked={showTrails} 
              onChange={(e) => onTrailsToggle(e.target.checked)}
              className="rounded"
            />
            Trails
          </label>
          
          <div className="flex items-center gap-1 text-xs">
            <label>Max:</label>
            <select 
              value={maxBalloons} 
              onChange={(e) => onMaxBalloonsChange(Number(e.target.value))}
              className="text-xs border rounded px-1"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
          
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-slate-100"
          >
            {loading ? <span className="animate-spin">⟳</span> : <RefreshCcw className="w-4 h-4" />}
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
