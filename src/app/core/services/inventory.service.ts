import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, throwError } from 'rxjs';
import { stockAfter } from '../domain/stock';
import { InventoryReason, InventoryTransaction, Product } from '../models';
import { InventoryRepository, ProductRepository } from '../repositories/repositories';

/** Changes stock and records the movement. Client-side only; a real backend must make this atomic. */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly products = inject(ProductRepository);
  private readonly ledger = inject(InventoryRepository);

  adjust(product: Product, change: number, reason: InventoryReason, note?: string): Observable<InventoryTransaction> {
    const next = stockAfter(product.stock, change);
    if (next === null) {
      return throwError(() => new Error('Enter a whole number that keeps stock at 0 or more.'));
    }
    return this.products.update(product.id, { stock: next }).pipe(
      switchMap(() => this.record(product, change, reason, note)),
    );
  }

  /** Ledger entry only; used when another flow (checkout) already changed the stock. */
  record(product: Pick<Product, 'id' | 'name'>, change: number, reason: InventoryReason, note?: string): Observable<InventoryTransaction> {
    return this.ledger.create({
      productId: product.id,
      productName: product.name,
      change,
      reason,
      ...(note ? { note } : {}),
      createdAt: new Date().toISOString(),
    });
  }
}
