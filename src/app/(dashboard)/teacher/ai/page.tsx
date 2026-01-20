'use client';

import { useState } from 'react';
import styles from '../teacher.module.css'; // Reusing teacher styles
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';

export default function AICourseGenerator() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await apiCall('/api/ai/generate-course', {
                method: 'POST',
                body: JSON.stringify({ topic, content })
            });
            const data = await res.json();
            setResult(data);
            showToast('Generation complete!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Generation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.teacherContainer}>
            <header className={styles.header}>
                <h1 className="gradient-text">AI Curriculum Engine (SOVAP-Core)</h1>
                <p>Convert raw content into adaptive, intelligent learning models.</p>
            </header>

            <div className={styles.grid}>
                {/* Input Section */}
                <section className={`${styles.card} glass-card`}>
                    <h3>📥 Input Context</h3>
                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Course Topic / Domain</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="e.g. Advanced React Patterns"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Raw Content / Context (Optional)</label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Paste syllabus, textbook content, or prompt instructions here..."
                                rows={6}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? '⚡ Processing with SOVAP-Core...' : 'Generate Intelligent Model'}
                        </button>
                    </form>
                </section>

                {/* Output Section */}
                {result && (
                    <section className={`${styles.card} glass-card`} style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ marginBottom: '1rem' }}>🧠 Generated Intelligence Model</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                                <h4>Atomic Concepts ({result.concepts.length})</h4>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                                    {result.concepts.map((c: any) => (
                                        <li key={c.concept_id} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                            <strong>{c.concept_name}</strong>
                                            <span className="badge" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>{c.difficulty_level}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                                <h4>Labs & Assessments ({result.labs.length})</h4>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                                    {result.labs.map((l: any) => (
                                        <li key={l.lab_id} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                            <strong>{l.lab_id}</strong>: Tests {l.concepts_tested.join(', ')}
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Env: {l.environment_type}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                                <h4>Raw JSON Output (SOVAP Schema)</h4>
                                <pre style={{ overflow: 'auto', maxHeight: '300px', fontSize: '0.85rem' }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => showToast('Saved to draft!', 'success')}>💾 Save Verification Draft</button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
