# Changelog

## v1.3.0 beta

- Replaced the single Barchart upload with separate **Stocks CSV**, **ETFs CSV**, and optional **Mixed / Auto CSV** lanes.
- Dedicated Stocks/ETF uploads now force the correct asset type at ingestion, so classification no longer depends on a finite ticker list.
- Removed the dangerous `unknown => STOCK` fallback. Unverified symbols are now `UNKNOWN` and are excluded from both the Stocks and ETF tabs until verified.
- Added classification provenance: `UPLOAD`, `CSV`, `REGISTRY`, `UNVERIFIED`, or conflict states.
- Added batch/file identity to canonical trades and the Classification Inspector.
- Active Stocks + ETF batches are merged for deterministic scoring and cross-confirmation while retaining their separate asset types.
- Added conflict protection when the same ticker is forced into contradictory asset classes across uploads.
- Expanded the ETF registry with IGV, BSOL, ETHA, CIBR, HACK, SKYY, CLOU, BOTZ, AIQ, KRE, KBE, VNQ, JETS, TAN, ICLN, RSP, SCHD, JEPI and JEPQ.
- Added asset-classification counts, source breakdown and unknown tickers to Data Audit.
- Added an Unknown / unverified filter to Flow Intelligence.
- Added asset classification smoke tests.

## v1.2.2 beta

- Replaced prompt-only JSON with provider-native JSON Schema structured outputs for Claude and OpenAI.
- Fixed Claude Sonnet 5 empty-response failure caused by adaptive thinking exhausting a small `max_tokens` budget.
- Claude defaults to `ANTHROPIC_EFFORT=low` and a 4096 output-token cap for analyst/synthesis calls.
- GPT-5.6 defaults to `reasoning.effort=none` for the structured skeptic role unless overridden.
- Added clearer provider/model diagnostics and `/api/ai/status` without exposing secrets.
- Updated both normal flow AI and Big Move AI pipelines.

## v1.2.1 beta

- Added **Natural Gas macro monitor** to the Big Move page.
- On Twelve Data Basic/free, the monitor uses **UNG as an explicitly labelled ETF proxy** because direct commodity market-data access can require a higher plan. It never presents the proxy as the spot/futures natural-gas price.
- Added optional `NATURAL_GAS_SYMBOL` environment variable for direct commodity series when the configured Twelve Data plan supports it.
- Added 5d/20d/63d trend, MA context and deterministic RISING/FALLING/MIXED regime label.
- Natural-gas context is passed into the Big Move Analyst/Skeptic/Synthesizer packet but is **context only** and does not alter the deterministic Setup Score in this version.
- Natural-gas refresh is manual to protect Twelve Data API credits.

## v1.2.0 beta

- Added **🚀 Big Move Detector** as a first-class navigation area.
- Added a curated leveraged-ETF research universe with a free-plan-safe selector (default maximum 8 symbols per manual scan).
- Added Twelve Data daily-history endpoint with server-side cache; no background polling.
- Added split-aware historical location metrics: history-window low/high, 52-week low/high, drawdowns, 5d/20d/63d/126d returns, 20/50/200-day moving averages and realized-volatility context.
- Added deterministic Big Move Setup Score: 50% price location + 30% early reversal evidence + 20% options-flow confirmation. It is explicitly **not** a probability of profit.
- Added direct/peer Barchart options-flow confirmation when the relevant ETF/sector symbols exist in the uploaded CSV. Missing flow remains neutral instead of being treated as confirmation.
- Added statuses: EARLY REVERSAL, DEEP DRAWDOWN, WATCH and NO SETUP.
- Added previous-scan tracking via localStorage, including change in Setup Score and manual scan history.
- Added prior-high gap as context with explicit “not a target” labeling.
- Added manual Big Move AI pipeline: Claude Analyst → OpenAI adversarial Skeptic → Claude Synthesizer. AI cannot change the deterministic ranking or create target prices/expected multiples.
- Added leveraged-ETF risk warnings covering daily reset, path dependency, volatility drag and the risk of permanent capital loss.
- Added future database schema for Big Move scan/candidate snapshots.

## v1.1.0 beta

- Added real application navigation: Dashboard, Flow Intelligence, Stocks, ETFs, Watchlist and Data Audit.
- Added browser history routing, so ticker pages can use the browser Back button and an explicit Back control.
- Added local browser watchlist with add/remove controls.
- Added ranked signal explorer with filters for asset type, bias, minimum Confidence, minimum Coverage and minimum absolute Smart Money Score; sorting by Signal Quality, Confidence, Coverage, Score or premium.
- Added Signal Quality ranking and an AI-ready flag. AI is never called automatically; weak signals are skipped by default and can be manually forced.
- Expanded ETF recognition, including KWEB, GLD, TLT, EWY, EWZ, IBIT and other common ETFs that were previously at risk of being labelled as stocks.
- Rebuilt the CSV parser around header aliases and case-insensitive mapping.
- Added CSV Data Audit showing detected headers, missing mappings and premium-weighted field coverage.
- Missing DTE is no longer silently treated as 0DTE. Real 0DTE remains included.
- Duplicate removal is now conservative: without a provider trade ID or timestamp, identical-looking rows are not discarded.
- Multi-leg grouping now requires timestamp + size and is explicitly labelled probable/ambiguous.
- Closing trades (BTC/STC) are directionally informative but heavily downweighted versus new opening risk.
- UNKNOWN position effect is never silently promoted to BTO/STO.
- Expanded the AI packet from 12 top rows to aggregate flow breakdowns, data-quality metrics, concentration, DTE buckets, up to 24 top evidence rows, unusual evidence and probable multi-leg summaries.
- AI roles are now explicit: Claude = Analyst, OpenAI = adversarial Skeptic, Claude = final Editor/Synthesizer. Final AI output cannot replace deterministic bias/confidence.
- Added advanced Analyst vs Skeptic review panel and expanded Classification Inspector.

## v1.0.1 beta

- API errors always return JSON instead of Express HTML error pages.
- More defensive parsing of Claude/OpenAI output.
- AI analysis can fall back to one provider if the other fails.
