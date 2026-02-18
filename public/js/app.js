import { auth, onAuthStateChanged, db, doc, onSnapshot, APP_ID } from './services/firebase.js';
import { renderLogin, renderPendingScreen, renderSuspendedScreen } from './ui/render.js';
import { renderDriverDashboard } from './ui/driver-ui.js';
import { renderAdminDashboard } from './ui/admin-ui.js';
import { ROLES } from './config/constants.js';

const initApp = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Check Public Roster for Role/Status
            const rosterRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'roster', user.uid);
            
            onSnapshot(rosterRef, (snap) => {
                const data = snap.data() || {};
                const role = data.role || 'driver';
                const status = data.accessStatus || 'pending';

                if (role === ROLES.ADMIN) {
                    renderAdminDashboard(user);
                } else {
                    if (status === 'suspended') {
                        renderSuspendedScreen();
                    } else if (status === 'pending') {
                        renderPendingScreen();
                    } else {
                        // Load Driver App Data
                        loadDriverApp(user);
                    }
                }
            });
        } else {
            renderLogin();
        }
    });
};

const loadDriverApp = (user) => {
    // Listen to private driver state
    const userRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'app_state');
    
    onSnapshot(userRef, (docSnap) => {
        let appData = null;
        if (docSnap.exists()) {
            const raw = docSnap.data();
            if (raw.json) {
                appData = JSON.parse(raw.json);
            }
        }
        renderDriverDashboard(user, appData);
    });
};

document.addEventListener('DOMContentLoaded', initApp);