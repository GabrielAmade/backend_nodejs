const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
    console.log('req');
   try {
       const token = req.headers.authorization.split(' ')[1];
       console.log('Token:', token); // Afficher le token dans la console

       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
       const userId = decodedToken.userId;
       req.auth = {
           userId: userId
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};