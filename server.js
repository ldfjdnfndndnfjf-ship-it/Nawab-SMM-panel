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
    let servicesHtml = `<option value="">🔄 Loading Services from Tajammal SMM...</option>`;
    try {
        const response = await axios.post(API_URL, new URLSearchParams({
            key: API_KEY,
            action: 'services'
        }), { timeout: 8000 });
        
        if (Array.isArray(response.data)) {
            servicesHtml = response.data.map(s => 
                `<option value="${s.service}">[${s.category}] ID: ${s.service} - ${s.name} - ($${s.rate}/1k)</option>`
            ).join('');
        }
    } catch (err) {
        servicesHtml = `<option value="">❌ Error loading services from API</option>`;
    }

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nawab ZADA SMM Panel 🦅</title>
        <style>
            body { background: #121212; color: white; font-family: sans-serif; padding: 15px; margin: 0; }
            .header { text-align: center; margin-bottom: 20px; font-weight: bold; letter-spacing: 1px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .box { background: #e57373; padding: 15px; border-radius: 8px; text-align: center; color: white; }
            .box h3 { margin: 0; font-size: 12px; opacity: 0.9; }
            .box p { margin: 8px 0 0 0; font-size: 16px; font-weight: bold; }
            .card { background: #1e1e1e; padding: 20px; border-radius: 12px; }
            label { display: block; margin: 10px 0 5px 0; font-weight: bold; color: #ccc; }
            .form-control { width: 100%; padding: 12px; border: 1px solid #333; background: #252525; color: white; border-radius: 6px; box-sizing: border-box; }
            .btn { background: #e57373; color: white; border: none; width: 100%; padding: 14px; font-size: 16px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 20px; }
            #status { text-align: center; margin-top: 15px; font-weight: bold; color: #ffcc00; }
        </style>
    </head>
    <body>
        <div class="header"><h2>NAWAB ZADA SMM PANEL</h2></div>
        <div class="grid">
            <div class="box"><h3>Welcome Dear</h3><p>User</p></div>
            <div class="box"><h3>Total Orders</h3><p>7574830</p></div>
            <div class="box"><h3>Total Spent</h3><p>$ 0.00</p></div>
            <div class="box"><h3>Your Balance</h3><p>$ 50.00</p></div>
        </div>
        <div class="card">
            <form id="orderForm">
                <label>Select Service</label>
                <select id="service" class="form-control" required>${servicesHtml}</select>
                <label>Target Link</label>
                <input type="url" id="link" class="form-control" placeholder="Paste WhatsApp Poll link here..." required>
                <label>Quantity</label>
                <input type="number" id="quantity" class="form-control" placeholder="e.g. 1000" required>
                <button type="submit" class="btn">SUBMIT LIVE ORDER 🚀</button>
            </form>
            <div id="status">System Online</div>
        </div>
        <script>
            document.getElementById('orderForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const statusDiv = document.getElementById('status');
                statusDiv.innerText = "🔄 Sending order to Tajammal SMM...";
                const payload = {
                    service: document.getElementById('service').value,
                    link: document.getElementById('link').value,
                    quantity: document.getElementById('quantity').value
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
                        statusDiv.innerText = "✅ Order Placed! ID: " + data.order;
                    } else {
                        statusDiv.style.color = "#ff3333";
                        statusDiv.innerText = "❌ Failed: " + (data.error || "Unknown Error");
                    }
                } catch(err) {
                    statusDiv.style.color = "#ff3333";
                    statusDiv.innerText = "❌ Network Connection Error";
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Order handler router forward link
app.post('/api/place-order', async (req, res) => {
    const { service, link, quantity } = req.body;
    try {
        const response = await axios.post(API_URL, new URLSearchParams({
            key: API_KEY,
            action: 'add',
            service: service,
            link: link,
            quantity: quantity
        }));
        res.json(response.data);
    } catch (error) {
        res.json({ error: "Gateway server connection failed" });
    }
});

module.exports = app;
