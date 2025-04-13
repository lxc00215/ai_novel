import { TrieFilter } from './TrieFilter';

let trieFilterInstance: TrieFilter | null = null;

export const initSensitiveFilter = async () => {
  if (trieFilterInstance) {
    return trieFilterInstance;
  }

  try {
    // 读取txt文件
    const response = await fetch('/sensitive-words.txt');
    const text = await response.text();
    
    // 按行分割并过滤空行
    const sensitiveWords = text.split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    trieFilterInstance = new TrieFilter(sensitiveWords);
    return trieFilterInstance;
  } catch (error) {
    console.error('Failed to load sensitive words:', error);
    // 返回一个空的过滤器作为后备
    return new TrieFilter([]);
  }
};

// 导出一个获取实例的函数
export const getTrieFilter = () => {
  if (!trieFilterInstance) {
    throw new Error('Sensitive filter not initialized');
  }
  return trieFilterInstance;
}; 