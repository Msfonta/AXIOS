const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// client.connect()

router.get('/', (req, res) => {
    const categoria = req.query
    let getQuery = `select id, nome, tipo, case tipo when 1 then 'Prod. Simples' else 'Prod. Composto' end nometipo from categorias WHERE excluido = 0`

    if (Object.entries(categoria).length != 0) {
        getQuery += ` AND tipo = ${categoria.tipo}`
    }

    getQuery += ` ORDER BY ID, NOME`

    client.query(getQuery, (err, result) => {
        if (!err) {
            res.json(result.rows)
        } else {
            res.status(404).end()
        }
        client.end;
    })
})

router.get('/:id', (req, res) => {
    const selectQuery = `SELECT id, id_prodsimples, "codigoSKU", quantidade FROM "produtoComposto" WHERE "codigoSKU" = ${req.params.id} `

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.post('/cadastro', (req, res) => {
    const categoria = req.body
    const postQuery = `INSERT INTO categorias (nome, tipo) VALUES ('${categoria.nome}', ${categoria.tipo})`
    console.log(postQuery)
    client.query(postQuery, (err, result) => {
        if (!err) {
            console.log(result.rows)
            if (result.rowCount > 0) {
                res.json({ status: true, message: 'Categoria criada com sucesso!' })
            }
        } else {
            res.status(404).end()
        }
    })
})

router.put('/:id', (req, res) => {
    const group = req.body
    const updateQuery = `UPDATE categorias set nome = '${group.nome}' WHERE id = ${req.params.id}`

    client.query(updateQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Categoria alterada com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})

router.put('/delete/:id', (req, res) => {
    const composto = req.body
    const quantidadeQuery = `Select quantidade from composto where id = ${req.params.id}`

    client.query(quantidadeQuery, (err, result) => {
        if (!err) {
            if (result.rows[0].quantidade == 0) {
                res.json({ status: false, message: 'Não foi possível excluir este produto pois o mesmo não encontra-se zerado no estoque! Favor zerar ele antes de qualquer operação!' })
            } else {
                const deleteProdutoQuery = `UPDATE produto_composto set excluido = 1 WHERE id_produto = ${req.params.id}`
                client.query(deleteProdutoQuery, (error, resultado) => {
                    if (!error) {
                        res.json({ status: true, message: 'Produto excluído com sucesso!' })
                    } else {
                        res.json({ status: false, message: 'Erro ao excluir o produto!', debug: error.message })
                    }
                })
            }
        } else {
            res.json({status: false, message: 'Erro no operação', debug: err.message})
        }
    })

})



module.exports = router