import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TelemetryConfig } from '../../models/machine-state';

type NumericConfigKey =
  'intervalMs' | 'warningTemperature' | 'criticalTemperature' | 'minimumRpm' | 'maximumRpm';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.css',
})
export class SettingsPanel {
  @Input({ required: true }) config!: TelemetryConfig;
  @Output() readonly configChanged = new EventEmitter<Partial<TelemetryConfig>>();

  protected update(key: NumericConfigKey, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    this.configChanged.emit({ [key]: Number(input.value) });
  }
}
