# Inline Third-Party Modules

By default Bili inlines all 3rd-party modules in `umd` and `iife` format into your bundle, however you can use [`inline`](/options#inline) option to toggle this.

```bash
# Don't inline modules in UMD format
bili --format umd --no-inline
```
