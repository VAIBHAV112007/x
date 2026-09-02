import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { ShieldAlert, X, Navigation, Radar, AlignCenter, Droplets, Target, Activity, Eye, Maximize } from 'lucide-react';

function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function noise2D(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = seededRandom(ix + iz * 57);
  const b = seededRandom(ix + 1 + iz * 57);
  const c = seededRandom(ix + (iz + 1) * 57);
  const d = seededRandom(ix + 1 + (iz + 1) * 57);
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbmNoise(x, z, octaves = 5) {
  let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.45;
    frequency *= 2.1;
  }
  return value / maxValue;
}

function BathymetryTerrain() {
  const meshRef = useRef();
  const segments = 96;
  const size = 50;

  const { geometry, basePositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geo.attributes.position.array;
    const colors = new Float32Array(positions.length);
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      const baseHeight = fbmNoise(x * 0.06 + 10, z * 0.06 + 10, 5) * 4.5;
      const ridges = Math.abs(fbmNoise(x * 0.12, z * 0.12, 3)) * 2.0;
      const detail = fbmNoise(x * 0.25 + 5, z * 0.25 + 5, 2) * 0.8;
      const distFromCenter = Math.abs(x) / (size / 2);
      const channelDepth = Math.exp(-distFromCenter * distFromCenter * 8) * -1.5;
      const height = baseHeight + ridges + detail + channelDepth - 3.0;
      positions[i + 2] = height;

      if (height < minY) minY = height;
      if (height > maxY) maxY = height;
    }

    const range = maxY - minY || 1;
    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 2];
      const t = (height - minY) / range;

      let r, g, b;
      if (t < 0.25) {
        const s = t / 0.25;
        r = 0.02 + s * 0.03; g = 0.04 + s * 0.08; b = 0.15 + s * 0.15;
      } else if (t < 0.5) {
        const s = (t - 0.25) / 0.25;
        r = 0.05 + s * 0.02; g = 0.12 + s * 0.18; b = 0.30 + s * 0.15;
      } else if (t < 0.75) {
        const s = (t - 0.5) / 0.25;
        r = 0.07 + s * 0.15; g = 0.30 + s * 0.25; b = 0.45 - s * 0.05;
      } else {
        const s = (t - 0.75) / 0.25;
        r = 0.22 + s * 0.25; g = 0.55 + s * 0.15; b = 0.40 - s * 0.1;
      }
      colors[i] = r; colors[i + 1] = g; colors[i + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { geometry: geo, basePositions: new Float32Array(positions) };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = basePositions[i];
      const z = basePositions[i + 1];
      // Create a very gentle, slow-moving underwater current effect
      const wave = Math.sin(t * 0.5 + x * 0.15 + z * 0.15) * 0.15 + 
                   Math.cos(t * 0.3 + x * 0.05 - z * 0.05) * 0.15;
      positions[i + 2] = basePositions[i + 2] + wave;
    }
    geometry.attributes.position.needsUpdate = true;
    // We intentionally skip recomputing normals here to keep performance extremely high (60fps). 
    // The wave is subtle enough that static lighting looks perfectly fine.
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.85} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TowfishPath() {
  const pathPoints = useMemo(() => {
    const pts = [];
    const count = 200;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * 2 - 1;
      const z = t * 24;
      const x = Math.sin(t * Math.PI * 1.5) * 1.5;
      const y = 1.5 + Math.sin(t * Math.PI * 3) * 0.3;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(pathPoints.length * 3);
    pathPoints.forEach((p, i) => {
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [pathPoints]);

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineDashedMaterial color="#ffffff" transparent opacity={0.3} dashSize={0.5} gapSize={0.3} linewidth={1} />
      </line>
    </group>
  );
}

function AnimatedTowfish() {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const progress = ((t * 0.08) % 1);
    const mapped = progress * 2 - 1;

    const z = mapped * 24;
    const x = Math.sin(mapped * Math.PI * 1.5) * 1.5;
    const y = 1.5 + Math.sin(mapped * Math.PI * 3) * 0.3;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      const nextZ = (mapped + 0.01) * 24;
      const nextX = Math.sin((mapped + 0.01) * Math.PI * 1.5) * 1.5;
      groupRef.current.lookAt(nextX, y, nextZ);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight color="#60a5fa" intensity={3} distance={6} />
    </group>
  );
}

function HazardMarker({ item, isSelected, onClickHazard }) {
  const innerRef = useRef();
  const ringRef = useRef();
  const position = item?.three_pos || [0, 0, 0];

  const highPriorityKeywords = ['debris', 'submarine', 'tyre', 'tyres', 'metal', 'metals', 'anchor', 'anchors', 'shipwreck', 'shipwrecks'];
  
  const baseColor = useMemo(() => {
    const cls = item?.classification?.toLowerCase() || '';
    if (highPriorityKeywords.some(keyword => cls.includes(keyword))) return '#ef4444'; // Light Red for Priority
    return '#38bdf8'; // Light Blue for regular objects like fish, plants
  }, [item?.classification]);

  const markerColor = isSelected ? '#ffffff' : baseColor;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (innerRef.current) {
      innerRef.current.rotation.y = t * 1.5;
      innerRef.current.rotation.x = Math.sin(t * 0.8) * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.scale.setScalar((isSelected ? 1.25 : 1) + Math.sin(t * 2) * 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.6} floatingRange={[-0.15, 0.15]}>
      <group
        position={position}
        onClick={(e) => { 
          e.stopPropagation(); 
          onClickHazard(item);
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, 0, 0, -position[1] - 1.5, 0])} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={markerColor} transparent opacity={isSelected ? 0.9 : 0.3} />
        </line>

        <mesh ref={innerRef} scale={isSelected ? [1.3, 1.3, 1.3] : [1, 1, 1]}>
          <octahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={isSelected ? 1.6 : 0.9} wireframe />
        </mesh>

        <mesh ref={ringRef} scale={isSelected ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
          <torusGeometry args={[0.7, 0.04, 8, 32]} />
          <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.8} />
        </mesh>

        <Text position={[0, 1.4, 0]} fontSize={0.35} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
          {item?.classification || 'Hazard'}
        </Text>
      </group>
    </Float>
  );
}

