# Release Process

## Release readiness

- All milestone acceptance criteria are met.
- CI passes on the release commit.
- Database migrations are reviewed and tested.
- Security and privacy review is complete for changed surfaces.
- Changelog and known limitations are updated.
- Desktop packages are tested on supported operating systems.
- Backup/restore and rollback/forward-fix plans are known.
- Support and incident contact details are published.

## Versioning

Use Semantic Versioning after the project establishes its first public API and release policy:

- MAJOR for incompatible public API or data-contract changes.
- MINOR for backward-compatible features.
- PATCH for backward-compatible fixes.

Pre-1.0 versions may change more rapidly, but breaking changes still require release notes and migration guidance.

## Release artifacts

- Versioned desktop installers/checksums.
- API/worker deployment image or artifact.
- Migration notes.
- Changelog.
- Updated OpenAPI contract.
- Security advisories where applicable.

## Rollback

Do not assume database rollback is safe. Prefer forward fixes for destructive or data-transforming migrations. Every release with a migration must document compatibility and recovery steps.
