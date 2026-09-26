import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

export interface Breadcrumb {
  label: string;
  /** null for the last crumb — it's the current page and shouldn't be a link. */
  url: string | null;
}

const DASHBOARD_URL = '/dashboard';

/**
 * Automatic breadcrumb trail shown above every routed screen — built from `data.breadcrumb`
 * on the matched route chain, so individual pages never need their own breadcrumb markup.
 */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  readonly crumbs = computed<Breadcrumb[]>(() => {
    this.navigationEnd();
    return this.buildTrail();
  });

  private buildTrail(): Breadcrumb[] {
    const crumbs: Breadcrumb[] = [];
    let url = '';
    let node: ActivatedRoute | null = this.route.root;
    while (node) {
      const snapshot = node.snapshot;
      const segment = snapshot.url.map((s) => s.path).join('/');
      if (segment) {
        url += `/${segment}`;
      }
      const label = snapshot.data['breadcrumb'] as string | undefined;
      if (label) {
        // A detail/sub-page (e.g. "bookings/:id") is a sibling of its list route
        // (e.g. "bookings"), not nested under it, so the list's own crumb is never on
        // this activation chain — `breadcrumbParent` lets such a route splice in that
        // otherwise-unreachable ancestor crumb before its own.
        const parent = snapshot.data['breadcrumbParent'] as Breadcrumb | undefined;
        if (parent && crumbs[crumbs.length - 1]?.url !== parent.url) {
          crumbs.push(parent);
        }
        crumbs.push({ label, url });
      }
      node = node.firstChild;
    }

    // Already on the dashboard — just the single, unlinked crumb.
    if (crumbs.length === 1 && crumbs[0].url === DASHBOARD_URL) {
      return [{ label: crumbs[0].label, url: null }];
    }

    const trail: Breadcrumb[] = [{ label: 'Dashboard', url: DASHBOARD_URL }, ...crumbs];
    const lastIndex = trail.length - 1;
    return trail.map((crumb, i) => (i === lastIndex ? { ...crumb, url: null } : crumb));
  }
}
