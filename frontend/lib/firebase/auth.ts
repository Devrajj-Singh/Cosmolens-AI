import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { auth, db } from "@/lib/firebase/client"


export async function signupWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)

  await setDoc(
    doc(db, "users", credential.user.uid),
    {
      uid: credential.user.uid,
      email: credential.user.email,
      createdAt: serverTimestamp(),
      provider: "password",
    },
    { merge: true },
  )

  return credential.user
}


export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}


export async function logoutUser() {
  await signOut(auth)
}


export async function getIdToken() {
  if (!auth.currentUser) {
    return null
  }
  return auth.currentUser.getIdToken()
}


export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
