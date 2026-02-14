# 🌙 ramadan-cal

A beautiful terminal Ramadan 2026 (1447 Hijri) calendar with prayer times, Eid countdown, and daily progress — available as a CLI tool and inside Claude Code.

[**Website**](https://ramadan-cal-site.onrender.com) · [**npm**](https://www.npmjs.com/package/ramadan-cal)

## Install

```bash
npm install -g ramadan-cal
```

## Usage

```bash
ramadan              # Full display: prayer times + calendar + progress
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

During installation, ramadan-cal automatically sets up a Claude Code skill. Just type `ramadan` inside any Claude Code session to see your Ramadan dashboard — prayer times, calendar, and Eid countdown — without leaving your coding flow. Zero tokens used.

If you skipped during install, run `npm rebuild ramadan-cal` to set it up later.

## License

MIT
