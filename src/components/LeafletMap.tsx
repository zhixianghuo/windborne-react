"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapProps } from '../types';
import { formatKmh } from '../utils/formatters';

// Dynamic import of Leaflet packages for client-side only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LeafletPkg: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ReactLeaflet: any = null;
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LeafletPkg = require("leaflet");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ReactLeaflet = require("react-leaflet");
}

export default function LeafletMap({
  tracks, 
  selectedId, 
  onSelect, 
  showTrails, 
  maxBalloons, 
  zoomLevel, 
  onZoomChange,
}: MapProps) {
  const { MapContainer, TileLayer, Polyline, Marker, Tooltip } = ReactLeaflet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const center = useMemo(() => ({ lat: 20, lon: 0 }), []);

  // Create custom icon function - simplified version, no dependency on consistency
  const createCustomIcon = () => {
    if (!LeafletPkg) return null;
    
    const size = 24; // Uniform size
    const color = '#3b82f6'; // Blue border
    
    return LeafletPkg.divIcon({
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 3px solid ${color}; 
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        ">
          <img 
            src="/logo.png" 
            style="
              width: ${size - 6}px; 
              height: ${size - 6}px; 
              object-fit: cover;
              border-radius: 50%;
            " 
          />
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  // Simple balloon filtering: only limit count, no dependency on consistency
  const filteredTracks = useMemo(() => {
    const trackArray = Object.values(tracks);
    return trackArray.slice(0, maxBalloons);
  }, [tracks, maxBalloons]);

  // Adjust trajectory point density based on zoom level
  const getSimplifiedPoints = (points: Array<{ lat: number; lon: number }>) => {
    if (zoomLevel <= 2) {
      // World map level: take every 10th point, maintain basic trajectory shape
      return points.filter((_, index) => index % 10 === 0 || index === points.length - 1);
    } else if (zoomLevel < 4) {
      // Medium zoom level: take every 5th point
      return points.filter((_, index) => index % 5 === 0 || index === points.length - 1);
    } else if (zoomLevel < 8) {
      // High zoom level: take every 2nd point
      return points.filter((_, index) => index % 2 === 0 || index === points.length - 1);
    } else {
      // Highest zoom level: show all points
      return points;
    }
  };


  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (selectedId) {
      const tr = tracks[selectedId];
      if (tr?.points?.length) {
        const last = tr.points[tr.points.length - 1];
        // Ensure zoom level is within allowed range
        const targetZoom = Math.max(1, Math.min(18, 4));
        map.setView([last.lat, last.lon], targetZoom, { animate: true });
      }
    }
  }, [selectedId, tracks]);

  // Listen for zoom level changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const handleZoom = () => {
      const currentZoom = map.getZoom();
      onZoomChange(currentZoom);
    };
    
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [onZoomChange]);

  return (
    <MapContainer
      center={[center.lat, center.lon]} 
      zoom={2} 
      minZoom={2}
      maxZoom={18}
      scrollWheelZoom={true}
      zoomControl={true}
      doubleClickZoom={true}
      dragging={true}
      maxBounds={[[-85, -180], [85, 180]]}
      maxBoundsViscosity={1.0}
      style={{ height: "520px", width: "100%" }} 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      whenCreated={(m: any) => (mapRef.current = m)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filteredTracks.map(tr => {
        if (!tr.points.length) return null;
        
        // Use simplified trajectory points
        const simplifiedPoints = getSimplifiedPoints(tr.points);
        const latlngs = simplifiedPoints.map(p => [p.lat, p.lon]) as [number, number][];
        
        const color = selectedId === tr.id ? 'red' : '#3b82f6'; // Selected is red, others are blue
        const last = tr.points[tr.points.length - 1];
        const customIcon = createCustomIcon();
        
        // Adjust line weight and opacity based on zoom level
        const lineWeight = zoomLevel <= 2 ? 1 : zoomLevel < 6 ? 2 : 3;
        const lineOpacity = zoomLevel <= 2 ? 0.6 : zoomLevel < 6 ? 0.8 : 0.9;
        
        return (
          <React.Fragment key={tr.id}>
            {showTrails && latlngs.length > 1 && (
              <Polyline 
                positions={latlngs} 
                pathOptions={{ 
                  color, 
                  weight: lineWeight, 
                  opacity: lineOpacity,
                  smoothFactor: 1,
                  lineCap: 'round',
                  lineJoin: 'round'
                }} 
                eventHandlers={{ click: () => onSelect(tr.id) }} 
              />
            )}
            <Marker 
              position={[last.lat, last.lon]} 
              icon={customIcon}
              eventHandlers={{ click: () => onSelect(tr.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                <div className="text-xs">
                  <div className="font-semibold">{tr.id}</div>
                  <div>Speed: {formatKmh(last.speed)}</div>
                  <div>Wind: {last.windSpeed != null ? `${last.windSpeed.toFixed(1)} m/s @ ${Math.round(last.windDir ?? 0)}°` : "-"}</div>
                  <div>Click to load wind data</div>
                </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
