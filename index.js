const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

// Инициализация Express приложения
const app = express();
const PORT = 8443;
const logFilePath = 'C://Soft/NodeJsProg/log.txt'; // Путь к файлу лога
// Stream for appending to log file
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
const maxLogAge = 1; // Maximum age for log entries in days

async function logToFile(message) {
    const now = new Date();
    const timestamp = now.toISOString();
    const logMessage = `${timestamp} - ${message}\n`;

    // Write to the log file
    logStream.write(logMessage);

    // Check and clean log file periodically
    if (now.getHours() === 0 && now.getMinutes() === 0) { // Check daily at midnight
        const oldLogs = await fs.promises.readFile(logFilePath, 'utf8');
        const lines = oldLogs.split('\n');
        const threshold = new Date(now.getTime() - maxLogAge * 24 * 60 * 60 * 1000).toISOString();
        
        const filteredLogs = lines.filter(line => {
            const lineTime = line.split(' - ')[0];
            return lineTime > threshold;
        }).join('\n');

        await fs.promises.writeFile(logFilePath, filteredLogs, 'utf8');
    }
}


// Параметры подключения к базе данных MySQL и использование пула соединений
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'pass',
    database: 'main',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

app.use(bodyParser.json());
app.use(basicAuth({
    users: { 'rest': 'api' },
    unauthorizedResponse: (req) => {
        return 'Unauthorized';
    }
}));

app.post('/sendJson', async (req, res) => {
    const { ipAddress, databasePath, data } = req.body;
    if (!data || !Array.isArray(data)) {
        logToFile('Data must be a JSON array.');
        return res.status(400).send('Data must be a JSON array.');
    }
    logToFile('REQUEST ON ' + ipAddress + ' ' + databasePath);
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
       

        const promises = data.map(item => processItem(connection, item, ipAddress, databasePath));
        await Promise.all(promises);

        await connection.commit();
        logToFile('Operations completed successfully.');
        res.status(200).send('Operations completed successfully.');
    } catch (error) {
        console.error('Database error:', error.message);
        logToFile(error.message);
        res.status(500).send('Database error');
    } finally {
        connection.release()  // Освобождаем соединение независимо от исхода запроса
    }
});

async function processItem(connection, item, ipAddress, databasePath) {
    const [rows] = await connection.execute(`SELECT logicalref FROM Orders WHERE ID = ? AND ipAddress = ? AND databasePath = ?`, [item.ID, ipAddress, databasePath]);

    if (rows.length > 0) {
        await connection.execute(`DELETE FROM Orders WHERE ID = ? AND ipAddress = ? AND databasePath = ?`, [item.ID, ipAddress, databasePath]);
    }

    await connection.execute(`INSERT INTO Orders (ipAddress, databasePath, ID, exOrderID, Coin, BuyDate, SellSetDate, CloseDate, Quantity, BuyPrice, SellPrice, SpentBTC, GainedBTC, ProfitBTC, Source, Channel, ChannelName, Status, Comment, BaseCurrency, BoughtQ, BTC1hDelta, Exchange1hDelta, SignalType, SellReason, FName, deleted, Emulator, Imp, BTC24hDelta, Exchange24hDelta, bvsvRatio, BTC5mDelta, IsShort, Pump1H, Dump1H, d24h, d3h, d1h, d15m, d5m, d1m, dBTC1m, PriceBug, Vd1m, Lev, hVol, hVolF, dVol, TaskID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Здесь должны быть указаны все значения для вставки
            [ipAddress, databasePath, item.ID, item.exOrderID, item.Coin, item.BuyDate, item.SellSetDate, item.CloseDate, item.Quantity, item.BuyPrice, item.SellPrice, item.SpentBTC, item.GainedBTC, item.ProfitBTC, item.Source, item.Channel, item.ChannelName, item.Status, item.Comment, item.BaseCurrency, item.BoughtQ, item.BTC1hDelta, item.Exchange1hDelta, item.SignalType, item.SellReason, item.FName, item.deleted, item.Emulator, item.Imp, item.BTC24hDelta, item.Exchange24hDelta, item.bvsvRatio, item.BTC5mDelta, item.IsShort, item.Pump1H, item.Dump1H, item.d24h, item.d3h, item.d1h, item.d15m, item.d5m, item.d1m, item.dBTC1m, item.PriceBug, item.Vd1m, item.Lev, item.hVol, item.hVolF, item.dVol, item.TaskID]
            ); // Здесь должны быть указаны все значения для вставки
}

app.get('/getJson', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM OrdersView");
        res.json(rows);
    } catch (error) {
        console.error('Database error:', error.message);
        logToFile(error.message);
        res.status(500).send('Database error');
    } 
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
