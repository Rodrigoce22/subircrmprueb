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
  const u = req.user;
  res.json({
    id: u.id, name: u.name, email: u.email, role: u.role,
    avatar: u.avatar, phone: u.phone, language: u.language,
    timezone: u.timezone, notifications_email: u.notifications_email,
    notifications_wa: u.notifications_wa, compact_mode: u.compact_mode
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      name, email, phone, avatar, language, timezone,
      notifications_email, notifications_wa, compact_mode
    } = req.body;
    const user = await User.findByPk(req.user.id);

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(400).json({ error: 'Email ya en uso' });
    }

    // Validate avatar size if provided (max ~1MB base64 ≈ 1.33MB string)
    if (avatar && avatar.length > 1_400_000) {
      return res.status(400).json({ error: 'La imagen es demasiado grande (máx 1MB)' });
    }

    const updates = {};
    if (name  !== undefined) updates.name  = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    if (language !== undefined) updates.language = language;
    if (timezone !== undefined) updates.timezone = timezone;
    if (notifications_email !== undefined) updates.notifications_email = notifications_email;
    if (notifications_wa    !== undefined) updates.notifications_wa    = notifications_wa;
    if (compact_mode        !== undefined) updates.compact_mode        = compact_mode;

    await user.update(updates);

    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatar: user.avatar, phone: user.phone, language: user.language,
      timezone: user.timezone, notifications_email: user.notifications_email,
      notifications_wa: user.notifications_wa, compact_mode: user.compact_mode
    });
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
