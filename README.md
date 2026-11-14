# DepositBack

Only 42% of US renters get their security deposit back in full. DepositBack checks every charge against California law (Civil Code §1950.5) via a team of agents that debate the legal scope, analyze move-in and move-out photos, and flag incorrect/questionable claims to help tenants get back the money they deserve.

## Setup

```bash
git clone https://github.com/kaelynliu18/depositback.git && cd depositback
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY=...
npm run dev                  # http://localhost:3000
```

To run without an API key, open **http://localhost:3000/?demo=1**. It uses sample data from `public/demo/`.

Run the tests with `npm test`.
