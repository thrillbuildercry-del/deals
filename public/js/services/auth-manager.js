import { auth, db, provider, signInWithPopup, signOut, doc, getDoc, setDoc, APP_ID } from './firebase.js';

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
        const rosterRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'roster', user.uid);
        
        const snap = await getDoc(profileRef);

        if (!snap.exists()) {
            // New User Defaults
            await setDoc(profileRef, {
                name: user.displayName,
                email: user.email,
                role: 'driver', // Default role
                accessStatus: 'pending',
                createdAt: Date.now()
            });
        }

        // Always sync public roster on login
        await setDoc(rosterRef, {
            name: user.displayName,
            email: user.email,
            uid: user.uid,
            lastLogin: Date.now()
        }, { merge: true });

        return user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
    window.location.reload();
};