/**
 * 优化的Swagger解析MCP工具
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OptimizedSwaggerApiParser } from '../optimized-swagger-parser';

// MCP工具名称和描述
const OPTIMIZED_SWAGGER_PARSER_TOOL_NAME = 'parse-swagger-optimized';
const OPTIMIZED_SWAGGER_PARSER_TOOL_DESCRIPTION = '使用优化的解析器解析Swagger/OpenAPI文档，支持缓存和大型文档处理。';

// 轻量版工具名称和描述
const LITE_SWAGGER_PARSER_TOOL_NAME = 'parse-swagger-lite';
const LITE_SWAGGER_PARSER_TOOL_DESCRIPTION = '轻量级解析Swagger/OpenAPI文档，更快但只返回基本信息（适用于大型文档）。';

/**
 * 优化的Swagger解析工具类
 */
export class OptimizedSwaggerParserTool {
  name = OPTIMIZED_SWAGGER_PARSER_TOOL_NAME;
  description = OPTIMIZED_SWAGGER_PARSER_TOOL_DESCRIPTION;

  // 定义参数模式
  schema = z.object({
    /**
     * Swagger/OpenAPI文档URL
     */
    url: z.string().describe('Swagger/OpenAPI文档URL'),
    
    /**
     * 请求头
     */
    headers: z.record(z.string()).optional().describe('请求头信息'),
    
    /**
     * 是否包含模式定义
     */
    includeSchemas: z.boolean().optional().describe('是否包含模式定义'),
    
    /**
     * 是否包含所有详细信息
     */
    includeDetails: z.boolean().optional().describe('是否包含所有详细信息，如请求体、响应等'),
    
    /**
     * 是否跳过验证
     */
    skipValidation: z.boolean().optional().describe('是否跳过验证，用于处理不完全合规的API文档'),
    
    /**
     * 是否使用缓存
     */
    useCache: z.boolean().optional().describe('是否使用缓存'),
    
    /**
     * 缓存有效期（分钟）
     */
    cacheTTLMinutes: z.number().optional().describe('缓存有效期（分钟）'),
    
    /**
     * 是否启用懒加载
     */
    lazyLoading: z.boolean().optional().describe('是否启用懒加载，用于快速解析大型文档'),
    
    /**
     * 特定标签筛选
     */
    filterTag: z.string().optional().describe('只返回特定标签的API操作'),
    
    /**
     * 路径前缀筛选
     */
    pathPrefix: z.string().optional().describe('只返回特定路径前缀的API操作'),
  });

  /**
   * 在MCP服务器上注册工具
   */
  register(server: McpServer) {
    // 注册完整版解析工具
    server.tool(
      this.name,
      this.description,
      this.schema.shape,
      async ({ 
        url, 
        headers = {}, 
        includeSchemas = false, 
        includeDetails = false,
        skipValidation = true,
        useCache = true,
        cacheTTLMinutes = 60,
        lazyLoading = false,
        filterTag,
        pathPrefix
      }) => {
        return await this.execute({ 
          url, 
          headers, 
          includeSchemas, 
          includeDetails,
          skipValidation,
          useCache,
          cacheTTLMinutes,
          lazyLoading,
          filterTag,
          pathPrefix
        });
      }
    );
    
    // 注册轻量版解析工具
    server.tool(
      LITE_SWAGGER_PARSER_TOOL_NAME,
      LITE_SWAGGER_PARSER_TOOL_DESCRIPTION,
      this.schema.shape,
      async ({ 
        url, 
        headers = {}, 
        includeSchemas = false, 
        includeDetails = false,
        skipValidation = true,
        useCache = true,
        cacheTTLMinutes = 60,
        filterTag,
        pathPrefix
      }) => {
        return await this.execute({ 
          url, 
          headers, 
          includeSchemas, 
          includeDetails,
          skipValidation,
          useCache,
          cacheTTLMinutes,
          lazyLoading: true, // 强制使用懒加载
          filterTag,
          pathPrefix
        });
      }
    );
  }

