/**
 * semantic-release configuration.
 *
 * Reliability guarantees (so a published version ALWAYS contains freshly built code):
 *  - `dist/` is rebuilt by the `prepack` npm lifecycle script, which `npm publish`
 *    (invoked by `@semantic-release/npm`) runs automatically right before packing
 *    the tarball. The build can therefore never be skipped, even for a one-line change.
 *  - The Release CI job additionally runs typecheck + tests + build and asserts the
 *    build output exists BEFORE semantic-release runs, so a broken build aborts the
 *    release instead of publishing an empty/stale package.
 *
 * Plugin order matters: changelog + npm (version bump) run in `prepare` before the
 * `git` commit, and `npm`/`github` publish in `publish` after the tag is created.
 *
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ["main"],
  repositoryUrl: "https://github.com/pulgueta/bold-node",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md"
      }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/github",
      {
        assets: [{ path: "dist/**" }]
      }
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        // biome-ignore lint/suspicious/noTemplateCurlyInString: semantic-release interpolates these tokens server-side; they are not JS template literals.
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
};
