/**
 * AeroTwin MALE UAV - CAN Bus Telemetry Engine & Socket.io Server
 * Simulates high-frequency CAN Bus frames (100 Hz binary / structured packets)
 * for Rotax 915/916 iS Turbocharged Aero Piston Engines.
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// System Global State
let faultState = {
  activeFault: 'NONE', // 'NONE' | 'CYL3_INJECTOR' | 'BLOW_BY' | 'OIL_PUMP_CAVITATION' | 'TURBO_WASTEGATE_STUCK' | 'COOLING_DEGRADATION'
  severity: 0.85,      // 0.0 to 1.0
  injectedAt: null,
  durationSeconds: 0
};

let missionState = {
  missionTime: 0,
  altitudeFt: 14500,
  airspeedKts: 110,
  ambientTempC: -12.5,
  baroPressureBar: 0.58,
  uavId: 'UAV-01',
  missionPhase: 'LOITER' // 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'LOITER' | 'RTB' | 'DESCENT'
};

// Physics Baseline & Engine State Variables
let engineState = {
  rpm: 4800,
  throttlePct: 78.5,
  egt: [842.0, 839.5, 844.0, 841.2], // Cylinders 1-4 (°C)
  cht: [106.2, 107.5, 105.8, 108.1], // Cylinders 1-4 (°C)
  mapBar: 1.42,                       // Manifold Absolute Pressure (bar)
  oilPressBar: 3.85,                  // Oil Pressure (bar)
  oilTempC: 98.4,                     // Oil Temperature (°C)
  vibrationGrms: 0.28,                // Vibration (g-RMS)
  fuelFlowLph: 26.4,                  // Fuel Flow (L/h)
  fuelPressureBar: 3.12,              // Fuel Rail Pressure (bar)
  lambda: 0.94,                       // Air-Fuel Equivalence Ratio
  wastegateDutyPct: 62.0              // Wastegate Actuator Duty (%)
};

/**
 * Packs sensor values into simulated CAN 2.0B Binary Frame Buffers
 * CAN ID 0x100 (8 bytes): RPM (uint16), Throttle (uint16 * 100), FuelFlow (uint16 * 100), Lambda (uint16 * 1000)
 * CAN ID 0x200 (8 bytes): EGT1 (uint16), EGT2 (uint16), EGT3 (uint16), EGT4 (uint16)
 * CAN ID 0x210 (8 bytes): CHT1 (uint16), CHT2 (uint16), CHT3 (uint16), CHT4 (uint16)
 * CAN ID 0x300 (8 bytes): MAP (uint16 * 1000), OilPress (uint16 * 1000), OilTemp (uint16 * 10), Vibration (uint16 * 1000)
 */
function generateBinaryCanFrames() {
  const buf0x100 = Buffer.alloc(8);
  buf0x100.writeUInt16BE(Math.round(engineState.rpm), 0);
  buf0x100.writeUInt16BE(Math.round(engineState.throttlePct * 100), 2);
  buf0x100.writeUInt16BE(Math.round(engineState.fuelFlowLph * 100), 4);
  buf0x100.writeUInt16BE(Math.round(engineState.lambda * 1000), 6);

  const buf0x200 = Buffer.alloc(8);
  buf0x200.writeUInt16BE(Math.round(engineState.egt[0] * 10), 0);
  buf0x200.writeUInt16BE(Math.round(engineState.egt[1] * 10), 2);
  buf0x200.writeUInt16BE(Math.round(engineState.egt[2] * 10), 4);
  buf0x200.writeUInt16BE(Math.round(engineState.egt[3] * 10), 6);

  const buf0x210 = Buffer.alloc(8);
  buf0x210.writeUInt16BE(Math.round(engineState.cht[0] * 10), 0);
  buf0x210.writeUInt16BE(Math.round(engineState.cht[1] * 10), 2);
  buf0x210.writeUInt16BE(Math.round(engineState.cht[2] * 10), 4);
  buf0x210.writeUInt16BE(Math.round(engineState.cht[3] * 10), 6);

  const buf0x300 = Buffer.alloc(8);
  buf0x300.writeUInt16BE(Math.round(engineState.mapBar * 1000), 0);
  buf0x300.writeUInt16BE(Math.round(engineState.oilPressBar * 1000), 2);
  buf0x300.writeUInt16BE(Math.round((engineState.oilTempC + 50) * 100), 4);
  buf0x300.writeUInt16BE(Math.round(engineState.vibrationGrms * 1000), 6);

  return [
    { canId: '0x100', dlc: 8, rawHex: buf0x100.toString('hex').toUpperCase(), timestamp: Date.now() },
    { canId: '0x200', dlc: 8, rawHex: buf0x200.toString('hex').toUpperCase(), timestamp: Date.now() },
    { canId: '0x210', dlc: 8, rawHex: buf0x210.toString('hex').toUpperCase(), timestamp: Date.now() },
    { canId: '0x300', dlc: 8, rawHex: buf0x300.toString('hex').toUpperCase(), timestamp: Date.now() }
  ];
}

