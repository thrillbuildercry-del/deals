// js/ui/driver-ui.js
import { processSale } from '../services/driver-service.js';
import { logoutUser } from '../services/auth-manager.js';
import { calculateSaleMetrics } from '../utils/calculations.js';

const appRoot = document.getElementById('app-root');

export const renderDriverDashboard = (user) => {
    appRoot.innerHTML = `
        <div class="min-h-screen bg-gray-100 pb-20"> <header class="bg-blue-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
                <div>
                    <h1 class="font-bold text-xl">Driver Panel</h1>
                    <p class="text-xs text-blue-200">Logged in as ${user.displayName.split(' ')[0]}</p>
                </div>
                <div class="text-right">
                   <div class="text-xs text-blue-200">Current Debt</div>
                   <div class="font-bold text-lg text-red-400">$${user.currentDebt || 0}</div>
                </div>
            </header>

            <main class="p-4 space-y-4">
                
                <div class="bg-white rounded-xl shadow p-6 flex justify-between items-center border-l-4 border-blue-500">
                    <div>
                        <h2 class="text-gray-500 text-sm uppercase tracking-wide">Current Stock</h2>
                        <span class="text-4xl font-bold text-gray-800" id="stock-display">${user.currentStock || 0}</span>
                        <span class="text-gray-400 text-sm">units</span>
                    </div>
                    <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                </div>

                <button id="btn-new-sale" class="w-full bg-green-600 active:bg-green-700 text-white rounded-xl p-4 shadow-lg flex items-center justify-center gap-3 transition transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="text-xl font-bold">Record Sale</span>
                </button>

                <div class="grid grid-cols-2 gap-4">
                     <button class="bg-gray-800 text-white rounded-lg p-3 shadow text-sm font-semibold">
                        Start Shift
                     </button>
                     <button class="bg-gray-800 text-white rounded-lg p-3 shadow text-sm font-semibold">
                        History
                     </button>
                </div>
                
                <button id="logout-driver" class="w-full mt-8 text-red-600 text-sm font-semibold p-4">
                    Sign Out
                </button>

            </main>

            <div id="sale-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-end sm:items-center justify-center">
                <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-6 shadow-2xl animate-slide-up">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800">New Sale</h3>
                        <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <div class="flex justify-between gap-2">
                            ${[1, 2, 3, 4].map(num => `
                                <button class="qty-btn flex-1 py-3 border-2 border-gray-200 rounded-lg font-bold text-lg text-gray-600 focus:border-green-500 focus:text-green-600 focus:bg-green-50 transition" data-qty="${num}">
                                    ${num}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div id="sale-preview" class="hidden bg-gray-50 rounded-lg p-4 mb-6 space-y-2 border border-gray-200">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Price to Customer:</span>
                            <span class="font-bold text-gray-800" id="preview-revenue">$0</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Your Profit:</span>
                            <span class="font-bold text-green-600" id="preview-profit">$0</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-400 pt-2 border-t mt-2">
                            <span>Debt Added:</span>
                            <span id="preview-debt">$0</span>
                        </div>
                    </div>

                    <button id="confirm-sale" class="w-full bg-green-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                        Confirm Sale
                    </button>
                </div>
            </div>
        </div>
    `;

    attachDriverEvents(user);
};

// Event Listeners for the Driver Dashboard
function attachDriverEvents(user) {
    const modal = document.getElementById('sale-modal');
    const openBtn = document.getElementById('btn-new-sale');
    const closeBtn = document.getElementById('close-modal');
    const qtyBtns = document.querySelectorAll('.qty-btn');
    const confirmBtn = document.getElementById('confirm-sale');
    let selectedQty = 0;

    // Logout
    document.getElementById('logout-driver').addEventListener('click', logoutUser);

    // Modal Logic
    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        resetModal();
    });

    // Quantity Selection
    qtyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI Update
            qtyBtns.forEach(b => b.classList.remove('border-green-500', 'text-green-600', 'bg-green-50'));
            e.target.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
            
            // Logic Update
            selectedQty = parseInt(e.target.dataset.qty);
            updatePreview(selectedQty);
        });
    });

    // Confirm Sale
    confirmBtn.addEventListener('click', async () => {
        if(selectedQty === 0) return;
        
        confirmBtn.innerText = "Processing...";
        confirmBtn.disabled = true;

        const result = await processSale(user.uid, selectedQty);
        
        if (result.success) {
            // Close and Reset
            modal.classList.add('hidden');
            resetModal();
            // In a real app with Firestore realtime listeners, the UI updates automatically.
            // For now, we can manually reload or rely on the listener in app.js if we set it up.
            alert(`Sale Successful! Profit: $${result.metrics.driverProfit}`);
        } else {
            alert("Error: " + result.error);
            confirmBtn.innerText = "Confirm Sale";
            confirmBtn.disabled = false;
        }
    });

    function updatePreview(qty) {
        const metrics = calculateSaleMetrics(qty);
        document.getElementById('sale-preview').classList.remove('hidden');
        document.getElementById('preview-revenue').innerText = `$${metrics.grossRevenue}`;
        document.getElementById('preview-profit').innerText = `+$${metrics.driverProfit}`;
        document.getElementById('preview-debt').innerText = `+$${metrics.debtIncrease}`;
    }

    function resetModal() {
        selectedQty = 0;
        qtyBtns.forEach(b => b.classList.remove('border-green-500', 'text-green-600', 'bg-green-50'));
        document.getElementById('sale-preview').classList.add('hidden');
        confirmBtn.innerText = "Confirm Sale";
        confirmBtn.disabled = false;
    }
}