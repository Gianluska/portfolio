import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface DecodingTextProps {
  text: string;
  stopShuffle: boolean;
  speed?: number; // Velocidade de revelação (em milissegundos)
}

export const DecoderText: React.FC<DecodingTextProps> = ({ text, stopShuffle, speed = 50 }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsArray = text.split('');
    
    // Função de shuffle com GSAP
    const shuffleText = () => {
      gsap.to({}, { // Isso cria um ticker para o embaralhamento
        duration: speed / 1000,
        repeat: -1,
        onUpdate: () => {
          setDisplayText(() =>
            charsArray.map((char, i) =>
              i < displayText.length ? char : chars[Math.floor(Math.random() * chars.length)]
            ).join('')
          );
        },
      });
    };

    // Revela o texto usando GSAP
    const revealText = () => {
      gsap.to({}, {
        duration: 0.5,
        repeat: charsArray.length - 1,
        onRepeat: () => {
          setDisplayText((prev) => text.substring(0, prev.length + 1));
        },
        onComplete: () => {
          setDisplayText(text); // Garante que o texto esteja completamente revelado ao final
        },
      });
    };

    if (!stopShuffle) {
      shuffleText();
    } else {
      revealText();
    }

    return () => {
      gsap.killTweensOf({}); // Limpa qualquer animação quando o componente desmontar
    };
  }, [stopShuffle, text, speed]);

  return <p ref={textRef} className='text-white'>{displayText}</p>;
};
