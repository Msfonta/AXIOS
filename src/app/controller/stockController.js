const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()


router.get('/', (req, res) => {
    const selectQuery = `SELECT ce.id, p.nome nomeProduto, p.marca, ct.nome categoria, ce.operacao, ce."dataOperacao", ce.quantidade, u.nome nomeUsuario FROM "controleEstoque" ce inner join usuarios u  on u.id = ce.id_usuario inner join produtos p on p."codigoSKU" = ce.id_produto inner join categorias ct on ct.id = p.categoria_id ORDER BY ce."dataOperacao";`
    console.log(selectQuery)
    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.get('/:id', (req, res) => {
    const selectQuery = `SELECT${req.params.id} AND excluido = 0`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.put('/:id', (req, res) => {
    const controle = req.body
    let query;
    
    if (controle.operacao) {
        console.log('aquii + 1')
        query = `UPDATE produtos set quantidade = quantidade + 1 WHERE "codigoSKU" = ${controle.id}`
    } else {
        console.log('aquii - 1')
        query = `UPDATE produtos set quantidade = quantidade - 1 WHERE "codigoSKU" = ${controle.id}`
    }
    const postQuery = `INSERT INTO "controleEstoque" (id_produto, operacao, quantidade, id_usuario) VALUES ('${controle.id}', ${controle.operacao}, (SELECT quantidade FROM produtos WHERE "codigoSKU" = ${controle.id})  , ${controle.usuario.id})`
    client.query(query, (err, result) => {
        if (!err) {
            client.query(postQuery, (err, result) => {
                if (!err) {
                    res.json({status: true, message: 'Operação concluida com sucesso!'})
                } else {
                    res.send(err).status(404)
                }
            })
        } else {
            res.status(402).end()
        }
    })
})

router.put('/delete/:id', (req, res) => {
    const deleteQuery = `UPDATE grupos set excluido = 1, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo excluido com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})

router.put('/activate/:id', (req, res) => {
    const deleteQuery = `UPDATE grupos set excluido = 0, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo reativado com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})


module.exports = router