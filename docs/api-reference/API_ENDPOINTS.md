# API 接口参考文档

## 文档信息
- **项目名称**: PIGEON_RACING_TEST_PROJECT
- **目标网站**: https://skyracing.com.cn
- **文档版本**: v1.0.0
- **创建日期**: 2025-11-17
- **API基础域名**:
  - `online01.skyracing.com.cn`
  - `online02.skyracing.com.cn`
- **协议**: HTTPS
- **请求方法**: POST (主要), GET

---

## API 索引

| 编号 | 端点 | 方法 | 用途 | 优先级 |
|------|------|------|------|--------|
| 1 | /serverDomainName | POST | 获取服务器域名 | P2 |
| 2 | /ugetPublicRaceList | POST | 获取公开赛事列表 | P0 |
| 3 | /ugetTrackInfoByRank | POST | 获取排名轨迹信息 | P0 |
| 4 | /uorgRaceRingInfo | POST | 获取赛事环号信息 | P1 |
| 5 | /ugetPigeonAllJsonInfo | GET | 获取鸽子完整轨迹数据 | P0 |
| 6 | /ugetTrackTableData | POST | 获取轨迹表格数据 | P1 |

---

## 1. 服务器域名接口

### 端点信息
- **URL**: `https://online01.skyracing.com.cn/serverDomainName`
- **方法**: POST
- **用途**: 获取当前服务器域名配置
- **认证**: 无需认证
- **优先级**: P2

### 请求示例

```http
POST https://online01.skyracing.com.cn/serverDomainName HTTP/1.1
Content-Type: application/json

{}
```

### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "domain": "online02.skyracing.com.cn",
    "cdn": "cdn.skyracing.com.cn"
  }
}
```

### 测试验证

```typescript
test('验证服务器域名API', async ({ page }) => {
  let domainResponse = null;

  page.on('response', async response => {
    if (response.url().includes('serverDomainName')) {
      domainResponse = await response.json();
    }
  });

  await page.goto('https://skyracing.com.cn');
  await page.waitForTimeout(2000);

  expect(domainResponse).not.toBeNull();
  expect(domainResponse.code).toBe(0);
});
```

---

## 2. 公开赛事列表接口

### 端点信息
- **URL**: `https://online02.skyracing.com.cn/ugetPublicRaceList`
- **方法**: POST
- **用途**: 获取首页显示的赛事列表
- **认证**: 无需认证
- **优先级**: P0（核心功能）

### 请求参数

```typescript
interface RaceListRequest {
  year?: number;        // 年份筛选（可选）
  keyword?: string;     // 搜寻关键词（可选）
  pageSize?: number;    // 分页大小（可选）
  pageNum?: number;     // 页码（可选）
}
```

### 请求示例

```http
POST https://online02.skyracing.com.cn/ugetPublicRaceList HTTP/1.1
Content-Type: application/json

{
  "year": 2024,
  "keyword": "",
  "pageSize": 50,
  "pageNum": 1
}
```

### 响应数据结构

```typescript
interface RaceListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    list: Race[];
  };
}

interface Race {
  raceID: string;          // 赛事ID
  raceName: string;        // 赛事名称
  raceDate: string;        // 赛事日期 (YYYY-MM-DD)
  raceStatus: string;      // 赛事状态
  pigeonCount: number;     // 参赛鸽数
  distance: number;        // 比赛距离(km)
  releasePoint: string;    // 放飞地点
}
```

### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 127,
    "list": [
      {
        "raceID": "R202411140001",
        "raceName": "2024秋季综合赛",
        "raceDate": "2024-11-14",
        "raceStatus": "已结束",
        "pigeonCount": 1523,
        "distance": 507.99,
        "releasePoint": "江西省赣州市"
      }
    ]
  }
}
```

### 测试验证

```typescript
test('验证赛事列表API', async ({ page }) => {
  let raceListResponse = null;

  page.on('response', async response => {
    if (response.url().includes('ugetPublicRaceList')) {
      raceListResponse = await response.json();
    }
  });

  await page.goto('https://skyracing.com.cn');
  await page.waitForLoadState('networkidle');

  expect(raceListResponse).not.toBeNull();
  expect(raceListResponse.code).toBe(0);
  expect(raceListResponse.data.list.length).toBeGreaterThan(0);
});
```

---

## 3. 排名轨迹信息接口

### 端点信息
- **URL**: `https://online02.skyracing.com.cn/ugetTrackInfoByRank`
- **方法**: POST
- **用途**: 获取赛事中指定鸽子的排名和基本信息
- **认证**: 无需认证
- **优先级**: P0（核心功能）

