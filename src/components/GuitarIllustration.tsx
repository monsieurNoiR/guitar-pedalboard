/**
 * 【GuitarIllustrationコンポーネント - ギターイラストと再生トリガー】
 *
 * このファイルは、アプリの中心となるギターのイラストを表示します。
 * ギターをタップすることで音の再生が開始されます。
 *
 * 役割：
 * - ギターのイラスト（SVG画像）を表示
 * - 停止中は「ここをタップして音を出す」というメッセージを表示
 * - 再生中はギターが光るアニメーションと「再生中」インジケーターを表示
 * - タップされたら音を鳴らす処理を親コンポーネントに伝える
 */

"use client";

import Image from "next/image";

/**
 * 【このコンポーネントが受け取るデータの型】
 */
interface GuitarIllustrationProps {
  isPlaying: boolean; // 今、音が鳴っているかどうか
  onTap: () => void;  // タップされたときに呼ぶ関数
}

export default function GuitarIllustration({ isPlaying, onTap }: GuitarIllustrationProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center cursor-pointer select-none ${
        !isPlaying ? "tap-area" : "" // 停止中は背景が点滅するアニメーション
      }`}
      onClick={onTap} // タップされたら onTap 関数を呼ぶ
    >
      {/* === ギターのイラスト === */}
      {/* public/guitar.svg ファイルを表示 */}
      <div className={`relative ${isPlaying ? "guitar-playing" : ""}`}>
        <Image
          src="/guitar.svg"  // publicフォルダのguitar.svgを読み込む
          alt="ギター"
          width={160}
          height={320}
          className="w-40 h-auto sm:w-48 drop-shadow-2xl"
          priority  // 優先的に読み込む（最初に表示される画像なので）
        />
      </div>

      {/* === タップ促進メッセージ（停止中のみ表示） === */}
      {!isPlaying && (
        <div className="mt-6 text-center">
          <p className="text-white text-lg font-bold animate-pulse">
            ここをタップして
            <br />
            音を出す
          </p>
          {/* タップアイコン（上下に揺れるアニメーション） */}
          <div className="mt-3 flex justify-center">
            <svg
              className="w-8 h-8 text-white animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.591"
              />
            </svg>
          </div>
        </div>
      )}

      {/* === 再生中インジケーター（再生中のみ表示） === */}
      {isPlaying && (
        <div className="mt-4 flex items-center gap-2">
          {/* サウンドバー（上下に動くアニメーション） */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-green-400 rounded-full"
                style={{
                  height: `${12 + (i % 3) * 6}px`,
                  animation: `sound-bar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                }}
              />
            ))}
          </div>
          <span className="text-green-400 text-sm font-medium">再生中</span>
        </div>
      )}
    </div>
  );
}
