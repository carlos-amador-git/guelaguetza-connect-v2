import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Camera, X, Box, Info, RotateCcw, Scan, Zap, Palette, Disc, Loader2, Maximize } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Sparkles, Float, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

// --- DATA DEFINITIONS ---

interface MarkerData {
  id: string;
  name: string;
  region: string;
  description: string;
  color: string;
  bgColor: string;
}

const MARKERS_DATA: MarkerData[] = [
  {
    id: 'danzante',
    name: 'Danzante de la Pluma',
    region: 'Valles Centrales',
    description: 'Simboliza la conquista de México. El penacho representa el sol y el poder espiritual, adornado con espejos para reflejar la luz divina.',
    color: '#D9006C', // Oaxaca Pink
    bgColor: 'from-gray-900 via-purple-900/20 to-black'
  },
  {
    id: 'barro',
    name: 'Olla de Barro Negro',
    region: 'San Bartolo Coyotepec',
    description: 'Artesanía ancestral de arcilla negra pulida y calada. Su color característico se obtiene mediante un proceso de horneado especial sin oxígeno.',
    color: '#1C1917', // Oaxaca Dark
    bgColor: 'from-gray-800 via-gray-900 to-black'
  },
  {
    id: 'alebrije',
    name: 'Alebrije Mágico',
    region: 'San Martín Tilcajete',
    description: 'Seres fantásticos tallados en madera de copal y pintados a mano con diseños zapotecos. Se cree que son guías espirituales.',
    color: '#FFD100', // Oaxaca Yellow
    bgColor: 'from-indigo-900 via-purple-900 to-pink-900'
  }
];

// --- 3D MODELS ---

const DanzanteModel = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
       groupRef.current.position.y = -1 + Math.sin(state.clock.elapsedTime) * 0.1;
       groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#C18C5D" roughness={0.5} />
      </mesh>
      {/* Headdress (Penacho) */}
      <group position={[0, 1.8, -0.1]}>
        {Array.from({ length: 11 }).map((_, i) => {
            const angle = (i - 5) * (Math.PI / 10);
            return (
               <mesh key={i} position={[Math.sin(angle) * 0.7, Math.cos(angle) * 0.7, 0]} rotation={[0, 0, -angle]}>
                 <boxGeometry args={[0.1, 0.6, 0.05]} />
                 <meshStandardMaterial color={i % 2 === 0 ? "#D9006C" : "#FFD100"} emissive={i % 2 === 0 ? "#6A0F49" : "#D9006C"} emissiveIntensity={0.2} />
               </mesh>
            )
        })}
         <mesh position={[0, 0, 0.05]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial color="#FFD100" metalness={0.8} roughness={0.2} />
         </mesh>
      </group>
      {/* Body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 1.4, 32]} />
        <meshStandardMaterial color="#6A0F49" />
      </mesh>
      {/* Cape */}
      <mesh position={[0, 0.8, -0.35]} rotation={[0.1, 0, 0]}>
         <boxGeometry args={[0.8, 1.4, 0.1]} />
         <meshStandardMaterial color="#D9006C" side={THREE.DoubleSide} />
      </mesh>
      {/* Arms */}
      <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#C18C5D" />
      </mesh>
      <mesh position={[-0.4, 1.2, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#C18C5D" />
      </mesh>
      <mesh position={[0.6, 1.0, 0.2]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FFD100" />
      </mesh>
    </group>
  );
};

const BarroNegroModel = () => {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={[0, -0.5, 0]}>
                {/* Main Pot Body */}
                <mesh castShadow position={[0, 0, 0]}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <meshStandardMaterial 
                        color="#111111" 
                        metalness={0.6} 
                        roughness={0.2} 
                        envMapIntensity={1}
                    />
                </mesh>
                {/* Neck */}
                <mesh position={[0, 0.9, 0]}>
                    <cylinderGeometry args={[0.4, 0.5, 0.5, 32]} />
                    <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.2} />
                </mesh>
                {/* Rim */}
                <mesh position={[0, 1.15, 0]}>
                    <torusGeometry args={[0.4, 0.05, 16, 32]} rotation={[Math.PI/2, 0, 0]} />
                    <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.1} />
                </mesh>
                {/* Handles */}
                <mesh position={[0.9, 0.3, 0]} rotation={[0, 0, Math.PI/2]}>
                    <torusGeometry args={[0.2, 0.05, 16, 32]} />
                    <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.2} />
                </mesh>
                <mesh position={[-0.9, 0.3, 0]} rotation={[0, 0, Math.PI/2]}>
                    <torusGeometry args={[0.2, 0.05, 16, 32]} />
                    <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.2} />
                </mesh>
                {/* Decorative Pattern (Simulated with Torus knots inside) */}
                <mesh scale={[0.98, 0.98, 0.98]}>
                     <sphereGeometry args={[1, 16, 16]} />
                     <meshBasicMaterial color="black" wireframe transparent opacity={0.1} />
                </mesh>
            </group>
        </Float>
    )
}

