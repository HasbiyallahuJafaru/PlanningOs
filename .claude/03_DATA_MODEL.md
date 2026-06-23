# 03_DATA_MODEL.md

## MVP schema only (Phase 1) — do not add later-phase tables yet

Every table includes `tenant_id`, `created_at`, `updated_at`. Do not add `deleted_at` soft-delete unless a batch explicitly calls for it — keep MVP schema minimal.

### tenants
- id, name, slug, created_at

### users
- id, tenant_id, email, password_hash (if not using external auth), role, created_at
- role enum: `admin`, `consultant`, `developer` — council roles (`officer`, `enforcement_officer`, `manager`) are added in Phase 3, do not pre-create them now

### projects
- id, tenant_id, name, site_address (text, not spatial yet — GIS deferred), created_by_user_id, status

### documents
- id, tenant_id, project_id, file_key (S3 reference), original_filename, mime_type, uploaded_by_user_id, extraction_status enum (`pending`, `processing`, `complete`, `failed`)

### extracted_fields
- id, tenant_id, document_id, field_name, field_value, confidence_score, source_page_reference, requires_human_review (boolean — true if confidence is low or the field is flagged as high-risk per the Article 22 rule in `05_COMPLIANCE.md`)

### audit_events
- id, tenant_id, actor_user_id (nullable — system-generated events have no actor), event_type, entity_type, entity_id, payload (jsonb), occurred_at
- This table exists from Batch 1, not added later — audit trail must exist before any real data does, per `05_COMPLIANCE.md`

## Deferred tables (do not create until the named phase)
- `policies`, `consultations`, `tasks`, `decisions`, `conditions` — Phase 2/3
- `enforcement_cases`, `appeals` — Phase 3, alongside interop layer
- `milestones` — Phase 4 (build-out monitoring)
- `bng_records`, `habitat_units` — Phase 3 (BNG module)
- Any GIS/spatial columns — no committed phase yet, evaluate when a real need appears

## Retention and FOI note (see 05_COMPLIANCE.md for full detail)
When council/public data is introduced (Phase 3+), every table holding case-related records needs a retention-policy field. Do not add this to MVP tables now — it's premature for dev/consultant-only data — but the schema should not make adding it later structurally painful (avoid hardcoding deletion logic anywhere; keep retention as data, not code, when it's added).
