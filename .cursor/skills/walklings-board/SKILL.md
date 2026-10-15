---
name: walklings-board
description: |
  Use when adding or moving an item on the Walklings Roadmap GitHub Project board (status, owner, priority, target date).
  Ids live in docs/.board-ids.txt; completed work shows as Done with its commit.
---

# Walklings Roadmap board

Board owner: Supervisor (outside agents do not touch it). Project, field and option ids are in the private `docs/.board-ids.txt` (docs repo). Read them from there; do not copy ids into other files.

1. Read `docs/.board-ids.txt` for the project id/number, the Status, Owner, Priority and Target date field ids and option ids.
2. Find the item: `gh project item-list <number> --owner arbiter1170 --format json`.
3. Set a field: `gh project item-edit --project-id <project id> --id <item id> --field-id <field id> --single-select-option-id <option id>` (dates: `--date YYYY-MM-DD`).
4. Completed work: Status Done/Decided, with the commit hash (and build id) in the item body or a comment.
5. Add new items with `gh project item-add` and set Owner and Priority straight away.
