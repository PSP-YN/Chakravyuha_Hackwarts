# Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Marketplace liquidity | High | Narrow cluster; recruit supply and demand before launch |
| Reference price mistaken for offer | High | Separate labels, source, date and unit |
| RLS leaks offers | Critical | Two-user security tests; deny by default |
| Fake/low-quality listings | High | Moderation, reporting and field operations |
| FarmLoop quality mismatch | High | Typed material, moisture, contamination and buyer specs |
| Machinery availability mismatch | High | Provider confirmation; DB conflict control before scheduling |
| Transport vehicle/route mismatch | High | Snapshot route and capacity, confirm before acceptance, cancellation rules and delivery evidence |
| FPO member quantity misattribution | High | Atomic aggregate workflow, unique member allocation and immutable member snapshots |
| Municipality impersonation or stale contact | High | Administrator verification, official source links, district RLS and periodic re-check |
| Municipal service not actually offered | High | Label enquiries as requests, never confirmed pickups; require direct local-body confirmation |
| Storage sensor drift or poor placement | High | Calibration and installation checks; show source and raw readings |
| Storage heuristic false reassurance | Critical | Advisory-only language, no probability/certification claims, field validation and manual inspection |
| Device-key compromise | High | One-time display, hashed storage, revocation and TLS validation |
| Kannada mistranslation | High | Fluent-speaker review and field usability testing |
| Quantity/quality/payment disputes | High | Explicit terms, evidence and dispute process |
| Poor connectivity | Medium | Lightweight UI, retries and form-state preservation |
| OTP delivery failure | Medium | Configure SMTP and monitor delivery |
| Excessive personal data | High | Data minimisation and retention policy |
| Fees hurt adoption | High | Essential farmer access free during pilot |
| Unsupported impact claims | High | Baseline methodology and measurement review |
| Single-operator dependency | Medium | Backups, runbooks and least-privilege access |

## Launch blockers
No broad public pilot before two-account RLS isolation, magic-link delivery, privacy notice, support channel, clear offer/cancellation terms, municipality verification, storage-device key handling, demo/live separation, incident process, retention and account deletion plan, backup/restore drill and physical hardware acceptance.
