export function adminOnly(req, res, next) {
  if (req.user?.isAdmin) return next();
  return res.status(403).json({ error: 'forbidden' });
}

