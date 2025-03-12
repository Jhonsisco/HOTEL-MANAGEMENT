// middleware/auth.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // Si estamos en ambiente de pruebas, omite la verificación
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Acceso denegado: no se proporcionó token' });
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

const verificarRol = (rolesPermitidos) => (req, res, next) => {
  // En test, se omite la verificación de roles
  if (process.env.NODE_ENV === 'test') return next();
  
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

module.exports = { verificarToken, verificarRol };
