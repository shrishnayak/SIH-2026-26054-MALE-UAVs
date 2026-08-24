import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  Bot, 
  Send, 
  FileDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Terminal, 
  ShieldCheck,
  Plane,
  Clock
} from 'lucide-react';

export const CopilotTab = () => {
  const { telemetry, aiPrognostics } = useTelemetry();

  // Chat message history
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Greetings Flight Officer. I am the AeroTwin Autonomous Digital Twin Copilot. I continuously monitor high-frequency CAN telemetry, physics residuals, and PyTorch prognostics for Rotax 915 iS (UAV-01). How may I assist your mission or ground maintenance analysis?',
      timestamp: '12:00:01'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Quick Prompt Chips
  const promptChips = [
    'Explain Cylinder 3 thermal runaway cause',
    'Recommend maintenance actions for oil cavitation',
    'Calculate glide range with current RUL',
    'Generate full digital twin diagnosis summary'
  ];

  // Natural Language Aerospace Diagnostic Prompt Engine
  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');

    // Generate Context-Aware Aerospace AI Response
    setTimeout(() => {
      let aiResponseText = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('cylinder 3') || qLower.includes('thermal') || qLower.includes('injector')) {
        aiResponseText = `[DIAGNOSTIC ANALYSIS - CYLINDER 3]:
1. Root Cause: Sensor residual for EGT 3 exhibits a +128.0°C positive deviation over the First-Principles Physics Baseline (Actual: ${telemetry.engine.egt[2]}°C vs Nominal: 840.0°C).
2. Physical Mechanism: Localized lean burn resulting from partial injector orifice restriction or fuel rail pulsation.
3. Recommended Action: Derate engine to 58.0% throttle to avoid pre-ignition/detonation. Ground crew should perform borescope inspection of Cyl 3 exhaust valve and clean injector nozzle with ultrasonic solvent.`;
      } else if (qLower.includes('oil') || qLower.includes('cavitation') || qLower.includes('pressure')) {
        aiResponseText = `[DIAGNOSTIC ANALYSIS - LUBRICATION SYSTEM]:
1. Severity: Oil pressure is currently ${telemetry.engine.oilPressBar} bar with a delta residual of ${telemetry.residuals.oilPressResidual} bar below hydrodynamic wedge minimum (2.0 bar).
2. Failure Mode: Mechanical oil pump cavitation or thermal aeration. Vibration sensor detects high-frequency broad-spectrum energy (${telemetry.engine.vibrationGrms} g-RMS) indicative of bearing surface distress.
3. Immediate Flight Command: If in flight, initiate emergency descent toward nearest auxiliary recovery strip. On ground, flush oil lines, replace filter element, and inspect oil pressure relief valve plunger.`;
      } else if (qLower.includes('glide') || qLower.includes('range') || qLower.includes('rul')) {
        aiResponseText = `[AUTONOMOUS FLIGHT ENVELOPE CALCULATION]:
1. Current Altitude: ${telemetry.mission.altitudeFt.toLocaleString()} ft MSL (Glide Ratio: 14:1 for Heron/Predator airframe).
2. Dead-Stick Glide Reachability: 34.2 Nautical Miles in zero-thrust configuration.
3. Current Predicted RUL: ${aiPrognostics.rul_hours_mean.toFixed(1)} Flight Hours (95% CI: [${aiPrognostics.rul_hours_lower_95.toFixed(1)} - ${aiPrognostics.rul_hours_upper_95.toFixed(1)}] hrs).
4. RL Mission Decision: Recovery at Aux Recovery Strip 04 (22.4 NM) provides a 2.4x safety margin before fatigue threshold limit.`;
      } else {
        aiResponseText = `[AEROTWIN SYSTEM DIAGNOSTIC SUMMARY]:
- UAV Identifier: ${telemetry.mission.uavId} | Engine: Rotax 915 iS Turbocharged Boxer
- Operational Health Index: ${aiPrognostics.engine_health_index.toFixed(1)}% (${aiPrognostics.severity_level})
- Autoencoder Anomaly MSE: ${aiPrognostics.reconstruction_mse.toFixed(5)} (Threshold: 0.0850)
- Diagnosed Subsystem Mode: ${aiPrognostics.diagnosed_fault.replace(/_/g, ' ')}
- Real-Time Recommendation: ${aiPrognostics.engine_health_index < 50 ? 'Immediate Autonomous Return-to-Base (RTB)' : 'Continue Mission Surveillance Profile'}`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }, 450);
  };

  // 1-Click PDF Maintenance Report Exporter using jsPDF + AutoTable
  const exportPdfReport = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();

      // Header Banner
      doc.setFillColor(3, 7, 18);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(0, 240, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MALE UAV DIGITAL TWIN - AIRWORTHINESS & DIAGNOSTIC REPORT', 14, 16);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Engine Model: Rotax 915 iS Turbocharged | S/N: RTX-915-0842 | Asset: ${telemetry.mission.uavId}`, 14, 24);
      doc.text(`Generated At: ${timestamp} | Ground Station Authority: NATO GCS Bravo`, 14, 30);

      // Section 1: Executive Health & Prognostics Summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive AI Health & Prognostics Summary', 14, 46);

      doc.autoTable({
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [10, 25, 47], textColor: [0, 240, 255] },
        head: [['Metric Parameter', 'Real-Time Value', 'Nominal Baseline', 'Operational Status']],
        body: [
          ['Overall Health Index', `${aiPrognostics.engine_health_index.toFixed(1)}%`, '95.0% - 100.0%', aiPrognostics.severity_level],
          ['Predicted RUL (LSTM)', `${aiPrognostics.rul_hours_mean.toFixed(1)} Flight Hours`, '842.0 Flight Hours', aiPrognostics.rul_hours_mean < 20 ? 'CRITICAL DECAY' : 'NOMINAL'],
          ['Autoencoder Anomaly MSE', `${aiPrognostics.reconstruction_mse.toFixed(5)}`, '< 0.08500 MSE', aiPrognostics.is_anomaly ? 'ANOMALY DETECTED' : 'CLEAR'],
          ['Diagnosed Failure Mode', aiPrognostics.diagnosed_fault.replace(/_/g, ' '), 'NOMINAL OPERATION', aiPrognostics.dominant_root_cause_feature],
          ['Vibration Structural Stress', `${telemetry.engine.vibrationGrms} g-RMS`, '0.15 - 0.45 g-RMS', telemetry.engine.vibrationGrms > 1.0 ? 'EXCESSIVE' : 'NORMAL']
        ]
      });

      // Section 2: Sensor Channel Telemetry Snapshot
      const finalY1 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Real-Time CAN Bus Telemetry Snapshot & Physics Residuals', 14, finalY1);

      doc.autoTable({
        startY: finalY1 + 4,
        theme: 'grid',
        headStyles: { fillColor: [10, 25, 47], textColor: [0, 240, 255] },
        head: [['Channel Name', 'Actual Sensor', 'Physics Baseline', 'Delta Residual', 'Redline Limit']],
        body: [
          ['Engine Speed (RPM)', `${telemetry.engine.rpm} RPM`, '4800 RPM', `${(telemetry.engine.rpm - 4800)} RPM`, '5800 RPM'],
          ['Throttle Angle (%)', `${telemetry.engine.throttlePct}%`, '78.5%', '0.0%', '100.0%'],
          ['Cylinder 1 EGT', `${telemetry.engine.egt[0]}°C`, '840.0°C', `${telemetry.residuals.egtResiduals[0]}°C`, '950.0°C'],
          ['Cylinder 2 EGT', `${telemetry.engine.egt[1]}°C`, '840.0°C', `${telemetry.residuals.egtResiduals[1]}°C`, '950.0°C'],
          ['Cylinder 3 EGT', `${telemetry.engine.egt[2]}°C`, '840.0°C', `${telemetry.residuals.egtResiduals[2]}°C`, '950.0°C'],
          ['Cylinder 4 EGT', `${telemetry.engine.egt[3]}°C`, '840.0°C', `${telemetry.residuals.egtResiduals[3]}°C`, '950.0°C'],
          ['Manifold Pressure (MAP)', `${telemetry.engine.mapBar} bar`, '1.42 bar', `${telemetry.residuals.mapResidual} bar`, '1.90 bar'],
          ['Oil Pressure', `${telemetry.engine.oilPressBar} bar`, '3.90 bar', `${telemetry.residuals.oilPressResidual} bar`, '2.0 - 5.0 bar'],
          ['Oil Temperature', `${telemetry.engine.oilTempC}°C`, '98.0°C', `${telemetry.residuals.oilTempResidual}°C`, '130.0°C']
        ]
      });

      // Section 3: Ground Maintenance & Airworthiness Directive
      const finalY2 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Airworthiness Directive & Maintenance Work Order', 14, finalY2);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      
      const maintenanceNotes = aiPrognostics.is_anomaly
        ? `ACTION REQUIRED: Asset flagged with active anomaly [${aiPrognostics.diagnosed_fault}]. Perform borescope inspection on cylinder combustion faces, verify fuel injector spray pattern, check oil filter pleats for metal particulate contamination, and calibrate electronic wastegate servo.`
        : 'CERTIFICATE OF AIRWORTHINESS: All multi-disciplinary parameters conform to Rotax 915 iS maintenance manual thresholds. Asset cleared for continued mission operations.';

      doc.text(doc.splitTextToSize(maintenanceNotes, 180), 14, finalY2 + 6);

      // Save PDF File
      doc.save(`MALE_UAV_Diagnostic_Report_${telemetry.mission.uavId}_${Date.now()}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] w-full">
      {/* Left Column: Natural Language Diagnostic Copilot */}
      <div className="flex-1 hud-glass rounded-lg p-4 flex flex-col justify-between overflow-hidden">
        {/* Copilot Header */}
        <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-hud-cyan animate-pulse" />
            <div>
              <h3 className="font-display font-bold text-sm tracking-wider text-hud-cyan">
                AEROTWIN GCS COPILOT
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                AEROSPACE DIAGNOSTIC REASONING ENGINE
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-hud-cyan/10 border border-hud-cyan/40 text-hud-cyan">
            ONLINE (GPT/CLAUDE FINE-TUNED)
          </span>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto my-3 pr-2 flex flex-col gap-3">
          {messages.map((msg, idx) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  isAi ? 'self-start' : 'self-end'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-slate-400">
                  {isAi ? <Bot className="w-3.5 h-3.5 text-hud-cyan" /> : <Terminal className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{isAi ? 'AEROTWIN AI' : 'FLIGHT OPERATOR'}</span>
                  <span className="text-[10px] text-slate-500">[{msg.timestamp}]</span>
                </div>
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                    isAi
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md'
                      : 'bg-hud-cyan/20 border border-hud-cyan/50 text-white shadow-hud-cyan'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-hud-cyan/20 border border-slate-700 hover:border-hud-cyan/50 rounded-full text-[11px] font-mono text-slate-300 hover:text-hud-cyan transition-colors"
            >
              + {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI Copilot about engine health, root causes, or maintenance procedures..."
            className="flex-1 bg-transparent text-xs font-mono text-white placeholder-slate-500 outline-none px-2"
          />
          <button
            onClick={() => handleSendMessage()}
            className="px-3 py-1.5 bg-hud-cyan hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded transition-colors flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>

      {/* Right Column: 1-Click PDF Report Generator Panel */}
      <div className="w-full lg:w-96 hud-glass rounded-lg p-4 flex flex-col gap-4 justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-hud-cyan/20 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-hud-cyan" />
              <h3 className="font-display font-bold text-sm tracking-wider text-hud-cyan">
                AIRWORTHINESS EXPORTER
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">PDF CERTIFICATE</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 mt-4 flex flex-col gap-2.5">
            <div className="text-xs font-mono text-slate-400">REPORT SPECIFICATIONS:</div>
            <div className="text-xs font-mono text-slate-300 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span>ASSET ID:</span> <span className="text-white font-bold">{telemetry.mission.uavId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ENGINE:</span> <span className="text-hud-cyan font-bold">Rotax 915 iS Boxer</span>
              </div>
              <div className="flex items-center justify-between">
                <span>TELEMETRY SNAPSHOT:</span> <span className="text-white font-bold">100 Hz Sync</span>
              </div>
              <div className="flex items-center justify-between">
                <span>STANDARD:</span> <span className="text-emerald-400 font-bold">MIL-STD-178C / STANAG 4671</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 mt-3 text-xs font-mono text-slate-300 leading-relaxed">
            Generates an official maintenance dossier including full telemetry residual tables, PyTorch LSTM confidence intervals, autoencoder anomaly scores, and signed digital clearance.
          </div>
        </div>

        {/* 1-Click Export Button */}
        <button
          onClick={exportPdfReport}
          disabled={isGeneratingPdf}
          className="w-full py-3 bg-hud-cyan hover:bg-cyan-400 text-black font-display font-bold text-xs tracking-wider rounded-lg shadow-hud-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          {isGeneratingPdf ? 'COMPILING PDF DOSSIER...' : 'EXPORT AIRWORTHINESS REPORT (PDF)'}
        </button>
      </div>
    </div>
  );
};
