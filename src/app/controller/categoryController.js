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
    const selectQuery = `SELECT id, nome, perm_usuarios, perm_produtos, perm_dashboard, perm_grupos, perm_grupos, excluido FROM grupos WHERE id = ${req.params.id} WHERE excluido = 0`

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

    client.query(postQuery, (err, result) => {
        if (!err) {
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
    const deleteQuery = `UPDATE categorias set excluido = 1, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo excluido com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})



module.exports = router