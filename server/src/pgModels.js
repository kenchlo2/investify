const { Pool, types } = require('pg');
types.setTypeParser(1700, function(val) {
    return parseFloat(val);
});

const PG_URI = 'investify';

// create a new pool here using the connection string above
const pool = new Pool({
  connectionString: PG_URI
});

// We export an object that contains a property called query,
// which is a function that returns the invocation of pool.query() after logging the query
// This will be required in the controllers to be the access point to the database
module.exports = {
  query: (text, params, print = true) => {
    if (print) console.log('executed query', text);
    return pool.query(text, params);
  }
};
