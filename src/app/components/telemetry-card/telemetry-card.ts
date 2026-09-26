import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { HealthLevel } from '../../models/machine-state';

@Component({
  selector: 'app-telemetry-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './telemetry-card.html',
  styleUrl: './telemetry-card.css',
})
export class TelemetryCard {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = 0;
  @Input({ required: true }) unit = '';
  @Input() detail = '';
  @Input() icon: 'temperature' | 'speed' | 'clock' = 'temperature';
  @Input() level: HealthLevel = 'normal';
  @Input() integer = false;
}
