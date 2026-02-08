(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/admin/shifts/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShiftsArchivePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function ShiftsArchivePage() {
    _s();
    const [shifts, setShifts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [expenses, setExpenses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [selectedMonth, setSelectedMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShiftsArchivePage.useEffect": ()=>{
            Promise.all([
                fetch('/api/admin/shifts').then({
                    "ShiftsArchivePage.useEffect": (res)=>res.json()
                }["ShiftsArchivePage.useEffect"]),
                fetch('/api/admin/transactions').then({
                    "ShiftsArchivePage.useEffect": (res)=>res.json()
                }["ShiftsArchivePage.useEffect"]),
                fetch('/api/admin/expenses?archive=true').then({
                    "ShiftsArchivePage.useEffect": (res)=>res.json()
                }["ShiftsArchivePage.useEffect"])
            ]).then({
                "ShiftsArchivePage.useEffect": ([shiftsData, transactionsData, expensesData])=>{
                    console.log('Raw Shifts Data:', shiftsData);
                    console.log('Shifts.data:', shiftsData.data);
                    console.log('Is array?', Array.isArray(shiftsData.data));
                    const sortedShifts = (Array.isArray(shiftsData.data) ? shiftsData.data : []).sort({
                        "ShiftsArchivePage.useEffect.sortedShifts": (a, b)=>new Date(b.closedAt || '').getTime() - new Date(a.closedAt || '').getTime()
                    }["ShiftsArchivePage.useEffect.sortedShifts"]);
                    console.log('Sorted shifts:', sortedShifts);
                    setShifts(sortedShifts);
                    setTransactions(Array.isArray(transactionsData.data) ? transactionsData.data : []);
                    setExpenses(Array.isArray(expensesData.data) ? expensesData.data : []);
                    if (sortedShifts.length > 0 && sortedShifts[0].closedAt) {
                        const firstMonth = new Date(sortedShifts[0].closedAt);
                        setSelectedMonth(formatMonthKey(firstMonth));
                    }
                }
            }["ShiftsArchivePage.useEffect"]).catch({
                "ShiftsArchivePage.useEffect": (err)=>console.error('Error loading data:', err)
            }["ShiftsArchivePage.useEffect"]).finally({
                "ShiftsArchivePage.useEffect": ()=>setIsLoading(false)
            }["ShiftsArchivePage.useEffect"]);
        }
    }["ShiftsArchivePage.useEffect"], []);
    const formatMonthKey = (date)=>{
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    const getMonthName = (monthKey)=>{
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('uk-UA', {
            month: 'long',
            year: 'numeric'
        });
    };
    const shiftsByMonth = shifts.reduce((acc, shift)=>{
        if (!shift.closedAt) return acc;
        const monthKey = formatMonthKey(new Date(shift.closedAt));
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(shift);
        return acc;
    }, {});
    const months = Object.keys(shiftsByMonth).sort().reverse();
    console.log('RENDER: shifts.length=' + shifts.length + ', months.length=' + months.length);
    const formatDate = (dateString)=>{
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const formatCurrency = (value)=>{
        if (value === null) return '—';
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 2
        }).format(value);
    };
    const calculateDifference = (cashStart, cashEnd)=>{
        if (cashStart === null || cashEnd === null) return null;
        return cashEnd - cashStart;
    };
    const getDaysCount = ()=>{
        if (shifts.length === 0) return 0;
        const totalCash = shifts.reduce((sum, shift)=>{
            if (shift.cashEnd !== null) return sum + shift.cashEnd;
            return sum;
        }, 0);
        return totalCash;
    };
    const getAverageCash = ()=>{
        if (shifts.length === 0) return 0;
        return getDaysCount() / shifts.length;
    };
    const getMonthStats = ()=>{
        if (!selectedMonth) return null;
        const monthShifts = shiftsByMonth[selectedMonth] || [];
        const monthShiftIds = monthShifts.map((s)=>s.id);
        const monthTransactions = transactions.filter((t)=>monthShiftIds.includes(t.shiftId));
        const monthExpenses = expenses.filter((e)=>monthShiftIds.includes(e.shiftId));
        const cashTransactions = monthTransactions.filter((t)=>t.paymentMethod === 'CASH');
        const cardTransactions = monthTransactions.filter((t)=>t.paymentMethod === 'CARD');
        const totalCashIncome = cashTransactions.reduce((sum, t)=>sum + t.amount, 0);
        const totalCardIncome = cardTransactions.reduce((sum, t)=>sum + t.amount, 0);
        const totalExpenses = monthExpenses.reduce((sum, e)=>sum + e.amount, 0);
        const totalIncome = totalCashIncome + totalCardIncome;
        // Статистика по працівниках
        const userStats = new Map();
        monthTransactions.forEach((t)=>{
            const existing = userStats.get(t.userId) || {
                name: t.user.name || t.user.login,
                transactions: 0,
                amount: 0
            };
            userStats.set(t.userId, {
                name: existing.name,
                transactions: existing.transactions + 1,
                amount: existing.amount + t.amount
            });
        });
        return {
            shifts: monthShifts.length,
            totalIncome,
            totalCashIncome,
            totalCardIncome,
            totalExpenses,
            profit: totalIncome - totalExpenses,
            transactions: monthTransactions.length,
            userStats: Array.from(userStats.entries()).map(([id, data])=>({
                    id,
                    ...data
                })).sort((a, b)=>b.amount - a.amount)
        };
    };
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center py-20",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/shifts/page.tsx",
                                lineNumber: 215,
                                columnNumber: 8
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-slate-600 text-lg",
                                children: "Завантаження архіву…"
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/shifts/page.tsx",
                                lineNumber: 216,
                                columnNumber: 8
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                        lineNumber: 214,
                        columnNumber: 7
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                    lineNumber: 213,
                    columnNumber: 6
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/admin/shifts/page.tsx",
                lineNumber: 212,
                columnNumber: 5
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/admin/shifts/page.tsx",
            lineNumber: 211,
            columnNumber: 4
        }, this);
    }
    const hasData = shifts.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-6 sm:mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl sm:text-4xl font-bold text-slate-900",
                            children: "📋 Архів змін"
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 230,
                            columnNumber: 6
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-slate-600 mt-2 text-base sm:text-lg",
                            children: "Історія всіх закритих змін і звітів"
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 231,
                            columnNumber: 6
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                    lineNumber: 229,
                    columnNumber: 5
                }, this),
                !hasData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-lg shadow-md p-12 text-center border border-slate-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-3xl mb-4",
                            children: "📭"
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 238,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-slate-600 text-lg font-medium",
                            children: "Поки що немає закритих змін"
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 239,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-slate-500 mt-2",
                            children: "Архив буде заповнюватися по мірі закриття змін"
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 242,
                            columnNumber: 7
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                    lineNumber: 237,
                    columnNumber: 6
                }, this),
                hasData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-xl shadow-md p-6 border border-slate-200",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-lg font-bold text-slate-900 mb-5 flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-2xl",
                                            children: "🗓️"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 253,
                                            columnNumber: 9
                                        }, this),
                                        "Архів по місяцях"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                    lineNumber: 252,
                                    columnNumber: 8
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
                                    children: months.map((monthKey)=>{
                                        const count = shiftsByMonth[monthKey].length;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setSelectedMonth(monthKey),
                                            className: `px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${selectedMonth === monthKey ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-2xl leading-tight",
                                                    children: monthKey.split('-')[0]
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 269,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-opacity-75 mt-0.5",
                                                    children: new Date(parseInt(monthKey.split('-')[0]), parseInt(monthKey.split('-')[1]) - 1).toLocaleDateString('uk-UA', {
                                                        month: 'short'
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `text-sm font-bold mt-1 ${selectedMonth === monthKey ? 'text-blue-100' : 'text-slate-600'}`,
                                                    children: [
                                                        count,
                                                        ' ',
                                                        count % 10 === 1 && count !== 11 ? 'зміна' : 'змін'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 278,
                                                    columnNumber: 12
                                                }, this)
                                            ]
                                        }, monthKey, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 260,
                                            columnNumber: 11
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                    lineNumber: 256,
                                    columnNumber: 8
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 251,
                            columnNumber: 7
                        }, this),
                        selectedMonth && shiftsByMonth[selectedMonth] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-gradient-to-br from-blue-600 via-blue-650 to-blue-700 text-white px-8 py-6 flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-2xl font-bold",
                                                            children: [
                                                                "📅 ",
                                                                getMonthName(selectedMonth)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 296,
                                                            columnNumber: 12
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-blue-100 text-sm mt-2",
                                                            children: [
                                                                shiftsByMonth[selectedMonth].length,
                                                                ' ',
                                                                shiftsByMonth[selectedMonth].length % 10 === 1 && shiftsByMonth[selectedMonth].length !== 11 ? 'зміна' : 'змін'
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 299,
                                                            columnNumber: 12
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 295,
                                                    columnNumber: 11
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-3xl sm:text-4xl font-bold text-blue-100",
                                                        children: shiftsByMonth[selectedMonth].length
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                        lineNumber: 308,
                                                        columnNumber: 12
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 307,
                                                    columnNumber: 11
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 294,
                                            columnNumber: 10
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "overflow-x-auto",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                className: "w-full",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                        className: "bg-slate-50 border-b border-slate-200",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-left font-bold text-slate-900",
                                                                    children: "ID"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 318,
                                                                    columnNumber: 14
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-left font-bold text-slate-900",
                                                                    children: "Відкрито"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 321,
                                                                    columnNumber: 14
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-left font-bold text-slate-900",
                                                                    children: "Закрито"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 324,
                                                                    columnNumber: 14
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-right font-bold text-slate-900",
                                                                    children: "Каса на старт"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 327,
                                                                    columnNumber: 14
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-right font-bold text-slate-900",
                                                                    children: "Каса на закрит"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 330,
                                                                    columnNumber: 14
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-right font-bold text-slate-900",
                                                                    children: "Різниця"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 333,
                                                                    columnNumber: 14
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-6 py-4 text-center font-bold text-slate-900",
                                                                    children: "Деталі"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 336,
                                                                    columnNumber: 14
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 317,
                                                            columnNumber: 13
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                        lineNumber: 316,
                                                        columnNumber: 12
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                        className: "divide-y divide-slate-200",
                                                        children: shiftsByMonth[selectedMonth].map((shift, index)=>{
                                                            const difference = calculateDifference(shift.cashStart, shift.cashEnd);
                                                            const isProfit = difference && difference > 0;
                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                className: `transition-colors hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm",
                                                                            children: shift.id
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 357,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 356,
                                                                        columnNumber: 16
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4 text-sm text-slate-700",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "font-medium",
                                                                            children: formatDate(shift.openedAt)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 362,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 361,
                                                                        columnNumber: 16
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4 text-sm text-slate-700",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "font-medium",
                                                                            children: formatDate(shift.closedAt)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 367,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 366,
                                                                        columnNumber: 16
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4 text-right text-sm",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold",
                                                                            children: formatCurrency(shift.cashStart)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 372,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 371,
                                                                        columnNumber: 16
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4 text-right text-sm",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-semibold",
                                                                            children: formatCurrency(shift.cashEnd)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 377,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 376,
                                                                        columnNumber: 16
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4 text-right text-sm",
                                                                        children: difference !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: `inline-block px-3 py-1 rounded-lg font-bold ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
                                                                            children: [
                                                                                isProfit ? '+' : '',
                                                                                formatCurrency(difference)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 383,
                                                                            columnNumber: 18
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 381,
                                                                        columnNumber: 16
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-6 py-4 text-center",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            href: `/admin/shifts/${shift.id}`,
                                                                            className: "inline-block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors",
                                                                            children: "Детальніше →"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 396,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 395,
                                                                        columnNumber: 16
                                                                    }, this)
                                                                ]
                                                            }, shift.id, true, {
                                                                fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                lineNumber: 350,
                                                                columnNumber: 15
                                                            }, this);
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                        lineNumber: 341,
                                                        columnNumber: 12
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                lineNumber: 315,
                                                columnNumber: 11
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 314,
                                            columnNumber: 10
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-slate-700",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-slate-900",
                                                            children: shiftsByMonth[selectedMonth].length
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 412,
                                                            columnNumber: 12
                                                        }, this),
                                                        ' ',
                                                        shiftsByMonth[selectedMonth].length % 10 === 1 && shiftsByMonth[selectedMonth].length !== 11 ? 'зміна' : 'змін',
                                                        ' ',
                                                        "у ",
                                                        getMonthName(selectedMonth).toLowerCase()
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 411,
                                                    columnNumber: 11
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right text-xs text-slate-500",
                                                    children: "Прокрутіть для див. деталей →"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 421,
                                                    columnNumber: 11
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 410,
                                            columnNumber: 10
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                    lineNumber: 293,
                                    columnNumber: 9
                                }, this),
                                getMonthStats() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-slate-500 text-sm uppercase tracking-wider font-semibold",
                                                            children: "Загальний дохід"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 433,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xl sm:text-3xl font-bold text-green-600 mt-2 break-all leading-tight",
                                                            children: formatCurrency(getMonthStats().totalIncome)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 436,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-slate-400 mt-2",
                                                            children: [
                                                                getMonthStats().transactions,
                                                                " операцій"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 439,
                                                            columnNumber: 13
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 432,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-slate-500 text-sm uppercase tracking-wider font-semibold",
                                                            children: "Готівка"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 445,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xl sm:text-3xl font-bold text-blue-600 mt-2 break-all leading-tight",
                                                            children: formatCurrency(getMonthStats().totalCashIncome)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 448,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-slate-400 mt-2",
                                                            children: getMonthStats().totalCashIncome > 0 ? '💵' : ''
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 451,
                                                            columnNumber: 13
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 444,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-slate-500 text-sm uppercase tracking-wider font-semibold",
                                                            children: "Карта"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 457,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xl sm:text-3xl font-bold text-purple-600 mt-2 break-all leading-tight",
                                                            children: formatCurrency(getMonthStats().totalCardIncome)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 460,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-slate-400 mt-2",
                                                            children: getMonthStats().totalCardIncome > 0 ? '💳' : ''
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 463,
                                                            columnNumber: 13
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 456,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-slate-500 text-sm uppercase tracking-wider font-semibold",
                                                            children: "Витрати"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 469,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xl sm:text-3xl font-bold text-red-600 mt-2 break-all leading-tight",
                                                            children: formatCurrency(getMonthStats().totalExpenses)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 472,
                                                            columnNumber: 13
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-slate-400 mt-2",
                                                            children: "Усього видатків"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 475,
                                                            columnNumber: 13
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 468,
                                                    columnNumber: 12
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 431,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-5 sm:p-8 border border-green-200",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-lg font-bold text-green-900 mb-2",
                                                    children: "📈 Чистий прибуток"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 483,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-3xl sm:text-5xl font-bold text-green-600 break-all leading-tight",
                                                    children: formatCurrency(getMonthStats().profit)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 486,
                                                    columnNumber: 12
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-green-700 mt-3",
                                                    children: [
                                                        "Дохід: ",
                                                        formatCurrency(getMonthStats().totalIncome),
                                                        " - Витрати:",
                                                        ' ',
                                                        formatCurrency(getMonthStats().totalExpenses)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 489,
                                                    columnNumber: 12
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 482,
                                            columnNumber: 11
                                        }, this),
                                        getMonthStats().userStats.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-lg font-bold text-slate-900 mb-5 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-2xl",
                                                            children: "👥"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 500,
                                                            columnNumber: 14
                                                        }, this),
                                                        "Особисті продажі касирів"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 499,
                                                    columnNumber: 13
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-3",
                                                    children: getMonthStats().userStats.map((user, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center gap-4 flex-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm",
                                                                            children: index + 1
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 510,
                                                                            columnNumber: 17
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "font-semibold text-slate-900",
                                                                                    children: user.name
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                                    lineNumber: 514,
                                                                                    columnNumber: 18
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "text-xs text-slate-500",
                                                                                    children: [
                                                                                        user.transactions,
                                                                                        " операцій"
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                                    lineNumber: 517,
                                                                                    columnNumber: 18
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                            lineNumber: 513,
                                                                            columnNumber: 17
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 509,
                                                                    columnNumber: 16
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-right min-w-0",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "font-bold text-sm sm:text-lg text-slate-900 break-all leading-tight",
                                                                        children: formatCurrency(user.amount)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                        lineNumber: 523,
                                                                        columnNumber: 17
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                                    lineNumber: 522,
                                                                    columnNumber: 16
                                                                }, this)
                                                            ]
                                                        }, user.id, true, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 505,
                                                            columnNumber: 15
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 503,
                                                    columnNumber: 13
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 498,
                                            columnNumber: 12
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                    lineNumber: 429,
                                    columnNumber: 10
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 292,
                            columnNumber: 8
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-5 sm:p-8 border border-slate-700 text-white",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-lg font-bold mb-2 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-3xl",
                                                            children: "📊"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                            lineNumber: 542,
                                                            columnNumber: 11
                                                        }, this),
                                                        "Статистика архіву"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 541,
                                                    columnNumber: 10
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-slate-300 text-sm",
                                                    children: "Усього зберігається в системі"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 545,
                                                    columnNumber: 10
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 540,
                                            columnNumber: 9
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-right",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-3xl sm:text-5xl font-bold text-blue-400",
                                                    children: shifts.length
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 550,
                                                    columnNumber: 10
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-slate-400 text-sm mt-1 font-medium",
                                                    children: shifts.length % 10 === 1 && shifts.length !== 11 ? 'зміна' : 'змін'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 553,
                                                    columnNumber: 10
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 549,
                                            columnNumber: 9
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                    lineNumber: 539,
                                    columnNumber: 8
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-700",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-slate-400 text-xs uppercase tracking-wider mb-1",
                                                    children: "Місяців"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 564,
                                                    columnNumber: 10
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-2xl font-bold text-blue-400",
                                                    children: months.length
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 567,
                                                    columnNumber: 10
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 563,
                                            columnNumber: 9
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-slate-400 text-xs uppercase tracking-wider mb-1",
                                                    children: "Загальна сума кас"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 572,
                                                    columnNumber: 10
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm sm:text-lg font-bold text-green-400 break-all leading-tight",
                                                    children: formatCurrency(getDaysCount())
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 575,
                                                    columnNumber: 10
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 571,
                                            columnNumber: 9
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-slate-400 text-xs uppercase tracking-wider mb-1",
                                                    children: "Середня каса"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 580,
                                                    columnNumber: 10
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm sm:text-lg font-bold text-purple-400 break-all leading-tight",
                                                    children: formatCurrency(getAverageCash())
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                                    lineNumber: 583,
                                                    columnNumber: 10
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                                            lineNumber: 579,
                                            columnNumber: 9
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                                    lineNumber: 562,
                                    columnNumber: 8
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/admin/shifts/page.tsx",
                            lineNumber: 538,
                            columnNumber: 7
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/admin/shifts/page.tsx",
                    lineNumber: 249,
                    columnNumber: 6
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/admin/shifts/page.tsx",
            lineNumber: 228,
            columnNumber: 4
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/admin/shifts/page.tsx",
        lineNumber: 227,
        columnNumber: 3
    }, this);
}
_s(ShiftsArchivePage, "WArILwOFFq8sNjCqhy0bZd5vH8Q=");
_c = ShiftsArchivePage;
var _c;
__turbopack_context__.k.register(_c, "ShiftsArchivePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_admin_shifts_page_tsx_bf9acf67._.js.map