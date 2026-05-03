#!/usr/bin/env python3
"""Seed demo data: 10 orgs, 50 users, 100 support tickets."""

import json
import random
import ssl
import urllib.request
import urllib.error

MILO_URL = "https://localhost:6443"
SUPPORT_URL = "https://localhost:8844"
TOKEN = "test-admin-token"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def req(method, url, body=None):
    data = json.dumps(body).encode() if body else None
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, context=ctx) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 409:
            return {"_conflict": True}
        raise RuntimeError(f"{method} {url} => {e.code}: {body}")


def exists(url):
    try:
        req("GET", url)
        return True
    except RuntimeError as e:
        if "404" in str(e):
            return False
        raise


# ── Organizations ──────────────────────────────────────────────────────────────

ORGS = [
    ("acme-corp",            "Acme Corporation"),
    ("brightpath-solutions", "BrightPath Solutions"),
    ("meridian-tech",        "Meridian Technologies"),
    ("cascade-analytics",    "Cascade Analytics"),
    ("vertex-systems",       "Vertex Systems"),
    ("harbor-cloud",         "Harbor Cloud"),
    ("pinnacle-io",          "Pinnacle IO"),
    ("ridgeline-software",   "Ridgeline Software"),
    ("northstar-digital",    "Northstar Digital"),
    ("foxhollow-labs",       "Foxhollow Labs"),
]


def create_org(name, display_name):
    url = f"{MILO_URL}/apis/resourcemanager.miloapis.com/v1alpha1/organizations"
    result = req("POST", url, {
        "apiVersion": "resourcemanager.miloapis.com/v1alpha1",
        "kind": "Organization",
        "metadata": {"name": name},
        "spec": {"type": "Standard"},
    })
    if result.get("_conflict"):
        print(f"  org {name}: already exists")
    else:
        print(f"  org {name}: created")


# ── Users ──────────────────────────────────────────────────────────────────────

