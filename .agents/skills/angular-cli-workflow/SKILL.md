---
name: angular-cli-workflow
description: Provides actionable workflows, CLI commands, and tool usage for Angular development, testing with Vitest, building, accessibility checks, and using the Angular MCP server.
---

# Angular CLI & ShopSphere Development Workflow

This skill guides you through common development, testing, building, and verification tasks in the ShopSphere Angular 22 workspace.

## Development Environment Setup

- **Node.js**: v22.22.3+, v24.15+, or v26+
- **Angular CLI**: Installed globally or via `npx @angular/cli`
- **Shell Autocompletion**: Enabled in `~/.bashrc` via `source <(ng completion script)`

## Running the Application

ShopSphere requires two services running in parallel:

1. **Mock REST API** (Port 3000):
   ```bash
   npm run api
   ```
   Watches `db.json` and serves mock endpoints.

2. **Angular Dev Server** (Port 4200):
   ```bash
   npm start
   ```
   Starts `ng serve` with live reload.

## Running Tests & Verifying Quality

1. **Unit Tests (Vitest)**:
   ```bash
   npm test -- --watch=false
   ```
   *To run a specific test file:*
   ```bash
   npx vitest run src/app/features/storefront/cart/cart.spec.ts
   ```

2. **Production Build Check**:
   ```bash
   npm run build
   ```
   Ensures bundle budgets, TypeScript strict types, and ahead-of-time compilation pass without errors.

3. **Accessibility Audits**:
   Ensure new components include an AXE check in their `.spec.ts` file using `src/testing/axe.ts`:
   ```typescript
   import { axe } from '../../../testing/axe';

   it('has no axe violations', async () => {
     expect(await axe(fixture.nativeElement)).toHaveNoViolations();
   });
   ```

## Using Angular CLI MCP Server

The project has Angular MCP configured in `.mcp.json` and `~/.gemini/config/mcp_config.json`:
- Command: `npx -y @angular/cli mcp`
- Available capabilities:
  - `search_documentation`: Real-time official documentation lookup from angular.dev
  - `get_best_practices`: Coding standards for modern Angular
  - `list_projects`: Inspects angular.json workspaces and projects
  - `onpush_zoneless_migration`: Guidelines for OnPush and zoneless change detection
