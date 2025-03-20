/**
 * TypeScript类型生成器MCP工具
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TypeScriptTypesGenerator, TypeScriptTypesGeneratorOptions } from '../generators/typescript-types-generator';

// MCP工具名称和描述
const TS_TYPES_GENERATOR_TOOL_NAME = 'generate-typescript-types';
const TS_TYPES_GENERATOR_TOOL_DESCRIPTION = '从Swagger/OpenAPI文档生成TypeScript类型定义。';

// 性能优化版工具名称和描述
const TS_TYPES_GENERATOR_OPTIMIZED_TOOL_NAME = 'generate-typescript-types-optimized';
const TS_TYPES_GENERATOR_OPTIMIZED_TOOL_DESCRIPTION = '使用优化选项从Swagger/OpenAPI文档生成TypeScript类型定义，支持缓存和大型文档处理。';

/**
 * TypeScript类型生成器工具类
 */
export class TypeScriptTypesGeneratorTool {
  name = TS_TYPES_GENERATOR_TOOL_NAME;
  description = TS_TYPES_GENERATOR_TOOL_DESCRIPTION;

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
     * 使用命名空间包装类型
     */
    useNamespace: z.boolean().optional().describe('使用命名空间包装类型'),
    
    /**
     * 命名空间名称
     */
    namespace: z.string().optional().describe('命名空间名称'),
    
    /**
     * 是否生成枚举类型
     */
    generateEnums: z.boolean().optional().describe('是否生成枚举类型'),
    
    /**
     * 是否使用严格类型
     */
    strictTypes: z.boolean().optional().describe('是否使用严格类型'),
    
    /**
     * 排除的模式名称数组
     */
    excludeSchemas: z.array(z.string()).optional().describe('排除的模式名称数组'),
    
    /**
     * 包含的模式名称数组
     */
    includeSchemas: z.array(z.string()).optional().describe('包含的模式名称数组'),
    
    /**
     * 是否生成索引文件
     */
    generateIndex: z.boolean().optional().describe('是否生成索引文件'),
    
    /**
     * 请求头信息
     */
    headers: z.record(z.string()).optional().describe('请求头信息'),
    
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
    // 注册标准工具
    server.tool(
      this.name,
      this.description,
      this.schema.shape,
      async (params) => {
        // 使用默认参数
        const options = {
          ...params,
          useCache: true,
          skipValidation: true,
          lazyLoading: false
        };
        return await this.execute(options);
      }
    );
    
    // 注册优化版工具
    server.tool(
      TS_TYPES_GENERATOR_OPTIMIZED_TOOL_NAME,
      TS_TYPES_GENERATOR_OPTIMIZED_TOOL_DESCRIPTION,
      this.schema.shape,
      async (params) => {
        // 默认启用性能优化选项
        const options = {
          ...params,
          useCache: params.useCache !== false,
          skipValidation: params.skipValidation !== false,
          lazyLoading: params.lazyLoading !== false
        };
        return await this.execute(options);
      }
    );
  }

  /**
   * 执行TypeScript类型生成
   */
  async execute(params: z.infer<typeof this.schema>) {
    let progress = 0;
    let progressMessage = '';
    
    // 定义进度回调
    const progressCallback = (newProgress: number, message: string) => {
      progress = newProgress;
      progressMessage = message;
      console.log(`[Progress] ${Math.round(newProgress * 100)}%: ${message}`);
    };
    
    try {
      console.log(`[TypeScriptTypesGeneratorTool] 开始生成TypeScript类型: ${params.swaggerUrl}`);
      console.log(`[TypeScriptTypesGeneratorTool] 缓存: ${params.useCache ? '启用' : '禁用'}, 懒加载: ${params.lazyLoading ? '启用' : '禁用'}`);
      
      // 创建生成器实例
      const generator = new TypeScriptTypesGenerator();
      
      // 执行生成
      const result = await generator.generate({
        ...params,
        progressCallback
      } as TypeScriptTypesGeneratorOptions);
      
      // 处理结果
      if (result.success) {
        console.log(`[TypeScriptTypesGeneratorTool] 类型生成成功，生成了 ${result.files.length} 个文件`);
        
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                files: result.files,
                warnings: result.warnings,
                progress: 1.0,
                progressMessage: '完成'
              }, null, 2)
            }
          ]
        };
      } else {
        console.error(`[TypeScriptTypesGeneratorTool] 类型生成失败: ${result.error}`);
        
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: result.error,
                progress: progress,
                progressMessage: progressMessage
              }, null, 2)
            }
          ]
        };
      }
    } catch (error) {
      console.error(`[TypeScriptTypesGeneratorTool] 执行异常:`, error);
      
      // 返回错误结果
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
              progress: progress,
              progressMessage: progressMessage
            }, null, 2)
          }
        ]
      };
    }
  }
} 