import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login';

function setup(login: AuthService['login']) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Login);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const fill = (selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  return { fixture, el, fill, submit, navigate };
}

describe('Login', () => {
  it('keeps the button disabled until the form is valid', () => {
    const { fixture, el, fill } = setup(() => of());
    const button = el.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fill('input[type=email]', 'a@x.dev');
    fill('input[type=password]', 'secret');
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('navigates after a successful sign-in', () => {
    const login = vi.fn(() => of({ id: '1', name: 'A', email: 'a@x.dev', role: 'customer' as const }));
    const { fill, submit, navigate } = setup(login);
    fill('input[type=email]', 'a@x.dev');
    fill('input[type=password]', 'secret');
    submit();
    expect(login).toHaveBeenCalledWith('a@x.dev', 'secret');
    expect(navigate).toHaveBeenCalledWith('/store');
  });

  it('ignores an external returnUrl and goes to the store', () => {
    const login = vi.fn(() => of({ id: '1', name: 'A', email: 'a@x.dev', role: 'customer' as const }));
    const { fixture, fill, submit, navigate } = setup(login);
    fixture.componentRef.setInput('returnUrl', '//evil.example');
    fill('input[type=email]', 'a@x.dev');
    fill('input[type=password]', 'secret');
    submit();
    expect(navigate).toHaveBeenCalledWith('/store');
  });

  it('follows a safe in-app returnUrl', () => {
    const login = vi.fn(() => of({ id: '1', name: 'A', email: 'a@x.dev', role: 'customer' as const }));
    const { fixture, fill, submit, navigate } = setup(login);
    fixture.componentRef.setInput('returnUrl', '/store/checkout');
    fill('input[type=email]', 'a@x.dev');
    fill('input[type=password]', 'secret');
    submit();
    expect(navigate).toHaveBeenCalledWith('/store/checkout');
  });

  it('shows an alert and re-enables the button when sign-in fails', () => {
    const { fixture, el, fill, submit } = setup(() => throwError(() => new Error('Invalid email or password')));
    fill('input[type=email]', 'a@x.dev');
    fill('input[type=password]', 'wrong');
    submit();
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Invalid email or password');
    expect((el.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBe(false);
  });
});
