if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW Registered', reg);
        }).catch(err => {
            console.log('SW Failed', err);
        });
    });
}

const DB_KEY = 'ugp_v37_final';
const GH_OWNER = 'syedahsanzafar';
const GH_REPO = 'Unique_POS';
const GH_PATH = 'Unique_Dbs.json';
const GH_TOKEN = ''; // Enter token in the System tab UI instead

let myChart = null;
let topSellersChart = null;
let payableChart = null;

let db = JSON.parse(localStorage.getItem(DB_KEY)) || { items: [], customers: [], payments: [], salesHistory: [], purchases: [], royaltyPayments: [], labours: [], lastModified: Date.now() };

// Load GH Token from localStorage or hardcoded constant
window.addEventListener('load', () => {
    const savedToken = localStorage.getItem('gh_token') || GH_TOKEN;
    if (savedToken) document.getElementById('gh-token').value = savedToken;
});

document.getElementById('gh-token')?.addEventListener('change', (e) => {
    localStorage.setItem('gh_token', e.target.value);
});

// Data Migration / Sanitization
if (!db.purchases) db.purchases = [];
if (!db.royaltyPayments) db.royaltyPayments = [];
if (!db.labours) db.labours = [];
if (!db.lastModified) db.lastModified = Date.now();
if (db.customers) db.customers.forEach(c => { if (c.phone === undefined) c.phone = ''; });

let cart = [];
let currentEditCust = null;

function sortItems(list) {
    return [...list].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const grammarA = nameA.includes('grammar');
        const grammarB = nameB.includes('grammar');
        const heA = nameA.includes('home economics');
        const heB = nameB.includes('home economics');
        if (grammarA && !grammarB) return -1;
        if (!grammarA && grammarB) return 1;
        if (heA && !heB) return -1;
        if (!heA && heB) return 1;
        return nameA.localeCompare(nameB);
    });
}

/* --- FISCAL YEAR HELPERS --- */
function getFiscalYearRange() {
    const now = new Date();
    let startYear = now.getFullYear();
    // Month is 0-indexed (0=Jan, 5=Jun)
    if (now.getMonth() < 5 || (now.getMonth() === 5 && now.getDate() <= 20)) {
        startYear--;
    }
    const start = new Date(startYear, 5, 21);
    const end = new Date(startYear + 1, 5, 20, 23, 59, 59);
    return {
        start, end,
        label: `21 Jun ${startYear} - 20 Jun ${startYear + 1}`,
        isCurrent: (d) => {
            const dt = new Date(d);
            return dt >= start && dt <= end;
        }
    };
}

/* --- RICH SELECT LOGIC --- */
function initRichSelect(containerId, targetSelectId, items, placeholder = "Select Item...") {
    const container = document.getElementById(containerId);
    const targetSelect = document.getElementById(targetSelectId);
    if (!container || !targetSelect) return;

    let isOpen = false;
    let searchTerm = "";

    function render() {
        container.innerHTML = `
                    <div class="rich-select-toggle" onclick="toggleRS('${containerId}')">
                        <div class="selected-info">
                            ${getSelectedDisplay()}
                        </div>
                        <span style="font-size: 10px; color: var(--slate-400);">▼</span>
                    </div>
                    <div class="rich-select-dropdown" id="rs-dropdown-${containerId}">
                        <div class="rich-select-search">
                            <input type="text" placeholder="Search item..." oninput="searchRS('${containerId}', this.value)" onclick="event.stopPropagation()">
                        </div>
                        <div class="rich-select-results">
                            ${getFilteredItems().map(item => `
                                <div class="rich-select-item ${targetSelect.value == item.id ? 'selected' : ''}" onclick="selectRS('${containerId}', '${targetSelectId}', ${item.id})">
                                    ${item.image ? `<img src="${item.image}">` : `<div style="width:36px; height:36px; background:var(--slate-100); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:18px;">📦</div>`}
                                    <div class="item-text">
                                        <span class="item-name">${item.name}</span>
                                        <span class="item-sub">Price: RS ${item.price} | Stock: ${item.stock}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
    }

    function getSelectedDisplay() {
        const val = targetSelect.value;
        const item = items.find(i => i.id == val);
        if (item) {
            return `
                        ${item.image ? `<img src="${item.image}" class="selected-img">` : `<span style="font-size:16px;">📦</span>`}
                        <span style="font-weight: 700;">${item.name}</span>
                    `;
        }
        return `<span style="color: var(--slate-400);">${placeholder}</span>`;
    }

    function getFilteredItems() {
        if (!searchTerm) return items;
        return items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Expose control functions globally for simple event handling
    window.toggleRS = (id) => {
        const dropdown = document.getElementById(`rs-dropdown-${id}`);
        const allDropdowns = document.querySelectorAll('.rich-select-dropdown');
        const willShow = !dropdown.classList.contains('show');

        allDropdowns.forEach(d => d.classList.remove('show'));
        if (willShow) {
            dropdown.classList.add('show');
            dropdown.querySelector('input').focus();
        }
    };

    window.searchRS = (cid, term) => {
        searchTerm = term;
        const results = container.querySelector('.rich-select-results');
        results.innerHTML = getFilteredItems().map(item => `
                    <div class="rich-select-item ${targetSelect.value == item.id ? 'selected' : ''}" onclick="selectRS('${cid}', '${targetSelectId}', ${item.id})">
                        ${item.image ? `<img src="${item.image}">` : `<div style="width:36px; height:36px; background:var(--slate-100); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:18px;">📦</div>`}
                        <div class="item-text">
                            <span class="item-name">${item.name}</span>
                            <span class="item-sub">Price: RS ${item.price} | Stock: ${item.stock}</span>
                        </div>
                    </div>
                `).join('');
    };

    window.selectRS = (cid, sid, val) => {
        const sel = document.getElementById(sid);
        sel.value = val;
        sel.dispatchEvent(new Event('change'));
        document.getElementById(`rs-dropdown-${cid}`).classList.remove('show');
        searchTerm = "";
        // Re-render specifically this container to update toggle display
        // Note: refreshUI will eventually call initRichSelect again, which is fine
        const c = document.getElementById(cid);
        const itemsList = db.items.sort((a, b) => a.name.localeCompare(b.name));
        initRichSelect(cid, sid, itemsList);
    };

    render();
}

// Global click to close dropdowns
window.addEventListener('click', (e) => {
    if (!e.target.closest('.rich-select-container')) {
        document.querySelectorAll('.rich-select-dropdown').forEach(d => d.classList.remove('show'));
    }
});

async function cloudBackup(silent = false) {
    const status = document.getElementById('cloud-status');
    const syncInd = document.getElementById('sync-indicator');
    const token = document.getElementById('gh-token')?.value || localStorage.getItem('gh_token');

    if (!token) {
        if (!silent) alert("Please enter your GitHub Access Token (PWD) in the Database tab.");
        return;
    }

    if (!silent && status) {
        status.style.color = "var(--blue)";
        status.innerText = "⏳ Uploading to GitHub...";
    }
    if (syncInd) syncInd.innerText = "🔄 Pushing...";

    try {
        // Update timestamp before pushing
        db.lastModified = Date.now();
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));

        // 1. Get current SHA if it exists
        let sha = null;
        try {
            const getRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?v=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (getRes.ok) {
                const fileData = await getRes.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log("File might not exist yet or connection error");
        }

        // 2. PUT update
        const response = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: `Cloud Backup: ${new Date().toLocaleString()}`,
                content: content,
                sha: sha
            })
        });

        if (response.ok) {
            if (!silent && status) { status.style.color = "var(--green)"; status.innerText = "✅ GitHub Backup Successful!"; }
            if (syncInd) { syncInd.innerText = "✓ UPLOADED TO GITHUB"; setTimeout(() => { if (syncInd.innerText.includes("UPLOADED")) syncInd.innerText = ""; }, 3000); }
        }
        else {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to upload');
        }
    } catch (e) {
        console.error(e);
        if (!silent && status) { status.style.color = "var(--red)"; status.innerText = `❌ GitHub Failed: ${e.message}`; }
        if (syncInd) { syncInd.innerText = "⚠ GITHUB FAILED"; setTimeout(() => { if (syncInd.innerText.includes("FAILED")) syncInd.innerText = ""; }, 5000); }
    }
}

