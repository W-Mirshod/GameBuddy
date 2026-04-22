import jwt from 'jsonwebtoken';

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('unauthorized'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || '');
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log('[socket] connected', socket.user?.userId);

    socket.on('join_tournament', ({ tournamentId }) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on('leave_tournament', ({ tournamentId }) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    socket.on('join_referee_room', () => {
      if (!socket.user?.isAdmin && !socket.user?.isReferee) return;
      socket.join('referee_room');
    });

    socket.on('join_result_job', ({ jobId }) => {
      if (!jobId) return;
      socket.join(`result:job:${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log('[socket] disconnected', socket.user?.userId);
    });
  });
}

