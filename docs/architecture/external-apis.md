# External APIs

This section documents all third-party services and external APIs the system integrates with.

## None (Fully Offline)

**Rationale:** Per NFR3 (Self-hosted) and NFR4 (Simple security), this system has **zero external dependencies** for core functionality:

- **No OAuth providers** - Custom JWT authentication only
- **No cloud AI APIs** - Transformers.js runs locally
- **No analytics** - Privacy-focused, no tracking
- **No CDNs** - All assets self-hosted
- **No email services** - Future feature, not MVP

**Future Considerations:**
If external integrations are added in v2.0+, consider:
1. **Email service** (Resend, SendGrid) - Password reset, notifications
2. **Object storage** (S3, MinIO) - File attachments for notes
3. **Monitoring** (Sentry, Axiom) - Error tracking (opt-in only)

---

