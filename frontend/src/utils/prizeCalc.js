export function prizeSplit(pool) {
  const p = Number(pool) || 0;
  return {
    first: p * 0.6,
    second: p * 0.25,
    third: p * 0.15,
  };
}
