const fs = require("fs");

const db = require("../models");
const Posts = db.Posts;

// Récupère tout les post
exports.allPosts = async (req, res, next) => {
    const listOfPosts = await Posts.findAll({ 
      order: [["createdAt", "DESC"]]
    });
    res.status(200).json({ listOfPosts: listOfPosts})
  };

  // Récupère un post par son Id
exports.onePost = async (req, res, next) => {
    const id = req.params.id;
    Posts.findByPk(id)
        .then(posts => res.status(200).json(posts))
        .catch(error => res.status(400).json({error}))
};

// Récupère tout les posts d'un utilisateur
exports.userPost = async (req, res, next) => {
    const id = req.params.id;
    const listOfPosts = await Posts.findAll({ order: [["createdAt", "DESC"]], where : {UserId: id}});
    res.status(200).json({ listOfPosts: listOfPosts})
};

// Créer un post 
exports.createPost = async (req, res, next) => {
    console.log(req)
      try {
      
          if (req.file == undefined) {
            Posts.create({
              UserId: req.body.userId,
              username: req.body.username,
              postText: req.body.postText
            }).then(() => {
              return res.send(`Publication sans image crée`);
            })
          } else {
            Posts.create({
              UserId: req.body.userId,
              type: req.file.mimetype,
              name: req.file.originalname,
              filename: req.file.filename,
              username: req.body.username,
              postText: req.body.postText,
              data: fs.readFileSync(
                  "../backend/images/uploads/" + req.file.filename
              ),
              }).then((image) => {
              fs.writeFileSync(
                  "../backend/images/tmp/" + image.name,
                  image.data
              );
      
            return res.send(`Publication avec Image crée`);
          });
          }
        } catch (error) {
          return res.send(`Echec du telechargement du post: ${error}`);
        }
  };
  
  // Supprimer un post 
exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    console.log(req.userId);
    Posts.destroy({ where: { id: postId } });
    res.json("Post supprimé");
  }
