# TwisWua's Arcade

A three-game browser arcade built with Next.js, React, TypeScript, and Canvas 2D: Survival, Flight, and Dash. The game artwork is drawn in code.

## Run locally

Use Node.js 22.18+ (Node.js 24 recommended).

```sh
npm install
npm run dev
```

Open http://localhost:3000.

## Dash

Choose the third arcade cabinet or open `/runner` for a tiger endless runner inspired by Chrome's dinosaur game. Press Space, W, or ↑ to jump over cacti and logs. Hold S or ↓ to duck beneath birds; ducking in the air brings you down faster. On touchscreens, use the Jump and Duck buttons. P or Escape pauses; switching tabs also pauses automatically.

The pace increases gradually, and the scenery alternates between day and night every 500 distance points. A collision ends the run. Retry starts a fresh trail; your personal best and music preference are saved locally when browser storage is available. Dash needs no backend or environment variables.

## Play

- On mobile, the game fills one screen: arena above, handheld controls below. Hold the left joystick to move; release to stop. Use A to dash (3-second cooldown) and B to roar (6-second cooldown).
- On desktop, move your mouse inside the arena, or use arrow keys / WASD. J dashes and K roars.
- Claws automatically attack ducks within range. Avoid touching enemies. From wave 5 onward, red-ringed shooting ducks keep their distance and fire aimed projectiles; their beaks flash before firing.
- Defeat every duck to finish a wave and choose one of three random powerups. The eight-powerup pool includes damage, attack speed, health, claw reach, armor, regeneration, dash recharge, and roar range/recharge. Choices remain fixed until you select; upgrades last for the current run.
- Press P or Escape to pause. Switching away automatically pauses the game.
- Runs end at zero health. Restart with a permanent +5 starting health per finished run, capped at +50.
- Best wave and permanent health progression are stored in this browser. No account or backend is required.
- An original synthesized 8-bit music loop starts when you play. Toggle it with the music button. It pauses with the game and when you switch away.

## TwisWua Flight

Open `/flappy` from the arcade selector. Tap/click the arena, press Space or Arrow Up, or use the mobile FLAP button to gain altitude. P or Escape pauses and resumes; leaving the tab pauses automatically.

- Pass a gate for one point. Collect its star for three more, then clear it cleanly to build a perfect streak worth up to five bonus points per gate.
- Each flight starts with one shield. It absorbs a collision; shield pickups appear every sixth gate.
- The flight speeds up and gaps narrow gradually. Earn bronze, silver, and gold wings at 5, 15, and 30 gates.
- Retry from the result screen. Personal best and sound preference stay saved in this browser, including existing Flight records.
- Music and sound effects start after you press play. The sound button mutes both. Mobile fits the viewport without scrolling.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

## Deploy to Vercel

Push this repository to your Git provider, then import it as a new Vercel project. Use the Next.js framework preset with the repository root as the root directory. The build command is `npm run build`. Solo play needs no environment variables or services. Survival online play requires the Firebase configuration below.

The game runs in the browser. Google Fonts enhances typography when available; local sans-serif fallbacks are provided.

## Survival co-op and Google sign-in

`/survival` supports solo play and a shared co-op arena for 2–4 Google-authenticated players. Select **Co-op**, sign in, create a room, and share the eight-character code. Friends join before the host starts. Players share enemies and team kills; each has their own health, movement, dash, roar, and upgrades. All living players must choose an upgrade before the next wave. Fallen players revive at the next wave. Only the host can restart a finished run.

### Firebase setup

1. Create a Firebase project and register a web app in Project settings.
2. Copy `.env.example` to `.env.local` and fill in the web app configuration. Use the exact Realtime Database URL from the Firebase console, including its region when present. These are public client configuration values; do not use a service-account key.
3. Enable **Authentication → Sign-in method → Google** and choose a support email. Add your production domain and `localhost` to Authentication's authorized domains. See [Firebase Google sign-in setup](https://firebase.google.com/docs/auth/web/google-signin).
4. Create a **Realtime Database**. Publish `database.rules.json` in its Rules tab, or use the Firebase CLI: `firebase deploy --only database --project YOUR_PROJECT_ID`. Do not enable public test-mode rules.
5. Restart the dev server. For deployment, set all five `NEXT_PUBLIC_FIREBASE_*` variables before building, then rebuild/redeploy.
6. Open `/survival` in two browser profiles with different Google accounts. Create a room in one, join by code in the other, and start from the host. Confirm both see the same enemies, movement, wave changes, and team results.

Solo play remains available without Firebase configuration. Authentication persists through Firebase's browser session handling. Sign out from the co-op lobby after leaving the room. Popup sign-in requires browser popups to be allowed.

The host's browser simulates combat and publishes snapshots to RTDB; other players publish only their own inputs. Rules restrict shared state writes to the host and player writes to their own membership. This is casual co-op, with no trusted-server anti-cheat or competitive leaderboard. Authenticated users with a room code can read that room; room listing is denied. Only display names and game data are stored in rooms, not email addresses or Google tokens.

