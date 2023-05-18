const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// client.connect()

const verifyJWT = (req, res, next) => {
  const token = req.headers['x-access-token'];
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).end()
    }

    req.userId = decoded.id
    next()
  })
}


router.post('/cadastro', async (req, res) => {
  const produto = req.body;
  const insertQuery = `insert into produtos(nome, "codigoSKU", "dtValidade", quantidade, "pesoLiquido", "pesoBruto", marca, categoria_id) 
  values ('${produto.nome}', ${produto.codigoSKU}, '${produto.dtValidade}', ${produto.quantidade},  ${produto.pesoLiquido}, ${produto.pesoBruto}, '${produto.marca}', ${produto.categoria_id} )`

  client.query(insertQuery, (err, result) => {
    if (!err) {
      res.json({ status: true })
    } else {
      res.status(400).json({ status: false, message: 'Erro na inserção', debug: err.message });
    }
  })
  client.end;
})


router.get('/', (req, res) => {
  const selectQuery = `SELECT p.nome, cp.nome categoriaProduto, p."codigoSKU" id, p."dtValidade", p.quantidade, p."pesoLiquido", p."pesoBruto", p.excluido, p.marca, p."dataCadastro" FROM produtos p inner join categorias cp on p.categoria_id = cp.id where p.excluido = 0 AND cp.excluido = 0;`

  client.query(selectQuery, (err, result) => {
    if (!err) {
      res.send(result.rows);
    } else {
      res.status(400).json({ status: false, message: 'SQL incorreto' })
    }
  });
  client.end;
})

router.get('/:id', (req, res) => {
  const selectQuery = `SELECT p.nome, cp.nome categoriaProduto, p."codigoSKU" id, p."dtValidade", p.quantidade, p."pesoLiquido", p."pesoBruto", p.excluido, p.marca, p."dataCadastro" FROM produtos p inner join categorias cp on p.categoria_id = cp.id where p.excluido = 0 AND cp.excluido = 0 AND  p."codigoSKU"=${req.params.id}` 

  client.query(selectQuery, (err, result) => {
    if (!err) {
      res.json(result.rows);
    } else {
      res.json({ status: false, message: err.message });
    }
  });
  client.end;
})

router.put('/:id', async (req, res) => {
  const prod = req.body.produto;
  let updateQuery = `update produtos set nome = '${prod.nome}',"dtValidade" = '${prod.dtValidade}', quantidade= ${prod.qtde}, "itensPCaixa" = ${prod.itensCaixa}, "pesoLiquido" = ${prod.liquido}, "pesoBruto" = ${prod.bruto}, marca = '${prod.marca}', tipo = ${prod.tipo}, "updatedAt" = now() where id=${req.params.id}`
  console.log(updateQuery);

  client.query(updateQuery, (err, result) => {
    if (!err) {
      res.json(prod)
    }
    else {
      res.json({ status: false, message: err.message });
    }
  })
  client.end;
})

router.put('/delete/:id', (req, res) => {
  let updateQuery = `update produtos set excluido = 1 where id = ${req.params.id}`

  client.query(updateQuery, (err, result) => {
    if (!err) {
      res.json({ status: true })
    }
    else {
      res.json({ status: false, message: err.message });
    }
  })
  client.end;
})

module.exports = router;