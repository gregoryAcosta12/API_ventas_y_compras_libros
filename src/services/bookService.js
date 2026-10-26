const bookRepository = require('../repositories/bookRepository');
const { v4: uuidv4 } = require('crypto');

const createBook = ({ title, price, sellerId }) => {
  if (!title || !price || price <= 0) {
    throw new Error('Título y precio válido son obligatorios');
  }

  const book = {
    id: uuidv4(),
    title,
    price,
    sellerId,
    sold: false,
    buyerId: null,
    createdAt: new Date()
  };

  return bookRepository.create(book);
};

const listBooks = () => {
  return bookRepository.findAll().filter(b => !b.sold);
};

const buyBook = (bookId, buyerId) => {
  const book = bookRepository.findById(bookId);
  if (!book) {
    throw new Error('Libro no encontrado');
  }
  if (book.sold) {
    throw new Error('El libro ya fue vendido');
  }
  if (book.sellerId === buyerId) {
    throw new Error('No puedes comprar tu propio libro');
  }

  return bookRepository.update(bookId, { sold: true, buyerId });
};

module.exports = { createBook, listBooks, buyBook };