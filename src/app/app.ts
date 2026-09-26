import { Component } from '@angular/core';

import { MachineDashboard } from './components/machine-dashboard/machine-dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MachineDashboard],
  template: '<app-machine-dashboard />',
})
export class App {}
