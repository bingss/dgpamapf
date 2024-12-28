import mitt from 'mitt'

import type { Geometry } from "ol/geom";
import Feature from 'ol/Feature';

// 定義事件類型（TypeScript）
export type Events = {
  'map-job-select': Feature[];
  'job-loaded-updated': Feature[];
  'city-filter-updated':string;
  'sysName-filter-updated':string;
  'zoom-to-feature':string;
//   'select-items': Set<string>;
//   'filter-change': {
//     type: string;
//     value: any;
//   };
}

// 創建 mitt 實例
const eventBus = mitt<Events>()
export default eventBus