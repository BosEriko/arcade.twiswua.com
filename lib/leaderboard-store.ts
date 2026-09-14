import { getFirebaseApp } from "./firebase.ts";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDocFromServer,
  getFirestore,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  rankScores,
  scoreInsertion,
  validInitials,
  validScore,
  type ArcadeGame,
  type ArcadeResult,
  type HighScore,
} from "./leaderboard.ts";

function leaderboardFirebase() {
  const app = getFirebaseApp();
  const guestApp = getFirebaseApp("arcade-scores");
  if (!app || !guestApp)
    throw new Error("High scores are not connected yet. You can still play.");
  return {
    account: { auth: getAuth(app), firestore: getFirestore(app) },
    guest: { auth: getAuth(guestApp), firestore: getFirestore(guestApp) },
  };
}

type StoredScore = {
  initials: string;
  score: number;
  uid: string;
  createdAt: Timestamp;
};
type StoredBoard = {
  entries: Record<string, StoredScore>;
  lastSubmission: string;
};

function scores(data: StoredBoard | undefined): HighScore[] {
  return rankScores(
    Object.entries(data?.entries || {}).map(([id, entry]) => ({
      id,
      initials: entry.initials,
      score: entry.score,
      createdAt: entry.createdAt.toMillis(),
    })),
  );
}

export async function loadHighScores(game: ArcadeGame) {
  const {
    account: { firestore },
  } = leaderboardFirebase();
  const snapshot = await getDocFromServer(
    doc(firestore, "arcadeLeaderboards", game),
  );
  return scores(snapshot.data() as StoredBoard | undefined);
}

let signingIn: Promise<unknown> | null = null;

export async function saveHighScore(
  game: ArcadeGame,
  result: ArcadeResult,
  initials: string,
) {
  if (
    !validInitials(initials) ||
    !validScore(result.score) ||
    !/^[A-Za-z0-9_-]{16,80}$/.test(result.id)
  )
    throw new Error("Choose three letters and finish a scoring run first.");
  const { account, guest } = leaderboardFirebase();
  await account.auth.authStateReady();
  const { auth, firestore } = account.auth.currentUser ? account : guest;
  await auth.authStateReady();
  if (!auth.currentUser) {
    signingIn ??= signInAnonymously(auth).finally(() => {
      signingIn = null;
    });
    await signingIn;
  }
  const uid = auth.currentUser!.uid;
  const reference = doc(firestore, "arcadeLeaderboards", game);
  for (let attempt = 0; attempt < 5; attempt++) {
    let observed = "";
    try {
      return await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(reference);
        const data = snapshot.data() as StoredBoard | undefined;
        observed = data?.lastSubmission || "";
        const decision = scoreInsertion(result, scores(data));
        if (decision.status !== "insert") return decision.status;
        const entries: Record<
          string,
          | StoredScore
          | {
              initials: string;
              score: number;
              uid: string;
              createdAt: ReturnType<typeof serverTimestamp>;
            }
        > = { ...data?.entries };
        if (decision.dropped) delete entries[decision.dropped];
        entries[result.id] = {
          initials,
          score: result.score,
          uid,
          createdAt: serverTimestamp(),
        };
        transaction.set(reference, {
          entries,
          lastSubmission: result.id,
          dropped: decision.dropped,
          updatedAt: serverTimestamp(),
        });
        return "saved" as const;
      });
    } catch (error) {
      if (
        (error as { code?: string }).code !== "permission-denied" ||
        attempt === 4
      )
        throw error;
      const current = await getDocFromServer(reference);
      if ((current.data()?.lastSubmission || "") === observed) throw error;
    }
  }
  throw new Error("The board is busy. Please try saving again.");
}

export function leaderboardError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (
    code === "permission-denied" ||
    code === "auth/operation-not-allowed" ||
    code === "auth/admin-restricted-operation"
  )
    return "The high-score service isn’t ready yet. Please try again later.";
  if (code)
    return "Couldn’t reach the high-score board. Check your connection and try again.";
  return error instanceof Error
    ? error.message
    : "Couldn’t load high scores. Please try again.";
}

export function observeScoreAccount(callback: (name: string | null) => void) {
  const { account } = leaderboardFirebase();
  return onAuthStateChanged(account.auth, (user) =>
    callback(user && !user.isAnonymous ? user.displayName || "Player" : null),
  );
}

export async function signInForScores() {
  const { account } = leaderboardFirebase();
  await signInWithPopup(account.auth, new GoogleAuthProvider());
}

export async function signOutOfScores() {
  const { account } = leaderboardFirebase();
  await signOut(account.auth);
}
