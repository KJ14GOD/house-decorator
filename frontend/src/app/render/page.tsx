'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function RoomModel({ url }: { url: string }) {
  const { scene } = useGLTF(`/api/model-proxy?url=${encodeURIComponent(url)}`);
  return <primitive object={scene} />;
}

function Viewer({ url }: { url: string }) {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <Suspense fallback={null}>
        <RoomModel url={url} />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}

function RenderPageComponent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const modelUrl = searchParams.get('model_url');
    if (modelUrl) {
      setUrl(modelUrl);
    }
  }, [searchParams]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f0f0' }}>
      {url ? <Viewer url={url} /> : <p>Waiting for model URL...</p>}
    </div>
  );
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderPageComponent />
    </Suspense>
  );
}