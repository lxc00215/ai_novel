import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { initSensitiveFilter, getTrieFilter } from '@/app/utils/sensitiveWords';

// 定义敏感词检查的返回类型
interface CheckResult {
  isValid: boolean;
  invalidWords: string[];
}

// 定义配置选项类型
interface FilterOptions {
  showToast?: boolean;        // 是否显示提示
  autoReplace?: boolean;      // 是否自动替换敏感词
  onDetect?: (words: string[]) => void;  // 检测到敏感词时的回调
}

export const useSensitiveFilter = (options: FilterOptions = {}) => {
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // 初始化过滤器
  useEffect(() => {
    initSensitiveFilter().then(() => {
      setIsReady(true);
    });
  }, []);

  const shouldFilter = (apiEndpoint: string): boolean => {
    // 定义不需要过滤的 API 列表
    const noFilterAPIs = [
      '/api/ai/generateContent', // 示例 API
      '/api/ai/generateImage'
    ];
    return !noFilterAPIs.includes(apiEndpoint);
  };

  // 检查文本中的敏感词
  const checkText = useCallback((text: string): CheckResult => {
    if (!isReady) {
      return { isValid: true, invalidWords: [] };
    }

    const { showToast = true } = options;
    
    try {
      const filter = getTrieFilter();
      const { found, word } = filter.containsSensitiveWord(text);
      
      setIsValid(!found);
      setInvalidWords(found ? [word!] : []);

      if (found && showToast) {
        toast.warning('内容包含不适当的词语');
      }

      if (found && options.onDetect) {
        options.onDetect([word!]);
      }

      return { isValid: !found, invalidWords: found ? [word!] : [] };
    } catch (error) {
      console.error('Error checking sensitive words:', error);
      return { isValid: true, invalidWords: [] };
    }
  }, [isReady, options]);

  // 替换敏感词
  const replaceText = useCallback((text: string): string => {
    return invalidWords.reduce((result, word) => {
      return result.replace(new RegExp(word, 'g'), '*'.repeat(word.length));
    }, text);
  }, [invalidWords]);

  // 创建输入处理器
  const createInputHandler = useCallback((onChange?: (value: string) => void) => {
    return (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (!isReady) {
        onChange?.(e.target.value);
        return;
      }

      const newValue = e.target.value;
      const { isValid } = checkText(newValue);

      if (options.autoReplace && !isValid) {
        const replacedValue = replaceText(newValue);
        e.target.value = replacedValue;
        onChange?.(replacedValue);
      } else {
        onChange?.(newValue);
      }
    };
  }, [isReady, checkText, replaceText, options.autoReplace]);

  return {
    checkText,          // 检查文本
    replaceText,        // 替换敏感词
    createInputHandler, // 创建输入处理器
    invalidWords,       // 当前检测到的敏感词
    isValid,           // 当前文本是否有效
    isReady,           // 过滤器是否已准备就绪
  };
}; 