import React, { useEffect } from 'react';

const Alert = ({ type = 'success', message, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`alert-banner alert-${type}`}>
            <div className="alert-content">
                <i className={type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}></i>
                <span className="alert-message">{message}</span>
            </div>
            <button onClick={onClose} className="alert-close-btn">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
    );
};

export default Alert;
