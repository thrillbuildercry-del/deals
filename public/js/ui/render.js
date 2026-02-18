// js/ui/render.js
import { loginWithGoogle, logoutUser } from '../services/auth-manager.js';

const appRoot = document.getElementById('app-root');

export const renderLogin = () => {
    appRoot.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-900">
            <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-sm w-full">
                <h1 class="text-3xl font-bold text-white mb-2">Delivery Sys</h1>
                <p class="text-gray-400 mb-6">Sales & Logistics Management</p>
                <button id="login-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 flex items-center justify-center gap-2">
                    <span>Login with Google</span>
                </button>
            </div>
        </div>
    `;

    document.getElementById('login-btn').addEventListener('click', async () => {
        try {
            await loginWithGoogle();
            // The onAuthStateChanged in app.js will handle the redirect
        } catch (e) {
            alert("Login Error: " + e.message);
        }
    });
};

export const renderPendingScreen = () => {
    appRoot.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded shadow-md max-w-md">
                <h2 class="text-xl font-bold mb-2">Approval Required</h2>
                <p>Your account is currently <strong>Pending</strong>.</p>
                <p class="mt-2 text-sm">Please contact the Administrator to approve your Driver access.</p>
                <button id="logout-btn" class="mt-6 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Sign Out</button>
            </div>
        </div>
    `;
    attachLogout();
};

export const renderSuspendedScreen = () => {
    appRoot.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center bg-red-900 text-white p-4">
            <h1 class="text-4xl font-bold mb-4">⛔ Access Suspended</h1>
            <p>Your account has been suspended by the administrator.</p>
            <button id="logout-btn" class="mt-8 border border-white px-6 py-2 rounded hover:bg-white hover:text-red-900 transition">Sign Out</button>
        </div>
    `;
    attachLogout();
};

export const renderDashboard = (user) => {
    // This will be expanded in Phases 2, 3, 4
    appRoot.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
                <div>
                    <span class="font-bold text-lg">${user.role.toUpperCase()}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm hidden sm:inline">${user.displayName}</span>
                    <button id="logout-btn" class="text-sm bg-blue-800 px-3 py-1 rounded hover:bg-blue-700">Logout</button>
                </div>
            </nav>
            <main class="p-4">
                <h2 class="text-2xl font-bold text-gray-800">Welcome, ${user.displayName}</h2>
                <div class="mt-4 p-4 bg-white rounded shadow">
                    <p>Role: <span class="font-mono bg-gray-200 px-2 py-1 rounded">${user.role}</span></p>
                    <p>Status: <span class="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">${user.accessStatus}</span></p>
                    <p class="mt-4 text-gray-500">Dashboard content for Phase 2 will appear here.</p>
                </div>
            </main>
        </div>
    `;
    attachLogout();
};

function attachLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        logoutUser();
    });
}