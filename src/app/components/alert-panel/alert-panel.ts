import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { TelemetryAlert } from '../../models/machine-state';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './alert-panel.html',
  styleUrl: './alert-panel.css',
})
export class AlertPanel {
  @Input({ required: true }) alerts: readonly TelemetryAlert[] = [];
  @Input() message = '';
}
