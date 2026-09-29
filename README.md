# Truth or Dare (public, no sign-in, no API key)

Two players join a room by link/code, pick a level, and play Truth or Dare with chat, a challenge timer, round counter and history. Suggestions come from 3000 premade truths and 3000 premade dares in `public/data.json`, picked at random per level (Lovers: mild / medium / spicy).

## Run locally
    npm install
    npm start        # open http://localhost:3000

## Deploy (Render free tier, or any Node host)
1. Put this folder in a GitHub repo.
2. Render > New > Web Service > pick the repo. Build: `npm install`. Start: `npm start`. No environment variables needed.
3. Share your URL. The host also gets a join link like `https://yourapp.onrender.com/#abc12`.

## Edit the suggestions
The lists are built from 20 sentence frames x 150 topics per kind: English in `generate.py`, Arabic in `ar.py`. Edit them and run `python3 generate.py` to rebuild `public/data.json` (it checks there are exactly 3000 unique items per kind and language).

Notes: the language picker offers English and Arabic; suggestions and interface follow it (Arabic switches the page to right-to-left). Rooms live in memory and reset on restart. Free hosts sleep when idle, so the first load can be slow.
