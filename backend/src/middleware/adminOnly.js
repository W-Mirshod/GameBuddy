import { prisma } from '../db.js';

export function adminOnly(req, res, next) {
  prisma.user
    .findUnique({ where: { id: req.user.userId } })
    .then((user) => {
      if (user?.isAdmin) return next();
      return res.status(403).json({ error: 'forbidden' });
    })
    .catch(next);
}
