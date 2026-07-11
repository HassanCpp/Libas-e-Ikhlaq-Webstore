import React from 'react';

const SkeletonLoader = ({ count = 8 }) => {
    const skeletonCards = Array(count).fill(0);
    
    return (
        <div className="product-grid">
            {skeletonCards.map((_, idx) => (
                <div key={idx} className="skeleton-card">
                    <div className="skeleton-image skeleton-shimmer"></div>
                    <div className="skeleton-info">
                        <div className="skeleton-line category skeleton-shimmer"></div>
                        <div className="skeleton-line title skeleton-shimmer"></div>
                        <div className="skeleton-line rating skeleton-shimmer"></div>
                        <div className="skeleton-line price skeleton-shimmer"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
