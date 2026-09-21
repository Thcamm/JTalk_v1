import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioBase64: string | null;
  volumeLevel: number; // 0 to 100 for mic feedback indicator
  audioWaveformData: number[]; // Array of 0-1 normalized amplitudes for visualizer
  errorMessage: string | null;
}

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioWaveformData, setAudioWaveformData] = useState<number[]>(new Array(32).fill(0.05));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const cleanupAudioContext = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (_) {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (_) {}
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const updateVisualizer = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate overall volume level (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    setVolumeLevel(Math.min(100, Math.round((average / 128) * 100)));

    // Sample 32 frequency points for waveform animation
    const samples = 32;
    const step = Math.floor(bufferLength / samples);
    const wave = [];
    for (let i = 0; i < samples; i++) {
      const val = dataArray[i * step] / 255;
      wave.push(Math.max(0.08, val));
    }
    setAudioWaveformData(wave);

    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ ghi âm trực tiếp.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Set up AudioContext for real-time waveform visualization
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Select mimeType supported by browser
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = "";
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      // Duration counter
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

      // Start waveform loop
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    } catch (err: unknown) {
      const msg =
        (err as Error)?.name === "NotAllowedError"
          ? "Bạn đã từ chối quyền truy cập Microphone. Vui lòng cho phép để tiếp tục."
          : (err as Error)?.message || "Không thể khởi động microphone.";
      setErrorMessage(msg);
      cleanupAudioContext();
    }
  }, [cleanupAudioContext, updateVisualizer]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; url: string; base64: string; duration: number }> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanupAudioContext();
        setIsRecording(false);
        resolve({ blob: new Blob(), url: "", base64: "", duration: recordingDuration });
        return;
      }

      recorder.onstop = () => {
        const finalType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        const duration = recordingDuration;

        setAudioBlob(blob);
        setAudioUrl(url);

        // Convert to Base64 for fallback transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) || "";
          setAudioBase64(base64);
          cleanupAudioContext();
          setIsRecording(false);
          setVolumeLevel(0);
          setAudioWaveformData(new Array(32).fill(0.05));
          resolve({ blob, url, base64, duration });
        };
        reader.readAsDataURL(blob);
      };

      recorder.stop();
    });
  }, [cleanupAudioContext, recordingDuration]);

  const resetRecording = useCallback(() => {
    cleanupAudioContext();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setVolumeLevel(0);
    setAudioWaveformData(new Array(32).fill(0.05));
    setErrorMessage(null);
    audioChunksRef.current = [];
  }, [cleanupAudioContext]);

  useEffect(() => {
    return () => {
      cleanupAudioContext();
    };
  }, [cleanupAudioContext]);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    audioBlob,
    audioUrl,
    audioBase64,
    volumeLevel,
    audioWaveformData,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  };
};

export default useAudioRecorder;
