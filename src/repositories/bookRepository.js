const { books } = require('./db');

const create = (book) => {
  books.push(book);
  return book;
};

const findAll = () => books;

const findById = (id) => books.find(b => b.id === id);

const update = (id, data) => {
  const index = books.findIndex(b => b.id === id);
  if (index === -1) return null;
  books[index] = { ...books[index], ...data };
  return books[index];
};

module.exports = { create, findAll, findById, update };