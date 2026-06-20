import { buildCampusGraph } from '../dijkstra';
import { campusGraphNodes } from '@/constants/campusGraph';
import { astar } from '../astar';

test('A* finds route from ICT to Library', () => {
  const graph = buildCampusGraph(campusGraphNodes);
  const result = astar(graph, 'ict-center', 'library-complex');
  expect(result).not.toBeNull();
  expect(result?.path[0]).toBe('ict-center');
  expect(result?.path[result!.path.length - 1]).toBe('library-complex');
  expect(result?.distanceMeters).toBeGreaterThan(0);
});

test('A* returns null for unknown node', () => {
  const graph = buildCampusGraph(campusGraphNodes);
  expect(astar(graph, 'nonexistent', 'ict-center')).toBeNull();
});