  /**
   * 执行Swagger解析
   */
  async execute({
    url,
    headers = {},
    includeSchemas = false,
    includeDetails = false,
    skipValidation = true,
    useCache = true,
    cacheTTLMinutes = 60,
    lazyLoading = false,
    filterTag,
    pathPrefix
  }: z.infer<typeof this.schema> & {
    cacheTTLMinutes?: number;
  }) {
    let progress = 0;
    let progressMessage = '';
    
    // 进度回调函数
    const progressCallback = (newProgress: number, message: string) => {
      progress = newProgress;
      progressMessage = message;
      console.log(`[Progress] ${Math.round(newProgress * 100)}%: ${message}`);
    };
    
    try {
      console.log(`[OptimizedSwaggerParserTool] 解析Swagger文档: ${url}`);
      console.log(`[OptimizedSwaggerParserTool] 缓存: ${useCache ? '启用' : '禁用'}, 懒加载: ${lazyLoading ? '启用' : '禁用'}`);
      
      // 创建解析器实例
      const parser = new OptimizedSwaggerApiParser({
        url,
        headers,
        skipValidation,
        useCache,
        cacheTTL: cacheTTLMinutes * 60 * 1000, // 转换为毫秒
        lazyLoading,
        progressCallback
      });
      
      // 解析API文档
      const api = await parser.fetchApi();
      
      // 获取API操作
      let operations;
      if (filterTag) {
        operations = await parser.getOperationsByTag(filterTag);
      } else if (pathPrefix) {
        operations = await parser.getOperationsByPathPrefix(pathPrefix);
      } else {
        operations = await parser.getAllOperations();
      }
      
      // 构建结果对象
      const result: any = {
        success: true,
        progress: progress,
        progressMessage: progressMessage,
        info: {
          title: api.info.title,
          version: api.info.version,
          description: api.info.description
        },
        operationsCount: operations.length,
        operations: operations.map(op => {
          // 基本操作信息
          const operation = {
            operationId: op.operationId,
            method: op.method,
            path: op.path,
            summary: op.summary,
            tags: op.tags
          };
          
          // 如果需要详细信息，则包含参数和响应
          if (includeDetails) {
            return {
              ...operation,
              parameters: op.parameters,
              requestBody: op.requestBody,
              responses: op.responses
            };
          }
          
          return operation;
        })
      };
      
      // 如果需要模式定义
      if (includeSchemas) {
        if (lazyLoading) {
          // 使用懒加载时，只获取必要的schema
          result.schemas = {};
          
          // 获取所有操作中引用的模式
          const referencedSchemas = new Set<string>();
          
          // 处理requestBody和responses中的引用
          for (const op of operations) {
            // 处理requestBody
            if (op.requestBody && typeof op.requestBody === 'object') {
              this.collectSchemaRefs(op.requestBody, referencedSchemas);
            }
            
            // 处理responses
            if (op.responses) {
              for (const response of Object.values(op.responses)) {
                if (response && typeof response === 'object') {
                  this.collectSchemaRefs(response, referencedSchemas);
                }
              }
            }
          }
          
          // 获取引用的模式
          for (const schemaName of referencedSchemas) {
            const schema = await parser.getSchema(schemaName);
            if (schema) {
              result.schemas[schemaName] = schema;
            }
          }
        } else {
          // 不使用懒加载时，获取所有模式
          result.schemas = await parser.getAllSchemas();
        }
      }
      
      console.log(`[OptimizedSwaggerParserTool] 解析完成，找到 ${operations.length} 个API操作`);
      
      // 返回结果
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`[OptimizedSwaggerParserTool] 解析失败:`, error);
      
      // 返回错误结果
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              progress: progress,
              progressMessage: progressMessage,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }
        ]
      };
    }
  }
  
  /**
   * 收集模式引用
   */
  private collectSchemaRefs(obj: any, refs: Set<string>): void {
    if (!obj) return;
    
    // 处理直接引用
    if (obj.$ref && typeof obj.$ref === 'string') {
      const parts = obj.$ref.split('/');
      const schemaName = parts[parts.length - 1];
      refs.add(schemaName);
      return;
    }
    
    // 处理内容对象
    if (obj.content && typeof obj.content === 'object') {
      for (const mediaType of Object.values(obj.content)) {
        if (mediaType && typeof mediaType === 'object' && 'schema' in mediaType) {
          this.collectSchemaRefs((mediaType as any).schema, refs);
        }
      }
    }
    
    // 处理模式对象
    if (obj.schema) {
      this.collectSchemaRefs(obj.schema, refs);
    }
    
    // 处理数组项
    if (obj.items) {
      this.collectSchemaRefs(obj.items, refs);
    }
    
    // 处理嵌套对象
    if (typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          this.collectSchemaRefs(value, refs);
        }
      }
    }
  }
  
  /**
   * 清除缓存
   */
  static clearCache(url?: string): void {
    OptimizedSwaggerApiParser.clearCache(url);
  }
} 