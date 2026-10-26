const { users } = require('./db');

const findByEmail = (email) => users.find(u => u.email === email);

const create = (user) => {
  users.push(user);
  return user;
};

const findById = (id) => users.find(u => u.id === id);

module.exports = { findByEmail, create, findById };