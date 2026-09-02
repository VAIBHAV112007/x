import React, { useState } from 'react';
import { Download, FileCheck, Anchor, Map as MapIcon, Activity, Calendar, Target, Navigation } from 'lucide-react';
import { generateSonarPdfReport } from '../utils/generatePdfReport';
import InteractiveGISMap from '../components/InteractiveGISMap';

export default function HazardReports() {
  
  const [selectedHazard, setSelectedHazard] = useState(null);

  const mockDetections = [
    { id: 1, classification: 'Submerged Vehicle', confidence: 98, channel: 'Port', slantRange: 42.1, gps: { lat: 18.9220, lon: 72.8347 } },
    { id: 2, classification: 'Fishing Nets', confidence: 85, channel: 'Center', slantRange: 12.0, gps: { lat: 18.9245, lon: 72.8360 } },
    { id: 3, classification: 'Metal Debris', confidence: 77, channel: 'Starboard', slantRange: 28.5, gps: { lat: 18.9210, lon: 72.8330 } },
    { id: 4, classification: 'Shipwreck Part', confidence: 92, channel: 'Port', slantRange: 55.3, gps: { lat: 18.9260, lon: 72.8315 } },
  ];

  const handleGeneratePdf = () => {
    const dataToExport = selectedHazard ? [selectedHazard] : mockDetections;
    generateSonarPdfReport({
      fileName: selectedHazard ? `Hazard_Audit_${selectedHazard.id}.pdf` : 'Historical_Environment_Audit.pdf',
      locationName: 'Archive Zone - Continental Shelf',
      coordinates: selectedHazard ? selectedHazard.gps : { lat: 18.9220, lon: 72.8347 },
      detections: dataToExport,
      telemetry: {
        frequency: '120 kHz',
        range: 'Wide Area Search',
        inferenceLatency: 'Archival Data',
        model: 'YOLO-World v2',
      },
      canvasImage: null,
      inputImage: null
    });
  };

  const handleGenerateGeoJSON = () => {
    const dataToExport = selectedHazard ? [selectedHazard] : mockDetections;
    const geojson = {
      type: 'FeatureCollection',
      features: dataToExport.map(d => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.gps.lon, d.gps.lat] },
        properties: { classification: d.classification, confidence: d.confidence },
      }))
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', selectedHazard ? `hazard_${selectedHazard.id}.geojson` : 'historic_audit.geojson');
    downloadAnchor.click();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto font-sans p-2">
      <header className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-600" /> Maritime Debris & Compliance Reporting
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Generate structured environmental remediation logs and hazard maps</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" /> Archival Audits Ready
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - GIS Map & Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Map Section */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <div className="mb-2 px-2 flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-blue-500" /> Hazard Distribution Map
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">Total Targets: {mockDetections.length}</span>
             </div>
             <div className="rounded-lg overflow-hidden border border-slate-200 shadow-inner">
               <InteractiveGISMap 
                  detections={mockDetections} 
                  selectedHazard={selectedHazard}
                  onSelectHazard={setSelectedHazard}
                  boatPos={[18.9220, 72.8347]}
               />
             </div>
          </div>

          {/* Detections Table Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[300px]">
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" /> Target Registry
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs text-slate-400 font-bold uppercase sticky top-0 bg-white">
                  <tr>
                    <th className="p-3 border-b border-slate-100">Classification</th>
                    <th className="p-3 border-b border-slate-100">Confidence</th>
                    <th className="p-3 border-b border-slate-100">Slant Range</th>
                    <th className="p-3 border-b border-slate-100">Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {mockDetections.map((d) => (
                    <tr 
                      key={d.id} 
                      onClick={() => setSelectedHazard(d)}
                      className={`cursor-pointer transition-colors border-b last:border-b-0 border-slate-50 hover:bg-blue-50 ${selectedHazard?.id === d.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                    >
                      <td className="p-3 font-bold text-slate-800">{d.classification}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${d.confidence > 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {d.confidence}%
                        </span>
                      </td>
                      <td className="p-3">{d.slantRange}m <span className="text-xs text-slate-400">({d.channel})</span></td>
                      <td className="p-3 font-mono text-xs text-slate-500 flex items-center gap-1"><Navigation className="w-3 h-3"/> {d.gps.lat.toFixed(4)}, {d.gps.lon.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Export Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 shrink-0">
                <MapIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-1">Geospatial Target Exports</h2>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">Standard geospatial layers compatible with QGIS, ArcGIS, and ECDIS marine navigation systems for plotting identified hazards.</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateGeoJSON}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 w-full py-3 rounded-lg text-sm font-bold text-white transition shadow-sm shadow-blue-600/20 mt-2"
            >
              <Download className="w-4 h-4" /> Download GIS Layer {selectedHazard ? '(Selected)' : '(All)'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-1">Environmental Hazard Audit</h2>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">Formal PDF dossier detailing debris density, slant range measurements, channel distribution, and recovery priority scoring.</p>
              </div>
            </div>
            <button 
              onClick={handleGeneratePdf}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 w-full py-3 rounded-lg text-sm font-bold text-white transition shadow-sm shadow-slate-900/10 mt-2"
            >
              <FileCheck className="w-4 h-4" /> Generate Audit Report {selectedHazard ? '(Selected)' : '(All)'}
            </button>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-md text-white flex flex-col gap-4 mt-auto">
             <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-2">Audit Summary</h2>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Critical Hazards</span>
                   <span className="text-2xl font-black text-red-400">1</span>
                </div>
                <div>
                   <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Avg Confidence</span>
                   <span className="text-2xl font-black text-cyan-400">88%</span>
                </div>
                <div className="col-span-2">
                   <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Primary Threat</span>
                   <span className="text-sm font-bold">Submerged Vehicle (Port Channel)</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}