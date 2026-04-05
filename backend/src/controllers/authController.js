const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    if (!user.active) return res.status(401).json({ error: 'Usuario desactivado' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(400).json({ error: 'Email ya en uso' });
    }

    await user.update({
      ...(name ? { name } : {}),
      ...(email ? { email } : {})
    });

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, current_password, newPassword, new_password } = req.body;
    const curPwd = currentPassword || current_password;
    const newPwd = newPassword || new_password;

    const user = await User.findByPk(req.user.id);
    if (!(await user.validatePassword(curPwd))) {
      return res.status(400).json({ error: 'Contrasena actual incorrecta' });
    }
    await user.update({ password: newPwd });
    res.json({ message: 'Contrasena actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
