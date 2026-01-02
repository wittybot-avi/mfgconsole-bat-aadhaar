export const generateSettingsSpec = () => {
  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    environment: "production",
    schema: {
      profile: {
        fields: [
          { name: "orgName", type: "string", required: true },
          { name: "taxId", type: "string", required: false },
          { name: "jurisdiction", type: "enum", options: ["India", "EU", "US"] }
        ]
      },
      users: {
        iamProvider: "OAuth2 / OIDC",
        roleMapping: "Cluster-based",
        endpoints: ["GET /api/users", "POST /api/users", "PATCH /api/users/:id"]
      },
      integrations: {
        webhooks: {
          signatureHeader: "X-Aayatana-Signature",
          retryPolicy: "Exponential backoff",
          maxRetries: 5
        },
        apiKeys: {
          scopes: ["ingest", "read", "admin"],
          rotationIntervalDays: 90
        }
      },
      notifications: {
        channels: ["email", "webhook", "sms"],
        events: [
          "custody.sla_breach",
          "warranty.created",
          "eol.failure_spike",
          "compliance.finding_opened"
        ]
      }
    }
  };
};