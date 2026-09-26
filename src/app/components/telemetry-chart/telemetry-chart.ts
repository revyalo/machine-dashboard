import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

import { TelemetryReading } from '../../models/machine-state';

type ValueKey = 'temperature' | 'rpm';

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './telemetry-chart.html',
  styleUrl: './telemetry-chart.css',
})
export class TelemetryChart implements OnChanges {
  @Input({ required: true }) title = '';
  @Input({ required: true }) unit = '';
  @Input({ required: true }) color = '#3dd9c5';
  @Input({ required: true }) values: readonly TelemetryReading[] = [];
  @Input({ required: true }) valueKey: ValueKey = 'temperature';
  @Input() minimum = 0;
  @Input() maximum = 100;

  protected points = '';
  protected areaPoints = '';
  protected latest = 0;
  protected readonly chartWidth = 640;
  protected readonly chartHeight = 185;

  ngOnChanges(): void {
    const readings = this.values.map((reading) => reading[this.valueKey]);
    this.latest = readings.at(-1) ?? 0;
    if (readings.length === 0) {
      this.points = '';
      this.areaPoints = '';
      return;
    }

    const usableWidth = this.chartWidth - 36;
    const usableHeight = this.chartHeight - 34;
    this.points = readings
      .map((value, index) => {
        const x = 18 + (index / Math.max(readings.length - 1, 1)) * usableWidth;
        const ratio = (value - this.minimum) / Math.max(this.maximum - this.minimum, 1);
        const y = 12 + usableHeight - Math.min(Math.max(ratio, 0), 1) * usableHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    this.areaPoints = `18,${this.chartHeight - 22} ${this.points} ${this.chartWidth - 18},${this.chartHeight - 22}`;
  }
}
