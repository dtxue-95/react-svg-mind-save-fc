# React SVG 思维导图组件

一个使用 React, TypeScript 和 SVG 构建的交互式思维导图组件。它允许用户以可视化方式创建、组织和编辑层级化的思想节点。

## 核心功能

- **节点操作**:
    - **添加/删除**: 支持添加子节点、同级节点和删除节点（包括所有后代）。
    - **编辑文本**: 双击节点即可编辑其文本内容。
    - **移动与排序**:
        - **自由拖拽 (`isDraggable`)**: 自由移动节点位置，不改变其父子关系。
        - **结构化拖拽 (`enableStrictDrag`)**: 根据预设规则拖拽节点以更改其父节点。
        - **同级排序 (`enableNodeReorder`)**: 通过拖拽对同级节点进行排序。
    - **键盘快捷键**: 支持 `Tab` (子节点), `Enter` (同级节点), `Delete` (删除), `Cmd/Ctrl+Z/Y` (撤销/重做) 等。
- **评审与反馈系统**:
    - **评审状态**: 支持为节点设置“待评审”、“通过”、“未通过”状态，状态会从子节点向上聚合。
    - **一键评审**: 支持在父节点上批量更新所有后代用例的评审状态。
    - **节点备注**: 允许用户为节点添加多条带时间戳和用户信息的备注。
    - **节点评分**: 支持对节点进行五星评分并附带评语。
- **测试与开发集成**:
    - **执行用例**: 支持从用例节点触发执行操作，并通过 `onExecuteUseCase` 回调与外部测试系统集成。
    - **提交缺陷**: 支持从任意节点触发缺陷提交，通过 `onSubmitDefect` 回调获取节点上下文信息，与缺陷管理系统（如 Jira）集成。
- **视图控制**:
    - **缩放与平移**: 支持鼠标滚輪缩放和画布拖拽平移。
    - **视图命令**: 一键适应视图、视图居中、全屏模式。
    - **小地图 (Minimap)**: 提供全局概览和快速导航功能。
- **布局与结构**:
    - **自动布局**: 一键整理所有节点，使其排列整齐。
    - **折叠/展开**: 支持单个节点或所有节点的折叠与展开。
    - **按层级折叠/展开**: 支持按节点类型（如模块、测试点、用例）批量折叠或展开节点。
- **状态管理**:
    - **历史记录**: 无限次撤销和重做。
    - **“未保存”状态 (`isDirty`)**: 自动追踪是否有未保存的更改，用于控制“保存”按钮的可用性。
    - **命令式 API**: 通过 `ref` 提供 `setData`, `resetHistory`, `setReadOnly` 等方法，允许外部在保存成功后重置组件状态。
- **高度可定制**:
    - **工具栏**: 可完全自定义顶部和底部工具栏的按钮及其顺序。
    - **上下文菜单**: 为节点和画布提供功能丰富的右键菜单。
    - **节点属性**: 支持修改节点类型和优先级。
    - **回调函数**: 提供强大的 `onDataChange`, `onSave`, `onExecuteUseCase` 及评审相关回调，轻松与外部应用状态集成。
    - **外观**: 可自定义画布背景、节点背景色、AI 标签等。
    - **自定义面板 (`Panel`)**: 允许在画布的任意位置渲染自定义 React 组件。

---

## 快速上手

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { mockInitialData } from './mockData';
import './styles.css';

