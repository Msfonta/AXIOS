const express = require('express')
const app = express();
const client = require('./src/app/database/database')
const bodyParser = require('body-parser')
const cors = require('cors')
const userController = require('./src/app/controller/userController')
const productsController = require('./src/app/controller/productsController')
const groupController = require('./src/app/controller/groupController')
const categoryController = require('./src/app/controller/categoryController')
const stockController = require('./src/app/controller/stockController')
const compositeProduct = require('./src/app/controller/compositeProduct')

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.listen(3000, function () {
    console.log('rodando na porta 3000')
})

app.set('view engine', 'ejs')

app.use('/user', userController)
app.use('/produto', productsController)
app.use('/grupo', groupController)
app.use('/categoria', categoryController)
app.use('/estoque', stockController)
app.use('/composto', compositeProduct)

