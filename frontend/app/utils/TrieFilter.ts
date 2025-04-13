class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

export class TrieFilter {
  private root: TrieNode;

  constructor(words: string[]) {
    this.root = new TrieNode();
    // 初始化时构建字典树
    words.forEach(word => this.insert(word));
  }

  private insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }

  // 检查文本中是否包含敏感词，返回找到的第一个敏感词
  public containsSensitiveWord(text: string): { found: boolean; word?: string } {
    for (let i = 0; i < text.length; i++) {
      let node = this.root;
      let word = '';
      
      for (let j = i; j < text.length; j++) {
        const char = text[j];
        if (!node.children.has(char)) {
          break;
        }
        
        word += char;
        node = node.children.get(char)!;
        
        if (node.isEndOfWord) {
          return { found: true, word };
        }
      }
    }
    return { found: false };
  }

  // 查找所有敏感词
  public findAllSensitiveWords(text: string): string[] {
    const result = new Set<string>();
    
    for (let i = 0; i < text.length; i++) {
      let node = this.root;
      let word = '';
      
      for (let j = i; j < text.length; j++) {
        const char = text[j];
        if (!node.children.has(char)) {
          break;
        }
        
        word += char;
        node = node.children.get(char)!;
        
        if (node.isEndOfWord) {
          result.add(word);
          break; // 找到一个就跳出当前循环，继续从下一个位置开始
        }
      }
    }
    
    return Array.from(result);
  }
} 