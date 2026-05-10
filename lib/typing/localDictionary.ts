import dictionary from "./dictionary.json";
import { buildTrie, Trie } from "./trieBuilder";

let trie: Trie | null = null;

export const getPrediction = (prefix: string): string | null => {
  if (!trie) {
    trie = buildTrie(dictionary);
  }
  if (!prefix) return null;
  
  const fullWord = trie.search(prefix);
  if (fullWord && fullWord.toLowerCase().startsWith(prefix.toLowerCase())) {
    return fullWord.slice(prefix.length);
  }
  return null;
};
