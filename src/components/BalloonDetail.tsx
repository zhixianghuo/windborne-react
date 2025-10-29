"use client";

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BalloonDetailProps, ChartDataPoint } from '../types';
import { formatKmh } from '../utils/formatters';

export default function BalloonDetail({ track, isClient }: BalloonDetailProps) {
  const data = useMemo((): ChartDataPoint[] => {
    const chartData = track.points.slice(-120).map(p => ({
      time: new Date(p.ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      speed: p.speed ? p.speed * 3.6 : undefined,
      wind: p.windSpeed != null ? p.windSpeed : undefined,
      temp: p.temp != null ? p.temp : undefined,
      consistency: p.consistency != null ? p.consistency : undefined,
    }));
    
    
    return chartData;
  }, [track]);


  const last = track.points[track.points.length - 1];

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">{track.id}</div>
          <div className="text-slate-500">
            Last @ {isClient ? new Date(last.ts * 1000).toLocaleString() : 'Loading...'}
          </div>
        </div>
        <div className="text-right">
          <div>Speed: {formatKmh(last.speed)}</div>
          <div>Wind: {last.windSpeed != null ? `${last.windSpeed.toFixed(1)} m/s` : "-"}</div>
          <div>Temp: {last.temp != null ? `${last.temp.toFixed(1)}℃` : "-"}</div>
        </div>
      </div>

      <div className="h-[160px]">
        <h4 className="font-medium mb-1">Drift vs Wind (last ~2h)</h4>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" hide />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="speed" 
              dot={false} 
              strokeWidth={2} 
              name="Drift km/h" 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="wind" 
              dot={false} 
              strokeWidth={2} 
              name="Wind m/s" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[160px]">
        <h4 className="font-medium mb-1">Consistency (cos Δθ)</h4>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[-1, 1]} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="consistency" 
              dot={false} 
              strokeWidth={2} 
              name="consistency" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
