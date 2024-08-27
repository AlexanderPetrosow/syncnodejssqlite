const mysql = require('mysql');
const util = require('util');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pass',
  database: 'main'
});

// Делаем connection.query промисифицированным для использования async/await
const query = util.promisify(connection.query).bind(connection);

(async () => {
  try {
    await connection.connect();

    const orders = await query(`
      SELECT o.logicalref, o.Comment
      FROM orders o
      WHERE NOT EXISTS (
          SELECT 1
          FROM comments c
          WHERE o.logicalref = c.order_ref
      )
      LIMIT 300;
    `);

    const pattern = /(EMA|Min|BTC|Max|MAvg)\((.*?)\) = (.*?)%/g;
    let promises = [];

    orders.forEach(order => {
      const { logicalref, Comment } = order;
      let match;
      let found = false;

      while ((match = pattern.exec(Comment)) !== null) {
        found = true; // Обозначаем, что найдено хотя бы одно совпадение
        const prefix = match[1];   // Сохраняем префикс (EMA, Min, BTC, Max, MAvg)
        const delay = match[2];    // Значение в скобках
        const perc_val = match[3]; // Процентное значение

        // Сохраняем промисы запросов на вставку с новыми столбцами
        const insertPromise = query('INSERT INTO Comments (order_ref, prefix, delay, perc_val) VALUES (?, ?, ?, ?)', [logicalref, prefix, delay, perc_val]);
        promises.push(insertPromise);
      }

      if (!found) { // Если совпадений не найдено
        const insertPromise = query('INSERT INTO Comments (order_ref, prefix, delay, perc_val) VALUES (?, NULL, NULL, NULL)', [logicalref]);
        promises.push(insertPromise);
      }
    });

    // Ожидаем завершения всех запросов на вставку
    await Promise.all(promises);

    console.log('Все записи успешно вставлены.');
  } catch (error) {
    console.error(error);
  } finally {
    // Закрываем соединение в блоке finally, чтобы убедиться, что оно закроется в любом случае
    connection.end();
  }
})();
