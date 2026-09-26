import { DestroyRef, Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject, interval } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  DEFAULT_TELEMETRY_CONFIG,
  INITIAL_MACHINE_STATE,
  MachineState,
  MachineStatus,
  TelemetryAlert,
  TelemetryConfig,
  TelemetryReading,
} from '../models/machine-state';

const CONFIG_STORAGE_KEY = 'machine-dashboard.config';
const STATE_STORAGE_KEY = 'machine-dashboard.state';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly stopTelemetry$ = new Subject<void>();

  private readonly configSubject = new BehaviorSubject<TelemetryConfig>(this.restoreConfig());
  private readonly stateSubject = new BehaviorSubject<MachineState>(this.restoreState());
  private readonly historySubject = new BehaviorSubject<readonly TelemetryReading[]>([]);
  private readonly alertsSubject = new BehaviorSubject<readonly TelemetryAlert[]>([]);
  private readonly activeAlerts = new Set<string>();

  readonly config$ = this.configSubject.asObservable();
  readonly state$ = this.stateSubject.asObservable();
  readonly history$ = this.historySubject.asObservable();
  readonly alerts$ = this.alertsSubject.asObservable();

  get snapshot(): MachineState {
    return this.stateSubject.value;
  }

  get configSnapshot(): TelemetryConfig {
    return this.configSubject.value;
  }

  startMachine(): void {
    if (this.snapshot.status === MachineStatus.Running) {
      return;
    }

    this.stopTelemetry$.next();
    const startedState: MachineState = {
      ...this.snapshot,
      timestamp: Date.now(),
      rpm: 1_420,
      status: MachineStatus.Running,
      health: 'normal',
      lastMessage: 'Secuencia de arranque completada',
    };

    this.publishState(startedState, true);
    this.startTelemetryStream();
  }

  stopMachine(): void {
    this.stopTelemetry$.next();
    this.activeAlerts.clear();
    this.alertsSubject.next([]);
    this.publishState({
      ...this.snapshot,
      timestamp: Date.now(),
      rpm: 0,
      status: MachineStatus.Stopped,
      health: 'stopped',
      lastMessage: 'Parada segura confirmada',
    });
  }

  simulateFault(): void {
    this.stopTelemetry$.next();
    const faultState: MachineState = {
      ...this.snapshot,
      timestamp: Date.now(),
      rpm: 0,
      status: MachineStatus.Error,
      health: 'critical',
      lastMessage: 'Parada de emergencia activada',
    };
    this.publishState(faultState);
    this.raiseAlert(
      'system-fault',
      'critical',
      'Fallo del sistema',
      'La máquina se ha detenido para proteger el equipo.',
    );
  }

  simulateDisconnect(): void {
    this.stopTelemetry$.next();
    this.publishState({
      ...this.snapshot,
      timestamp: Date.now(),
      rpm: 0,
      status: MachineStatus.Disconnected,
      health: 'critical',
      lastMessage: 'Sin respuesta del gateway de telemetría',
    });
    this.raiseAlert(
      'connection-lost',
      'critical',
      'Telemetría desconectada',
      'No se reciben datos del gateway. Revisa la conexión.',
    );
  }

  resetSystem(): void {
    this.stopTelemetry$.next();
    this.activeAlerts.clear();
    this.alertsSubject.next([]);
    this.publishState({
      ...INITIAL_MACHINE_STATE,
      timestamp: Date.now(),
      lastMessage: 'Sistema restablecido y listo',
    });
  }

  clearHistory(): void {
    this.historySubject.next([]);
  }

  updateConfig(update: Partial<TelemetryConfig>): void {
    const config = { ...this.configSnapshot, ...update };
    this.configSubject.next(config);
    this.persist(CONFIG_STORAGE_KEY, config);

    if (this.snapshot.status === MachineStatus.Running) {
      this.stopTelemetry$.next();
      this.startTelemetryStream();
    }
  }

  private startTelemetryStream(): void {
    interval(this.configSnapshot.intervalMs)
      .pipe(
        startWith(0),
        map(() => this.createReading(this.snapshot)),
        takeUntil(this.stopTelemetry$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.publishState(state, true));
  }

  private createReading(current: MachineState): MachineState {
    const config = this.configSnapshot;
    const targetRpm = 1_560;
    const rpm = this.clamp(
      Math.round(current.rpm + (targetRpm - current.rpm) * 0.3 + this.randomBetween(-72, 72)),
      0,
      config.maximumRpm + 240,
    );
    const targetTemperature = 48 + (rpm / config.maximumRpm) * 38;
    const temperature = this.clamp(
      current.temperature +
        (targetTemperature - current.temperature) * 0.14 +
        this.randomBetween(-0.8, 0.8),
      18,
      110,
    );
    const health = this.calculateHealth(temperature, rpm);

    const state: MachineState = {
      ...current,
      timestamp: Date.now(),
      temperature: Number(temperature.toFixed(1)),
      rpm,
      status: MachineStatus.Running,
      health,
      uptimeSeconds: current.uptimeSeconds + config.intervalMs / 1_000,
      lastMessage:
        health === 'normal'
          ? 'Operación estable dentro de parámetros'
          : health === 'warning'
            ? 'Parámetro fuera del rango recomendado'
            : 'Umbral crítico alcanzado',
    };

    this.evaluateAlerts(state);
    return state;
  }

  private calculateHealth(temperature: number, rpm: number): MachineState['health'] {
    const config = this.configSnapshot;
    if (temperature >= config.criticalTemperature || rpm > config.maximumRpm) {
      return 'critical';
    }
    if (temperature >= config.warningTemperature || rpm < config.minimumRpm) {
      return 'warning';
    }
    return 'normal';
  }

  private evaluateAlerts(state: MachineState): void {
    const config = this.configSnapshot;
    this.syncAlert(
      'temperature-critical',
      state.temperature >= config.criticalTemperature,
      'critical',
      'Temperatura crítica',
      `${state.temperature.toFixed(1)} °C supera el límite de ${config.criticalTemperature} °C.`,
    );
    this.syncAlert(
      'temperature-warning',
      state.temperature >= config.warningTemperature &&
        state.temperature < config.criticalTemperature,
      'warning',
      'Temperatura elevada',
      `${state.temperature.toFixed(1)} °C se acerca al umbral crítico.`,
    );
    this.syncAlert(
      'rpm-range',
      state.rpm < config.minimumRpm || state.rpm > config.maximumRpm,
      state.rpm > config.maximumRpm ? 'critical' : 'warning',
      'RPM fuera de rango',
      `${state.rpm.toLocaleString('es-ES')} RPM está fuera del rango operativo configurado.`,
    );
  }

  private syncAlert(
    id: string,
    isActive: boolean,
    severity: TelemetryAlert['severity'],
    title: string,
    message: string,
  ): void {
    if (isActive && !this.activeAlerts.has(id)) {
      this.raiseAlert(id, severity, title, message);
      return;
    }
    if (!isActive && this.activeAlerts.delete(id)) {
      this.alertsSubject.next(this.alertsSubject.value.filter((alert) => alert.id !== id));
    }
  }

  private raiseAlert(
    id: string,
    severity: TelemetryAlert['severity'],
    title: string,
    message: string,
  ): void {
    if (this.activeAlerts.has(id)) {
      return;
    }
    this.activeAlerts.add(id);
    const alert: TelemetryAlert = { id, severity, title, message, timestamp: Date.now() };
    this.alertsSubject.next([alert, ...this.alertsSubject.value].slice(0, 4));
  }

  private publishState(state: MachineState, addToHistory = false): void {
    this.stateSubject.next(state);
    this.persist(STATE_STORAGE_KEY, state);
    if (addToHistory) {
      const reading: TelemetryReading = {
        timestamp: state.timestamp,
        temperature: state.temperature,
        rpm: state.rpm,
      };
      this.historySubject.next(
        [...this.historySubject.value, reading].slice(-this.configSnapshot.historyLimit),
      );
    }
  }

  private restoreConfig(): TelemetryConfig {
    const stored = this.readStorage<Partial<TelemetryConfig>>(CONFIG_STORAGE_KEY);
    return { ...DEFAULT_TELEMETRY_CONFIG, ...stored };
  }

  private restoreState(): MachineState {
    const stored = this.readStorage<Partial<MachineState>>(STATE_STORAGE_KEY);
    return {
      ...INITIAL_MACHINE_STATE,
      ...stored,
      timestamp: Date.now(),
      rpm: 0,
      status: MachineStatus.Stopped,
      health: 'stopped',
      lastMessage: stored
        ? 'Estado de la última sesión recuperado'
        : INITIAL_MACHINE_STATE.lastMessage,
    };
  }

  private readStorage<T>(key: string): T | null {
    try {
      const value = globalThis.localStorage?.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  private persist(key: string, value: unknown): void {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable in private browsing or server-side rendering.
    }
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
