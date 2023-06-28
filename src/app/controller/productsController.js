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
  const selectQuery = `SELECT p.nome, p."codigoSKU", p.id idproduto, pc.quantidade, c.id FROM produto_composto pc inner join produtos p on p.id = pc.id_produto inner join composto c on c.id = pc.id_composto where pc.id_composto = ${req.params.id}`

  client.query(selectQuery, (err, result) => {
    if (!err) {
      res.send(result.rows)
    } else {
      res.status(404).end()
    }
  })
})


router.post('/cadastro', async (req, res) => {
  const produto = req.body.produto;
  const selectQuery = `Select "codigoSKU" from composto where "codigoSKU" = ${produto.codigoSKU}`
  client.query(selectQuery, (error, result) => {
    if (!error) {
      if (result.rows[0]) {
        res.json({ status: false, message: 'Já existe cadastro com este código!' })
      } else {
        const insertQuery = `insert into produtos(nome, "codigoSKU", "dtValidade", quantidade, "pesoLiquido", "pesoBruto", marca, categoria_id, pcomposto) 
        values ('${produto.nome}', ${produto.codigoSKU}, '${produto.dtValidade}', ${produto.quantidade},  ${produto.pesoLiquido}, ${produto.pesoBruto}, '${produto.marca}', ${produto.categoria_id}, 0)`
        client.query(insertQuery, (err, result) => {
          if (!err) {
            res.json({ status: true })
          } else {
            res.json({ status: false, message: 'Erro na inserção', debug: err.message });
          }
        })
        client.end;
      }
    }
  })
})

