import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Wind, Activity, Navigation as NavigationIcon, AlertTriangle, ShieldCheck, Anchor, MapPin, Route } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const debrisIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });
const endIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });
const groundedIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });

function MapBoundsUpdater({ coordinates }) {
  const map = useMap();
  useEffect(() => { if (coordinates?.length > 0) map.fitBounds(L.latLngBounds(coordinates), { padding: [50,50] }); }, [coordinates, map]);
  return null;
}

export default function DriftPrediction() {
  const [loading, setLoading] = useState(false);
  const [startLat, setStartLat] = useState(18.9220);
  const [startLon, setStartLon] = useState(72.8347);
  const [days, setDays] = useState(7);
  const [predictionData, setPredictionData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const API_BASE = 'http://127.0.0.1:5000';

  const handlePredict = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const res = await axios.post(`${API_BASE}/api/predict-drift`, { lat: parseFloat(startLat), lon: parseFloat(startLon), days: parseInt(days, 10) });
      if (res.data.status === 'success') setPredictionData(res.data.data);
      else setErrorMsg('Error: ' + res.data.message);
    } catch { setErrorMsg('Failed to fetch prediction. Backend might be down.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { handlePredict(); }, []);

  const trajectory = predictionData?.trajectory || [];
  const landingInfo = predictionData?.landing_info || null;
  const coords = [];
  trajectory.forEach(p => { const pt = [p.lat, p.lon]; if (!coords.length || coords[coords.length-1][0]!==pt[0] || coords[coords.length-1][1]!==pt[1]) coords.push(pt); });
  const endPoint = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;
  const isGrounded = landingInfo?.status?.includes('Grounded');

  return (
    <div className="flex flex-col gap-6 w-full font-sans pb-10 max-w-7xl mx-auto">
      <header className="flex flex-wrap justify-between items-center bg-white border border-slate-200 p-5 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2"><Wind className="w-5 h-5 text-blue-600" /> Drift & Hotspot Prediction</h1>
          <p className="text-sm text-slate-500 font-medium">INCOIS-Integrated Lagrangian Particle Tracking</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700"><ShieldCheck className="w-4 h-4" /> Government Synergy Mode</div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600"><Activity className="w-4 h-4 text-emerald-500" /> INCOIS Data: Synced</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map + Landing Analysis below */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative h-[600px] z-0">
            <MapContainer center={[startLat, startLon]} zoom={10} style={{ height:'100%', width:'100%' }} className="z-0">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' />
              {coords.length > 0 && (<>
                <MapBoundsUpdater coordinates={coords} />
                <Polyline positions={coords} color="#ef4444" weight={3} dashArray="5, 10" />
                <Marker position={coords[0]} icon={debrisIcon}><Popup><strong>Initial Debris Location</strong><br/>Lat: {coords[0][0].toFixed(4)}, Lon: {coords[0][1].toFixed(4)}</Popup></Marker>
                <Marker position={coords[coords.length-1]} icon={isGrounded ? groundedIcon : endIcon}>
                  <Popup>{isGrounded ? (<div style={{minWidth:'180px'}}><strong style={{color:'#059669'}}>⚓ {landingInfo.status}</strong><br/><strong>{landingInfo.location_name}</strong><br/><span style={{fontSize:'11px'}}>Lat: {landingInfo.grounded_lat?.toFixed(4)}, Lon: {landingInfo.grounded_lon?.toFixed(4)}</span><br/><span style={{fontSize:'11px'}}>Day {landingInfo.grounding_day} · {landingInfo.drift_distance_km} km</span></div>) : (<div><strong>Projected (Day {endPoint?.day})</strong><br/>Lat: {endPoint?.lat?.toFixed(4)}, Lon: {endPoint?.lon?.toFixed(4)}<br/>Wind: {endPoint?.wind_speed_knots} kts</div>)}</Popup>
                </Marker>
              </>)}
            </MapContainer>
            {loading && (<div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[1000]"><div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3 font-semibold text-slate-700"><svg className="animate-spin w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Simulating Trajectory...</div></div>)}
          </div>

          {/* Landing Analysis - BELOW the map */}
          {landingInfo && (
            <div className={`rounded-xl border shadow-sm overflow-hidden ${isGrounded ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 border-b flex items-center gap-2 ${isGrounded ? 'border-emerald-200 bg-emerald-100/60' : 'border-slate-200 bg-slate-50'}`}>
                <Anchor className={`w-4 h-4 ${isGrounded ? 'text-emerald-600' : 'text-slate-500'}`} />
                <h2 className={`text-sm font-bold uppercase tracking-wide ${isGrounded ? 'text-emerald-800' : 'text-slate-700'}`}>Landing Analysis</h2>
                {isGrounded && <span className="ml-auto text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">GROUNDED</span>}
                {!isGrounded && landingInfo.status === 'Still Drifting' && <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">DRIFTING</span>}
              </div>
              <div className="p-4 flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Landing Location</span>
                  <span className={`font-bold text-base ${isGrounded ? 'text-emerald-800' : 'text-slate-800'}`}>{landingInfo.location_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isGrounded ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{landingInfo.location_type}</span>
                  <span className="text-xs text-slate-500">{landingInfo.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  <div className="bg-white/80 rounded-lg border border-slate-200 p-2.5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Coordinates</span>
                    <span className="text-xs font-mono font-bold text-slate-700"><MapPin className="w-3 h-3 inline mr-0.5 text-blue-500" />{landingInfo.grounded_lat?.toFixed(4)}°N</span><br/>
                    <span className="text-xs font-mono font-bold text-slate-700 ml-4">{landingInfo.grounded_lon?.toFixed(4)}°E</span>
                  </div>
                  <div className="bg-white/80 rounded-lg border border-slate-200 p-2.5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Drift Distance</span>
                    <span className="text-lg font-black text-blue-600"><Route className="w-3.5 h-3.5 inline mr-1" />{landingInfo.drift_distance_km} km</span>
                  </div>
                  <div className="bg-white/80 rounded-lg border border-slate-200 p-2.5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Grounding Day</span>
                    <span className="text-lg font-black text-amber-600">{landingInfo.grounding_day != null ? `Day ${landingInfo.grounding_day}` : '—'}</span>
                  </div>
                </div>
                {landingInfo.grounding_day != null && (
                  <div className="flex items-center gap-2 mt-1 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-amber-700">Coastline interception on <strong>Day {landingInfo.grounding_day}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Parameters + Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><NavigationIcon className="w-4 h-4 text-blue-600" /> Simulation Parameters</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-600">Starting Latitude</label><input type="number" value={startLat} onChange={e=>setStartLat(e.target.value)} className="border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50" step="0.0001" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-600">Starting Longitude</label><input type="number" value={startLon} onChange={e=>setStartLon(e.target.value)} className="border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50" step="0.0001" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-600">Forecast Horizon (Days)</label><input type="number" value={days} onChange={e=>setDays(e.target.value)} className="border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50" min="1" max="14" /></div>
              <button onClick={handlePredict} disabled={loading} className="mt-2 w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg shadow-sm transition flex items-center justify-center gap-2">Run INCOIS Simulation</button>
            </div>
            {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">{errorMsg}</div>}
          </div>

          {predictionData && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-200"><h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Telemetry & Diagnostics</h2></div>
              <div className="p-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Engine</span><span className="font-semibold text-slate-800 text-right">{predictionData.engine}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-semibold text-slate-800 text-right">{predictionData.source}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Est. Distance</span><span className="font-semibold text-blue-600 text-right">~{landingInfo?.drift_distance_km || 0} km</span></div>
                {endPoint && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Endpoint Conditions (Day {endPoint.day})</p>
                    <div className="flex justify-between items-center mb-1"><span className="text-slate-600 text-xs">Wind Speed:</span><span className="font-bold text-slate-800 text-xs">{endPoint.wind_speed_knots} kts</span></div>
                    <div className="flex justify-between items-center mb-1"><span className="text-slate-600 text-xs">Current Velocity:</span><span className="font-bold text-slate-800 text-xs">{endPoint.current_velocity_ms} m/s</span></div>
                    {isGrounded ? (
                      <div className="flex items-center gap-2 mt-3 text-emerald-600 font-semibold text-xs"><Anchor className="w-4 h-4" /> Debris Grounded at Shore</div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3 text-amber-600 font-semibold text-xs"><AlertTriangle className="w-4 h-4" /> Coastline Interception Warning</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
