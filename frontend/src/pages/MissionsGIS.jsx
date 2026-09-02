import React, { useState } from 'react';
import { Compass, MapPin, ChevronRight, Activity, Calendar } from 'lucide-react';
import Seabed3DView from '../components/Seabed3DView';

export default function MissionsGIS() {
  const missions = [
    { id: 'MSN-2026-08', area: 'Harbor Channel North', date: 'Aug 2026', hazards: 12, nets: 7, status: 'Completed', detections: [
      { id: 1, classification: 'Submerged Vehicle', confidence: 98, slant_range_m: 42.1, channel: 'Port', estimated_height_m: 1.8, shadow_length_m: 3.1, estimated_length_m: 2.5, estimated_breadth_m: 1.2, visibility_status: 'Clear', visibility_score: 95, material_class: 'Metal', acoustic_reflectance: '0.85', three_pos: [5, -1.8, 8], gps: { lat: 18.9221, lon: 72.8348 } },
      { id: 2, classification: 'Fishing Nets', confidence: 85, slant_range_m: 12.0, channel: 'Center', estimated_height_m: 0.5, shadow_length_m: 1.2, estimated_length_m: 8.0, estimated_breadth_m: 2.0, visibility_status: 'Obscured', visibility_score: 40, material_class: 'Synthetic', acoustic_reflectance: '0.2', three_pos: [-8, -1.5, -4], gps: { lat: 18.9225, lon: 72.8340 } }
    ]},
    { id: 'MSN-2026-07', area: 'Outer Anchorage Reef', date: 'Jul 2026', hazards: 19, nets: 14, status: 'Completed', detections: [
       { id: 3, classification: 'Metal Debris', confidence: 77, slant_range_m: 28.5, channel: 'Starboard', estimated_height_m: 1.2, shadow_length_m: 2.0, estimated_length_m: 1.5, estimated_breadth_m: 1.0, visibility_status: 'Clear', visibility_score: 88, material_class: 'Metal', acoustic_reflectance: '0.9', three_pos: [12, -2.5, -15], gps: { lat: 18.9150, lon: 72.8250 } }
    ] },
    { id: 'MSN-2026-06', area: 'Deepwater Approach', date: 'Jun 2026', hazards: 4, nets: 1, status: 'Archived', detections: [] },
  ];

  const [selectedMission, setSelectedMission] = useState(missions[0]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-[1400px] w-full mx-auto gap-4 p-2">
      <header className="flex-shrink-0 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Compass className="w-6 h-6 text-cyan-400" /> Interactive Bathymetry & 3D Profiler
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Explore historical hydroacoustic survey tracks, debris density mapping, and 3D terrain models.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center gap-2">
             <Activity className="w-4 h-4 text-emerald-400" />
             <span className="text-xs font-bold text-white uppercase tracking-wider">Engine: Render-V3</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left Sidebar - Mission Selection */}
        <div className="w-[380px] flex-shrink-0 flex flex-col gap-4 bg-slate-900/60 rounded-xl border border-slate-800 shadow-lg p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Mission Logs
            </h2>
            <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{missions.length} Total</span>
          </div>

          <div className="flex flex-col gap-3">
            {missions.map((m) => {
              const isActive = selectedMission.id === m.id;
              return (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedMission(m)}
                  className={`relative p-4 rounded-xl cursor-pointer border transition-all duration-200 group overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-900/20' 
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  {isActive && (
                     <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  )}
                  
                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div>
                      <h3 className={`text-sm font-bold ${isActive ? 'text-cyan-300' : 'text-slate-300'} flex items-center gap-1.5`}>
                        <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} /> {m.id}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{m.area}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isActive ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {m.date}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pl-2">
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                       <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Hazards</span>
                       <span className={`text-sm font-black ${m.hazards > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{m.hazards}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                       <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Ghost Nets</span>
                       <span className={`text-sm font-black ${m.nets > 5 ? 'text-red-400' : 'text-slate-300'}`}>{m.nets}</span>
                    </div>
                  </div>

                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                    <ChevronRight className="w-5 h-5 text-cyan-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Area - 3D Viewer */}
        <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative">
           
           <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
             <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-3 shadow-lg">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Active View</span>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   {selectedMission.area} ({selectedMission.id})
                </div>
             </div>
           </div>

           <div className="flex-1 w-full relative">
             <Seabed3DView detections={selectedMission.detections} />
           </div>
           
           <div className="bg-slate-950 border-t border-slate-800 p-3 flex justify-between items-center text-xs font-mono text-slate-400">
              <div className="flex gap-4">
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /> Terrain Engine Active</span>
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Sonar Sweep Synced</span>
              </div>
              <div>
                 Status: <span className={selectedMission.status === 'Completed' ? 'text-emerald-400' : 'text-slate-300'}>{selectedMission.status}</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}