const AlebrijeModel = () => {
    return (
        <Float speed={4} rotationIntensity={1} floatIntensity={1}>
            <group position={[0, -0.5, 0]}>
                {/* Body */}
                <mesh position={[0, 0, 0]} scale={[1, 0.8, 1.5]}>
                    <capsuleGeometry args={[0.5, 1, 8, 16]} />
                    <meshStandardMaterial color="#00AEEF" />
                </mesh>
                
                {/* Spots (Procedural Texture via geometry for simplicity) */}
                <mesh position={[0.3, 0.2, 0.5]}>
                    <sphereGeometry args={[0.2]} />
                    <meshStandardMaterial color="#D9006C" />
                </mesh>
                <mesh position={[-0.3, 0.1, -0.2]}>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color="#FFD100" />
                </mesh>

                {/* Head */}
                <mesh position={[0, 0.5, 1]} rotation={[0.2, 0, 0]}>
                    <coneGeometry args={[0.4, 0.9, 32]} />
                    <meshStandardMaterial color="#6A0F49" />
                </mesh>
                
                {/* Ears */}
                <mesh position={[0.3, 0.8, 0.8]} rotation={[0, 0, -0.5]}>
                     <coneGeometry args={[0.1, 0.5, 16]} />
                     <meshStandardMaterial color="#FFD100" />
                </mesh>
                <mesh position={[-0.3, 0.8, 0.8]} rotation={[0, 0, 0.5]}>
                     <coneGeometry args={[0.1, 0.5, 16]} />
                     <meshStandardMaterial color="#FFD100" />
                </mesh>

                {/* Wings */}
                <group position={[0, 0.5, 0]}>
                    <mesh position={[0.8, 0, 0]} rotation={[0, 0, -0.5]}>
                        <boxGeometry args={[1.5, 0.1, 0.8]} />
                        <meshStandardMaterial color="#D9006C" />
                    </mesh>
                    <mesh position={[-0.8, 0, 0]} rotation={[0, 0, 0.5]}>
                        <boxGeometry args={[1.5, 0.1, 0.8]} />
                        <meshStandardMaterial color="#D9006C" />
                    </mesh>
                </group>

                {/* Tail */}
                <mesh position={[0, 0.2, -1.2]} rotation={[-0.5, 0, 0]}>
                     <cylinderGeometry args={[0.1, 0.02, 1.5]} />
                     <meshStandardMaterial color="#00FF00" />
                </mesh>
            </group>
        </Float>
    )
}

// --- LOADER ---

const CanvasLoader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-xl p-4 min-w-[120px]">
        <Loader2 className="w-8 h-8 text-oaxaca-yellow animate-spin mb-2" />
        <p className="text-white text-xs font-bold tracking-widest mt-1">
          CARGANDO {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
};

// --- MAIN COMPONENT ---

const ARScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  
  // State for logic
  const [detectedMarker, setDetectedMarker] = useState<MarkerData | null>(null);
  const [show3D, setShow3D] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  
  // Ref to track which marker we simulate next
  const scanIndexRef = useRef(0);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
      }
    };
    
    if (!show3D) {
       startCamera();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [show3D]);

  // Image Tracking Logic Loop
  useEffect(() => {
    if (!hasPermission || detectedMarker || show3D) {
        setIsScanning(false);
        setScanProgress(0);
        return;
    }

    setIsScanning(true);
    let animationFrameId: number;
    let confidence = 0;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });

    const scan = () => {
        if (videoRef.current && videoRef.current.readyState === 4 && ctx) {
            // Draw center crop of video to analyze
            const v = videoRef.current;
            const size = 100;
            const sx = (v.videoWidth - size) / 2;
            const sy = (v.videoHeight - size) / 2;
            
            ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);
            
            // Simple Feature Detection Simulation:
            const frame = ctx.getImageData(0, 0, size, size);
            const data = frame.data;
            let contrastSum = 0;
            
            // Sample pixels for contrast
            for(let i = 0; i < data.length; i += 16) {
                if (i + 4 < data.length) {
                    contrastSum += Math.abs(data[i] - data[i+4]);
                }
            }
            
            const avgContrast = contrastSum / (data.length / 16);

            // Heuristic: Detail > 10 implies complex object (marker)
            if (avgContrast > 12) {
                confidence += 1.0; 
            } else {
                confidence = Math.max(0, confidence - 1.5); 
            }

            setScanProgress(Math.min(100, confidence));

            if (confidence >= 100) {
                // Marker Detected!
                // Cycle through markers for demo purposes so user can see all content
                const nextMarker = MARKERS_DATA[scanIndexRef.current % MARKERS_DATA.length];
                scanIndexRef.current += 1;
                
                setDetectedMarker(nextMarker);
                setIsScanning(false);
                return; 
            }
        }
        animationFrameId = requestAnimationFrame(scan);
    };

    scan();

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasPermission, detectedMarker, show3D]);


  const handleOpen3D = () => {
      setShow3D(true);
  }

  const handleClose3D = () => {
      setShow3D(false);
  }
  
  const handleReset = () => {
      setDetectedMarker(null);
      setShow3D(false);
      setScanProgress(0);
  }

  const render3DModel = () => {
      switch(detectedMarker?.id) {
          case 'barro': return <BarroNegroModel />;
          case 'alebrije': return <AlebrijeModel />;
          default: return <DanzanteModel />;
      }
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {show3D && detectedMarker ? (
          <div className={`absolute inset-0 z-50 bg-gradient-to-br ${detectedMarker.bgColor} animate-in fade-in duration-300`}>
             {/* 3D Header Controls */}
             <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">{detectedMarker.name}</h2>
                    <p className="text-white/60 text-sm">{detectedMarker.region}</p>
                 </div>
                 <button onClick={handleClose3D} className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition">
                     <X size={24} />
                 </button>
             </div>

             <Canvas shadows dpr={[1, 2]}>
                 <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
                 <ambientLight intensity={0.6} />
                 <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                 <pointLight position={[-10, -10, -10]} intensity={0.5} color={detectedMarker.color} />
                 
                 <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                 <Sparkles count={50} scale={4} size={4} speed={0.4} opacity={0.5} color={detectedMarker.color} />
                 
                 <Suspense fallback={<CanvasLoader />}>
                     {render3DModel()}
                 </Suspense>
                 
                 <OrbitControls 
                    enablePan={false} 
                    minPolarAngle={Math.PI / 4} 
                    maxPolarAngle={Math.PI / 1.5}
                    minDistance={2}
                    maxDistance={7}
                    autoRotate
                    autoRotateSpeed={1.5}
                 />
             </Canvas>

             <div className="absolute bottom-8 w-full flex justify-center pointer-events-none">
                 <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-white/80 text-xs">
                     <RotateCcw size={14} />
                     <span>Arrastra para rotar • Pellizca para zoom</span>
                 </div>
             </div>
          </div>
      ) : (
        <>
            {/* Camera Feed Layer */}
            {hasPermission ? (
                <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6 text-center">
                <p>Se requiere acceso a la cámara para el Museo Invisible AR.</p>
                </div>
            )}

            {/* AR Overlay UI */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 flex items-center justify-center">
                    {/* Corner Markers */}
                    <div className={`absolute inset-0 border-2 rounded-xl transition-all duration-300 ${isScanning ? 'border-white/30 scale-100' : 'border-oaxaca-yellow scale-105 shadow-[0_0_20px_rgba(255,209,0,0.5)]'}`}></div>
                    
                    <div className="w-8 h-8 border-t-4 border-l-4 border-white absolute top-0 left-0"></div>
                    <div className="w-8 h-8 border-t-4 border-r-4 border-white absolute top-0 right-0"></div>
                    <div className="w-8 h-8 border-b-4 border-l-4 border-white absolute bottom-0 left-0"></div>
                    <div className="w-8 h-8 border-b-4 border-r-4 border-white absolute bottom-0 right-0"></div>
                    
                    {/* Scanning Beam Animation */}
                    {isScanning && (
                        <div className="absolute inset-0 overflow-hidden rounded-xl">
                            <div className="w-full h-1 bg-oaxaca-pink/80 shadow-[0_0_15px_rgba(217,0,108,0.8)] absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                        </div>
                    )}

                    {/* Detected Marker Pulse Visual Cue */}
                    {!isScanning && detectedMarker && !show3D && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Pulsing Outline */}
                            <div className="absolute inset-0 rounded-xl border-4 border-oaxaca-yellow animate-pulse opacity-60"></div>
                            
                            {/* Central Icon */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-oaxaca-pink rounded-full animate-ping opacity-40"></div>
                                <div className="relative bg-white/20 backdrop-blur-md p-3 rounded-full shadow-[0_0_30px_rgba(217,0,108,0.6)] border border-white/50 animate-bounce-slow">
                                    <Maximize size={32} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Text */}
                    <div className="absolute -bottom-14 left-0 right-0 text-center">
                        <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                            {isScanning ? (
                                <>
                                    <Scan size={16} className="text-white animate-pulse" />
                                    <span className="text-white text-sm font-medium">Buscando marcador... {Math.round(scanProgress)}%</span>
                                </>
                            ) : detectedMarker ? (
                                <>
                                    <Zap size={16} className="text-oaxaca-yellow" />
                                    <span className="text-oaxaca-yellow text-sm font-bold">¡{detectedMarker.name}!</span>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Modal */}
            {detectedMarker && (
                <div className="absolute bottom-24 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl z-30 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="flex justify-between items-start mb-2">
                    <div>
                    <h3 className="text-xl font-bold" style={{color: detectedMarker.color}}>{detectedMarker.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{detectedMarker.region}</p>
                    </div>
                    <button 
                    onClick={handleReset}
                    className="bg-gray-100 p-1 rounded-full hover:bg-gray-200"
                    >
                    <X size={20} className="text-gray-600" />
                    </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {detectedMarker.description}
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={handleOpen3D}
                        className="flex-1 text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                        style={{backgroundColor: detectedMarker.color}}
                    >
                    <Box size={16} /> Ver en 3D
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">
                    Escuchar Audio
                    </button>
                </div>
                </div>
            )}
        </>
      )}
      
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-bounce-slow {
            animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ARScanner;