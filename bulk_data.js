const data = [
    { "customer": "Azad Book Depot Bhimber", "items": { "H6": 1000, "H7": 1000, "H8": 1500, "U3": 2500, "U4": 2500, "U5": 2500, "E3": 2500, "E4": 2500, "E5": 2500 } },
    { "customer": "Kashmir Book Depot Rwp", "items": { "H6": 1000, "H7": 1000, "H8": 1000, "U3": 3000, "U4": 3000, "U5": 3000, "E3": 3000, "E4": 3000, "E5": 3000 } },
    { "customer": "Awami Book Depot", "items": { "H6": 150, "H7": 50, "H8": 50, "U3": 200, "U4": 500, "U5": 500, "E3": 200, "E4": 500, "E5": 500 } },
    { "customer": "Awan Book Depot Tatapani", "items": { "H6": 200, "H7": 200, "H8": 200 } },
    { "customer": "Dawn Book Depot Hajira", "items": { "H6": 200, "H7": 200, "H8": 200, "U3": 300, "U4": 400, "U5": 400, "E3": 300, "E4": 400, "E5": 400 } },
    { "customer": "Hassan Book Depot Urdu Bazar", "items": { "H6": 100, "H7": 100, "H8": 100 } },
    { "customer": "Dawn Book Depot Hajira", "items": { "U3": 300, "U4": 400, "U5": 400, "E3": 300, "E4": 400, "E5": 400 } },
    { "customer": "Iqra Book Depot Rwp", "items": { "H6": 600, "H7": 600, "H8": 600, "U3": 700, "U4": 1100, "U5": 1100, "E3": 800, "E4": 1100, "E5": 1100 } },
    { "customer": "Diamond Book Depot Mzd", "items": { "U3": 1000, "U4": 1000, "U5": 1000, "E3": 1000, "E4": 1000, "E5": 1000 } },
    { "customer": "Amir Book Depot Abaspur", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 150, "U4": 150, "U5": 150, "E3": 150, "E4": 150, "E5": 150 } },
    { "customer": "Khurshid Sons Book Depot Abaspur", "items": { "H6": 15, "H7": 15, "H8": 15, "U3": 100, "U4": 100, "U5": 100, "E3": 100, "E4": 100, "E5": 100 } },
    { "customer": "Azad Book Depot Mzd", "items": { "U3": 500, "U4": 500, "U5": 500, "E3": 500, "E4": 500, "E5": 500 } },
    { "customer": "Chaudary Book Depot Mail", "items": { "U3": 100, "U4": 100, "U5": 0, "E3": 100, "E4": 100, "E5": 0 } },
    { "customer": "City Book Depot Mirpur", "items": { "H6": 500, "H7": 500, "H8": 500, "U3": 600, "U4": 600, "U5": 0, "E3": 600, "E4": 600, "E5": 0 } },
    { "customer": "City Book Depot Mirpur", "items": { "H6": 500, "H7": 200, "H8": 500, "U3": 700, "U4": 700, "U5": 700, "E3": 700, "E4": 700, "E5": 700 } },
    { "customer": "Chaudary Book Depot Mzd", "items": { "H6": 30, "H8": 30, "U3": 50, "U4": 100, "U5": 100, "E3": 50, "E4": 100, "E5": 100 } },
    { "customer": "Chaudary Book Depot Mzd", "items": { "U4": 50, "U5": 50, "E4": 50, "E5": 50 } },
    { "customer": "Sidhuzai Book Depot Tararkhel", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 100, "U4": 100, "U5": 100, "E3": 100, "E4": 100, "E5": 100 } },
    { "customer": "Amir Book Depot Hajira", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 250, "U4": 250, "U5": 250, "E3": 250, "E4": 250, "E5": 250 } },
    { "customer": "College Book Depot Kotli", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 0, "U4": 0, "U5": 100, "E3": 0, "E4": 0, "E5": 100 } },
    { "customer": "Sadaat Book Depot Mzd", "items": { "H6": 500, "H8": 300, "U3": 1000, "U4": 1000, "U5": 1000, "E3": 1000, "E4": 1000, "E5": 1000 } },
    { "customer": "Pakistan Book Depot Dhirkot", "items": { "H6": 100, "H7": 100, "H8": 100, "U3": 50, "U4": 50, "U5": 50, "E3": 50, "E4": 50, "E5": 50 } },
    { "customer": "Roshan Book Depot Kotli", "items": { "H6": 100, "H7": 100, "H8": 100, "U3": 200, "U4": 200, "U5": 200, "E3": 200, "E4": 200, "E5": 200 } },
    { "customer": "Roshan Book Depot Kotli", "items": { "H6": 100, "H7": 100, "H8": 100, "U3": 200, "U4": 200, "U5": 200, "E3": 200, "E4": 200, "E5": 200 } },
    { "customer": "Pak Book Depot Mzd", "items": { "U3": 150, "U4": 300, "U5": 300, "E3": 150, "E4": 300, "E5": 300 } },
    { "customer": "College Book Depot Kotli", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 0, "U4": 25, "U5": 100, "E3": 0, "E4": 25, "E5": 100 } },
    { "customer": "Abdullah Book Depot Mzd", "items": { "H6": 10, "H7": 10, "H8": 10, "U3": 15, "U4": 15, "U5": 50, "E3": 15, "E4": 15, "E5": 50 } },
    { "customer": "Chaudary Book Depot Garhi Dopatta", "items": { "U3": 0, "U4": 0, "U5": 100, "E3": 0, "E4": 0, "E5": 100 } },
    { "customer": "Al Fallah Book Depot Kundal Shahi", "items": { "U3": 50, "U4": 100, "U5": 100, "E3": 50, "E4": 100, "E5": 100 } },
    { "customer": "Moiz Stationers Hajira", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 25, "U4": 50, "U5": 100, "E3": 25, "E4": 50, "E5": 100 } },
    { "customer": "Moiz Stationers Hajira", "items": { "U3": 50, "U4": 100, "U5": 100, "E3": 50, "E4": 100, "E5": 100 } },
    { "customer": "Shahid Book Depot Dudyal", "items": { "H6": 100, "H7": 100, "H8": 100, "U3": 200, "U4": 250, "U5": 250, "E3": 200, "E4": 250, "E5": 250 } },
    { "customer": "Neelum Book Land Athmuqam", "items": { "U3": 40, "U4": 40, "U5": 40, "E3": 40, "E4": 40, "E5": 40 } },
    { "customer": "Sidhuzai Book Depot Tararkhel", "items": { "U3": 100, "U4": 100, "U5": 100, "E3": 100, "E4": 100, "E5": 100 } },
    { "customer": "City Book Depot Mirpur", "items": { "H6": 300, "H8": 300, "U3": 1100, "U4": 1150, "U5": 100, "E3": 1100, "E4": 1150, "E5": 940 } },
    { "customer": "Roshan Book Depot Kotli", "items": { "H6": 100, "H7": 100, "H8": 100, "U3": 200, "U4": 300, "U5": 300, "E3": 200, "E4": 300, "E5": 300 } },
    { "customer": "Chaudary Book Depot Garhi Dopatta", "items": { "U3": 300, "U4": 300, "U5": 300, "E3": 300, "E4": 300, "E5": 300 } },
    { "customer": "Muslim Book Depot Mzd", "items": { "H8": 100, "U3": 150, "U4": 150, "U5": 150, "E3": 150, "E4": 150, "E5": 150 } },
    { "customer": "Khawaja Book Depot Athmuqam", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 100, "U4": 150, "U5": 150, "E3": 100, "E4": 150, "E5": 150 } },
    { "customer": "Sadaat Book Depot Mzd", "items": { "H7": 150, "H8": 200, "U3": 2000, "U4": 2000, "U5": 2000, "E3": 2000, "E4": 2000, "E5": 2000 } },
    { "customer": "Adeel Book Depot Kotli", "items": { "U3": 0, "U4": 50, "U5": 100, "E3": 0, "E4": 50, "E5": 100 } },
    { "customer": "Mirza Book Depot Hatlyan", "items": { "U3": 100, "U4": 100, "U5": 100, "E3": 100, "E4": 100, "E5": 100 } },
    { "customer": "Shahid Book Depot Dudyal", "items": { "U3": 100, "U4": 100, "U5": 100, "E3": 100, "E4": 100, "E5": 100 } },
    { "customer": "City Book Depot Mirpur", "items": { "U5": 2500, "E5": 2000 } },
    { "customer": "City Book Depot Mirpur", "items": { "H8": 200, "U4": 750, "E4": 300 } },
    { "customer": "Pakistan Book Depot Dhirkot", "items": { "U3": 40, "U4": 80, "U5": 80, "E3": 40, "E4": 80, "E5": 80 } },
    { "customer": "Khurshid Sons Book Depot Abaspur", "items": { "U3": 50, "U4": 50, "U5": 100, "E3": 50, "E4": 50, "E5": 100 } },
    { "customer": "Dawn Book Depot Hajira", "items": { "U3": 200, "U4": 300, "U5": 300, "E3": 200, "E4": 300, "E5": 300 } },
    { "customer": "Fazal Rehman Books Jona Sehensa", "items": { "U3": 500, "U4": 500, "U5": 500, "E3": 500, "E4": 500, "E5": 500 } },
    { "customer": "Azad Book Depot Bhimber", "items": { "H7": 150, "H8": 150, "U3": 1000, "U4": 2000, "E4": 1000, "E5": 1000 } },
    { "customer": "Awan Book Depot Tatapani", "items": { "H6": 100 } },
    { "customer": "Sikandar Book Depot Baloch", "items": { "U3": 20, "U4": 30, "U5": 40, "E3": 20, "E4": 30, "E5": 40 } },
    { "customer": "Chaudary Book Depot Mzd", "items": { "H6": 30, "H8": 30, "U3": 100, "U4": 200, "U5": 200, "E3": 100, "E4": 200, "E5": 200 } },
    { "customer": "Awami Book Depot", "items": { "U3": 150, "U4": 200, "U5": 200, "E3": 150, "E4": 200, "E5": 200 } },
    { "customer": "Moiz Stationers Hajira", "items": { "H6": 30, "H7": 30, "H8": 30, "U3": 0, "U4": 50, "U5": 100, "E3": 0, "E4": 50, "E5": 100 } },
    { "customer": "Muslim Book Depot Mzd", "items": { "U3": 200, "U4": 300, "U5": 300, "E3": 200, "E4": 300, "E5": 300 } },
    { "customer": "Azad Book Depot Mzd", "items": { "U3": 300, "U4": 300, "U5": 300, "E3": 300, "E4": 300, "E5": 300 } },
    { "customer": "Awan Book Depot Tatapani", "items": { "H7": 50, "U3": 150, "U4": 150, "E4": 150, "E5": 150 } },
    { "customer": "Raza Book Depot Mzd", "items": { "U3": 30, "U4": 30, "U5": 30, "E3": 30, "E4": 30, "E5": 30 } },
    { "customer": "Hameed Sons Kitab Ghar Abaspur", "items": { "U3": 500, "U4": 500, "U5": 500, "E3": 500, "E4": 200, "E5": 300 } },
    { "customer": "Azad Book Depot Bhimber", "items": { "H8": 100, "U3": 500, "U4": 1000, "U5": 400, "E3": 800 } },
    { "customer": "Awan Book Depot Tatapani", "items": { "H7": 30, "U3": 50, "U4": 130, "U5": 150, "E4": 150, "E5": 150 } },
    { "customer": "Fazal Rehman Books Jona Sehensa", "items": { "U5": 250, "E5": 250 } },
    { "customer": "Amir Book Depot Hajira", "items": { "U3": 50, "U4": 50, "U5": 50, "E3": 50, "E4": 50, "E5": 50 } },
    { "customer": "College Book Depot Kotli", "items": { "H6": 30, "H7": 30, "H8": 30, "U5": 150, "E5": 0 } },
    { "customer": "Azad Book Depot Bhimber", "items": { "H6": 250, "E5": 350 } },
    { "customer": "Kashmir Book Depot Rwp", "items": { "U3": 500, "U4": 500, "U5": 1000, "E3": 500, "E4": 500, "E5": 1000 } },
    { "customer": "Sadaat Book Depot Mzd", "items": { "H6": 150, "H7": 150, "H8": 150, "U3": 500, "U4": 500, "U5": 1300, "E4": 300, "E5": 1100 } },
    { "customer": "City Book Depot Mirpur", "items": { "H8": 300, "U3": 500, "U4": 1000, "U5": 500, "E3": 500, "E4": 1000, "E5": 1000 } },
    { "customer": "Dawn Book Depot Hajira", "items": { "H6": 50, "H8": 50, "U3": 100, "U4": 100, "U5": 200, "E3": 100, "E4": 150, "E5": 150 } },
    { "customer": "Pak Book Depot Mzd", "items": { "U3": 50, "U4": 150, "U5": 150, "E3": 50, "E4": 150, "E5": 150 } },
    { "customer": "Sidhuzai Book Depot Tararkhel", "items": { "H8": 50 } },
    { "customer": "Chairman Textbook Board", "items": { "U5": 470, "E5": 470 } },
    { "customer": "Roshan Book Depot Kotli", "items": { "U3": 200, "U4": 200, "U5": 300, "E3": 200, "E4": 200, "E5": 300 } },
    { "customer": "Book Point Bagh", "items": { "H6": 50, "H7": 50, "H8": 50, "U3": 25, "U4": 200, "U5": 200, "E3": 25, "E4": 200, "E5": 200 } },
    { "customer": "Chaudary Book Depot Garhi Dopatta", "items": { "U3": 100, "U4": 100, "U5": 100, "E3": 100, "E4": 100, "E5": 100 } },
    { "customer": "Al Noor Book Depot Hatlyan", "items": { "H6": 50, "H7": 50, "H8": 50, "U5": 100, "E5": 100 } },
    { "customer": "Awami Book Depot", "items": { "U3": 50, "U4": 100, "U5": 100, "E3": 50, "E4": 100, "E5": 100 } },
    { "customer": "Pakistan Book Depot Dhirkot", "items": { "U3": 25, "U4": 50, "U5": 50, "E3": 25, "E4": 50, "E5": 50 } },
    { "customer": "Dawn Book Depot Hajira", "items": { "H8": 45, "U5": 150, "E5": 100 } },
    { "customer": "Al Fallah Book Depot Kundal Shahi", "items": { "H6": 50, "H7": 50, "H8": 100 } },
    { "customer": "Amir Book Depot Hajira", "items": { "U5": 50 } },
    { "customer": "Sadaat Book Depot Mzd", "items": { "H6": 200, "H7": 150, "H8": 50 } },
    { "customer": "Azad Book Depot Bhimber", "items": { "H8": 100, "U5": 200, "E4": 200 } },
    { "customer": "City Book Depot Mirpur", "items": { "H6": 200, "H8": 200 } },
    { "customer": "Pakistan Book Depot Dhirkot", "items": { "U3": 25, "U4": 40, "U5": 40, "E3": 25, "E4": 40, "E5": 40 } },
    { "customer": "Hassan Book Depot Urdu Bazar", "items": { "H6": 50, "H8": 50 } },
    { "customer": "Awan Book Depot Tatapani", "items": { "H6": 20, "H8": 20, "U5": 50, "E5": 50 } },
    { "customer": "Sadaat Book Depot Mzd", "items": { "H6": 100, "H7": 100, "H8": 100 } },
    { "customer": "Sadaat Book Depot Mzd", "items": { "H6": 100, "H7": 100, "H8": 100 } },
    { "customer": "Pakistan Book Depot Dhirkot", "items": { "U3": 10, "U4": 20, "U5": 70, "E3": 10, "E4": 20, "E5": 40 } },
    { "customer": "City Book Depot Mirpur", "items": { "H6": 200 } },
    { "customer": "Azad Book Depot Bhimber", "items": { "U5": 150, "E5": 150 } }
];

