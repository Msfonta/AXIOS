const {Client} = require('pg')

const cliente = new Client({
    user: "postgres",
    password: "m1s2f3senna",
    host: "localhost",
    port: 5432,
    database: "testeMHR"
})

module.exports = cliente;