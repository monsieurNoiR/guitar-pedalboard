/**
 * 【オーディオエンジン - 音を鳴らす仕組みの中核】
 *
 * このファイルは、ブラウザの Web Audio API を使ってギターの音を鳴らし、
 * 6種類のエフェクター（コンプレッサー、オーバードライブ、ディストーション、
 * コーラス、ディレイ、リバーブ）を実際に音に適用する処理を行っています。
 *
 * 主な役割：
 * - WAVファイル（ギター音源）の読み込みと再生
 * - 6種類のエフェクター処理の実装
 * - ペダルのON/OFF切り替え
 * - つまみ（Amount）の調整による音の変化
 * - 音源（A/B/C）の切り替え
 */

"use client";

import { useCallback, useRef, useEffect, useState } from "react";

// ===== 型定義（データの形を決めている部分） =====

/**
 * 【ペダルの状態を表す型】
 * 各エフェクターペダルが持っている情報
 */
export interface PedalState {
  id: string;          // ペダルのID（cmp, od, ds, ch, dl, rv）
  name: string;        // ペダルの名前（COMPRESSOR, OVER DRIVE など）
  shortName: string;   // 短縮名（CMP, OD など）
  description: string; // 説明文
  color: string;       // ペダルの色（16進数カラーコード）
  enabled: boolean;    // ON/OFFの状態
  amount: number;      // つまみの位置（0〜100）
}

/**
 * 【音源の種類】
 * A、B、Cの3種類の音源を切り替えられる
 */
export type AudioSource = "a" | "b" | "c";

/**
 * 【オーディオエンジン全体の状態】
 */
export interface AudioEngineState {
  isPlaying: boolean;      // 今、音が鳴っているか
  isInitialized: boolean;  // オーディオエンジンの初期化が完了したか
  pedals: PedalState[];    // 6つのペダルの状態の配列
  currentSource: AudioSource; // 現在選択されている音源（A/B/C）
}

/**
 * 【6つのペダルの初期設定】
 * アプリを開いたときの各ペダルの初期状態を定義
 * すべてOFF（enabled: false）でつまみは50%の位置からスタート
 */
const DEFAULT_PEDALS: PedalState[] = [
  {
    id: "cmp",
    name: "COMPRESSOR",
    shortName: "CMP",
    description: "音の強弱を均等にして弾きやすくする",
    color: "#0019ff",  // 青色
    enabled: false,    // 最初はOFF
    amount: 50,        // つまみは真ん中（50%）
  },
  {
    id: "od",
    name: "OVER DRIVE",
    shortName: "OD",
    description: "音を温かく歪ませる。ブルース系に最適",
    color: "#ffe000",
    enabled: false,
    amount: 50,
  },
  {
    id: "ds",
    name: "DISTORTION",
    shortName: "DS",
    description: "激しく歪ませる。ロック・メタル向け",
    color: "#ff9700",
    enabled: false,
    amount: 50,
  },
  {
    id: "ch",
    name: "CHORUS",
    shortName: "CH",
    description: "音を揺らして広がりを出す。クリーン向け",
    color: "#00e7ff",
    enabled: false,
    amount: 50,
  },
  {
    id: "dl",
    name: "DELAY",
    shortName: "DL",
    description: "やまびこ効果。音に奥行きを加える",
    color: "#e4007f",
    enabled: false,
    amount: 50,
  },
  {
    id: "rv",
    name: "REVERB",
    shortName: "RV",
    description: "残響効果。広い空間にいるような音",
    color: "#8b5cf6",
    enabled: false,
    amount: 50,
  },
];

/**
 * 【useAudioEngine - メインのフック関数】
 *
 * このフック（関数）は、音を鳴らすために必要なすべての機能を提供します。
 * Web Audio APIという、ブラウザに標準搭載されている音声処理の仕組みを使っています。
 *
 * 【Web Audio APIとは？】
 * ブラウザで音を鳴らしたり、エフェクトをかけたりするための機能。
 * 音の流れは「ノード」という部品を繋いで作ります。
 *
 * 例：音源ノード → エフェクトノード → 音量調整ノード → スピーカー
 *
 * 【useRefとは？】
 * Reactで「値を保持する箱」を作る機能。画面が再描画されても中身は残ります。
 * Web Audio APIのノード（部品）を入れておくために使っています。
 */
