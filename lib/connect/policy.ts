/**
 * Vercel Connect product-terms guardrails for the GitHub managed connector.
 *
 * This module centralizes the compliance contract derived from the Vercel
 * Connect product terms (https://vercel.com/docs/connect/legal):
 *  - Third-party actions are performed on the customer's instruction and under
 *    the customer's responsibility.
 *  - Restricted regulated data must not be routed through Connect without
 *    Vercel's prior written approval.
 *  - The customer must have authority + user consent for all requested scopes.
 *  - Disconnecting in-app is not a substitute for revoking access in the
 *    third-party platform (defense in depth).
 *  - Connectors may become unavailable or be removed.
 *
 * NOTE: This is implementation guidance, not legal advice. Production teams
 * should have counsel approve the final consent and policy wording.
 */

export const POLICY_VERSION = "2026-07-20.github-managed.v1"

export const CONNECTOR = {
  id: "github",
  displayName: "GitHub",
  /**
   * Where a real Vercel Managed Connector slug would live. In production this
   * is the configured connector identifier passed to `@vercel/connect`.
   */
  managedConnectorSlug: "github-managed",
  model: "vercel-managed" as const,
  purpose:
    "Read repository metadata and open pull requests on behalf of the authorizing user to automate release notes.",
  platformTermsUrl: "https://docs.github.com/site-policy/github-terms",
  connectTermsUrl: "https://vercel.com/docs/connect/legal",
} as const

/**
 * Least-privilege disclosure of exactly what the connector requests. Keep this
 * list narrow and human-readable so users can give informed consent.
 */
export interface RequestedCapability {
  id: string
  label: string
  description: string
  /** Whether this capability writes/mutates data on the third-party platform. */
  mutates: boolean
}

export const REQUESTED_CAPABILITIES: RequestedCapability[] = [
  {
    id: "repo:read",
    label: "Read repositories",
    description:
      "View repository names, branches, and commit metadata for repositories you authorize.",
    mutates: false,
  },
  {
    id: "pull_requests:write",
    label: "Open pull requests",
    description:
      "Create pull requests on your behalf. You are responsible for every PR opened using this access.",
    mutates: true,
  },
  {
    id: "metadata:read",
    label: "Read account metadata",
    description: "Read your GitHub username and organization membership for display only.",
    mutates: false,
  },
]

/**
 * Regulated data categories that must NOT be routed through Connect without
 * Vercel's prior written approval, per the product terms.
 */
export const RESTRICTED_DATA_CATEGORIES = [
  "Payment card / PCI cardholder data",
  "Protected health information (HIPAA)",
  "Financial non-public personal information (GLBA)",
  "Export-controlled technical data (ITAR / EAR)",
  "Other restricted or specially regulated data",
] as const

/**
 * Required consent acknowledgements. The server validates ALL of these are
 * present before allowing a connection — the UI state is never trusted.
 */
export const CONSENT_REQUIREMENTS = [
  {
    id: "authority",
    label:
      "I am authorized to connect this GitHub account and to grant the capabilities listed above.",
  },
  {
    id: "responsibility",
    label:
      "I understand actions performed through this connector are taken on my instruction and under my responsibility.",
  },
  {
    id: "restricted-data",
    label:
      "I will not submit restricted or regulated data through this connector without Vercel's prior written approval.",
  },
  {
    id: "third-party-terms",
    label:
      "I have reviewed and accept GitHub's applicable developer and platform terms.",
  },
] as const

export type ConsentRequirementId = (typeof CONSENT_REQUIREMENTS)[number]["id"]

export const REQUIRED_CONSENT_IDS: ConsentRequirementId[] =
  CONSENT_REQUIREMENTS.map((requirement) => requirement.id)

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "connect_failed"
  | "connector_unavailable"
  | "disconnecting"
  | "disconnect_failed"

/** Redacted, display-safe representation of a demo connection. */
export interface Connection {
  status: ConnectionStatus
  /** Opaque, non-sensitive demo connection id. Never a token. */
  connectionId: string | null
  /** Display-only handle. Not a credential. */
  accountHandle: string | null
  grantedCapabilityIds: string[]
  connectedAt: string | null
  policyVersion: string
}

export const INITIAL_CONNECTION: Connection = {
  status: "disconnected",
  connectionId: null,
  accountHandle: null,
  grantedCapabilityIds: [],
  connectedAt: null,
  policyVersion: POLICY_VERSION,
}

export interface ConsentSelection {
  authority?: boolean
  responsibility?: boolean
  "restricted-data"?: boolean
  "third-party-terms"?: boolean
}

/**
 * Validate that every required consent acknowledgement is present. This runs
 * on the server so a client cannot bypass consent by manipulating UI state.
 */
export function getMissingConsent(
  selection: ConsentSelection
): ConsentRequirementId[] {
  return REQUIRED_CONSENT_IDS.filter((id) => selection[id] !== true)
}
