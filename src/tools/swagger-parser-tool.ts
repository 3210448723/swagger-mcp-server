/**
 * Swagger解析MCP工具
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SwaggerApiParser } from '../swagger-parser';

// MCP工具名称和描述
const SWAGGER_PARSER_TOOL_NAME = 'parse-swagger';
const SWAGGER_PARSER_TOOL_DESCRIPTION = '解析Swagger/OpenAPI文档，并返回API操作信息。';

/**
 * Swagger解析工具类
 */
export class SwaggerParserTool {
  name = SWAGGER_PARSER_TOOL_NAME;
  description = SWAGGER_PARSER_TOOL_DESCRIPTION;

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
    includeDetails: z.boolean().optional().describe('是否包含所有详细信息，如请求体、响应等')
  });

  /**
   * 在MCP服务器上注册工具
   */
  register(server: McpServer) {
    server.tool(
      this.name,
      this.description,
      this.schema.shape,
      async ({ url, headers = {}, includeSchemas = false, includeDetails = false }) => {
        return await this.execute({ url, headers, includeSchemas, includeDetails });
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
    includeDetails = false
  }: z.infer<typeof this.schema>) {
    try {
      console.log(`[SwaggerParserTool] 解析Swagger文档: ${url}`);
      
      // 创建解析器实例
      const parser = new SwaggerApiParser({ url, headers });
      
      // 解析API文档
      const api = await parser.fetchApi();
      
      // 获取API操作
      const operations = parser.getAllOperations();
      
      // 构建结果对象
      const result: any = {
        success: true,
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
      
      // 如果需要模式定义，则添加到结果中
      if (includeSchemas) {
        result.schemas = parser.getSchemas();
      }
      
      console.log(`[SwaggerParserTool] 解析完成，找到 ${operations.length} 个API操作`);
      
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
      console.error(`[SwaggerParserTool] 解析失败:`, error);
      
      // 返回错误结果
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }
        ]
      };
    }
  }
} 