export function refereeOnly(req, res, next) {
  if (req.user?.isAdmin || req.user?.isReferee) return next();
  return res.status(403).json({ error: 'forbidden' });
}