async function cloudRestore() {
    if (!confirm("This will replace all local data with the GitHub version. Proceed?")) return;
    const status = document.getElementById('cloud-status');
    const syncInd = document.getElementById('sync-indicator');
    const token = document.getElementById('gh-token')?.value || localStorage.getItem('gh_token');

    status.style.color = "var(--blue)";
    status.innerText = "⏳ Downloading from GitHub...";
    if (syncInd) syncInd.innerText = "⏳ PULLING...";

    try {
        const headers = token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3.raw' } : { 'Accept': 'application/vnd.github.v3.raw' };
        const response = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?v=${Date.now()}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            db = await response.json();
            if (!db.purchases) db.purchases = [];
            if (db.customers) db.customers.forEach(c => { if (c.phone === undefined) c.phone = ''; });
            saveData(false);
            status.style.color = "var(--green)";
            status.innerText = "✅ GitHub Restore Successful!";
            if (syncInd) { syncInd.innerText = "✓ PULLED FROM GITHUB"; setTimeout(() => { if (syncInd.innerText.includes("PULLED")) syncInd.innerText = ""; }, 3000); }
            refreshUI();
        }
        else { throw new Error('Failed to download from GitHub'); }
    } catch (e) {
        console.error(e);
        status.style.color = "var(--red)";
        status.innerText = "❌ Restore Failed. Check token/internet.";
    }
}

