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

router.get('/composto/:id', (req, res) => {
  const selectQuery = `SELECT p.nome, p."codigoSKU", p.id idproduto, c.quantidade, c.id FROM produto_composto pc inner join produtos p on p.id = pc.id_produto inner join composto c on c.id = pc.id_composto where pc.id_composto = ${req.params.id}`

  client.query(selectQuery, (err, result) => {
    if (!err) {
      res.send(result.rows)
    } else {
      res.status(404).end()
    }
  })
})


router.post('/cadastro', async (req, res) => {
  const produto = req.body;
  const selectQuery = `Select "codigoSKU" from composto where "codigoSKU" = ${produto.codigoSKU}`

  client.query(selectQuery, (error, result) => {
    if (!error) {
      if (result.rows) {
        res.json({ status: false, message: 'Já existe cadastro com este código!' })
      } else {
        const insertQuery = `insert into produtos(nome, "codigoSKU", "dtValidade", quantidade, "pesoLiquido", "pesoBruto", marca, categoria_id, pcomposto) 
        values ('${produto.nome}', ${produto.codigoSKU}, '${produto.dtValidade}', ${produto.quantidade},  ${produto.pesoLiquido}, ${produto.pesoBruto}, '${produto.marca}', ${produto.categoria_id}, 0)`

        client.query(insertQuery, (err, result) => {
          if (!err) {
            res.json({ status: true })
          } else {
            res.status(400).json({ status: false, message: 'Erro na inserção', debug: err.message });
          }
        })
        client.end;
      }
    }
  })
})

router.post('/cadastrocomposto', (req, res) => {
  const composto = req.body;
  console.log(composto)
  const selectQuery = `Select "codigoSKU" from composto where "codigoSKU" = ${composto.codigoSKU}`

  client.query(selectQuery, (er, resu) => {
    if (!er) {
      if (resu.rowCount) {
        console.log(resu.rowCount)
        res.json({ status: false, message: 'Já existe cadastro com esse código!' })
      } else {
        let insertQuery = `insert into composto ("codigoSKU", quantidade) VALUES (${composto.codigoSKU}, ${composto.valores[0].qtde});`

        client.query(insertQuery, (err, result) => {
          if (!err) {
            const produtoQuery = `insert into produtos(nome, "codigoSKU", "dtValidade", quantidade, "pesoLiquido", "pesoBruto", marca, categoria_id, pcomposto)
              values ('${composto.nome}', ${composto.codigoSKU}, '${composto.dtValidade}', ${composto.qntde}, ${composto.pesoLiquido}, ${composto.pesoBruto}, '${composto.marca}', ${composto.categoria_id}, currval('"produtoComposto_id_seq"'::regclass))`

            client.query(produtoQuery, (error, resultado) => {
              if (!error) {
                let compostoQuery = `insert into produto_composto (id_composto, id_produto) VALUES`

                if (composto.valores.length) {
                  for (i = 0; i < composto.valores.length; i++) {
                    compostoQuery += `(currval('"produtoComposto_id_seq"'::regclass), ${composto.valores[i].cod}),`;
                  }
                  compostoQuery = compostoQuery.slice(0, -1)
                }
               
                client.query(compostoQuery, (e, r) => {
                  if (!e) {
                    res.json({ status: true, message: 'Inserção feita com sucesso!' })
                  } else {
                    res.json({ status: false, message: 'Erro ao realizar o insert' })
                  }
                })
              } else {
                res.status(400).json({ status: false, message: 'Erro na inserção', debug: error.message });
              }
            })
          } else {
            res.json({ status: false, message: 'Erro ao realizar o insert' })
          }
        })
      }
    } else {
      res.status(404).end()
    }
  })

})


router.get('/', (req, res) => {
  const produto = req.query;
  let selectQuery = `SELECT p.id, p.nome, cp.nome categoriaProduto, p."codigoSKU" , p."dtValidade", p.quantidade, p."pesoLiquido", p."pesoBruto", p.excluido, p.marca, p."dataCadastro", p.pcomposto FROM produtos p inner join categorias cp on p.categoria_id = cp.id where p.excluido = 0 AND cp.excluido = 0`

  if (produto.composto == 0) {
    selectQuery += ` AND p.pcomposto = 0 `
  }
  if (produto.remover == 1) {
    selectQuery += ` AND p.id NOT IN (${produto.idArray}) AND p.pcomposto = 0`
  }

  selectQuery += ` ORDER BY p.pcomposto, p.nome`;

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
  const selectQuery = `SELECT p.nome, p.categoria_id categoria, cp.nome nomecategoria, p."codigoSKU" id, p."dtValidade", p.quantidade, p."pesoLiquido", p."pesoBruto", p.excluido, p.marca, p."dataCadastro" FROM produtos p inner join categorias cp on p.categoria_id = cp.id where p.excluido = 0 AND cp.excluido = 0 AND  p.id=${req.params.id}`
  console.log(selectQuery)
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
  console.log(updateQuery)
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