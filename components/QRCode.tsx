import React from 'react';

interface QRCodeProps {
    value: string;
    size?: number;
    backgroundColor?: string;
    foregroundColor?: string;
}

const QRCode: React.FC<QRCodeProps> = ({ 
    value, 
    size = 128, 
    backgroundColor = '#FFFFFF', 
    foregroundColor = '#181818' 
}) => {
    const matrixSize = 17; // A smaller, fixed matrix for a simpler visual
    const cellSize = size / matrixSize;

    const modules: boolean[][] = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false));

    // Simple pseudo-random generation based on the input value
    for (let y = 0; y < matrixSize; y++) {
        for (let x = 0; x < matrixSize; x++) {
            const charIndex = (x * matrixSize + y) % value.length;
            const charCode = value.charCodeAt(charIndex);
            // A simple logic to create a pattern. Not a real QR algorithm.
            if ((charCode + x * y) % 3 === 0 || (charCode + x) % 5 === 0) {
                modules[y][x] = true;
            }
        }
    }
    
    // Create corner patterns for a more QR-like appearance
    const createCorner = (xOffset: number, yOffset: number) => {
        for(let y=0; y<5; y++) {
            for(let x=0; x<5; x++) {
                const isInner = x > 0 && x < 4 && y > 0 && y < 4;
                const isCenter = x === 2 && y === 2;
                modules[y+yOffset][x+xOffset] = !isInner || isCenter;
            }
        }
    };
    
    createCorner(1, 1);
    createCorner(matrixSize - 6, 1);
    createCorner(1, matrixSize - 6);


    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
        >
            <rect width={size} height={size} fill={backgroundColor} />
            {modules.map((row, y) =>
                row.map((cell, x) =>
                    cell ? (
                        <rect
                            key={`${y}-${x}`}
                            x={x * cellSize}
                            y={y * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill={foregroundColor}
                        />
                    ) : null
                )
            )}
        </svg>
    );
};

export default QRCode;