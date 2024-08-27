const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const os = require('os');
const path = require('path');
const directoryPath = 'C://Soft//Moon';
const baseUrl = 'http://example:8443/sendJson';
const auth = {
  username: 'rest',
  password: 'api',
};
const logFilePath = 'C:\\Soft\\NodeJsProg\\sendJson.txt'; // Путь к файлу лога
console.log('script started')
// Функция для логгирования
async function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  await fs.appendFile(logFilePath, logMessage);
}

// Функция для получения IP-адреса машины
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  console.log('ip added')
  return '0.0.0.0';
}
logToFile('Script started');
// Функция для отправки данных
async function sendData(ipAddress, databasePath, data) {
  try {
    const response = await axios.post(baseUrl, { ipAddress, databasePath, data }, { auth });
    if (response.status === 200) {
      await logToFile(`Data sent successfully: ${data[0].ID}`);
      return true;
    } else {
      await logToFile(`Error sending data: ${error}`);
      return false;
    }
  } catch (error) {
    await logToFile(`Error sending data: ${error}`);
    return false;
  }
}

// Функция для проверки и отправки данных из таблицы Orders
async function checkAndSendData(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      }
    });

    db.serialize(() => {
      db.run("CREATE TABLE IF NOT EXISTS History (ID INTEGER PRIMARY KEY)", (err) => {
        if (err) console.error("Error creating History table:", err.message);
      });

     const query = "SELECT * FROM Orders WHERE ID NOT IN (SELECT ID FROM History) and CloseDate <> 0";
      // const query = "SELECT o.* FROM Orders AS o LEFT JOIN History AS h ON o.ID = h.ID  WHERE h.ID IS NULL and o.CloseDate <> 0 LIMIT 1000";
      db.all(query, [], async (err, rows) => {
        if (err) {
          console.error(err.message);
          reject(err);
        }

        for (const row of rows) {
          const ipAddress = getIPAddress();
          const databasePath = dbPath;
          const sentSuccessfully = await sendData(ipAddress, databasePath, [row]);
          if (sentSuccessfully) {
            db.run("INSERT INTO History (ID) VALUES (?)", [row.ID], (err) => {
              if (err) console.error("Error inserting into History:", err.message);
            });
          }
        }

        db.close((err) => {
          if (err) {
            console.error(err.message);
            reject(err);
          }
          resolve(); // Закрываем соединение после завершения всех операций
        });
      });
    });
  });
}



// Рекурсивная функция для поиска файлов .db
async function findDbFiles(dir) {
  let dbFiles = [];
  const items = await fs.readdir(dir, { withFileTypes: true }); // Получаем элементы директории с информацией о файлах и папках

  for (const item of items) {
    // Пропускаем папку bak
    if (item.isDirectory() && item.name === 'bak') {
      continue; // Пропускаем эту папку и переходим к следующему элементу
    }

    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      // Если элемент является директорией, рекурсивно ищем в ней файлы
      dbFiles = dbFiles.concat(await findDbFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.db')) {
      // Если элемент является файлом с расширением .db, добавляем его в список
      dbFiles.push(fullPath);
    }
  }

  return dbFiles;
}


async function main() {
  try {
    const dbFiles = await findDbFiles(directoryPath); // Используем рекурсивную функцию для поиска файлов .db
    for (const dbPath of dbFiles) {
      await logToFile(`Processing database: ${dbPath}`);
      await checkAndSendData(dbPath);
    }
  } catch (err) {
    await logToFile('Error reading directory: ' + err);
  }
}

main();

