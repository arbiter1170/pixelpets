---
name: walklings-key-collision-check
description: >-
  Use on any Walklings PR that adds character looks, skins or palette keys, to
  catch the same key defined in two files.
---
# Walklings key collision check

Data files load in order, so a look key defined twice silently replaces the earlier one. For example, the RegenX looks once took over three existing NPCs.

1. Make sure a static spec exists (for example in `tests/data_integrity`). It collects every look, skin and palette key across `sprites.js`, `data/*.json` and any overlays.
2. It fails when a key is defined in more than one place with different values, and names both files.
3. New looks get a namespaced key (e.g. `rx_nia`), never a bare first name.
4. Run it as part of `walklings-cloud-review-merge` step 2. If it's missing, add it in the next fix PR.
