import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [TableModule, Skeleton],
  templateUrl: './table-skeleton.component.html',
  styleUrl: './table-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSkeletonComponent {
  readonly columns = input.required<number>();
  readonly rows = input<number>(5);

  get columnArray(): number[] {
    return Array(this.columns()).fill(0);
  }

  get rowArray(): number[] {
    return Array(this.rows()).fill(0);
  }
}
