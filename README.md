# Guitar Pedalboard - ギター初心者エフェクターボード

スマホ縦持ち完全最適化のギターエフェクターシミュレーターです。初心者でも30秒でエフェクターの違いがわかる！

## Features

- **完全無音スタート** - タップするまで音が鳴らないので電車でも安心
- **6種類のエフェクター** - CMP / OD / DS / CH / DL / RV
- **3つの音源切り替え** - 3種類のクリーンギター音源を即座に切り替え可能
- **リアルタイム処理** - Web Audio APIでエフェクトをリアルタイム適用
- **シェア機能** - 自分のペダル設定をXでシェア可能

## エフェクター一覧

| 略称 | 名前 | 説明 |
|------|------|------|
| CMP | COMPRESSOR | 音の強弱を均等にして弾きやすくする |
| OD | OVER DRIVE | 音を温かく歪ませる。ブルース系に最適 |
| DS | DISTORTION | 激しく歪ませる。ロック・メタル向け |
| CH | CHORUS | 音を揺らして広がりを出す。クリーン向け |
| DL | DELAY | やまびこ効果。音に奥行きを加える |
| RV | REVERB | 残響効果。広い空間にいるような音 |

## Setup

### 必要なファイル

以下のファイルを `public/` フォルダに配置してください：

- `public/guitar.svg` - ギターのイラスト画像
- `public/clean-a.wav` - クリーンギター音源A（ループ再生用）
- `public/clean-b.wav` - クリーンギター音源B（ループ再生用）
- `public/clean-c.wav` - クリーンギター音源C（ループ再生用）

**音源について：** A/B/Cボタンで即座に切り替え可能。異なるギタートーンやフレーズを用意することで、エフェクターの効果をより比較しやすくなります。

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Web Audio API

## License

MIT
