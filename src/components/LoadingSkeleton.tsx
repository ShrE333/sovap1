import React from 'react';
import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
    type?: 'card' | 'text' | 'circle' | 'list';
    count?: number;
}

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    if (type === 'card') {
        return (
            <>
                {skeletons.map(i => (
                    <div key={i} className={`${styles.skeleton} ${styles.card}`}>
                        <div className={`${styles.skeletonLine} ${styles.title}`}></div>
                        <div className={`${styles.skeletonLine} ${styles.subtitle}`}></div>
                        <div className={styles.skeletonLines}>
                            <div className={styles.skeletonLine}></div>
                            <div className={styles.skeletonLine}></div>
                        </div>
                    </div>
                ))}
            </>
        );
    }

    if (type === 'circle') {
        return (
            <>
                {skeletons.map(i => (
                    <div key={i} className={`${styles.skeleton} ${styles.circle}`}></div>
                ))}
            </>
        );
    }

    if (type === 'list') {
        return (
            <div className={styles.listSkeleton}>
                {skeletons.map(i => (
                    <div key={i} className={styles.listItem}>
                        <div className={`${styles.skeleton} ${styles.circle}`} style={{ width: '40px', height: '40px' }}></div>
                        <div style={{ flex: 1 }}>
                            <div className={`${styles.skeletonLine} ${styles.title}`}></div>
                            <div className={`${styles.skeletonLine} ${styles.subtitle}`}></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {skeletons.map(i => (
                <div key={i} className={`${styles.skeletonLine} ${styles.text}`}></div>
            ))}
        </>
    );
}