function SimpleExample() {
    return (
        <div style={{width: '100%', height: '100vh'}}>
            <App initialData={mockInitialData} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SimpleExample />
  </React.StrictMode>
);
```

---

## 🚀 最佳实践：自动实时保存 (Auto-Save)

在现代 Web 应用中，用户期望修改能自动保存，而不需要手动点击按钮。本组件通过 `onDataChange` 和 `syncData` 完美支持这一模式。

### 方法一：使用内置的 API (推荐)

组件现已内置了防抖 (Debounce) 的自动保存逻辑，你只需开启配置即可。

```tsx
<App 
    enableAutoSave={true}      // 开启自动保存
    autoSaveDelay={2000}       // 设置防抖延迟为 2秒 (默认 1000ms)
    onSave={handleSave}        // 当防抖结束或用户点击保存按钮时触发
/>
```

在 `onSave` 回调中，你可以统一处理后端请求，并根据是否为自动保存来决定是否保留历史记录：

```tsx
const handleSave = useCallback(async (info: DataChangeInfo) => {
    const isAutoSave = info.description === 'Auto-save triggered';
    
    // 1. 调用后端
    const updatedData = await api.save(info.currentRawData);
    
    // 2. 同步数据回组件（保留视图位置）
    if (isAutoSave) {
        // 自动保存：同步数据但保留撤销/重做历史（第二个参数传 true）
        mindMapRef.current.syncData(updatedData, true);
        // 注意：不要调用 resetHistory()，否则会清空用户的撤销栈
    } else {
        // 手动保存：同步数据并重置历史（可选，视业务需求而定）
        mindMapRef.current.syncData(updatedData, false);
        mindMapRef.current.resetHistory();
    }
}, []);
```

### 方法二：自定义实现

如果你需要更复杂的控制（例如：仅在特定类型的操作后保存，或与其他业务逻辑耦合），你可以手动实现：

1.  **监听变更**: 使用 `onDataChange` 捕获用户的每一次修改（如文本编辑、节点移动、添加删除）。
2.  **防抖 (Debounce)**: 设置一个定时器（如 1-2秒），避免在用户连续输入时频繁请求后端。
3.  **静默同步**: 保存成功后，使用 `syncData` 将后端返回的数据（可能包含新生成的 ID 或更新的时间戳）写回组件。**`syncData` 会保留用户的视图位置和编辑状态，不会打断用户操作。**

```tsx
import React, { useRef, useCallback } from 'react';
import App, { AppRef, DataChangeInfo, OperationType } from './App';

function AutoSaveExample() {
    const mindMapRef = useRef<AppRef>(null);
    const autoSaveTimerRef = useRef<any>(null);

    // 执行保存的逻辑
    const performAutoSave = async () => {
        if (!mindMapRef.current) return;
        
        // 1. 获取最新数据
        const { currentRawData } = mindMapRef.current.save();
        
        try {
            // 2. 调用你的后端 API
            const updatedData = await yourBackendApi.save(currentRawData);
            
            // 3. 无感同步回前端（保留视图，保留历史）
            mindMapRef.current.syncData(updatedData, true);
            
            console.log('自动保存成功');
        } catch (err) {
            console.error('自动保存失败', err);
        }
    };

    // 监听数据变更
    const handleDataChange = useCallback((info: DataChangeInfo) => {
        // 过滤掉无关的操作（如选中、布局更新、同步本身）
        const ignored = [
            OperationType.SELECT_NODE, 
            OperationType.LAYOUT, 
            OperationType.SYNC_DATA
        ];
        if (ignored.includes(info.operationType)) return;

        // 防抖逻辑：重置计时器
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        
        // 1.5秒后触发保存
        autoSaveTimerRef.current = setTimeout(performAutoSave, 1500);
    }, []);

    return (
        <App 
            ref={mindMapRef} 
            onDataChange={handleDataChange} 
            // 隐藏手动保存按钮
            topToolbarCommands={['undo', 'redo', 'separator', 'addSibling', 'addChild', 'delete', 'closeTop']}
        />
    );
}
```

---

## API 参考

### Props (`App` 组件)

#### 数据与回调

| Prop 名称               | 类型                                     | 描述                                                                                                                                                                                                                                                                | 默认值                       |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `initialData`           | `RawNode`                                | 用于初始化思维导图的层级化数据结构。**注意：** 这是一个受控属性。在组件挂载后，若此 prop 的引用发生变化（例如，父组件状态更新），将导致思维导图**完全重新加载**，当前的所有状态（包括编辑内容和历史记录）都将被**清空**。如需以命令式方式加载新数据，请使用 `ref.current.setData()` 方法。 | 内置的示例数据               |
| `children`              | `React.ReactNode`                        | 在画布上渲染自定义子组件，通常与 `<Panel>` 组件结合使用。                                                                                                                                                                                                           | `undefined`                  |
| `onDataChange`          | `(info: DataChangeInfo) => void`         | **核心回调**。当导图数据发生任何变更时触发。                                                                                                                                                                                                                        | `(info) => console.log(...)` |
| `onSave`                | `(info: DataChangeInfo) => void`         | 当用户点击工具栏中的“保存”按钮时，**或者**当自动保存计时器触发时（若开启）触发的回调函数。                                                                                                                                                                            | `(info) => console.log(...)` |
| `onExecuteUseCase`      | `(info: DataChangeInfo) => void`         | 当用户通过上下文菜单或 API 执行用例时触发的回调函数。                                                                                                                                                                                                                 | `(info) => console.log(...)` |
| `onSubmitDefect`        | `(info: DataChangeInfo) => void`         | 当用户通过上下文菜单或 API 提交缺陷时触发的回调函数。                                                                                                                                                                                                                 | `(info) => console.log(...)` |
| `onConfirmReviewStatus` | `(info: DataChangeInfo) => void`         | 当用户在评审弹窗中点击“确定”后触发。`info` 对象包含了此次变更的完整上下文。                                                                                                                                                                                           | `(info) => console.log(...)` |
| `onConfirmRemark`       | `(info: DataChangeInfo) => void`         | 当用户在备注弹窗中添加新备注后触发。                                                                                                                                                                                                                                  | `(info) => console.log(...)` |
| `onConfirmScore`        | `(info: DataChangeInfo) => void`         | 当用户在评分弹窗中提交评分后触发。                                                                                                                                                                                                                                    | `(info) => console.log(...)` |
| `getNodeBackgroundColor`| `(node: MindMapNodeData) => string`      | 一个回调函数，接收每个节点的数据并返回一个 CSS 颜色字符串作为节点背景色。                                                                                                                                                                                             | `undefined`                  |

#### 功能开关

| Prop 名称                         | 类型                                     | 描述                                                                                                                                                             | 默认值                                                   |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `isDraggable`                     | `boolean`                                | 是否允许用户通过拖拽自由移动节点位置（不改变父子关系）。                                                                                                         | `false`                                                  |
| `enableStrictDrag`                | `boolean`                                | 是否启用结构化拖拽模式，允许节点根据规则重新父级化。                                                                                                             | `true`                                                   |
| `enableNodeReorder`               | `boolean`                                | 是否允许通过拖拽来对同级节点进行排序。                                                                                                                           | `true`                                                   |
| `reorderableNodeTypes`            | `NodeType[]`                             | 定义了哪些节点类型可以被拖拽挂载和排序。                                                                                                                         | `['MODULE', 'TEST_POINT', 'USE_CASE', 'STEP']`           |
| `enableUseCaseExecution`          | `boolean`                                | 是否启用“执行用例”功能。                                                                                                                                         | `true`                                                   |
| `enableDefectSubmission`          | `boolean`                                | 是否启用“提交缺陷”功能。                                                                                                                                         | `true`                                                   |
| `enableReadOnlyUseCaseExecution`  | `boolean`                                | 在只读模式下，是否允许通过右键菜单执行用例。                                                                                                                     | `true`                                                   |
| `enableExpandCollapseByLevel`     | `boolean`                                | 是否在画布右键菜单中启用“按节点类型展开/收起”的功能。                                                                                                            | `true`                                                   |
| `enableReviewStatus`              | `boolean`                                | 是否为指定类型的节点启用评审状态图标（待评审、通过、拒绝）。                                                                                                     | `true`                                                   |
| `reviewStatusNodeTypes`           | `NodeType[]`                             | 一个节点类型数组，用于指定哪些节点应显示评审状态图标。                                                                                                           | `['DEMAND', 'MODULE', 'TEST_POINT', 'USE_CASE']`         |
| `enableNodeRemarks`               | `boolean`                                | 是否为指定类型的节点启用备注图标。                                                                                                                               | `true`                                                   |
| `nodeRemarksNodeTypes`            | `NodeType[]`                             | 一个节点类型数组，用于指定哪些节点应显示备注图标。                                                                                                               | `['MODULE', 'TEST_POINT', 'USE_CASE']`                   |
| `enableNodeScoring`               | `boolean`                                | 是否为指定类型的节点启用评分图标和分数。                                                                                                                         | `true`                                                   |
| `nodeScoringNodeTypes`            | `NodeType[]`                             | 一个节点类型数组，用于指定哪些节点应显示评分。                                                                                                                   | `['MODULE', 'TEST_POINT', 'USE_CASE']`                   |
| `enableBulkReviewContextMenu`     | `boolean`                                | 是否在 `DEMAND`, `MODULE`, `TEST_POINT` 节点的右键菜单中显示“一键评审用例”选项。                                                                                 | `true`                                                   |
| `enableSingleReviewContextMenu`   | `boolean`                                | 是否在 `USE_CASE` 节点的右键菜单中显示“评审用例”选项。                                                                                                           | `true`                                                   |
| `strictMode`                      | `boolean`                                | 是否启用严格模式，强制执行节点层级规则。                                                                                                                         | `true`                                                   |
| `priorityEditableNodeTypes`       | `NodeType[]`                             | 定义了哪些节点类型可以编辑其优先级。                                                                                                                             | `['MODULE', 'TEST_POINT', 'USE_CASE', 'GENERAL']`        |
| `enableAutoSave`                  | `boolean`                                | 是否启用内置的自动保存功能。启用后，组件会在数据变化后经过 `autoSaveDelay` 时间自动调用 `onSave`。                                                               | `false`                                                  |
| `autoSaveDelay`                   | `number`                                 | 自动保存的防抖延迟时间（毫秒）。                                                                                                                                 | `1000`                                                   |

#### UI 自定义

| Prop 名称                   | 类型                                     | 描述                                                                                                                                                             | 默认值                                                     |
| --------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `connectorStyle`            | `'elbow' \| 'curve'`                     | 设置节点连接线的样式。`elbow` 为直角折线，`curve` 为平滑贝塞尔曲线。                                                                                               | `'elbow'`                                                  |
| `showAITag`                 | `boolean`                                | 是否显示 `generateModeName: 'AI'` 节点的 AI 标识。                                                                                                                   | `true`                                                     |
| `showNodeType`              | `boolean`                                | 是否在节点上显示其类型标签。                                                                                                                                     | `true`                                                     |
| `showPriority`              | `boolean`                                | 是否在节点上显示其优先级标签。                                                                                                                                   | `true`                                                     |
| `showMinimap`               | `boolean`                                | 是否显示右下角的小地图预览。                                                                                                                                     | `false`                                                    |
| `canvasBackgroundColor`     | `string`                                 | 自定义画布的背景颜色。                                                                                                                                           | `'#f7f7f7'`                                                |
| `showBackgroundDots`        | `boolean`                                | 是否在画布背景上显示网格点。                                                                                                                                     | `true`                                                     |
| `showTopToolbar`            | `boolean`                                | 是否显示顶部工具栏。                                                                                                                                             | `true`                                                     |
| `showBottomToolbar`         | `boolean`                                | 是否显示底部工具栏。                                                                                                                                             | `true`                                                     |
| `showReadOnlyToggleButtons` | `boolean`                                | 是否在右上角显示“只读模式/编辑模式”的切换按钮。                                                                                                                  | `true`                                                     |
| `showShortcutsButton`       | `boolean`                                | 是否在右上角显示“快捷键”按钮。                                                                                                                                   | `true`                                                     |
| `topToolbarCommands`        | `CommandId[]`                            | 自定义顶部工具栏中显示的按钮及其顺序。                                                                                                                           | `['undo', 'redo', ..., 'closeTop']`                        |
| `bottomToolbarCommands`     | `CommandId[]`                            | 自定义底部工具栏中显示的按钮及其顺序。                                                                                                                           | `['zoomOut', 'zoomIn', ..., 'closeBottom']`           |
| `showContextMenu`           | `boolean`                                | 是否显示节点的右键上下文菜单。                                                                                                                                   | `true`                                                     |
| `showCanvasContextMenu`     | `boolean`                                | 是否显示画布的右键上下文菜单。                                                                                                                                   | `true`                                                     |

---

### 命令式 API (`ref`)

通过 `ref` 访问组件实例上的方法，以实现对组件的外部控制。

```typescript
export interface AppRef {
  // --- 数据操作 ---
  save: () => DataChangeInfo;
  setData: (newData: RawNode) => void;
  // 如果 preserveHistory 为 true，则更新数据时不会清空撤销/重做栈
  syncData: (newData: RawNode, preserveHistory?: boolean) => void;
  partialUpdateNodeData: (nodeUuid: string, partialData: Partial<MindMapNodeData>) => void;

  // --- 状态控制 ---
  resetHistory: () => void;
  setReadOnly: (isReadOnly: boolean) => void;
  
  // --- 用例与评审 ---
  executeUseCase: (nodeUuid: string) => void;
  submitDefect: (nodeUuid: string) => void;
  confirmReviewStatus: (nodeUuid: string, newStatus: ReviewStatusCode) => void;
  getReviewStatusUpdateInfo: (nodeUuid: string, newStatus: ReviewStatusCode) => DataChangeInfo | null;
  confirmRemark: (nodeUuid: string, content: string) => void;
  confirmScore: (nodeUuid: string, scoreInfo: ScoreInfo) => void;
}
```

-   **`save(): DataChangeInfo`**
    -   **作用**: 命令式地触发一次数据获取。
    -   **返回**: 包含当前思维导图完整数据的 `DataChangeInfo` 对象。
    -   **用途**: 当你需要从外部按钮或其他非思维导图UI触发保存时调用。它**不会**触发 `onSave` 回调。

-   **`setData(newData: RawNode)`**
    -   **作用**: **硬重置**。完全替换思维导图中的所有数据，并重置视图（缩放/平移）和历史记录。
    -   **用途**: 用于首次加载数据或需要完全丢弃当前状态并加载一个全新导图的场景。

-   **`syncData(newData: RawNode, preserveHistory?: boolean)`**
    -   **作用**: **智能同步**。使用新数据更新导图，但**保留当前的视图（缩放/平移）和现有节点的布局信息**。
    -   **参数**: `preserveHistory` (可选，默认 false)。如果为 `true`，则更新操作不会清空撤销/重做历史记录。
    -   **用途**: **推荐用于保存成功后回显后端数据**。它会平滑地添加、删除或更新节点，而不会让用户的视图跳回初始位置。对于自动保存场景，建议设置 `preserveHistory: true`。

-   **`resetHistory()`**
    -   **作用**: **清空撤销/重做历史记录**，并将当前状态设为新的“原始”状态。
    -   **用途**: **在外部保存操作成功后调用**。这将使 `isDirty` 状态变为 `false`，并禁用“保存”按钮，直到用户再次进行修改。

-   **`setReadOnly(isReadOnly: boolean)`**
    -   **作用**: 命令式地设置思维导图的只读状态。
    -   **用途**: **在外部保存操作成功后调用**，将 `isReadOnly` 设为 `true`，以防止用户在确认保存成功前进行新的编辑。

-   **`executeUseCase(nodeUuid: string)`**
    -   **作用**: 触发指定 `uuid` 的用例节点的 `onExecuteUseCase` 回调。
    -   **用途**: 从外部UI（如测试用例列表）触发用例执行。
    
-   **`submitDefect(nodeUuid: string)`**
    -   **作用**: 触发指定 `uuid` 节点的 `onSubmitDefect` 回调。
    -   **用途**: 从外部UI触发缺陷提交。
    
-   **`partialUpdateNodeData(nodeUuid, partialData)`**
    -   **作用**: **局部增量更新**指定节点的数据，而**不会触发界面重绘或创建撤销/重做历史记录**。它会直接合并 `partialData` 到现有节点数据中。
    -   **用途**: **核心用途**是从后端同步数据（如数据库 `id`）回写到节点中，而不会干扰用户的当前操作。例如，在用户评分后，API 返回了该评分记录的 `id`，可以使用此方法将其无缝地更新到节点的 `scoreInfo` 对象中。
    -   **注意**: 尽管此更新是“静默的”（无重绘、无历史记录），但它**仍然会触发 `onDataChange` 回调**，`operationType` 为 `PARTIAL_UPDATE_NODE`。

---

## 其他导出组件

### `<Panel>`

`<Panel>` 组件允许你在思维导图画布的指定位置渲染自定义内容。

-   **Props**:
    -   `position: PanelPosition`: 面板位置，如 `'top-left'`, `'bottom-center'` 等。
    -   `children: React.ReactNode`: 要渲染的内容。
    -   `className?: string`: 自定义 CSS 类。
    -   `style?: React.CSSProperties`: 自定义内联样式。

---

## 数据结构

#### `RawNode` (输入/输出数据)

用于初始化或导出思维导图的层级数据对象。

```typescript
interface RawNode {
    id?: number | string;
    uuid?: string;
    name?: string;
    nodeType?: 'rootNode' | 'moduleNode' | 'testPointNode' | 'caseNode' | 'preconditionNode' | 'stepNode' | 'resultNode' | string;
    priorityLevel?: "0" | "1" | "2" | "3";
    childNodeList?: RawNode[];
    // ... 其他自定义字段也会被保留
}
```

#### `OperationType`

`operationType` 字段用于标识发生了何种类型的变更。

| 值                                 | 描述                                     |
| ---------------------------------- | ---------------------------------------- |
| `ADD_NODE`                         | 添加了一个新节点                         |
| `DELETE_NODE`                      | 删除了一个或多个节点                     |
| `UPDATE_NODE_TEXT`                 | 更新了节点的文本和尺寸                   |
| `UPDATE_NODE_TYPE`                 | 更新了节点的类型                         |
| `UPDATE_NODE_PRIORITY`             | 更新了节点的优先级                       |
| `MOVE_NODE`                        | 移动了节点位置                           |
| `REORDER_NODE`                     | 对同级节点进行了排序                     |
| `TOGGLE_NODE_COLLAPSE`             | 展开或折叠了节点                         |
| `LAYOUT`                           | 应用了自动布局                           |
| `UNDO` / `REDO`                    | 执行了撤销/重做操作                      |
| `LOAD_DATA`                        | 初始数据加载完成                         |
| `SELECT_NODE`                      | 选中或取消选中了一个节点                 |
| `SAVE`                             | 触发了保存操作                           |
| `SYNC_DATA`                        | 智能同步了外部数据（保留视图）           |
| `EXECUTE_USE_CASE`                 | 触发了用例执行操作                       |
| `SUBMIT_DEFECT`                    | 触发了缺陷提交操作                       |
| `BULK_UPDATE_REVIEW_STATUS`        | 批量更新了评审状态（由父节点发起）       |
| `UPDATE_SINGLE_NODE_REVIEW_STATUS` | 更新了单个用例的评审状态（并向上聚合）   |
| `ADD_REMARK`                       | 添加了备注                               |
| `UPDATE_SCORE_INFO`                | 更新了评分                               |
| `PARTIAL_UPDATE_NODE`              | 执行了局部增量更新                       |

### 可定制命令 (`CommandId`)

你可以通过 `topToolbarCommands` 和 `bottomToolbarCommands` props 来自定义工具栏中显示的按钮。

**顶部工具栏可用命令:**
`'undo'`, `'redo'`, `'separator'`, `'addSibling'`, `'addChild'`, `'delete'`, `'save'`, `'closeTop'`

**底部工具栏可用命令:**
`'zoomOut'`, `'zoomIn'`, `'zoomDisplay'`, `'separator'`, `'toggleReadOnly'`, `'fitView'`, `'centerView'`, `'layout'`, `'fullscreen'`, `'search'`, `'closeBottom'`