Closing/leaving the host's room removes it for everyone. RTDB disconnect handlers remove disconnected guests and close disconnected hosts' rooms. Reconnection after a removed membership requires joining a new lobby. Co-op does not pause when a guest switches tabs; movement stops. Keep the host tab visible for smooth simulation. A closed host tab ends the session once Firebase detects the disconnect. See [Firebase connection and presence handling](https://firebase.google.com/docs/database/web/offline-capabilities).

### Database rule integration check

With a current Java runtime and Firebase CLI installed, run:

```sh
firebase emulators:exec --only auth,database --project demo-twiswua 'node --experimental-strip-types --test tests/firebase.integration.ts'
```

This uses local test identities to check room ownership, four-player capacity, input validation, lobby-only joining, and deletion permissions. It does not contact production Firebase or test Google's OAuth flow.

## Co-op difficulty and automated rule deployment

Each additional player adds 65% to the wave enemy budget, 35% to enemy health, and 20% to the spawn-rate multiplier. Difficulty uses the party size at the start of the wave, including fallen teammates; departures affect the next wave. The host rolls three distinct powerup choices per wave, shares them with the team, and rejects choices outside that menu.

The GitHub workflow `.github/workflows/deploy-database-rules.yml` deploys `database.rules.json` and `firestore.rules` to the `twiswua-com` project when the rules, Firebase configuration, or workflow change on `main`. It uses the existing `FIREBASE_TOKEN` repository secret and Firebase CLI's `--only database,firestore:rules` targets, as documented in the [Firebase CLI reference](https://firebase.google.com/docs/cli#deploy_specific_firebase_services). Deploy the updated rules along with this release so all eight upgrade choices are accepted.

## High scores and shared game console

All three solo games use `app/game-shell.tsx` for their header, score-board button, screen frame, and responsive console. Mobile keeps the game in the upper half and handheld controls below. Survival retains its joystick and A/B abilities. Flight uses A to flap and B to pause. Dash uses A to jump and hold-B to crouch; on desktop, **Spacebar jumps and S crouches**. Dash's scenery now fades through day/night changes instead of switching palettes instantly.

Each game has its own public top-10 board: Survival ranks ducks defeated (solo and host-submitted co-op team runs), Flight ranks points, and Dash ranks distance points. A qualifying completed run opens a three-letter A–Z initials selector with up/down arrows. Equal scores keep earlier entries; a tie with tenth place does not replace it. Local personal records remain independent of the shared boards.

Firestore stores one document per game at `arcadeLeaderboards/{survival|flight|dash|eggswiper}`, containing at most ten entries. Each entry includes its Firebase account UID, initials, score, and server timestamp. Signed-in scores use the player's existing Google account. Logged-out submissions use a persistent anonymous account in a separate Firebase app instance, so guest score entry does not sign the player into Survival co-op. The public board displays initials and scores only. Signing in later does not retroactively transfer guest entries.

### Enable production high scores

1. In the existing Firebase project, create the default **Cloud Firestore** database if it does not exist.
2. Enable **Authentication → Sign-in method → Anonymous**, and keep Google enabled for account sign-in. Configure authorized domains for the deployed site and localhost.
3. Set `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` before building. Keep `NEXT_PUBLIC_FIREBASE_EMULATORS=0` in production. Survival co-op additionally needs its existing database URL.
4. Deploy the Firestore rules with `firebase deploy --only firestore:rules --project twiswua-com`, or let `.github/workflows/deploy-database-rules.yml` publish them on the next matching push to `main`. That workflow now deploys both Realtime Database and Firestore rules using the existing secret.
5. Rebuild/redeploy the Next.js app, finish a scoring run, select three initials, and save. Open the board in another browser to confirm the entry.

Client transactions re-read the board before inserting a qualifying score and removing its lowest entry. Rules reject unauthenticated writes, ownership spoofing, invalid initials/scores, edits to existing entries, board deletion, and boards larger than ten. Concurrent submissions retry against the current board; submitting the same run twice is idempotent. These are casual client-simulated games, not a server-verified competitive leaderboard. Rules enforce the data structure and account ownership, not the authenticity of gameplay.

The integration follows Firebase's [transaction guidance](https://firebase.google.com/docs/firestore/manage-data/transactions), [field validation rules](https://firebase.google.com/docs/firestore/security/rules-fields), and [anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth).

### Local score-board verification

With Java 21+ and Firebase CLI installed:

```sh
firebase emulators:exec --only auth,firestore --project demo-twiswua 'node --experimental-strip-types --test tests/firestore.integration.ts'
```

This checks signed-in and guest ownership, public reads while signed out, duplicate submission, concurrent writers, eviction of the lowest score, ten-entry retention, and denied invalid writes. It uses a demo project and clears only that emulator's Firestore data. To exercise the UI against running local emulators, use demo Firebase config values with project ID `demo-twiswua` and `NEXT_PUBLIC_FIREBASE_EMULATORS=1` before building or starting development. Emulator routing is restricted to project IDs beginning with `demo-`.
