'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // Automatic redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const path = user.role === 'admin' ? '/admin' :
        user.role === 'college' ? '/college' :
          user.role === 'teacher' ? '/teacher' : '/student';
      router.push(path);
    }
  }, [user, isLoading, router]);

  // Scroll listener for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <main className={styles.landing}>
      {/* Navbar */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.navContainer}`}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🧠</span>
            <span className="gradient-text">SOVAP</span>
          </div>
          <nav className={styles.nav}>
            {user ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href={user.role === 'admin' ? '/admin' : user.role === 'college' ? '/college' : user.role === 'teacher' ? '/teacher' : '/student'} className="btn-primary">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn-secondary" style={{ cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">Login</Link>
                <Link href="/signup" className="btn-primary">Get Started Free</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.gradientOrb1}></div>
          <div className={styles.gradientOrb2}></div>
          <div className={styles.gradientOrb3}></div>
        </div>

        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            ✨ AI-Powered Adaptive Learning Platform
          </div>
          <h1 className={styles.heroTitle}>
            Learning That
            <br />
            <span className="gradient-text">Adapts To You</span>
          </h1>
          <p className={styles.heroSubtitle}>
            SOVAP uses cutting-edge AI to personalize your education journey.
            <br />
            No two students learn the same way. Why should courses be identical?
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className="btn-primary btn-large">
              Start Learning Free
              <span className={styles.arrow}>→</span>
            </Link>
            <button className="btn-secondary btn-large">
              Watch Demo
              <span className={styles.playIcon}>▶</span>
            </button>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>Active Learners</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>500+</div>
              <div className={styles.statLabel}>Courses</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>95%</div>
              <div className={styles.statLabel}>Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why SOVAP?</h2>
            <p className={styles.sectionSubtitle}>
              The future of education is personalized, adaptive, and intelligent.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <div className={`${styles.featureCard} glass`}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Adaptive Learning Path</h3>
              <p>AI analyzes your performance in real-time and adjusts difficulty, pacing, and content to keep you in the optimal learning zone.</p>
            </div>

            <div className={`${styles.featureCard} glass`}>
              <div className={styles.featureIcon}>🤖</div>
              <h3>24/7 AI Tutor</h3>
              <p>Get instant help on any concept. Our AI understands context and explains complex topics in ways that click for you.</p>
            </div>

            <div className={`${styles.featureCard} glass`}>
              <div className={styles.featureIcon}>🔬</div>
              <h3>Hands-On Labs</h3>
              <p>Practice in safe, simulated environments. Make mistakes without consequences and build real-world skills.</p>
            </div>

            <div className={`${styles.featureCard} glass`}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Smart Analytics</h3>
              <p>Track your progress with detailed insights. Know exactly where you excel and what needs more practice.</p>
            </div>

            <div className={`${styles.featureCard} glass`}>
              <div className={styles.featureIcon}>🎓</div>
              <h3>Verified Certificates</h3>
              <p>Earn industry-recognized certificates. Each comes with a unique verification code for employers.</p>
            </div>

            <div className={`${styles.featureCard} glass`}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Fast & Efficient</h3>
              <p>Learn 3x faster with our adaptive approach. Skip what you know, focus on gaps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps to mastery</p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <h3>Diagnostic Assessment</h3>
              <p>We analyze your current knowledge level with an adaptive pre-test.</p>
            </div>

            <div className={styles.stepConnector}></div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <h3>Personalized Learning</h3>
              <p>AI creates a custom path. Content adapts based on your performance.</p>
            </div>

            <div className={styles.stepConnector}></div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <h3>Verify & Certify</h3>
              <p>Prove mastery through adaptive quizzes and earn your certificate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={`container ${styles.ctaContent}`}>
          <h2>Ready to Transform Your Learning?</h2>
          <p>Join thousands of students who are already learning smarter, not harder.</p>
          <Link href="/signup" className="btn-primary btn-large">
            Get Started Now - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <span className={styles.logoIcon}>🧠</span>
                <span className="gradient-text">SOVAP</span>
              </div>
              <p>Redefining education with AI.</p>
            </div>

            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4>Product</h4>
                <Link href="/courses">Courses</Link>
                <Link href="/signup">Pricing</Link>
                <Link href="/signup">For Colleges</Link>
              </div>

              <div className={styles.footerColumn}>
                <h4>Company</h4>
                <Link href="/signup">About</Link>
                <Link href="/signup">Careers</Link>
                <Link href="/signup">Contact</Link>
              </div>

              <div className={styles.footerColumn}>
                <h4>Legal</h4>
                <Link href="/signup">Privacy</Link>
                <Link href="/signup">Terms</Link>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>&copy; 2026 SOVAP Inc. All rights reserved.</p>
            <div className={styles.socialLinks}>
              <a href="#" aria-label="Twitter">𝕏</a>
              <a href="#" aria-label="LinkedIn">in</a>
              <a href="#" aria-label="GitHub">⚡</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