// Helper function to resize and encode images to base64
function resizeAndEncodeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 with reduced quality for smaller file size
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(base64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function toggleDetails(card) {
    const details = card.querySelector('.stat-details');
    if (details.style.maxHeight && details.style.maxHeight !== '0px') {
        details.style.maxHeight = '0px';
        details.style.opacity = '0';
        details.style.marginTop = '0';
    } else {
        details.style.maxHeight = '200px'; // Increased height for tables
        details.style.opacity = '1';
        details.style.marginTop = '10px';
    }
}

// Helper to create small tables for dashboard card details
function createMiniTable(data, headers, rowMapper) {
    if (data.length === 0) return 'No data available.';
    const headRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const rows = data.map(item => `<tr>${rowMapper(item).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    return `<table><thead>${headRow}</thead><tbody>${rows}</tbody></table>`;
}

function renderDashboard() {
    const history = db.salesHistory || [];
    const items = sortItems(db.items || []);
    const customers = db.customers || [];
    const payments = db.payments || [];

    const fiscal = getFiscalYearRange();
    const annualHistory = history.filter(h => fiscal.isCurrent(h.date));

    // 1. Calculate General Metrics
    const totalSaleAnnual = Math.round(annualHistory.reduce((a, b) => a + b.billTotal, 0));
    const totalReceivable = Math.round(customers.reduce((a, b) => a + b.balance, 0));

    // 2. Payments Calculations (Cumulative as requested)
    const todayDate = new Date().toLocaleDateString();
    const paymentsToday = payments.filter(p => p.date.split(',')[0] === todayDate);
    const todayPayTotal = Math.round(paymentsToday.reduce((a, b) => a + b.amount, 0));
    const totalPayTotal = Math.round(payments.reduce((a, b) => a + b.amount, 0));

    // 3. Asset Value Calculation (Cumulative as requested)
    let assetValue = 0;
    let totalItems = items.length;
    items.forEach(i => {
        const name = i.name.toLowerCase();
        const retail = i.price * i.stock;
        let val = retail;
        if (name.includes("urdu grammar") || name.includes("english grammar") || name.includes("home economics 8")) {
            val = retail * 0.65;
        }
        else if (name.includes("home economics 6") || name.includes("home economics 7")) {
            val = retail * 0.784;
        }
        assetValue += val;
    });

    // 4. Royalty Calculation (Annual)
    let roy15 = 0, roy10 = 0, roy1_6 = 0;
    annualHistory.forEach(inv => inv.items.forEach(sold => {
        const name = sold.name.toLowerCase();
        const val = sold.rate * sold.qty;
        if (name.includes("home economics 8")) roy15 += val * 0.15;
        else if (name.includes("grammar")) roy10 += val * 0.10;
        else if (name.includes("home economics 6") || name.includes("home economics 7")) roy1_6 += val * 0.016;
    }));
    const totalRoyaltyAnnual = roy15 + roy10 + roy1_6;

    // 5. Royalty Payments (Annual)
    const royPayments = db.royaltyPayments || [];
    const annualRoyPayments = royPayments.filter(p => fiscal.isCurrent(p.date));
    const totalRoyPaidAnnual = annualRoyPayments.reduce((a, b) => a + b.amount, 0);
    const netPayableRoyalty = totalRoyaltyAnnual - totalRoyPaidAnnual;


    // --- UPDATE DOM ---

    // 1. Sales (Annual)
    document.getElementById('dash-total-sale').innerText = `RS ${totalSaleAnnual.toLocaleString()}`;
    document.getElementById('dash-sale-detail').innerHTML = `Current Year: ${fiscal.label}<br>${annualHistory.length} invoices this year`;

    // 2. Receivable (Cumulative)
    document.getElementById('dash-total-receive').innerText = `RS ${totalReceivable.toLocaleString()}`;
    document.getElementById('dash-receive-detail').innerText = `${customers.filter(c => c.balance > 0).length} customers owe money`;

    // 3. Royalty (Annual)
    document.getElementById('dash-total-tax').innerText = `RS ${Math.round(netPayableRoyalty).toLocaleString()}`;
    document.getElementById('dash-royalty-detail').innerHTML = `
                Gross Royalty: RS ${Math.round(totalRoyaltyAnnual).toLocaleString()}<br>
                Paid This Year: RS ${Math.round(totalRoyPaidAnnual).toLocaleString()}<br><br>
                Breakdown:<br>
                HE8 (15%): ${Math.round(roy15).toLocaleString()}<br>
                Grammar (10%): ${Math.round(roy10).toLocaleString()}<br>
                HE6/7 (1.6%): ${Math.round(roy1_6).toLocaleString()}
            `;

    // 4. Royalty Paid (Annual)
    document.getElementById('dash-total-roy-paid').innerText = `RS ${Math.round(totalRoyPaidAnnual).toLocaleString()}`;
    document.getElementById('dash-roy-paid-detail').innerHTML = createMiniTable(
        annualRoyPayments.slice(0, 5),
        ['Date', 'Ref', 'Amount'],
        (p) => [p.date, p.ref, `RS ${p.amount.toLocaleString()}`]
    );

    // 4. Asset Value... (Others remain global)
    document.getElementById('dash-stock-val').innerText = `RS ${Math.round(assetValue).toLocaleString()}`;
    document.getElementById('dash-stock-detail').innerText = `${totalItems} unique items in stock`;

    document.getElementById('dash-today-pay').innerText = `RS ${todayPayTotal.toLocaleString()}`;
    document.getElementById('dash-today-pay-detail').innerText = `${paymentsToday.length} transactions today`;

    document.getElementById('dash-total-pay').innerText = `RS ${totalPayTotal.toLocaleString()}`;
    document.getElementById('dash-total-pay-detail').innerText = `Total collected from ${payments.length} transactions`;


    // --- CHARTS & LISTS (Annual) ---
    const itemStats = items.map(item => {
        let qty = 0, revenue = 0;
        annualHistory.forEach(inv => inv.items.forEach(sold => { if (sold.id === item.id) { qty += sold.qty; revenue += sold.total; } }));
        return { id: item.id, name: item.name, qty, revenue, stock: item.stock, target: item.target || 0 };
    });

    const customerSalesAnnual = customers.map(cust => {
        let revenue = 0;
        annualHistory.forEach(inv => { if (inv.customerId === cust.id) revenue += inv.billTotal; });
        return { name: cust.name, revenue: revenue };
    });

    const sortedItems = [...itemStats].sort((a, b) => b.revenue - a.revenue);
    document.getElementById('dash-item-list').innerHTML = sortedItems.map(i => {
        const prog = i.target > 0 ? (i.qty / i.target * 100).toFixed(0) : 0;
        const color = prog >= 100 ? '#10b981' : (prog >= 50 ? '#f59e0b' : '#3b82f6');
        return `
                <tr class="dash-row" onclick="showItemDetail(${i.id}, '${i.name.replace(/'/g, "\\'")}')">
                    <td>${i.name}</td>
                    <td style="text-align:center;">${i.qty.toLocaleString()}</td>
                    <td style="text-align:center; color:#94a3b8; font-size:11px;">${(i.target || 0).toLocaleString()}</td>
                    <td style="text-align:center;">
                        <span style="font-weight:700; color:${color}; font-size:12px;">${prog}%</span>
                    </td>
                    <td style="text-align:right;">RS ${Math.round(i.revenue).toLocaleString()}</td>
                </tr>
            `;
    }).join('');

    const ctx1 = document.getElementById('salesChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: itemStats.map(i => i.name),
            datasets: [
                { label: 'Annual Qty Sold', data: itemStats.map(i => i.qty), backgroundColor: '#6366f1' },
                { label: 'Annual Target', data: itemStats.map(i => i.target), backgroundColor: '#94a3b8', type: 'line', borderColor: '#94a3b8', borderDash: [5, 5], fill: false, hidden: true },
                { label: 'Current Stock', data: itemStats.map(i => i.stock), backgroundColor: 'rgba(203, 213, 225, 0.5)' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const top10CustAnnual = [...customerSalesAnnual].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const ctx2 = document.getElementById('topSellersChart').getContext('2d');
    if (topSellersChart) topSellersChart.destroy();
    topSellersChart = new Chart(ctx2, { type: 'doughnut', data: { labels: top10CustAnnual.map(c => c.name), datasets: [{ data: top10CustAnnual.map(c => c.revenue), backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } }, title: { display: true, text: 'Top Customers (Current Year)' } } } });

    const payableCust = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
    const ctx3 = document.getElementById('payableChart').getContext('2d');
    if (payableChart) payableChart.destroy();
    payableChart = new Chart(ctx3, { type: 'pie', data: { labels: payableCust.map(c => c.name), datasets: [{ data: payableCust.map(c => c.balance), backgroundColor: ['#f59e0b', '#2563eb', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } } } } });
}

function switchView(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');

    // --- FULL SCREEN LOGIC ---
    if (id === 'dashboard') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.log("FS Error:", e));
        }
    }

    refreshUI();
}

function deleteInvoice(invNum) {
    if (!confirm(`Delete Invoice #${invNum}? Stock and balances will be reverted.`)) return;
    const index = db.salesHistory.findIndex(s => s.inv === invNum);
    if (index === -1) return;
    const record = db.salesHistory[index];
    const cust = db.customers.find(c => c.id === record.customerId);
    if (cust) cust.balance -= record.billTotal;
    record.items.forEach(soldItem => {
        const item = db.items.find(i => i.id === soldItem.id);
        if (item) item.stock += soldItem.qty;
    });
    db.salesHistory.splice(index, 1);
    saveData();
}



function openEdit(id) {
    currentEditCust = db.customers.find(c => c.id === id);
    if (!currentEditCust) return;
    document.getElementById('modalTitle').innerText = `Discounts for ${currentEditCust.name}`;
    const list = document.getElementById('discountList');
    if (!currentEditCust.discounts) currentEditCust.discounts = {};
    list.innerHTML = sortItems(db.items).map(item => {
        const imgHtml = item.image
            ? `<img src="${item.image}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; border:1px solid var(--slate-200);">`
            : `<div style="width:24px; height:24px; background:var(--slate-100); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:12px;">📦</div>`;
        return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${imgHtml}
                        <span style="font-size:13px;">${item.name}</span>
                    </div>
                    <input type="number" style="width:80px; padding:4px;" value="${currentEditCust.discounts[item.id] || ''}" onchange="updateCustDisc(${item.id}, this.value)">
                </div>
            `;
    }).join('');
    document.getElementById('editModal').style.display = 'flex';
}

function updateCustDisc(itemId, value) { if (currentEditCust) currentEditCust.discounts[itemId] = parseFloat(value) || 0; }
function closeModal() { document.getElementById('editModal').style.display = 'none'; saveData(); }

function refreshUI() {
    const sc = document.getElementById('s-cust'),
        pc = document.getElementById('p-cust'),
        rc = document.getElementById('r-cust'),
        pi = document.getElementById('pur-item'),
        si = document.getElementById('s-item');

    if (sc) {
        sc.innerHTML = '<option value="">Select Customer...</option>';
        pc.innerHTML = pi.innerHTML = '<option value="">Select...</option>';
        rc.innerHTML = '<option value="">All Customers</option>';
        if (si) si.innerHTML = '<option value="">Select...</option>';

        db.customers.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => { const opt = `<option value="${c.id}">${c.name}</option>`; sc.innerHTML += opt; pc.innerHTML += opt; rc.innerHTML += opt; });

        const sortedItems = sortItems(db.items);
        sortedItems.forEach(i => {
            const opt = `<option value="${i.id}">${i.name}</option>`;
            if (si) si.innerHTML += opt;
            pi.innerHTML += opt;
        });

        // --- REFRESH RICH SELECTS ---
        initRichSelect('rich-item-pur', 'pur-item', sortedItems);

        // --- REFRESH TOUCH GRID ---
        renderProductGrid();
    }
    const custTbody = document.querySelector('#cust-table tbody');
    if (custTbody) {
        custTbody.innerHTML = db.customers.map(c => `
                    <tr>
                        <td style="font-weight:700;">${c.name}</td>
                        <td style="color:var(--slate-400); font-size:13px;">${c.phone || 'N/A'}</td>
                        <td style="color:var(--primary); font-weight:700;">RS ${Math.round(c.balance).toLocaleString()}</td>
                        <td class="action-btns" style="text-align:right;">
                            <button class="btn-main" style="background:var(--accent); font-size:10px; height:30px; padding:0 12px;" onclick="openEdit(${c.id})">DISCOUNTS</button>
                        </td>
                    </tr>`).join('');
    }
    const invTbody = document.querySelector('#inv-table tbody');
    if (invTbody) {
        invTbody.innerHTML = sortItems(db.items).map(i => {
            const imgHtml = i.image ? `<img src="${i.image}" style="width:40px; height:40px; object-fit:cover; border-radius:8px; border:2px solid var(--slate-200);" alt="${i.name}">` : `<div style="width:40px; height:40px; background:var(--slate-100); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px;">📦</div>`;
            return `<tr><td>${imgHtml}</td><td>${i.name}</td><td>${i.price}</td><td>${i.stock}</td><td>${i.target || 0}</td><td>${i.bundleSize || 50}</td><td class="action-btns"><button class="btn-main" style="background:var(--primary); font-size:11px;" onclick="openItemEdit(${i.id})">Edit</button></td></tr>`;
        }).join('');
    }
    const payTbody = document.querySelector('#pay-history-table tbody');
    if (payTbody) {
        payTbody.innerHTML = db.payments.slice(0, 20).map(p => `<tr><td>${p.date}</td><td>${p.customer}</td><td>${p.ref}</td><td><b>${p.amount.toLocaleString()}</b></td></tr>`).join('');
    }
    const purTbody = document.querySelector('#pur-history-table tbody');
    if (purTbody) {
        purTbody.innerHTML = db.purchases.slice(0, 20).map(p => {
            const item = db.items.find(i => i.id === p.itemId);
            const imgHtml = item && item.image
                ? `<img src="${item.image}" style="width:30px; height:30px; object-fit:cover; border-radius:4px; border:1px solid var(--slate-200);">`
                : `<div style="width:30px; height:30px; background:var(--slate-100); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:14px;">📦</div>`;
            return `<tr><td>${p.date}</td><td>${imgHtml}</td><td>${p.itemName}</td><td>RS ${p.cost.toLocaleString()}</td><td>${p.qty}</td><td><b>RS ${(p.cost * p.qty).toLocaleString()}</b></td></tr>`;
        }).join('');
    }
    filterReports();
    renderLabours();
    if (document.getElementById('dashboard').classList.contains('active')) renderDashboard();
}

function saveData(sync = true) {
    db.lastModified = Date.now();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    refreshUI();
    if (sync && navigator.onLine) {
        cloudBackup(true);
    }
}

function exportDB() {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Unique_Backup.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importDB() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            db = JSON.parse(e.target.result);
            if (!db.purchases) db.purchases = []; // Migration for old backups
            if (db.customers) db.customers.forEach(c => { if (c.phone === undefined) c.phone = ''; });
            saveData();
            alert("Restored Successfully!");
        } catch (err) {
            alert("Invalid File Format");
        }
    };
    reader.readAsText(file);
}

function showItemDetail(itemId, itemName) {
    document.querySelectorAll('.dash-row').forEach(r => r.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    const item = db.items.find(i => i.id === itemId);
    const buyers = {};
    db.salesHistory.forEach(inv => inv.items.forEach(sold => { if (sold.id === itemId) buyers[inv.customer] = (buyers[inv.customer] || 0) + sold.qty; }));
    const topTen = Object.entries(buyers).sort((a, b) => b[1] - a[1]).slice(0, 10);

    document.getElementById('detail-empty-state').style.display = 'none';
    document.getElementById('detail-content').style.display = 'block';
    document.getElementById('detail-item-title').innerText = itemName;

    const imgHtml = item && item.image
        ? `<img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:2px solid var(--slate-200);" alt="${itemName}">`
        : `<div style="width:50px; height:50px; background:var(--slate-100); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px;">📦</div>`;
    document.getElementById('detail-item-image').innerHTML = imgHtml;

    document.getElementById('dash-top-buyers').innerHTML = topTen.length > 0 ? topTen.map(entry => `<tr><td>${entry[0]}</td><td style="text-align:right; font-weight:bold;">${entry[1].toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;">No sales.</td></tr>';
}

function filterReports() {
    const cid = document.getElementById('r-cust').value;
    const btnReport = document.getElementById('btn-customer-report');
    if (btnReport) {
        btnReport.style.display = cid ? 'inline-flex' : 'none';
    }
    const search = document.getElementById('r-search').value.toLowerCase();
    const filtered = (db.salesHistory || []).filter(s => (cid === "" || s.customerId == cid) && s.inv.toString().includes(search));

    document.querySelector('#reports-table thead').innerHTML = `
            <tr>
                <th>Date</th>
                <th>Inv #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Bill</th>
                <th>Status</th>
                <th>Action</th>
            </tr>`;

    document.querySelector('#reports-table tbody').innerHTML = filtered.map(s => {
        const status = s.notes ?
            `<span style="color:var(--green); font-weight:bold;">Delivered</span>` :
            `<span style="color:var(--orange); font-weight:bold;">Pending</span>`;

        const allIcons = s.items.map(sold => {
            const item = db.items.find(i => i.id === sold.id);
            return item && item.image
                ? `<img src="${item.image}" title="${item.name}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; margin-right:4px; margin-bottom:2px;">`
                : `<span title="${sold.name}" style="font-size:18px; margin-right:4px; margin-bottom:2px;">📦</span>`;
        });

        let rowsHtml = '';
        for (let i = 0; i < allIcons.length; i += 4) {
            rowsHtml += `<div style="display:flex; align-items:center;">${allIcons.slice(i, i + 4).join('')}</div>`;
        }

        return `<tr>
                <td>${s.date}</td>
                <td>#${s.inv}</td>
                <td style="font-weight:700;">${s.customer}</td>
                <td><div style="display:flex; flex-direction:column; gap:2px;">${rowsHtml}</div></td>
                <td style="color:var(--primary); font-weight:800;">RS ${Math.round(s.billTotal).toLocaleString()}</td>
                <td>${status}</td>
                <td class="action-btns">
                    <button class="btn-main" style="font-size:11px; height:32px; background:var(--accent);" onclick="editInvoice(${s.inv})">EDIT</button>
                    <button class="btn-main" style="font-size:11px; height:32px; background:var(--success);" onclick="shareInvoiceWhatsApp(${s.inv})">WHATSAPP</button>
                    <button class="btn-main" style="font-size:11px; height:32px; background:var(--slate-800);" onclick="addInvoiceNote(${s.inv})">NOTES</button>
                    <button class="btn-main" style="font-size:11px; height:32px; background:var(--info);" onclick="exportChallanPNG(${s.inv})">MAZDUR REPORT</button>
                    <button class="btn-main" style="font-size:11px; height:32px; background:var(--primary);" onclick='reprintInv(${JSON.stringify(s)})'>REPRINT</button>
                    <button class="btn-main" style="font-size:11px; height:32px; background:var(--danger);" onclick="deleteInvoice(${s.inv})">DELETE</button>
                </td>
            </tr>`;
    }).join('');
}

/* --- INVOICE EDIT LOGIC --- */
let currentEditingInvoice = null;
let editInvoiceCart = [];

function editInvoice(invNum) {
    const inv = db.salesHistory.find(s => s.inv === invNum);
    if (!inv) return;
    currentEditingInvoice = JSON.parse(JSON.stringify(inv)); // Deep copy
    editInvoiceCart = [...currentEditingInvoice.items];

    document.getElementById('editInvoiceTitle').innerText = `Edit Invoice #${invNum}`;
    document.getElementById('editInvoiceCustomer').innerText = currentEditingInvoice.customer;

    renderEditInvoiceCart();
    initRichSelect('rich-item-edit-inv', 'edit-inv-new-item', sortItems(db.items));
    document.getElementById('invoiceEditModal').style.display = 'flex';
}

function renderEditInvoiceCart() {
    const tbody = document.getElementById('edit-invoice-body');
    tbody.innerHTML = editInvoiceCart.map((item, index) => `
        <tr>
            <td style="font-size:13px; font-weight:600;">${item.name}</td>
            <td>${item.rate}</td>
            <td>
                <input type="number" value="${item.qty}" style="width:70px; height:32px; padding:0 8px;" onchange="updateEditInvoiceQty(${index}, this.value)">
            </td>
            <td>${item.disc}%</td>
            <td style="font-weight:700;">RS ${Math.round(item.total).toLocaleString()}</td>
            <td><button class="btn-main" style="background:var(--danger); height:30px; padding:0 10px; font-size:10px;" onclick="removeFromEditInvoice(${index})">REMOVE</button></td>
        </tr>
    `).join('');

    const total = editInvoiceCart.reduce((sum, item) => sum + item.total, 0);
    document.getElementById('edit-invoice-total').innerText = `RS ${Math.round(total).toLocaleString()}`;
}

function updateEditInvoiceQty(index, val) {
    const qty = parseFloat(val) || 0;
    const item = editInvoiceCart[index];
    item.qty = qty;
    item.total = (item.rate * qty) * (1 - (item.disc || 0) / 100);
    renderEditInvoiceCart();
}

function removeFromEditInvoice(index) {
    editInvoiceCart.splice(index, 1);
    renderEditInvoiceCart();
}

function addItemToEditInvoice() {
    const itemId = document.getElementById('edit-inv-new-item').value;
    const qty = parseFloat(document.getElementById('edit-inv-new-qty').value) || 1;
    if (!itemId) return alert("Select an item.");

    const item = db.items.find(i => i.id == itemId);
    const cust = db.customers.find(c => c.id == currentEditingInvoice.customerId);
    const disc = (cust && cust.discounts && cust.discounts[itemId]) || (item.name.toLowerCase().includes('grammar') ? 25 : 15);

    editInvoiceCart.push({
        id: item.id,
        name: item.name,
        rate: item.price,
        qty: qty,
        disc: disc,
        total: (item.price * qty) * (1 - disc / 100)
    });
    renderEditInvoiceCart();
}

function saveInvoiceEdit() {
    if (!confirm("Save changes to this invoice? Stock and balances will be adjusted.")) return;

    const oldInv = db.salesHistory.find(s => s.inv === currentEditingInvoice.inv);
    const cust = db.customers.find(c => c.id === oldInv.customerId);

    // 1. Revert Old Invoice effects
    oldInv.items.forEach(oldItem => {
        const item = db.items.find(i => i.id === oldItem.id);
        if (item) item.stock += oldItem.qty;
    });
    if (cust) cust.balance -= oldInv.billTotal;

    // 2. Apply New Invoice effects
    const newTotal = editInvoiceCart.reduce((sum, item) => sum + item.total, 0);
    editInvoiceCart.forEach(newItem => {
        const item = db.items.find(i => i.id === newItem.id);
        if (item) item.stock -= newItem.qty;
    });
    if (cust) cust.balance += newTotal;

    // 3. Update Sales History
    oldInv.items = [...editInvoiceCart];
    oldInv.billTotal = newTotal;
    oldInv.lastModified = Date.now();

    document.getElementById('invoiceEditModal').style.display = 'none';
    saveData();
    alert("Invoice updated successfully!");
}

function showCustomerSalesReport() {
    const cid = document.getElementById('r-cust').value;
    if (!cid) return;
    const cust = db.customers.find(c => c.id == cid);
    if (!cust) return;

    const customerSales = (db.salesHistory || []).filter(s => s.customerId == cid);

    let totalQty = 0;
    let totalAmount = 0;
    let totalDiscount = 0;
    const itemSummary = {};

    customerSales.forEach(sale => {
        sale.items.forEach(item => {
            const itemId = item.id || item.name;
            if (!itemSummary[itemId]) {
                itemSummary[itemId] = { name: item.name, qty: 0, amount: 0, discount: 0 };
            }
            itemSummary[itemId].qty += item.qty;
            itemSummary[itemId].amount += item.total;

            const originalPrice = item.rate * item.qty;
            const discountAmt = originalPrice - item.total;
            itemSummary[itemId].discount += discountAmt;

            totalQty += item.qty;
            totalAmount += item.total;
            totalDiscount += discountAmt;
        });
    });

    document.getElementById('customerReportTitle').innerText = `Sales Summary: ${cust.name}`;

    let content = `
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; margin-bottom:25px;">
                    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 15px; border-radius: 12px; text-align:center;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Total Qty</div>
                        <div style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin-top:5px;">${totalQty.toLocaleString()}</div>
                    </div>
                    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 15px; border-radius: 12px; text-align:center;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Total Discount</div>
                        <div style="font-size: 20px; font-weight: 800; color: var(--danger); margin-top:5px;">RS ${Math.round(totalDiscount).toLocaleString()}</div>
                    </div>
                    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 15px; border-radius: 12px; text-align:center;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Total Amount</div>
                        <div style="font-size: 20px; font-weight: 800; color: var(--primary); margin-top:5px;">RS ${Math.round(totalAmount).toLocaleString()}</div>
                    </div>
                </div>
                <div class="table-wrapper" style="max-height:400px; overflow-y:auto; border: 1px solid var(--slate-100);">
                    <table style="min-width: 100%;">
                        <thead style="position: sticky; top: 0; z-index: 10;">
                            <tr>
                                <th style="background: var(--slate-50); padding: 10px 15px;">Item Name</th>
                                <th style="background: var(--slate-50); padding: 10px 15px; text-align:center;">Qty</th>
                                <th style="background: var(--slate-50); padding: 10px 15px; text-align:right;">Discount</th>
                                <th style="background: var(--slate-50); padding: 10px 15px; text-align:right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(itemSummary).sort((a, b) => b.amount - a.amount).map(i => `
                                <tr>
                                    <td style="padding: 10px 15px; font-weight:600; font-size:13px;">${i.name}</td>
                                    <td style="padding: 10px 15px; text-align:center; font-size:13px;">${i.qty.toLocaleString()}</td>
                                    <td style="padding: 10px 15px; text-align:right; color:var(--danger); font-size:13px;">RS ${Math.round(i.discount).toLocaleString()}</td>
                                    <td style="padding: 10px 15px; text-align:right; font-weight:700; font-size:13px;">RS ${Math.round(i.amount).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${Object.keys(itemSummary).length === 0 ? '<div style="text-align:center; padding:30px; color:var(--slate-400);">No sales found for this customer.</div>' : ''}
            `;

    document.getElementById('customerReportContent').innerHTML = content;
    document.getElementById('customerReportModal').style.display = 'flex';
}

// NEW: Function to add/edit notes and update status
function addInvoiceNote(invNum) {
    const index = db.salesHistory.findIndex(s => s.inv === invNum);
    if (index === -1) return;

    const currentNote = db.salesHistory[index].notes || "";
    const newNote = prompt(`Delivery Notes for Invoice #${invNum}:`, currentNote);

    // If user clicks cancel, do nothing. If they clear it, status reverts to Pending.
    if (newNote !== null) {
        db.salesHistory[index].notes = newNote.trim();
        saveData();
        alert(newNote.trim() !== "" ? "Status updated to Delivered" : "Status set to Pending");
    }
}



function renderCart() {
    const tbody = document.querySelector('#cart-table tbody');
    if (!tbody) return;

    tbody.innerHTML = cart.map((c, i) => {
        return `<tr>
                    <td>
                        <div style="font-weight:700; font-size:13px;">${c.name}</div>
                        <div style="font-size:11px; color:var(--slate-400);">Rate: RS ${c.rate.toLocaleString()} | Disc: ${c.disc}%</div>
                    </td>
                    <td style="text-align:center; font-weight:600;">${c.qty}</td>
                    <td style="font-weight:700; color:var(--primary); text-align:right;">RS ${Math.round(c.total).toLocaleString()}</td>
                    <td style="text-align:right; width:40px;">
                        <button class="btn-main" style="background:var(--danger); height:28px; width:28px; padding:0; min-width:28px; display:flex; align-items:center; justify-content:center; border-radius:8px;" onclick="cart.splice(${i},1);renderCart()">
                            <span style="font-size:10px;">❌</span>
                        </button>
                    </td>
                </tr>`;
    }).join('');

    const totalAmount = Math.round(cart.reduce((a, b) => a + b.total, 0));
    document.getElementById('total-display').innerText = `RS ${totalAmount.toLocaleString()}`;
}

function finalizeSale() {
    const cid = document.getElementById('s-cust').value;
    const cust = db.customers.find(c => c.id == cid);
    if (!cust || cart.length === 0) return alert("Incomplete Bill");
    const lastInv = db.salesHistory.length > 0 ? Math.max(...db.salesHistory.map(s => s.inv)) : 10000;
    const newInv = lastInv + 1;
    const billTotal = cart.reduce((a, b) => a + b.total, 0);
    const record = { inv: newInv, customer: cust.name, customerId: cust.id, date: new Date().toLocaleDateString(), items: cart.map(c => ({ ...c, bundles: (c.qty / (db.items.find(i => i.id == c.id).bundleSize || 50)) })), billTotal, prevBal: cust.balance, finalPayable: billTotal + cust.balance };
    db.salesHistory.unshift(record);
    cust.balance += billTotal;
    cart.forEach(c => { const i = db.items.find(item => item.id == c.id); if (i) i.stock -= c.qty; });
    generatePDF(record);
    cart = [];
    renderCart();
    saveData();

    // Clear Sales Inputs
    document.getElementById('s-cust').value = '';
}

function generateInvoicePDF(s) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const primaryColor = [30, 41, 59];
    const drawSection = (y, isInv) => {
        let currentY = y;
        if (isInv) {
            doc.setFont("Verdana", "bold"); doc.setFontSize(22); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("UNIQUE GRAPHICS & PUBLISHING HOUSE", 105, currentY, { align: "center" });
            doc.setFontSize(10); doc.setTextColor(100, 116, 139);
            doc.text("13-Al-Basit Street, Outfall Road, Lahore | 0300-0333678, 0348-5242128", 105, currentY + 6, { align: "center" });
            doc.setLineWidth(0.5); doc.line(15, currentY + 10, 195, currentY + 10); currentY += 18;
        } else { currentY += 5; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30, 41, 59);
        doc.text(isInv ? "SALES INVOICE" : "DELIVERY CHALLAN", 15, currentY);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Customer: ${s.customer}`, 15, currentY + 7);
        doc.setFont("helvetica", "bold"); doc.text(`Inv #: ${s.inv}`, 195, currentY, { align: "right" });
        doc.setFont("helvetica", "normal"); doc.text(`Date: ${s.date}`, 195, currentY + 7, { align: "right" });
        const head = isInv ? [['Item Description', 'Rate', 'Qty', 'Disc%', 'Total']] : [['Item Description', 'Qty', 'Bundles', 'Remarks']];
        const body = isInv ? s.items.map(i => [i.name, i.rate.toLocaleString(), i.qty, i.disc + "%", Math.round(i.total).toLocaleString()]) : s.items.map(i => [i.name, i.qty, Number(i.bundles).toFixed(2).replace(/\.00$/, ''), ""]);
        doc.autoTable({ startY: currentY + 12, head, body, theme: 'grid', styles: { fontSize: 8.5 }, headStyles: { fillColor: primaryColor } });
        let fY = doc.lastAutoTable.finalY + 8;
        if (isInv) {
            doc.text(`Bill Total: Rs ${Math.round(s.billTotal).toLocaleString()}`, 195, fY, { align: "right" });
            doc.text(`Prev. Bal: Rs ${Math.round(s.prevBal).toLocaleString()}`, 195, fY + 5, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.text(`TOTAL PAYABLE: Rs ${Math.round(s.finalPayable).toLocaleString()}`, 195, fY + 12, { align: "right" });
        } else {
            const totalBundles = s.items.reduce((a, b) => a + b.bundles, 0);
            doc.setFont("helvetica", "bold"); doc.text(`TOTAL BUNDLES: ${Number(totalBundles).toFixed(2).replace(/\.00$/, '')}`, 15, fY);
        }
    };
    drawSection(15, true); doc.setLineDash([2, 2]); doc.line(0, 148, 210, 148); doc.setLineDash([]); drawSection(155, false);
    return doc;
}

function generatePDF(s) {
    const doc = generateInvoicePDF(s);
    doc.save(`${s.customer}_Inv_${s.inv}.pdf`);
}

async function shareInvoiceWhatsApp(invNum) {
    const s = db.salesHistory.find(iv => iv.inv === invNum);
    if (!s) return;
    const cust = db.customers.find(c => c.id == s.customerId);

    // 1. Generate Comprehensive Text Summary
    let itemLines = s.items.map(i => `• ${i.name}\n  Rate: ${i.rate} | Qty: ${i.qty} | Disc: ${i.disc}%\n  Total: RS ${Math.round(i.total).toLocaleString()}`).join('\n\n');
    const summaryText = `*UNIQUE GRAPHICS & PUBLISHERS*\n*Invoice:* #${s.inv}\n*Date:* ${s.date}\n\n*Items Breakdown:*\n${itemLines}\n\n*Bill Total:* RS ${Math.round(s.billTotal).toLocaleString()}\n*Prev. Balance:* RS ${Math.round(s.prevBal).toLocaleString()}\n*TOTAL PAYABLE: RS ${Math.round(s.finalPayable).toLocaleString()}*\n`;
    const encodedMsg = encodeURIComponent(summaryText);

    // 2. Handle Phone Number & Auto-Save
    let phone = cust && cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';

    if (!phone) {
        const newPhone = prompt(`Phone number missing for ${s.customer}.\nEnter number (e.g. 923001234567):`);
        if (!newPhone) return;

        phone = newPhone.replace(/[^0-9]/g, '');
        if (cust) {
            cust.phone = newPhone;
            saveData(); // Save to DB for future use
        }
    }

    // 3. Open WhatsApp Direct Link
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
}

async function exportChallanPNG(invNum) {
    const s = db.salesHistory.find(iv => iv.inv === invNum);
    if (!s) return;

    // 1. Save the report image immediately
    await downloadChallanImage(s);

    // 2. Show Labour Selection Modal
    const selectModal = document.getElementById('labourSelectModal');
    const lSelect = document.getElementById('l-select-share');
    lSelect.innerHTML = db.labours.map(l => `<option value="${l.id}">${l.name} (${l.phone})</option>`).join('');

    if (db.labours.length === 0) {
        alert("Image saved. Please register Labours in the Labours tab to open WhatsApp.");
        return;
    }

    selectModal.style.display = 'flex';

    document.getElementById('btn-confirm-share').onclick = () => {
        const labourId = document.getElementById('l-select-share').value;
        const labour = db.labours.find(l => l.id == labourId);
        selectModal.style.display = 'none';

        if (labour) {
            const phone = labour.phone.replace(/[^0-9]/g, '');
            // Open WhatsApp with just the number - no text or file
            window.open(`https://wa.me/${phone}`, '_blank');
        }
    };
}

async function downloadChallanImage(s) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '600px';
    container.style.background = 'white';
    container.style.padding = '40px';
    container.style.fontFamily = "'Outfit', sans-serif";

    let totalBundles = 0;
    const itemsHtml = s.items.map(i => {
        const item = db.items.find(it => it.id === i.id);
        const bundles = i.bundles || (i.qty / (item?.bundleSize || 50));
        totalBundles += bundles;
        const imgHtml = item && item.image
            ? `<img src="${item.image}" style="width:70px; height:70px; object-fit:cover; border-radius:10px; border:1px solid #e2e8f0;">`
            : `<div style="width:70px; height:70px; background:#f1f5f9; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:30px; border:1px solid #e2e8f0;">📦</div>`;

        return `
                    <div style="display:flex; align-items:center; gap:20px; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                        ${imgHtml}
                        <div style="flex:1;">
                            <div style="font-size:18px; font-weight:700; color:#0f172a;">${i.name}</div>
                            <div style="font-size:14px; color:#64748b; margin-top:4px;">Qty: <span style="font-weight:600; color:#0f172a;">${i.qty}</span></div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Bundles</div>
                            <div style="font-size:22px; font-weight:800; color:#6366f1;">${bundles.toFixed(2)}</div>
                        </div>
                    </div>
                `;
    }).join('');

    container.innerHTML = `
                <div style="background:linear-gradient(135deg, #0f172a, #1e293b); padding:30px; border-radius:16px; margin-bottom:30px; color:white; box-shadow:0 10px 20px rgba(0,0,0,0.1);">
                    <div style="font-size:12px; text-transform:uppercase; letter-spacing:2px; font-weight:600; opacity:0.7; margin-bottom:8px;">Customer Name</div>
                    <div style="font-size:28px; font-weight:900; letter-spacing:-0.5px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:15px; word-wrap:break-word; overflow-wrap:break-word; line-height:1.2; width:100%;">${s.customer}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:11px; text-transform:uppercase; opacity:0.6; font-weight:700;">Invoice Number</div>
                            <div style="font-size:18px; font-weight:700;">#${s.inv}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:11px; text-transform:uppercase; opacity:0.6; font-weight:700;">Order Date</div>
                            <div style="font-size:18px; font-weight:700;">${s.date}</div>
                        </div>
                    </div>
                </div>
                <div style="margin-bottom:30px;">${itemsHtml}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#6366f1; padding:20px; border-radius:16px; color:white; box-shadow:0 10px 15px -3px rgba(99, 102, 241, 0.3);">
                    <div>
                        <div style="font-size:13px; text-transform:uppercase; font-weight:700; opacity:0.9; letter-spacing:1px;">Total Items</div>
                        <div style="font-size:20px; font-weight:800;">${s.items.length} Products</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:13px; text-transform:uppercase; font-weight:700; opacity:0.9; letter-spacing:1px;">Total Bundles</div>
                        <div style="font-size:32px; font-weight:900;">${totalBundles.toFixed(2)}</div>
                    </div>
                </div>
                <div style="margin-top:40px; text-align:center;">
                    <div style="font-size:12px; color:#94a3b8; font-weight:500;">UNIQUE GRAPHICS & PUBLISHERS</div>
                    <div style="font-size:10px; color:#cbd5e1; margin-top:4px;">Dispatch Report Generated on ${new Date().toLocaleString()}</div>
                </div>
            `;

    document.body.appendChild(container);
    try {
        const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `Mazdur_Report_${s.inv}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.8);
        link.click();
    } catch (err) {
        console.error("Error generating report image:", err);
    } finally {
        document.body.removeChild(container);
    }
}

function reprintInv(s) { generatePDF(s); }

function showPayBalance() {
    const cid = document.getElementById('p-cust').value;
    const cust = db.customers.find(c => c.id == cid);
    const div = document.getElementById('pay-bal-display');

    if (!cust) { div.innerHTML = ''; return; }

    const bal = Math.round(cust.balance);
    const color = bal > 0 ? 'var(--danger)' : 'var(--success)';

    div.innerHTML = `
                <div style="background: white; border: 2px solid var(--slate-100); padding: 25px; border-radius: 16px; text-align: center; margin-top: 20px; box-shadow: var(--card-shadow);">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: var(--slate-400); margin-bottom: 8px;">Outstanding Balance</div>
                    <div style="font-size: 36px; font-weight: 800; color: ${color}; letter-spacing: -1px;">RS ${bal.toLocaleString()}</div>
                    <div style="margin-top: 10px; font-size: 12px; color: var(--slate-400); font-weight: 500;">Customer Identity: ${cust.name}</div>
                </div>
            `;
}

function recordPurchase() {
    const iid = document.getElementById('pur-item').value;
    const cost = parseFloat(document.getElementById('pur-cost').value);
    const qty = parseInt(document.getElementById('pur-qty').value);
    const item = db.items.find(i => i.id == iid);
    if (!item || isNaN(cost) || isNaN(qty)) return alert("Please fill all fields");

    item.stock += qty;
    db.purchases.unshift({
        date: new Date().toLocaleString(),
        itemId: item.id,
        itemName: item.name,
        cost: cost,
        qty: qty
    });

    saveData();
    document.getElementById('pur-item').value = '';
    document.getElementById('pur-cost').value = '';
    document.getElementById('pur-qty').value = '';

    // Re-render rich select to reset display
    initRichSelect('rich-item-pur', 'pur-item', [...db.items].sort((a, b) => a.name.localeCompare(b.name)));

    alert("Stock Updated Successfully!");
}

function recordPayment() {
    const cid = document.getElementById('p-cust').value;
    const amt = parseFloat(document.getElementById('p-amt').value);
    const cust = db.customers.find(c => c.id == cid);
    if (!cust || !amt) return;
    cust.balance -= amt;
    db.payments.unshift({ date: new Date().toLocaleString(), customer: cust.name, amount: amt, ref: document.getElementById('p-ref').value || 'Cash' });
    saveData();

    // Clear Payment Inputs
    document.getElementById('p-cust').value = '';
    document.getElementById('p-amt').value = '';
    document.getElementById('p-ref').value = '';
    document.getElementById('pay-bal-display').innerHTML = '';
}

function handleStatClick(card, title) {
    toggleDetails(card);
    setTimeout(() => {
        if (confirm(`Do you want to export "${title}" as an Excel file?\n(Export Date: ${new Date().toLocaleDateString()})`)) {
            if (title === 'Sales Summary') exportSalesSummary();
            else if (title === 'Receivables') exportReceivables();
            else if (title === 'Royalty Report') exportRoyaltyExcel();
            else if (title === 'Inventory Assets') exportInventoryAssets();
            else if (title === 'Today Payments') exportPayments('today');
            else if (title === 'Total Payments History') exportPayments('total');
        }
    }, 300);
}

function handleRoyaltyStatClick(card) {
    toggleDetails(card);
    setTimeout(() => {
        const choice = confirm("Do you want to record a NEW Royalty Payment?\n(Select CANCEL to just view history or export Excel)");
        if (choice) {
            document.getElementById('royaltyPayModal').style.display = 'flex';
            // Set default date to today
            document.getElementById('roy-pay-date').value = new Date().toISOString().split('T')[0];
        } else {
            if (confirm("Do you want to export Royalty Payment History as an Excel file?")) {
                exportRoyaltyPayments();
            }
        }
    }, 300);
}

function recordRoyaltyPayment() {
    const amount = parseFloat(document.getElementById('roy-pay-amount').value);
    const ref = document.getElementById('roy-pay-ref').value;
    const dateInput = document.getElementById('roy-pay-date').value;

    if (!amount || !ref || !dateInput) return alert("Please fill all fields for royalty payment");

    // Store as ISO string or local date string? The system uses .toLocaleDateString() mostly.
    // We'll store it in a way that fiscal year helper can read it (which accepts Date objects)
    const d = new Date(dateInput);
    const formattedDate = d.toLocaleDateString();

    db.royaltyPayments.push({ amount, ref, date: formattedDate });
    saveData();
    renderDashboard();

    // Reset and close
    document.getElementById('roy-pay-amount').value = '';
    document.getElementById('roy-pay-ref').value = '';
    document.getElementById('royaltyPayModal').style.display = 'none';
    alert("Royalty Payment Recorded Successfully");
}

function exportRoyaltyPayments() {
    const payments = db.royaltyPayments || [];
    if (payments.length === 0) return alert("No payment records to export");

    const fiscal = getFiscalYearRange();
    const data = payments.map(p => ({
        "Date": p.date,
        "Reference / Cheque": p.ref,
        "Amount Paid (RS)": p.amount,
        "Fiscal Year": fiscal.isCurrent(p.date) ? "Current" : "Previous/Other"
    }));

    data.push({
        "Date": "GRAND TOTAL",
        "Reference / Cheque": "",
        "Amount Paid (RS)": payments.reduce((a, b) => a + b.amount, 0),
        "Fiscal Year": ""
    });

    downloadExcel(data, "Royalty_Payments", "Royalty Payment History");
}

function exportSalesSummary() {
    const history = db.salesHistory || [];
    const data = history.map(s => ({
        "Date": s.date,
        "Invoice #": s.inv,
        "Customer": s.customer,
        "Total Bill (RS)": Math.round(s.billTotal),
        "Status": s.notes ? "Delivered" : "Pending"
    }));
    data.push({ "Date": "GRAND TOTAL", "Invoice #": "", "Customer": "", "Total Bill (RS)": Math.round(history.reduce((a, b) => a + b.billTotal, 0)), "Status": "" });
    downloadExcel(data, "Sales_Summary", "Sales Summary");
}

function exportReceivables() {
    const customers = db.customers || [];
    const data = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance).map(c => ({
        "Customer Name": c.name,
        "Phone": c.phone || 'N/A',
        "Outstanding Balance (RS)": Math.round(c.balance)
    }));
    data.push({ "Customer Name": "GRAND TOTAL", "Phone": "", "Outstanding Balance (RS)": Math.round(customers.reduce((a, b) => a + b.balance, 0)) });
    downloadExcel(data, "Receivables_Report", "Customer Receivables");
}

function exportInventoryAssets() {
    const items = db.items || [];
    const data = items.map(i => {
        const name = i.name.toLowerCase();
        const retail = i.price * i.stock;
        let val = retail;
        if (name.includes("urdu grammar") || name.includes("english grammar") || name.includes("home economics 8")) val = retail * 0.65;
        else if (name.includes("home economics 6") || name.includes("home economics 7")) val = retail * 0.784;
        return {
            "Item Name": i.name,
            "Unit Price": i.price,
            "Current Stock": i.stock,
            "Retail Value": retail,
            "Asset Value (Adjusted)": Math.round(val)
        };
    });
    const totalAsset = data.reduce((a, b) => a + b["Asset Value (Adjusted)"], 0);
    data.push({ "Item Name": "GRAND TOTAL", "Unit Price": "", "Current Stock": "", "Retail Value": "", "Asset Value (Adjusted)": totalAsset });
    downloadExcel(data, "Inventory_Assets", "Inventory Stock & Assets");
}

function exportPayments(type) {
    const payments = db.payments || [];
    const todayDate = new Date().toLocaleDateString();
    const filtered = type === 'today' ? payments.filter(p => p.date.split(',')[0] === todayDate) : payments;
    const data = filtered.map(p => ({
        "Date": p.date,
        "Customer": p.customer,
        "Reference": p.ref,
        "Amount Paid (RS)": Math.round(p.amount)
    }));
    data.push({ "Date": "TOTAL COLLECTED", "Customer": "", "Reference": "", "Amount Paid (RS)": Math.round(filtered.reduce((a, b) => a + b.amount, 0)) });
    downloadExcel(data, type === 'today' ? "Today_Payments" : "Total_Payments_History", type === 'today' ? "Today's Payments" : "Full Payment History");
}

function downloadExcel(data, filename, sheetName) {
    const exportDate = new Date().toLocaleDateString().replace(/\//g, '-');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${exportDate}.xlsx`);
}

function exportRoyaltyExcel() {
    const items = db.items || [];
    const history = db.salesHistory || [];
    const fiscal = getFiscalYearRange();
    const annualHistory = history.filter(h => fiscal.isCurrent(h.date));
    const royaltyData = [];
    let aggregateRoyalty = 0;

    items.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
        const name = item.name.toLowerCase();
        let qtySold = 0;
        annualHistory.forEach(inv => inv.items.forEach(sold => {
            if (sold.id === item.id) qtySold += sold.qty;
        }));

        let rate = 0;
        if (name.includes("home economics 8")) rate = 0.15;
        else if (name.includes("grammar")) rate = 0.10;
        else if (name.includes("home economics 6") || name.includes("home economics 7")) rate = 0.016;

        const royaltyVal = (item.price * qtySold) * rate;
        aggregateRoyalty += royaltyVal;

        royaltyData.push({
            "Item Name": item.name,
            "Unit Price": item.price,
            "Total Sale (Qty)": qtySold,
            "Current Stock": item.stock,
            "Royalty Rate": rate > 0 ? (rate * 100).toFixed(1) + "%" : "0%",
            "Royalty Amount (RS)": Math.round(royaltyVal)
        });
    });

    royaltyData.push({
        "Item Name": "--- GRAND TOTAL ---",
        "Unit Price": "",
        "Total Sale (Qty)": "",
        "Current Stock": "",
        "Royalty Rate": "",
        "Royalty Amount (RS)": Math.round(aggregateRoyalty)
    });

    downloadExcel(royaltyData, "Royalty_Report", "Inventory & Royalty");
}



function showItemPreview() {
    const iid = document.getElementById('s-item').value;
    const item = db.items.find(i => i.id == iid);
    const preview = document.getElementById('item-preview');

    if (!item) {
        preview.style.display = 'none';
        return;
    }

    const imgHtml = item.image
        ? `<img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; border:2px solid var(--slate-300);" alt="${item.name}">`
        : `<div style="width:60px; height:60px; background:var(--slate-200); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:28px;">📦</div>`;

    document.getElementById('preview-image').innerHTML = imgHtml;
    document.getElementById('preview-name').innerText = item.name;
    document.getElementById('preview-details').innerHTML = `Price: <b>RS ${item.price}</b> | Stock: <b>${item.stock}</b> | Min Sale: <b>RS ${item.minPrice || 'N/A'}</b>`;
    preview.style.display = 'block';
}

function showItemPreviewPur() {
    const iid = document.getElementById('pur-item').value;
    const item = db.items.find(i => i.id == iid);
    const preview = document.getElementById('item-preview-pur');

    if (!item) {
        preview.style.display = 'none';
        return;
    }

    const imgHtml = item.image
        ? `<img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; border:2px solid var(--slate-300);" alt="${item.name}">`
        : `<div style="width:60px; height:60px; background:var(--slate-200); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:28px;">📦</div>`;

    document.getElementById('preview-image-pur').innerHTML = imgHtml;
    document.getElementById('preview-name-pur').innerText = item.name;
    document.getElementById('preview-details-pur').innerHTML = `Current Stock: <b>${item.stock}</b> | Target: <b>${item.target || 0}</b> | Price: <b>RS ${item.price}</b>`;
    preview.style.display = 'block';
}

async function addItem() {
    const imageFile = document.getElementById('i-image').files[0];
    let imageData = null;

    if (imageFile) {
        imageData = await resizeAndEncodeImage(imageFile, 100, 100);
    }

    db.items.push({
        id: Date.now(),
        name: document.getElementById('i-name').value,
        price: parseFloat(document.getElementById('i-price').value),
        stock: parseInt(document.getElementById('i-stock').value) || 0,
        target: parseInt(document.getElementById('i-target').value) || 0,
        bundleSize: parseInt(document.getElementById('i-bundle').value) || 50,
        image: imageData
    });
    saveData();
    renderProductGrid(); // Update touch grid

    // Clear Inventory Inputs
    document.getElementById('i-name').value = '';
    document.getElementById('i-price').value = '';
    document.getElementById('i-stock').value = '';
    document.getElementById('i-target').value = '';
    document.getElementById('i-bundle').value = '50';
    document.getElementById('i-image').value = '';
}

// --- LABOUR FUNCTIONS ---
function addLabour() {
    const name = document.getElementById('l-name').value;
    const phone = document.getElementById('l-phone').value;
    if (!name || !phone) return alert("All fields are required");
    db.labours.push({ id: Date.now(), name, phone: phone.replace(/[^0-9]/g, '') });
    saveData();
    document.getElementById('labourAddModal').style.display = 'none';
    document.getElementById('l-name').value = '';
    document.getElementById('l-phone').value = '';
}

function deleteLabour(id) {
    if (confirm("Delete this labour?")) {
        db.labours = db.labours.filter(l => l.id !== id);
        saveData();
    }
}

function renderLabours() {
    const tbody = document.querySelector('#labour-table tbody');
    if (!tbody) return;
    tbody.innerHTML = db.labours.map(l => `
                <tr>
                    <td style="font-weight:700;">${l.name}</td>
                    <td style="color:var(--slate-400); font-size:13px;">${l.phone}</td>
                    <td class="action-btns" style="text-align:right;">
                        <button class="btn-main" style="background:var(--danger); font-size:10px; height:30px; padding:0 12px;" onclick="deleteLabour(${l.id})">DELETE</button>
                    </td>
                </tr>`).join('');
}

function addCustomer() {
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const bal = parseFloat(document.getElementById('c-bal').value) || 0;
    if (!name) return alert("Name is required");
    db.customers.push({ id: Date.now(), name, phone, balance: bal, discounts: {} });
    saveData();
    document.getElementById('custAddModal').style.display = 'none';
    // Clear inputs
    document.getElementById('c-name').value = '';
    document.getElementById('c-phone').value = '';
    document.getElementById('c-bal').value = '';
}
function deleteItem(id) { if (confirm("Delete?")) { db.items = db.items.filter(i => i.id !== id); saveData(); } }

function openItemEdit(id) {
    const item = db.items.find(i => i.id === id);
    if (!item) return;
    document.getElementById('edit-i-id').value = item.id;
    document.getElementById('edit-i-name').value = item.name;
    document.getElementById('edit-i-price').value = item.price;
    document.getElementById('edit-i-stock').value = item.stock;
    document.getElementById('edit-i-target').value = item.target || 0;
    document.getElementById('edit-i-bundle').value = item.bundleSize || 50;

    // Show current image preview
    const preview = document.getElementById('edit-i-preview');
    if (item.image) {
        preview.innerHTML = `<div style="text-align:center;"><img src="${item.image}" style="width:80px; height:80px; object-fit:cover; border-radius:12px; border:2px solid var(--slate-200);"><div style="font-size:11px; color:var(--slate-400); margin-top:5px;">Current Image</div></div>`;
    } else {
        preview.innerHTML = '<div style="text-align:center; color:var(--slate-400); font-size:12px;">No image uploaded</div>';
    }

    document.getElementById('itemEditModal').style.display = 'flex';
}

async function saveItemEdit() {
    const id = parseInt(document.getElementById('edit-i-id').value);
    const item = db.items.find(i => i.id === id);
    if (!item) return;

    const imageFile = document.getElementById('edit-i-image').files[0];
    if (imageFile) {
        item.image = await resizeAndEncodeImage(imageFile, 100, 100);
    }

    item.name = document.getElementById('edit-i-name').value;
    item.price = parseFloat(document.getElementById('edit-i-price').value);
    item.stock = parseInt(document.getElementById('edit-i-stock').value);
    item.target = parseInt(document.getElementById('edit-i-target').value) || 0;
    item.bundleSize = parseInt(document.getElementById('edit-i-bundle').value) || 50;
    saveData();
    renderProductGrid(); // Update touch grid
    document.getElementById('itemEditModal').style.display = 'none';
}

/* --- TOUCH BILLING FUNCTIONS --- */
function renderProductGrid() {
    const grid = document.getElementById('billing-product-grid');
    if (!grid) return;

    const searchInput = document.getElementById('grid-search');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredItems = sortItems(db.items.filter(i => i.name.toLowerCase().includes(search)));

    grid.innerHTML = filteredItems.map(i => `
                <div class="product-card" onclick="addToCartViaTouch(${i.id})">
                    ${i.image ? `<img src="${i.image}" alt="${i.name}">` : `<div class="no-img">📦</div>`}
                    <div class="name">${i.name}</div>
                    <div class="price">RS ${i.price}</div>
                    <div class="stock">${i.stock} in stock</div>
                </div>
            `).join('');
}

function addToCartViaTouch(itemId) {
    const item = db.items.find(i => i.id == itemId);
    if (!item) return;

    const cid = document.getElementById('s-cust').value;
    if (!cid) return alert("Please select a customer first to apply correct discounts.");
    const cust = db.customers.find(c => c.id == cid);

    // Prompt for quantity
    const qtyStr = prompt(`Enter Quantity for "${item.name}":`, "1");
    if (qtyStr === null) return; // Cancelled
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return alert("Invalid quantity");

    // Automatic Discount based on customer or items logic
    let disc = 0;
    if (cust) {
        disc = cust.discounts?.[itemId] || (item.name.toLowerCase().includes('grammar') ? 25 : 15);
    }

    const total = (item.price * qty) * (1 - disc / 100);
    cart.push({ name: item.name, rate: item.price, qty, disc, total, id: item.id });
    renderCart();

    // Visual feedback
    const totalDisplay = document.getElementById('total-display');
    totalDisplay.classList.add('pulse');
    setTimeout(() => totalDisplay.classList.remove('pulse'), 500);
}

function toggleTaskbar(force) {
    const nav = document.querySelector('.nav');

    // Fullscreen logic
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log("FS Error:", e));
    }

    if (force === false) {
        nav.classList.remove('show');
    } else {
        nav.classList.toggle('show');
    }
}

