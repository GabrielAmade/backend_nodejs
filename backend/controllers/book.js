const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: req.sharp.imageUrl  
  });

  book.save()
    .then(() => {
      res.status(201).json({ message: 'Livre enregistré !' });
    })
    .catch(error => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = async (req, res, next) => {
    try {
      const bookId = req.params.id;
      let bookObject;
        if (req.file) {
            bookObject = {
                ...JSON.parse(req.body.book),
                imageUrl: req.sharp.imageUrl,
            };
            } else {
            bookObject = { ...req.body };
            }
      delete bookObject._userId;
  
      const book = await Book.findOne({ _id: bookId });
  
      if (!book) {
        return res.status(404).json({ error: "Livre non trouvé" });
      }
  
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Non-autorisé" });
      }
  
      if (req.file) {
        const filename = book.imageUrl.split("/images/resized/")[1];
        fs.unlink(`images/resized/${filename}`, (err) => {
          if (err) throw err;
        });
      }
  
      await Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId });
  
      res.status(200).json({ message: "Livre modifié !" });
    } catch (error) {
      res.status(500).json({ error });
    }
  };


exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };


exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
}

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
}



exports.addRating = async (req, res, next) => {
    try {
      const book = await Book.findOne({ _id: req.params.id });
  
      if (book.userId === req.auth.userId) {
        return res.status(401).json({ message: "Vous ne pouvez pas noter un livre que vous avez ajouté" });
      }
  
      if (book.ratings.some((rating) => rating.userId === req.auth.userId)) {
        return res.status(401).json({ message: "Vous avez déjà noté ce livre" });
      }
  
      const rating = parseFloat(req.body.rating);
  
      if (isNaN(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({ message: "La note doit être un nombre entre 0 et 5" });
      }
  
      const newRating = {
        userId: req.auth.userId,
        grade: rating,
      };
  
      book.ratings.push(newRating);
  
      const sum = book.ratings.reduce((total, rating) => total + rating.grade, 0);
      const average = sum / book.ratings.length;
  
      book.averageRating = average;
  
      await Book.updateOne({ _id: req.params.id }, { ratings: book.ratings, averageRating: average });
  
      res.status(200).json(book);
    } catch (error) {
      res.status(500).json({ error });
    }
  };