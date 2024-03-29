// Middleware JSONWT
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.header("connectedToken");
        if (!token) {
            return res.status(401).json({ message: 'token inexistant!' })
        }
        const decodedToken = jwt.verify(token, process.env.TOKEN);
        const userId = decodedToken.id;
        req.userId = userId;
        console.log(userId);
        if (req.body.userId && req.body.userId != userId) {
            return res.status(401).json({ message: "cet utilisateur n'est pas connecté" })
        } else {
            next();
        }
    } catch (error) {
        res.status(401).json({ error:'Requête non authentifiée !' })
    }
}