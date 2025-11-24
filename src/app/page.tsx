"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GuitarIllustration from "@/components/GuitarIllustration";
import Pedal from "@/components/Pedal";
import { useAudioEngine } from "@/hooks/useAudioEngine";

function PedalboardContent() {
  const searchParams = useSearchParams();
  const {
    isPlaying,
    pedals,
    play,
    stop,
    togglePedal,
    setPedalAmount,
    setPedalsState,
  } = useAudioEngine();

  const [showHeadphoneModal, setShowHeadphoneModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // URLパラメータから設定を復元
  useEffect(() => {
    const config = searchParams.get("config");
    if (config) {
      try {
        const decoded = JSON.parse(atob(config));
        if (Array.isArray(decoded)) {
          setPedalsState(decoded);
        }
      } catch {
        // 無効な設定は無視
      }
    }
  }, [searchParams, setPedalsState]);

  // タップで再生開始
  const handleTap = useCallback(() => {
    if (!isPlaying) {
      // 初回のみヘッドホン推奨モーダルを表示
      if (!hasShownModal) {
        setShowHeadphoneModal(true);
        setHasShownModal(true);
      }
      play();
    }
  }, [isPlaying, play, hasShownModal]);

  // ミュート（停止）
  const handleMute = useCallback(() => {
    stop();
  }, [stop]);

  // シェアURL生成
  const handleShare = useCallback(() => {
    const config = pedals.map((p) => ({
      id: p.id,
      enabled: p.enabled,
      amount: p.amount,
    }));
    const encoded = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;

    const text = `ギターエフェクターボードをカスタマイズしたよ！\n${
      pedals
        .filter((p) => p.enabled)
        .map((p) => `${p.shortName}: ${p.amount}%`)
        .join(" / ") || "クリーントーン"
    }`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;

    window.open(twitterUrl, "_blank");
  }, [pedals]);

  return (
    <main className="min-h-dvh flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a1a2e] to-transparent pb-4">
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-white text-lg font-bold">
            ギターエフェクターボード
          </h1>

          {/* ミュートボタン（再生中のみ表示） */}
          {isPlaying && (
            <button
              className="mute-btn px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2"
              onClick={handleMute}
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
              </svg>
              ミュート
            </button>
          )}
        </div>
      </header>

      {/* ギターイラスト */}
      <section className="flex-shrink-0 py-4 flex justify-center">
        <GuitarIllustration isPlaying={isPlaying} onTap={handleTap} />
      </section>

      {/* ペダルボード */}
      <section className="flex-1 px-3 pb-24 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-sm font-semibold opacity-70">
            エフェクトペダル
          </h2>
          <span className="text-xs text-gray-500">
            スイッチをタップでON/OFF
          </span>
        </div>

        {pedals.map((pedal) => (
          <Pedal
            key={pedal.id}
            pedal={pedal}
            onToggle={() => togglePedal(pedal.id)}
            onAmountChange={(amount) => setPedalAmount(pedal.id, amount)}
          />
        ))}
      </section>

      {/* シェアボタン */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#16213e] to-transparent">
        <button
          className="share-btn w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
          onClick={handleShare}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          俺のボードをシェア
        </button>
      </footer>

      {/* ヘッドホン推奨モーダル */}
      {showHeadphoneModal && (
        <div
          className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
          onClick={() => setShowHeadphoneModal(false)}
        >
          <div
            className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">🎧</div>
            <h2 className="text-white text-xl font-bold mb-2">
              ヘッドホン推奨！
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              エフェクターの違いをしっかり聴くために
              <br />
              ヘッドホンかイヤホンの使用をおすすめします
            </p>
            <button
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
              onClick={() => setShowHeadphoneModal(false)}
            >
              OK、わかった！
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <PedalboardContent />
    </Suspense>
  );
}
