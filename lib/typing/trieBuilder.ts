export class TrieNode {
  children: { [key: string]: TrieNode } = {};
  isEndOfWord: boolean = false;
  word: string | null = null;
}

export class Trie {
  root: TrieNode = new TrieNode();

  insert(word: string) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.word = word;
  }

  search(prefix: string): string | null {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return this.findFirstWord(node);
  }

  private findFirstWord(node: TrieNode): string | null {
    if (node.isEndOfWord) return node.word;
    const chars = Object.keys(node.children).sort();
    for (const char of chars) {
      const word = this.findFirstWord(node.children[char]);
      if (word) return word;
    }
    return null;
  }
}

export const buildTrie = (words: string[]): Trie => {
  const trie = new Trie();
  words.forEach(w => trie.insert(w));
  return trie;
};
