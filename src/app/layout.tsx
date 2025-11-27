/**
 * 【RootLayoutコンポーネント - アプリ全体のレイアウト】
 *
 * このファイルは、Next.jsアプリ全体の「土台」となるレイアウトファイルです。
 * HTMLの<html>や<body>タグ、メタデータ（タイトル、説明文など）を定義します。
 *
 * 役割：
 * - ページのタイトルや説明文を設定（SEO対策）
 * - スマホ表示の設定（ビューポート）
 * - グローバルCSSの読み込み
 * - すべてのページで共通のHTML構造を提供
 */

import type { Metadata, Viewport } from "next";
import "./globals.css"; // 全ページで使うCSSを読み込み

/**
 * 【メタデータ設定】
 * ブラウザのタブに表示されるタイトルや、
 * Google検索結果に表示される説明文などを設定
 */
export const metadata: Metadata = {
  title: "ギター初心者エフェクターボード",
  description: "初心者でも30秒でエフェクターの違いがわかる！スマホ最適化ギターエフェクターシミュレーター",
  keywords: ["ギター", "エフェクター", "初心者", "ペダルボード", "シミュレーター"],
  // SNSでシェアされたときの表示設定（Open Graph）
  openGraph: {
    title: "ギター初心者エフェクターボード",
    description: "初心者でも30秒でエフェクターの違いがわかる！",
    type: "website",
  },
};

/**
 * 【ビューポート設定】
 * スマホでの表示設定。拡大縮小を禁止して、
 * 常に決まったサイズで表示されるようにしています。
 */
export const viewport: Viewport = {
  width: "device-width",    // 画面の幅に合わせる
  initialScale: 1,          // 最初の拡大率は100%
  maximumScale: 1,          // 最大拡大率も100%（拡大禁止）
  userScalable: false,      // ユーザーによる拡大縮小を禁止
  viewportFit: "cover",     // ノッチ（画面の切り欠き）まで表示
};

/**
 * 【ルートレイアウトコンポーネント】
 * すべてのページで共通のHTML構造を提供します。
 * childrenには各ページの内容が入ります。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // 各ページのコンポーネント
}>) {
  return (
    // 言語を日本語に設定
    <html lang="ja">
      {/* フォントを滑らかに表示 */}
      <body className="antialiased">
        {/* ここに各ページの内容が入る */}
        {children}
      </body>
    </html>
  );
}
