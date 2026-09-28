import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot,
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  getDocFromServer, 
  doc,
  setDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase with Hazera-Taju Degree College project credentials
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// Error handler adhering strictly to Firebase Integration Skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore notice: ', JSON.stringify(errInfo));
}

// Connection test on boot per skill instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or initializing.');
    }
  }
}
testConnection();

export interface ExamAttemptPayload {
  examId: string;
  examCode?: string;
  examTitle: string;
  category: string;
  attemptNumber: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  skipped: number;
  penaltyDeducted: number;
  netScore: number;
  percentage: number;
  userName?: string;
}

// Public API attached to window for ExamApp in index.html
export const medFirebase = {
  auth,
  db,
  currentUser: null as FirebaseUser | null,

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      try {
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          displayName: user.displayName || 'Medical Candidate',
          email: user.email || '',
          photoURL: user.photoURL || '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      return user;
    } catch (err) {
      console.warn('Google Sign-In Popup was blocked or cancelled, trying anonymous auth fallback:', err);
      try {
        const anonRes = await signInAnonymously(auth);
        return anonRes.user;
      } catch (anonErr) {
        console.error('Auth error:', anonErr);
        throw err;
      }
    }
  },

  async signInAsGuest(nickname: string = 'Medical Candidate') {
    try {
      const res = await signInAnonymously(auth);
      const user = res.user;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          displayName: nickname,
          isAnonymous: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch {}
      return user;
    } catch (err) {
      console.error('Guest Sign-In Error:', err);
      throw err;
    }
  },

  async signOut() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-Out Error:', err);
      throw err;
    }
  },

  async saveAttempt(payload: ExamAttemptPayload) {
    let uid = auth.currentUser?.uid;
    let userName = auth.currentUser?.displayName;

    // Auto-authenticate as anonymous if not yet signed in so attempt can be saved to Firestore
    if (!auth.currentUser) {
      try {
        const anonRes = await signInAnonymously(auth);
        uid = anonRes.user.uid;
        userName = payload.userName || 'Medical Candidate';
      } catch (e) {
        console.warn('Could not auto-sign-in for attempt persistence:', e);
      }
    }

    const path = 'attempts';
    try {
      const docRef = await addDoc(collection(db, path), {
        userId: uid || 'anonymous',
        userName: userName || payload.userName || 'Medical Candidate',
        userEmail: auth.currentUser?.email || '',
        userPhoto: auth.currentUser?.photoURL || '',
        examId: String(payload.examId).slice(0, 128),
        examCode: String(payload.examCode || '').slice(0, 64),
        examTitle: String(payload.examTitle).slice(0, 200),
        category: String(payload.category).slice(0, 100),
        attemptNumber: Number(payload.attemptNumber) || 1,
        totalQuestions: Number(payload.totalQuestions),
        correct: Number(payload.correct),
        wrong: Number(payload.wrong),
        skipped: Number(payload.skipped),
        penaltyDeducted: Number(payload.penaltyDeducted),
        netScore: Number(payload.netScore),
        percentage: Number(payload.percentage),
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return null;
    }
  },

  // Real-time listener for global leaderboard
  subscribeLeaderboard(callback: (results: any[]) => void): Unsubscribe {
    const path = 'attempts';
    const q = query(
      collection(db, path),
      orderBy('netScore', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const results: any[] = [];
      snapshot.forEach(docSnap => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  // Real-time listener for current user's history
  subscribeUserHistory(userId: string, callback: (results: any[]) => void): Unsubscribe {
    const path = 'attempts';
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const results: any[] = [];
      snapshot.forEach(docSnap => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort client-side by date
      results.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
        return timeB - timeA;
      });
      callback(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async getLeaderboard(subject: string = 'all', chapterId: string = 'all') {
    const path = 'attempts';
    try {
      const q = query(
        collection(db, path),
        orderBy('netScore', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      let results: any[] = [];
      snapshot.forEach(docSnap => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (subject !== 'all') {
        results = results.filter(item => item.category === subject);
      }
      if (chapterId !== 'all') {
        results = results.filter(item => item.examId === chapterId);
      }

      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
};

// Bind to window for global accessibility in index.html
if (typeof window !== 'undefined') {
  (window as any).medFirebase = medFirebase;

  onAuthStateChanged(auth, (user) => {
    medFirebase.currentUser = user;
    const evt = new CustomEvent('firebase-auth-state-changed', { detail: { user } });
    window.dispatchEvent(evt);
  });
}
