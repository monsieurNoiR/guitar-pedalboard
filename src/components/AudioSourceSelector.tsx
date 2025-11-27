/**
 * 【AudioSourceSelectorコンポーネント - 音源切り替えボタン】
 *
 * このファイルは、3つの音源（A/B/C）を切り替えるボタンを表示します。
 * 各音源は異なるギタートーンや演奏フレーズで、エフェクターの違いを
 * より分かりやすくするために使います。
 *
 * 役割：
 * - A/B/Cの3つのボタンを表示
 * - 現在選択されている音源をハイライト表示
 * - ボタンをタップすると音源を切り替える
 */

"use client";

import { AudioSource } from "@/hooks/useAudioEngine";

/**
 * 【このコンポーネントが受け取るデータの型】
 */
interface AudioSourceSelectorProps {
  currentSource: AudioSource;                  // 現在選択されている音源（a/b/c）
  onSourceChange: (source: AudioSource) => void; // 音源を切り替えるときに呼ぶ関数
}

/**
 * 【音源のリスト】
 * A/B/Cの3つの音源を定義
 */
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
        {/* タイトル */}
        <h2 className="text-white text-xs font-semibold opacity-70">
          音源選択
        </h2>

        {/* A/B/Cボタンを横に並べる */}
        <div className="flex gap-3">
          {/* SOURCESの配列をループして、各音源ごとにボタンを作る */}
          {SOURCES.map((source) => (
            <button
              key={source.id}
              onClick={() => onSourceChange(source.id)} // ボタンをタップしたら音源切り替え
              className={`
                w-14 h-14 rounded-xl font-bold text-lg
                transition-all duration-200
                ${
                  // 現在選択されている音源は青く光らせる
                  currentSource === source.id
                    ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-110"
                    : "bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400 hover:from-gray-600 hover:to-gray-700"
                }
              `}
            >
              {source.label} {/* A, B, C のラベルを表示 */}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
