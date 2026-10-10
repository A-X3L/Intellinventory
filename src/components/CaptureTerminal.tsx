/**
 * @file CaptureTerminal.tsx
 * @description Terminal de Capture Distant ultra-léger pour smartphone / tablette (/capture).
 * Comporte un viseur caméra plein écran, un déclencheur photo et un enregistreur micro avec
 * transmission synchrone immédiate vers le BFF local.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Square, CheckCircle2, AlertCircle, RefreshCw, Zap, ArrowLeft, Radio } from 'lucide-react';

export const CaptureTerminal: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState(0);
  const [lastSentStatus, setLastSentStatus] = useState<{ id: string; type: 'photo' | 'audio'; time: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Initialisation du flux caméra arrière (environment)
  const initCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Erreur accès caméra :", err);
      setCameraError("Accès caméra refusé ou indisponible sur cet appareil.");
    }
  };

  useEffect(() => {
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Déclencheur Photo
  const takePhotoAndPush = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    setUploadError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const res = await fetch('/api/capture/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'photo', dataUrl })
        });
        const data = await res.json();
        if (data.success) {
          setLastSentStatus({ id: data.id, type: 'photo', time: data.timestamp });
        } else {
          setUploadError("Échec d'envoi de la photo au BFF.");
        }
      } catch (err: any) {
        setUploadError("Erreur réseau lors de la transmission synchrone.");
      }
    }
    setTimeout(() => setIsCapturing(false), 300);
  };

  // Enregistrement Micro
  const startAudioRecording = async () => {
    setUploadError(null);
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        audioStream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64 DataURL
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const res = await fetch('/api/capture/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'audio', dataUrl: base64Audio })
            });
            const data = await res.json();
            if (data.success) {
              setLastSentStatus({ id: data.id, type: 'audio', time: data.timestamp });
            } else {
              setUploadError("Échec de transmission de la note vocale.");
            }
          } catch (err) {
            setUploadError("Erreur d'envoi synchrone de l'audio.");
          }
        };
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setAudioRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setAudioRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setCameraError("Accès au microphone refusé.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Canvas invisible pour capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* En-tête Terminal Distant */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.href = '/'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            title="Retour à l'inventaire principal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Terminal de Capture</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-3 h-3 animate-pulse" />
                Synchrone
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Flux instantané vers le poste PC active</p>
          </div>
        </div>

        <button 
          onClick={initCamera} 
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 border border-slate-700"
          title="Réinitialiser la caméra"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Viseur Caméra Plein Écran */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center max-w-xs bg-slate-900 border border-slate-800 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-xs text-slate-300 mb-4">{cameraError}</p>
            <button 
              onClick={initCamera}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-xl text-white"
            >
              Réessayer l'accès caméra
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />

            {/* Overlay Viseur Ingénieur */}
            <div className="absolute inset-0 border-2 border-emerald-500/30 pointer-events-none flex flex-col justify-between p-6">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              </div>
              <div className="self-center bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] text-emerald-300 border border-emerald-500/30 font-mono">
                CADRAGE COMPOSANT ATELIER
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>

            {/* Flash de capture */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white opacity-80 animate-ping z-30" />
            )}
          </>
        )}

        {/* Bannières de Statut de Transmission */}
        <div className="absolute top-4 left-4 right-4 z-20 space-y-2">
          {lastSentStatus && (
            <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>{lastSentStatus.type === 'photo' ? 'Photo' : 'Note vocale'}</strong> transmise avec succès au grand écran !
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 opacity-80">{lastSentStatus.time}</span>
            </div>
          )}

          {uploadError && (
            <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Barre de Commandes Tactile (Bas de l'écran) */}
      <div className="bg-slate-900/95 backdrop-blur-xl px-6 py-6 border-t border-slate-800 flex items-center justify-around z-20">
        {/* Enregistreur Vocale Micro */}
        {isRecordingAudio ? (
          <button
            onClick={stopAudioRecording}
            className="flex flex-col items-center gap-1 text-rose-400 animate-pulse"
          >
            <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40">
              <Square className="w-7 h-7 fill-current" />
            </div>
            <span className="text-[11px] font-mono text-rose-300 font-bold">{audioRecordingTime}s (Stopper)</span>
          </button>
        ) : (
          <button
            onClick={startAudioRecording}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white"
            title="Enregistrer une note vocale"
          >
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 active:scale-95 transition">
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-slate-400">Micro Voice</span>
          </button>
        )}

        {/* Déclencheur Photo Principal */}
        <button
          onClick={takePhotoAndPush}
          disabled={isCapturing || !!cameraError}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform disabled:opacity-50"
          title="Capturer la photo et la pousser au PC"
        >
          <div className="w-20 h-20 rounded-full border-4 border-emerald-500 p-1 flex items-center justify-center bg-emerald-500/10 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 group-hover:bg-emerald-400 transition">
              <Camera className="w-8 h-8" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Déclencheur</span>
        </button>

        {/* Mode Flash / Info */}
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-slate-400">Direct BFF</span>
        </div>
      </div>
    </div>
  );
};
