import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface TerminalTypingTextProps {
  text: string;
  typeSpeed?: number;
  showCursor?: boolean;
  onComplete?: () => void;
  style?: any;
}

/**
 * Terminal-style typing animation component
 * @description Displays text with a typing animation effect and optional blinking cursor
 * @param text - Text to display with typing animation
 * @param typeSpeed - Speed of typing in milliseconds (default: 50)
 * @param showCursor - Whether to show blinking cursor (default: true)
 * @param onComplete - Callback when typing is complete
 * @param style - Additional styles to apply
 * @returns React component with typing animation
 */
export default function TerminalTypingText({
  text,
  typeSpeed = 50,
  showCursor = true,
  onComplete,
  style,
}: TerminalTypingTextProps) {
  const theme = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typeSpeed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, typeSpeed, onComplete]);

  useEffect(() => {
    if (showCursor) {
      const interval = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [showCursor]);

  return (
    <Text style={[styles.text, { color: theme.colors.primary }, style]}>
      {displayedText}
      {showCursor && (
        <Text style={[styles.cursor, { opacity: cursorVisible ? 1 : 0 }]}>_</Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'RobotoMono_400Regular',
    fontSize: 16,
  },
  cursor: {
    fontFamily: 'RobotoMono_400Regular',
    fontSize: 16,
  },
});