/**
 * 100 Hz Physics Simulation Step
 * Incorporates dynamic physics baseline + stochastic micro-fluctuations + fault dynamics
 */
function updatePhysicsStep(dt = 0.01) {
  missionState.missionTime += dt;

  // Base flight profile micro-drift
  const time = missionState.missionTime;
  const rpmNoise = (Math.random() - 0.5) * 12;
  const mapNoise = (Math.random() - 0.5) * 0.015;
  const vibNoise = (Math.random() - 0.5) * 0.02;

  // Baseline target RPM & Throttle for LOITER profile
  let targetRpm = 4800 + Math.sin(time * 0.1) * 60;
  let targetThrottle = 78.0 + Math.sin(time * 0.1) * 1.5;
  let targetMap = 1.42 + (targetThrottle - 75) * 0.015;

  // Baseline EGT & CHT calculation based on RPM and Throttle
  let baseEgt = 840 + (targetThrottle - 75) * 1.8 + (targetRpm - 4800) * 0.03;
  let baseCht = 106 + (targetThrottle - 75) * 0.6;
  let baseOilTemp = 98.0 + (targetThrottle - 75) * 0.25;
  let baseOilPress = 3.9 - (baseOilTemp - 90) * 0.015;
  let baseVib = 0.28 + (targetRpm / 5800) * 0.12;

  // Apply Fault State Dynamics
  let egtOffsets = [0, 0, 0, 0];
  let chtOffsets = [0, 0, 0, 0];
  let mapOffset = 0;
  let oilPressOffset = 0;
  let oilTempOffset = 0;
  let vibOffset = 0;
  let fuelFlowOffset = 0;
  let lambdaOffset = 0;

  if (faultState.activeFault !== 'NONE') {
    const sev = faultState.severity;
    
    switch (faultState.activeFault) {
      case 'CYL3_INJECTOR':
        // Cylinder 3 partial clog -> severe lean burn spike in Cyl 3 EGT, moderate CHT rise, torsional vibration
        egtOffsets[2] = 135.0 * sev + Math.sin(time * 8.0) * 12 * sev; // Exceeds 970°C
        chtOffsets[2] = 28.0 * sev;                                    // Exceeds 135°C
        egtOffsets[0] = -10.0 * sev;
        egtOffsets[1] = -8.0 * sev;
        egtOffsets[3] = -9.0 * sev;
        vibOffset = 0.95 * sev + (Math.random() - 0.5) * 0.25 * sev; // Jumps to >1.2g
        lambdaOffset = 0.18 * sev; // Lean shift
        break;

      case 'BLOW_BY':
        // Piston ring blow-by -> crankcase pressurization, hot blowby gases bake oil, oil pressure decay
        oilTempOffset = 32.0 * sev + Math.sin(time * 0.5) * 4 * sev; // Exceeds 130°C
        oilPressOffset = -1.65 * sev;                                 // Drops to ~2.2 bar
        chtOffsets[1] = 18.0 * sev;
        chtOffsets[2] = 22.0 * sev;
        vibOffset = 0.65 * sev;
        break;

      case 'OIL_PUMP_CAVITATION':
        // Oil aeration / relief valve chatter -> wild pressure oscillations, sharp loss of hydrodynamic wedge
        oilPressOffset = -2.3 * sev + (Math.sin(time * 15.0) * 0.75 * sev); // Drops to <1.5 bar
        oilTempOffset = 25.0 * sev;
        vibOffset = 1.35 * sev + (Math.random() * 0.4 * sev);                // Bearing distress >1.6g
        break;

      case 'TURBO_WASTEGATE_STUCK':
        // Wastegate stuck closed -> overboost surge or stuck open -> manifold pressure drop
        mapOffset = 0.58 * sev + Math.sin(time * 3.0) * 0.08 * sev; // MAP jumps to ~2.0 bar
        egtOffsets = [45 * sev, 42 * sev, 48 * sev, 44 * sev];
        targetRpm += 350 * sev;
        vibOffset = 0.5 * sev;
        break;

      case 'COOLING_DEGRADATION':
        // Coolant radiator blockage / air pocket -> uniform CHT thermal runaway
        chtOffsets = [32 * sev, 35 * sev, 34 * sev, 36 * sev]; // CHTs climb >140°C
        oilTempOffset = 18.0 * sev;
        break;
    }
  }

  // Smooth State Transition & Integration
  engineState.rpm = Math.max(2000, Math.min(5800, targetRpm + rpmNoise));
  engineState.throttlePct = Math.max(0, Math.min(100, targetThrottle + (Math.random() - 0.5) * 0.2));
  engineState.mapBar = parseFloat(Math.max(0.6, Math.min(2.4, targetMap + mapOffset + mapNoise)).toFixed(3));
  
  engineState.egt = [
    parseFloat((baseEgt + egtOffsets[0] + (Math.random() - 0.5) * 3).toFixed(1)),
    parseFloat((baseEgt + egtOffsets[1] + (Math.random() - 0.5) * 3).toFixed(1)),
    parseFloat((baseEgt + egtOffsets[2] + (Math.random() - 0.5) * 4).toFixed(1)),
    parseFloat((baseEgt + egtOffsets[3] + (Math.random() - 0.5) * 3).toFixed(1)),
  ];

  engineState.cht = [
    parseFloat((baseCht + chtOffsets[0] + (Math.random() - 0.5) * 0.8).toFixed(1)),
    parseFloat((baseCht + chtOffsets[1] + (Math.random() - 0.5) * 0.8).toFixed(1)),
    parseFloat((baseCht + chtOffsets[2] + (Math.random() - 0.5) * 0.8).toFixed(1)),
    parseFloat((baseCht + chtOffsets[3] + (Math.random() - 0.5) * 0.8).toFixed(1)),
  ];

  engineState.oilPressBar = parseFloat(Math.max(0.5, Math.min(6.0, baseOilPress + oilPressOffset + (Math.random() - 0.5) * 0.05)).toFixed(2));
  engineState.oilTempC = parseFloat(Math.max(50, Math.min(150, baseOilTemp + oilTempOffset + (Math.random() - 0.5) * 0.3)).toFixed(1));
  engineState.vibrationGrms = parseFloat(Math.max(0.08, Math.min(3.5, baseVib + vibOffset + vibNoise)).toFixed(3));
  engineState.fuelFlowLph = parseFloat((26.0 + (engineState.throttlePct - 75) * 0.4 + fuelFlowOffset).toFixed(1));
  engineState.lambda = parseFloat((0.94 + lambdaOffset + (Math.random() - 0.5) * 0.01).toFixed(3));
}

