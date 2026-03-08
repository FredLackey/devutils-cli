# Apps

This folder contains the main applications for the project.

## Purpose

Each application in this folder represents a distinct, deployable unit—whether it's a frontend, backend API, admin tool, or other service. Applications are organized as separate subdirectories, each with their own dependencies and configuration.

## Structure

```
apps/
├── [app-name]-ui-[framework]/    # Frontend applications
├── [app-name]-api-[framework]/   # Backend API services
├── [app-name]-admin-[framework]/ # Admin tools
└── ...
```

## Guidelines

- Each application should be independently runnable
- Applications may depend on shared code from `/packages`
- Keep application-specific code within its subdirectory
- Use consistent naming: `[project]-[type]-[framework]`
