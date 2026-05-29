const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// 🔑 TAJAMMAL SMM CONFIGURATION
const API_URL = "https://tajammalsmmpanel.com/api/v2";
const API_KEY = "54fc92c387a79f8ddf2660fb6a5c2d86";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// HTML UI Layout
app.get('/', async (req, res) => {
    let servicesHtml = `<option value="" data-rate="0">🔄 Loading Services...</option>`;
    let userBalance = "0.00";

    try {
        // 1. Fetch User Profile Balance Live
        const balanceRes = await axios.post(API_URL, new URLSearchParams({
            key: API_KEY,
            action: 'balance'
        }), { timeout: 5000 });
        if (balanceRes.data && balanceRes.data.balance) {
            userBalance = parseFloat(balanceRes.data.balance).toFixed(2);
        }

        // 2. Fetch Services Live with Rates
        const response = await axios.post(API_URL, new URLSearchParams({
            key: API_KEY,
            action: 'services'
        }), { timeout: 8000 });
        
        if (Array.isArray(response.data)) {
            servicesHtml = response.data.map(s => 
                `<option value="${s.service}" data-rate="${s.rate}">[${s.category}] ID: ${s.service} - ${s.name} - ($${s.rate}/1k)</option>`
            ).join('');
        }
    } catch (err) {
        servicesHtml = `<option value="" data-rate="0">❌ Error connecting to Tajammal API</option>`;
    }

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nawab ZADA SMM Panel 🦅</title>
        <style>
            body { background: #121212; color: white; font-family: sans-serif; padding: 15px; margin: 0; }
            .header { text-align: center; margin-bottom: 20px; font-weight: bold; letter-spacing: 1px; color: #e57373; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .box { background: #e57373; padding: 15px; border-radius: 8px; text-align: center; color: white; }
            .box h3 { margin: 0; font-size: 12px; opacity: 0.9; }
            .box p { margin: 8px 0 0 0; font-size: 16px; font-weight: bold; }
            .card { background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333; }
            label { display: block; margin: 15px 0 5px 0; font-weight: bold; color: #ccc; }
            .form-control { width: 100%; padding: 12px; border: 1px solid #333; background: #252525; color: white; border-radius: 6px; box-sizing: border-box; }
            .btn { background: #e57373; color: white; border: none; width: 100%; padding: 14px; font-size: 16px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: 0.3s; }
            .btn:hover { background: #d32f2f; }
            #status { text-align: center; margin-top: 15px; font-weight: bold; color: #ffcc00; font-size: 15px; }
            .cost-display { margin-top: 10px; font-size: 13px; color: #a5d6a7; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header"><h2>NAWAB ZADA SMM PANEL</h2></div>
        
        <div class="grid">
            <div class="box"><h3>Welcome Owner</h3><p>Nawab ZADA</p></div>
            <div class="box"><h3>Live Balance</h3><p>$ ${userBalance}</p></div>
        </div>

        <div class="card">
            <form id="orderForm">
                <label>Select Server Service</label>
                <select id="service" class="form-control" required>${servicesHtml}</select>

                <label>Target Link (WhatsApp Poll / Social Profile)</label>
                <input type="url" id="link" class="form-control" placeholder="https://..." required>

                <label>Poll Option / Target Answer (If WhatsApp Poll)</label>
                <input type="text" id="answer" class="form-control" placeholder="e.g. A, B, Option 1, Yes, 100 (Leave blank for normal links)">

                <label>Quantity</label>
                <input type="number" id="quantity" class="form-control" placeholder="e.g. 1000" required>
                <div id="costEstimate" class="cost-display">Estimated Cost: $0.00</div>

                <button type="submit" class="btn">SUBMIT LIVE ORDER 🚀</button>
            </form>
            <div id="status">System Ready</div>
        </div>

        <script>
            const serviceSelect = document.getElementById('service');
            const quantityInput = document.getElementById('quantity');
            const costEstimate = document.getElementById('costEstimate');

            function calculateCost() {
                const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
                const rate = parseFloat(selectedOption.getAttribute('data-rate')) || 0;
                const qty = parseInt(quantityInput.value) || 0;
                const cost = (rate / 1000) * qty;
                costEstimate.innerText = "Estimated Cost: $" + cost.toFixed(4);
            }

            serviceSelect.addEventListener('change', calculateCost);
            quantityInput.addEventListener('input', calculateCost);

            document.getElementById('orderForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const statusDiv = document.getElementById('status');
                statusDiv.style.color = "#ffcc00";
                statusDiv.innerText = "🔄 Processing API request...";
                
                const payload = {
                    service: serviceSelect.value,
                    link: document.getElementById('link').value,
                    quantity: quantityInput.value,
                    answer: document.getElementById('answer').value
                };

                try {
                    const res = await fetch('/api/place-order', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if(data.order) {
                        statusDiv.style.color = "#00ff66";
                        statusDiv.innerText = "✅ Success! Order ID: " + data.order;
                    } else {
                        statusDiv.style.color = "#ff3333";
                        statusDiv.innerText = "❌ API Error: " + (data.error || "Check Funds");
                    }
                } catch(err) {
                    statusDiv.style.color = "#ff3333";
                    statusDiv.innerText = "❌ Connection Refused";
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Order Router Engine (Handles Answer mapping seamlessly)
app.post('/api/place-order', async (req, res) => {
    const { service, link, quantity, answer } = req.body;
    
    // SMM panels structure standard payload configuration
    const postParams = {
        key: API_KEY,
        action: 'add',
        service: service,
        link: link,
        quantity: quantity
    };

    // If answer option is provided, map it dynamically to standard custom parameters
    if (answer && answer.trim() !== "") {
        postParams['answer'] = answer.trim(); 
    }

    try {
        const response = await axios.post(API_URL, new URLSearchParams(postParams));
        res.json(response.data);
    } catch (error) {
        res.json({ error: "Gateway server connection failed" });
    }
});

module.exports = app;
        
