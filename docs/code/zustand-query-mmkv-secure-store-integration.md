---
name: zustand-query-mmkv-secure-store-integration
overview: 在当前 Expo React Native 项目中设计一套基于 Zustand + TanStack Query + MMKV + expo-secure-store 的状态管理与持久化方案，暂不对代码做实际修改。
todos:
  - id: providers-design
    content: 设计 AppProviders / QueryProvider 结构，将 QueryClientProvider 包裹导航容器
    status: pending
  - id: storage-layer-design
    content: 设计并描述 MMKV 与 expo-secure-store 的 storage 适配层接口与文件结构
    status: pending
  - id: zustand-stores-design
    content: 设计 authStore 与 settingsStore 的字段、action 与持久化方案
    status: pending
  - id: ble-store-extension
    content: 规划将 BLE 相关状态抽离到独立 bleStore 的可选演进路径
    status: pending
  - id: security-classification
    content: 给出按敏感度划分到 SecureStore / MMKV 的数据分类建议
    status: pending
isProject: false
---

### 目标

- **统一状态管理与数据来源**：用 Zustand 管应用本地 UI / 业务状态，用 TanStack Query 管所有「从服务端 / 设备拉取」的数据。
- **高性能本地持久化**：用 MMKV 存储大部分可本地缓存的非极度敏感数据（用户偏好、最近设备、列表缓存等）。
- **安全信息保护**：用 expo-secure-store 存储高敏感小数据（token、加密密钥等），并通过一层 service 统一封装。

### 分层与职责划分设计

- **React Query 层**（数据获取 & 缓存）
  - 在 `App.js` 外围或 `src/providers/QueryProvider.tsx` 中创建 `QueryClient` 并用 `QueryClientProvider` 包裹 `NavigationContainer`。
  - 所有和服务器 / BLE 设备状态同步相关的“远程数据”统一通过 `useQuery` / `useMutation` 提供：
    - 例如：`useUserProfileQuery`、`usePetListQuery`、`useNotificationsQuery`。
  - 可根据需要增加 `PersistQueryClientProvider`（如果想把 Query 缓存也落到 MMKV，后续再扩展）。
- **Zustand Store 层**（本地 UI & 业务状态）
  - 在 `src/store` 新建多个 slice：
    - `authStore`：登录态、当前用户 id、是否首次打开等。
    - `settingsStore`：通知开关、主题、地图偏好等。
    - `bleStore`（可选）：如要在多个页面复用蓝牙扫描/连接状态，可以逐步把 `BleSearchScreen` 中的部分 state 抽出来。
  - 每个 store 独立文件+类型定义，统一通过 `create(...)` + 中间件（如 `devtools`、`persist`）。
- **持久化与存储边界**
  - **MMKV（普通敏感度、体量可能较大）**：
    - 用户 UI 设置：主题、健康图表偏好、列表排序等。
    - 最近连接的 BLE 设备信息（设备 id、名称，避免重复搜索）。
    - 非敏感的缓存数据快照（比如上次打开时的简单统计，非必须加密）。
  - **expo-secure-store（高度敏感、小体量）**：
    - `accessToken` / `refreshToken` / 用户加密密钥。
    - 可选：需要符合合规的标识信息（如邮箱、手机号），否则默认由服务端控制。
  - 通过一个 `storage` 适配层把 MMKV 和 SecureStore 暴露为与 Zustand `persist` 中间件兼容的接口（分别实现 `getItem/setItem/removeItem`）。

### 关键技术点与文件划分

- **Query Provider 结构**
  - 在 `App.js` 对 `NavigationContainer` 进行包装：
    - 新建 `[src/providers/QueryProvider.tsx](src/providers/QueryProvider.tsx)`：
      - 内部创建 `queryClient`，设置通用 `defaultOptions`（重试、缓存时间等）。
      - 暴露一个 `AppProviders` 组件，把 `QueryClientProvider` + 未来的 Zustand/Theme Provider 整合在一起。
    - 在 `App.js` 中用 `AppProviders` 包裹 `NavigationContainer`。
