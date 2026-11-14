# DepositBack+

Upload your landlord's security-deposit deduction statement, and DepositBack+ checks every charge against California law (Civil Code §1950.5). Claude agents review the charges, compare move-in and move-out photos, and rule on each disputed charge. You get a demand letter, an email to your landlord, and a calendar reminder.

## Setup

```bash
git clone https://github.com/kaelynliu18/depositback.git && cd depositback
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY=...
npm run dev                  # http://localhost:3000
```

To run without an API key, open **http://localhost:3000/?demo=1**. It uses sample data from `public/demo/`.

Run the tests with `npm test`.
