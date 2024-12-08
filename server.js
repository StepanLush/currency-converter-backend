const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/convert', async (req, res) => {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
        return res.status(400).json({ error: 'Missing required query parameters' });
    }
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const rate = response.data.rates[to];
        if (!rate) {
            return res.status(404).json({ error: 'Currency not found' });
        }
        const convertedAmount = (amount * rate).toFixed(2);
        res.json({ from, to, amount, convertedAmount });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching exchange rates' });
    }
});

app.get('/currencies', async (req, res) => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        res.json({ rates: response.data.rates });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching currencies' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
