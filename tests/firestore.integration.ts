import { test } from "node:test";
import assert from "node:assert/strict";
import { getApp, deleteApp, getApps } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  deleteDoc,
  serverTimestamp,
  terminate,
} from "firebase/firestore";
import { loadHighScores, saveHighScore } from "../lib/leaderboard-store.ts";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT || "demo-twiswua";
if (
  !host ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  !project.startsWith("demo-")
)
  throw new Error(
    "Run through local Auth/Firestore emulators with a demo project.",
  );
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = `${project}.firebaseapp.com`;
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = project;
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "demo-app";
process.env.NEXT_PUBLIC_FIREBASE_EMULATORS = "1";

test("Firestore stores account-owned top tens, rejects invalid writes, and handles competing submissions", async () => {
  const cleared = await fetch(
    `http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  assert.equal(cleared.ok, true);
  try {
    assert.deepEqual(await loadHighScores("dash"), []);
    const db = getFirestore(getApp());
    const reference = doc(db, "arcadeLeaderboards", "dash");
    const id = () => crypto.randomUUID();
    const candidate = (uid: string, initials = "AAA", score = 100) => ({
      initials,
      score,
      uid,
      createdAt: serverTimestamp(),
    });
    const write = (entryId: string, entry: unknown) =>
      setDoc(reference, {
        entries: { [entryId]: entry },
        lastSubmission: entryId,
        dropped: "",
        updatedAt: serverTimestamp(),
      });
    await assert.rejects(write(id(), candidate("not-signed-in")), {
      code: "permission-denied",
    });
    const guestRun = { id: id(), score: 50 };
    assert.equal(await saveHighScore("dash", guestRun, "GST"), "saved");
    const guestUid = getAuth(getApp("arcade-scores")).currentUser!.uid;
    assert.ok(guestUid);
    assert.equal(getAuth(getApp()).currentUser, null);
    let data = (await getDoc(reference)).data()!;
    assert.equal(data.entries[guestRun.id].uid, guestUid);
    assert.equal(await saveHighScore("dash", guestRun, "GST"), "existing");
    assert.equal(
      Object.keys((await getDoc(reference)).data()!.entries).length,
      1,
    );
    const user = await createUserWithEmailAndPassword(
      getAuth(getApp()),
      `player-${Date.now()}@example.test`,
      "test-password-123",
    );
    const accountRun = { id: id(), score: 100 };
    assert.equal(await saveHighScore("dash", accountRun, "USR"), "saved");
    assert.equal(
      (await getDoc(reference)).data()!.entries[accountRun.id].uid,
      user.user.uid,
    );
    await assert.rejects(saveHighScore("dash", { id: id(), score: 10 }, "AB"));
    for (let i = 0; i < 8; i++)
      await saveHighScore("dash", { id: id(), score: 200 + i }, "TOP");
    assert.equal((await loadHighScores("dash")).length, 10);
    const race = await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        saveHighScore("dash", { id: id(), score: 500 + i }, "WIN"),
      ),
    );
    assert.ok(race.every((result) => result === "saved"));
    const top = await loadHighScores("dash");
    assert.equal(top.length, 10);
    assert.deepEqual(
      top.slice(0, 4).map((entry) => entry.score),
      [503, 502, 501, 500],
    );
    data = (await getDoc(reference)).data()!;
    assert.equal(Object.keys(data.entries).length, 10);
    assert.equal(
      await saveHighScore("dash", { id: id(), score: 1 }, "LOW"),
      "missed",
    );
    assert.equal(
      await saveHighScore(
        "dash",
        { id: id(), score: top.at(-1)!.score },
        "TIE",
      ),
      "missed",
    );
    const invalidId = id();
    const full = (entry: unknown, dropped = "") =>
      setDoc(reference, {
        entries: { ...data.entries, [invalidId]: entry },
        lastSubmission: invalidId,
        dropped,
        updatedAt: serverTimestamp(),
      });
    await assert.rejects(full(candidate(user.user.uid)), {
      code: "permission-denied",
    });
    const lowest = top.at(-1)!.id;
    const tryReplace = (entry: unknown, removed = lowest) => {
      const entries = { ...data.entries, [invalidId]: entry };
      delete entries[removed];
      return setDoc(reference, {
        entries,
        lastSubmission: invalidId,
        dropped: removed,
        updatedAt: serverTimestamp(),
      });
    };
    await assert.rejects(tryReplace(candidate("someone-else", "BAD", 999)), {
      code: "permission-denied",
    });
    await assert.rejects(tryReplace(candidate(user.user.uid, "LONG", 999)), {
      code: "permission-denied",
    });
    await assert.rejects(tryReplace(candidate(user.user.uid, "BAD", -1)), {
      code: "permission-denied",
    });
    await assert.rejects(
      tryReplace(candidate(user.user.uid, "BAD", 999), top[0].id),
      { code: "permission-denied" },
    );
    await assert.rejects(
      setDoc(reference, { ...data, entries: {}, updatedAt: serverTimestamp() }),
      { code: "permission-denied" },
    );
    await assert.rejects(deleteDoc(reference), { code: "permission-denied" });
    for (const game of ["flight", "survival"] as const) {
      assert.equal(
        await saveHighScore(game, { id: id(), score: 12 }, "YES"),
        "saved",
      );
      assert.equal((await loadHighScores(game)).length, 1);
    }
    await signOut(getAuth(getApp()));
    assert.equal((await loadHighScores("dash")).length, 10);
    const loggedOut = { id: id(), score: 999 };
    assert.equal(await saveHighScore("dash", loggedOut, "GST"), "saved");
    assert.equal(
      (await getDoc(reference)).data()!.entries[loggedOut.id].uid,
      guestUid,
    );
  } finally {
    for (const app of getApps()) {
      await terminate(getFirestore(app));
      await deleteApp(app);
    }
  }
});
