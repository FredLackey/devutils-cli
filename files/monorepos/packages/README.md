# Packages

This folder contains shared libraries and utilities used across applications.

## Purpose

Packages are reusable code modules that provide common functionality to multiple applications in the monorepo. This promotes code reuse, consistency, and maintainability across the project.

## Structure

```
packages/
├── [project]-utils/     # Utility functions and helpers
├── [project]-types/     # Shared type definitions
├── [project]-config/    # Shared configuration
└── ...
```

## Guidelines

- Packages should be framework-agnostic when possible
- Each package should have a single, well-defined responsibility
- Packages are imported by applications in `/apps`
- Keep packages small and focused
- Document public APIs within each package
