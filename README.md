# Dial to Eleven

> **A browser-based loudness incident for people who know ten is merely where the other knobs stop.**

Load an audio file, twist the sacred dial, and subject it to increasing amounts of gain, compression, saturation, and high-mid bite. It runs on your machine, in your browser, and does not ship your precious riffs off to a server in a tiny black van.

## What the knob does

| Dial | Officially irresponsible technical behavior |
| --- | --- |
| 0 | Civilized-ish. Your parents may remain in the room. |
| 1–5 | More gain, more density, a little edge around the moustache. |
| 6–10 | Compression starts leaning on the doorbell and distortion answers it. |
| 11 | Gain, saturation, and limiter pressure in a tasteful-yet-questionable wall of sound. |

It is not a magic way to make speakers exceed their physical limit. It is a deliberately aggressive *perceived loudness* effect, which means dynamic range gets squeezed and the waveform gets rougher. That is the point. Mostly.

## Run it

This is an intentionally dependency-free static site.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` and load an audio file. Or open `index.html` directly in a modern browser if it permits local module loading.

## Safety, because the road crew asked

- Start with your hardware volume low.
- The effect can produce abrupt, dense output—particularly at **11**.
- Try not to discover feedback at a volume that involves insurance paperwork.

## Legal-ish amplification

This is an unofficial fan project and is not affiliated with, endorsed by, or approved by Spinal Tap, its creators, or their rights holders. The code is MIT-licensed; see [LICENSE](LICENSE). The joke is free. The hearing damage is not.
