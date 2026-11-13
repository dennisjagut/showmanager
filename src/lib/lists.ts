// Swaps an entry with its neighbour; unchanged at the start or end
export function swap<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const other = index + direction;
  if (other < 0 || other >= list.length) return list;
  const result = [...list];
  [result[index], result[other]] = [result[other], result[index]];
  return result;
}
