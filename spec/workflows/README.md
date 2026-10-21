# workflows

Contains stage and policy workflow documents.

Subfolders:
- `shared/` reusable rules used by all stages
- `intake/` business-spec intake docs
- `lld/` LLD docs
- `decomposition/` task decomposition docs
- `implementation/` implementation docs
- `testing/` unit-testing docs
- `integration-testing/` integration-testing docs — conditionally invoked: only for backend-tagged tasks (`Layer: backend`); frontend-tagged tasks skip this stage and go from the Testing Review Gate straight to Final Validation
- `validation/` final-validation docs
