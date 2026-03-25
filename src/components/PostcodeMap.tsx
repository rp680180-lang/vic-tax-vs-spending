"use client";

import { useEffect, useRef } from "react";
import { VICTORIAN_POSTCODES } from "@/data/postcodes";

interface MapDataPoint {
  postcode: string;
  value: number;
  label: string;
}

interface PostcodeMapProps {
  data: MapDataPoint[];
  colorScale?: "blue" | "green" | "red" | "diverging";
  title?: string;
}

export default function PostcodeMap({ data, colorScale = "blue", title }: PostcodeMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) return;

    // Map data by postcode
    const dataMap = new Map(data.map((d) => [d.postcode, d]));

    // Get value range
    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    // Project lat/lng to canvas coords
    // Victoria roughly: lat -34 to -39, lng 141 to 150
    const latMin = -39.2;
    const latMax = -33.8;
    const lngMin = 141.0;
    const lngMax = 150.2;

    function project(lat: number, lng: number): [number, number] {
      const x = ((lng - lngMin) / (lngMax - lngMin)) * (width - 80) + 40;
      const y = ((latMax - lat) / (latMax - latMin)) * (height - 80) + 40;
      return [x, y];
    }

    function getColor(value: number): string {
      const t = (value - minVal) / range;
      if (colorScale === "blue") {
        const r = Math.round(30 + t * 60);
        const g = Math.round(60 + t * 100);
        const b = Math.round(120 + t * 135);
        return `rgb(${r},${g},${b})`;
      } else if (colorScale === "green") {
        const r = Math.round(30 + t * 40);
        const g = Math.round(80 + t * 150);
        const b = Math.round(50 + t * 60);
        return `rgb(${r},${g},${b})`;
      } else if (colorScale === "red") {
        const r = Math.round(120 + t * 135);
        const g = Math.round(40 + t * 40);
        const b = Math.round(30 + t * 30);
        return `rgb(${r},${g},${b})`;
      } else {
        // Diverging: red -> white -> blue
        if (t < 0.5) {
          const s = t * 2;
          return `rgb(${Math.round(200 - s * 100)},${Math.round(60 + s * 140)},${Math.round(60 + s * 140)})`;
        } else {
          const s = (t - 0.5) * 2;
          return `rgb(${Math.round(100 - s * 60)},${Math.round(200 - s * 100)},${Math.round(200 + s * 55)})`;
        }
      }
    }

    // Draw each postcode as a circle
    for (const pc of VICTORIAN_POSTCODES) {
      const d = dataMap.get(pc.postcode);
      const [x, y] = project(pc.lat, pc.lng);
      const radius = Math.max(4, Math.min(12, Math.sqrt(pc.population2021 / 2000)));

      if (d) {
        ctx.fillStyle = getColor(d.value);
        ctx.globalAlpha = 0.85;
      } else {
        ctx.fillStyle = "#475569";
        ctx.globalAlpha = 0.4;
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw legend
    const legendX = width - 180;
    const legendY = height - 40;
    const legendWidth = 150;
    const legendHeight = 12;

    const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
    gradient.addColorStop(0, getColor(minVal));
    gradient.addColorStop(0.5, getColor((minVal + maxVal) / 2));
    gradient.addColorStop(1, getColor(maxVal));
    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`$${minVal.toFixed(0)}M`, legendX, legendY + 24);
    ctx.textAlign = "right";
    ctx.fillText(`$${maxVal.toFixed(0)}M`, legendX + legendWidth, legendY + 24);

  }, [data, colorScale]);

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {title && <h3 className="text-sm font-medium text-slate-300 mb-2">{title}</h3>}
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        className="w-full rounded-lg"
        style={{ maxHeight: "500px" }}
      />
    </div>
  );
}
