# 🌙 ramadan-cal

A beautiful terminal Ramadan calendar with prayer times, daily progress, and Hijri date tracking.

## Install

```bash
npm install -g ramadan-cal
```

## Usage

```bash
ramadan              # Full display: prayer times + calendar
ramadan times        # Prayer times only
ramadan calendar     # Calendar only
ramadan check        # Check prayer times for any city
ramadan eid 2026-03-19  # Set the Eid date when announced
ramadan reset        # Clear config and start fresh
```

## Setup

First run auto-detects your location and asks one question — when the moon was sighted. That's it.

Prayer times are calculated offline using the [adhan](https://github.com/batoulapps/adhan-js) library. No API calls needed after setup.

## Claude Code

During installation you'll be asked if you want to set up Claude Code integration. If enabled, type `ramadan` inside any Claude Code session to see your calendar — zero tokens used.

If you skipped during install, run `npm rebuild ramadan-cal` to set it up later.

## License

MIT
