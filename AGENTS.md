<!-- Rules for AI agents operating in this workspace. Mirrors GEMINI.md -->
# ShopSphere AI Agent Guidelines (Modern Angular 22 & TypeScript)

Please refer to [GEMINI.md](./GEMINI.md) for full architecture, coding conventions, testing standards, and modern Angular 22 best practices.

### Key Rules at a Glance:
1. **Modern Angular (angular.dev)**: Standalone by default, Signals (`signal`, `computed`, `linkedSignal`), Signal forms / Reactive forms, native `@if`/`@for`/`@switch`/`@let`/`@defer`.
2. **Dependency Injection**: Always `inject()`, never constructor injection.
3. **No Direct HTTP in Components**: Data flows Component → Service/Facade → Repository → `HttpClient`.
4. **Accessibility**: All templates and components must pass AXE audits and WCAG AA standards.
5. **Testing**: Vitest (`npm test -- --watch=false`).
