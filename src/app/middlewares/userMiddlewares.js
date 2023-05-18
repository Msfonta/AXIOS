// const jwt = require('jsonwebtoken')

const authPage = (permissao) => {
    return (req, res, next) => {
        const userRole = req.body.cargo
        console.log(userRole)
        if (permissao.includes(userRole)) {
            next()
        } else {
            return res.status(401).json('Não autorizado')
        }
    }
}



module.exports = authPage;