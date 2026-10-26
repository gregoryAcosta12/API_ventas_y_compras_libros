const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { v4: uuidv4 } = require('crypto');

const register = async ({ name, email, password, role }) => {
  if (role !== 'vendedor' && role !== 'comprador') {
    throw new Error('Rol inválido. Debe ser vendedor o comprador');
  }

  const existing = userRepository.findByEmail(email);
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role
  };

  userRepository.create(user);
  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

const login = async ({ email, password }) => {
  const user = userRepository.findByEmail(email);
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { token, role: user.role };
};

module.exports = { register, login };