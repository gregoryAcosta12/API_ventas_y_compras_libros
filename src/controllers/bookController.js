const bookService = require('../services/bookService');

const create = (req, res) => {
  try {
    const book = bookService.createBook({
      title: req.body.title,
      price: req.body.price,
      sellerId: req.user.id
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const list = (req, res) => {
  res.json(bookService.listBooks());
};

const buy = (req, res) => {
  try {
    const book = bookService.buyBook(req.params.id, req.user.id);
    res.json({ message: 'Compra realizada', book });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { create, list, buy };