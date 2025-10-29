"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import ClientOnlyMap from "../components/ClientOnlyMap";
import LeafletMap from "../components/LeafletMap";
import BalloonDetail from "../components/BalloonDetail";
import Header from "../components/Header";
import { BalloonTrack } from "../types";
import { loadAll24h } from "../services/dataService";
import { loadWind } from "../services/windService";
import { angleDiff } from "../utils/math";

// Dynamic import of Leaflet packages for client-side only
let ReactLeaflet: any = null;
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ReactLeaflet = require("react-leaflet");
}

export default function Page() {
  const [tracks, setTracks] = useState<Record<string, BalloonTrack>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [enableWindData, setEnableWindData] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [maxBalloons, setMaxBalloons] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingWindData, setLoadingWindData] = useState(false);

  const selected = selectedId ? tracks[selectedId] : null;

  /**
   * Loads wind data for the currently selected balloon on-demand
   * 
   * This function is called when a balloon is selected and wind data is enabled.
   * It loads wind data for the last 5 points of the selected balloon and propagates
   * the data to all other points for consistency calculation.
   */
  async function loadWindDataForSelectedBalloon() {
    if (!selectedId || !tracks[selectedId] || !enableWindData) return;
    
    const track = tracks[selectedId];
    const points = track.points;
    if (points.length === 0) return;

    // Check if wind data already exists
    const hasWindData = points.some(p => p.windDir != null && p.windSpeed != null);
    if (hasWindData) return;

    setLoadingWindData(true);
    try {
      
      // Load wind data for only the last few points of this balloon
      const samplePoints = points.slice(-5); // Take only the last 5 points
      
      for (const p of samplePoints) {
        const w = await loadWind(p.lat, p.lon, p.ts);
        if (w.windDir != null && w.windSpeed != null) {
          p.windDir = w.windDir;
          p.windSpeed = w.windSpeed;
          p.temp = w.temp;
          
          // Calculate consistency
          if (p.bearing != null && p.windDir != null) {
            const ang = angleDiff(p.bearing, p.windDir);
            p.consistency = Math.cos((ang * Math.PI) / 180);
          } else {
            console.warn(`Missing data for consistency:`, {
              balloonId: selectedId,
              bearing: p.bearing,
              windDir: p.windDir
            });
          }
        }
      }
      
      // Propagate wind data to other points
      const enrichedPoints = points.filter(p => p.windDir != null && p.windSpeed != null);
      if (enrichedPoints.length > 0) {
        for (const p of points) {
          if (p.windDir == null || p.windSpeed == null) {
            // Find the closest point with wind data
            let closestPoint = enrichedPoints[0];
            let minDistance = Infinity;
            
            for (const ep of enrichedPoints) {
              const distance = Math.sqrt(
                Math.pow(p.lat - ep.lat, 2) + Math.pow(p.lon - ep.lon, 2)
              );
              if (distance < minDistance) {
                minDistance = distance;
                closestPoint = ep;
              }
            }
            
            // Propagate wind data
            p.windDir = closestPoint.windDir;
            p.windSpeed = closestPoint.windSpeed;
            p.temp = closestPoint.temp;
            
            // Calculate consistency
            if (p.bearing != null && p.windDir != null) {
              const ang = angleDiff(p.bearing, p.windDir);
              p.consistency = Math.cos((ang * Math.PI) / 180);
            }
          }
        }
      }
      
      // Update tracks state - create new object reference
      setTracks(prevTracks => ({
        ...prevTracks,
        [selectedId]: {
          ...prevTracks[selectedId],
          points: [...points] // Create new points array
        }
      }));
    } catch (error) {
      console.error('Failed to load wind data:', error);
    } finally {
      setLoadingWindData(false);
    }
  }

  const filteredTracks = useMemo(() => {
    const prefix = "balloon_";
    if (!searchQuery.trim()) return tracks;
    
    const query = prefix + searchQuery.toLowerCase().trim();
    const filtered: Record<string, BalloonTrack> = {};
    
    for (const [id, track] of Object.entries(tracks)) {
      if (id === query) {
        filtered[id] = track;
      }
    }
    
    return filtered;
  }, [tracks, searchQuery]);

  async function load() {
    setLoading(true); 
    setError(null);
    try {
      const map = await loadAll24h();
      // No longer auto-load wind data, changed to on-demand loading
      
      setTracks(map);
      if (typeof window !== 'undefined') {
        setLastUpdated(Date.now());
      }
      if (!selectedId) setSelectedId(Object.keys(map)[0] ?? null);
    } catch (e: any) {
      console.error("Load error:", e);
      setError(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setIsClient(true);
    load();
    const id = setInterval(() => load(), 5 * 60 * 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load wind data on-demand when a balloon is selected
  useEffect(() => {
    if (selectedId && enableWindData) {
      loadWindDataForSelectedBalloon();
    }
  }, [selectedId, enableWindData]);

  // Removed leaderboard since we no longer pre-load consistency data

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <Header
        isClient={isClient}
        lastUpdated={lastUpdated}
        tracksCount={Object.keys(filteredTracks).length}
        enableWindData={enableWindData}
        onWindDataToggle={setEnableWindData}
        showTrails={showTrails}
        onTrailsToggle={setShowTrails}
        maxBalloons={maxBalloons}
        onMaxBalloonsChange={setMaxBalloons}
        loading={loading}
        onRefresh={load}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
      />

      <main className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2">
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="h-[520px] w-full">
              <ClientOnlyMap>
                {ReactLeaflet ? (
                  <LeafletMap 
                    tracks={filteredTracks} 
                    selectedId={selectedId} 
                    onSelect={setSelectedId}
                    showTrails={showTrails}
                    maxBalloons={maxBalloons}
                    zoomLevel={zoomLevel}
                    onZoomChange={setZoomLevel}
                  />
                ) : (
                  <div className="h-full grid place-items-center text-slate-500">
                    Loading map... ReactLeaflet: {ReactLeaflet ? 'loaded' : 'not loaded'}
                  </div>
                )}
              </ClientOnlyMap>
            </div>
          </div>
          <div className="mt-4">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-medium mb-2">
                {searchQuery ? `Search Results (${Object.keys(filteredTracks).length} balloons)` : 'Balloon Information'}
              </h3>
              {searchQuery ? (
                <div className="text-sm text-slate-600">
                  <p>Found {Object.keys(filteredTracks).length} balloons matching "{searchQuery}"</p>
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  <p>Click on a balloon to load wind data and see detailed information.</p>
                  {loadingWindData && (
                    <p className="text-blue-600 mt-2">Loading wind data for selected balloon...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Selected Balloon
            </h3>
            {!selected ? (
              <div className="text-sm text-slate-500">Click a track on the map or pick from the leaderboard.</div>
            ) : (
              <BalloonDetail track={selected} isClient={isClient} />
            )}
          </div>

          {error && (
            <div className="rounded-xl border bg-red-200/60 p-4 mt-4 text-red-800 text-sm">
              Error: {error}
            </div>
          )}
        </aside>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500">
        Built with Next.js + React-Leaflet + Open-Meteo. Updates every 5 minutes.
      </footer>
    </div>
  );
}
