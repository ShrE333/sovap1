export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{ padding: '2rem' }}>
            <h1 className="gradient-text">{title}</h1>
            <div className="glass-card" style={{ marginTop: '2rem', padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
                <h2>Cognitive Analysis in Progress</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                    Our AI engine is currently mapping the neural connections for this feature.
                    Check back shortly.
                </p>
            </div>
        </div>
    );
}