// 100 Hz simulation loop (10ms)
setInterval(() => {
  updatePhysicsStep(0.01);
}, 10);

// Broadcast full telemetry packet to connected clients at 20 Hz (50ms) for high-framerate rendering
setInterval(() => {
  const binaryCanFrames = generateBinaryCanFrames();
  
  // Calculate First-Principles Physics Nominal Baseline for Residuals
  const nominalEgt = 840 + (engineState.throttlePct - 75) * 1.8 + (engineState.rpm - 4800) * 0.03;
  const nominalCht = 106 + (engineState.throttlePct - 75) * 0.6;
  const nominalMap = 1.42 + (engineState.throttlePct - 75) * 0.015;
  const nominalOilPress = 3.9 - (engineState.oilTempC - 90) * 0.015;
  const nominalVib = 0.28 + (engineState.rpm / 5800) * 0.12;

  const residuals = {
    egtResiduals: engineState.egt.map(v => parseFloat((v - nominalEgt).toFixed(1))),
    chtResiduals: engineState.cht.map(v => parseFloat((v - nominalCht).toFixed(1))),
    mapResidual: parseFloat((engineState.mapBar - nominalMap).toFixed(3)),
    oilPressResidual: parseFloat((engineState.oilPressBar - nominalOilPress).toFixed(2)),
    oilTempResidual: parseFloat((engineState.oilTempC - 98.0).toFixed(1)),
    vibrationResidual: parseFloat((engineState.vibrationGrms - nominalVib).toFixed(3)),
    maxResidualAbs: Math.max(
      ...engineState.egt.map(v => Math.abs(v - nominalEgt)),
      ...engineState.cht.map(v => Math.abs(v - nominalCht) * 2.5),
      Math.abs(engineState.oilPressBar - nominalOilPress) * 40,
      Math.abs(engineState.vibrationGrms - nominalVib) * 80
    )
  };

  // Determine Real-Time Health & Alert Level
  let healthIndex = 98.5;
  let status = 'NOMINAL'; // 'NOMINAL' | 'DEGRADED' | 'CRITICAL'
  let alertMessage = 'All Rotax 915 iS engine subsystems operating within flight envelope.';

  if (faultState.activeFault !== 'NONE') {
    if (residuals.maxResidualAbs > 80 || engineState.vibrationGrms > 1.2 || engineState.egt[2] > 950 || engineState.oilPressBar < 1.8) {
      status = 'CRITICAL';
      healthIndex = Math.max(15, 65 - residuals.maxResidualAbs * 0.45);
      alertMessage = `CRITICAL ALERT: Fault [${faultState.activeFault}] detected. Physical parameters exceeding redline thresholds. Autonomous RTB protocol recommended.`;
    } else {
      status = 'DEGRADED';
      healthIndex = Math.max(55, 88 - residuals.maxResidualAbs * 0.35);
      alertMessage = `CAUTION: Micro-residual anomaly detected in [${faultState.activeFault}]. Engine derating recommended.`;
    }
  }

  const payload = {
    timestamp: Date.now(),
    mission: missionState,
    engine: engineState,
    residuals: residuals,
    health: {
      index: parseFloat(healthIndex.toFixed(1)),
      status: status,
      alertMessage: alertMessage,
      activeFault: faultState.activeFault,
      severity: faultState.severity
    },
    canBusFrames: binaryCanFrames
  };

  io.emit('telemetry_frame', payload);
}, 50);