function UnderwaterParticles() {
  const particlesRef = useRef();
  const count = 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 50;
      pos[i + 1] = Math.random() * 10 - 2;
      pos[i + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const t = state.clock.getElapsedTime();
      particlesRef.current.rotation.y = t * 0.01;
      const posArray = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count * 3; i += 3) {
        posArray[i + 1] += Math.sin(t + i) * 0.002;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.06} transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}

function DepthScale() {
  return (
    <group position={[-20, 1.0, 0]}>
      {/* Draw a vertical depth pole */}
      <mesh position={[0, -2, 0]}>
         <cylinderGeometry args={[0.04, 0.04, 12, 8]} />
         <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} fog={false} />
      </mesh>
      
      {/* Draw depth markers */}
      {[
        {d: 15, lbl: "+15m", color: "#ffffff"}, 
        {d: 0, lbl: "0m (Surface)", color: "#7dd3fc"}, 
        {d: -15, lbl: "-15m", color: "#0ea5e9"}, 
        {d: -30, lbl: "-30m", color: "#2563eb"}, 
        {d: -45, lbl: "-45m", color: "#312e81"} 
      ].map((mark, i) => (
        <group key={i} position={[0, mark.d * 0.08, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.03, 0.03]} />
            <meshBasicMaterial color={mark.color} fog={false} />
          </mesh>
          <Billboard>
            <Text
              position={[0.6, 0, 0]}
              color={mark.color}
              fontSize={0.5}
              anchorX="left"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {mark.lbl}
              <meshBasicMaterial attach="material" fog={false} />
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
}

export default function Seabed3DView({ detections = [] }) {
  const [activeHazard, setActiveHazard] = useState(null);

  // Extract panel out of R3F Canvas bounds to prevent Crash
  return (
    <div className="w-full h-full relative" style={{ minHeight: '100%' }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [18, 16, 22], fov: 42 }}
        shadows
        onPointerMissed={() => setActiveHazard(null)} 
        // Handles clicks anywhere on empty space in canvas
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[15, 25, 20]} intensity={1.0} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[0, 8, 0]} color="#ffffff" intensity={1} distance={30} />
        <fog attach="fog" args={['#0f172a', 25, 65]} />

        <BathymetryTerrain />
        <TowfishPath />
        <AnimatedTowfish />
        <UnderwaterParticles />
        <DepthScale />

        {Array.isArray(detections) && detections.map((item, idx) => (
          <HazardMarker
            key={item?.id || idx}
            item={item}
            isSelected={Boolean(activeHazard && activeHazard.id === item.id)}
            onClickHazard={(hazard) => setActiveHazard(hazard)}
          />
        ))}

        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.05}
          minDistance={8}
          maxDistance={50}
          enableDamping
          dampingFactor={0.05}
          autoRotate={!activeHazard}
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* DETACHED DEEP INFO OVERLAY - Fully HTML/CSS based */}
      {activeHazard && (
        <div className="absolute top-4 right-4 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-slide-up">
          
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center text-white">
            <h3 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Target Profiler
            </h3>
            <button 
              onClick={() => setActiveHazard(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-5 bg-slate-50 relative">
            <div className="flex justify-between items-center bg-white border border-slate-200 shadow-sm p-3 rounded-lg">
              <span className="text-sm font-bold text-slate-800">{activeHazard.classification || 'Unknown Object'}</span>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {activeHazard.confidence || 90}% Conf
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5"><AlignCenter className="w-3.5 h-3.5 text-slate-400" /> Slant Range</span>
                <span className="text-sm font-bold text-slate-700">{activeHazard.slant_range_m || 24.5}m</span>
              </div>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-slate-400" /> Channel</span>
                <span className="text-sm font-bold text-slate-700 capitalize">{activeHazard.channel || 'Port'}</span>
              </div>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5"><Radar className="w-3.5 h-3.5 text-slate-400" /> Profiling Height</span>
                <span className="text-sm font-bold text-slate-700">{activeHazard.estimated_height_m || 1.8}m</span>
              </div>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-slate-400" /> Acoustic Shadow</span>
                <span className="text-sm font-bold text-slate-700">{activeHazard.shadow_length_m || 3.1}m</span>
              </div>
              
              {/* USP: Physical Dimensions & Visibility */}
              <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5"><Maximize className="w-3.5 h-3.5 text-slate-400" /> Dimensions (LxB)</span>
                <span className="text-sm font-bold text-slate-700">{activeHazard.estimated_length_m || 2.5}m × {activeHazard.estimated_breadth_m || 1.2}m</span>
              </div>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> Visibility</span>
                <span className="text-sm font-bold text-slate-700">{activeHazard.visibility_status || 'Clear'} ({activeHazard.visibility_score || 95}%)</span>
              </div>
              
              {/* USP: Acoustic Material Classification */}
              <div className="col-span-2 flex flex-col gap-1 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-3 shadow-md mt-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Acoustic Material Signature
                </span>
                <div className="flex justify-between items-end mt-1">
                  <span className="text-sm font-black text-white">{activeHazard.material_class || 'Unknown'}</span>
                  <span className="text-xs font-bold text-cyan-300">Ref: {activeHazard.acoustic_reflectance || '0.0'}</span>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-200 my-1"></div>

            <div className="flex justify-between items-center text-xs font-medium text-slate-500 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm">
              <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-blue-500" /> Lat / Lon</span>
              <span className="text-slate-800 font-bold">
                {activeHazard.gps?.lat ? Number(activeHazard.gps.lat).toFixed(5) : "43.13600"}, {activeHazard.gps?.lon ? Number(activeHazard.gps.lon).toFixed(5) : "-87.72800"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Default Overlay Header */}
      <div className="absolute bottom-6 left-6 z-40 bg-slate-900/90 text-white rounded-lg px-4 py-2 text-xs font-bold tracking-wide border border-slate-700 shadow-md pointer-events-none flex items-center gap-2">
        <Target className="w-4 h-4 text-cyan-400" />
        TARGET MARKERS ACTIVE: <span className="text-cyan-400">{detections?.length || 0}</span>
      </div>
    </div>
  );
}