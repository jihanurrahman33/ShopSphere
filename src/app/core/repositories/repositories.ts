import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, Coupon, InventoryTransaction, Order, Product, Review, UserRecord } from '../models';
import { BaseRepository } from './base.repository';

@Injectable({ providedIn: 'root' })
export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super('products');
  }

  findFeatured(): Observable<Product[]> {
    return this.findAll({ featured: true, status: 'active' });
  }

  findBySlug(slug: string): Observable<Product[]> {
    return this.findAll({ slug });
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }
}

@Injectable({ providedIn: 'root' })
export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super('orders');
  }

  findByCustomer(customerId: string): Observable<Order[]> {
    return this.findAll({ customerId });
  }
}

@Injectable({ providedIn: 'root' })
export class CouponRepository extends BaseRepository<Coupon> {
  constructor() {
    super('coupons');
  }

  findByCode(code: string): Observable<Coupon[]> {
    return this.findAll({ code, active: true });
  }
}

@Injectable({ providedIn: 'root' })
export class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }

  findByProduct(productId: string): Observable<Review[]> {
    return this.findAll({ productId, _sort: 'createdAt', _order: 'desc' });
  }

  findByProductAndUser(productId: string, userId: string): Observable<Review[]> {
    return this.findAll({ productId, userId });
  }
}

@Injectable({ providedIn: 'root' })
export class InventoryRepository extends BaseRepository<InventoryTransaction> {
  constructor() {
    super('inventoryTransactions');
  }

  findRecent(limit: number): Observable<InventoryTransaction[]> {
    return this.findAll({ _sort: 'createdAt', _order: 'desc', _limit: limit });
  }
}

@Injectable({ providedIn: 'root' })
export class UserRepository extends BaseRepository<UserRecord> {
  constructor() {
    super('users');
  }

  findByEmail(email: string): Observable<UserRecord[]> {
    return this.findAll({ email });
  }
}
