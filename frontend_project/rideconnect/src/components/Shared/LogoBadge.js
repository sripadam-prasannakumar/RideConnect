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

    const borderStyle = {
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'rgba(13,204,242,0.4)',
        boxShadow: '0 0 20px rgba(13,204,242,0.3)',
    };


    const innerStyle = {
        position: 'relative',
        zIndex: 1,
        width: s.inner,
        height: s.inner,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(13,204,242,0.4) 0%, rgba(0,0,0,0.9) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        overflow: 'hidden',
        border: '1.5px solid rgba(13,204,242,0.6)',
        boxShadow: 'inset 0 0 10px rgba(13,204,242,0.2), 0 0 15px rgba(13,204,242,0.4)',
    };

    return (
        <>

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
                {/* Static glow border */}
                <div style={borderStyle} />


                {/* Inner circle with logo */}
                <div style={innerStyle}>
                    <img
                        src="/rideconnect_logo.png"
                        alt="RideConnect"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            mixBlendMode: 'screen',
                            filter: 'contrast(1.15) brightness(1.1)',
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default LogoBadge;
