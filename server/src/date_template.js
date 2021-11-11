const db = require('./pgModels');

const date = new Date('1970-01-01');
let dateStr;
let query = 'INSERT INTO date_template VALUES ';
do {
  dateStr = date.toISOString().slice(0, 10);
  if(date.getUTCDay() >= 1 && date.getUTCDay() <= 5) {
    query += `('${dateStr}'), `;
  }
  date.setDate(date.getDate() + 1);
} while (dateStr < '2030-12-31');

db.query(query.slice(0, -2));