# 5 users per org, 10 orgs = 50 users
USERS_BY_ORG = {
    "acme-corp": [
        ("james-hartwell",   "James",    "Hartwell",   "james.hartwell@acme-corp.example"),
        ("emma-sutton",      "Emma",     "Sutton",     "emma.sutton@acme-corp.example"),
        ("oliver-crane",     "Oliver",   "Crane",      "oliver.crane@acme-corp.example"),
        ("sophia-morales",   "Sophia",   "Morales",    "sophia.morales@acme-corp.example"),
        ("william-ford",     "William",  "Ford",       "william.ford@acme-corp.example"),
    ],
    "brightpath-solutions": [
        ("ava-chen",         "Ava",      "Chen",       "ava.chen@brightpath.example"),
        ("noah-patel",       "Noah",     "Patel",      "noah.patel@brightpath.example"),
        ("isabella-ross",    "Isabella", "Ross",       "isabella.ross@brightpath.example"),
        ("liam-warner",      "Liam",     "Warner",     "liam.warner@brightpath.example"),
        ("mia-kowalski",     "Mia",      "Kowalski",   "mia.kowalski@brightpath.example"),
    ],
    "meridian-tech": [
        ("benjamin-shaw",    "Benjamin", "Shaw",       "b.shaw@meridian-tech.example"),
        ("charlotte-tran",   "Charlotte","Tran",       "c.tran@meridian-tech.example"),
        ("lucas-osei",       "Lucas",    "Osei",       "l.osei@meridian-tech.example"),
        ("amelia-byrne",     "Amelia",   "Byrne",      "a.byrne@meridian-tech.example"),
        ("mason-lin",        "Mason",    "Lin",        "m.lin@meridian-tech.example"),
    ],
    "cascade-analytics": [
        ("harper-nkosi",     "Harper",   "Nkosi",      "harper@cascade-analytics.example"),
        ("ethan-vasquez",    "Ethan",    "Vasquez",    "ethan@cascade-analytics.example"),
        ("evelyn-price",     "Evelyn",   "Price",      "evelyn@cascade-analytics.example"),
        ("henry-dougherty",  "Henry",    "Dougherty",  "henry@cascade-analytics.example"),
        ("abigail-kim",      "Abigail",  "Kim",        "abigail@cascade-analytics.example"),
    ],
    "vertex-systems": [
        ("alexander-hunt",   "Alexander","Hunt",       "alex.hunt@vertex-systems.example"),
        ("emily-santos",     "Emily",    "Santos",     "emily.santos@vertex-systems.example"),
        ("michael-porter",   "Michael",  "Porter",     "michael.porter@vertex-systems.example"),
        ("elizabeth-reed",   "Elizabeth","Reed",       "e.reed@vertex-systems.example"),
        ("daniel-berg",      "Daniel",   "Berg",       "d.berg@vertex-systems.example"),
    ],
    "harbor-cloud": [
        ("matthew-quinn",    "Matthew",  "Quinn",      "m.quinn@harbor-cloud.example"),
        ("avery-hoffman",    "Avery",    "Hoffman",    "a.hoffman@harbor-cloud.example"),
        ("jackson-mills",    "Jackson",  "Mills",      "j.mills@harbor-cloud.example"),
        ("ella-thornton",    "Ella",     "Thornton",   "e.thornton@harbor-cloud.example"),
        ("sebastian-holt",   "Sebastian","Holt",       "s.holt@harbor-cloud.example"),
    ],
    "pinnacle-io": [
        ("scarlett-novak",   "Scarlett", "Novak",      "s.novak@pinnacle.io.example"),
        ("aiden-walsh",      "Aiden",    "Walsh",      "a.walsh@pinnacle.io.example"),
        ("victoria-lane",    "Victoria", "Lane",       "v.lane@pinnacle.io.example"),
        ("jack-obrien",      "Jack",     "O'Brien",    "jack.obrien@pinnacle.io.example"),
        ("madison-frost",    "Madison",  "Frost",      "m.frost@pinnacle.io.example"),
    ],
    "ridgeline-software": [
        ("owen-callahan",    "Owen",     "Callahan",   "o.callahan@ridgeline.example"),
        ("luna-espinoza",    "Luna",     "Espinoza",   "l.espinoza@ridgeline.example"),
        ("samuel-west",      "Samuel",   "West",       "s.west@ridgeline.example"),
        ("grace-mackenzie",  "Grace",    "MacKenzie",  "g.mackenzie@ridgeline.example"),
        ("david-yuen",       "David",    "Yuen",       "d.yuen@ridgeline.example"),
    ],
    "northstar-digital": [
        ("chloe-ingram",     "Chloe",    "Ingram",     "c.ingram@northstar.example"),
        ("joseph-brennan",   "Joseph",   "Brennan",    "j.brennan@northstar.example"),
        ("penelope-cross",   "Penelope", "Cross",      "p.cross@northstar.example"),
        ("carter-wolfe",     "Carter",   "Wolfe",      "c.wolfe@northstar.example"),
        ("riley-snow",       "Riley",    "Snow",       "r.snow@northstar.example"),
    ],
    "foxhollow-labs": [
        ("wyatt-ellison",    "Wyatt",    "Ellison",    "w.ellison@foxhollow.example"),
        ("zoey-garner",      "Zoey",     "Garner",     "z.garner@foxhollow.example"),
        ("john-blackwood",   "John",     "Blackwood",  "j.blackwood@foxhollow.example"),
        ("nora-sterling",    "Nora",     "Sterling",   "n.sterling@foxhollow.example"),
        ("aiden-cross",      "Aiden",    "Cross",      "a.cross@foxhollow.example"),
    ],
}


def create_user(name, given, family, email):
    url = f"{MILO_URL}/apis/iam.miloapis.com/v1alpha1/users"
    result = req("POST", url, {
        "apiVersion": "iam.miloapis.com/v1alpha1",
        "kind": "User",
        "metadata": {"name": name},
        "spec": {"givenName": given, "familyName": family, "email": email},
    })
    if result.get("_conflict"):
        print(f"    user {name}: already exists")
    else:
        print(f"    user {name}: created")