- **Zustand + MMKV 持久化结构**
  - 新建 `[src/storage/mmkv.ts](src/storage/mmkv.ts)`：
    - 初始化一个全局 `MMKV` 实例。
    - 封装通用方法：`mmkvStorage.getItem/setItem/removeItem`。
  - 新建 `[src/storage/secureStore.ts](src/storage/secureStore.ts)`：
    - 封装 `SecureStore.getItemAsync/setItemAsync/deleteItemAsync`，并增加简单的 namespacing（如 key 前缀）。
  - 新建 `[src/store/authStore.ts](src/store/authStore.ts)`：
    - 使用 `zustand` 的 `create` + `persist`。
    - `persist` 的 `storage` 使用一个自定义 adapter：写入/读取 token 时走 `expo-secure-store`；低敏感字段可以仍然走 MMKV。
    - 提供 `login/logout/restoreSession` 等 action，给登录/启动流程调用。
  - 新建 `[src/store/settingsStore.ts](src/store/settingsStore.ts)`：
    - 使用 `persist` + MMKV storage adapter。
    - 管理通知开关、语言、单位制（如 kg / lb）、地图偏好等。
- **Ble 相关状态迁移的可能路径（可选，后续迭代）**
  - 当前 `BleSearchScreen` 中的 `devices / scanStatus / btState` 是页面局部状态，如果未来有：
    - 其他页面也需要知道当前连接的设备、信号强度、连接状态，
  - 可以：
    - 在 `[src/store/bleStore.ts](src/store/bleStore.ts)` 中创建 BLE slice，暴露 action：`startScan/stopScan/setState/setError`。
    - 把 `BleService` 的回调写入到 store；页面只通过 store 的 hook 读取状态，按钮只 dispatch action。
    - 是否持久化：一般无需持久化扫描过程，只持久化“最近连接成功的设备列表”（MMKV）。

### 与 TanStack Query 的协作方式

- **界面数据来源规则**
  - 只要数据是「从接口 / 设备获取并可重新获取」：优先用 React Query。
    - 例如：用户资料页、宠物健康图表的数据源、通知列表等。
  - Zustand 只存放：
    - UI 控制与 ephemeral 状态（选中 tab、modal 是否打开等）。
    - 和 Query 配合的“输入条件”，比如当前选中宠物 id、筛选条件等。
- **登录/注销与缓存联动**
  - 登录成功：
    - 把 token 写入 `authStore`（内部通过 SecureStore 持久化）。
    - 可选：调用 `queryClient.invalidateQueries` 刷新与用户相关的 Query。
  - 注销：
    - 清除 `authStore` 中的用户信息和 token（清空 SecureStore）。
    - 调用 `queryClient.clear()` 或按需 `removeQueries`，避免数据泄露到下一个用户。

### 安全与数据分类建议（你之前选“还没想好”）

- **建议存到 expo-secure-store 的数据**：
  - `accessToken` / `refreshToken` / 任意 JWT 或 session token。
  - 如果本地需要保存用户标识（不推荐多存）：`userId`（可选）、极少量特别敏感字段（如邮箱、手机号），优先交给服务端控制展示。
- **建议存到 MMKV 的数据**：
  - 用户偏好（主题色、图表样式、单位、通知偏好等）。
  - 最近连接过的 BLE 设备（设备 id、名字、头像等，不包含用户隐私）。
  - 简单的 UI 状态缓存（引导已看过、是否已同意隐私条款等）。

### 实施步骤（后续你同意后可以按此落地）

1. **搭好 Provider 框架**
  - 新建 `AppProviders`（如 `[src/providers/AppProviders.tsx](src/providers/AppProviders.tsx)`），内部创建 `QueryClient` 并包裹 children。
  - 在 `App.js` 中用 `AppProviders` 包住 `NavigationContainer`。
2. **实现存储适配层**
  - `mmkv.ts`：初始化 `MMKV` 并导出简单 KV 接口。
  - `secureStore.ts`：封装 expo-secure-store 的异步接口，带 key 前缀。
3. **实现基础 store（auth + settings）**
  - 利用 Zustand `create` + `persist` 创建 `authStore` 与 `settingsStore`，分别绑定 SecureStore / MMKV。
  - 在登录页 / 设置页中逐步替换现有本地状态为 store 调用（“渐进式迁移”）。
4. **为未来的 BLE / 其他业务状态预留扩展点**
  - 定义 `bleStore` 的接口与初步实现（如果你确认需要多页面共享 BLE 状态）。
  - 后续再从 `BleSearchScreen` 抽取部分状态逻辑进入 store。
