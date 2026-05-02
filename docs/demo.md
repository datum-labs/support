# Support Demo — Local Kind Cluster

This guide walks you through running the full support system locally using a [kind](https://kind.sigs.k8s.io/) cluster. The demo brings up:

- **Support API server** — Kubernetes aggregated API server for `SupportTicket` and `SupportMessage` resources
- **Milo control plane** — core platform APIs (organizations, users, IAM)
- **Dex** — lightweight OIDC provider for portal authentication (demo user pre-configured)
- **Staff Portal** — operator-facing UI at `https://staff.localhost:30443`
- **Cloud Portal** — customer-facing UI at `https://cloud.localhost:30443`

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Docker](https://docs.docker.com/get-docker/) | Container runtime for kind |
| [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) | Local Kubernetes clusters |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | Cluster interaction |
| [task](https://taskfile.dev/installation/) | Task runner |
| [nix](https://nixos.org/download/) | Provides `bun` for portal builds |
| [go](https://go.dev/dl/) 1.23+ | Building the support binary |

The demo also expects the following repositories checked out as siblings of this one:

```
datum-labs/
  support/           ← this repo
datum-cloud/
  milo/
  staff-portal/
  cloud-portal/
```

---

## `/etc/hosts` setup

The portals are served on `*.localhost` hostnames over NodePort 30443. Add these entries once:

```
127.0.0.1  staff.localhost cloud.localhost
```

On Linux/macOS:

```sh
echo "127.0.0.1  staff.localhost cloud.localhost" | sudo tee -a /etc/hosts
```

---

## Quick start

Run the full demo in one shot:

```sh
task demo:up
```

This creates the kind cluster, deploys Milo, Dex (the OIDC provider), the support API server, both portals, and seeds demo data. The whole sequence takes about 5–10 minutes on first run.

### Step-by-step alternative

```sh
task demo:cluster-up          # create kind cluster + install Flux, cert-manager, Envoy
task demo:deploy-milo         # deploy Milo control plane
task demo:deploy-auth         # deploy Dex OIDC provider (demo user: demo@datum.net / password)
task dev:build                # build the support container image
task dev:load-image           # load image into the kind cluster
task dev:deploy               # deploy the support API server
task demo:deploy-staff-portal # deploy staff portal
task demo:deploy-cloud-portal # deploy cloud portal
task demo:seed                # create demo tickets and messages
task demo:verify              # run end-to-end checks
task demo:print-urls          # print access URLs
```

---

## Access URLs

| Service | URL |
|---------|-----|
| Staff Portal | https://staff.localhost:30443 |
| Cloud Portal | https://cloud.localhost:30443 |
| Support API | https://localhost:30443/apis/support.miloapis.com/v1alpha1/ |

---

## What the demo shows

### Staff Portal (`staff.localhost`)

Operators and support staff log in via OIDC and see:

- **Ticket list** — all `SupportTicket` resources, filterable by status/priority
- **Ticket detail** — full ticket metadata, status transitions, priority changes
- **Message thread** — all messages including internal staff-only notes (shown with an "internal" badge)
- **Reply form** — staff can post public replies or internal notes

### Cloud Portal (`cloud.localhost`)

Customers log in via OIDC and see only their organization's tickets:

- **Ticket list** — filtered to `spec.organizationRef.name=<their-org>`
- **Create ticket** — title, description, priority selector
- **Message thread** — public messages only (internal staff notes are never exposed)
- **Reply form** — customers can post replies; messages are created with `authorType: customer`

### Support API server

The aggregated API server is registered at `v1alpha1.support.miloapis.com`. Verify it is available:

```sh
kubectl get apiservice v1alpha1.support.miloapis.com
kubectl get supporttickets
kubectl get supportmessages
```

---

## Seed data

`task demo:seed` creates two demo tickets, two messages, a Milo `User` resource for the demo account, a `GroupMembership` linking that user to the support staff group, and an `OrganizationMembership` for `demo-org`:

| Name | Title | Status | Priority |
|------|-------|--------|----------|
| `demo-ticket-001` | Cannot access project dashboard | open | high |
| `demo-ticket-002` | Billing invoice shows incorrect amount | in-progress | medium |

`demo-ticket-001` has one public reply and one internal staff note (the internal note is visible in the Staff Portal, hidden in the Cloud Portal).

The `OrganizationMembership` is required so the Cloud Portal's organization list shows `demo-org` after login.

---

## Useful commands

```sh
# Check cluster health
task demo:verify

# Stream logs from all components
task demo:logs

# Inspect a ticket
kubectl get supportticket demo-ticket-001 -o yaml

# Inspect messages on a ticket
kubectl get supportmessages -o yaml | grep -A5 "ticketRef: demo-ticket-001"

# Tear down everything
task demo:down
```

---

## Architecture notes

### Authentication

The portals use Dex as the OIDC provider. The Dex issuer runs at the in-cluster URL `http://dex.auth-system.svc.cluster.local:5556/oidc/v1` (used for server-side token validation), but the browser is redirected to the Envoy Gateway URL for the authorization endpoint (`https://{staff,cloud}.localhost:30443/oidc/v1/auth`). This is configured via `AUTH_OIDC_AUTHORIZATION_ENDPOINT` in each portal's `.env.demo`.

### DEMO_TOKEN

Both portals inject `DEMO_TOKEN=test-admin-token` as the Bearer token for all Milo and Support API calls. The demo cluster's Milo API server runs in static-token mode and accepts only two tokens:

| Token | Identity |
|-------|----------|
| `test-admin-token` | `system:masters` |
| `test-user-token` | `system:authenticated` |

Dex access tokens are not accepted by the Milo API server in demo mode; the DEMO_TOKEN is the workaround.

### Support API RBAC

The support API server does not issue tokens in demo mode — all requests arrive as `system:unauthenticated`. The seed step grants `system:unauthenticated` the `support-admin` ClusterRole so both portals can read and write `SupportTicket` and `SupportMessage` resources without authentication errors.

---

## Troubleshooting

**Portal login fails / OIDC error**
- Verify Dex is running: `kubectl get pods -n auth-system`
- Check Dex logs: `kubectl logs deployment/dex -n auth-system`
- Confirm the OIDC issuer in `.env.demo` is the internal cluster URL: `AUTH_OIDC_ISSUER=http://dex.auth-system.svc.cluster.local:5556/oidc/v1`
- Confirm the authorization endpoint override is set to the Envoy Gateway URL: `AUTH_OIDC_AUTHORIZATION_ENDPOINT=https://{staff,cloud}.localhost:30443/oidc/v1/auth`
- Redeploy the portal after changing env files: `task demo:deploy-staff-portal`
- Verify Milo is running: `kubectl get pods -n milo-system`

**`v1alpha1.support.miloapis.com` not Available**
- Check the support API server pod: `kubectl get pods -n support-system`
- View logs: `kubectl logs deployment/support-apiserver -n support-system`
- Ensure cert-manager issued certificates: `kubectl get certificates -n support-system`

**Portal image pull errors**
- The demo overlay uses `ghcr.io/datum-cloud/{staff,cloud}-portal:demo` with `IfNotPresent`.
  If the image is not present in the cluster, load it manually or push a tagged build.

**`kubectl` commands fail with "server not found"**
- The kubeconfig is at `.test-infra/kubeconfig`. Export it: `export KUBECONFIG=.test-infra/kubeconfig`
  or prefix commands with `KUBECONFIG=.test-infra/kubeconfig kubectl ...`
