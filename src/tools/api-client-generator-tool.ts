/**
 * API客户端生成器MCP工具
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClientGenerator, ApiClientGeneratorOptions } from '../generators/api-client-generator';

// MCP工具名称和描述
const API_CLIENT_GENERATOR_TOOL_NAME = 'generate-api-client';
const API_CLIENT_GENERATOR_TOOL_DESCRIPTION = '从Swagger/OpenAPI文档生成API客户端代码。';

// 优化版MCP工具名称和描述
const OPTIMIZED_API_CLIENT_GENERATOR_TOOL_NAME = 'generate-api-client-optimized';
const OPTIMIZED_API_CLIENT_GENERATOR_TOOL_DESCRIPTION = '从Swagger/OpenAPI文档生成API客户端代码（优化版，支持缓存和大型文档处理）。';

/**
 * API客户端生成器工具类
 */
export class ApiClientGeneratorTool {
  name = API_CLIENT_GENERATOR_TOOL_NAME;
  description = API_CLIENT_GENERATOR_TOOL_DESCRIPTION;
  optimizedName = OPTIMIZED_API_CLIENT_GENERATOR_TOOL_NAME;
  optimizedDescription = OPTIMIZED_API_CLIENT_GENERATOR_TOOL_DESCRIPTION;

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

  // 定义优化版参数模式
  optimizedSchema = this.schema.extend({
    /**
     * 是否使用缓存
     */
    useCache: z.boolean().optional().describe('是否使用缓存'),
    
    /**
     * 缓存有效期（分钟）
     */
    cacheTTLMinutes: z.number().optional().describe('缓存有效期（分钟）'),
    
    /**
     * 是否跳过验证
     */
    skipValidation: z.boolean().optional().describe('是否跳过验证'),
    
    /**
     * 是否启用懒加载
     */
    lazyLoading: z.boolean().optional().describe('是否启用懒加载')
  });

  /**
   * 在MCP服务器上注册工具
   */
  register(server: McpServer) {
    // 注册标准版
    server.tool(
      this.name,
      this.description,
      this.schema.shape,
      async (params) => {
        return await this.execute(params);
      }
    );

    // 注册优化版
    server.tool(
      this.optimizedName,
      this.optimizedDescription,
      this.optimizedSchema.shape,
      async (params) => {
        // 设置优化版默认选项
        const optimizedParams = {
          ...params,
          useCache: params.useCache !== false,
          lazyLoading: params.lazyLoading !== false,
          skipValidation: params.skipValidation || false
        };
        return await this.execute(optimizedParams);
      }
    );
  }

  /**
   * 执行API客户端生成
   */
  async execute(params: z.infer<typeof this.optimizedSchema>) {
    try {
      console.log(`[ApiClientGeneratorTool] 开始生成API客户端: ${params.swaggerUrl}`);
      
      // 创建生成器实例
      const generator = new ApiClientGenerator();
      
      // 记录进度的函数
      let progressUpdates: { progress: number, message: string }[] = [];
      const progressCallback = (progress: number, message: string) => {
        progressUpdates.push({ progress, message });
      };
      
      // 执行生成
      const result = await generator.generate({
        ...params,
        progressCallback
      } as ApiClientGeneratorOptions);
      
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
                warnings: result.warnings,
                progress: progressUpdates
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
                error: result.error,
                progress: progressUpdates
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