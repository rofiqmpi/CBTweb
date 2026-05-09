import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MascotState } from '../types';

export interface MascotProps {
  state: MascotState;
  className?: string;
  lookAt?: { x: number, y: number } | null;
}

function Mascot({ state, className, lookAt }: MascotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(".idle-bob-group", {
        y: -10,
        x: 5,
        rotation: 2,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      const liquidD1 = "M 20 40 Q 20 5 50 5 Q 80 5 80 40 L 82 82 Q 80 108 65 92 Q 50 118 35 92 Q 18 108 18 82 Z";
      const liquidD2 = "M 20 40 Q 20 5 50 5 Q 80 5 80 40 L 83 85 Q 85 105 68 95 Q 52 110 38 95 Q 15 105 17 85 Z";
      
      gsap.to(".body-path", {
        attr: { d: liquidD2 },
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".body-path", {
        scale: 1.02,
        transformOrigin: "center",
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      const targetPos = lookAt || { x: 0, y: 0 };
      gsap.to(".pupil-container", {
        x: targetPos.x * 6,
        y: targetPos.y * 5,
        duration: 0.4,
        ease: "power2.out"
      });
      
      gsap.to(".face", {
        x: targetPos.x * 3,
        y: targetPos.y * 2,
        rotation: targetPos.x * 5,
        duration: 0.6,
        ease: "power2.out"
      });

      gsap.to(".eye-left, .eye-right", { scaleY: 1, opacity: 1, duration: 0.1 });
      gsap.to(".pupil-left, .pupil-right", { opacity: 1, duration: 0.1 });
      gsap.to(".glasses", { opacity: 0, y: -10, scale: 0.9, duration: 0.1 });

      if (state !== 'wave') {
        gsap.to(".arm-wave-right, .arm-wave-left", { opacity: 0, rotation: 0, duration: 0.1 });
        gsap.killTweensOf(".arm-wave-right, .arm-wave-left");
      }
      
      if (state !== 'cool') {
        gsap.to(".cap", { opacity: 0, y: -100, duration: 0.2 });
      }

      if (state === 'thinking') {
        gsap.to(".mouth", { d: "M 40 75 Q 50 75 60 75", duration: 0.3 });
        gsap.to(".brow-left", { y: -2, rotation: -10, duration: 0.3 });
        gsap.to(".brow-right", { y: -2, rotation: 10, duration: 0.3 });
        gsap.to(".glasses", { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out" });
      } else if (state === 'excited') {
        gsap.to(".mouth", { d: "M 30 65 Q 50 100 70 65", duration: 0.2 });
        gsap.to(".body-group", { y: -15, duration: 0.2, repeat: 1, yoyo: true });
      } else if (state === 'happy') {
        gsap.to(".mouth", { d: "M 30 70 Q 50 95 70 70", duration: 0.3 });
        gsap.to(".brow-left", { y: -8, rotation: -20, duration: 0.3 });
        gsap.to(".brow-right", { y: -8, rotation: 20, duration: 0.3 });
      } else if (state === 'sad') {
        gsap.to(".mouth", { d: "M 35 85 Q 50 70 65 85", duration: 0.3 });
        gsap.to(".brow-left", { y: 5, rotation: 10, duration: 0.3 });
        gsap.to(".brow-right", { y: 5, rotation: -10, duration: 0.3 });
      } else if (state === 'persistent') {
        gsap.to(".mouth", { d: "M 40 80 Q 50 70 60 80", duration: 0.2 });
        gsap.to(".brow-left", { y: 2, rotation: 15, duration: 0.2 });
        gsap.to(".brow-right", { y: 2, rotation: -15, duration: 0.2 });
        gsap.to(".body-group", { x: "random(-1.5, 1.5)", repeat: 7, yoyo: true, duration: 0.05 });
      } else if (state === 'questioning') {
        gsap.to(".mouth", { d: "M 45 70 Q 50 65 55 70", duration: 0.3 });
        gsap.to(".brow-left", { y: -5, duration: 0.3 });
        gsap.to(".face", { rotation: -8, transformOrigin: "center", duration: 0.3 });
      } else if (state === 'wave') {
        gsap.to(".arm-wave-right, .arm-wave-left", { opacity: 1, duration: 0.2 });
        gsap.to(".arm-wave-right", { 
          rotation: -35, 
          transformOrigin: "bottom right",
          duration: 0.4, 
          repeat: -1, 
          yoyo: true, 
          ease: "sine.inOut" 
        });
        gsap.to(".arm-wave-left", { 
          rotation: 35, 
          transformOrigin: "bottom left",
          duration: 0.4, 
          repeat: -1, 
          yoyo: true, 
          ease: "sine.inOut",
          delay: 0.2
        });
        gsap.to(".mouth", { d: "M 35 60 Q 50 88 65 60", duration: 0.2 });
      } else if (state === 'cool') {
        gsap.to(".cap", { opacity: 1, y: -38, x: -1, scale: 1, rotation: 25, duration: 0.4, ease: "back.out" });
        gsap.to(".mouth", { d: "M 40 70 Q 50 75 60 70", duration: 0.3 });
      } else if (state === 'wink') {
        gsap.to(".eye-left", { scaleY: 0.1, transformOrigin: "center", duration: 0.2 });
        gsap.to(".pupil-left", { opacity: 0, duration: 0.2 });
        gsap.to(".mouth", { d: "M 35 70 Q 50 85 65 75", duration: 0.3 });
        gsap.to(".brow-left", { y: 2, duration: 0.2 });
      } else if (state === 'smiling') {
        gsap.to(".mouth", { d: "M 35 75 Q 50 85 65 75", duration: 0.3 });
      } else if (state === 'grin') {
        gsap.to(".mouth", { d: "M 30 65 Q 50 100 70 65", duration: 0.3 });
        gsap.to(".body-group", { scaleY: 1.05, transformOrigin: "bottom", duration: 0.2, repeat: 1, yoyo: true });
      }

      if (state === 'thinking') {
        gsap.to(".glasses", { opacity: 1, y: 0, scale: 1, duration: 0.4 });
      }

    }, svgRef);

    return () => {
      ctx.revert();
    };
  }, [state, lookAt]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox="-40 -40 180 190"
        className="w-full h-full drop-shadow-[0_25px_25px_rgba(108,92,231,0.3)] overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="idle-bob-group">
          <g className="body-group">
            <path
              className="body-path stroke-[#1A1A1A] stroke-[4]"
              style={{ fill: '#6C5CE7' }}
              d="M 20 40 Q 20 5 50 5 Q 80 5 80 40 L 82 82 Q 80 108 65 92 Q 50 118 35 92 Q 18 108 18 82 Z"
            />

            <path
              className="arm-wave-left stroke-[#1A1A1A] stroke-[4]"
              style={{ fill: '#6C5CE7', opacity: 0 }}
              d="M 20 45 Q 0 40 -5 55 Q -10 70 5 70 Q 18 70 18 55"
            />
            <path
              className="arm-wave-right stroke-[#1A1A1A] stroke-[4]"
              style={{ fill: '#6C5CE7', opacity: 0 }}
              d="M 80 45 Q 100 40 105 55 Q 110 70 95 70 Q 82 70 82 55"
            />
            
            <g className="face">
              <g className="cap" opacity="0" transform="translate(24, -38) rotate(25)">
                <path 
                  d="M 50 30 Q 75 42 100 30 Q 105 34 100 38 Q 75 46 50 38 Q 45 34 50 30 
                     M 60 35 L 70 -10 Q 85 -10 95 10 L 85 35" 
                  fill="#FF4757" 
                  className="stroke-[#1A1A1A] stroke-[2.5]" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M 65 10 Q 75 15 85 10" 
                  fill="none" 
                  className="stroke-[#1A1A1A] stroke-[1] opacity-30" 
                />
              </g>

              <path className="brow-left stroke-black stroke-2 fill-none" d="M 35 30 Q 40 28 45 30" />
              <path className="brow-right stroke-black stroke-2 fill-none" d="M 55 30 Q 60 28 65 30" />

              <g className="eyes-container">
                <circle className="eye-left fill-white stroke-[#1A1A1A] stroke-[1.5]" cx="40" cy="45" r="8" />
                <circle className="eye-right fill-white stroke-[#1A1A1A] stroke-[1.5]" cx="60" cy="45" r="8" />
                
                <g className="pupil-container">
                  <circle className="pupil-left fill-black" cx="40" cy="45" r="3.5" />
                  <circle className="pupil-right fill-black" cx="60" cy="45" r="3.5" />
                </g>
              </g>

              <g className="glasses" opacity="0" transform="translate(0, -10)">
                <rect x="22" y="42" width="22" height="12" rx="2" className="fill-none stroke-[#1A1A1A] stroke-[3]" />
                <rect x="56" y="42" width="22" height="12" rx="2" className="fill-none stroke-[#1A1A1A] stroke-[3]" />
                <path d="M 44 48 L 56 48" className="fill-none stroke-[#1A1A1A] stroke-[3]" />
              </g>
              
              <path
                className="mouth stroke-black stroke-[3] fill-none"
                d="M 40 65 Q 50 72 60 65"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default React.memo(Mascot);
