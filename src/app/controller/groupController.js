const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// client.connect()

router.get('/', (req, res) => {
    const selectQuery = `SELECT id, nome, perm_usuarios, perm_produtos, perm_dashboard, perm_grupos, perm_inventario, perm_controle, perm_categorias, excluido FROM grupos WHERE excluido = 0 ORDER BY id`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: result.rows })
        } else {
            res.json({ status: false, message: 'Erro ao buscar grupos' })
        }
    })
})

router.get('/grupos', (req, res) => {
    const selectQuery = `SELECT id, nome FROM grupos WHERE excluido = 0 ORDER BY nome`
    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: result.rows })
        } else {
            res.json({ status: false, message: 'Erro ao buscar os grupos!' })
        }
    })
})

router.get('/:id', (req, res) => {
    const selectQuery = `SELECT id, nome, perm_usuarios, perm_produtos, perm_dashboard, perm_grupos, perm_inventario, perm_controle, perm_categorias, excluido FROM grupos WHERE id = ${req.params.id} AND excluido = 0`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: result.rows })
        } else {
            res.json({ status: false, message: 'Erro ao buscar os grupos' })
        }
    })
})

router.post('/', (req, res) => {
    const group = req.body.grupo

    if (!group.nome) {
        res.send({ status: false, message: 'O nome está vazio, favor inserir!' })
        return
    }
    let nomeQuery = `SELECT nome FROM grupos WHERE excluido = 0 AND LOWER(nome) = LOWER('${group.nome}')`
    client.query(nomeQuery, (err1, result1) => {
        if (!err1) {
            if (result1.rows[0]) {
                res.send({ status: false, message: 'Este nome já existe, favor escolher outro!' })
                return
            } else {
                const postQuery = `INSERT INTO grupos (nome, perm_usuarios, perm_produtos, perm_grupos, perm_dashboard, perm_inventario, perm_controle, perm_categorias) VALUES ('${group.nome}', ${group.checkUsuarios}, ${group.checkProdutos}, ${group.checkGrupoUsuarios}, ${group.checkDashboard}, ${group.checkInventario}, ${group.checkControle}, ${group.checkCategorias})`
                client.query(postQuery, (err, result) => {
                    if (!err) {
                        res.json({ status: true, message: 'Grupo criado com sucesso!' })
                    } else {
                        res.json({ status: false, message: 'Erro ao criar o grupo' })
                    }
                })
            }
        }
    })
})

router.put('/:id', (req, res) => {
    const group = req.body.grupo
    const updateQuery = `UPDATE grupos set nome = '${group.nome}', perm_usuarios = ${group.pUsuario}, perm_produtos = ${group.pProduto}, perm_grupos = ${group.pGrupo}, perm_dashboard = ${group.pDashboard}, perm_inventario = ${group.pInventario}, perm_controle = ${group.pControle}, perm_categorias = ${group.pCategorias} WHERE id = ${req.params.id}`

    client.query(updateQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, data: group, message: 'Grupo atualizado com sucesso!' })
        } else {
            res.json({ status: false, message: 'Erro ao atualizar o grupo' })
        }
    })
})

router.put('/delete/:id', (req, res) => {
    const deleteQuery = `UPDATE grupos set excluido = 1, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo excluido com sucesso!' })
        } else {
            res.json({ status: true, message: 'Erro ao excluir o grupo' })
        }
    })
})



module.exports = router