// Socket.io Event Handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Tactical Client Connected: ${socket.id}`);

  // Send initial state immediately
  socket.emit('initial_state', {
    faultState,
    missionState,
    engineState
  });

  // Inject Fault Handler from Frontend/Judge UI
  socket.on('inject_fault', (data) => {
    const { faultType, severity } = data;
    console.log(`[Fault Injection] Triggered -> Fault: ${faultType}, Severity: ${severity || 0.85}`);
    faultState.activeFault = faultType || 'NONE';
    faultState.severity = severity !== undefined ? severity : 0.85;
    faultState.injectedAt = Date.now();

    io.emit('fault_updated', faultState);
  });

  // Clear Fault Handler
  socket.on('clear_fault', () => {
    console.log('[Fault Injection] Cleared all faults -> Resumed Nominal State');
    faultState.activeFault = 'NONE';
    faultState.severity = 0.0;
    faultState.injectedAt = null;

    io.emit('fault_updated', faultState);
  });

  // Manual Throttle / Condition Control from Judge Sandbox
  socket.on('update_manual_conditions', (data) => {
    if (data.altitudeFt !== undefined) missionState.altitudeFt = data.altitudeFt;
    if (data.airspeedKts !== undefined) missionState.airspeedKts = data.airspeedKts;
    if (data.targetRpm !== undefined) engineState.rpm = data.targetRpm;
    if (data.throttlePct !== undefined) engineState.throttlePct = data.throttlePct;
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client Disconnected: ${socket.id}`);
  });
});

// REST API Endpoints for Diagnostics & Sandbox
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'MALE UAV Digital Twin CAN Bus Engine',
    uptimeSeconds: Math.round(process.uptime()),
    engineModel: 'Rotax 915 iS Turbocharged Piston',
    activeFault: faultState.activeFault
  });
});

app.post('/api/faults/inject', (req, res) => {
  const { faultType, severity } = req.body;
  faultState.activeFault = faultType || 'NONE';
  faultState.severity = severity || 0.85;
  faultState.injectedAt = Date.now();
  io.emit('fault_updated', faultState);
  res.json({ success: true, faultState });
});

app.post('/api/faults/clear', (req, res) => {
  faultState.activeFault = 'NONE';
  faultState.severity = 0.0;
  faultState.injectedAt = null;
  io.emit('fault_updated', faultState);
  res.json({ success: true, faultState });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 MALE UAV Digital Twin Telemetry Engine Running on Port ${PORT}`);
  console.log(`📡 100 Hz CAN Bus Emulator Active (IDs 0x100, 0x200, 0x210, 0x300)`);
  console.log(`=======================================================`);
});
