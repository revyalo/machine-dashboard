import { Component, Input } from '@angular/core';

import { MachineState, MachineStatus } from '../../models/machine-state';

@Component({
  selector: 'app-status-card',
  standalone: true,
  templateUrl: './status-card.html',
  styleUrl: './status-card.css',
})
export class StatusCard {
  @Input({ required: true }) state!: MachineState;

  protected readonly MachineStatus = MachineStatus;

  protected get statusLabel(): string {
    const labels: Record<MachineStatus, string> = {
      [MachineStatus.Running]: 'En operación',
      [MachineStatus.Stopped]: 'Detenida',
      [MachineStatus.Disconnected]: 'Desconectada',
      [MachineStatus.Error]: 'Fallo crítico',
    };
    return labels[this.state.status];
  }
}
