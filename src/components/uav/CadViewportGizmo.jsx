import React from 'react';

// Blender-style 3D Viewport Orientation Gizmo & Axis Triad
export const CadViewportGizmo = ({ onSnapView, cameraView }) => {
  return (
    <div className="absolute top-16 right-4 z-20 flex flex-col items-center gap-1 bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto">
      {/* Gizmo Label */}
      <div className="text-[9px] font-mono text-slate-400 tracking-wider flex items-center gap-1 mb-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-tactical-amber animate-pulse"></span>
        <span>CAD AXIS</span>
      </div>

      {/* Interactive Orientation Compass Triad */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Triad Outer Dial */}
        <div className="absolute inset-0 rounded-full border border-slate-700/60 border-dashed animate-spin-slow opacity-40"></div>

        {/* Center Origin Pivot */}
        <button
          onClick={() => onSnapView('XRAY_CUTAWAY')}
          title="Isometric CAD Perspective"
          className="w-5 h-5 rounded-full bg-slate-800 border border-slate-500 hover:border-tactical-amber flex items-center justify-center text-[9px] font-mono font-bold text-tactical-amber z-10 transition-transform hover:scale-110 shadow-lg"
        >
          ISO
        </button>

        {/* +Y (Back View) */}
        <button
          onClick={() => onSnapView('BACK_VIEW')}
          title="Top / Aft (+Y)"
          className="absolute top-0 transform -translate-y-0.5 px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/70 hover:bg-emerald-500 hover:text-black text-[9px] font-mono font-bold text-emerald-400 transition-all"
        >
          +Y
        </button>

        {/* -Y (Front View / Hero) */}
        <button
          onClick={() => onSnapView('HERO_HEADON')}
          title="Front / Low Angle (-Y)"
          className="absolute bottom-0 transform translate-y-0.5 px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/70 hover:bg-emerald-500 hover:text-black text-[9px] font-mono font-bold text-emerald-400 transition-all"
        >
          -Y
        </button>

        {/* +X (Right View) */}
        <button
          onClick={() => onSnapView('SIDE_ELEV')}
          title="Right Elevation (+X)"
          className="absolute right-0 transform translate-x-0.5 px-1 py-0.5 rounded bg-red-950/80 border border-red-500/70 hover:bg-red-500 hover:text-black text-[9px] font-mono font-bold text-red-400 transition-all"
        >
          +X
        </button>

        {/* +Z (Top View CAD) */}
        <button
          onClick={() => onSnapView('TOP_CAD')}
          title="Top Planform (+Z)"
          className="absolute left-0 transform -translate-x-0.5 px-1 py-0.5 rounded bg-blue-950/80 border border-blue-500/70 hover:bg-blue-500 hover:text-black text-[9px] font-mono font-bold text-blue-400 transition-all"
        >
          +Z
        </button>
      </div>

      {/* Mode Tag */}
      <div className="text-[8px] font-mono text-slate-500 text-center uppercase mt-0.5">
        SNAP VIEWPORT
      </div>
    </div>
  );
};
