# Guitar Pedalboard - ギター初心者エフェクターボード

スマホ縦持ち完全最適化のギターエフェクターシミュレーターです。初心者でも30秒でエフェクターの違いがわかる！

## Features

- **完全無音スタート** - タップするまで音が鳴らないので電車でも安心
- **5種類のエフェクター** - OD / DS / CH / DL / RV
- **リアルタイム処理** - Web Audio APIでエフェクトをリアルタイム適用
- **シェア機能** - 自分のペダル設定をXでシェア可能

## エフェクター一覧

| 略称 | 名前 | 説明 |
|------|------|------|
| OD | OVER DRIVE | 音を温かく歪ませる。ブルース系に最適 |
| DS | DISTORTION | 激しく歪ませる。ロック・メタル向け |
| CH | CHORUS | 音を揺らして広がりを出す。クリーン向け |
| DL | DELAY | やまびこ効果。音に奥行きを加える |
| RV | REVERB | 残響効果。広い空間にいるような音 |

## Setup

### 必要なファイル

以下のファイルを `public/` フォルダに配置してください：

- `public/guitar.svg` - ギターのイラスト画像
- `public/clean-guitar.wav` - クリーンギター音源（ループ再生用）

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
