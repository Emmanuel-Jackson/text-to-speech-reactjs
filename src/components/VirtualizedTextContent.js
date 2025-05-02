import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import throttle from 'lodash.throttle';

const VirtualizedTextContent = React.memo(({
  text,
  currentWordIndex,
  fontFamily,
  fontSize,
  letterSpacing,
  isBold,
  isSpeaking,
  onWordPositionUpdate
}) => {
  // Split text into paragraphs for virtualization
  const paragraphs = useMemo(() => {
    return text.split('\n').filter(p => p.trim().length > 0);
  }, [text]);

  // Calculate word positions (throttled for performance)
  const calculateWordPositions = useMemo(() => throttle(() => {
    const words = [];
    let currentPos = 0;
    
    paragraphs.forEach((para, paraIndex) => {
      const paraWords = para.split(/\s+/);
      paraWords.forEach((word, wordIndex) => {
        words.push({
          paraIndex,
          wordIndex,
          position: currentPos
        });
        currentPos += word.length + 1; // +1 for space
      });
      currentPos += 1; // +1 for newline
    });
    
    return words;
  }, 500), [paragraphs]);

  const Row = ({ index, style }) => {
    const para = paragraphs[index];
    const words = para.split(/\s+/);
    
    return (
      <div style={style}>
        {words.map((word, wordIndex) => {
          const globalWordIndex = calculateWordPositions()[index].wordIndex;
          const isHighlighted = globalWordIndex === currentWordIndex;
          
          return (
            <span
              key={`${index}-${wordIndex}`}
              className={`word ${isHighlighted ? "highlight" : ""}`}
            >
              {word}{" "}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`text-content ${isSpeaking ? 'speaking' : ''}`}
      style={{
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        letterSpacing: `${letterSpacing}px`,
        fontWeight: isBold ? '900' : '400',
        height: '100%'
      }}
    >
      <List
        height={500} // Adjust based on your textarea height
        itemCount={paragraphs.length}
        itemSize={30} // Approximate line height
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
});

export default VirtualizedTextContent;