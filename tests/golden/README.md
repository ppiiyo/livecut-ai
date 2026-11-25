# livecut-en

Automated 24/7 livestream-to-short-clip pipeline based on [Teodorox/livecut-ai](https://github.com/Teodorox/livecut-ai) (requires Python >= 3.12).

- **Channels**: IShowSpeed / TheBurntPeanut / Kai Cenat / CaseOh
- **Target format**: 9:16 Vertical · Subtitle style: `karaoke`
- **Fixed tags**: `[streamer]`, `gta6`, `gta`, `fyp`, `shorts`
- **Claude model**: configurable via `CLAUDE_MODEL` in `.env` (default: `claude-opus-5-5`, ~$0.04 opus / ~$0.02 sonnet per analysis)

Russian setup guide: [SETUP_RU.md](SETUP_RU.md).
Check upstream license before making a fork public; keep the repository private if no license is present.
