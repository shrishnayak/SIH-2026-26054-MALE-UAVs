import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const TelemetryContext = createContext(null);

const fleetTelemetryProfiles = {
  'UAV-01': {
    mission: { altitudeFt: 14500, airspeedKts: 110, ambientTempC: -12.5, baroPressureBar: 0.58, missionPhase: 'LOITER' },
    engine: { rpm: 4800, throttlePct: 78.5, egt: [842.0, 839.5, 844.0, 841.2], cht: [106.2, 107.5, 105.8, 108.1], mapBar: 1.42, oilPressBar: 3.85, oilTempC: 98.4, vibrationGrms: 0.28, fuelFlowLph: 26.4, fuelPressureBar: 3.12, lambda: 0.94, wastegateDutyPct: 62.0 },
    residuals: { egtResiduals: [2.0, -0.5, 4.0, 1.2], chtResiduals: [0.2, 1.5, -0.2, 2.1], mapResidual: 0.0, oilPressResidual: -0.05, oilTempResidual: 0.4, vibrationResidual: 0.0, maxResidualAbs: 4.0 },
    health: { index: 98.5, status: 'NOMINAL', alertMessage: 'All Rotax 915 iS engine subsystems operating within flight envelope.', activeFault: 'NONE', severity: 0.0 }
  },
  'UAV-02': {
    mission: { altitudeFt: 18200, airspeedKts: 124, ambientTempC: -18.2, baroPressureBar: 0.51, missionPhase: 'ESCORT' },
    engine: { rpm: 4920, throttlePct: 82.0, egt: [856.4, 853.8, 858.1, 855.2], cht: [109.8, 110.4, 109.1, 111.0], mapBar: 1.51, oilPressBar: 3.72, oilTempC: 101.6, vibrationGrms: 0.31, fuelFlowLph: 28.1, fuelPressureBar: 3.15, lambda: 0.95, wastegateDutyPct: 65.0 },
    residuals: { egtResiduals: [4.4, 3.8, 6.1, 4.2], chtResiduals: [3.8, 4.4, 3.1, 5.0], mapResidual: 0.09, oilPressResidual: -0.18, oilTempResidual: 3.6, vibrationResidual: 0.03, maxResidualAbs: 6.1 },
    health: { index: 96.2, status: 'NOMINAL', alertMessage: 'Escort lead propulsion system operating within flight envelope.', activeFault: 'NONE', severity: 0.0 }
  },
  'UAV-03': {
    mission: { altitudeFt: 22100, airspeedKts: 132, ambientTempC: -24.6, baroPressureBar: 0.42, missionPhase: 'CLIMB TO CRUISE' },
    engine: { rpm: 5050, throttlePct: 86.5, egt: [868.2, 865.7, 870.4, 867.1], cht: [112.2, 111.8, 112.9, 113.1], mapBar: 1.58, oilPressBar: 3.94, oilTempC: 104.2, vibrationGrms: 0.24, fuelFlowLph: 30.5, fuelPressureBar: 3.22, lambda: 0.93, wastegateDutyPct: 69.0 },
    residuals: { egtResiduals: [8.2, 7.7, 10.4, 7.1], chtResiduals: [6.2, 5.8, 6.9, 7.1], mapResidual: 0.16, oilPressResidual: 0.04, oilTempResidual: 6.2, vibrationResidual: -0.04, maxResidualAbs: 10.4 },
    health: { index: 99.1, status: 'NOMINAL', alertMessage: 'Relay orbit propulsion system operating within flight envelope.', activeFault: 'NONE', severity: 0.0 }
  },
  'UAV-04': {
    mission: { altitudeFt: 12800, airspeedKts: 98, ambientTempC: -8.4, baroPressureBar: 0.64, missionPhase: 'DERATED CRUISE' },
    engine: { rpm: 4380, throttlePct: 65.0, egt: [884.5, 891.2, 899.8, 887.6], cht: [118.4, 120.1, 122.8, 119.7], mapBar: 1.28, oilPressBar: 3.18, oilTempC: 113.6, vibrationGrms: 0.52, fuelFlowLph: 22.0, fuelPressureBar: 2.94, lambda: 0.97, wastegateDutyPct: 54.0 },
    residuals: { egtResiduals: [24.5, 31.2, 39.8, 27.6], chtResiduals: [12.4, 14.1, 16.8, 13.7], mapResidual: -0.14, oilPressResidual: -0.72, oilTempResidual: 15.6, vibrationResidual: 0.24, maxResidualAbs: 39.8 },
    health: { index: 84.5, status: 'DEGRADED', alertMessage: 'Perimeter patrol propulsion system operating under derated cruise limits.', activeFault: 'NONE', severity: 0.25 }
  },
  'UAV-05': {
    mission: { altitudeFt: 0, airspeedKts: 0, ambientTempC: 22.0, baroPressureBar: 1.01, missionPhase: 'GROUND MAINTENANCE' },
    engine: { rpm: 1200, throttlePct: 8.0, egt: [712.5, 718.2, 725.4, 716.8], cht: [92.4, 94.1, 96.8, 93.7], mapBar: 0.72, oilPressBar: 2.18, oilTempC: 68.5, vibrationGrms: 0.76, fuelFlowLph: 4.2, fuelPressureBar: 2.42, lambda: 1.02, wastegateDutyPct: 12.0 },
    residuals: { egtResiduals: [-147.5, -141.8, -134.6, -143.2], chtResiduals: [-13.6, -12.9, -9.2, -14.3], mapResidual: -0.70, oilPressResidual: -1.72, oilTempResidual: -29.9, vibrationResidual: 0.48, maxResidualAbs: 147.5 },
    health: { index: 72.0, status: 'DEGRADED', alertMessage: 'Hangar reserve aircraft is restricted to ground maintenance operations.', activeFault: 'NONE', severity: 0.45 }
  }
};

