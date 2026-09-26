import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MachineStatus } from '../../models/machine-state';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.css',
})
export class ControlPanel {
  @Input({ required: true }) status = MachineStatus.Stopped;
  @Output() readonly startRequested = new EventEmitter<void>();
  @Output() readonly stopRequested = new EventEmitter<void>();
  @Output() readonly faultRequested = new EventEmitter<void>();
  @Output() readonly disconnectRequested = new EventEmitter<void>();
  @Output() readonly resetRequested = new EventEmitter<void>();

  protected readonly MachineStatus = MachineStatus;
}
