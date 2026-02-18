// js/ui/admin-ui.js
import { subscribeToDrivers, updateUserStatus, addStockToDriver } from '../services/admin-service.js';
import { logoutUser } from '../services/auth-manager.js';

const appRoot = document.getElementById('app-root');
let unsubscribeDrivers = null; // To stop listening when we leave

export const renderAdminDashboard = (currentUser) => {
    appRoot.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <header class="bg-gray-900 text-white p-4 sticky top-0 z-40 shadow-lg flex justify-between items-center">
                <div>
                    <h1 class="text-xl font-bold text-yellow-500">Boss Mode</h1>
                    <p class="text-xs text-gray-400">Admin Dashboard</p>
                </div>
                <button id="admin-logout" class="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">Logout</button>
            </header>

            <main class="p-4 space-y-6">
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                        <p class="text-gray-500 text-xs uppercase">Total Sales Today</p>
                        <p class="text-2xl font-bold text-gray-800">$0</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                        <p class="text-gray-500 text-xs uppercase">Active Drivers</p>
                        <p class="text-2xl font-bold text-gray-800" id="active-driver-count">0</p>
                    </div>
                </div>

                <div id="pending-section" class="hidden">
                    <h2 class="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Action Required
                    </h2>
                    <div id="pending-list" class="space-y-3">
                        </div>
                </div>

                <div>
                    <h2 class="text-lg font-bold text-gray-800 mb-2">Team Management</h2>
                    <div id="driver-list" class="space-y-3">
                        <div class="text-center py-8 text-gray-400">Loading Team...</div>
                    </div>
                </div>
            </main>

            <div id="restock-modal" class="fixed inset-0 bg-black bg-opacity-70 hidden z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                    <h3 class="text-xl font-bold mb-4">Add Stock</h3>
                    <p class="text-sm text-gray-500 mb-4">Restocking driver: <span id="modal-driver-name" class="font-bold text-black"></span></p>
                    
                    <input type="number" id="restock-qty" class="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold mb-4 focus:border-blue-500 outline-none" placeholder="Enter Amount (e.g., 50)">
                    
                    <div class="flex gap-3">
                        <button id="close-restock" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold">Cancel</button>
                        <button id="confirm-restock" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize Logic
    attachAdminEvents();
    
    // Start Listening to Database
    unsubscribeDrivers = subscribeToDrivers((drivers) => {
        renderDriverLists(drivers, currentUser);
    });
};

function renderDriverLists(drivers, currentUser) {
    const pendingContainer = document.getElementById('pending-list');
    const activeContainer = document.getElementById('driver-list');
    const pendingSection = document.getElementById('pending-section');
    const activeCountDisplay = document.getElementById('active-driver-count');

    // Clear current lists
    pendingContainer.innerHTML = '';
    activeContainer.innerHTML = '';

    const pendingDrivers = drivers.filter(d => d.accessStatus === 'pending');
    const activeDrivers = drivers.filter(d => d.accessStatus !== 'pending'); // includes suspended

    // Update Stats
    activeCountDisplay.innerText = activeDrivers.filter(d => d.accessStatus === 'active').length;

    // Render Pending
    if (pendingDrivers.length > 0) {
        pendingSection.classList.remove('hidden');
        pendingDrivers.forEach(user => {
            const card = document.createElement('div');
            card.className = "bg-red-50 border border-red-200 p-4 rounded-lg flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <p class="font-bold text-gray-900">${user.displayName}</p>
                    <p class="text-xs text-gray-500">${user.email}</p>
                </div>
                <button class="bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-bold btn-approve" data-id="${user.id}">
                    Approve
                </button>
            `;
            pendingContainer.appendChild(card);
        });
    } else {
        pendingSection.classList.add('hidden');
    }

    // Render Active Team
    activeDrivers.forEach(user => {
        const isSuspended = user.accessStatus === 'suspended';
        const card = document.createElement('div');
        card.className = `bg-white p-4 rounded-lg shadow flex flex-col gap-3 ${isSuspended ? 'opacity-75 bg-gray-100' : ''}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    ${user.photoURL ? `<img src="${user.photoURL}" class="w-10 h-10 rounded-full">` : '<div class="w-10 h-10 bg-gray-300 rounded-full"></div>'}
                    <div>
                        <p class="font-bold text-gray-900">${user.displayName}</p>
                        <span class="text-xs px-2 py-0.5 rounded ${isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                            ${user.accessStatus}
                        </span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-400">Current Stock</p>
                    <p class="text-xl font-bold text-blue-600">${user.currentStock || 0}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                <button class="text-sm py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-semibold btn-restock" 
                    data-id="${user.id}" data-name="${user.displayName}">
                    + Add Stock
                </button>
                <button class="text-sm py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 btn-toggle-status" 
                    data-id="${user.id}" data-status="${user.accessStatus}">
                    ${isSuspended ? 'Re-Activate' : 'Suspend'}
                </button>
            </div>
        `;
        activeContainer.appendChild(card);
    });

    // Re-attach event listeners for dynamic buttons
    attachDynamicEvents(currentUser);
}

function attachAdminEvents() {
    document.getElementById('admin-logout').addEventListener('click', () => {
        if(unsubscribeDrivers) unsubscribeDrivers(); // Clean up listener
        logoutUser();
    });

    // Modal Close
    document.getElementById('close-restock').addEventListener('click', () => {
        document.getElementById('restock-modal').classList.add('hidden');
    });
}

function attachDynamicEvents(currentUser) {
    // Approve Buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const uid = e.target.dataset.id;
            if(confirm("Approve this driver?")) {
                await updateUserStatus(uid, 'active');
            }
        });
    });

    // Status Toggle Buttons
    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const uid = e.target.dataset.id;
            const currentStatus = e.target.dataset.status;
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            
            if(confirm(`Mark user as ${newStatus}?`)) {
                await updateUserStatus(uid, newStatus);
            }
        });
    });

    // Restock Buttons
    document.querySelectorAll('.btn-restock').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const uid = e.target.dataset.id;
            const name = e.target.dataset.name;
            
            // Open Modal
            const modal = document.getElementById('restock-modal');
            document.getElementById('modal-driver-name').innerText = name;
            document.getElementById('restock-qty').value = ''; // Reset input
            
            // Handle Confirm (Remove old listener to avoid duplicates if re-rendered)
            const confirmBtn = document.getElementById('confirm-restock');
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            newConfirmBtn.addEventListener('click', async () => {
                const qty = document.getElementById('restock-qty').value;
                if(!qty || qty <= 0) return alert("Enter valid quantity");
                
                newConfirmBtn.innerText = "Processing...";
                await addStockToDriver(currentUser.uid, uid, qty);
                
                modal.classList.add('hidden');
                newConfirmBtn.innerText = "Confirm";
            });

            modal.classList.remove('hidden');
        });
    });
}