# Testing Guidelines for Weaver Eduction Platform

## Overview

Use Deno's built-in testing capabilities with Fresh 2.0 beta (Canary) testing
patterns to ensure code quality and functionality.

## Testing Framework

- **Deno Test Runner**: Built-in testing framework
- **Fresh 2.0 Testing**: Use Fresh 2.0 beta's testing utilities for components
  and routes
- **Expect Library**: `@std/expect` for assertions

## Component Testing

### Basic Component Test

```typescript
import { expect } from "@std/expect";
import { define } from "../utils.ts";
import Logo from "../components/Logo.tsx";

Deno.test("Logo component - renders with community name", () => {
  const result = Logo({ communityName: "HR", showDropdown: true });

  expect(result).toContain("CareerLearning HR");
  expect(result).toContain("CL"); // Logo initials
});
```

### Component with Props Test

```typescript
Deno.test("Logo component - handles different community names", () => {
  const hrResult = Logo({ communityName: "HR" });
  const aiResult = Logo({ communityName: "AI" });

  expect(hrResult).toContain("CareerLearning HR");
  expect(aiResult).toContain("CareerLearning AI");
});
```

## Route Testing

### Basic Route Test

```typescript
import { expect } from "@std/expect";
import { App } from "fresh";

Deno.test("Community route - renders HR community", async () => {
  const handler = new App()
    .get("/hr", (ctx) => ctx.render(<h1>HR Community</h1>))
    .handler();

  const res = await handler(new Request("http://localhost/hr"));
  const text = await res.text();

  expect(text).toContain("HR Community");
});
```

### Route with State Test

```typescript
Deno.test("Community route - sets page title", async () => {
  const handler = new App()
    .get("/hr", (ctx) => {
      ctx.state.title = "HR Community - CareerLearning";
      return ctx.render(<h1>HR Community</h1>);
    })
    .handler();

  const res = await handler(new Request("http://localhost/hr"));
  const text = await res.text();

  expect(text).toContain("HR Community - CareerLearning");
});
```

## Testing Requirements

### Every Component Must Have:

- [ ] **Basic rendering test** - Component renders without errors
- [ ] **Props test** - Different prop values work correctly
- [ ] **TypeScript test** - Proper type checking
- [ ] **Accessibility test** - Basic a11y checks

### Every Route Must Have:

- [ ] **Route rendering test** - Route loads and displays content
- [ ] **State test** - Route state is set correctly
- [ ] **Error handling test** - 404s and errors handled properly
- [ ] **Integration test** - Works with other components

## Test File Organization

```
tests/
├── components/
│   ├── Logo.test.tsx
│   ├── SearchBar.test.tsx
│   └── UserActions.test.tsx
├── routes/
│   ├── community.test.tsx
│   ├── index.test.tsx
│   └── api.test.tsx
└── integration/
    ├── header.test.tsx
    └── navigation.test.tsx
```

## Running Tests

```bash
# Run all tests
deno test

# Run specific test file
deno test tests/components/Logo.test.tsx

# Run tests with coverage
deno test --coverage

# Run tests in watch mode
deno test --watch
```

## Test Naming Convention

- **Component tests**: `ComponentName.test.tsx`
- **Route tests**: `route-name.test.tsx`
- **Integration tests**: `feature-name.test.tsx`

## Test Structure

```typescript
Deno.test("ComponentName - specific behavior", () => {
  // Arrange
  const props = {/* test data */};

  // Act
  const result = Component(props);

  // Assert
  expect(result).toContain("expected content");
});
```

## Best Practices

- **Test behavior, not implementation** - Focus on what the component does
- **Use descriptive test names** - Clear what is being tested
- **Keep tests simple** - One assertion per test when possible
- **Mock external dependencies** - Don't test third-party libraries
- **Test edge cases** - Empty states, error conditions
- **Use TypeScript** - Leverage type safety in tests

## CI/CD Integration

- All tests must pass before PR merge
- Coverage threshold: 80% minimum
- Tests run on every commit
- Failed tests block deployment
