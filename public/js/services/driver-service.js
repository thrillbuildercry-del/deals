import { db, doc, setDoc, getDoc, updateDoc, APP_ID } from './firebase.js';
import { PRICING, ECONOMICS } from '../config/constants.js';

// Saves the entire driver state (Offline capable logic)
export const saveDriverState = async (userId, appData) => {
    if (!userId || !appData) return;

    // 1. Calculate Aggregates for Public View (Roster)
    let todaySold = 0;
    let todayProfit = 0;
    let todayGross = 0;

    appData.currentTransactions.forEach(t => {
        todaySold += t.qty;
        todayProfit += t.profit;
        todayGross += t.price;
    });

    try {
        // Save Private Data (Full State)
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'app_state'), {
            json: JSON.stringify(appData),
            lastUpdated: Date.now()
        });

        // Sync Public Data (Summary for Admin)
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'roster', userId), {
            stock: appData.stock,
            debt: appData.debt,
            onlineStatus: appData.onlineStatus || 'offline',
            vehicle: appData.vehicle || {},
            todaySold,
            todayProfit,
            todayGross,
            recentLogs: appData.currentTransactions.slice(-20).reverse(), // Last 20 sales
            history: appData.history.slice(-30) // Last 30 days history
        }, { merge: true });

    } catch (e) {
        console.error("Save failed", e);
    }
};

// Calculates Sale Metrics
export const calculateTransaction = (qty, type) => {
    let price = 0;
    let profit = 0;
    let owed = 0;

    if (type === 'full') {
        // Standard Pricing
        price = PRICING.SINGLE * qty;
        profit = ECONOMICS.DRIVER_PROFIT_PER_ITEM * qty;
    } else {
        // Deal Pricing
        // Logic: Recursively apply 4-pack deal, then remainder
        let remaining = qty;
        const tiers = PRICING.DEAL_TIERS;
        
        while (remaining >= 4) {
            price += tiers[4];
            profit += (ECONOMICS.DRIVER_PROFIT_PER_ITEM * 4);
            remaining -= 4;
        }
        
        if (remaining > 0) {
            price += tiers[remaining];
            profit += (ECONOMICS.DRIVER_PROFIT_PER_ITEM * remaining);
        }
    }

    // Debt logic: Owed = Total collected - Your keep
    owed = price - profit;

    return { price, profit, owed };
};

// Prediction Logic
export const predictWeeklyEarnings = (history) => {
    if (!history || history.length === 0) return 0;
    
    // Get stats for current week (last 7 days)
    const recent = history.slice(-7);
    const totalProfit = recent.reduce((sum, day) => sum + (day.profit || 0), 0);
    const daysActive = recent.length;
    
    if (daysActive === 0) return 0;
    
    const dailyAvg = totalProfit / daysActive;
    return Math.round(dailyAvg * 7);
};