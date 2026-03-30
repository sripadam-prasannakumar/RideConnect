import React from 'react';

/**
 * RideConnect Logo Badge
 * Circular container with animated spinning border glow using the theme's primary cyan (#0dccf2).
 * Shows the official RideConnect car logo adapted to the cyan theme.
 *
 * size: 'sm' | 'md' | 'lg' | 'xl'
 */
const LogoBadge = ({ size = 'md', className = '' }) => {
    const sizeMap = {
        sm:  { outer: 42,  inner: 34,  img: 28 },
        md:  { outer: 58,  inner: 48,  img: 40 },
        lg:  { outer: 100, inner: 86,  img: 72 },
        xl:  { outer: 210, inner: 192, img: 170 },
    };
    const s = sizeMap[size] || sizeMap.md;

    const spinnerStyle = {
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'conic-gradient(#0dccf2 0deg, rgba(13,204,242,0.3) 90deg, transparent 160deg, rgba(13,204,242,0.1) 220deg, #0dccf2 360deg)',
        animation: 'dm-logo-spin 2.5s linear infinite',
    };

    const innerStyle = {
        position: 'relative',
        zIndex: 1,
        width: s.inner,
        height: s.inner,
        borderRadius: '50%',
        background: '#101f22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '1.5px solid rgba(13,204,242,0.2)',
    };

    return (
        <>
            <style>{`
                @keyframes dm-logo-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
            <div
                className={`dm-logo-outer ${className}`}
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    flexShrink: 0,
                    width: s.outer,
                    height: s.outer,
                }}
            >
                {/* Spinning conic border */}
                <div style={spinnerStyle} />

                {/* Inner circle with logo */}
                <div style={innerStyle}>
                    <img
                        src="/drivemate_logo.png"
                        alt="RideConnect"
                        style={{
                            width: s.img,
                            height: s.img,
                            objectFit: 'cover',
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default LogoBadge;