# ── Support Tickets ────────────────────────────────────────────────────────────

STATUSES = ["open", "open", "open", "in-progress", "in-progress",
            "waiting-on-customer", "resolved", "closed"]
PRIORITIES = ["low", "low", "medium", "medium", "medium", "high", "high", "urgent"]

TICKET_TEMPLATES = [
    # (title, description, tags)
    (
        "Cannot access project dashboard",
        "Getting 403 Forbidden errors when navigating to the project dashboard after updating organization settings.\n\nSteps to reproduce:\n1. Log in\n2. Navigate to any project\n3. Observe 403 error",
        ["access", "dashboard"],
    ),
    (
        "Billing invoice shows incorrect amount",
        "Our latest invoice shows charges for resources we deprovisioned three weeks ago. The amounts do not match our usage dashboard.",
        ["billing", "invoice"],
    ),
    (
        "DNS records not propagating",
        "We created new DNS records 48 hours ago but they haven't resolved externally yet. Other records in the same zone are working fine.",
        ["dns", "networking"],
    ),
    (
        "Edge deployment stuck in Pending",
        "Deployed a new edge configuration yesterday and it has been stuck in `Pending` state ever since. No error messages visible in the UI.",
        ["edge", "deployment"],
    ),
    (
        "API rate limits too restrictive for our workload",
        "Our integration is hitting rate limits during peak hours. We need to understand the current limits and whether a higher quota is available.",
        ["api", "quota"],
    ),
    (
        "SSO login failing for new employees",
        "New hires added to our IdP this week cannot authenticate. Existing users are unaffected. SAML assertions look correct on our end.",
        ["auth", "sso"],
    ),
    (
        "Export policy not triggering on schedule",
        "Our hourly export policy hasn't run since the maintenance window on Sunday. Manual triggers work fine.",
        ["export", "automation"],
    ),
    (
        "Project quota usage data is stale",
        "The quota usage page shows data from over 12 hours ago. Other dashboards are refreshing normally.",
        ["quota", "observability"],
    ),
    (
        "Cannot invite team members to organization",
        "When we try to send invitations, we get a generic error: 'Invitation failed'. Email addresses are valid and not already members.",
        ["org", "invitations"],
    ),
    (
        "Secret rotation broke application connectivity",
        "After rotating our API secret via the portal, our application started receiving 401 errors even after updating the secret in our config.",
        ["secrets", "auth"],
    ),
    (
        "Audit logs missing for a 2-hour window",
        "We're doing a compliance review and noticed audit logs are absent between 02:00 and 04:00 UTC on the 28th. All other days appear complete.",
        ["audit", "compliance"],
    ),
    (
        "Organization member cannot see shared project",
        "A colleague with Editor role on our organization cannot view a project that other editors can access. Permissions look correct.",
        ["access", "permissions"],
    ),
    (
        "Slow response times on control plane API",
        "Over the past 3 days we've seen p99 latency spike to 8–12 seconds on list operations. Our integration has strict SLA requirements.",
        ["performance", "api"],
    ),
    (
        "TLS certificate expiry warning",
        "We received an automated warning that a TLS certificate managed through your platform expires in 14 days, but renewal isn't triggering automatically.",
        ["tls", "certificates"],
    ),
    (
        "Webhook delivery failures",
        "Webhooks configured for our organization have been failing with 502 errors since Friday. The endpoint is healthy and accepting requests.",
        ["webhooks", "integration"],
    ),
    (
        "Request to increase storage quota",
        "Our current storage quota of 500 GB is nearly exhausted. We need an increase to at least 2 TB to support an upcoming data migration.",
        ["quota", "storage"],
    ),
    (
        "Project deletion not completing",
        "Submitted a project deletion request 18 hours ago. The project still appears in our list with status 'Terminating'.",
        ["projects", "lifecycle"],
    ),
    (
        "Cannot download usage report",
        "Clicking 'Export CSV' on the usage report page results in a blank download. This worked last month.",
        ["billing", "reporting"],
    ),
    (
        "Two-factor authentication locked out",
        "One of our admins lost access to their 2FA device and cannot log in. We need help with recovery.",
        ["auth", "mfa"],
    ),
    (
        "Documentation links returning 404",
        "Several links in your in-app help panels lead to 404 pages. Specifically the ones under the 'Edge Configuration' section.",
        ["documentation"],
    ),
    (
        "Data residency question for EU compliance",
        "We are expanding to EU markets and need written confirmation of data residency options and which regions qualify for GDPR compliance.",
        ["compliance", "data-residency"],
    ),
    (
        "Grafana integration stopped receiving metrics",
        "Our Grafana instance connected via the observability export stopped receiving new data points yesterday at 14:30 UTC.",
        ["observability", "integration"],
    ),
    (
        "Service account permissions not taking effect",
        "We updated a service account's roles two hours ago. The changes show in the portal but API calls still return permission errors.",
        ["iam", "service-accounts"],
    ),
    (
        "Unexpected charge on last statement",
        "There is a line item for 'Premium Support' on our last invoice that we did not subscribe to. Requesting removal and credit.",
        ["billing", "dispute"],
    ),
    (
        "How to migrate projects between organizations",
        "We are restructuring our company and need to move several projects from one organization to another. What is the recommended process?",
        ["migration", "projects"],
    ),
]

