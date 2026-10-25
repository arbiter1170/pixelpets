# Walklings / PixelPets org chart

This is the team in [AGENTS.md](../AGENTS.md) ("Team", line 9), with the Contracted Engineer added. Only roles are listed.

```
Vincent (CIO, final say; reviews and merges PRs)
├── PixelPets Supervisor (clears work, runs votes, owns the board)
│   ├── PixelPets Design (specs in the private design/ repo)
│   ├── PixelPets (lead engineer, owns code)
│   ├── PixelPets QA
│   ├── PixelPets Token Engineer
│   └── PixelPets Sprites
└── PixelPets Contracted Engineer (Claude Code, independent outside reviewer; read-only; reports to Vincent for now)
```

- **Vincent (CIO).** Final say. Reviews and merges PRs. Approves red decisions.
- **Supervisor**, reporting to Vincent. Clears work, runs votes, owns the board.
- **Design, PixelPets (lead engineer), QA, Token Engineer and Sprites**, reporting to the Supervisor.
- **Contracted Engineer**, reporting to Vincent. Claude Code, independent of the rest of the team. An outside reviewer, read-only: no commits, pushes, branches, PRs, issues, comments or deploys, and no Firebase or live services. Reports findings to Vincent only.

The `main` copy of this chart is the AGENTS.md "Team" line. It will get the Contracted Engineer through a separate docs PR.