export const TelemetryProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Global Engine Telemetry State
  const [telemetry, setTelemetry] = useState({
    timestamp: Date.now(),
    mission: {
      missionTime: 3640,
      altitudeFt: 14500,
      airspeedKts: 110,
      ambientTempC: -12.5,
      baroPressureBar: 0.58,
      uavId: 'UAV-01',
      missionPhase: 'LOITER'
    },
    engine: {
      rpm: 4800,
      throttlePct: 78.5,
      egt: [842.0, 839.5, 844.0, 841.2],
      cht: [106.2, 107.5, 105.8, 108.1],
      mapBar: 1.42,
      oilPressBar: 3.85,
      oilTempC: 98.4,
      vibrationGrms: 0.28,
      fuelFlowLph: 26.4,
      fuelPressureBar: 3.12,
      lambda: 0.94,
      wastegateDutyPct: 62.0
    },
    residuals: {
      egtResiduals: [2.0, -0.5, 4.0, 1.2],
      chtResiduals: [0.2, 1.5, -0.2, 2.1],
      mapResidual: 0.0,
      oilPressResidual: -0.05,
      oilTempResidual: 0.4,
      vibrationResidual: 0.0,
      maxResidualAbs: 4.0
    },
    health: {
      index: 98.5,
      status: 'NOMINAL',
      alertMessage: 'All Rotax 915 iS engine subsystems operating within flight envelope.',
      activeFault: 'NONE',
      severity: 0.0
    },
    canBusFrames: [
      { canId: '0x100', dlc: 8, rawHex: '12C01EA80A5003AC', timestamp: Date.now() },
      { canId: '0x200', dlc: 8, rawHex: '20E420CB20F820DC', timestamp: Date.now() },
      { canId: '0x210', dlc: 8, rawHex: '0426043304220439', timestamp: Date.now() },
      { canId: '0x300', dlc: 8, rawHex: '058C0F0A3A000118', timestamp: Date.now() }
    ]
  });

  // AI Microservice Prognostics & Anomaly Prediction State
  const [aiPrognostics, setAiPrognostics] = useState({
    rul_hours_mean: 842.0,
    rul_hours_lower_95: 818.5,
    rul_hours_upper_95: 865.5,
    engine_health_index: 98.5,
    degradation_rate_pct_per_hour: 0.12,
    remaining_mission_reachability_pct: 100.0,
    estimated_time_to_critical_minutes: 20208.0,
    reconstruction_mse: 0.0012,
    anomaly_score: 0.014,
    is_anomaly: false,
    diagnosed_fault: 'NOMINAL_OPERATION',
    severity_level: 'NOMINAL',
    dominant_root_cause_feature: 'None',
    feature_attributions: {
      EGT_Cyl1: 8.2,
      EGT_Cyl2: 7.9,
      EGT_Cyl3: 9.1,
      EGT_Cyl4: 8.5,
      CHT_Cyl1: 6.4,
      CHT_Cyl2: 6.8,
      CHT_Cyl3: 6.1,
      CHT_Cyl4: 6.9,
      MAP: 12.4,
      Oil_Pressure: 14.2,
      RPM: 11.5,
      Vibration_gRMS: 12.0
    }
  });

  // Rolling Time-Series Telemetry Buffers (Length 60 for 60-point live charts)
  const [historyBuffer, setHistoryBuffer] = useState({
    timestamps: Array.from({ length: 40 }, (_, i) => new Date(Date.now() - (40 - i) * 1000).toLocaleTimeString()),
    egt1: Array(40).fill(842),
    egt2: Array(40).fill(840),
    egt3: Array(40).fill(844),
    egt4: Array(40).fill(841),
    cht1: Array(40).fill(106),
    cht2: Array(40).fill(107),
    cht3: Array(40).fill(106),
    cht4: Array(40).fill(108),
    map: Array(40).fill(1.42),
    oilPress: Array(40).fill(3.85),
    oilTemp: Array(40).fill(98.4),
    vibration: Array(40).fill(0.28),
    healthIndex: Array(40).fill(98.5),
    anomalyScore: Array(40).fill(0.01)
  });

  const socketRef = useRef(null);
  const activeUavRef = useRef('UAV-01');
  const audioCtxRef = useRef(null);
  const lastAlertStatusRef = useRef('NOMINAL');

  // Synthesize Web Audio Tactical Alert Sound
  const playAlertTone = useCallback((status) => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (status === 'CRITICAL') {
        // High urgency alternating two-tone alarm
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(587, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (status === 'DEGRADED') {
        // Warning chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('Audio tone could not be played:', e);
    }
  }, [audioEnabled]);

  // Local analytical AI prognostics computer (runs instant zero-lag inference)
  const computeLocalAiPrognostics = useCallback((currentEng, currentRes, currentFault) => {
    const isFault = currentFault && currentFault !== 'NONE';
    const sev = currentFault === 'NONE' ? 0.0 : 0.85;

    let dominant = 'None';
    let faultName = 'NOMINAL_OPERATION';
    let baseHours = 842.0;
    let degPerHr = 0.12;
    let reconMse = 0.0012;
    let anomalyScore = 0.015;
    let attributions = {
      EGT_Cyl1: 7.5,
      EGT_Cyl2: 7.2,
      EGT_Cyl3: 8.8,
      EGT_Cyl4: 8.1,
      CHT_Cyl1: 6.0,
      CHT_Cyl2: 6.2,
      CHT_Cyl3: 5.9,
      CHT_Cyl4: 6.3,
      MAP: 11.0,
      Oil_Pressure: 14.0,
      RPM: 10.0,
      Vibration_gRMS: 13.0
    };

    if (isFault) {
      switch (currentFault) {
        case 'CYL3_INJECTOR':
          dominant = 'EGT_Cyl3';
          faultName = 'CYLINDER_3_INJECTOR_RESTRICTION';
          baseHours = 4.2;
          degPerHr = 24.5;
          reconMse = 0.215;
          anomalyScore = 0.88;
          attributions = {
            EGT_Cyl3: 48.5,
            Vibration_gRMS: 24.2,
            CHT_Cyl3: 12.3,
            Oil_Pressure: 4.1,
            EGT_Cyl1: 2.2,
            EGT_Cyl2: 2.1,
            EGT_Cyl4: 2.0,
            MAP: 1.8,
            RPM: 1.5,
            CHT_Cyl1: 0.5,
            CHT_Cyl2: 0.4,
            CHT_Cyl4: 0.4
          };
          break;

        case 'BLOW_BY':          dominant = 'Oil_Temperature';
          faultName = 'PISTON_RING_BLOW_BY_AND_CRANKCASE_PRESSURIZATION';
          baseHours = 12.4;
          degPerHr = 8.2;
          reconMse = 0.142;
          anomalyScore = 0.65;
          attributions = {
            Oil_Pressure: 38.0,
            Vibration_gRMS: 28.5,
            CHT_Cyl2: 14.2,
            EGT_Cyl2: 8.5,
            MAP: 4.2,
            RPM: 3.1,
            EGT_Cyl1: 1.1,
            EGT_Cyl3: 1.0,
            EGT_Cyl4: 0.9,
            CHT_Cyl1: 0.2,
            CHT_Cyl3: 0.2,
            CHT_Cyl4: 0.1
          };
          break;

        case 'OIL_PUMP_CAVITATION':
          dominant = 'Oil_Pressure';
          faultName = 'OIL_PUMP_CAVITATION_OR_HYDRODYNAMIC_LOSS';
          baseHours = 1.8;
          degPerHr = 45.0;
          reconMse = 0.385;
          anomalyScore = 0.96;
          attributions = {
            Oil_Pressure: 56.4,
            Vibration_gRMS: 32.1,
            RPM: 4.5,
            EGT_Cyl1: 1.5,
            EGT_Cyl2: 1.5,
            EGT_Cyl3: 1.2,
            EGT_Cyl4: 1.1,
            CHT_Cyl1: 0.5,
            CHT_Cyl2: 0.5,
            CHT_Cyl3: 0.4,
            CHT_Cyl4: 0.4,
            MAP: 0.4
          };
          break;

        case 'TURBO_WASTEGATE_STUCK':
          dominant = 'MAP';
          faultName = 'TURBOCHARGER_WASTEGATE_ACTUATOR_MALFUNCTION';
          baseHours = 18.5;
          degPerHr = 5.4;
          reconMse = 0.095;
          anomalyScore = 0.48;
          attributions = {
            MAP: 45.0,
            RPM: 22.0,
            Vibration_gRMS: 15.0,
            EGT_Cyl1: 4.5,
            EGT_Cyl2: 4.5,
            EGT_Cyl3: 4.2,
            EGT_Cyl4: 4.0,
            Oil_Pressure: 0.8
          };
          break;

        case 'COOLING_DEGRADATION':
          dominant = 'CHT_Cyl1';
          faultName = 'COOLING_SYSTEM_DEGRADATION';
          baseHours = 8.6;
          degPerHr = 11.2;
          reconMse = 0.125;
          anomalyScore = 0.58;
          attributions = {
            CHT_Cyl1: 24.0,
            CHT_Cyl2: 24.5,
            CHT_Cyl3: 24.2,
            CHT_Cyl4: 24.1,
            Oil_Pressure: 2.2,
            Vibration_gRMS: 1.0
          };
          break;
      }
    }

    const healthIndex = isFault ? Math.max(12, 98 - reconMse * 350) : 98.5;
    const isAnomaly = isFault || reconMse > 0.085;
    const severityLevel = healthIndex < 40 ? 'CRITICAL' : healthIndex < 75 ? 'ELEVATED' : 'NOMINAL';

    return {
      rul_hours_mean: parseFloat(baseHours.toFixed(1)),
      rul_hours_lower_95: parseFloat(Math.max(0.1, baseHours * 0.88).toFixed(1)),
      rul_hours_upper_95: parseFloat((baseHours * 1.12).toFixed(1)),
      engine_health_index: parseFloat(healthIndex.toFixed(1)),
      degradation_rate_pct_per_hour: parseFloat(degPerHr.toFixed(2)),
      remaining_mission_reachability_pct: parseFloat(Math.min(100, (baseHours / 8.0) * 100).toFixed(1)),
      estimated_time_to_critical_minutes: parseFloat((baseHours * 60 * 0.4).toFixed(0)),
      reconstruction_mse: parseFloat(reconMse.toFixed(5)),
      anomaly_score: parseFloat(anomalyScore.toFixed(3)),
      is_anomaly: isAnomaly,
      diagnosed_fault: faultName,
      severity_level: severityLevel,
      dominant_root_cause_feature: dominant,
      feature_attributions: attributions
    };
  }, []);

  // Connect to Node.js CAN Telemetry Server & Fallback Simulator
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 3000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(' Tactical Web Client Connected to CAN Bus Socket');
      setIsConnected(true);
      setSocketError(null);
    });

    socket.on('telemetry_frame', (data) => {
      if ((data.mission?.uavId || 'UAV-01') !== activeUavRef.current) return;
      setTelemetry(data);

      // Trigger Audio Alarm on Status Transition
      if (data.health.status !== lastAlertStatusRef.current) {
        playAlertTone(data.health.status);
        lastAlertStatusRef.current = data.health.status;
      }

      // Update AI Prognostics
      const prognostics = computeLocalAiPrognostics(data.engine, data.residuals, data.health.activeFault);
      setAiPrognostics(prognostics);

      // Append to Rolling History Buffer (downsampled to 1 Hz to preserve memory)
      setHistoryBuffer(prev => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return {
          timestamps: [...prev.timestamps.slice(1), timeStr],
          egt1: [...prev.egt1.slice(1), data.engine.egt[0]],
          egt2: [...prev.egt2.slice(1), data.engine.egt[1]],
          egt3: [...prev.egt3.slice(1), data.engine.egt[2]],
          egt4: [...prev.egt4.slice(1), data.engine.egt[3]],
          cht1: [...prev.cht1.slice(1), data.engine.cht[0]],
          cht2: [...prev.cht2.slice(1), data.engine.cht[1]],
          cht3: [...prev.cht3.slice(1), data.engine.cht[2]],
          cht4: [...prev.cht4.slice(1), data.engine.cht[3]],
          map: [...prev.map.slice(1), data.engine.mapBar],
          oilPress: [...prev.oilPress.slice(1), data.engine.oilPressBar],
          oilTemp: [...prev.oilTemp.slice(1), data.engine.oilTempC],
          vibration: [...prev.vibration.slice(1), data.engine.vibrationGrms],
          healthIndex: [...prev.healthIndex.slice(1), data.health.index],
          anomalyScore: [...prev.anomalyScore.slice(1), prognostics.anomaly_score]
        };
      });
    });

    socket.on('connect_error', (err) => {
      setSocketError('Direct CAN Socket offline. Active internal simulation bridge fallback engaged.');
      setIsConnected(false);
    });

    // Fallback Internal 20 Hz Simulation Loop if Node Server is not yet running
    const fallbackInterval = setInterval(() => {
      if (!socket.connected) {
        setTelemetry(prev => {
          const t = Date.now() / 1000;
          const currentFault = prev.health.activeFault;
          const isFault = currentFault !== 'NONE';

          let egt3 = 844 + Math.sin(t * 2) * 3;
          let cht3 = 106 + Math.sin(t) * 1.5;
          let vib = 0.28 + Math.random() * 0.03;
          let oilP = 3.85 + Math.sin(t * 0.5) * 0.05;
          let oilT = 98.4;
          let map = 1.42;

          if (currentFault === 'CYL3_INJECTOR') {
            egt3 = 968 + Math.sin(t * 5) * 12;
            cht3 = 136 + Math.sin(t * 2) * 2;
            vib = 1.28 + Math.random() * 0.15;
          } else if (currentFault === 'OIL_PUMP_CAVITATION') {
            oilP = 1.45 + Math.sin(t * 12) * 0.35;
            oilT = 126.0;
            vib = 1.85 + Math.random() * 0.25;
          } else if (currentFault === 'BLOW_BY') {
            oilT = 132.0;
            oilP = 2.15;
            vib = 0.88;
          }

          const newEng = {
            ...prev.engine,
            egt: [842 + Math.random() * 2, 840 + Math.random() * 2, parseFloat(egt3.toFixed(1)), 841 + Math.random() * 2],
            cht: [106 + Math.random() * 0.5, 107 + Math.random() * 0.5, parseFloat(cht3.toFixed(1)), 108 + Math.random() * 0.5],
            vibrationGrms: parseFloat(vib.toFixed(3)),
            oilPressBar: parseFloat(oilP.toFixed(2)),
            oilTempC: parseFloat(oilT.toFixed(1)),
            mapBar: parseFloat(map.toFixed(2))
          };

          const newRes = {
            egtResiduals: [1.2, -0.8, parseFloat((newEng.egt[2] - 840).toFixed(1)), 0.5],
            chtResiduals: [0.1, 1.0, parseFloat((newEng.cht[2] - 106).toFixed(1)), 2.0],
            mapResidual: 0.0,
            oilPressResidual: parseFloat((newEng.oilPressBar - 3.9).toFixed(2)),
            oilTempResidual: parseFloat((newEng.oilTempC - 98).toFixed(1)),
            vibrationResidual: parseFloat((newEng.vibrationGrms - 0.28).toFixed(3)),
            maxResidualAbs: Math.abs(newEng.egt[2] - 840)
          };

          const healthIdx = isFault ? (currentFault === 'CYL3_INJECTOR' || currentFault === 'OIL_PUMP_CAVITATION' ? 24.5 : 56.0) : 98.5;
          const status = healthIdx < 40 ? 'CRITICAL' : healthIdx < 75 ? 'DEGRADED' : 'NOMINAL';

          return {
            ...prev,
            timestamp: Date.now(),
            engine: newEng,
            residuals: newRes,
            health: {
              ...prev.health,
              index: healthIdx,
              status: status,
              alertMessage: isFault
                ? `CRITICAL ALERT: Fault [${currentFault}] active. Automated AI Prognostics triggered.`
                : 'All Rotax 915 iS engine subsystems operating within flight envelope.'
            }
          };
        });
      }
    }, 100);

    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };
  }, [computeLocalAiPrognostics, playAlertTone]);

  // Inject Fault helper
  const injectFault = useCallback((faultType, severity = 0.85) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('inject_fault', { faultType, severity });
    } else {
      setTelemetry(prev => ({
        ...prev,
        health: {
          ...prev.health,
          activeFault: faultType,
          severity: severity
        }
      }));
    }
  }, []);

  // Clear Fault helper
  const clearFault = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('clear_fault');
    } else {
      setTelemetry(prev => ({
        ...prev,
        health: {
          ...prev.health,
          activeFault: 'NONE',
          severity: 0.0
        }
      }));
    }
  }, []);

  // Update sandbox conditions
  const updateManualConditions = useCallback((data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('update_manual_conditions', data);
    }
  }, []);

  const selectUav = useCallback((uavId) => {
    const profile = fleetTelemetryProfiles[uavId];
    if (!profile) return;

    activeUavRef.current = uavId;
    const nextTelemetry = {
      timestamp: Date.now(),
      mission: { ...profile.mission, missionTime: 3640, uavId },
      engine: { ...profile.engine },
      residuals: { ...profile.residuals },
      health: { ...profile.health },
      canBusFrames: telemetry.canBusFrames
    };
    setTelemetry(nextTelemetry);
    setAiPrognostics(computeLocalAiPrognostics(nextTelemetry.engine, nextTelemetry.residuals, nextTelemetry.health.activeFault));
    setHistoryBuffer(prev => ({
      ...prev,
      egt1: Array(40).fill(profile.engine.egt[0]),
      egt2: Array(40).fill(profile.engine.egt[1]),
      egt3: Array(40).fill(profile.engine.egt[2]),
      egt4: Array(40).fill(profile.engine.egt[3]),
      cht1: Array(40).fill(profile.engine.cht[0]),
      cht2: Array(40).fill(profile.engine.cht[1]),
      cht3: Array(40).fill(profile.engine.cht[2]),
      cht4: Array(40).fill(profile.engine.cht[3]),
      map: Array(40).fill(profile.engine.mapBar),
      oilPress: Array(40).fill(profile.engine.oilPressBar),
      oilTemp: Array(40).fill(profile.engine.oilTempC),
      vibration: Array(40).fill(profile.engine.vibrationGrms),
      healthIndex: Array(40).fill(profile.health.index),
      anomalyScore: Array(40).fill(0.01)
    }));
  }, [computeLocalAiPrognostics, telemetry.canBusFrames]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        aiPrognostics,
        historyBuffer,
        isConnected,
        socketError,
        audioEnabled,
        setAudioEnabled,
        injectFault,
        clearFault,
        updateManualConditions
        ,selectUav
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
