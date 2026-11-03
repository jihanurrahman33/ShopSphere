import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { EntityId } from '../models';

/**
 * Repository pattern: a uniform CRUD abstraction over a REST resource.
 * Open/Closed: feature repositories extend this and add only what is specific.
 */
export abstract class BaseRepository<T extends { id: EntityId }> {
  protected readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected constructor(private readonly resource: string) {}

  protected get url(): string {
    return `${this.baseUrl}/${this.resource}`;
  }

  findAll(params?: Record<string, string | number | boolean>): Observable<T[]> {
    return this.http.get<T[]>(this.url, { params });
  }

  findById(id: EntityId): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(entity: Omit<T, 'id'>): Observable<T> {
    return this.http.post<T>(this.url, entity);
  }

  update(id: EntityId, changes: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.url}/${id}`, changes);
  }

  delete(id: EntityId): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
