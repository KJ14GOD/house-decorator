'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const TIPS = [
  "For best results, upload a clear photo of your room with good lighting.",
  "A clean room with minimal clutter helps our AI generate a more accurate model.",
  "Use our chatbot to refine your design ideas and get personalized suggestions.",
  "Explore our deep research section for inspiration and planning your dream room.",
  "Experiment with different photo perspectives for varied model outcomes."
];

const LoadingScreen: React.FC = () => {
  const router = useRouter();
  const [tipIndex, setTipIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generateModel = async () => {
      setError(null);
      try {
        // Retrieve file and perspective from localStorage
        const fileMetaRaw = localStorage.getItem('pendingModelFile');
        const fileData = localStorage.getItem('pendingModelFileData');
        const perspective = localStorage.getItem('pendingModelPerspective');
        if (!fileMetaRaw || !fileData || !perspective) {
          setError('Missing data for model generation.');
          return;
        }
        const fileMeta = JSON.parse(fileMetaRaw);
        // Convert base64 dataURL back to File
        const arr = fileData.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
          setError('Could not determine file type.');
          return;
        }
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], fileMeta.name, { type: mime, lastModified: fileMeta.lastModified });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('photo_perspective', perspective);

        const response = await fetch('/api/generate-room-model', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Failed to generate 3D model');
        }
        const result = await response.json();
        const modelData = result.model_data;
        if (!modelData) {
          throw new Error('Failed to generate 3D model data from the room image.');
        }
        // Save room as before
        const roomToSave = {
          width: modelData.width,
          length: modelData.length,
          height: modelData.height,
          floorColor: modelData.floorColor,
          ceilingColor: modelData.ceilingColor,
          wallFrontColor: modelData.wallFrontColor,
          wallBackColor: modelData.wallBackColor,
          wallLeftColor: modelData.wallLeftColor,
          wallRightColor: modelData.wallRightColor,
          blocks: modelData.blocks,
          name: `Generated Room ${new Date().toLocaleString()}`,
          meshy_model_url: result.meshy_model_url || null,
        };
        // Save to localStorage (simulate saveRoom, which is likely a backend call)
        // Here, just store modelData and meshy_model_url for /model page
        localStorage.setItem('roomState', JSON.stringify({
          ...modelData,
          chatMessages: modelData.chatMessages || [{ role: 'assistant', content: result.message }],
          meshy_model_url: modelData.meshy_model_url || null,
        }));
        if (result.message) {
          localStorage.setItem('infoMessage', JSON.stringify({ message: result.message }));
        }
        // Clean up temp data
        localStorage.removeItem('pendingModelFile');
        localStorage.removeItem('pendingModelFileData');
        localStorage.removeItem('pendingModelPerspective');
        // Navigate to model page
        router.push('/model');
      } catch (err: any) {
        setError(err.message || 'Failed to create 3D model.');
      }
    };
    generateModel();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f9fc',
      color: '#111',
    }}>
      {/* Loading Video */}
      <div style={{ marginBottom: 24, marginTop: -100 }}>
        <video
          src="/video/loadingscreen.webm"
          width={180}
          height={180}
          autoPlay
          loop
          muted
          playsInline
          style={{ borderRadius: 16 }}
        />
      </div>
      <div style={{ fontSize: 18, color: '#111', marginBottom: 24, minHeight: 24, fontWeight: 400 }}>
        {TIPS[tipIndex]}
      </div>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default LoadingScreen;
