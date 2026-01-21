'use client';

import React, { useState, useEffect } from 'react';
import { useLearningState } from '@/lib/contexts/LearningStateContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './skills.module.css';

interface Node {
    id: string;
    label: string;
    type: 'module' | 'topic';
    status: 'mastered' | 'learning' | 'locked';
    x: number;
    y: number;
}

interface Link {
    source: string;
    target: string;
}

export default function SkillMasteryGraph() {
    const { state, currentCourse, initializeCourse } = useLearningState();
    const { user } = useAuth();
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // 1. Load data
    useEffect(() => {
        // If no course selected, try to find one from enrollments (simplified for demo)
        if (!currentCourse && user) {
            // This is a placeholder logic: in a real app, we'd have a course selector
            // For now, let's assume we show the last active course
        }
    }, [currentCourse, user]);

    // 2. Generate Graph Layout (Simple circular/tree layout for now)
    useEffect(() => {
        if (!currentCourse) return;

        const newNodes: Node[] = [];
        const newLinks: Link[] = [];

        // Root node (Course)
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        const modules = currentCourse.modules;
        const moduleRadius = 200;

        if (!state) return;

        modules.forEach((mod, mIdx) => {
            const angle = (mIdx / modules.length) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * moduleRadius;
            const y = centerY + Math.sin(angle) * moduleRadius;

            const isMastered = mod.topics?.every(t => state.topicMastery[t.id]) || state.topicMastery[mod.id];

            newNodes.push({
                id: mod.id,
                label: mod.title,
                type: 'module',
                status: isMastered ? 'mastered' : 'learning',
                x, y
            });

            // Connect topics to module
            const topics = mod.topics || [];
            const topicRadius = 60;

            topics.forEach((topic, tIdx) => {
                const tAngle = angle + ((tIdx - (topics.length - 1) / 2) * 0.4);
                const tx = x + Math.cos(tAngle) * topicRadius;
                const ty = y + Math.sin(tAngle) * topicRadius;

                const topicStatus = state.topicMastery[topic.id] ? 'mastered' : 'locked';

                newNodes.push({
                    id: topic.id,
                    label: topic.title,
                    type: 'topic',
                    status: topicStatus,
                    x: tx, y: ty
                });

                newLinks.push({ source: mod.id, target: topic.id });
            });
        });

        setNodes(newNodes);
        setLinks(newLinks);
    }, [currentCourse, state, dimensions]);

    if (!currentCourse) {
        return (
            <div className={styles.container}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h2>Select a course to view your Mastery Graph</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Your knowledge map will visualize concepts you've conquered.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="outfit gradient-text">Knowledge Mastery Map</h1>
                <p className={styles.subtext}>Visualizing your neural path through {currentCourse.title}.</p>
            </header>

            <div className={`${styles.graphWrapper} glass`}>
                <svg width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                    {/* Connections */}
                    {links.map((link, i) => {
                        const source = nodes.find(n => n.id === link.source);
                        const target = nodes.find(n => n.id === link.target);
                        if (!source || !target) return null;

                        return (
                            <line
                                key={i}
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                className={styles.link}
                                stroke={target.status === 'mastered' ? 'var(--brand-teal)' : 'var(--glass-border)'}
                                strokeWidth={target.status === 'mastered' ? 2 : 1}
                                strokeDasharray={target.status === 'locked' ? "5,5" : "0"}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map(node => (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className={styles.nodeGroup}>
                            <circle
                                r={node.type === 'module' ? 12 : 6}
                                className={`${styles.node} ${styles[node.status]}`}
                            />
                            {node.type === 'module' && (
                                <text
                                    y={-20}
                                    textAnchor="middle"
                                    className={styles.nodeLabel}
                                >
                                    {node.label}
                                </text>
                            )}
                            <title>{node.label} - {node.status.toUpperCase()}</title>
                        </g>
                    ))}
                </svg>

                {/* Legend */}
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.mastered}`}></div>
                        <span>Mastered</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.learning}`}></div>
                        <span>In Progress</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.locked}`}></div>
                        <span>Locked</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
