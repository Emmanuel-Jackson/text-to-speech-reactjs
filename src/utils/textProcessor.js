export const chunkText = (text, chunkSize = 1000) => {
    const words = text.match(/\S+|\s+/g) || [];
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push({
        text: words.slice(i, i + chunkSize).join(''),
        startWordIndex: i,
        endWordIndex: Math.min(i + chunkSize, words.length) - 1
      });
    }
    
    return chunks;
  };
  
  export const getCurrentChunkIndex = (chunks, currentWordIndex) => {
    return chunks.findIndex(chunk => 
      currentWordIndex >= chunk.startWordIndex && 
      currentWordIndex <= chunk.endWordIndex
    );
  };