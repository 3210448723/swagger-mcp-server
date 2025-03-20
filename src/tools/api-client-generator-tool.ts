/**
 * API客户端生成器MCP工具
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClientGenerator, ApiClientGeneratorOptions } from '../generators/api-client-generator';

// MCP工具名称和描述
const API_CLIENT_GENERATOR_TOOL_NAME = 'generate-api-client';
const API_CLIENT_GENERATOR_TOOL_DESCRIPTION = '从Swagger/OpenAPI文档生成API客户端代码。';

/**
 * API客户端生成器工具类
 */
export class ApiClientGeneratorTool {
  name = API_CLIENT_GENERATOR_TOOL_NAME;
  description = API_CLIENT_GENERATOR_TOOL_DESCRIPTION;

  // 定义参数模式
  schema = z.object({
    /**
     * Swagger/OpenAPI文档URL
     */
    swaggerUrl: z.string().describe('Swagger/OpenAPI文档URL'),
    
    /**
     * 输出目录
     */
    outputDir: z.string().optional().describe('输出目录'),
    
    /**
     * 是否覆盖现有文件
     */
    overwrite: z.boolean().optional().describe('是否覆盖现有文件'),
    
    /**
     * 文件前缀
     */
    filePrefix: z.string().optional().describe('文件前缀'),
    
    /**
     * 文件后缀
     */
    fileSuffix: z.string().optional().describe('文件后缀'),
    
    /**
     * API客户端技术栈
     */
    clientType: z.enum(['axios', 'fetch', 'react-query']).optional().describe('API客户端技术栈'),
    
    /**
     * 是否生成类型导入
     */
    generateTypeImports: z.boolean().optional().describe('是否生成类型导入'),
    
    /**
     * 类型导入路径
     */
    typesImportPath: z.string().optional().describe('类型导入路径'),
    
    /**
     * 分组方式
     */
    groupBy: z.enum(['tag', 'path', 'none']).optional().describe('分组方式'),
    
    /**
     * 过滤tag列表
     */
    includeTags: z.array(z.string()).optional().describe('过滤tag列表'),
    
    /**
     * 排除tag列表
     */
    excludeTags: z.array(z.string()).optional().describe('排除tag列表'),
    
    /**
     * 请求头信息
     */
    headers: z.record(z.string()).optional().describe('请求头信息')
  });

  /**
   * 在MCP服务器上注册工具
   */
  register(server: McpServer) {
    server.tool(
      this.name,
      this.description,
      this.schema.shape,
      async (params) => {
        return await this.execute(params);
      }
    );
  }

  /**
   * 执行API客户端生成
   */
  async execute(params: z.infer<typeof this.schema>) {
    try {
      console.log(`[ApiClientGeneratorTool] 开始生成API客户端: ${params.swaggerUrl}`);
      
      // 创建生成器实例
      const generator = new ApiClientGenerator();
      
      // 执行生成
      const result = await generator.generate(params as ApiClientGeneratorOptions);
      
      // 处理结果
      if (result.success) {
        console.log(`[ApiClientGeneratorTool] 客户端生成成功，生成了 ${result.files.length} 个文件`);
        
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                files: result.files,
                warnings: result.warnings
              }, null, 2)
            }
          ]
        };
      } else {
        console.error(`[ApiClientGeneratorTool] 客户端生成失败: ${result.error}`);
        
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: result.error
              }, null, 2)
            }
          ]
        };
      }
    } catch (error) {
      console.error(`[ApiClientGeneratorTool] 执行异常:`, error);
      
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