export enum MachineStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Disconnected = 'DISCONNECTED',
  Error = 'ERROR',
}

export type HealthLevel = 'normal' | 'warning' | 'critical' | 'stopped';
export type AlertSeverity = 'warning' | 'critical';

export interface TelemetryReading {
  timestamp: number;
  temperature: number;
  rpm: number;
}

export interface MachineState extends TelemetryReading {
  status: MachineStatus;
  health: HealthLevel;
  uptimeSeconds: number;
  lastMessage: string;
}

export interface TelemetryAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
}

export interface TelemetryConfig {
  intervalMs: number;
  warningTemperature: number;
  criticalTemperature: number;
  minimumRpm: number;
  maximumRpm: number;
  historyLimit: number;
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  intervalMs: 1_600,
  warningTemperature: 82,
  criticalTemperature: 92,
  minimumRpm: 1_150,
  maximumRpm: 1_900,
  historyLimit: 36,
};

export const INITIAL_MACHINE_STATE: MachineState = {
  timestamp: Date.now(),
  temperature: 27.4,
  rpm: 0,
  status: MachineStatus.Stopped,
  health: 'stopped',
  uptimeSeconds: 0,
  lastMessage: 'Sistema listo para iniciar',
};
