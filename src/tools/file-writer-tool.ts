/**
 * MCP 文件写入工具
 * 提供写入文件到本地文件系统的能力，支持自动创建目录
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 文件写入参数的验证模式
const fileWriterSchema = z.object({
  filePath: z.string().min(1).describe('文件的完整路径'),
  content: z.string().describe('要写入文件的内容'),
  createDirs: z.boolean().optional().default(true).describe('如果父目录不存在，是否自动创建'),
  append: z.boolean().optional().default(false).describe('是否追加到现有文件而不是覆盖'),
  encoding: z.string().optional().default('utf8').describe('文件编码'),
});

// 文件写入工具的类型定义
type FileWriterParams = z.infer<typeof fileWriterSchema>;

/**
 * 文件写入工具类
 * 提供写入文件到本地文件系统的能力
 */
export class FileWriterTool {
  // 工具名称和描述
  readonly name = 'file_writer';
  readonly description = '写入内容到指定文件路径，支持自动创建目录';
  readonly version = '1.0.0';
  readonly schema = fileWriterSchema;

  /**
   * 向MCP服务器注册工具
   */
  register(server: McpServer): void {
    server.tool(
      this.name, 
      this.description,
      this.schema.shape,
      async (params) => {
        // 验证参数
        const result = await this.writeFile(params);
        
        // 返回符合MCP要求的格式
        return {
          ...result,
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
    );
  }

  /**
   * 写入文件的实现
   */
  async writeFile(params: FileWriterParams): Promise<object> {
    try {
      const { filePath, content, createDirs, append, encoding } = params;
      
      // 确保父目录存在
      if (createDirs) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      // 写入文件
      if (append) {
        await fs.appendFile(filePath, content, { encoding: encoding as BufferEncoding });
      } else {
        await fs.writeFile(filePath, content, { encoding: encoding as BufferEncoding });
      }
      
      // 获取文件信息
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        message: `文件已${append ? '追加' : '写入'}: ${filePath}`,
      };
    } catch (error) {
      console.error('文件写入失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        filePath: params.filePath,
      };
    }
  }
} 