const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promClient = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());


// Создание метрик
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics(); // Автоматически собирает стандартные метрики, такие как загрузка CPU, память и т.д.

const requestCounter = new promClient.Counter({
    name: 'currency_converter_requests_total',
    help: 'Total number of requests to the currency converter endpoint'
});

const requestDurationHistogram = new promClient.Histogram({
    name: 'currency_converter_request_duration_seconds',
    help: 'Histogram of request durations for currency conversion',
    buckets: [0.1, 0.2, 0.5, 1, 2, 5]  // Значения для группировки
});


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

// Экспозитор метрик для Prometheus
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType); // Устанавливаем заголовок для Prometheus
        res.end(await promClient.register.metrics()); // Отправляем метрики
    } catch (error) {
        res.status(500).send('Error generating metrics');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