### 请求参数

```typescript
interface TrackInfoRequest {
  raceID: string;        // 赛事ID
  ringNumber?: string;   // 环号（可选）
  rank?: number;         // 名次（可选）
}
```

### 请求示例

```http
POST https://online02.skyracing.com.cn/ugetTrackInfoByRank HTTP/1.1
Content-Type: application/json

{
  "raceID": "R202411140001",
  "rank": 1
}
```

### 响应数据结构

```typescript
interface TrackInfoResponse {
  code: number;
  message: string;
  data: {
    ringNumber: string;      // 公环号
    rank: number;            // 名次
    loftName: string;        // 鸽舍名称
    arrivalTime: string;     // 归巢时间
    flightTime: string;      // 飞行时间
    avgSpeed: number;        // 平均分速 (m/min)
    distance: number;        // 距离 (km)
  };
}
```

### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "ringNumber": "2025-26-0053539",
    "rank": 1,
    "loftName": "冠军鸽舍",
    "arrivalTime": "2024-11-14 13:44:12",
    "flightTime": "06:38:12",
    "avgSpeed": 1295,
    "distance": 507.99
  }
}
```

### 测试验证

```typescript
test('验证轨迹信息API', async ({ page }) => {
  let trackInfoResponse = null;

  page.on('response', async response => {
    if (response.url().includes('ugetTrackInfoByRank')) {
      trackInfoResponse = await response.json();
    }
  });

  await enterFirstRace(page);
  await page.waitForLoadState('networkidle');

  expect(trackInfoResponse).not.toBeNull();
  expect(trackInfoResponse.code).toBe(0);
  expect(trackInfoResponse.data.ringNumber).toMatch(/\d{4}-\d{2}-\d{7}/);
});
```

---

## 4. 赛事环号信息接口

### 端点信息
- **URL**: `https://online02.skyracing.com.cn/uorgRaceRingInfo`
- **方法**: POST
- **用途**: 获取赛事中所有鸽子的环号列表
- **认证**: 无需认证
- **优先级**: P1

### 请求参数

```typescript
interface RaceRingInfoRequest {
  raceID: string;        // 赛事ID
}
```

### 请求示例

```http
POST https://online02.skyracing.com.cn/uorgRaceRingInfo HTTP/1.1
Content-Type: application/json

{
  "raceID": "R202411140001"
}
```

### 响应数据结构

```typescript
interface RaceRingInfoResponse {
  code: number;
  message: string;
  data: {
    total: number;
    rings: RingInfo[];
  };
}

interface RingInfo {
  ringNumber: string;    // 环号
  rank: number;          // 名次
  loftID: string;        // 鸽舍ID
  loftName: string;      // 鸽舍名称
}
```

### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 1523,
    "rings": [
      {
        "ringNumber": "2025-26-0053539",
        "rank": 1,
        "loftID": "L001",
        "loftName": "冠军鸽舍"
      },
      {
        "ringNumber": "2025-26-0053540",
        "rank": 2,
        "loftID": "L002",
        "loftName": "飞翔鸽舍"
      }
    ]
  }
}
```

---

## 5. 鸽子完整轨迹数据接口（核心）

### 端点信息
- **URL**: `https://online02.skyracing.com.cn/ugetPigeonAllJsonInfo`
- **方法**: GET
- **用途**: 获取单只鸽子的完整轨迹数据（2D和3D）
- **认证**: 无需认证
- **优先级**: P0（核心功能）
- **关联问题**: [问题#1 - 2D轨迹初次加载失败](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#问题-1-2d轨迹初次加载失败)

### 请求参数

```typescript
interface PigeonTrackRequest {
  raceID: string;        // 赛事ID
  ringNumber: string;    // 环号
}
```

### 请求示例

```http
GET https://online02.skyracing.com.cn/ugetPigeonAllJsonInfo?raceID=R202411140001&ringNumber=2025-26-0053539 HTTP/1.1
```

或使用JSON参数:

```http
GET https://online02.skyracing.com.cn/ugetPigeonAllJsonInfo?{"raceID":"R202411140001","ringNumber":"2025-26-0053539"} HTTP/1.1
```

### 响应数据结构

```typescript
interface PigeonTrackResponse {
  code: number;
  message: string;
  data: {
    ringNumber: string;       // 环号
    raceID: string;           // 赛事ID
    gpx2d: string;            // 2D轨迹数据 (GPX格式)
    gpx3d: string;            // 3D轨迹数据 (GPX格式)
    trackPoints: TrackPoint[]; // 轨迹点数组
    summary: TrackSummary;     // 轨迹摘要
  };
}

interface TrackPoint {
  time: string;              // 时间戳
  lat: number;               // 纬度
  lon: number;               // 经度
  altitude: number;          // 海拔 (m)
  speed: number;             // 速度 (m/min)
  direction: string;         // 方向
  rank: number;              // 当前名次
}

interface TrackSummary {
  startTime: string;         // 起点时间
  endTime: string;           // 终点时间
  duration: string;          // 持续时间
  avgSpeed: number;          // 平均分速 (m/min)
  maxSpeed: number;          // 最高分速 (m/min)
  avgAltitude: number;       // 平均高度 (m)
  maxAltitude: number;       // 最大高度 (m)
  actualDistance: number;    // 实际距离 (km)
  straightDistance: number;  // 直线距离 (km)
  actualSpeed: number;       // 实际速度 (m/min)
  straightSpeed: number;     // 直线速度 (m/min)
}
```

### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "ringNumber": "2025-26-0053539",
    "raceID": "R202411140001",
    "gpx2d": "<?xml version=\"1.0\"?>\n<gpx>...</gpx>",
    "gpx3d": "<?xml version=\"1.0\"?>\n<gpx>...</gpx>",
    "trackPoints": [
      {
        "time": "2024-11-14 07:06:00",
        "lat": 25.8123,
        "lon": 114.9456,
        "altitude": 150,
        "speed": 1200,
        "direction": "西南",
        "rank": 1
      }
    ],
    "summary": {
      "startTime": "2024-11-14 07:06:00",
      "endTime": "2024-11-14 13:44:12",
      "duration": "06:38:12",
      "avgSpeed": 1295,
      "maxSpeed": 1560,
      "avgAltitude": 159,
      "maxAltitude": 296,
      "actualDistance": 519.62,
      "straightDistance": 507.99,
      "actualSpeed": 1305.83,
      "straightSpeed": 1295.00
    }
  }
}
```

### 重要说明

⚠️ **关键字段**:
- `gpx2d`: 2D模式渲染所需的轨迹数据
- `gpx3d`: 3D模式渲染所需的轨迹数据
- 如果 `gpx2d` 为 `undefined` 或空，会导致2D轨迹加载失败

### 测试验证

```typescript
test('验证鸽子轨迹数据API', async ({ page }) => {
  let trackDataResponse = null;

  page.on('response', async response => {
    if (response.url().includes('ugetPigeonAllJsonInfo')) {
      trackDataResponse = await response.json();
    }
  });

  await enterFirstRace(page);
  await selectPigeon(page, 0);
  await viewTrajectory(page);

  // 等待API响应
  await page.waitForTimeout(3000);

  expect(trackDataResponse).not.toBeNull();
  expect(trackDataResponse.code).toBe(0);
  expect(trackDataResponse.data.gpx2d).toBeDefined();
  expect(trackDataResponse.data.gpx3d).toBeDefined();
  expect(trackDataResponse.data.trackPoints.length).toBeGreaterThan(0);
});
```

### 常见问题

**Q: 为什么 gpx2d 是 undefined？**
A: 数据加载时序问题，参见 [问题#1解决方案](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#问题-1-2d轨迹初次加载失败)

**Q: 如何确保数据加载完成？**
A: 使用3D→2D切换序列，或监听此API响应完成

---

## 6. 轨迹表格数据接口

### 端点信息
- **URL**: `https://online02.skyracing.com.cn/ugetTrackTableData`
- **方法**: POST
- **用途**: 获取轨迹播放时的表格数据（排名列表）
- **认证**: 无需认证
- **优先级**: P1

### 请求参数

```typescript
interface TrackTableRequest {
  raceID: string;        // 赛事ID
  ringNumbers: string[]; // 环号数组（支持多鸽）
}
```

### 请求示例

```http
POST https://online02.skyracing.com.cn/ugetTrackTableData HTTP/1.1
Content-Type: application/json

{
  "raceID": "R202411140001",
  "ringNumbers": ["2025-26-0053539", "2025-26-0053540"]
}
```

### 响应数据结构

```typescript
interface TrackTableResponse {
  code: number;
  message: string;
  data: {
    pigeons: PigeonTableData[];
  };
}

interface PigeonTableData {
  ringNumber: string;
  currentRank: number;
  currentSpeed: number;
  currentAltitude: number;
  currentDistance: number;
  elapsedTime: string;
}
```

### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "pigeons": [
      {
        "ringNumber": "2025-26-0053539",
        "currentRank": 1,
        "currentSpeed": 1380,
        "currentAltitude": 169,
        "currentDistance": 123.45,
        "elapsedTime": "01:23:45"
      }
    ]
  }
}
```

---

## 地图资源接口

### 高德地图瓦片

```
https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
```

### Cesium地形数据

```
https://assets.ion.cesium.com/...
```

### Bing卫星图

```
https://ecn.t0.tiles.virtualearth.net/tiles/...
https://ecn.t1.tiles.virtualearth.net/tiles/...
https://ecn.t2.tiles.virtualearth.net/tiles/...
https://ecn.t3.tiles.virtualearth.net/tiles/...
```

---

## 网络请求监听示例

### 基础监听

```typescript
test('监听所有API请求', async ({ page }) => {
  const apiCalls = {
    raceList: [],
    trackInfo: [],
    pigeonTrack: []
  };

  page.on('request', request => {
    const url = request.url();

    if (url.includes('ugetPublicRaceList')) {
      apiCalls.raceList.push({ url, method: request.method() });
    }

    if (url.includes('ugetTrackInfoByRank')) {
      apiCalls.trackInfo.push({ url, method: request.method() });
    }

    if (url.includes('ugetPigeonAllJsonInfo')) {
      apiCalls.pigeonTrack.push({ url, method: request.method() });
    }
  });

  // 执行测试流程
  await page.goto('https://skyracing.com.cn');
  await enterFirstRace(page);
  await selectPigeon(page, 0);
  await viewTrajectory(page);

  // 验证API调用
  expect(apiCalls.raceList.length).toBeGreaterThan(0);
  expect(apiCalls.trackInfo.length).toBeGreaterThan(0);
  expect(apiCalls.pigeonTrack.length).toBeGreaterThan(0);
});
```

### 响应验证

```typescript
test('验证API响应内容', async ({ page }) => {
  const responses = [];

  page.on('response', async response => {
    if (response.url().includes('skyracing.com.cn')) {
      const data = await response.json().catch(() => null);

      responses.push({
        url: response.url(),
        status: response.status(),
        data: data
      });
    }
  });

  await page.goto('https://skyracing.com.cn');
  await page.waitForLoadState('networkidle');

  // 验证所有API响应成功
  const failedResponses = responses.filter(r => r.status !== 200);
  expect(failedResponses.length).toBe(0);

  // 验证所有API返回code为0
  const errorResponses = responses.filter(r => r.data?.code !== 0);
  expect(errorResponses.length).toBe(0);
});
```

### 性能监控

```typescript
test('API响应时间监控', async ({ page }) => {
  const apiPerformance = [];

  page.on('response', response => {
    const timing = response.timing();

    if (response.url().includes('skyracing.com.cn')) {
      apiPerformance.push({
        url: response.url(),
        responseTime: timing.responseEnd - timing.requestStart
      });
    }
  });

  await page.goto('https://skyracing.com.cn');
  await enterFirstRace(page);
  await selectPigeon(page, 0);
  await viewTrajectory(page);

  // 验证API响应时间
  apiPerformance.forEach(api => {
    console.log(`${api.url}: ${api.responseTime}ms`);
    expect(api.responseTime).toBeLessThan(5000); // 5秒超时
  });
});
```

---

## 错误码说明

| 错误码 | 说明 | 处理方式 |
|--------|------|---------|
| 0 | 成功 | 正常处理数据 |
| 400 | 请求参数错误 | 检查请求参数格式 |
| 404 | 资源不存在 | 验证raceID或ringNumber |
| 500 | 服务器错误 | 重试请求 |
| 503 | 服务不可用 | 等待服务恢复 |

---

## 使用建议

### 1. 请求频率控制
- 避免短时间内大量请求
- 建议请求间隔 ≥ 100ms

### 2. 超时处理
- 设置合理的超时时间（建议5-10秒）
- 实现重试机制（最多3次）

### 3. 数据缓存
- 缓存赛事列表数据（有效期1小时）
- 缓存轨迹数据（有效期至赛事结束）

### 4. 错误处理
- 捕获所有API错误
- 记录错误日志用于调试
- 向用户显示友好的错误提示

---

## 相关文档

- [TEST_PLAN_OVERVIEW.md](../test-plan/TEST_PLAN_OVERVIEW.md) - 测试计划总览
- [KNOWN_ISSUES_SOLUTIONS.md](../test-plan/KNOWN_ISSUES_SOLUTIONS.md) - API相关问题
- [HELPER_FUNCTIONS_DESIGN.md](../test-plan/HELPER_FUNCTIONS_DESIGN.md) - API验证函数

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-17
**接口总数**: 6