function updateOnlineStatus() {
    const bar = document.getElementById('connectivity-bar');
    const text = bar.querySelector('.status-text');
    if (navigator.onLine) {
        bar.classList.add('online');
        bar.classList.remove('offline');
        text.innerText = 'Online - Data Secured';
    } else {
        bar.classList.add('offline');
        bar.classList.remove('online');
        text.innerText = 'Offline - Local Mode Active';
    }
}

async function initialSync() {
    if (navigator.onLine) {
        const syncInd = document.getElementById('sync-indicator');
        const token = document.getElementById('gh-token')?.value || localStorage.getItem('gh_token');

        syncInd.innerText = "⏳ Checking GitHub...";
        try {
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3.raw' } : { 'Accept': 'application/vnd.github.v3.raw' };
            const response = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?v=${Date.now()}`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const cloudDb = await response.json();
                if (cloudDb && cloudDb.items) {
                    const localTimestamp = db.lastModified || 0;
                    const cloudTimestamp = cloudDb.lastModified || 0;

                    if (cloudTimestamp > localTimestamp) {
                        db = cloudDb;
                        localStorage.setItem(DB_KEY, JSON.stringify(db));
                        syncInd.innerText = "✓ PULLED FROM GITHUB";
                        setTimeout(() => { if (syncInd.innerText.includes("PULLED")) syncInd.innerText = ""; }, 3000);
                    } else if (localTimestamp > cloudTimestamp) {
                        syncInd.innerText = "✓ LOCAL IS NEWER";
                        setTimeout(() => { if (syncInd.innerText.includes("NEWER")) syncInd.innerText = ""; }, 3000);
                    } else {
                        syncInd.innerText = "✓ IN SYNC WITH GITHUB";
                        setTimeout(() => { if (syncInd.innerText.includes("SYNC")) syncInd.innerText = ""; }, 3000);
                    }
                }
            } else {
                throw new Error('Sync check failed');
            }
        } catch (e) {
            syncInd.innerText = "⚠ GitHub Sync Locked";
            setTimeout(() => { if (syncInd.innerText.includes("Locked")) syncInd.innerText = ""; }, 3000);
        }
    }
    refreshUI();
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

updateOnlineStatus();
initialSync();