# Smart Flow Intelligence — Private Beta v1.4.0

Railway-ready private beta for testing a deterministic Barchart options-flow intelligence engine before SaaS productization.

## What this beta is for

The goal is to compare a measurable deterministic engine with the legacy flow logic using the same Barchart CSV exports. The product intentionally keeps Barchart ingestion manual during beta so work can focus on classification quality, scoring and validation rather than provider automation.

Core outputs per ticker:

- Bias: BULLISH / BEARISH / MIXED
- Smart Money Score: -100 to +100
- Confidence: evidence-quality score, **not** probability of profit
- Coverage: share of premium that can be directionally classified
- Signal Quality: ranking metric combining Confidence, Coverage and |Score|
- Gamma context proxy
- Sector/index confirmation when peers exist in the same CSV
- Legacy benchmark

## Application areas

- **Dashboard** — best deterministic signals and summary metrics
- **Flow Intelligence** — ranked/filterable universe
- **📊 Intraday Report** — dataset-level thesis, divergence, large-premium blocks, cross-confirmation and dual-AI synthesis
- **Stocks** — stock-only flow view
- **ETFs** — ETF-only flow view
- **🚀 Big Move Detector** — manual leveraged-ETF reversal scanner using Twelve Data history + optional Barchart flow confirmation
- **Watchlist** — locally persisted private-beta watchlist
- **Data Audit** — exact CSV headers, detected mappings, missing fields and field coverage
- **Ticker page** — Signals / Trade Plan / Risk + Advanced Classification Inspector

Browser Back/Forward navigation is supported.



## Intraday Report (v1.4.0)

A new **📊 Intraday Report** recreates the useful dataset-level narrative style of the original app without carrying forward unsafe assumptions. It ranks a deterministic Top Signal, separates raw Put Premium Share from directional bearish share, shows price/flow divergence only after a manual Twelve Data refresh, highlights the largest premium blocks, and summarizes peer/inverse/market confirmation.

The report explicitly separates **FACT / INFERENCE / RISK**. It will not claim that 100% puts equals 100% bearish intent, that ASK/BID proves BTO/STO, that MID execution proves institutional intent, that sector-ETF premium can be multiplied into leveraged-ETF exposure, or that an option strike is automatically a price target.

The **Refresh market context** button requests up to 8 Twelve Data quotes per manual refresh to stay compatible with the free-plan workflow. A dataset-level AI pipeline is also available: Claude Analyst → OpenAI Skeptic → Claude Editor. AI receives the deterministic report packet and cannot invent trade levels or change the deterministic top signal.

## Asset separation fix (v1.3.0)

Barchart flow can now be loaded through **three independent upload lanes**:

- **Stocks CSV** — every row in that batch is explicitly classified as `STOCK`.
- **ETFs CSV** — every row in that batch is explicitly classified as `ETF`.
- **Mixed / Auto CSV** — optional compatibility lane. It uses a CSV Asset Type field when present, otherwise the ETF registry. Unknown symbols remain `UNKNOWN`; they are no longer silently labelled as stocks.

The active batches are merged only for shared analysis such as sector/index cross-confirmation. Each trade keeps its batch identity, and Data Audit shows which file and classification source produced each asset type. If the same symbol is forced as both Stock and ETF in different uploads, it becomes `UNKNOWN` with an upload-conflict flag instead of being guessed.

Use `sample-stocks.csv` and `sample-etfs.csv` to test the two dedicated lanes after deployment.

This fixes the previous failure mode where unrecognised ETFs could fall through to `STOCK`. The ETF registry was also expanded to include IGV, BSOL and additional common thematic/sector ETFs.

## AI reliability fix (v1.2.2)

AI responses now use provider-native **Structured Outputs / JSON Schema** for both Claude and OpenAI instead of relying on prompt-only JSON. This removes the common malformed-JSON failure seen in Big Move reviews. Claude calls also use `ANTHROPIC_EFFORT=low` by default with a larger output budget so Sonnet 5 adaptive thinking does not consume the entire response budget before the final JSON. OpenAI GPT-5.6 models default to `reasoning.effort=none` unless overridden, which is appropriate for the structured skeptic role.

A new `GET /api/ai/status` endpoint reports configured model IDs/effort settings without exposing API keys.

## Big Move Detector (v1.2.1)

The new Big Move page is a **high-risk research scanner**, not a return predictor. It looks for leveraged ETF setups with three separate deterministic layers:

1. **Price location (50%)** — distance from the split-adjusted history-window low plus drawdown from the history-window high.
2. **Early reversal evidence (30%)** — short/medium-term returns and 20/50-day moving-average confirmation.
3. **Options-flow confirmation (20%)** — direct ETF flow and related sector/index peers from the currently uploaded Barchart CSV. If no flow is available, the flow component stays neutral rather than pretending confirmation exists.

Outputs include:

- Setup Score (0–100; **not** probability of profit)
- Setup status: `EARLY REVERSAL`, `DEEP DRAWDOWN`, `WATCH`, `NO SETUP`
- Distance from history low and drawdown from history high
- Reversal score
- Barchart flow confirmation when available
- Prior-high gap for context (**not a price target**)
- Change in Setup Score versus the previous manual scan
- Local scan history in the browser
- Manual dual-AI review: Claude Analyst → OpenAI Skeptic → Claude Synthesizer


