# ShopSphere AI Agent Guidelines (Modern Angular 22 & TypeScript)

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular (v22+) and TypeScript best practices as outlined on [angular.dev](https://angular.dev).

---

## Core Angular Architecture & Best Practices

- **Standalone by Default**: Components, directives, and pipes are standalone. Do NOT set `standalone: true` inside Angular decorators (it is the default in modern Angular).
- **Zoneless & OnPush**: Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly; zoneless / OnPush semantics are standard.
- **Signals for State**:
  - Local state: `signal()`
  - Derived state: `computed()`
  - Synchronized multi-source state: `linkedSignal()`
  - Asynchronous data resources: `resource()` / `rxResource()`
  - Do NOT mutate signals directly; use `update()` or `set()`.
- **Inputs & Outputs**:
  - Use `input()` and `output()` functions instead of legacy decorators (`@Input()`, `@Output()`).
  - Use `model()` for two-way bound properties (`[(prop)]`).
- **Templates & Control Flow**:
  - Use modern built-in control flow: `@if`, `@else if`, `@else`, `@for`, `@switch`, `@case`, and `@default`.
  - Use `@let` declarations for local template variables.
  - Use `@defer (on viewport | interaction | idle)` for deferrable lazy-rendered views.
  - Do NOT use `*ngIf`, `*ngFor`, `*ngSwitch`.
  - Use class and style bindings (`[class.active]="..."`, `[style.color]="..."`) instead of `ngClass` / `ngStyle`.
  - Do NOT import `CommonModule`. Import only specific directives and pipes needed (e.g. `AsyncPipe`, `DatePipe`, `DecimalPipe`).
  - Use `NgOptimizedImage` (`ngSrc`) for static images.
  - No `@HostBinding` or `@HostListener` decorators; declare host listeners and bindings inside the `host` configuration object of the `@Component` / `@Directive` decorator.
- **Dependency Injection**:
  - Always use `inject(Service)` instead of constructor injection.
  - Provide singleton services with `{ providedIn: 'root' }` or the `@Service` decorator.
- **Forms**:
  - Prefer Signal Forms (`@angular/forms/signals`) or Reactive Forms (`FormBuilder`, `FormGroup`, `FormControl`). Avoid legacy template-driven forms.

---

## ShopSphere Architecture & Patterns

The codebase follows strict architectural separation:

```
src/app/
├── core/         models, repositories, facades, strategies, factories, domain rules, services, guards, interceptors
├── shared/       reusable presentational components (product card, status badge, pagination)
├── layouts/      store-layout, admin-layout
└── features/     storefront/, admin/, auth/  (lazy-loaded routes)
```

- **Repository Pattern**: `core/repositories` (generic `BaseRepository<T>` and concrete resource repositories). Components must NEVER call `HttpClient` directly.
- **Facade Pattern**: `CartFacade`, `WishlistFacade` manage client-side state and abstract complexities from UI components.
- **Strategy Pattern**: `core/strategies` for interchangeable business algorithms (discount calculation, shipping).
- **Factory Pattern**: `core/factories/order.factory.ts` for order snapshot creation.
- **Pure Domain Rules**: Keep business logic (order workflow, coupon rules, stock verification, reports) in pure functions under `core/domain` with dedicated unit tests.

---

## Accessibility (a11y) & Testing Requirements

- **WCAG AA Compliance**: Must follow WCAG AA guidelines including color contrast, ARIA labels, semantic HTML, and focus management.
- **AXE Verification**: Components must pass AXE audits (`axe-core`).
- **Testing**: Vitest is the unit test runner (`npm test -- --watch=false`). All business logic and components must have unit test coverage.

---

## Commands & Tooling

- Mock REST API: `npm run api` (runs `json-server` on port 3000)
- Angular Dev Server: `npm start` (runs `ng serve` on port 4200)
- Production Build: `npm run build`
- Unit Tests: `npm test -- --watch=false`
- Angular CLI MCP: `@angular/cli mcp`
