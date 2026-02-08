# iExec tools feedback — ShadowSettle (Hack4Privacy)

Feedback from building **ShadowSettle** with iExec confidential computing. We used the iExec JavaScript SDK, the iApp (Docker + TEE) workflow, and Bellecour for task execution.

---

## What we used

- **iExec SDK (JavaScript)** — To create and sign app/workerpool/request orders, match orders, run tasks, and fetch results.
- **iApp workflow** — Docker image, `iexec.json` / `iapp.config.json`, `iapp` CLI for deploy and run.
- **TEE (SGX/TDX)** — Our settlement logic runs inside the TEE; one task processes many participants (bulk processing).
- **Bellecour** — Testnet for running confidential tasks.

---

## What worked well

1. **Order book + match flow** — The pattern (create app order, fetch workerpool orderbook, create request order with `iexec_input_files`, match orders, get deal/task) is clear once you’ve done it once. Passing a dataset URL via `params.iexec_input_files` was straightforward.

2. **TEE isolation** — Running eligibility and payout logic in the TEE gave us a clear trust boundary: only the iApp sees the raw data; the backend and chain only see the attested result. That matched our design (confidential DeFi / RWA).

3. **Bulk processing** — One task, one input file (dataset with many participants), one output (payout list + attestation). No need to spin one task per participant; the bonus requirement was easy to satisfy.

4. **iApp CLI** — `iapp deploy`, `iapp run`, and the config files made it possible to build, push, and register the app without deep infra knowledge. The Docker-based flow (with sconify for TEE) was manageable.

5. **Documentation** — The main concepts (orders, deal, task, TEE, result) are documented. We could map our “run a confidential job and get a result” flow onto the iExec model.

---

## Suggestions for improvement

1. **SDK examples for “run task and poll for result”** — A single, copy-paste-friendly example (Node.js) that: creates a request order with `iexec_input_files`, matches orders, gets `taskId`, then polls or waits for the task and fetches the result. Our integration did this, but we had to combine several docs and API pieces. A single end-to-end snippet would speed up onboarding.

2. **Clearer error messages when no workerpool order is found** — When `fetchWorkerpoolOrderbook` returns an empty list (e.g. no workerpool for the app/tag), the error could suggest: check tag (e.g. SCONE), check app address, try again later. That would help during development and on testnets.

3. **Result retrieval** — Document or expose the “get result by taskId” (and optional dealId) path clearly. We used the SDK to fetch the result after the task completed; a short “How to get the output of a task” section would help.

4. **iApp input/output contract** — A one-page spec: how input files are exposed in the container (env vars, paths), how to write the result so the platform can store/return it (`computed.json`, deterministic path, etc.). We figured it out from examples and docs, but a single reference would help new iApp developers.

5. **Bellecour / testnet reliability** — Occasionally we hit timeouts or empty orderbooks. A note in the docs like “Bellecour is a shared testnet; if you see no orders, retry or try during lower load” would set expectations.

---

## Summary

We were able to build a full confidential settlement flow (frontend → backend → iExec TEE → on-chain settlement) using the iExec SDK and iApp workflow. The model (orders, deal, task, TEE, result) fits confidential DeFi well. More end-to-end examples and a concise iApp I/O reference would make the first integration even faster. We’re happy to expand on any of this if it helps the iExec team.

— ShadowSettle team (Hack4Privacy)
