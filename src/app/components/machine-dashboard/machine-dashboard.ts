import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { MachineStatus, TelemetryConfig } from '../../models/machine-state';
import { MachineService } from '../../service/machine.service';
import { AlertPanel } from '../alert-panel/alert-panel';
import { ControlPanel } from '../control-panel/control-panel';
import { SettingsPanel } from '../settings-panel/settings-panel';
import { StatusCard } from '../status-card/status-card';
import { TelemetryCard } from '../telemetry-card/telemetry-card';
import { TelemetryChart } from '../telemetry-chart/telemetry-chart';

type Theme = 'dark' | 'light';

@Component({
  selector: 'app-machine-dashboard',
  standalone: true,
  imports: [
    AlertPanel,
    ControlPanel,
    DatePipe,
    SettingsPanel,
    StatusCard,
    TelemetryCard,
    TelemetryChart,
  ],
  templateUrl: './machine-dashboard.html',
  styleUrl: './machine-dashboard.css',
})
export class MachineDashboard {
  private readonly machineService = inject(MachineService);

  protected readonly MachineStatus = MachineStatus;
  protected readonly state;
  protected readonly history;
  protected readonly alerts;
  protected readonly config;
  protected readonly theme = signal<Theme>(this.restoreTheme());

  constructor() {
    this.state = toSignal(this.machineService.state$, {
      initialValue: this.machineService.snapshot,
    });
    this.history = toSignal(this.machineService.history$, { initialValue: [] });
    this.alerts = toSignal(this.machineService.alerts$, { initialValue: [] });
    this.config = toSignal(this.machineService.config$, {
      initialValue: this.machineService.configSnapshot,
    });
  }

  protected startMachine(): void {
    this.machineService.startMachine();
  }

  protected stopMachine(): void {
    this.machineService.stopMachine();
  }

  protected simulateFault(): void {
    this.machineService.simulateFault();
  }

  protected simulateDisconnect(): void {
    this.machineService.simulateDisconnect();
  }

  protected resetSystem(): void {
    this.machineService.resetSystem();
  }

  protected clearHistory(): void {
    this.machineService.clearHistory();
  }

  protected updateConfig(update: Partial<TelemetryConfig>): void {
    this.machineService.updateConfig(update);
  }

  protected toggleTheme(): void {
    const nextTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(nextTheme);
    try {
      localStorage.setItem('machine-dashboard.theme', nextTheme);
    } catch {
      // Theme persistence is optional when browser storage is unavailable.
    }
  }

  private restoreTheme(): Theme {
    try {
      return localStorage.getItem('machine-dashboard.theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }
}
