# Private Beta v1

- New Railway-ready React/Express architecture; original app preserved under `legacy/`.
- Manual Barchart CSV workflow retained.
- 0DTE bug fixed: DTE 0 is included.
- Explicit BTO/STO/BTC/STC-aware direction and opening/closing treatment.
- Exact duplicate removal from scoring.
- Probabilistic multi-leg grouping (vertical, straddle, strangle, calendar/roll, complex) when timestamps are available.
- Smart Money Score separated from Confidence and Coverage.
- Gamma shown as context/proxy, not true dealer GEX.
- Common stock + ETF engine with metadata for inverse/leveraged ETFs.
- Cross-confirmation from related ETFs only when they exist in the same upload.
- Twelve Data price refresh moved server-side.
- Anthropic primary opinion + OpenAI adversarial second opinion + Anthropic final synthesis, with graceful fallback.
- EL/EN language toggle and Simple/Advanced modes.
- Signals / Trade Plan / Risk beginner-oriented product layer.
- Classification Inspector for forensic testing.
- Basic Auth for private beta.
