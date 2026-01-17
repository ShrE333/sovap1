'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  return (
    <main className={styles.landing}>
      <header className={`${styles.header} glass`}>
        <div className={`container ${styles.navContainer}`}>
          <div className={`${styles.logo} gradient-text`}>SOVAP.in</div>
          <nav className={styles.nav}>
            {user ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href={user.role === 'admin' ? '/admin' : user.role === 'college' ? '/college' : user.role === 'teacher' ? '/teacher' : '/student/courses'} className="btn-primary">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn-secondary" style={{ cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">Login</Link>
                <Link href="/signup" className="btn-primary">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <h1 className="animate-fade-in">
            Master Skills with <span className="gradient-text">Cognitive Intelligence</span>
          </h1>
          <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            SOVAP adapts to your unique learning style. No fixed paths, just personalized mastery
            driven by AI.
          </p>
          <div className={`${styles.heroActions} animate-fade-in`} style={{ animationDelay: '0.4s' }}>
            <Link href="/courses" className={`btn-primary ${styles.large}`}>Start Exploring</Link>
            <Link href="/signup" className={`btn-secondary ${styles.large}`}>How it Works</Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <div className={styles.grid}>
            <div className={`${styles.card} glass-card animate-fade-in`} style={{ animationDelay: '0.6s' }}>
              <h3>Adaptive Engine</h3>
              <p>Content that evolves with your performance. Stay in the flow zone.</p>
            </div>
            <div className={`${styles.card} glass-card animate-fade-in`} style={{ animationDelay: '0.8s' }}>
              <h3>AI Tutor</h3>
              <p>24/7 assistance on complex topics. It understands where you are stuck.</p>
            </div>
            <div className={`${styles.card} glass-card animate-fade-in`} style={{ animationDelay: '1s' }}>
              <h3>Mock Environment</h3>
              <p>Simulate real-world scenarios. Practice safely before deploying.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <p>&copy; 2026 SOVAP Inc. Redefining Education.</p>
        </div>
      </footer>
    </main>
  );
}