### Natural Gas macro monitor

The Big Move page also has a manual Natural Gas context refresh. With a Basic/free Twelve Data account the beta defaults to **UNG**, clearly labelled as an ETF proxy rather than the commodity spot/futures price. If your Twelve Data plan supports direct commodity market data, set `NATURAL_GAS_SYMBOL` to the exact supported natural-gas symbol in Railway.

The monitor calculates 5d/20d/63d returns, MA20/MA50/MA200 context and a simple deterministic `RISING`, `FALLING` or `MIXED` regime. In v1.2.1 this indicator is **context only**: it is included in Big Move AI review but does not change the deterministic Setup Score. This prevents us from assigning unvalidated predictive weight before historical calibration.

Natural Gas refresh is manual and separate from the 8-symbol Big Move scan, so on the free plan avoid firing both requests at the exact same moment if you are already using the full per-minute credit allowance.

### Twelve Data free-plan protection

The beta intentionally performs **no background polling**. A Big Move scan only runs when you press Refresh. The server caps a manual scan at `BIG_MOVE_SCAN_LIMIT` symbols (default 8) and caches each symbol's daily history (default 360 minutes). Daily history is requested with up to 5,000 bars. If fewer than the requested maximum are returned, the UI labels the history low as a likely full-history/ATL observation; otherwise it is explicitly called a history-window low.

The historical archetype cards in the UI are concept references supplied during product design. They are **not used in scoring**, and raw nominal historical prices/multiples can be distorted by splits or reverse splits.

## Barchart workflow

1. Download separate **Stocks** and/or **ETFs** Options Flow CSV exports from Barchart when possible.
2. Upload each file in its dedicated lane. Use **Mixed / Auto** only for a genuinely mixed export.
3. Open **Data Audit** first if a score or asset type looks suspicious.
4. Use filters to rank by Confidence, Coverage, |Score| or overall Signal Quality.
5. Open a ticker to inspect deterministic evidence.
6. Refresh price from Twelve Data only when needed.
7. Run AI manually only when interpretation adds value.

### CSV correctness rules added in v1.1

- Real `DTE = 0` rows are included.
- Missing DTE is **not** treated as 0DTE.
- BTO/STO/BTC/STC are considered explicit only if such values are actually present in a mapped field.
- Bid/ask does not magically prove opening/closing status.
- BTC/STC are downweighted because they reduce existing exposure rather than create new opening risk.
- Dedupe is conservative when the export lacks timestamps or trade IDs.
- Multi-leg groups are probabilistic and shown as such.

## AI architecture

AI never calculates or replaces the deterministic score.

1. **Claude — Analyst**
   - What does the flow mean?
   - What is unusual?
   - Plausible institutional interpretation
   - Is the signal coherent?
   - Beginner-friendly English + Greek explanation

2. **OpenAI — Skeptic**
   - Assume the directional story may be wrong
   - Look for hedging
   - Closing activity
   - Spread/multi-leg distortion
   - Mixed sector confirmation
   - Low coverage
   - Weak/missing price confirmation
   - Single-trade concentration
   - Data-quality problems

3. **Claude — Editor/Synthesizer**
   - Receives deterministic packet + Analyst + Skeptic
   - Does **not** rescore
   - Produces final bilingual `Why this matters`, support, risks and beginner explanation

No AI request is automatic. The UI marks stronger signals as `AI READY`. Weak signals are skipped on the first click to avoid unnecessary cost; a manual override remains available for testing.

## Environment variables

Copy `.env.example` values into Railway Variables.

```env
BETA_USER=your_private_username
BETA_PASSWORD=your_private_password

TWELVE_DATA_API_KEY=your_twelve_data_key
BIG_MOVE_SCAN_LIMIT=8
BIG_MOVE_HISTORY_SIZE=5000
BIG_MOVE_CACHE_MINUTES=360

ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=your_claude_model

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=your_openai_model
# optional, if supported by the chosen OpenAI model:
OPENAI_REASONING_EFFORT=low
```

The deterministic engine and CSV upload work without AI keys/models. Twelve Data refresh requires only `TWELVE_DATA_API_KEY`.

## GitHub → Railway

1. Unzip the project.
2. Create a new GitHub repository.
3. Commit the **contents of this folder** to the repo root.
4. In Railway choose **New Project → Deploy from GitHub repo**.
5. Add environment variables in Railway.
6. Railway uses `npm install && npm run build`, then `npm start`.
7. Generate/open the Railway public domain.

The included `railway.json` is already configured for this flow.

## Local development

```bash
npm install
npm run dev
```

Production-style local test:

```bash
npm install
npm run build
npm start
```

## Important interpretation note

This is an educational decision-support beta, not personalized investment advice. Options flow can be hedging, closing activity or part of a complex strategy. Confidence is deliberately defined as **quality of available evidence**, not a guaranteed win rate. Leveraged ETFs reset daily, have path dependency/volatility drag, and can lose capital very rapidly; a deep drawdown is not evidence that a rebound must occur.
