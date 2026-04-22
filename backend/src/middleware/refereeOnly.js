import { prisma } from '../db.js';

export function refereeOnly(req, res, next) {
  prisma.user
    .findUnique({ where: { id: req.user.userId } })
    .then((user) => {
      if (user?.isAdmin || user?.isReferee) return next();
      return res.status(403).json({ error: 'forbidden' });
    })
    .catch(next);
}
