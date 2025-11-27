/**
 * 【Pedalコンポーネント - 個別のエフェクターペダル】
 *
 * このファイルは、1つ1つのエフェクターペダルの見た目と操作を担当しています。
 * フットスイッチ、LED、つまみ（スライダー）が含まれています。
 *
 * 役割：
 * - ペダルの名前、説明、色を表示
 * - ON/OFFを示すLEDの表示
 * - フットスイッチ（タップでON/OFF切り替え）
 * - つまみ（スライダーでエフェクトのかかり具合を調整）
 */

"use client";

import { PedalState } from "@/hooks/useAudioEngine";

/**
 * 【Pedalコンポーネントが受け取るデータの型】
 */
interface PedalProps {
  pedal: PedalState;                        // ペダルの情報（名前、色、ON/OFF状態など）
  onToggle: () => void;                     // フットスイッチを押したときに呼ぶ関数
  onAmountChange: (amount: number) => void; // つまみを動かしたときに呼ぶ関数
}

export default function Pedal({ pedal, onToggle, onAmountChange }: PedalProps) {
  return (
    // ペダル全体のカード（ONの時は色が光る）
    <div
      className="pedal-card p-3 flex items-center gap-3"
      style={{
        // ONの時はペダルの色で枠線を光らせる
        borderColor: pedal.enabled ? pedal.color : undefined,
        boxShadow: pedal.enabled
          ? `0 0 20px ${pedal.color}40, 0 8px 16px rgba(0,0,0,0.4)`
          : undefined,
      }}
    >
      {/* === 左側：フットスイッチエリア === */}
      <div className="flex flex-col items-center gap-1">
        {/* LED（ON時は赤く光る） */}
        <div className={`led ${pedal.enabled ? "led-on" : "led-off"}`} />

        {/* フットスイッチボタン（タップするとON/OFF切り替え） */}
        <button
          className="footswitch w-14 h-14 flex items-center justify-center"
          onClick={onToggle} // フットスイッチをタップしたらonToggle関数を呼ぶ
          aria-label={`${pedal.name} ${pedal.enabled ? "OFF" : "ON"}`}
        >
          {/* ペダルの略称（CMP, OD, DS など） */}
          <span
            className="text-xs font-bold"
            style={{ color: pedal.enabled ? pedal.color : "#666" }}
          >
            {pedal.shortName}
          </span>
        </button>
      </div>

      {/* === 中央：ペダル名と説明 === */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* ペダルの正式名称（COMPRESSOR, OVER DRIVE など） */}
          <h3
            className="text-sm font-bold truncate"
            style={{ color: pedal.enabled ? pedal.color : "#aaa" }}
          >
            {pedal.name}
          </h3>
        </div>
        {/* ペダルの説明文 */}
        <p className="text-xs text-gray-400 leading-tight line-clamp-2">
          {pedal.description}
        </p>
      </div>

      {/* === 右側：つまみ（スライダー） === */}
      <div className="flex flex-col items-center gap-1 w-20">
        <span className="text-xs text-gray-400">かかり具合</span>
        {/* スライダー（0〜100%でエフェクトの強さを調整） */}
        <input
          type="range"
          min="0"
          max="100"
          value={pedal.amount}
          onChange={(e) => onAmountChange(Number(e.target.value))} // つまみを動かしたらonAmountChangeを呼ぶ
          className="w-full h-6"
          style={{
            accentColor: pedal.color, // スライダーの色をペダルの色に合わせる
          }}
        />
        {/* 現在のつまみの位置（パーセント表示） */}
        <span
          className="text-xs font-mono"
          style={{ color: pedal.enabled ? pedal.color : "#666" }}
        >
          {pedal.amount}%
        </span>
      </div>
    </div>
  );
}
