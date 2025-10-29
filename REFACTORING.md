# 项目重构说明

## 重构前后对比

### 重构前
- 所有代码都集中在 `src/app/page.tsx` 文件中（688行）
- 类型定义、工具函数、业务逻辑、UI组件都混在一起
- 代码难以维护和测试

### 重构后
项目结构更加清晰，按功能模块组织：

```
src/
├── app/
│   ├── page.tsx                 # 主页面（简化后160行）
│   └── api/treasure/[hour]/route.ts
├── components/
│   ├── ClientOnlyMap.tsx        # 客户端地图包装器
│   ├── LeafletMap.tsx          # 地图组件
│   ├── BalloonDetail.tsx       # 气球详情组件
│   ├── Header.tsx              # 头部控制面板
│   └── Leaderboard.tsx         # 排行榜组件
├── services/
│   ├── dataService.ts          # 数据获取服务
│   └── windService.ts          # 天气数据服务
├── types/
│   └── index.ts                # 类型定义
└── utils/
    ├── math.ts                 # 数学工具函数
    └── formatters.ts           # 格式化工具函数
```

## 重构优势

### 1. 代码分离
- **类型定义**：集中在 `types/index.ts` 中，便于维护
- **工具函数**：按功能分类到 `utils/` 目录
- **业务逻辑**：封装到 `services/` 目录
- **UI组件**：独立组件，可复用

### 2. 可维护性
- 每个文件职责单一，易于理解和修改
- 组件间依赖关系清晰
- 便于单元测试

### 3. 可扩展性
- 新功能可以独立添加
- 组件可以独立开发和测试
- 服务层可以轻松替换实现

### 4. 代码复用
- 工具函数可以在多个地方使用
- 组件可以在不同页面复用
- 服务层可以被多个组件共享

## 主要组件说明

### 页面组件
- **Page**: 主页面，负责状态管理和组件协调
- **Header**: 顶部控制面板，包含刷新、设置等操作
- **LeafletMap**: 地图显示组件，处理气球轨迹可视化
- **BalloonDetail**: 气球详情面板，显示选中气球的详细信息
- **Leaderboard**: 排行榜组件，显示一致性评分排名

### 服务层
- **dataService**: 处理气球数据的获取和清理
- **windService**: 处理天气数据的获取和缓存

### 工具层
- **math**: 数学计算函数（距离、角度等）
- **formatters**: 数据格式化函数

## 使用方式

重构后的代码使用方式保持不变，但内部结构更加清晰：

```tsx
// 主页面现在只需要导入和使用组件
import Header from "../components/Header";
import LeafletMap from "../components/LeafletMap";
import BalloonDetail from "../components/BalloonDetail";
import Leaderboard from "../components/Leaderboard";
```

这样的结构使得代码更容易理解、维护和扩展。
