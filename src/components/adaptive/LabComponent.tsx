'use client';

import { useState } from 'react';
import styles from './lab.module.css';

export default function LabComponent({ labId, onComplete }: { labId: string, onComplete?: () => void }) {
    const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle');

    const startLab = () => {
        setStatus('starting');
        setTimeout(() => setStatus('running'), 2000);
    };

    const handleComplete = () => {
        setStatus('completed');
        if (onComplete) onComplete();
    };

    return (
        <div className={`${styles.labContainer} glass`}>
            <div className={styles.labHeader}>
                <h3>Lab: Hands-on {labId}</h3>
                <span className={styles.badge}>{status}</span>
            </div>

            {status === 'idle' && (
                <div className={styles.idleView}>
                    <p>This lab will spin up an isolated environment for you to practice.</p>
                    <button className="btn-primary" onClick={startLab}>Launch Docker Instance</button>
                </div>
            )}

            {status === 'starting' && (
                <div className={styles.loadingView}>
                    <div className={styles.spinner}></div>
                    <p>Provisioning container...</p>
                </div>
            )}

            {status === 'running' && (
                <div className={styles.runningView}>
                    <div className={styles.terminal}>
                        <code>$ curl -v http://vulnerable-site.local/api/user/101</code>
                        <code>HTTP/1.1 200 OK</code>
                        <code>{"{ 'id': 101, 'name': 'Admin', 'balance': 50000 }"}</code>
                        <code className={styles.input}>$ _</code>
                    </div>
                    <div className={styles.instructions}>
                        <h4>Objective</h4>
                        <p>Try to access user 102 without authorization.</p>
                        <button className="btn-secondary" onClick={handleComplete}>Submit Solution</button>
                    </div>
                </div>
            )}

            {status === 'completed' && (
                <div className={styles.successView}>
                    <div className={styles.icon}>✅</div>
                    <h4>Lab Passed!</h4>
                    <p>You've successfully demonstrated understanding of IDOR.</p>
                </div>
            )}
        </div>
    );
}