export function useAudioEngine() {
  // ===== Web Audio APIの基本部品を入れる箱 =====
  const audioContextRef = useRef<AudioContext | null>(null);           // 全体の管理者（オーディオコンテキスト）
  const audioBufferRef = useRef<AudioBuffer | null>(null);             // 読み込んだ音源データ
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);    // 音を再生するノード
  const inputGainRef = useRef<GainNode | null>(null);                  // 入力音量調整ノード
  const masterGainRef = useRef<GainNode | null>(null);                 // 最終的な音量調整ノード

  // ===== 各エフェクターのノード（部品）を入れる箱 =====
  // 【コンプレッサー用】
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);  // コンプレッサー本体
  const cmpMixRef = useRef<GainNode | null>(null);                    // エフェクトをかけた音
  const cmpDryRef = useRef<GainNode | null>(null);                    // エフェクトをかけていない音（ドライ）

  // 【オーバードライブ用】
  const odGainRef = useRef<WaveShaperNode | null>(null);              // 音を歪ませるノード
  const odMixRef = useRef<GainNode | null>(null);                     // エフェクト音
  const odDryRef = useRef<GainNode | null>(null);                     // ドライ音

  // 【ディストーション用】
  const dsGainRef = useRef<WaveShaperNode | null>(null);              // 音を激しく歪ませるノード
  const dsMixRef = useRef<GainNode | null>(null);                     // エフェクト音
  const dsDryRef = useRef<GainNode | null>(null);                     // ドライ音

  // 【コーラス用】
  const chorusDelayRef = useRef<DelayNode | null>(null);              // 遅延ノード
  const chorusLfoRef = useRef<OscillatorNode | null>(null);           // 揺らぎを作る発振器（LFO）
  const chorusMixRef = useRef<GainNode | null>(null);                 // エフェクト音
  const chorusDryRef = useRef<GainNode | null>(null);                 // ドライ音

  // 【ディレイ用】
  const delayNodeRef = useRef<DelayNode | null>(null);                // 遅延ノード（やまびこ）
  const delayFeedbackRef = useRef<GainNode | null>(null);             // フィードバック（繰り返し）の量
  const delayMixRef = useRef<GainNode | null>(null);                  // エフェクト音
  const delayDryRef = useRef<GainNode | null>(null);                  // ドライ音

  // 【リバーブ用】
  const reverbConvolverRef = useRef<ConvolverNode | null>(null);      // 畳み込みリバーブノード
  const reverbMixRef = useRef<GainNode | null>(null);                 // エフェクト音
  const reverbDryRef = useRef<GainNode | null>(null);                 // ドライ音

  // ===== アプリの状態管理 =====
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,        // 最初は音が鳴っていない
    isInitialized: false,    // 最初は初期化されていない
    pedals: DEFAULT_PEDALS,  // ペダルは初期設定の状態
    currentSource: "a",      // 音源はAからスタート
  });

  /**
   * 【ディストーションカーブを作成する関数】
   *
   * オーバードライブやディストーションは、音を「歪ませる」エフェクトです。
   * この関数は、どのように音を歪ませるかを決める「カーブ（曲線）」を作ります。
   *
   * @param amount - エフェクトの強さ（0〜1）
   * @param type - "od"（オーバードライブ）か "ds"（ディストーション）
   * @returns 歪み具合を表すカーブデータ
   */
  const makeDistortionCurve = useCallback((amount: number, type: "od" | "ds") => {
    const samples = 44100;                      // サンプル数（カーブの細かさ）
    const curve = new Float32Array(samples);    // カーブデータを入れる配列
    const deg = Math.PI / 180;

    // 各サンプルポイントでの歪み具合を計算
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;  // -1 〜 1 の範囲の値
      if (type === "od") {
        // ソフトクリッピング（オーバードライブ）- 緩やかに歪む
        curve[i] = ((3 + amount * 10) * x * 20 * deg) / (Math.PI + amount * 10 * Math.abs(x));
      } else {
        // ハードクリッピング（ディストーション）- 激しく歪む
        const k = amount * 50 + 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
    }
    return curve;
  }, []);

  /**
   * 【インパルスレスポンスを生成する関数（リバーブ用）】
   *
   * リバーブ（残響）は、音が空間で反射して響く効果です。
   * この関数は、ノイズを使って疑似的な反響データを作ります。
   *
   * @param duration - 残響の長さ（秒）
   * @param decay - 減衰の速さ（大きいほどゆっくり消える）
   */
  const createImpulseResponse = useCallback((duration: number, decay: number) => {
    if (!audioContextRef.current) return null;

    const sampleRate = audioContextRef.current.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContextRef.current.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    return impulse;
  }, []);

  /**
   * 【WAVファイルをロードする関数】
   *
   * public フォルダにある clean-a.wav、clean-b.wav、clean-c.wav を読み込んで、
   * 再生できる形式（AudioBuffer）に変換します。
   *
   * @param audioContext - オーディオコンテキスト
   * @param source - 音源の種類（"a", "b", "c"）
   */
  const loadAudioFile = useCallback(async (audioContext: AudioContext, source: AudioSource = "a") => {
    try {
      // ファイルを取得（例: /clean-a.wav）
      const response = await fetch(`/clean-${source}.wav`);
      // バイナリデータに変換
      const arrayBuffer = await response.arrayBuffer();
      // 音声データとしてデコード（再生できる形に変換）
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      // 読み込んだ音源を保存
      audioBufferRef.current = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio file: clean-${source}.wav`, error);
      return null;
    }
  }, []);

  /**
   * 【オーディオエンジンの初期化】
   *
   * この関数は、アプリで音を鳴らすための準備をします。
   * 以下のことを行います：
   * 1. AudioContext（音の管理者）を作成
   * 2. WAVファイル（ギター音源）を読み込み
   * 3. 6種類のエフェクターノードを作成
   * 4. すべてのノードを正しい順番で繋ぐ
   *
   * 音の流れ：
   * 音源 → 入力 → CMP → OD → DS → Chorus → Delay → Reverb → マスター → スピーカー
   */
  const initialize = useCallback(async () => {
    if (audioContextRef.current) return; // すでに初期化済みなら何もしない

    // AudioContextを作成（ブラウザによって名前が違うので両方対応）
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // WAVファイルをロード（最初は音源Aを読み込む）
    await loadAudioFile(audioContext, "a");

    // === マスターゲイン（最終的な音量調整） ===
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.7, audioContext.currentTime); // 音量70%
    masterGain.connect(audioContext.destination);                   // スピーカーに接続
    masterGainRef.current = masterGain;

    // === 入力ゲイン（エフェクトに送る前の音量調整） ===
    const inputGain = audioContext.createGain();
    inputGain.gain.setValueAtTime(1.0, audioContext.currentTime);
    inputGainRef.current = inputGain;

    // === コンプレッサー ===
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
    compressor.knee.setValueAtTime(30, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);
    compressorRef.current = compressor;

    const cmpMix = audioContext.createGain();
    cmpMix.gain.setValueAtTime(0, audioContext.currentTime);
    cmpMixRef.current = cmpMix;

    const cmpDry = audioContext.createGain();
    cmpDry.gain.setValueAtTime(1, audioContext.currentTime);
    cmpDryRef.current = cmpDry;

    // === オーバードライブ ===
    const odShaper = audioContext.createWaveShaper();
    odShaper.curve = makeDistortionCurve(0.3, "od");
    odShaper.oversample = "4x";
    odGainRef.current = odShaper;

    const odMix = audioContext.createGain();
    odMix.gain.setValueAtTime(0, audioContext.currentTime);
    odMixRef.current = odMix;

    const odDry = audioContext.createGain();
    odDry.gain.setValueAtTime(1, audioContext.currentTime);
    odDryRef.current = odDry;

    // === ディストーション ===
    const dsShaper = audioContext.createWaveShaper();
    dsShaper.curve = makeDistortionCurve(0.5, "ds");
    dsShaper.oversample = "4x";
    dsGainRef.current = dsShaper;

    const dsMix = audioContext.createGain();
    dsMix.gain.setValueAtTime(0, audioContext.currentTime);
    dsMixRef.current = dsMix;

    const dsDry = audioContext.createGain();
    dsDry.gain.setValueAtTime(1, audioContext.currentTime);
    dsDryRef.current = dsDry;

    // === コーラス ===
    const chorusDelay = audioContext.createDelay();
    chorusDelay.delayTime.setValueAtTime(0.03, audioContext.currentTime);
    chorusDelayRef.current = chorusDelay;

    const chorusLfo = audioContext.createOscillator();
    chorusLfo.type = "sine";
    chorusLfo.frequency.setValueAtTime(0.5, audioContext.currentTime);
    const chorusLfoGain = audioContext.createGain();
    chorusLfoGain.gain.setValueAtTime(0.002, audioContext.currentTime);
    chorusLfo.connect(chorusLfoGain);
    chorusLfoGain.connect(chorusDelay.delayTime);
    chorusLfo.start();
    chorusLfoRef.current = chorusLfo;

    const chorusMix = audioContext.createGain();
    chorusMix.gain.setValueAtTime(0, audioContext.currentTime);
    chorusMixRef.current = chorusMix;

    const chorusDry = audioContext.createGain();
    chorusDry.gain.setValueAtTime(1, audioContext.currentTime);
    chorusDryRef.current = chorusDry;

    // === ディレイ ===
    const delayNode = audioContext.createDelay(2);
    delayNode.delayTime.setValueAtTime(0.4, audioContext.currentTime);
    delayNodeRef.current = delayNode;

    const delayFeedback = audioContext.createGain();
    delayFeedback.gain.setValueAtTime(0.3, audioContext.currentTime);
    delayFeedbackRef.current = delayFeedback;

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    const delayMix = audioContext.createGain();
    delayMix.gain.setValueAtTime(0, audioContext.currentTime);
    delayMixRef.current = delayMix;

    const delayDry = audioContext.createGain();
    delayDry.gain.setValueAtTime(1, audioContext.currentTime);
    delayDryRef.current = delayDry;

    // === リバーブ ===
    const reverbConvolver = audioContext.createConvolver();
    reverbConvolver.buffer = createImpulseResponse(2, 2);
    reverbConvolverRef.current = reverbConvolver;

    const reverbMix = audioContext.createGain();
    reverbMix.gain.setValueAtTime(0, audioContext.currentTime);
    reverbMixRef.current = reverbMix;

    const reverbDry = audioContext.createGain();
    reverbDry.gain.setValueAtTime(1, audioContext.currentTime);
    reverbDryRef.current = reverbDry;

    // シグナルチェーンを構築
    // Input -> CMP -> OD -> DS -> Chorus -> Delay -> Reverb -> Master

    // CMP
    inputGain.connect(cmpDry);
    inputGain.connect(compressor);
    compressor.connect(cmpMix);

    // OD
    const afterCmp = audioContext.createGain();
    cmpDry.connect(afterCmp);
    cmpMix.connect(afterCmp);

    afterCmp.connect(odDry);
    afterCmp.connect(odShaper);
    odShaper.connect(odMix);

    // DS
    const afterOd = audioContext.createGain();
    odDry.connect(afterOd);
    odMix.connect(afterOd);

    afterOd.connect(dsDry);
    afterOd.connect(dsShaper);
    dsShaper.connect(dsMix);

    // Chorus
    const afterDs = audioContext.createGain();
    dsDry.connect(afterDs);
    dsMix.connect(afterDs);

    afterDs.connect(chorusDry);
    afterDs.connect(chorusDelay);
    chorusDelay.connect(chorusMix);

    // Delay
    const afterChorus = audioContext.createGain();
    chorusDry.connect(afterChorus);
    chorusMix.connect(afterChorus);

    afterChorus.connect(delayDry);
    afterChorus.connect(delayNode);
    delayNode.connect(delayMix);

    // Reverb
    const afterDelay = audioContext.createGain();
    delayDry.connect(afterDelay);
    delayMix.connect(afterDelay);

    afterDelay.connect(reverbDry);
    afterDelay.connect(reverbConvolver);
    reverbConvolver.connect(reverbMix);

    // Master
    reverbDry.connect(masterGain);
    reverbMix.connect(masterGain);

    // 初期化完了！
    setState((prev) => ({ ...prev, isInitialized: true }));
  }, [makeDistortionCurve, createImpulseResponse, loadAudioFile]);

  /**
   * 【音を鳴らす関数】
   *
   * ギターのイラストをタップしたときに呼ばれます。
   * 読み込んだ音源をループ再生します。
   */
  const play = useCallback(async () => {
    // まだ初期化されていなければ初期化を実行
    if (!audioContextRef.current || !inputGainRef.current) {
      await initialize();
    }

    const audioContext = audioContextRef.current!;

    // AudioContextが一時停止状態なら再開
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // すでに音が鳴っていたら一度停止
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // 既に停止している場合は無視
      }
    }

    // 音源がまだ読み込まれていなければロード
    if (!audioBufferRef.current) {
      await loadAudioFile(audioContext, state.currentSource);
    }

    if (!audioBufferRef.current) {
      console.error("Audio buffer not loaded");
      return;
    }

    // === 音源ノードを作成してループ再生 ===
    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;  // 読み込んだ音源をセット
    source.loop = true;                      // ループ再生ON
    source.connect(inputGainRef.current!);   // 入力ゲインに接続
    source.start();                          // 再生開始！
    sourceNodeRef.current = source;          // 参照を保存

    // 状態を「再生中」に更新
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, [initialize, loadAudioFile, state.currentSource]);

  /**
   * 【音を止める関数】
   * ミュートボタンを押したときに呼ばれます。
   */
  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop(); // 音源ノードを停止
      } catch {
        // 既に停止している場合は無視
      }
      sourceNodeRef.current = null; // 参照をクリア
    }

    // 状態を「停止中」に更新
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  /**
   * 【ペダルのON/OFF切り替え関数】
   *
   * ペダルのフットスイッチをタップしたときに呼ばれます。
   * ペダルのON/OFF状態を反転させ、エフェクトのMix（かかり具合）を調整します。
   *
   * 各エフェクターは「Dry（原音）」と「Mix（エフェクト音）」を持っていて、
   * ONにすると Mix の音量を上げ、OFFにすると 0 にします。
   *
   * @param pedalId - 操作するペダルのID（cmp, od, ds, ch, dl, rv）
   */
  const togglePedal = useCallback((pedalId: string) => {
    setState((prev) => {
      const newPedals = prev.pedals.map((pedal) => {
        if (pedal.id === pedalId) {
          const newEnabled = !pedal.enabled;

          // エフェクトのミックスを更新
          const amount = pedal.amount / 100;

          switch (pedalId) {
            case "cmp":
              if (cmpMixRef.current && cmpDryRef.current) {
                cmpMixRef.current.gain.setValueAtTime(newEnabled ? 1 : 0, audioContextRef.current?.currentTime || 0);
                cmpDryRef.current.gain.setValueAtTime(newEnabled ? 0 : 1, audioContextRef.current?.currentTime || 0);
              }
              break;
            case "od":
              if (odMixRef.current && odDryRef.current) {
                odMixRef.current.gain.setValueAtTime(newEnabled ? amount : 0, audioContextRef.current?.currentTime || 0);
                odDryRef.current.gain.setValueAtTime(newEnabled ? 1 - amount * 0.5 : 1, audioContextRef.current?.currentTime || 0);
              }
              break;
            case "ds":
              if (dsMixRef.current && dsDryRef.current) {
                dsMixRef.current.gain.setValueAtTime(newEnabled ? amount : 0, audioContextRef.current?.currentTime || 0);
                dsDryRef.current.gain.setValueAtTime(newEnabled ? 1 - amount * 0.5 : 1, audioContextRef.current?.currentTime || 0);
              }
              break;
            case "ch":
              if (chorusMixRef.current && chorusDryRef.current) {
                chorusMixRef.current.gain.setValueAtTime(newEnabled ? amount * 0.7 : 0, audioContextRef.current?.currentTime || 0);
                chorusDryRef.current.gain.setValueAtTime(1, audioContextRef.current?.currentTime || 0);
              }
              break;
            case "dl":
              if (delayMixRef.current && delayDryRef.current && delayFeedbackRef.current) {
                delayMixRef.current.gain.setValueAtTime(newEnabled ? amount * 0.5 : 0, audioContextRef.current?.currentTime || 0);
                delayFeedbackRef.current.gain.setValueAtTime(newEnabled ? amount * 0.4 : 0, audioContextRef.current?.currentTime || 0);
              }
              break;
            case "rv":
              if (reverbMixRef.current && reverbDryRef.current) {
                reverbMixRef.current.gain.setValueAtTime(newEnabled ? amount * 0.6 : 0, audioContextRef.current?.currentTime || 0);
                reverbDryRef.current.gain.setValueAtTime(1, audioContextRef.current?.currentTime || 0);
              }
              break;
          }

          return { ...pedal, enabled: newEnabled };
        }
        return pedal;
      });

      return { ...prev, pedals: newPedals };
    });
  }, []);

  // ペダルのアマウント変更
  const setPedalAmount = useCallback((pedalId: string, amount: number) => {
    setState((prev) => {
      const newPedals = prev.pedals.map((pedal) => {
        if (pedal.id === pedalId) {
          const normalizedAmount = amount / 100;

          if (pedal.enabled) {
            switch (pedalId) {
              case "cmp":
                if (compressorRef.current) {
                  // amountでthresholdとratioを調整
                  const threshold = -50 + normalizedAmount * 26; // -50dB to -24dB
                  const ratio = 1 + normalizedAmount * 19; // 1 to 20
                  compressorRef.current.threshold.setValueAtTime(threshold, audioContextRef.current?.currentTime || 0);
                  compressorRef.current.ratio.setValueAtTime(ratio, audioContextRef.current?.currentTime || 0);
                }
                break;
              case "od":
                if (odMixRef.current && odDryRef.current && odGainRef.current) {
                  odMixRef.current.gain.setValueAtTime(normalizedAmount, audioContextRef.current?.currentTime || 0);
                  odDryRef.current.gain.setValueAtTime(1 - normalizedAmount * 0.5, audioContextRef.current?.currentTime || 0);
                  odGainRef.current.curve = makeDistortionCurve(normalizedAmount * 0.6, "od");
                }
                break;
              case "ds":
                if (dsMixRef.current && dsDryRef.current && dsGainRef.current) {
                  dsMixRef.current.gain.setValueAtTime(normalizedAmount, audioContextRef.current?.currentTime || 0);
                  dsDryRef.current.gain.setValueAtTime(1 - normalizedAmount * 0.5, audioContextRef.current?.currentTime || 0);
                  dsGainRef.current.curve = makeDistortionCurve(normalizedAmount, "ds");
                }
                break;
              case "ch":
                if (chorusMixRef.current && chorusLfoRef.current) {
                  chorusMixRef.current.gain.setValueAtTime(normalizedAmount * 0.7, audioContextRef.current?.currentTime || 0);
                  chorusLfoRef.current.frequency.setValueAtTime(0.3 + normalizedAmount * 2, audioContextRef.current?.currentTime || 0);
                }
                break;
              case "dl":
                if (delayMixRef.current && delayFeedbackRef.current && delayNodeRef.current) {
                  delayMixRef.current.gain.setValueAtTime(normalizedAmount * 0.5, audioContextRef.current?.currentTime || 0);
                  delayFeedbackRef.current.gain.setValueAtTime(normalizedAmount * 0.4, audioContextRef.current?.currentTime || 0);
                  delayNodeRef.current.delayTime.setValueAtTime(0.2 + normalizedAmount * 0.4, audioContextRef.current?.currentTime || 0);
                }
                break;
              case "rv":
                if (reverbMixRef.current) {
                  reverbMixRef.current.gain.setValueAtTime(normalizedAmount * 0.6, audioContextRef.current?.currentTime || 0);
                }
                break;
            }
          }

          return { ...pedal, amount };
        }
        return pedal;
      });

      return { ...prev, pedals: newPedals };
    });
  }, [makeDistortionCurve]);

  // ペダル状態を一括設定（URLパラメータから復元用）
  const setPedalsState = useCallback((pedalsConfig: { id: string; enabled: boolean; amount: number }[]) => {
    setState((prev) => {
      const newPedals = prev.pedals.map((pedal) => {
        const config = pedalsConfig.find((c) => c.id === pedal.id);
        if (config) {
          return { ...pedal, enabled: config.enabled, amount: config.amount };
        }
        return pedal;
      });
      return { ...prev, pedals: newPedals };
    });
  }, []);

  // 音源切り替え
  const switchSource = useCallback(async (source: AudioSource) => {
    const wasPlaying = state.isPlaying;

    // 現在再生中なら停止
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // 既に停止している場合は無視
      }
      sourceNodeRef.current = null;
    }

    // 新しい音源をロード
    if (audioContextRef.current) {
      await loadAudioFile(audioContextRef.current, source);
    }

    // 状態を更新
    setState((prev) => ({ ...prev, currentSource: source, isPlaying: false }));

    // 再生中だった場合は自動的に再開
    if (wasPlaying && audioContextRef.current && inputGainRef.current && audioBufferRef.current) {
      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBufferRef.current;
      sourceNode.loop = true;
      sourceNode.connect(inputGainRef.current);
      sourceNode.start();
      sourceNodeRef.current = sourceNode;

      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [loadAudioFile, state.isPlaying]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // 既に停止している場合は無視
        }
      }

      if (chorusLfoRef.current) {
        try {
          chorusLfoRef.current.stop();
        } catch {
          // 既に停止している場合は無視
        }
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    play,
    stop,
    togglePedal,
    setPedalAmount,
    setPedalsState,
    switchSource,
    initialize,
  };
}
