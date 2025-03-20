# Swagger MCP 服务器

基于Model Context Protocol (MCP)的Swagger/OpenAPI工具服务器，能够根据用户提供的Swagger/OpenAPI地址，解析API定义，并自动生成对应的接口代码和TypeScript类型约束。

## 功能特性

- 解析Swagger/OpenAPI文档
- 从API定义生成TypeScript类型
- 生成多种框架的API客户端代码 (Axios, Fetch, React Query等)
- 提供MCP工具接口，支持与大语言模型集成

## 安装

```bash
# 使用npm
npm install

# 或使用pnpm
pnpm install
```

## 构建

```bash
# 构建项目
npm run build

# 或使用pnpm
pnpm build
```

## 使用方法

### 启动服务器

```bash
# 使用默认配置启动
node start-server.js

# 指定配置文件启动
node start-server.js ./my-config.json
```

### 配置文件

默认配置文件`swagger-mcp-config.json`示例：

```json
{
  "name": "Swagger MCP Server",
  "version": "1.0.0",
  "transport": "stdio"
}
```

## 可用的MCP工具

1. `parse-swagger` - 解析Swagger/OpenAPI文档，返回API操作信息
2. `generate-typescript-types` - 从Swagger/OpenAPI文档生成TypeScript类型定义
3. `generate-api-client` - 从Swagger/OpenAPI文档生成API客户端代码
4. `file_writer` - 写入内容到指定文件路径，支持自动创建目录

## 示例调用

### 解析Swagger文档

```json
{
  "method": "parse-swagger",
  "params": {
    "url": "https://petstore.swagger.io/v2/swagger.json",
    "includeSchemas": true
  }
}
```

### 生成TypeScript类型

```json
{
  "method": "generate-typescript-types",
  "params": {
    "swaggerUrl": "https://petstore.swagger.io/v2/swagger.json",
    "outputDir": "./generated/types",
    "generateEnums": true
  }
}
```

### 生成API客户端

```json
{
  "method": "generate-api-client",
  "params": {
    "swaggerUrl": "https://petstore.swagger.io/v2/swagger.json",
    "outputDir": "./generated/api",
    "clientType": "axios",
    "generateTypeImports": true,
    "typesImportPath": "../types"
  }
}
```

## 开发

```bash
# 运行TypeScript编译器（监视模式）
npm run watch

# 或使用pnpm
pnpm watch

# 运行开发服务器
npm run dev

# 或使用pnpm
pnpm dev
```

## 许可证

MIT 