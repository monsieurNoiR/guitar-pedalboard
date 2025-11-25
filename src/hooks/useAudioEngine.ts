"use client";

import { useCallback, useRef, useEffect, useState } from "react";

export interface PedalState {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  enabled: boolean;
  amount: number;
}

export type AudioSource = "a" | "b" | "c";

export interface AudioEngineState {
  isPlaying: boolean;
  isInitialized: boolean;
  pedals: PedalState[];
  currentSource: AudioSource;
}

const DEFAULT_PEDALS: PedalState[] = [
  {
    id: "cmp",
    name: "COMPRESSOR",
    shortName: "CMP",
    description: "音の強弱を均等にして弾きやすくする",
    color: "#0019ff",
    enabled: false,
    amount: 50,
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

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const inputGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // エフェクトノード
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const cmpMixRef = useRef<GainNode | null>(null);
  const cmpDryRef = useRef<GainNode | null>(null);

  const odGainRef = useRef<WaveShaperNode | null>(null);
  const odMixRef = useRef<GainNode | null>(null);
  const odDryRef = useRef<GainNode | null>(null);

  const dsGainRef = useRef<WaveShaperNode | null>(null);
  const dsMixRef = useRef<GainNode | null>(null);
  const dsDryRef = useRef<GainNode | null>(null);

  const chorusDelayRef = useRef<DelayNode | null>(null);
  const chorusLfoRef = useRef<OscillatorNode | null>(null);
  const chorusMixRef = useRef<GainNode | null>(null);
  const chorusDryRef = useRef<GainNode | null>(null);

  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayMixRef = useRef<GainNode | null>(null);
  const delayDryRef = useRef<GainNode | null>(null);

  const reverbConvolverRef = useRef<ConvolverNode | null>(null);
  const reverbMixRef = useRef<GainNode | null>(null);
  const reverbDryRef = useRef<GainNode | null>(null);

  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isInitialized: false,
    pedals: DEFAULT_PEDALS,
    currentSource: "a",
  });

  // ディストーションカーブを作成
  const makeDistortionCurve = useCallback((amount: number, type: "od" | "ds") => {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      if (type === "od") {
        // ソフトクリッピング（オーバードライブ）
        curve[i] = ((3 + amount * 10) * x * 20 * deg) / (Math.PI + amount * 10 * Math.abs(x));
      } else {
        // ハードクリッピング（ディストーション）
        const k = amount * 50 + 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
    }
    return curve;
  }, []);

  // インパルスレスポンスを生成（リバーブ用）
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

  // WAVファイルをロード
  const loadAudioFile = useCallback(async (audioContext: AudioContext, source: AudioSource = "a") => {
    try {
      const response = await fetch(`/clean-${source}.wav`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio file: clean-${source}.wav`, error);
      return null;
    }
  }, []);

  // オーディオエンジンの初期化
  const initialize = useCallback(async () => {
    if (audioContextRef.current) return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // WAVファイルをロード（デフォルトはA）
    await loadAudioFile(audioContext, "a");

    // マスターゲイン
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.7, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
    masterGainRef.current = masterGain;

    // 入力ゲイン
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

    setState((prev) => ({ ...prev, isInitialized: true }));
  }, [makeDistortionCurve, createImpulseResponse, loadAudioFile]);

  // 再生開始
  const play = useCallback(async () => {
    if (!audioContextRef.current || !inputGainRef.current) {
      await initialize();
    }

    const audioContext = audioContextRef.current!;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // 既存のソースを停止
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // 既に停止している場合は無視
      }
    }

    // AudioBufferがなければロード
    if (!audioBufferRef.current) {
      await loadAudioFile(audioContext, state.currentSource);
    }

    if (!audioBufferRef.current) {
      console.error("Audio buffer not loaded");
      return;
    }

    // 新しいソースノードを作成（ループ再生）
    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.loop = true;
    source.connect(inputGainRef.current!);
    source.start();
    sourceNodeRef.current = source;

    setState((prev) => ({ ...prev, isPlaying: true }));
  }, [initialize, loadAudioFile, state.currentSource]);

  // 停止
  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // 既に停止している場合は無視
      }
      sourceNodeRef.current = null;
    }

    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  // ペダルのON/OFF切り替え
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
