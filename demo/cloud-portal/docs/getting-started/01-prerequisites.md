# Prerequisites

Before you can run the Datum Cloud Portal locally, ensure you have the following tools and access.

---

## Required Tools

### Node.js (Runtime)

Node.js runs the portal, and npm installs its dependencies. The version is pinned in `.nvmrc`.

```bash
# Verify installation
node --version  # Should be >= 26.13.0
```

### Git

```bash
git --version  # Should be >= 2.x
```

---

## Required Access

Before starting development, ensure you have:

- [ ] **GitHub access** to the `datum/cloud-portal` repository
- [ ] **OIDC credentials** from your authentication provider
- [ ] **Control Plane API access** for fetching OpenAPI specs (optional for initial setup)

---

## Recommended Tools

### IDE

- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier - Code formatter
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar) - for better TS support

### Docker Desktop

Required for running the local observability stack (Grafana, Prometheus, Jaeger).

```bash
docker --version
docker-compose --version
```

---

## Checkpoint

Run this command to verify all required tools are installed:

```bash
node --version && npm --version && git --version
```

**Expected output:** All three version numbers displayed without errors.

---

## Next Step

Once prerequisites are met, proceed to [Environment Setup](./02-environment-setup.md).
