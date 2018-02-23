# Differences between v2 and v3

v3 is currently in beta, mainly because babel v7 is currently in beta.

You can get it via `yarn add bili@next --dev`.

Major differences:

- v3 transpiles JavaScript (`.js`) with Babel v7 (loose mode) instead of Buble by default, Buble is still available though.
- v3 automatically loads plugins for typescript when the filename of entry file ends with `.ts`.
