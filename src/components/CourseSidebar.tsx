import React from 'react';
import { Course, Topic, Module } from '@/lib/types';
import styles from './CourseSidebar.module.css';

interface CourseSidebarProps {
    course: Course;
    currentTopicId: string;
    completedTopicIds: string[];
    onTopicSelect: (topicId: string) => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
    course,
    currentTopicId,
    completedTopicIds,
    onTopicSelect
}) => {
    // If course or modules are missing, show simplified view or nothing
    if (!course?.modules) return null;

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <h3>Course Structure</h3>
                <p className={styles.courseTitle}>{course.title}</p>
            </div>

            <div className={styles.modulesList}>
                {course.modules.map((module, mIndex) => {
                    // Logic to handle AI courses where modules ARE topics
                    // If module has no topics array, we treat the module logic differently or assume it's a container
                    // Based on previous fixes, we treat modules as topics if topics array is missing.

                    const hasTopics = module.topics && module.topics.length > 0;

                    return (
                        <div key={module.id} className={styles.moduleItem}>
                            <div className={styles.moduleHeader}>
                                <span className={styles.moduleNumber}>0{mIndex + 1}</span>
                                <span className={styles.moduleTitle}>{module.title}</span>
                            </div>

                            {hasTopics ? (
                                <div className={styles.topicsList}>
                                    {module.topics.map((topic, tIndex) => {
                                        const isCompleted = completedTopicIds.includes(topic.id);
                                        const isCurrent = topic.id === currentTopicId;
                                        const isLocked = !isCompleted && !isCurrent && tIndex > 0 && !completedTopicIds.includes(module.topics[tIndex - 1].id);
                                        // Simple locking logic: strictly sequential for now, or based on props

                                        return (
                                            <div
                                                key={topic.id}
                                                className={`
                                                    ${styles.topicItem} 
                                                    ${isCurrent ? styles.active : ''} 
                                                    ${isCompleted ? styles.completed : ''}
                                                `}
                                                onClick={() => !isLocked && onTopicSelect(topic.id)} // Prevent click if locked (optional)
                                            >
                                                <div className={styles.statusIcon}>
                                                    {isCompleted ? '✓' : (isCurrent ? '●' : '○')}
                                                </div>
                                                <span className={styles.topicTitle}>{topic.title}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* For AI Generated courses where Module = Topic */
                                <div className={styles.topicsList}>
                                    <div
                                        className={`
                                            ${styles.topicItem} 
                                            ${module.id === currentTopicId ? styles.active : ''} 
                                            ${completedTopicIds.includes(module.id) ? styles.completed : ''}
                                        `}
                                        onClick={() => onTopicSelect(module.id)}
                                    >
                                        <div className={styles.statusIcon}>
                                            {completedTopicIds.includes(module.id) ? '✓' : (module.id === currentTopicId ? '●' : '○')}
                                        </div>
                                        <span className={styles.topicTitle}>Unit Content</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
