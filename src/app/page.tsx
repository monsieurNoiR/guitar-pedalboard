/**
 * 【メインページコンポーネント】
 * このファイルは、ギターエフェクターボードアプリの画面全体を組み立てています。
 *
 * 主な役割：
 * - ギターのイラストを表示
 * - 6種類のエフェクターペダルを縦に並べて表示
 * - 音源の再生/停止を制御
 * - ペダルのON/OFF切り替えを管理
 * - URLでペダル設定を共有する機能
 */

"use client"; // このファイルはブラウザ上で動くコンポーネントであることを宣言

// React（画面を作るための部品）から必要な機能をインポート
import { useEffect, useState, useCallback, Suspense } from "react";
// URLのパラメータを読み取る機能をインポート
import { useSearchParams } from "next/navigation";
// 各パーツ（コンポーネント）をインポート
import GuitarIllustration from "@/components/GuitarIllustration";
import AudioSourceSelector from "@/components/AudioSourceSelector";
import Pedal from "@/components/Pedal";
// 音を鳴らすための機能をインポート
import { useAudioEngine } from "@/hooks/useAudioEngine";

/**
 * 【ペダルボードのメインコンポーネント】
 * アプリの中身（ギター、ペダル、ボタンなど）を実際に表示する部分
 */
function PedalboardContent() {
  // URLのパラメータ（?config=xxx の部分）を取得
  const searchParams = useSearchParams();

  // useAudioEngine から音を鳴らすための機能を取得
  const {
    isPlaying,        // 今、音が鳴っているかどうか（true/false）
    pedals,           // 6つのペダルの状態（ON/OFF、つまみの位置など）
    currentSource,    // 今選ばれている音源（A/B/C）
    play,             // 音を鳴らす関数
    stop,             // 音を止める関数
    togglePedal,      // ペダルをON/OFFする関数
    setPedalAmount,   // ペダルのつまみを動かす関数
    setPedalsState,   // すべてのペダルの設定を一度に変更する関数
    switchSource,     // 音源を切り替える関数（A→B→Cなど）
  } = useAudioEngine();

  // ヘッドホン推奨モーダルを表示するかどうかの状態管理
  const [showHeadphoneModal, setShowHeadphoneModal] = useState(false);
  // 一度でもモーダルを表示したかどうかの状態管理
  const [hasShownModal, setHasShownModal] = useState(false);

  /**
   * 【URLパラメータから設定を復元する処理】
   * URLに ?c=xxx が付いていたら、そのペダル設定を読み込む
   * これにより、他の人がシェアした設定を再現できる
   *
   * 新形式: ?c=od:75,ds:80 （OD 75%とDS 80%がON）
   * 旧形式: ?config=base64データ （互換性のため残す）
   */
  useEffect(() => {
    // 新形式のパラメータをチェック（例: ?c=od:75,ds:80）
    const compactConfig = searchParams.get("c");
    if (compactConfig) {
      try {
        // "od:75,ds:80" のような形式から設定を復元
        const enabledPedals = compactConfig.split(",").map((item) => {
          const [id, amount] = item.split(":");
          return {
            id,
            enabled: true,
            amount: parseInt(amount, 10),
          };
        });
        setPedalsState(enabledPedals);
      } catch {
        // エラーが起きた場合は無視
      }
      return;
    }

    // 旧形式のパラメータをチェック（互換性のため）
    const oldConfig = searchParams.get("config");
    if (oldConfig) {
      try {
        // Base64でエンコードされた文字列をデコードして、JSON形式に変換
        const decoded = JSON.parse(atob(oldConfig));
        if (Array.isArray(decoded)) {
          // デコードした設定をペダルに適用
          setPedalsState(decoded);
        }
      } catch {
        // エラーが起きた場合（不正なURLなど）は無視する
      }
    }
  }, [searchParams, setPedalsState]);

  /**
   * 【ギターをタップしたときの処理】
   * ギターのイラストをタップすると音が鳴り始める
   */
  const handleTap = useCallback(() => {
    if (!isPlaying) { // まだ音が鳴っていない場合
      // 初回のみヘッドホン推奨モーダル（ポップアップ）を表示
      if (!hasShownModal) {
        setShowHeadphoneModal(true); // モーダルを表示
        setHasShownModal(true);      // 「もう表示した」という記録を残す
      }
      play(); // 音を鳴らす
    }
  }, [isPlaying, play, hasShownModal]);

  /**
   * 【ミュートボタンを押したときの処理】
   * 音を止める
   */
  const handleMute = useCallback(() => {
    stop(); // 音を止める
  }, [stop]);

  /**
   * 【シェアボタンを押したときの処理】
   * 現在のペダル設定をURLに変換して、Xでシェアする
   *
   * URLを短くするため、ONになっているペダルの情報だけを保存します。
   * 形式: ペダルID:つまみ位置 （例: "od:75,ds:80" → OD 75%、DS 80%がON）
   */
  const handleShare = useCallback(() => {
    // ONになっているペダルだけを抽出して、コンパクトな形式に変換
    // 例: "od:75,ds:80" のような形式
    const config = pedals
      .filter((p) => p.enabled)                           // ONのペダルだけ
      .map((p) => `${p.id}:${p.amount}`)                  // "id:amount"形式に
      .join(",");                                         // カンマで繋ぐ

    // 設定が空（全部OFFの場合）なら、URLパラメータなしにする
    const url = config
      ? `${window.location.origin}${window.location.pathname}?c=${config}`
      : `${window.location.origin}${window.location.pathname}`;

    // Xに投稿する文章を作成
    const text = `ギターエフェクターボードをカスタマイズしたよ！\n${
      pedals
        .filter((p) => p.enabled)                    // ONになっているペダルだけ抽出
        .map((p) => `${p.shortName}: ${p.amount}%`)  // 「OD: 50%」のような形式に
        .join(" / ") || "クリーントーン"            // 何もONじゃなければ「クリーントーン」
    }`;

    // Xのツイート画面を開くURLを作成
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;

    // 新しいタブでXのツイート画面を開く
    window.open(twitterUrl, "_blank");
  }, [pedals]);

  /**
   * ここから下は、画面に表示される HTML の構造（見た目）を定義している部分です。
   * JSXという記法で書かれており、HTMLとJavaScriptを組み合わせたような構文です。
   */
  return (
    <main className="min-h-dvh flex flex-col">
      {/* === ヘッダー（画面上部の固定エリア） === */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a1a2e] to-transparent pb-4">
        <div className="flex items-center justify-between px-4 pt-4">
          {/* アプリのタイトル */}
          <h1 className="text-white text-lg font-bold">
            ギターエフェクターボード
          </h1>

          {/* ミュートボタン（音が鳴っている時だけ表示される） */}
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

        {/* アプリの説明文 */}
        <p className="px-4 pt-2 text-sm text-gray-300 leading-relaxed">
          ギターを始めたばかりの初心者さんが「エフェクターって何？」ってなったときに、もの凄くザックリとそれぞれのエフェクターのイメージを掴む参考になるかも知れないページです。
        </p>
      </header>

      {/* === ギターイラストエリア === */}
      {/* タップすると音が鳴る。isPlaying（再生中かどうか）を渡している */}
      <section className="flex-shrink-0 py-4 flex justify-center">
        <GuitarIllustration isPlaying={isPlaying} onTap={handleTap} />
      </section>

      {/* === 音源選択エリア（A/B/Cボタン） === */}
      {/* currentSource: 今選ばれている音源（A/B/C） */}
      {/* onSourceChange: 音源を切り替える関数 */}
      <section className="flex-shrink-0">
        <AudioSourceSelector
          currentSource={currentSource}
          onSourceChange={switchSource}
        />
      </section>

      {/* === ペダルボードエリア（6つのエフェクターが並ぶ場所） === */}
      <section className="flex-1 px-3 pb-24 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-sm font-semibold opacity-70">
            エフェクトペダル
          </h2>
          <span className="text-xs text-gray-500">
            スイッチをタップでON/OFF
          </span>
        </div>

        {/* 6つのペダル（CMP, OD, DS, CH, DL, RV）をリストで表示 */}
        {/* pedals.map() で配列の各要素に対してPedalコンポーネントを生成 */}
        {pedals.map((pedal) => (
          <Pedal
            key={pedal.id}                                              // 各ペダルを識別するためのキー
            pedal={pedal}                                               // ペダルの情報（名前、色、ON/OFF状態など）
            onToggle={() => togglePedal(pedal.id)}                      // このペダルをON/OFFする関数
            onAmountChange={(amount) => setPedalAmount(pedal.id, amount)} // つまみを動かしたときの関数
          />
        ))}
      </section>

      {/* === シェアボタン（画面下部に固定） === */}
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

      {/* === ヘッドホン推奨モーダル（ポップアップ） === */}
      {/* showHeadphoneModal が true の時だけ表示される */}
      {showHeadphoneModal && (
        <div
          className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
          onClick={() => setShowHeadphoneModal(false)} // 背景をクリックしたら閉じる
        >
          <div
            className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()} // モーダル内のクリックは背景に伝えない
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

/**
 * 【Homeコンポーネント - アプリのエントリーポイント】
 * Suspenseを使って、画面の読み込み中は「Loading...」を表示する
 * 読み込みが完了したらPedalboardContentを表示する
 */
export default function Home() {
  return (
    <Suspense
      fallback={
        // 読み込み中に表示される画面
        <div className="min-h-dvh flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      {/* 実際のアプリ画面 */}
      <PedalboardContent />
    </Suspense>
  );
}