random.seed(42)


def ticket_name(n):
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    suffix = "".join(random.choices(chars, k=6))
    return f"ticket-{suffix}-{n:03d}"


def create_ticket(n, org_name, user_name, display_name, email):
    tmpl = TICKET_TEMPLATES[n % len(TICKET_TEMPLATES)]
    title = tmpl[0]
    description = tmpl[1]
    tags = tmpl[2]

    # Vary the title slightly so tickets aren't identical
    suffixes = ["", " (follow-up)", " - urgent", " - escalated", ""]
    title = title + suffixes[n % len(suffixes)]

    status = random.choice(STATUSES)
    priority = random.choice(PRIORITIES)
    name = ticket_name(n)

    url = f"{SUPPORT_URL}/apis/support.miloapis.com/v1alpha1/supporttickets"
    result = req("POST", url, {
        "apiVersion": "support.miloapis.com/v1alpha1",
        "kind": "SupportTicket",
        "metadata": {"name": name},
        "spec": {
            "title": title,
            "description": description,
            "status": status,
            "priority": priority,
            "visibility": "all-staff",
            "tags": tags,
            "reporterRef": {
                "name": user_name,
                "displayName": display_name,
                "email": email,
            },
            "organizationRef": {
                "kind": "Organization",
                "name": org_name,
            },
        },
    })
    if result.get("_conflict"):
        print(f"    ticket {name}: already exists")
    else:
        print(f"    ticket {name} ({org_name} / {display_name}): {status}/{priority}")


def main():
    print("=== Creating organizations ===")
    for org_name, display_name in ORGS:
        create_org(org_name, display_name)

    print("\n=== Creating users ===")
    all_users = []  # list of (org_name, user_name, display_name, email)
    for org_name, users in USERS_BY_ORG.items():
        print(f"  {org_name}:")
        for user_name, given, family, email in users:
            create_user(user_name, given, family, email)
            all_users.append((org_name, user_name, f"{given} {family}", email))

    print(f"\n=== Creating 100 support tickets ===")
    random.shuffle(all_users)
    for i in range(100):
        # cycle through users, allow repeats
        org_name, user_name, display_name, email = all_users[i % len(all_users)]
        create_ticket(i, org_name, user_name, display_name, email)

    print("\nDone.")


if __name__ == "__main__":
    main()
