export const RANK_COLORS = {
  Herald: '#808080',
  Guardian: '#3D85C8',
  Crusader: '#38761D',
  Archon: '#46BDC6',
  Legend: '#9900FF',
  Ancient: '#B45F06',
  Divine: '#CC0000',
  Immortal: '#FFD700',
};

export function rankColor(medal) {
  return RANK_COLORS[medal] || '#888';
}
