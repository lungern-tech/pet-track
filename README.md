# Pet Track

基于 Expo 的 React Native 项目，使用 pnpm 管理依赖。

## 环境要求

- Node.js 20.19.4+（推荐 LTS）
- pnpm 9.x
- iOS：Xcode + 模拟器或真机
- Android：Android Studio + 模拟器或真机

## 安装

```bash
pnpm install
```

## 运行

```bash
# 启动开发服务器
pnpm start

# 在 iOS 模拟器运行
pnpm run ios

# 在 Android 模拟器运行
pnpm run android

# 在浏览器运行（Web）
pnpm run web
```

## 项目结构

```
├── App.js              # 应用根组件
├── index.js            # 入口
├── src/
│   ├── components/     # 通用组件
│   └── screens/        # 页面
├── assets/             # 图片等静态资源
├── app.json            # Expo 配置
├── babel.config.js
├── metro.config.js
└── tsconfig.json       # TypeScript 配置（支持 .ts/.tsx）
```

## 开发说明

- 新页面放在 `src/screens/`，在 `src/screens/index.ts` 中导出。
- 可复用组件放在 `src/components/`。
- 支持 TypeScript（`.ts` / `.tsx`），路径别名 `@/*` 指向 `src/*`（需在 babel 中配置 `babel-plugin-module-resolver` 方可解析）。
