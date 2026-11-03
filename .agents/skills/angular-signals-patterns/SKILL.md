---
name: angular-signals-patterns
description: Guide for implementing and refactoring Angular components, facades, and services using modern Signals, Signal Forms, Zoneless reactivity, and Deferrable Views following angular.dev standards.
---

# Modern Angular Signals & Architecture Patterns

This skill guides the implementation of modern reactive patterns in Angular 22, aligned with official recommendations from [angular.dev](https://angular.dev).

## Signals Cheatsheet

### 1. Component State
```typescript
import { Component, signal, computed, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button (click)="increment()">Increment</button>
  `,
})
export class CounterComponent {
  readonly count = signal(0);
  readonly double = computed(() => this.count() * 2);

  increment(): void {
    this.count.update(n => n + 1);
  }
}
```

### 2. Signal Inputs & Outputs
Never use `@Input()` or `@Output()` decorators in modern Angular:
```typescript
import { Component, input, output, model } from '@angular/core';

@Component({
  selector: 'app-product-item',
  template: `...`
})
export class ProductItemComponent {
  // Required input
  readonly product = input.required<Product>();
  // Optional input with default
  readonly compact = input(false);
  // Two-way model binding [(quantity)]
  readonly quantity = model(1);
  // Output event emitter
  readonly removed = output<string>();
}
```

### 3. Native Control Flow & Template Features
Avoid `CommonModule` directives (`*ngIf`, `*ngFor`):
```html
@if (user(); as u) {
  <p>Hello, {{ u.name }}</p>
} @else {
  <p>Please log in.</p>
}

@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>No items found.</p>
}

@defer (on viewport) {
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="skeleton-chart">Loading preview...</div>
}
```

### 4. Dependency Injection & Service Layer
Always use `inject()`:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
}
```

### 5. Facade Pattern for Complex State
Combine signals with repositories:
```typescript
@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly cartState = signal<CartItem[]>([]);
  readonly items = this.cartState.asReadonly();
  readonly itemCount = computed(() => this.cartState().reduce((acc, i) => acc + i.quantity, 0));
  readonly subtotal = computed(() => this.cartState().reduce((acc, i) => acc + i.price * i.quantity, 0));
}
```
