# Smart Flow Intelligence — Private Beta

A separate Railway-ready beta built to test whether a deterministic options-flow intelligence engine improves on the original/legacy logic **before** turning the product into a SaaS.

## Beta workflow

1. Download Options Flow CSV manually from Barchart.
2. Upload the CSV in the app. Parsing/scoring happens in the browser; the raw CSV is not sent to AI.
3. Inspect Legacy vs Smart Engine score, Confidence, Coverage, gamma context, 0DTE inclusion, duplicates and probable multi-leg rows.
4. Press **Refresh price** to fetch the selected ticker from Twelve Data through the server proxy.
5. Press **AI opinions + synthesis**. The server sends only a structured evidence packet to the configured AI engines.

## Intelligence v1

- Includes 0DTE (`dte >= 0`) — fixes the original `dte > 0` exclusion.
- ASK/BID is an aggressor clue, not proof of opening directional intent.
- Explicit BTO/STO/BTC/STC codes take precedence when present.
- Closing activity is down-weighted.
- Exact-row duplicate fingerprints are removed from scoring.
- Probable multi-leg trades are grouped when usable timestamps/sizes are present and are down-weighted.
- Smart Money Score is separate from Confidence and Coverage.
- Gamma is explicitly a **proxy/context**, not true dealer GEX.
- ETFs and stocks share one engine. Inverse/leveraged ETF metadata is normalized for cross-confirmation.
- Sector confirmation is only used when related ETFs are actually present in the uploaded file.

## Bilingual UX

EL/EN language toggle plus Simple/Advanced modes. Beginner copy explains signals without requiring options knowledge. Advanced mode exposes the Classification Inspector and technical evidence.

## Railway deploy

1. Create a new GitHub repository and upload this project.
2. In Railway, create a new project from the GitHub repository.
3. Add environment variables from `.env.example`.
4. Set `BETA_USER` and a strong `BETA_PASSWORD` for private access.
5. Add your Twelve Data API key to `TWELVE_DATA_API_KEY`.
6. For dual AI, set `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `OPENAI_API_KEY`, and `OPENAI_MODEL` to models available in your accounts.
7. Deploy. Railway will run the build and then `npm start`.

The app does not require a database for this first private beta. `db/schema.sql` is included as a forward-compatible starting point for immutable upload/signal history when validation is ready to move server-side.

## Security

- Provider/AI keys stay server-side in Railway environment variables.
- Basic Auth protects the whole beta when `BETA_USER` and `BETA_PASSWORD` are configured.
- Do **not** commit `.env`.
- The original app is copied under `legacy/` only as a benchmark/reference and is not served.

## Important limitations

Barchart CSV exports may not contain enough information to prove opening vs closing intent or reconstruct every complex order. When a field is missing, the engine deliberately lowers confidence instead of fabricating certainty. Multi-leg grouping is probabilistic and depends heavily on timestamp/size information in the export.

This beta is educational decision support, not personalized investment advice.
