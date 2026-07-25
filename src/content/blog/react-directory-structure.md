---
title: "React directory structure"
description: "Discussing how a React component's logical structure can be reflected in its file structure to improve developer experience."
pubDate: "2023/01/23"
heroImage: "./fraught_stickman_overwhelmed_by_multiple_giant_piles_of_paper.webp"
heroImageText: "An image generated using DALL.E with the prompt: fraught stickman overwhelmed by multiple giant piles of paper"
---

When working on a React project, organizing your files might seem like an afterthought. But as your code base grows, a messy directory structure at best wastes time and frustrates developers, and at worst creates bugs and unnecessary technical debt. Fortunately, if you understand the basic principles of writing React components, you already have the mental framework to organize them effectively. In this post we will explore how.

## Why does directory structure matter?

While directory structure doesn't affect how a computer interprets code, it significantly impacts a developer’s ability to navigate and maintain a project. In a small individual project this might not be that important. But in a large commercial project with multiple teams working in parallel and regular changes in developers, any small increase in productivity or reduction in on-boarding time provides cheap and fast value to the organisation and the developer.

## What is a component?

If the goal of component organisation is to improve developer productivity by making the directory structure as intuitive as possible then we must first understand what a component is. The React documentation defines a component as:

> “Components let you split the UI into independent, reusable pieces, and think about each piece in isolation.<br>
> — <cite>React documentation: components and props[^1]</cite>

[^1]: [React documentation: components and props](https://reactjs.org/docs/components-and-props.html)

If developers understand components as isolated, independent, and reusable; then the most intuitive directory structure is one that reflects those same principles. This allows the developer to view the entire code base with a single mental model of how both the files and the code within are organised.

## Simple component directory

Below is an example of how a simple component might be organised, there is a single directory which is named after the files of the component it contains, within that directory each file has a name which explains the role it performs at a glance.

```
ComponentName
├── index.ts
├── ComponentName.tsx
├── ComponentName.styles.tsx
└── ComponentName.test.tsx
```

#### index.ts

The index file is how the component interacts with the outside world, often the only export from this file will be the component itself but it could also include things like a type describing the components props. Using an index file reduces the length of the import when the component is used from:

```typescript
import { ComponentName } from ../../ComponentName/ComponentName
```

To:

```typescript
import { ComponentName } from ../../ComponentName
```

Which is a small difference but in a large code base adds up quickly.

#### ComponentName.tsx

Contains the component itself, the core logic and the JSX markup.

#### ComponentName.styles.tsx

The styles file could be styled components, CSS in JS, SASS, CSS etc, but it is split out from the main component because styling often generates a lot of lines of code and a single file containing logic, styling and markup can get very large very quickly.

#### ComponentName.test.tsx

The test file contains the unit tests for the component, some people prefer to group their test files together away from the code being tested, but that breaks the principle that a component is isolated and independent; everything about the component should be grouped together in one place.

## Parents and children

While the principle of independence is a good guide the real world is not always so neat and tidy, sometimes a component is so unweildy that creating a tightly coupled child component is the cleanest solution. This pattern is often useful for components that can have multiple different states or repeating elements like tables or a settings page. As our previously described directory structure pattern is intended to describe what everything in the directory does at a glance we need a way to show the tightly coupled relationship between a parent and a child component. Fortunately the existing pattern is recursive.

```
Components
└── Parent
    ├── index.ts
    ├── Parent.tsx
    └── Child
        ├── index.ts
        └── Child.tsx
```

This pattern becomes particularly useful when a child component needs to be decoupled from its parent and made into an independent component, as the component is already self contained in its own directory you can simply move the directory and then update the logic accordingly.

```
Components
├── Parent
│   ├── index.ts
│   └── Parent.tsx
└── Child
    ├── index.ts
    └── Child.tsx
```

## Complex component directory

Should a component become more complex or have additional dependencies this pattern can of course expand to accommodate additional files. For example if custom hooks are created there are two options, for simple tightly coupled hooks where the objective is to move logic out of a large component file a dedicated hooks file is suitable:

```
ComponentName.hooks.ts
```

Alternatively if a hook is more complex then it often makes sense to apply the same principles of isolation, independence and reusability to it and provide some separation from the original component. This is particularly valuable for files that can grow large easily like unit tests. Fortunately the existing directory structure works equally well for hooks as it does for components with all the same benefits.

```
ComponentName
├── index.ts
├── ComponentName.tsx
├── ComponentName.test.tsx
└── useCustomHook
    ├── index.ts
    ├── useCustomHook.ts
    └── useCustomHook.test.ts
```

Automatic type generation is another excellent example of how this pattern can help keep a code base organised and easy to navigate. When using GraphQL code generator each component requires two additional files, one to contain the fragments, queries and mutations that the component needs and another to contain the automatically generated types.

```
ComponentName
├── index.ts
├── ComponentName.tsx
├── ComponentName.generated.tsx
├── ComponentName.graphql
├── ComponentName.styles.tsx
└── ComponentName.test.tsx
```

## Conclusion

Between styles, types, tests, logic, hooks, and child components, a React component can quickly grow into a large amount of code. In a complex codebase, this can easily become overwhelming. However, by applying the same principles of isolation, independence, and reusability to your directory structure, you ensure that every file is exactly where you expect it to be — making your project easier to maintain, scale, and collaborate on.
