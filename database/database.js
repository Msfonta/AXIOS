const Client = require('pg').Client
const cliente = new Client({
    user: "postgres",
    password: "m1s2f3senna",
    host: "localhost",
    port: 5432,
    database: "testeMHR"
})

async function connect() {
    try {
      await cliente.connect();
      console.log('Connected to the database');
        await cliente.query("select * from usuarios")
        .then(response => {
          console.log(response.rows)
        })
        .catch(error => console.log(error))
    } catch (err) {
      console.error('Failed to connect to the database', err);
    }
  }
  
  connect()


  
  
  
  
  
  
  