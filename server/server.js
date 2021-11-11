const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const db = require('./src/pgModels');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  return res.status(200).sendFile(path.join(__dirname, '../index.html'));
});

app.get('/client/src/styles.css', (req, res) => {
  return res.status(200).sendFile(path.join(__dirname, '../client/src/styles.css'));
});

app.use('/build', express.static(path.join(__dirname, '../build')));

app.get('/getStock/:stock', async (req, res) => {
  const stock = req.params.stock;
  const result = await db.query(`SELECT to_regclass('${stock}')`);
  if (result.rows[0].to_regclass === null) { // table does not exist
    console.log('fetching data from Yahoo Finance...');
    let data = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${stock}?period1=0&period2=4102444800&interval=1d&events=history&includeAdjustedClose=true`);
    data = await data.text();
    const data1 = data.split('\n');
    data1.shift();

    const query1 = `
      CREATE TABLE IF NOT EXISTS ${stock} as
      SELECT * FROM stock_template;
    `;
    const query2 = `INSERT INTO ${stock} ( Date, Open, High, Low, Close, Adj_Close, Volume ) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    await db.query(query1);
    for (const row of data1) {
      await db.query(query2, row.split(','), false);
    } 

    const query3 = `
      CREATE TABLE IF NOT EXISTS ${stock}_aug as 

      WITH m as
      (SELECT
        min(Date) as min_Date,
        max(Date) as max_Date
      FROM ${stock}),
      
      d as
      (SELECT dt.* 
      FROM date_template dt
      INNER JOIN m
      ON dt.Date BETWEEN m.min_Date AND m.max_Date)
      
      SELECT
        te.Date_orig,
        extract(dow from cast(te.Date_orig as date)) as Weekday,
        coalesce(te.Date, tp.Date, tm.Date) as Date_adj,
        CASE
          WHEN te.Date IS NOT NULL THEN '00'
          WHEN tp.Date IS NOT NULL then '+1'
          WHEN tm.Date IS NOT NULL then '-1'
        END as Adj,
        coalesce(te.Open, tp.Open, tm.Open) as Open,
        coalesce(te.Close, tp.Close, tm.Close) as Close,
        coalesce(te.Volume, tp.Volume, tm.Volume) as Volume
      FROM
        (SELECT
          d.Date as Date_orig,
          s.*
        FROM ${stock} s
        RIGHT JOIN d
        ON s.Date = d.Date) te
      INNER JOIN
        (SELECT
          d.Date as Date_orig,
          s.*
          FROM ${stock} s
          RIGHT JOIN d
        ON s.Date = cast(cast(d.Date as date) + integer '1' as varchar(10))) tp
      ON te.Date_orig = tp.Date_orig
      INNER JOIN
        (SELECT
          d.Date as Date_orig,
          s.*
          FROM ${stock} s
          RIGHT JOIN d
        ON s.Date = cast(cast(d.Date as date) - integer '1' as varchar(10))) tm
      ON te.Date_orig = tm.Date_orig;
    `;
    await db.query(query3);
  }
  const query4 = `
    SELECT * FROM ${stock}_aug
    WHERE Date_orig IS NOT NULL AND Date_Adj IS NOT NULL AND Open IS NOT NULL AND Close IS NOT NULL
    ORDER BY Date_orig desc
  `;
  const result1 = await db.query(query4);
  return (typeof result1.rows !== undefined) ? res.status(200).json(result1.rows) : res.status(400).json(`${stock} not found`);
});

app.get('/updateStock/:stock', async (req, res) => {
  const stock = req.params.stock;
  const result1 = await db.query(`DROP TABLE IF EXISTS ${stock}`);
  const result2 = await db.query(`DROP TABLE IF EXISTS ${stock}_aug`);
  return res.redirect(`/getStock/${stock}`);
})

app.delete('/deleteStock/:stock', async (req, res) => {
  const stock = req.params.stock;
  const result1 = await db.query(`DROP TABLE IF EXISTS ${stock}`);
  const result2 = await db.query(`DROP TABLE IF EXISTS ${stock}_aug`);
  return res.status(200).json(`Deleted ${stock} from database`);
})

app.get('/getEarnings/:stock', async (req, res) => {
  const stock = req.params.stock;
  let data = await fetch(`https://finance.yahoo.com/calendar/earnings/?symbol=${stock}`);
  data = await data.text();
  return res.status(200).json(data);

})

app.get('/getDividends/:stock', async (req, res) => {
  const stock = req.params.stock;
  let data = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${stock}?period1=0&period2=4102444800&interval=1d&events=div&includeAdjustedClose=true`);
  data = await data.text();
  const data1 = data.split('\n');
  data1.shift();
  return res.status(200).json(data1.map(row => row.split(',')[0]));
})

app.get('/getSplit/:stock', async (req, res) => {
  const stock = req.params.stock;
  let data = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${stock}?period1=0&period2=4102444800&interval=1d&events=split&includeAdjustedClose=true`);
  data = await data.text();
  const data1 = data.split('\n');
  data1.shift();
  return res.status(200).json(data1.map(row => row.split(',')[0]));
})

// app.get('/index.js', (req, res) => {
//   return res.status(200).sendFile(path.join(__dirname, '../client/index.js'));
// });

app.listen(PORT);
