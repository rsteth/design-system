// App-owned scenarios. Regions retain the actual production DOM and handlers.
export const coverage = {
  "reader-controls": {
    "title": "Reading controls",
    "section": "components",
    "region": "reader",
    "states": [
      "filled text",
      "pace",
      "voice selection",
      "preflight"
    ]
  },
  "reader-empty": {
    "title": "Empty reader controls",
    "section": "components",
    "region": "reader",
    "states": [
      "empty",
      "disabled generate"
    ]
  },
  "reader-long": {
    "title": "Long reader content",
    "section": "components",
    "region": "reader",
    "states": [
      "long text",
      "character count"
    ]
  },
  "reader-preflight-pending": {
    "title": "Estimate pending",
    "section": "components",
    "region": "reader",
    "states": [
      "checking estimate",
      "disabled generate"
    ]
  },
  "reader-preflight-error": {
    "title": "Estimate unavailable",
    "section": "components",
    "region": "reader",
    "states": [
      "estimate error",
      "disabled generate"
    ]
  },
  "hosted-allowance": {
    "title": "Hosted allowance and consent",
    "section": "patterns",
    "region": "reader",
    "states": [
      "remaining allowance",
      "consent reset"
    ]
  },
  "job-queued": {
    "title": "Queued listen card",
    "section": "components",
    "region": "jobs",
    "states": [
      "queued",
      "cancel"
    ]
  },
  "job-running": {
    "title": "Running listen card",
    "section": "components",
    "region": "jobs",
    "states": [
      "running",
      "cancel"
    ]
  },
  "job-completed": {
    "title": "Completed listen card",
    "section": "components",
    "region": "jobs",
    "states": [
      "completed",
      "playback",
      "metadata",
      "delete"
    ]
  },
  "job-cancelled": {
    "title": "Cancelled listen card",
    "section": "components",
    "region": "jobs",
    "states": [
      "cancelled",
      "retry"
    ]
  },
  "job-failed": {
    "title": "Failed listen card",
    "section": "components",
    "region": "jobs",
    "states": [
      "failed",
      "retry"
    ]
  },
  "job-blocked": {
    "title": "Blocked retry card",
    "section": "components",
    "region": "jobs",
    "states": [
      "failed",
      "retry blocked"
    ]
  },
  "job-hosted": {
    "title": "Hosted narration card",
    "section": "components",
    "region": "jobs",
    "states": [
      "completed",
      "provider disclosure",
      "reserved estimate"
    ]
  },
  "studio-mixed": {
    "title": "Mixed saved listens",
    "section": "screens",
    "region": null,
    "states": [
      "queued",
      "running",
      "completed",
      "failed",
      "cancelled"
    ]
  },
  "recording-form": {
    "title": "Recording form",
    "section": "components",
    "region": "voice",
    "states": [
      "file selection",
      "permissions",
      "synthetic save"
    ]
  },
  "recording-error": {
    "title": "Recording validation error",
    "section": "patterns",
    "region": "voice",
    "states": [
      "invalid recording",
      "retry"
    ]
  },
  "recording-saving": {
    "title": "Recording save pending",
    "section": "patterns",
    "region": "voice",
    "states": [
      "saving",
      "disabled save"
    ]
  },
  "voice-deleted": {
    "title": "Deleted original recording",
    "section": "components",
    "region": "voice",
    "states": [
      "sample deleted",
      "profile deletion"
    ]
  },
  "hosted-create": {
    "title": "Hosted voice creation consent",
    "section": "patterns",
    "region": "voice",
    "states": [
      "rights consent",
      "single speaker",
      "provider consent",
      "synthetic creation"
    ]
  },
  "hosted-pending": {
    "title": "Hosted voice awaiting verification",
    "section": "components",
    "region": "voice",
    "states": [
      "pending",
      "verify",
      "provider deletion"
    ]
  },
  "hosted-ready": {
    "title": "Hosted voice ready",
    "section": "components",
    "region": "voice",
    "states": [
      "ready",
      "narration allowance disabled"
    ]
  },
  "hosted-failed": {
    "title": "Hosted voice verification failed",
    "section": "components",
    "region": "voice",
    "states": [
      "failed",
      "verify"
    ]
  },
  "hosted-uncertain": {
    "title": "Uncertain voice creation",
    "section": "patterns",
    "region": "voice",
    "states": [
      "needs review",
      "no duplicate creation"
    ]
  },
  "account-unavailable": {
    "title": "Account loading failure",
    "section": "screens",
    "region": null,
    "states": [
      "account error",
      "retry"
    ]
  },
  "account-expired": {
    "title": "Expired session",
    "section": "screens",
    "region": null,
    "states": [
      "expired session",
      "studio locked"
    ]
  },
  "account-denied": {
    "title": "Login failure",
    "section": "screens",
    "region": null,
    "states": [
      "login denied"
    ]
  },
  "studio-offline": {
    "title": "Studio connection lost",
    "section": "screens",
    "region": null,
    "states": [
      "connection lost"
    ]
  },
  "waitlist-unavailable": {
    "title": "Unavailable waiting list",
    "section": "patterns",
    "region": null,
    "states": [
      "unavailable",
      "retry",
      "close reopen"
    ]
  },
  "waitlist-preparing": {
    "title": "Waiting list preparing",
    "section": "patterns",
    "region": null,
    "states": [
      "preparing",
      "cancel reopen"
    ]
  },
  "waitlist-saving": {
    "title": "Waiting list submission pending",
    "section": "patterns",
    "region": null,
    "states": [
      "submit pending",
      "close reopen"
    ]
  },
  "waitlist-error": {
    "title": "Waiting list submission failure",
    "section": "patterns",
    "region": null,
    "states": [
      "submission error",
      "retry"
    ]
  }
};
export const signedOutFixture = id => ["landing", "waitlist", "account-unavailable", "account-expired", "account-denied"].includes(id) || id.startsWith("waitlist-");
