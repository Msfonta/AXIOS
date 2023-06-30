const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.post('/', (req, res) => {
    let arrayProdutos = []
    let postQuery = `INSERT INTO status_inventario (status, "dataInicio") VALUES (1, now())`
    client.query(postQuery, (err, result) => {
        if (!err) {
            let produtosQuery = `SELECT "codigoSKU", nome, quantidade FROM produtos WHERE excluido = 0;`
            client.query(produtosQuery, (err1, result1) => {
                if (!err1) {
                    for (i = 0; i < result1.rowCount; i++) {
                        arrayProdutos.push({ codigo: `${result1.rows[i].codigoSKU}`, nome: `${result1.rows[i].nome}`, quantidade: `${result1.rows[i].quantidade}` })
                    }
                    let insertInventarioQuery = ` INSERT INTO inventario (status, codigo, "nomeProduto", qtde_estoque, "id_statusInventario") `
                    for (j = 0; j < arrayProdutos.length; j++) {
                        insertInventarioQuery += ` SELECT 1, ${arrayProdutos[j].codigo}, '${arrayProdutos[j].nome}', ${arrayProdutos[j].quantidade}, ( SELECT max(id) from status_inventario) UNION ALL `
                    }
                    insertInventarioQuery = insertInventarioQuery.substring(0, insertInventarioQuery.lastIndexOf("UNION ALL")).trim()
                    client.query(insertInventarioQuery, (err2, result2) => {
                        if (!err2) {
                            let getInventarioQuery = ` SELECT id, codigo, "nomeProduto" nome, qtde_estoque, qtde_real FROM inventario WHERE status = 1`
                            client.query(getInventarioQuery, (err3, result3) => {
                                if (!err3) {
                                    res.json({ status: true, data: result3.rows, message: 'Lista gerada com sucesso!' })
                                } else {
                                    res.json({ status: false, message: 'Erro ao gerar a tabela com os produtos!' })
                                }
                            })
                        } else {
                            res.json({ status: false, message: 'Erro ao inserir dados na tabela Inventario!' })
                        }
                    })
                } else {
                    res.json({ status: false, message: 'Erro ao buscar os dados dos produtos ' })
                }
            })
        }
    })
})

router.put('/:id', (req, res) => {
    const inventario = req.body

    const updateQuery = `UPDATE inventario SET qtde_real = ${inventario.quantidade} WHERE id = ${req.params.id}`
    client.query(updateQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Atualizado com sucesso!' })
        } else {
            res.json({ status: false, message: 'Erro ao atualizar!' })
        }
    })
})

router.get('/', (req, res) => {
    const getInventarioQuery = `SELECT id, codigo, "nomeProduto" nome, qtde_estoque, qtde_real FROM inventario WHERE status = 1`

    client.query(getInventarioQuery, (err, result) => {
        if (!err) {
            const statusInventarioQuery = `SELECT status FROM status_inventario ORDER BY "dataFim" desc LIMIT 1`
            client.query(statusInventarioQuery, (err1, result1) => {
                if(!err1){
                    res.json({ status: true, message: result.rows, status_inv: result1.rows[0]})
                } else {
                    res.json({ status: false, message: 'Erro ao buscar o status do inventario'})
                }
            })
        } else {
            res.json({ status: false, message: 'Erro ao gerar lista!' })
        }
    })
})

router.get('/lista', (req, res) => {
    const selectQuery = `SELECT status FROM status_inventario si ORDER BY "dataInicio" DESC LIMIT 1;`

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, valor: result.rows[0].status })
        }
    })
})

router.post('/finalizar', (req, res) => {
    let arrayQuantidade = []

    let getLastId = `SELECT id FROM status_inventario where "dataFim" is null and status = 1;`
    client.query(getLastId, (err, result) => {
        if (!err) {
            if (result.rows[0]) {
                let getQtdeProdutosInventario = `SELECT codigo, qtde_real qtde FROM inventario WHERE status = 1 AND "id_statusInventario" = ${result.rows[0].id}`
                client.query(getQtdeProdutosInventario, (err1, result1) => {
                    if (!err1) {
                        let updateInventarioQuery = `UPDATE inventario SET status = 0 WHERE "id_statusInventario" = ${result.rows[0].id}`
                        client.query(updateInventarioQuery, (err2, result2) => {
                            if (!err2) {
                                let updateProdutoQuery = `UPDATE produtos set quantidade = CASE `
                                for (i = 0; i < result2.rowCount; i++) {
                                    updateProdutoQuery += `WHEN "codigoSKU" = ${result1.rows[i].codigo} THEN  ${result1.rows[i].qtde} `
                                }
                                updateProdutoQuery += ` ELSE quantidade END`
                                client.query(updateProdutoQuery, (err3, result3) => {
                                    if (!err3) {
                                        let updateQuery = `UPDATE status_inventario set status = 0, "dataFim" = now() WHERE id = ${result.rows[0].id}`
                                        client.query(updateQuery, (err4, result4) => {
                                            if (!err4) {
                                                res.json({ status: true, message: 'Inventário finalizado com sucesso!' })
                                            } else {
                                                res.json({ status: false, message: 'Erro ao finalizar o inventário' })
                                            }
                                        })
                                    } else {
                                        res.json({ status: false, message: 'Erro ao atualizar quantidade na tabela PRODUTOS' })
                                    }
                                })
                            } else {
                                res.json({ status: false, message: 'Erro ao atualizar a lista de produtos na tabela INVENTARIO'})
                            }
                        })
                    } else {
                        res.json({ status: false, message: 'Erro ao buscar dados da tabela Inventario' })
                    }
                })
            } else {
                res.json({ status: false, message: 'Não existe inventário ativo' })
            }
        } else {
            res.json({ status: false, message: 'erro' })
        }
    })

})




module.exports = router