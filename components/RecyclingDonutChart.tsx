import React, { useState } from 'react';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface RecyclingDonutChartProps {
  data: ChartData[];
}

const RecyclingDonutChart: React.FC<RecyclingDonutChartProps> = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState<ChartData | null>(null);

  const radius = 80;
  const strokeWidth = 25;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  return (
    <section className="modern-card p-6 md:p-8 fade-in-section is-visible">
        <h2 className="text-2xl font-bold font-display text-center text-text-main mb-6">El Panorama del Reciclaje en Formosa</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke="#374151" // gray-700 for the background track
                        strokeWidth={strokeWidth}
                    />
                    {data.map((segment, index) => {
                        const segmentLength = (circumference * segment.value) / 100;
                        const offset = (circumference * accumulatedPercentage) / 100;
                        accumulatedPercentage += segment.value;
                        const isHovered = hoveredSegment?.name === segment.name;

                        return (
                            <circle
                                key={index}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={segment.color}
                                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                strokeDashoffset={-offset}
                                className="transition-all duration-300"
                                onMouseEnter={() => setHoveredSegment(segment)}
                                onMouseLeave={() => setHoveredSegment(null)}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    {hoveredSegment ? (
                        <>
                            <span className="text-4xl font-display" style={{ color: hoveredSegment.color }}>{hoveredSegment.value}%</span>
                            <span className="text-xs max-w-[100px] leading-tight">{hoveredSegment.name}</span>
                        </>
                    ) : (
                         <span className="text-5xl">♻️</span>
                    )}
                </div>
            </div>
            <div className="w-full md:w-auto">
                <ul className="space-y-3">
                    {data.map((segment) => (
                        <li 
                            key={segment.name} 
                            className="flex items-center text-sm transition-opacity duration-200"
                            style={{ opacity: !hoveredSegment || hoveredSegment.name === segment.name ? 1 : 0.5 }}
                            onMouseEnter={() => setHoveredSegment(segment)}
                            onMouseLeave={() => setHoveredSegment(null)}
                        >
                            <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: segment.color }}></span>
                            <span className="text-text-secondary mr-2">{segment.name}:</span>
                            <span className="font-bold text-text-main">{segment.value}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </section>
  );
};

export default RecyclingDonutChart;
