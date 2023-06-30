const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// client.connect()

router.get('/', (req, res) => {
    let getQuery = `select id, nome from categorias WHERE excluido = 0 ORDER BY ID, NOME`

    client.query(getQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, data: result.rows })
        } else {
            res.json({ status: false, message: 'Erro ao buscar as categorias' })
        }
        client.end;
    })
})


router.post('/cadastro', (req, res) => {
    const categoria = req.body

    if (!categoria.nome) {
        res.send({ status: false, message: 'O Nome está vazio, favor inserir' })
        return
    }

    const selectQuery = `SELECT nome from categorias WHERE excluido = 0 AND LOWER(nome) = LOWER('${categoria.nome}')`
    console.log(selectQuery)
    client.query(selectQuery, (err1, result1) => {
        if (!err1) {
            console.log(result1.rows)
            if (result1.rows[0]) {
                res.json({ status: true, message: 'Já existe este nome de categoria, favor alterar!' })
            } else {
                const postQuery = `INSERT INTO categorias (nome) VALUES ('${categoria.nome}')`
                console.log(postQuery)
                client.query(postQuery, (err, result) => {
                    if (!err) {
                        res.json({ status: true, message: 'Categoria criada com sucesso!' })
                    } else {
                        res.json({ status: false, message: 'Erro ao cadastar categoria' })
                    }
                })
            }
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