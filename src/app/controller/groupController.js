const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// client.connect()

router.get('/', (req, res) => {
    const selectQuery = `SELECT id, nome, perm_usuarios, perm_produtos, perm_dashboard, perm_grupos, perm_grupos, excluido FROM grupos WHERE excluido = 0 ORDER BY id`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.get('/grupos', (req, res) => {
    const selectQuery = `SELECT id, nome FROM grupos WHERE excluido = 0 ORDER BY nome`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.get('/:id', (req, res) => {
    const selectQuery = `SELECT id, nome, perm_usuarios, perm_produtos, perm_dashboard, perm_grupos, perm_grupos, excluido FROM grupos WHERE id = ${req.params.id} AND excluido = 0`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.post('/', (req, res) => {
    const group = req.body

    if (!group.nome) {
        res.send({ status: false, message: 'O nome está vazio, favor inserir!' })
        return
    }

    const postQuery = `INSERT INTO grupos (nome, perm_usuarios, perm_produtos, perm_grupos, perm_dashboard) VALUES ('${group.nome}', ${group.checkUsuarios}, ${group.checkProdutos}, ${group.checkControleUsuarios}, ${group.checkDashboard})`

    client.query(postQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo criado com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})

router.put('/:id', (req, res) => {
    const group = req.body
    const updateQuery = `UPDATE grupos set nome = '${group.nome}', perm_usuarios = ${group.pUsuario}, perm_produtos = ${group.pProduto}, perm_grupos = ${group.pGrupo}, perm_dashboard = ${group.pDashboard} WHERE id = ${req.params.id}`

    client.query(updateQuery, (err, result) => {
        if (!err) {
            res.json(group)
        } else {
            res.status(404).end()
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