router.post('/cadastrocomposto', (req, res) => {
  let possuiDuplicatas = false;
  const composto = req.body.composto;

  if (!composto.valores || !composto.nome || !composto.codigoSKU || !composto.dtValidade || !composto.qntde || !composto.pesoLiquido || !composto.pesoBruto || !composto.marca || !composto.categoria_id) {
    res.send({ status: false, message: 'Há valores vazios, favor inserir' })
    return
  }

  for (let i = 0; i < composto.valores.length; i++) {
    for (let j = i + 1; j < composto.valores.length; j++) {
      if (composto.valores[i].cod === composto.valores[j].cod) {
        possuiDuplicatas = true;
        break;
      }
    }
    if (possuiDuplicatas) {
      res.send({ status: false, message: 'Existem produtos iguais, favor alterar!' })
      return
    }
  }

  const selectQuery = `Select "codigoSKU" from composto where "codigoSKU" = ${composto.codigoSKU} AND excluido = 0;`
  client.query(selectQuery, (err, result) => {
    if (!err) {
      if (result.rowCount) {
        res.json({ status: false, message: 'Já existe cadastro com esse código!' })
      } else {
        if (composto.valores.length == 1 && composto.valores[0].qtde == 1) {
          res.json({ status: false, message: 'Não pode cadastrar produto único como composto!' })
        } else {
          let insertQuery = `insert into composto ("codigoSKU") VALUES (${composto.codigoSKU})`
          client.query(insertQuery, (err1, result1) => {
            if (!err1) {
              const produtoQuery = `insert into produtos(nome, "codigoSKU", "dtValidade", quantidade, "pesoLiquido", "pesoBruto", marca, categoria_id, pcomposto)
                values ('${composto.nome}', ${composto.codigoSKU}, '${composto.dtValidade}', ${composto.qntde}, ${composto.pesoLiquido}, ${composto.pesoBruto}, '${composto.marca}', ${composto.categoria_id}, currval('"produtoComposto_id_seq"'::regclass))`

              client.query(produtoQuery, (err2, result2) => {
                if (!err2) {
                  let compostoQuery = `insert into produto_composto (id_composto, id_produto, quantidade) VALUES`

                  if (composto.valores.length) {
                    for (i = 0; i < composto.valores.length; i++) {
                      compostoQuery += `(currval('"produtoComposto_id_seq"'::regclass), ${composto.valores[i].cod}, ${composto.valores[i].qtde}),`;
                    }
                  }

                  client.query(compostoQuery, (err3, result3) => {
                    if (!err3) {
                      res.json({ status: true, message: 'Inserção feita com sucesso!' })
                    } else {
                      res.json({ status: false, message: 'Erro ao realizar o insert' })
                    }
                  })
                } else {
                  res.status(400).json({ status: false, message: 'Erro na inserção', debug: err3.message });
                }
              })
            } else {
              res.json({ status: false, message: 'Erro ao realizar o insert' })
            }
          })
        }
      }
    } else {
      console.log(err)
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
  client.query(selectQuery, (err, result) => {
    if (!err) {
      res.json(result.rows);
    } else {
      res.json({ status: false, message: err.message });
    }
  });
  client.end;
})

router.put('/:id', (req, res) => {
  const prod = req.body.produto;
  const inventario = JSON.parse(req.body.inventario)

  if (inventario) {
    res.json({ status: false, message: 'Inventário em progresso, não foi possível editar!' })
  } else {
    let updateQuery = `update produtos set nome = '${prod.nome}',"dtValidade" = '${prod.dtValidade}', quantidade = ${prod.qtde}, "pesoLiquido" = ${prod.liquido}, "pesoBruto" = ${prod.bruto}, marca = '${prod.marca}', "updateAt" = now() where id=${req.params.id}`
    client.query(updateQuery, (err, result) => {
      if (!err) {
        res.json({ status: true, message: 'Produto atualizado com sucesso!', produto: prod })
      } else {
        res.json({ status: false, message: 'Erro ao atualizar produto!', debug: err.message })
      }
    })
  }
})

router.put('/composto/:id', async (req, res) => {
  const prod = req.body.produto;
  const composto = req.body;
  const inventario = JSON.parse(req.body.inventario)
  let possuiDuplicatas = false;


  if (inventario) {
    res.json({ status: false, message: 'Inventário em progresso, não foi possível editar!' })
  } else {
    let updateQuery = `update produtos set nome = '${prod.nome}',"dtValidade" = '${prod.dtValidade}', quantidade = ${prod.qtde}, "pesoLiquido" = ${prod.liquido}, "pesoBruto" = ${prod.bruto}, marca = '${prod.marca}', "updateAt" = now() where id=${req.params.id}`
    client.query(updateQuery, (err, result) => {
      if (!err) {
        let deleteProdutoQuery = `delete from produto_composto where id_composto = ${composto.idComposto}`;
        client.query(deleteProdutoQuery, (err2, result2) => {
          if (!err2) {
            for (let i = 0; i < composto.valores.length; i++) {
              for (let j = i + 1; j < composto.valores.length; j++) {
                if (composto.valores[i].cod === composto.valores[j].cod) {
                  possuiDuplicatas = true;
                  break;
                }
              }
              if (possuiDuplicatas) {
                res.send({ status: false, message: 'Existem produtos iguais, favor alterar!' })
                return
              }
            }
            let compostoQuery = `insert into produto_composto (id_composto, id_produto, quantidade) VALUES`

            if (composto.valores.length) {
              for (i = 0; i < composto.valores.length; i++) {
                compostoQuery += `(${composto.idComposto}, ${composto.valores[i].cod}, ${composto.valores[i].qtde}),`;
              }
              compostoQuery = compostoQuery.slice(0, -1)
            }
            client.query(compostoQuery, (err3, result3) => {
              if (!err3) {
                res.json({ status: true, prod })
              } else {
                res.json({ status: false, message: 'Erro ao atualizar o produto', debug: err3.message })
              }
            })
          } else {
          }
        })
      }
      else {
        res.json({ status: false, message: err.message });
      }
    })
  }
  client.end;
})

router.put('/delete/:id', (req, res) => {
  const inventario = JSON.parse(req.body.inventario)

  if (inventario) {
    res.json({ status: false, message: 'Inventário em progresso, não foi possível excluir!' })
  } else {
    let selectQuery = `select quantidade, pcomposto composto from produtos where id = ${req.params.id}`
    client.query(selectQuery, (err1, result1) => {
      if (result1.rows[0].quantidade == 0) {
        let updateQuery = `update produtos set excluido = 1 where id = ${req.params.id}`
        client.query(updateQuery, (err2, result2) => {
          if (!err2) {
            if (result1.rows[0].quantidade) {
              let updateCompostoQuery = `update composto set excluido = 1 where id = ${result1.rows[0].composto}`
              client.query(updateCompostoQuery, (err3, result3) => {
                if (!err3) {
                  let deleteCompostoQuery = `delete from produto_composto where id_composto = ${result1.rows[0].composto}`
                  client.query(deleteCompostoQuery, (err4, result4) => {
                    if (!err4) {
                      res.json({ status: true, message: 'Produto excluído com sucesso!' })
                    }
                  })
                } else {
                  res.json({ status: false, message: 'Erro ao excuir produto!' })
                }
              })
            }
            else {
              res.json({ status: false, message: 'Não foi possível excluir este produto' });
            }
          } else {
            res.json({ status: false, message: 'Erro ao excluir produto!', })
          }
        })
      } else {
        res.json({ status: false, message: 'Não foi possível excluir este produto pois a quantidade não está zerada!' })
      }
    })
  }

  client.end;
})

module.exports = router;