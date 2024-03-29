const fs = require("fs");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Users } = require("../models");

 const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
 const password_regex = /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,}$/;
// Permet de crée un utilisateur
exports.signup = async (req, res, next) => {
    console.log(req.body);
   
    try {
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({ message: 'Il faut remplir tous les champs!' })
        }
        if (!email_regex.test(req.body.email)) {
            return res.status(400).json({ message: "Le format d'email n'est pas correct" })
        }
        if (!password_regex.test(req.body.password)) {
            return res.status(400).json({ message: "Le mot de passe doit avoir au moins 6 caractères, 1 lettre majuscule et 1 lettre minuscule, un chiffre et un caractère spécial" })
        }
        const isEmailExist = await Users.findOne({
            attributes: ["email"],
            where: { email: req.body.email }
        });
        if (isEmailExist) {
            return res.status(400).json({ message: 'Cet email existe déjà !' });
        }
        const isUsernameExist = await Users.findOne({
            attributes: ["username"],
            where: { username: req.body.username }
        });
        if (isUsernameExist) {
            return res.status(400).json({ message: 'Ce pseudo existe déjà !' });
        }

        bcrypt.hash(req.body.password, 10)
            .then(hash => {
                const user = new Users({
                    username: req.body.username,
                    email: req.body.email,
                    isAdminAccount: req.body.isAdminAccount,
                    password: hash
                });
                user.save()
                    .then(() => res.status(201).json({ message: 'Votre compte est crée avec succès!' }))
                    .catch(error => res.status(400).json({ error }));
            })
            .catch(error => res.status(500).json({ error }));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Permet de ce connecter a un compte existant
exports.login = async (req, res, next) => {
    console.log(req.body)
     if (!req.body.email || !req.body.password) {
            return res.status(400).json({ message: 'Il faut remplir tous les champs!' })
        }

         if (!email_regex.test(req.body.email)) {
            return res.status(400).json({ message: "Le format d'email n'est pas correct" })
        }

      const user = await  Users.findOne({ where: { email: req.body.email } });
      console.log(user)

            if (!user) {
                 return res.status(400).json({ message: "Cet utilisateur n'est pas inscrit !" })
            }


            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(400).json({ message: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        id: user.id,
                        username: user.username,
                        isAdmin: user.isAdminAccount,
                        filename: user.filename,
                        createdAt: user.createdAt,
                        token: jwt.sign(
                            {
                                id: user.id,
                                username: user.username,
                                isAdmin: user.isAdminAccount,
                            },
                            process.env.TOKEN,
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
};

/* ceci permet de vérifier un utlisateur authentifié avec token existant */

exports.authUser = async (req, res) => {
    const id = req.userId;
    const user = await Users.findByPk(id, {
        attributes: { exclude: ["password"] },
    });
    res.json(user)
}
// Récupère les info d'un utilisateur par son id
exports.userInfo = async (req, res, next) => {
    const id = req.params.id;
    const userInfo = await Users.findByPk(id, {
        attributes: { exclude: ["password"] },
    });
    res.json(userInfo)
};

// Supprimer un utilisateur
exports.deleteUser = (req, res, next) => {
    const id = req.params.id;
    Users.destroy({ where: { id: id } });
    res.json("Compte supprimé");
};

// Modifier le Mot de passe 
exports.editPassword = async (req, res, next) => {
    const id = req.params.id;
    console.log(req.body)
    console.log(id)
    const { oldPassword, newPassword } = req.body;
       if (!password_regex.test(newPassword)) {
            return res.json({ error: "Le mot de passe doit avoir au moins 6 caractères, 1 lettre majuscule et 1 lettre minuscule, un chiffre et un caractère spécial" })
        }
    const user = await Users.findOne({ where: { id: id } });

    bcrypt.compare(oldPassword, user.password).then(async (match) => {
        if (!match) return res.json({ error: "Mauvais mot de passe" });

        bcrypt.hash(newPassword, 10).then((hash) => {
            Users.update(
                { password: hash },
                { where: { id: id } }
            );
            return res.json("Mot de passe modifié");
        });
    });
};

// Modifier la Photo d'un utilisateur
exports.editPicture = async (req, res, next) => {
    console.log(req)
    const id = req.params.id;
    const user = await Users.findOne({ where: { id: id } });
    user.update({
         type: req.file.mimetype,
         name: req.file.originalname,
         filename: req.file.filename,
        data: fs.readFileSync("../backend/images/uploads/" + req.file.filename)
    })
        .then((image) => {
            fs.writeFileSync("../backend/images/tmp/" + image.name, image.data);


            return res.send(`La photo a été télechargé`);
        });
};