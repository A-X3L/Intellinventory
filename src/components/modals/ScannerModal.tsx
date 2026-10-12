/**
 * @file ScannerModal.tsx
 * @description Scanner de composants électroniques par photo (Webcam / Fichier) avec Gemini 3.1 Flash Lite
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle, 
  MapPin, 
  Hash, 
  Loader2,
  RefreshCw,
  QrCode,
  Smartphone
} from 'lucide-react';
import { ElectronicComponent, PackageFormat, CATEGORIES_LIST } from '../../core/domain/types';
import { AiService, ScannedComponentData } from '../../services/ai.service';
import { processAndCompressImage } from '../../utils/image-processor';
import { QrCodeGenerator } from '../../utils/qr-generator';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComponent: (componentData: Partial<ElectronicComponent>) => Promise<void>;
}

type ScanStep = 'CAPTURE' | 'ANALYZING' | 'CONFIRM';

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveComponent
}) => {
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'FILE' | 'SMARTPHONE'>('CAMERA');
  const [step, setStep] = useState<ScanStep>('CAPTURE');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Données extraites par l'IA et modifiables par l'utilisateur
  const [formData, setFormData] = useState<Partial<ElectronicComponent>>({
    ref: '',
    family: '',
    type: '',
    category: 'Logique',
    package: 'CMS/SMD',
    footprint: '',
    pins: '',
    functionDesc: '',
    description: '',
    quantity: 1,
    minQuantity: 2,
    location: 'Casier A-01',
    imageUrl: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Références matérielles
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialisation ou arrêt du flux caméra
  useEffect(() => {
    if (isOpen && activeTab === 'CAMERA' && step === 'CAPTURE') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, step]);

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Erreur accès caméra :', err);
      setCameraActive(false);
      setErrorMessage(
        "Impossible d'accéder à la caméra (permission refusée ou caméra indisponible). Utilisez l'onglet « Importer un fichier »."
      );
      setActiveTab('FILE');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureFromVideo = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    setCapturedImage(dataUrl);
    analyzeImageWithGemini(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    try {
      const processed = await processAndCompressImage(file);
      setCapturedImage(processed.dataUrl);
      analyzeImageWithGemini(processed.dataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du traitement de l'image.");
    }
  };

  const analyzeImageWithGemini = async (imageDataUrl: string) => {
    setStep('ANALYZING');
    setErrorMessage(null);

    try {
      const scanned: ScannedComponentData = await AiService.scanComponent(imageDataUrl);

      setFormData({
        ref: scanned.reference || 'INCONNU',
        family: scanned.family || '',
        type: scanned.type || '',
        category: scanned.category || 'Discrets',
        package: scanned.format || 'CMS/SMD',
        footprint: scanned.footprint || '',
        pins: scanned.pins || '',
        functionDesc: scanned.functionDesc || '',
        description: scanned.description || '',
        quantity: 1,
        minQuantity: 2,
        location: 'Casier A-01',
        imageUrl: imageDataUrl
      });

      setStep('CONFIRM');
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'identification par l'IA.");
      setStep('CAPTURE');
      if (activeTab === 'CAMERA') {
        startCamera();
      }
    }
  };

  const handleResetScan = () => {
    setCapturedImage(null);
    setStep('CAPTURE');
    setErrorMessage(null);
    if (activeTab === 'CAMERA') {
      setTimeout(startCamera, 100);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ref?.trim()) {
      setErrorMessage('La référence est obligatoire.');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveComponent({
        ...formData,
        imageUrl: capturedImage || formData.imageUrl
      });
      stopCamera();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'enregistrement du composant.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900/95 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Scanner de Composant
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.1 Flash Lite
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Reconnaissance visuelle de marquages, boîtiers et familles de circuits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')
                ? 'bg-amber-950/40 border-amber-600/80 text-amber-200'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            }`}>
              <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
                errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`} />
              <div>
                <span className="font-semibold block">{errorMessage}</span>
                {(errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) && (
                  <span className="text-[11px] text-amber-300/80 mt-0.5 block">
                    Astuce : Patientez 60 secondes pour réinitialiser le quota gratuit de requêtes par minute (RPM).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ÉTAPE 1 : CAPTURE OU IMPORT PHOTO */}
          {step === 'CAPTURE' && (
            <div className="space-y-4">
              {/* Sélecteur d'onglet Source */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('CAMERA');
                    setTimeout(startCamera, 50);
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'CAMERA'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Webcam PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab('FILE');
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'FILE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fichier Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab('SMARTPHONE');
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'SMARTPHONE'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Connecter un smartphone par QR Code"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-200" />
                  <span>Smartphone (QR)</span>
                </button>
              </div>

              {/* Vue Caméra en direct */}
              {activeTab === 'CAMERA' && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 aspect-video flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viseur optique électronique */}
                  {cameraActive && (
                    <div className="absolute inset-8 border-2 border-dashed border-emerald-500/50 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                      <div className="w-full flex justify-between text-[10px] font-mono text-emerald-400 uppercase tracking-wider bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-sm">
                        <span>[Cadrage Composant]</span>
                        <span>Approchez le marquage</span>
                      </div>
                      <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                      <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                    </div>
                  )}

                  {/* Bouton de capture */}
                  {cameraActive ? (
                    <div className="absolute bottom-4 inset-x-0 flex justify-center">
                      <button
                        type="button"
                        onClick={handleCaptureFromVideo}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xl shadow-emerald-950/50 border-2 border-white/20 transition-transform active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Prendre la photo &amp; Identifier</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-500 text-xs">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                      <span>Initialisation du capteur vidéo...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Vue Import fichier image */}
              {activeTab === 'FILE' && (
                <div className="space-y-3">
                  <label 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 bg-slate-900/50 cursor-pointer transition-colors group aspect-video"
                  >
                    <Upload className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mb-3 transition-colors" />
                    <span className="text-sm font-semibold text-slate-200">
                      Cliquez ou glissez une photo du composant
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Formats supportés : JPG, PNG, WebP (net et lisible)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Vue Smartphone / QR Code direct */}
              {activeTab === 'SMARTPHONE' && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 aspect-video justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-slate-700 inline-block">
                    <div
                      className="w-36 h-36 flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: QrCodeGenerator.generateSvg(
                          typeof window !== 'undefined' ? `${window.location.origin}/capture` : '/capture',
                          144,
                          2
                        )
                      }}
                    />
                  </div>
                  <div className="max-w-md space-y-1">
                    <p className="text-xs font-bold text-amber-300">
                      Connexion smartphone instantanée (/capture)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Flashez ce QR Code avec votre smartphone pour capturer et transmettre la photo directement à ce poste.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : ANALYSE EN COURS */}
          {step === 'ANALYZING' && (
            <div className="p-8 text-center space-y-4">
              {capturedImage && (
                <div className="relative w-48 h-32 mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-md">
                  <img
                    src={capturedImage}
                    alt="Capture"
                    className="w-full h-full object-cover"
                  />
                  {/* Animation laser de scan */}
                  <div className="absolute inset-x-0 h-1 bg-emerald-400/90 shadow-[0_0_12px_#34d399] animate-bounce" />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyse visuelle en cours...</span>
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Gemini 3.1 Flash Lite examine le marquage sérigraphié, le nombre de broches et l'empreinte physique.
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : CONFIRMATION & AJUSTEMENT DES DONNÉES */}
          {step === 'CONFIRM' && (
            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm pr-1">
              {/* Aperçu photo + badge validation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700 gap-3">
                <div className="flex items-center gap-3">
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Composant scanné"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-600 shadow"
                    />
                  )}
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Composant reconnu par l'IA
                    </span>
                    <p className="text-xs text-slate-300 font-mono font-bold mt-0.5">
                      {formData.ref}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formData.footprint || 'Boîtier non spécifié'} • {formData.category}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetScan}
                  className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700"
                  title="Scanner une autre photo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-scanner</span>
                </button>
              </div>

              {/* Ligne 1 : Référence & Famille */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Référence Marquée <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ref || ''}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Famille Technologique
                  </label>
                  <input
                    type="text"
                    value={formData.family || ''}
                    onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Ligne 2 : Type fonctionnel & Broches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Type de composant
                  </label>
                  <input
                    type="text"
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nombre de Broches (Pins)
                  </label>
                  <input
                    type="text"
                    value={formData.pins || ''}
                    onChange={(e) => setFormData({ ...formData, pins: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Ligne 3 : Boîtier & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Boîtier / Footprint normalisé
                  </label>
                  <input
                    type="text"
                    value={formData.footprint || ''}
                    onChange={(e) => setFormData({ ...formData, footprint: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Format de Montage
                  </label>
                  <select
                    value={formData.package || 'CMS/SMD'}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value as PackageFormat })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CMS/SMD">CMS / SMD</option>
                    <option value="Traversant/DIP">Traversant / DIP</option>
                    <option value="Module">Module PCB</option>
                  </select>
                </div>
              </div>

              {/* Ligne 4 : Catégorie & Emplacement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.category || 'Discrets'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Emplacement en atelier
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Ligne 5 : Quantité initiale */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> Quantité initiale
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity ?? 1}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0, minQuantity: 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Ligne 6 : Fonction principale */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Fonction principale
                </label>
                <input
                  type="text"
                  value={formData.functionDesc || ''}
                  onChange={(e) => setFormData({ ...formData, functionDesc: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Ligne 7 : Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Notes techniques / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Actions de validation */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25 text-xs transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : "Valider et ajouter à l'inventaire"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