async function addData() {
    const dbStr = localStorage.getItem('ugp_v37_final');
    if (!dbStr) return console.log('DB NOT FOUND');
    let db = JSON.parse(dbStr);

    const getProduct = (code) => {
        let search = '';
        if (code === 'H6') search = 'Home Economics 6';
        if (code === 'H7') search = 'Home Economics 7';
        if (code === 'H8') search = 'Home Economics 8';
        if (code.startsWith('U')) search = 'Urdu Grammar ' + code.substring(1);
        if (code.startsWith('E')) search = 'English Grammar ' + code.substring(1);

        return db.items.find(i => i.name.toLowerCase().includes(search.toLowerCase()));
    };

    for (const entry of data) {
        let cust = db.customers.find(c => c.name.toLowerCase() === entry.customer.toLowerCase());

        if (!cust) {
            console.log('CUST NOT FOUND, ASSIGNING TO QUOTATION:', entry.customer);
            // Find "A Quotation" customer
            cust = db.customers.find(c => c.name === "A Quotation");

            // If even "A Quotation" doesn't exist, create it
            if (!cust) {
                console.log('CREATING "A Quotation" CUSTOMER');
                cust = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    name: "A Quotation",
                    phone: "",
                    balance: 0,
                    discounts: {}
                };
                db.customers.push(cust);
            }
        }

        const items = [];
        let billTotal = 0;
        for (const [code, qty] of Object.entries(entry.items)) {
            if (qty <= 0) continue;
            const product = getProduct(code);
            if (!product) {
                console.log('PROD NOT FOUND:', code);
                continue;
            }

            const disc = cust.discounts?.[product.id] || (product.name.toLowerCase().includes('grammar') ? 25 : 15);
            const total = (product.price * qty) * (1 - disc / 100);
            items.push({
                id: product.id,
                name: product.name,
                rate: product.price,
                qty: qty,
                disc: disc,
                total: total,
                bundles: qty / (product.bundleSize || 50)
            });
            billTotal += total;
            product.stock -= qty;
        }

        if (items.length === 0) continue;

        const lastInv = db.salesHistory.length > 0 ? Math.max(...db.salesHistory.map(s => s.inv)) : 10000;
        const newInv = lastInv + 1;
        const record = {
            inv: newInv,
            customer: cust.name,
            customerId: cust.id,
            date: new Date().toLocaleDateString(),
            items: items,
            billTotal: billTotal,
            prevBal: cust.balance,
            finalPayable: billTotal + cust.balance
        };

        db.salesHistory.unshift(record);
        cust.balance += billTotal;
    }

    db.lastModified = Date.now();
    localStorage.setItem('ugp_v37_final', JSON.stringify(db));
    console.log('DONE');

    // Sync to cloud
    try {
        const CLOUD_PUT_URL = 'https://api.jsonsilo.com/api/silo/8f1bfee8-0d66-4d3d-891c-e32ae2728964';
        console.log('Syncing to cloud...');
        const response = await fetch(CLOUD_PUT_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        console.log('CLOUD SYNC SUCCESSFUL');
    } catch (e) {
        console.error('Error:', e);
    }
}

addData();
