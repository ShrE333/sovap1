'use client';

import styles from './dashboard.module.css';
import Link from 'next/link';
import ClientWrapper from './ClientWrapper';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname } from 'next/navigation';

function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const studentLinks = [
        { name: 'My Courses', href: '/student/courses', icon: '📚' },
        { name: 'Skill Graph', href: '/student/skills', icon: '🕸️' },
        { name: 'Progress', href: '/student/progress', icon: '📊' },
        { name: 'Certificates', href: '/student/certs', icon: '📜' },
    ];

    const teacherLinks = [
        { name: 'Workbench', href: '/teacher', icon: '🛠️' },
        { name: 'Students', href: '/teacher/students', icon: '👥' },
        { name: 'AI Generator', href: '/teacher/ai', icon: '🤖' },
    ];

    const collegeLinks = [
        { name: 'Dashboard', href: '/college', icon: '🏛️' },
        { name: 'Teachers', href: '/college/teachers', icon: '👨‍🏫' },
        { name: 'Students', href: '/college/students', icon: '👨‍🎓' },
        { name: 'Approvals', href: '/college/approvals', icon: '✅' },
    ];

    const adminLinks = [
        { name: 'Control Panel', href: '/admin', icon: '⚙️' },
        { name: 'Colleges', href: '/admin/colleges', icon: '🏛️' },
        { name: 'AI Models', href: '/admin/ai', icon: '🧠' },
    ];

    let links = studentLinks;
    if (user?.role === 'teacher') links = teacherLinks;
    if (user?.role === 'college') links = collegeLinks;
    if (user?.role === 'admin') links = adminLinks;

    return (
        <aside className={`${styles.sidebar} glass`}>
            <div className={styles.sidebarHeader}>
                <div className={styles.sidebarLogo}>SOVAP</div>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user?.name || 'Guest'}</div>
                    <div className={styles.userRole}>{user?.role || 'student'}</div>
                </div>
            </div>

            <nav className={styles.sideNav}>
                <Link href="/" className={styles.navItem}>🏠 Home</Link>
                {links.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`${styles.navItem} ${pathname === link.href ? styles.active : ''}`}
                    >
                        {link.icon} {link.name}
                    </Link>
                ))}
            </nav>

            <div className={styles.sidebarFooter}>
                <button onClick={logout} className={styles.logoutBtn}>
                    🚪 Sign Out
                </button>
            </div>
        </aside>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClientWrapper>
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <main className={styles.content}>
                    <div className="container">
                        {children}
                    </div>
                </main>
            </div>
        </ClientWrapper>
    );
}
