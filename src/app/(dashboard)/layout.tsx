'use client';

import styles from './dashboard.module.css';
import Link from 'next/link';
import ClientWrapper from './ClientWrapper';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

function Sidebar() {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const studentLinks = [
        { name: 'Dashboard', href: '/student', icon: '🏠' },
        { name: 'My Courses', href: '/student/courses', icon: '📚' },
        { name: 'Skill Graph', href: '/student/skills', icon: '🕸️' },
        { name: 'Progress', href: '/student/progress', icon: '📊' },
        { name: 'Certificates', href: '/student/certs', icon: '📜' },
    ];

    const teacherLinks = [
        { name: 'Dashboard', href: '/teacher', icon: '🏠' },
        { name: 'Students', href: '/teacher/students', icon: '👥' },
        { name: 'AI Generator', href: '/teacher/ai', icon: '🤖' },
    ];

    const collegeLinks = [
        { name: 'Dashboard', href: '/college', icon: '🏠' },
        { name: 'Teachers', href: '/college/teachers', icon: '👨‍🏫' },
        { name: 'Students', href: '/college/students', icon: '👨‍🎓' },
        { name: 'Approvals', href: '/college/approvals', icon: '✅' },
    ];

    const adminLinks = [
        { name: 'Dashboard', href: '/admin', icon: '🏠' },
        { name: 'Colleges', href: '/admin/colleges', icon: '🏛️' },
        { name: 'AI Models', href: '/admin/ai', icon: '🧠' },
    ];

    let links = studentLinks;
    if (user?.role === 'teacher') links = teacherLinks;
    if (user?.role === 'college') links = collegeLinks;
    if (user?.role === 'admin') links = adminLinks;

    const dashboardHref = user?.role === 'admin' ? '/admin' :
        user?.role === 'college' ? '/college' :
            user?.role === 'teacher' ? '/teacher' : '/student';

    // SECURITY: Prevents "User Switching" or unauthorized access via direct URL hit
    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/');
            return;
        }

        if (user) {
            const currentPath = pathname;
            const role = user.role;

            // Check if current path matches role
            const isAllowed =
                (role === 'admin' && currentPath.startsWith('/admin')) ||
                (role === 'college' && currentPath.startsWith('/college')) ||
                (role === 'teacher' && currentPath.startsWith('/teacher')) ||
                (role === 'student' && currentPath.startsWith('/student')) ||
                currentPath.startsWith('/learn'); // Allow universal access to learning environment

            if (!isAllowed && !isLoading) {
                console.warn(`[Security] Redirecting ${role} from unauthorized path: ${currentPath}`);
                router.replace(dashboardHref);
            }
        }
    }, [user, pathname, isLoading, router, dashboardHref]);

    if (isLoading) return <div className={styles.sidebar}>Loading...</div>;

    return (
        <aside className={`${styles.sidebar} glass`}>
            <div className={styles.sidebarHeader}>
                <Link href={dashboardHref} className={styles.sidebarLogo}>SOVAP</Link>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user?.name || 'Guest'}</div>
                    <div className={styles.userRole}>{user?.role || 'student'}</div>
                </div>
            </div>

            <nav className={styles.sideNav}>
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
    const pathname = usePathname();

    return (
        <ClientWrapper>
            <div className={styles.dashboardLayout}>
                {!pathname?.startsWith('/learn') && <Sidebar />}
                <main className={pathname?.startsWith('/learn') ? styles.fullContent : styles.content}>
                    <div className="container">
                        {children}
                    </div>
                </main>
            </div>
        </ClientWrapper>
    );
}
