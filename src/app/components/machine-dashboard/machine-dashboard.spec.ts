import { TestBed } from '@angular/core/testing';

import { MachineStatus } from '../../models/machine-state';
import { MachineService } from '../../service/machine.service';
import { MachineDashboard } from './machine-dashboard';

describe('MachineDashboard', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [MachineDashboard] }).compileComponents();
  });

  it('starts the machine from the primary control', () => {
    const fixture = TestBed.createComponent(MachineDashboard);
    const service = TestBed.inject(MachineService);
    fixture.detectChanges();

    const startButton = fixture.nativeElement.querySelector(
      '[data-testid="start-button"]',
    ) as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    expect(service.snapshot.status).toBe(MachineStatus.Running);
    expect(fixture.nativeElement.textContent).toContain('En operación');
  });

  it('exposes telemetry charts and alert status', () => {
    const fixture = TestBed.createComponent(MachineDashboard);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Tendencias de telemetría');
    expect(content).toContain('Sin alertas activas');
  });
});
