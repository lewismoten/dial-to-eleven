# Dial to Eleven

> **A browser-based loudness incident for people who know ten is merely where the other knobs stop.**

Load an audio file, click a number or turn the rotary dial by dragging/arrow keys, and subject it to increasing amounts of gain, compression, saturation, and high-mid bite. **Zero is silent. Eleven is deliberately a cliff beyond ten**: much more preamp gain and wave-shaping. White and colored bulbs along the amp's top frame blink and sweep their beams down the cabinet. While a track plays at eleven, the text and cabinet jolt in different directions from *live audio samples*, the speaker cones throb, occasional blur and fake smoke roll in, and the badge issues increasingly unhelpful warnings (unless you prefer reduced motion). It runs on your machine, in your browser, and does not ship your precious riffs off to a server in a tiny black van.

## What the knob does

| Dial | Officially irresponsible technical behavior |
| --- | --- |
| 0 | Nothing. Actual silence. The drummer can have a moment. |
| 1–5 | More gain, more density, a little edge around the moustache. |
| 6–10 | Compression starts leaning on the doorbell and distortion answers it. |
| 11 | A huge jump in preamp gain and saturation, extra compression, shaking lettering, and an amp that has clearly lost the plot. |

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
