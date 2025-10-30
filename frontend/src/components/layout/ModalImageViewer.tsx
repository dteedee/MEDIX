import React from "react";
import styles from "../../styles/public/ModalImageViewer.module.css"; // optional CSS module

interface ModalImageViewerProps {
    src: string;
    alt?: string;
    onClose: () => void;
}

const ModalImageViewer: React.FC<ModalImageViewerProps> = ({ src, alt = "", onClose }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    &times;
                </button>
                <img src={src} alt={alt} className={styles.image} />
            </div>
        </div>
    );
};

export default ModalImageViewer;
