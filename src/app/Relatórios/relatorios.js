const ejs = require('ejs')
const pdf = require('html-pdf')
const client = require('../database/database')

client.connect()

// rel_usuarios = () => {
//     let sql = `SELECT id, nome, email, admin, excluido FROM usuarios`
// }

ejs.renderFile("./rel_usuarios.ejs", {}, (err, html) => {
    if (err) {
        console.log(err)
    } else {
        pdf.create(html, {
            format: 'A4',
            orientation: 'portrait',
            paginationOffset: 1,
            "border": {
                "top": "5mm",
                "right": "0",
                "bottom": "8mm",
                "left": "0"
            },
            renderDelay: 2000
        }).toFile('../../../meupdfdeteste.pdf', (err, res) => {
            if (err) {
                console.log('erro ao gerar pdf')
            } else {
                console.log(res)
            }
        })

    }
})
// pdf.create('<h1> teste </h1>', {
//     format: 'A4',
//     orientation: 'portrait',
//     paginationOffset: 1,
//     "border": {
//         "top": "5mm",
//         "right": "0",
//         "bottom": "8mm",
//         "left": "0"
//     },
//     renderDelay: 2000
// }).toFile('./meupdfdeteste.pdf', (err, res) => {
//     if (err) {
//         console.log('erro ao gerar pdf')
//     } else {
//         console.log(res)
//     }
// })

