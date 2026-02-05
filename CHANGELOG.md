# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-05

### Added

- Initial release of Open Model Selector
- `ModelSelector` component for selecting models from OpenAI-compatible APIs
- `useOpenAIModels` hook for fetching models programmatically
- Support for managed mode (component fetches models) and controlled mode (pass models directly)
- Auto-sorting by name with optional controlled sort order
- Persistent favorites via `localStorage` in uncontrolled mode
- `storageKey` prop for customizing the `localStorage` namespace
- Dark mode support via CSS media queries and `.dark` class
- Full keyboard navigation and accessibility support
- TypeScript types exported for all public APIs
- CSS custom properties for theming (`--oms-*` prefix)
- `SYSTEM_DEFAULT_VALUE` constant for "Use System Default" option

### Changed

- `onChange` prop is now optional (previously required with default value)
- `fetcher` prop no longer requires `useCallback` memoization — the component handles stability internally

### Fixed

- Internal fetcher reference is now stable, preventing infinite re-render loops when using custom fetchers without memoization

[0.1.0]: https://github.com/sethbang/open-model-selector/releases/tag/v0.1.0
