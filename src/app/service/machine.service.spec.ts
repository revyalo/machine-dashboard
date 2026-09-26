import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { MachineStatus } from '../models/machine-state';
import { MachineService } from './machine.service';

describe('MachineService', () => {
  let service: MachineService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MachineService);
  });

  it('starts and stops telemetry safely', fakeAsync(() => {
    const historyLengths: number[] = [];
    service.history$.subscribe((history) => historyLengths.push(history.length));

    service.startMachine();
    expect(service.snapshot.status).toBe(MachineStatus.Running);
    expect(service.snapshot.rpm).toBeGreaterThan(0);

    tick(service.configSnapshot.intervalMs);
    expect(historyLengths.at(-1)).toBeGreaterThan(1);

    service.stopMachine();
    const readingsAfterStop = historyLengths.at(-1);
    tick(service.configSnapshot.intervalMs * 2);

    expect(service.snapshot.status).toBe(MachineStatus.Stopped);
    expect(service.snapshot.rpm).toBe(0);
    expect(historyLengths.at(-1)).toBe(readingsAfterStop);
  }));

  it('raises a critical alert when a configured threshold is exceeded', () => {
    service.updateConfig({ warningTemperature: 10, criticalTemperature: 20 });
    service.startMachine();

    let latestAlertTitle = '';
    service.alerts$.subscribe((alerts) => (latestAlertTitle = alerts[0]?.title ?? ''));

    expect(service.snapshot.health).toBe('critical');
    expect(latestAlertTitle).toBe('Temperatura crítica');
  });

  it('caps history using the configured limit', fakeAsync(() => {
    service.updateConfig({ intervalMs: 800, historyLimit: 3 });
    service.startMachine();
    tick(800 * 5);

    let historySize = 0;
    service.history$.subscribe((history) => (historySize = history.length));
    expect(historySize).toBe(3);
  }));

  it('moves to a disconnected state when telemetry is lost', () => {
    service.startMachine();
    service.simulateDisconnect();

    expect(service.snapshot.status).toBe(MachineStatus.Disconnected);
    expect(service.snapshot.health).toBe('critical');
    expect(service.snapshot.rpm).toBe(0);
  });
});
