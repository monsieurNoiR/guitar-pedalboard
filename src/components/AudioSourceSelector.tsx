"use client";

import { AudioSource } from "@/hooks/useAudioEngine";

interface AudioSourceSelectorProps {
  currentSource: AudioSource;
  onSourceChange: (source: AudioSource) => void;
}

const SOURCES: { id: AudioSource; label: string }[] = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

export default function AudioSourceSelector({
  currentSource,
  onSourceChange,
}: AudioSourceSelectorProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-white text-xs font-semibold opacity-70">
          音源選択
        </h2>
        <div className="flex gap-3">
          {SOURCES.map((source) => (
            <button
              key={source.id}
              onClick={() => onSourceChange(source.id)}
              className={`
                w-14 h-14 rounded-xl font-bold text-lg
                transition-all duration-200
                ${
                  currentSource === source.id
                    ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-110"
                    : "bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400 hover:from-gray-600 hover:to-gray-700"
                }
              `}
            >
              {source.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
