"use client";

import React from "react";

export default function Logo3D({ size = 240 }: { size?: number }) {
  const scale = size / 240;
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    }}>
    <div style={{
      position: "relative",
      width: "240px",
      height: "240px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      perspective: "1000px",
      transform: `scale(${scale})`,
    }}>
      {/* 
        TODO: 향후 실제 3D 로고 파일 도입 시 아래 경로 이미지로 교체해주세요:
        - public/images/logo-3d.png
        - public/logo.svg
        예: <img src="/images/logo-3d.png" alt="POPOK 3D Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      */}
      
      {/* 3D Cake Slice Container */}
      <div style={{
        width: "120px",
        height: "120px",
        position: "relative",
        transformStyle: "preserve-3d",
        transform: "rotateX(60deg) rotateY(0deg) rotateZ(-45deg)",
        animation: "floatCake 4s ease-in-out infinite"
      }}>
        {/* Top Frosting (POPOK signature yellow-orange) */}
        <div style={{
          position: "absolute",
          width: "120px",
          height: "120px",
          background: "linear-gradient(135deg, #F5A623 0%, #E28E12 100%)",
          clipPath: "polygon(0 0, 120px 0, 120px 120px)",
          transform: "translateZ(50px)",
          boxShadow: "inset 0 0 15px rgba(0,0,0,0.1)",
        }}>
          {/* Strawberry/Berry Topping */}
          <div style={{
            position: "absolute",
            width: "22px",
            height: "22px",
            background: "linear-gradient(135deg, #EF4444 0%, #991B1B 100%)",
            borderRadius: "50%",
            right: "26px",
            top: "26px",
            transform: "translateZ(10px)",
            boxShadow: "0 6px 12px rgba(153, 27, 27, 0.4)"
          }} />
        </div>

        {/* Side Wall 1 (Facing front-left, sliced look) */}
        <div style={{
          position: "absolute",
          width: "120px",
          height: "50px",
          background: "repeating-linear-gradient(180deg, #F5A623 0px, #F5A623 10px, #FFF 10px, #FFF 14px, #FCE5B2 14px, #FCE5B2 24px, #FFF 24px, #FFF 28px, #F5A623 28px, #F5A623 38px, #FFF 38px, #FFF 42px, #E28E12 42px, #E28E12 50px)",
          transform: "rotateX(-90deg)",
          transformOrigin: "bottom center",
          bottom: "120px",
          left: 0
        }} />

        {/* Side Wall 2 (Facing front-right, sliced look) */}
        <div style={{
          position: "absolute",
          width: "120px",
          height: "50px",
          background: "repeating-linear-gradient(180deg, #E28E12 0px, #E28E12 10px, #FFFBEB 10px, #FFFBEB 14px, #E5C387 14px, #E5C387 24px, #FFFBEB 24px, #FFFBEB 28px, #E28E12 28px, #E28E12 38px, #FFFBEB 38px, #FFFBEB 42px, #C87A0B 42px, #C87A0B 50px)",
          transform: "rotateY(90deg) translateZ(120px)",
          transformOrigin: "center left",
          top: 0,
          left: 0
        }} />

        {/* Cake Crust / Base Plate */}
        <div style={{
          position: "absolute",
          width: "120px",
          height: "120px",
          background: "#1E2D40",
          clipPath: "polygon(0 0, 120px 0, 120px 120px)",
          transform: "translateZ(0px)",
        }} />
      </div>

      {/* Floating Ambient Shadow */}
      <div style={{
        position: "absolute",
        width: "110px",
        height: "26px",
        background: "rgba(30, 45, 64, 0.16)",
        borderRadius: "50%",
        bottom: "35px",
        filter: "blur(6px)",
        animation: "shadowScale 4s ease-in-out infinite",
        transform: "scale(1.2)"
      }} />

      {/* Inline styles for keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatCake {
          0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(0px); }
          50% { transform: rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(15px); }
          100% { transform: rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(0px); }
        }
        @keyframes shadowScale {
          0% { transform: scale(1.1); opacity: 0.8; }
          50% { transform: scale(0.85); opacity: 0.45; }
          100% { transform: scale(1.1); opacity: 0.8; }
        }
      `}} />
    </div>
    </div>
  );
}
