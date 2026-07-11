import React from 'react';

const ProductDetailSkeleton = () => {
    return (
        <div className="product-detail-page">
            <div className="detail-container">
                {/* Left column - Image Gallery Placeholder */}
                <div className="detail-gallery skeleton-shimmer" style={{ minHeight: '550px' }}></div>

                {/* Right column - Info Placeholder */}
                <div className="detail-info" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="skeleton-line category skeleton-shimmer" style={{ width: '25%', height: '12px' }}></div>
                    <div className="skeleton-line title skeleton-shimmer" style={{ width: '75%', height: '36px', marginTop: '5px' }}></div>
                    <div className="skeleton-line rating skeleton-shimmer" style={{ width: '40%', height: '16px', marginTop: '10px' }}></div>
                    <div className="skeleton-line price skeleton-shimmer" style={{ width: '35%', height: '24px', marginTop: '15px' }}></div>
                    
                    <div style={{ borderBottom: '1px solid #eeeeee', margin: '15px 0' }}></div>
                    
                    {/* Description Paragraph lines */}
                    <div className="skeleton-line skeleton-shimmer" style={{ width: '100%', height: '12px' }}></div>
                    <div className="skeleton-line skeleton-shimmer" style={{ width: '95%', height: '12px' }}></div>
                    <div className="skeleton-line skeleton-shimmer" style={{ width: '85%', height: '12px' }}></div>
                    
                    {/* Size Selector placeholder */}
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="skeleton-line skeleton-shimmer" style={{ width: '20%', height: '12px' }}></div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {Array(5).fill(0).map((_, idx) => (
                                <div key={idx} className="skeleton-shimmer" style={{ width: '45px', height: '40px', borderRadius: '4px', background: '#f2f2f2' }}></div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Qty and action buttons placeholder */}
                    <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div className="skeleton-shimmer" style={{ width: '120px', height: '48px', borderRadius: '4px', background: '#f2f2f2' }}></div>
                        <div className="skeleton-shimmer" style={{ flexGrow: 1, height: '48px', borderRadius: '4px', background: '#f2f2f2' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailSkeleton;
