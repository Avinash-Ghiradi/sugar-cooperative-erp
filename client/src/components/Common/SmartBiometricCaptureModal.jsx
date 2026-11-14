import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Upload, X, Check, RefreshCw, RotateCw, Wand2,
  Sparkles, Sliders, AlertCircle, Sun, Image as ImageIcon,
  Crop, Eye, ArrowLeft, ZoomIn, ZoomOut, CheckCircle2, FileText,
  Smartphone, SwitchCamera
} from 'lucide-react';
import {
  detectFace,
  detectSignature,
  detectThumbImpression,
  cropAndExport,
  rotateCanvas,
  applyInkEnhancement,
  applyPhotoAutoLevels
} from '../../utils/biometricDetector';

/**
 * SmartBiometricCaptureModal
 * Direct Camera Capture + File Upload + AI Auto-Detect & Crop + Ink Enhancement
 * Mobile-friendly, touch-ergonomic, and works 100% offline.
 */
export default function SmartBiometricCaptureModal({
  isOpen,
  onClose,
  onCapture,
  type = 'photo', // 'photo' | 'signature' | 'thumb'
  title = '',
  initialImage = null
}) {
  // Mode configuration - Back Camera ('environment') is default for all office operations
  const config = {
    photo: {
      defaultTitle: 'ಭಾವಚಿತ್ರ (Shareholder Photo)',
      guideText: 'ಶೇರುದಾರರ ಭಾವಚಿತ್ರವನ್ನು ಚೌಕಟ್ಟಿನಲ್ಲಿ ಸರಿಯಾಗಿ ಕಾಣುವಂತೆ ಇರಿಸಿ',
      defaultFacing: 'environment', // Defaults to mobile BACK camera for photographing shareholder!
      defaultAspect: 3 / 4,
      aspectPresets: [
        { label: '3:4 ಪಾಸ್‌ಪೋರ್ಟ್', value: 3 / 4 },
        { label: '4:5 ಭಾವಚಿತ್ರ', value: 4 / 5 },
        { label: '1:1 ಚೌಕ', value: 1 / 1 },
        { label: 'ಮುಕ್ತ (Free)', value: null }
      ],
      aiDetector: detectFace,
      defaultEnhancement: 'auto_levels',
      aiLabel: 'ಮುಖ ಪತ್ತೆ (Face Detect)'
    },
    signature: {
      defaultTitle: 'ಸಹಿ (Shareholder Signature)',
      guideText: 'ಕಾಗದದ ಮೇಲಿನ ಸಹಿ ಸ್ಪಷ್ಟವಾಗಿ ಚೌಕಟ್ಟಿನಲ್ಲಿರಲಿ',
      defaultFacing: 'environment', // Rear camera pointing down at paper
      defaultAspect: 3 / 1,
      aspectPresets: [
        { label: '3:1 ಪಟ್ಟಿ (Strip)', value: 3 / 1 },
        { label: '4:2 ಸಾಮಾನ್ಯ', value: 4 / 2 },
        { label: 'ಮುಕ್ತ (Free)', value: null }
      ],
      aiDetector: detectSignature,
      defaultEnhancement: 'ink_clean',
      aiLabel: 'ಸಹಿ ಪತ್ತೆ (Signature Detect)'
    },
    thumb: {
      defaultTitle: 'ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು (Thumb Impression)',
      guideText: 'ಹೆಬ್ಬೆರಳಿನ ಗುರುತನ್ನು ಅಂಡಾಕಾರದ ಚೌಕಟ್ಟಿನಲ್ಲಿ ಇರಿಸಿ',
      defaultFacing: 'environment', // Rear camera pointing down at paper
      defaultAspect: 4 / 5,
      aspectPresets: [
        { label: '4:5 ಭಾವಚಿತ್ರ', value: 4 / 5 },
        { label: '1:1 ಚೌಕ', value: 1 / 1 },
        { label: 'ಮುಕ್ತ (Free)', value: null }
      ],
      aiDetector: detectThumbImpression,
      defaultEnhancement: 'ink_clean',
      aiLabel: 'ಹೆಬ್ಬೆರಳು ಪತ್ತೆ (Thumb Detect)'
    }
  }[type] || config.photo;

  // View state: 'camera' | 'upload' | 'crop'
  const [viewState, setViewState] = useState('camera');
  const [facingMode, setFacingMode] = useState('environment'); // Always default to back camera
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [activeCameraLabel, setActiveCameraLabel] = useState('');

  // Raw captured/uploaded image (HTMLImageElement or Canvas)
  const [rawSource, setRawSource] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);

  // Crop Box state: normalized or pixel coordinates
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 260 });
  const [aspectRatio, setAspectRatio] = useState(config.defaultAspect);
  const [enhancement, setEnhancement] = useState(config.defaultEnhancement);

  // References
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasDisplayRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const guideBoxRef = useRef(null);

  // Interaction tracking for touch & mouse drag
  const dragRef = useRef({
    isDragging: false,
    handle: null, // null (moving whole box), 'tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'
    startX: 0,
    startY: 0,
    startCrop: null
  });

  // Start / Stop camera stream with comprehensive mobile back camera fallback
  const startCamera = useCallback(async (targetFacing = 'environment', targetDeviceId = null) => {
    setCameraError(null);
    setIsCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('ಕ್ಯಾಮರಾ ಸೌಲಭ್ಯ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ.');
      }

      let stream = null;

      // 1. If explicit deviceId is provided
      if (targetDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDeviceId } },
            audio: false
          });
        } catch (e) {
          console.warn('Direct deviceId failed, falling back:', e);
        }
      }

      // 2. If environment (back camera) requested, attempt progressive fallbacks
      if (!stream && targetFacing === 'environment') {
        // Attempt A: exact environment with resolution
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { exact: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
        } catch (e) {
          // Attempt B: exact environment without resolution constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { exact: 'environment' } },
              audio: false
            });
          } catch (e2) {
            // Attempt C: ideal environment
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: { ideal: 'environment' },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              });
            } catch (e3) {
              console.warn('All environment facingMode attempts failed:', e3);
            }
          }
        }
      }

      // 3. If user (front camera) requested
      if (!stream && targetFacing === 'user') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'user' } },
            audio: false
          });
        } catch (e) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' },
              audio: false
            });
          } catch (e2) {}
        }
      }

      // 4. Generic video stream fallback
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('video play error:', e);
        }
        setIsCameraActive(true);

        // Check if torch/flashlight is supported
        const track = stream.getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings?.() || {};
          const label = track.label || '';
          setActiveCameraLabel(label || (targetFacing === 'environment' ? 'ಹಿಂಬದಿ ಕ್ಯಾಮೆರಾ (Back)' : 'ಮುಂಭಾಗ (Front)'));

          if (track.getCapabilities) {
            try {
              const caps = track.getCapabilities();
              setCanTorch(Boolean(caps.torch));
            } catch (e) {}
          }
        }
      }

      // Enumerate available cameras now that permission is active
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setAvailableCameras(videoDevices);
          if (videoDevices.length > 1) {
            setHasMultipleCameras(true);
          }

          // If environment was requested, verify if current track opened front camera by mistake
          if (targetFacing === 'environment' && videoDevices.length > 1) {
            const currentTrack = stream.getVideoTracks()[0];
            const currentLabel = (currentTrack?.label || '').toLowerCase();
            const currentSettings = currentTrack?.getSettings?.() || {};

            const isFront = currentLabel.includes('front') ||
                            currentLabel.includes('user') ||
                            currentLabel.includes('selfie') ||
                            currentSettings.facingMode === 'user';

            if (isFront) {
              // Find the rear camera device
              const rearDevice = videoDevices.find(d => {
                const lbl = (d.label || '').toLowerCase();
                return lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment') || lbl.includes('camera2 0');
              }) || videoDevices.find(d => d.deviceId !== currentSettings.deviceId);

              if (rearDevice && rearDevice.deviceId && rearDevice.deviceId !== targetDeviceId) {
                console.log('Auto-switching to detected rear camera:', rearDevice.label);
                const rearStream = await navigator.mediaDevices.getUserMedia({
                  video: { deviceId: { exact: rearDevice.deviceId } },
                  audio: false
                });
                stream.getTracks().forEach(t => t.stop());
                streamRef.current = rearStream;
                if (videoRef.current) {
                  videoRef.current.srcObject = rearStream;
                  await videoRef.current.play();
                  const rearTrack = rearStream.getVideoTracks()[0];
                  setActiveCameraLabel(rearTrack?.label || 'ಹಿಂಬದಿ ಕ್ಯಾಮೆರಾ (Back Camera)');
                  if (rearTrack?.getCapabilities) {
                    try {
                      setCanTorch(Boolean(rearTrack.getCapabilities().torch));
                    } catch (e) {}
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Enumerate devices error:', e);
        }
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError('ಕ್ಯಾಮರಾ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ (ದಯವಿಟ್ಟು ಅನುಮತಿ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಕೆಳಗಿನ "ಮೊಬೈಲ್ ಕ್ಯಾಮೆರಾ ಆಪ್" ಬಳಸಿ)');
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
  }, []);

  // When modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setEnhancement(config.defaultEnhancement);
      setAspectRatio(config.defaultAspect);

      if (initialImage) {
        loadImageToCrop(initialImage);
      } else {
        setViewState('camera');
        setFacingMode('environment'); // Always start with Back Camera!
        startCamera('environment');
      }
    } else {
      stopCamera();
      setRawSource(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, initialImage]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchOn(nextTorch);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Switch Facing
  const switchFacing = (newFacing) => {
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  // Flip Camera
  const flipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    switchFacing(nextFacing);
  };

  // Capture Photo from Camera - Extracts focused guide box region directly
  const snapPhoto = () => {
    if (!videoRef.current || !isCameraActive) return;

    if (navigator?.vibrate) {
      navigator.vibrate(40);
    }

    const video = videoRef.current;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    let cropX = 0;
    let cropY = 0;
    let cropW = vw;
    let cropH = vh;

    if (guideBoxRef.current && video) {
      const guideRect = guideBoxRef.current.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      const cw = videoRect.width;
      const ch = videoRect.height;

      if (cw > 0 && ch > 0 && guideRect.width > 0 && guideRect.height > 0) {
        // Video uses CSS object-cover
        const scale = Math.max(cw / vw, ch / vh);
        const shiftX = (vw * scale - cw) / 2;
        const shiftY = (vh * scale - ch) / 2;

        const screenX = guideRect.left - videoRect.left;
        const screenY = guideRect.top - videoRect.top;

        let frameX = (screenX + shiftX) / scale;
        let frameY = (screenY + shiftY) / scale;
        let frameW = guideRect.width / scale;
        let frameH = guideRect.height / scale;

        // If front camera, mirrored horizontally
        if (facingMode === 'user') {
          frameX = vw - frameX - frameW;
        }

        // Add 6% safety margin so boundary ink is never clipped
        const padX = frameW * 0.06;
        const padY = frameH * 0.06;

        cropX = Math.max(0, Math.floor(frameX - padX));
        cropY = Math.max(0, Math.floor(frameY - padY));
        cropW = Math.min(vw - cropX, Math.ceil(frameW + padX * 2));
        cropH = Math.min(vh - cropY, Math.ceil(frameH + padY * 2));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(10, cropW);
    canvas.height = Math.max(10, cropH);
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      const mirrorX = vw - cropX - cropW;
      ctx.drawImage(video, mirrorX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    }

    stopCamera();
    processRawImageForCrop(canvas, true);
  };

  // Handle File Upload from Disk / Gallery
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      loadImageToCrop(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadImageToCrop = (src) => {
    stopCamera();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      processRawImageForCrop(img, false);
    };
    img.src = src;
  };

  // Run AI Auto-Detection on raw image
  const processRawImageForCrop = async (sourceImgOrCanvas, fromCameraFocused = false) => {
    setRawSource(sourceImgOrCanvas);
    setViewState('crop');
    setIsAiProcessing(true);

    const imgW = sourceImgOrCanvas.width || sourceImgOrCanvas.naturalWidth || 800;
    const imgH = sourceImgOrCanvas.height || sourceImgOrCanvas.naturalHeight || 600;

    if (fromCameraFocused) {
      // The image is ALREADY cropped to the focused guide box region!
      const padX = imgW * 0.04;
      const padY = imgH * 0.04;
      setCropBox({
        x: Math.round(padX),
        y: Math.round(padY),
        width: Math.round(imgW - padX * 2),
        height: Math.round(imgH - padY * 2)
      });
      setAiConfidence(0.95);
      setIsAiProcessing(false);
      return;
    }

    try {
      const detected = await config.aiDetector(sourceImgOrCanvas);
      if (detected && detected.width && detected.height) {
        const isEntirePage = (detected.width > imgW * 0.85) && (detected.height > imgH * 0.80);
        if (isEntirePage) {
          let targetW, targetH;
          if (type === 'signature') {
            targetW = Math.round(imgW * 0.75);
            targetH = Math.round(targetW / 2.8);
          } else if (type === 'photo') {
            targetH = Math.round(imgH * 0.65);
            targetW = Math.round(targetH * (3 / 4));
          } else {
            targetH = Math.round(imgH * 0.60);
            targetW = Math.round(targetH * (4 / 5));
          }
          targetW = Math.min(imgW, targetW);
          targetH = Math.min(imgH, targetH);
          setCropBox({
            x: Math.round((imgW - targetW) / 2),
            y: Math.round((imgH - targetH) / 2),
            width: targetW,
            height: targetH
          });
        } else {
          setCropBox({
            x: detected.x,
            y: detected.y,
            width: detected.width,
            height: detected.height
          });
        }
        setAiConfidence(detected.confidence || 0.85);
      } else {
        let targetW, targetH;
        if (type === 'signature') {
          targetW = Math.round(imgW * 0.75);
          targetH = Math.round(targetW / 2.8);
        } else if (type === 'photo') {
          targetH = Math.round(imgH * 0.65);
          targetW = Math.round(targetH * (3 / 4));
        } else {
          targetH = Math.round(imgH * 0.60);
          targetW = Math.round(targetH * (4 / 5));
        }
        targetW = Math.min(imgW, targetW);
        targetH = Math.min(imgH, targetH);
        setCropBox({
          x: Math.round((imgW - targetW) / 2),
          y: Math.round((imgH - targetH) / 2),
          width: targetW,
          height: targetH
        });
      }
    } catch (err) {
      console.warn('AI Detection error:', err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    if (!rawSource) return;
    const newRot = (rotation + 90) % 360;
    setRotation(newRot);

    // Rotate raw canvas
    const rotated = rotateCanvas(rawSource, 90);
    setRawSource(rotated);

    // Rerun detection on rotated image
    setIsAiProcessing(true);
    config.aiDetector(rotated).then(detected => {
      if (detected) {
        setCropBox({
          x: detected.x,
          y: detected.y,
          width: detected.width,
          height: detected.height
        });
      }
      setIsAiProcessing(false);
    }).catch(() => setIsAiProcessing(false));
  };

  // Re-run AI Auto-Detect anytime
  const handleReRunAi = async () => {
    if (!rawSource) return;
    setIsAiProcessing(true);
    try {
      const detected = await config.aiDetector(rawSource);
      if (detected) {
        setCropBox({
          x: detected.x,
          y: detected.y,
          width: detected.width,
          height: detected.height
        });
        setAiConfidence(detected.confidence || 0.85);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Change Aspect Ratio Preset
  const handleAspectChange = (newRatio) => {
    setAspectRatio(newRatio);
    if (!rawSource || !newRatio) return;

    setCropBox(prev => {
      const imgW = rawSource.width || rawSource.naturalWidth;
      const imgH = rawSource.height || rawSource.naturalHeight;
      const currentCenterX = prev.x + prev.width / 2;
      const currentCenterY = prev.y + prev.height / 2;

      let newW = prev.width;
      let newH = Math.round(newW / newRatio);

      if (newH > imgH) {
        newH = imgH * 0.85;
        newW = Math.round(newH * newRatio);
      }
      if (newW > imgW) {
        newW = imgW * 0.85;
        newH = Math.round(newW / newRatio);
      }

      const newX = Math.max(0, Math.min(imgW - newW, currentCenterX - newW / 2));
      const newY = Math.max(0, Math.min(imgH - newH, currentCenterY - newH / 2));

      return { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    });
  };

  // Render Image and Crop Canvas
  useEffect(() => {
    if (viewState !== 'crop' || !rawSource || !canvasDisplayRef.current || !containerRef.current) return;

    const canvas = canvasDisplayRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');

    const imgW = rawSource.width || rawSource.naturalWidth;
    const imgH = rawSource.height || rawSource.naturalHeight;

    // Scale canvas to fit within container while preserving aspect ratio
    const contW = container.clientWidth || 360;
    const contH = container.clientHeight || 420;
    const scale = Math.min(contW / imgW, contH / imgH, 1);

    canvas.width = Math.round(imgW * scale);
    canvas.height = Math.round(imgH * scale);

    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(rawSource, 0, 0, canvas.width, canvas.height);

    // Darkened mask outside crop box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crop box in display canvas coordinates
    const dispX = Math.round(cropBox.x * scale);
    const dispY = Math.round(cropBox.y * scale);
    const dispW = Math.round(cropBox.width * scale);
    const dispH = Math.round(cropBox.height * scale);

    // Cut out crop box to reveal original image
    ctx.save();
    ctx.beginPath();
    ctx.rect(dispX, dispY, dispW, dispH);
    ctx.clip();
    ctx.drawImage(rawSource, 0, 0, canvas.width, canvas.height);

    // Optional real-time preview of ink clean or auto-levels inside crop box
    if (enhancement === 'ink_clean' && (type === 'signature' || type === 'thumb')) {
      const croppedData = ctx.getImageData(dispX, dispY, dispW, dispH);
      const d = croppedData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum > 170) {
          d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
        } else {
          d[i] = Math.round(d[i] * 0.7);
          d[i + 1] = Math.round(d[i + 1] * 0.7);
          d[i + 2] = Math.min(130, Math.round(d[i + 2] * 0.9));
        }
      }
      ctx.putImageData(croppedData, dispX, dispY);
    }
    ctx.restore();

    // Draw bright boundary box
    ctx.strokeStyle = '#10B981'; // Emerald 500
    ctx.lineWidth = 2.5;
    ctx.strokeRect(dispX, dispY, dispW, dispH);

    // Draw grid lines inside crop box (rule of thirds)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dispX + dispW / 3, dispY);
    ctx.lineTo(dispX + dispW / 3, dispY + dispH);
    ctx.moveTo(dispX + (dispW * 2) / 3, dispY);
    ctx.lineTo(dispX + (dispW * 2) / 3, dispY + dispH);
    ctx.moveTo(dispX, dispY + dispH / 3);
    ctx.lineTo(dispX + dispW, dispY + dispH / 3);
    ctx.moveTo(dispX, dispY + (dispH * 2) / 3);
    ctx.lineTo(dispX + dispW, dispY + (dispH * 2) / 3);
    ctx.stroke();

    // Draw corner handles
    const handleSize = 14;
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const corners = [
      [dispX, dispY], // TL
      [dispX + dispW, dispY], // TR
      [dispX, dispY + dispH], // BL
      [dispX + dispW, dispY + dispH] // BR
    ];

    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

  }, [viewState, rawSource, cropBox, enhancement, type]);

  // Touch & Mouse Handling for moving and resizing Crop Box
  const getPointerPos = (e) => {
    const canvas = canvasDisplayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scale = (rawSource.width || rawSource.naturalWidth) / canvas.width;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale
    };
  };

  const handlePointerDown = (e) => {
    if (viewState !== 'crop' || !rawSource) return;
    const pos = getPointerPos(e);
    const { x, y, width, height } = cropBox;
    const handleHitDist = Math.max(30, width * 0.15); // Hit tolerance

    // Check which handle was hit
    let handle = null;
    if (Math.hypot(pos.x - x, pos.y - y) < handleHitDist) handle = 'tl';
    else if (Math.hypot(pos.x - (x + width), pos.y - y) < handleHitDist) handle = 'tr';
    else if (Math.hypot(pos.x - x, pos.y - (y + height)) < handleHitDist) handle = 'bl';
    else if (Math.hypot(pos.x - (x + width), pos.y - (y + height)) < handleHitDist) handle = 'br';
    else if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
      handle = 'move';
    }

    if (handle) {
      dragRef.current = {
        isDragging: true,
        handle,
        startX: pos.x,
        startY: pos.y,
        startCrop: { ...cropBox }
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging || !rawSource) return;
    const pos = getPointerPos(e);
    const { handle, startX, startY, startCrop } = dragRef.current;
    const dx = pos.x - startX;
    const dy = pos.y - startY;

    const imgW = rawSource.width || rawSource.naturalWidth;
    const imgH = rawSource.height || rawSource.naturalHeight;

    if (handle === 'move') {
      const newX = Math.max(0, Math.min(imgW - startCrop.width, startCrop.x + dx));
      const newY = Math.max(0, Math.min(imgH - startCrop.height, startCrop.y + dy));
      setCropBox({ ...startCrop, x: Math.round(newX), y: Math.round(newY) });
    } else {
      let newX = startCrop.x;
      let newY = startCrop.y;
      let newW = startCrop.width;
      let newH = startCrop.height;

      if (handle === 'br') {
        newW = Math.max(40, startCrop.width + dx);
        newH = aspectRatio ? newW / aspectRatio : Math.max(40, startCrop.height + dy);
      } else if (handle === 'bl') {
        newW = Math.max(40, startCrop.width - dx);
        newH = aspectRatio ? newW / aspectRatio : Math.max(40, startCrop.height + dy);
        newX = startCrop.x + (startCrop.width - newW);
      } else if (handle === 'tr') {
        newW = Math.max(40, startCrop.width + dx);
        newH = aspectRatio ? newW / aspectRatio : Math.max(40, startCrop.height - dy);
        newY = startCrop.y + (startCrop.height - newH);
      } else if (handle === 'tl') {
        newW = Math.max(40, startCrop.width - dx);
        newH = aspectRatio ? newW / aspectRatio : Math.max(40, startCrop.height - dy);
        newX = startCrop.x + (startCrop.width - newW);
        newY = startCrop.y + (startCrop.height - newH);
      }

      // Constrain within image bounds
      newX = Math.max(0, Math.min(imgW - 40, newX));
      newY = Math.max(0, Math.min(imgH - 40, newY));
      newW = Math.min(imgW - newX, newW);
      newH = Math.min(imgH - newY, newH);

      setCropBox({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH)
      });
    }
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.handle = null;
  };

  // Final Confirmation: Crop, compress, and emit
  const handleSaveAndApply = () => {
    if (!rawSource) return;

    const base64 = cropAndExport(rawSource, cropBox, {
      maxWidth: type === 'signature' ? 640 : 500,
      maxHeight: type === 'signature' ? 320 : 600,
      quality: 0.85,
      enhancement: enhancement,
      mode: type
    });

    if (onCapture) {
      onCapture(base64);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none touch-none">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[96dvh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {viewState === 'crop' && (
              <button
                type="button"
                onClick={() => {
                  setViewState('camera');
                  startCamera(facingMode);
                }}
                className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="ಮತ್ತೆ ಕ್ಯಾಪ್ಚರ್ ಮಾಡಿ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                {title || config.defaultTitle}
                {isAiProcessing && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                    <Sparkles className="w-3 h-3" /> AI ಪತ್ತೆಹಚ್ಚುತ್ತಿದೆ...
                  </span>
                )}
                {aiConfidence && !isAiProcessing && viewState === 'crop' && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> AI ಆಟೋ-ಕ್ರಾಪ್
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">{config.guideText}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Content */}
        <div
          ref={containerRef}
          className="flex-1 min-h-[320px] sm:min-h-[400px] max-h-[58dvh] bg-black relative flex items-center justify-center overflow-hidden"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {viewState === 'camera' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {type === 'photo' && (
                  <div
                    ref={guideBoxRef}
                    className="w-[216px] h-[288px] sm:w-[246px] sm:h-[328px] max-w-[82vw] max-h-[62vh] border-2 border-dashed border-amber-400 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-3 pointer-events-none"
                    style={{ aspectRatio: '3 / 4' }}
                  >
                    <span className="text-[11px] font-medium text-amber-300 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow">
                      ಭಾವಚಿತ್ರ (Photo)
                    </span>
                  </div>
                )}
                {type === 'signature' && (
                  <div
                    ref={guideBoxRef}
                    className="w-[84%] max-w-sm h-28 border-2 border-dashed border-sky-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-2 pointer-events-none"
                  >
                    <span className="text-[11px] font-medium text-sky-300 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow">
                      ಕಾಗದದ ಮೇಲಿನ ಸಹಿ (Signature)
                    </span>
                    <div className="w-full border-b border-sky-400/30 mt-3" />
                  </div>
                )}
                {type === 'thumb' && (
                  <div
                    ref={guideBoxRef}
                    className="w-[180px] h-[225px] sm:w-[200px] sm:h-[250px] max-w-[72vw] max-h-[52vh] border-2 border-dashed border-emerald-400/90 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-3 pointer-events-none"
                    style={{ aspectRatio: '4 / 5' }}
                  >
                    <span className="text-[11px] font-medium text-emerald-300 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow">
                      ಹೆಬ್ಬೆರಳು (Thumb)
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Switcher Pills (Top Left) */}
              <div className="absolute top-3 left-3 flex items-center bg-black/75 backdrop-blur-md rounded-2xl p-1 border border-slate-700/80 z-10 shadow-lg">
                <button
                  type="button"
                  onClick={() => switchFacing('environment')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    facingMode === 'environment'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="ಹಿಂಬದಿ ಕ್ಯಾಮೆರಾ ಆಯ್ಕೆಮಾಡಿ (Back Camera)"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ಹಿಂಬದಿ (Back)</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchFacing('user')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    facingMode === 'user'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="ಮುಂಭಾಗದ ಸೆಲ್ಫಿ ಕ್ಯಾಮೆರಾ ಆಯ್ಕೆಮಾಡಿ (Front Camera)"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  <span>ಮುಂಭಾಗ (Front)</span>
                </button>
              </div>

              {/* Torch & Flip Camera Overlays (Top Right) */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                {canTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${torchOn ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-black/60 text-white hover:bg-black/80'}`}
                    title="ಟಾರ್ಚ್ / ಫ್ಲ್ಯಾಶ್"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={flipCamera}
                  className="p-2.5 rounded-full bg-black/70 text-white hover:bg-black/90 backdrop-blur-md transition-colors cursor-pointer border border-slate-700/60 shadow-lg"
                  title="ಕ್ಯಾಮರಾ ಬದಲಾಯಿಸಿ (Flip Camera Front/Back)"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                  <AlertCircle className="w-12 h-12 text-rose-500" />
                  <p className="text-sm text-slate-300 max-w-xs">{cameraError}</p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>ಫೋನ್ ಕ್ಯಾಮೆರಾ ಆಪ್ ಬಳಸಿ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700"
                    >
                      ಗ್ಯಾಲರಿಯಿಂದ ಆರಿಸಿ
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs cursor-pointer"
                    >
                      ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <canvas
              ref={canvasDisplayRef}
              className="max-w-full max-h-full cursor-move touch-none"
            />
          )}
        </div>

        {/* Bottom Toolbar & Controls */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {viewState === 'camera' ? (
            <div className="flex items-center justify-around max-w-md mx-auto gap-3">
              {/* Native Phone Camera Option */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors p-2 cursor-pointer"
                title="ಮೊಬೈಲ್‌ನ ಸ್ವಂತ ಕ್ಯಾಮೆರಾ ಆಪ್‌ನಲ್ಲಿ ಫೋಟೋ ತೆಗೆಯಿರಿ"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900/80 flex items-center justify-center text-emerald-400 transition-colors border border-emerald-800/80 shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">ಫೋನ್ ಕ್ಯಾಮೆರಾ</span>
              </button>

              {/* Big Touch Shutter Button */}
              <button
                type="button"
                onClick={snapPhoto}
                disabled={!isCameraActive}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
                  isCameraActive
                    ? 'border-emerald-500 bg-white hover:bg-emerald-50 text-emerald-600 cursor-pointer shadow-emerald-500/20'
                    : 'border-slate-700 bg-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                }`}
                title="ಲೈವ್ ಫೋಟೋ ಕ್ಲಿಕ್ ಮಾಡಿ (Click Photo)"
              >
                <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Gallery / File Upload Option */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors p-2 cursor-pointer"
                title="ಗ್ಯಾಲರಿ ಅಥವಾ ಫೈಲ್‌ನಿಂದ ಅಪ್ಲೋಡ್ ಮಾಡಿ"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 transition-colors border border-slate-700 shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">ಗ್ಯಾಲರಿ / ಫೈಲ್</span>
              </button>
            </div>
          ) : (
            // Crop Mode Tools
            <div className="space-y-3">
              {/* Presets and Adjustment Tools */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                {/* Aspect Ratio Pills */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {config.aspectPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAspectChange(preset.value)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        aspectRatio === preset.value
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Enhancement & Rotation Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Re-run AI Detect */}
                  <button
                    type="button"
                    onClick={handleReRunAi}
                    disabled={isAiProcessing}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1 border border-slate-700"
                    title="AI ಮೂಲಕ ಮರು-ಪತ್ತೆ ಮಾಡಿ"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI ಡಿಟೆಕ್ಟ್</span>
                  </button>

                  {/* Rotate 90° */}
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
                    title="90° ತಿರುಗಿಸಿ (Rotate)"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Ink Clean Filter Toggle (For Signature & Thumb) */}
                  {(type === 'signature' || type === 'thumb') && (
                    <button
                      type="button"
                      onClick={() => setEnhancement(prev => prev === 'ink_clean' ? 'none' : 'ink_clean')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                        enhancement === 'ink_clean'
                          ? 'bg-sky-950 text-sky-400 border-sky-700'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="ಕಾಗದದ ನೆರಳು ತೆಗೆದು ಶಾಯಿ ಸ್ಪಷ್ಟಪಡಿಸಿ (Clean Ink & White Background)"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ಶಾಯಿ ಕ್ಲೀನ್ (Ink)</span>
                    </button>
                  )}

                  {/* Auto Levels for Photo */}
                  {type === 'photo' && (
                    <button
                      type="button"
                      onClick={() => setEnhancement(prev => prev === 'auto_levels' ? 'none' : 'auto_levels')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                        enhancement === 'auto_levels'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="ಬೆಳಕು ಮತ್ತು ಸ್ಪಷ್ಟತೆ ಹೆಚ್ಚಿಸಿ"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ಆಟೋ ಕ್ಲಾರಿಟಿ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons: Retake vs Save */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewState('camera');
                    startCamera(facingMode);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Camera className="w-4 h-4" />
                  <span>ಮತ್ತೆ ತೆಗೆಯಿರಿ (Retake)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndApply}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>ಅನ್ವಯಿಸಿ & ಉಳಿಸಿ (Apply & Save)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Native Phone Camera Input (Direct mobile back camera launcher) */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Hidden File Input for Gallery / Local Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
