const express = require('express')
const app = express();
const path = require('path')
const client = require('./src/app/database/database')
const bodyParser = require('body-parser')
const cors = require('cors')
const userController = require('./src/app/controller/userController')
const productsController = require('./src/app/controller/productsController')
const groupController = require('./src/app/controller/groupController')
const categoryController = require('./src/app/controller/categoryController')
const stockController = require('./src/app/controller/stockController')
const compositeProduct = require('./src/app/controller/compositeProduct')
const inventoryController = require('./src/app/controller/inventoryController')

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


const publicPath = path.join('C:/users/MHR-ENG05/Desktop/projetoMHR');
app.use(express.static(publicPath));
// app.get('/', (req, res) => {
//     res.sendFile(path.join(publicPath, 'index.html'));
//   });

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

app.set('view engine', 'ejs')

app.use('/user', userController)
app.use('/produto', productsController)
app.use('/grupo', groupController)
app.use('/categoria', categoryController)
app.use('/estoque', stockController)
app.use('/composto', compositeProduct)
app.use('/inventario', inventoryController)

