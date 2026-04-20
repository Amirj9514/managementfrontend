import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-stay-shell',
  imports: [RouterOutlet],
  templateUrl: './stay-shell.component.html',
  styleUrl: './stay-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StayShellComponent {}
