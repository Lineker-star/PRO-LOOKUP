import { useEffect, useState } from 'react'
import logoSymbol from './assets/pro-lookup-symbol.png'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function initials(member) {
  return `${member?.first_name?.[0] || ''}${member?.last_name?.[0] || ''}`.toUpperCase()
}

async function request(path, options = {}) {
  const token = localStorage.getItem('prolookup_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Une erreur est survenue.')
  return response.status === 204 ? null : response.json()
}

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Logo() {
  return <button className="brand" onClick={() => navigate('/')} aria-label="PRO-LOOKUP, retour à l’accueil"><img className="brand-logo" src={logoSymbol} alt="Logo PRO-LOOKUP" /><strong>PRO-LOOKUP</strong></button>
}

function Avatar({ member, size = 'md' }) {
  return <div className={`avatar avatar-${size}`} aria-label={`Portrait de ${member?.first_name || ''} ${member?.last_name || ''}`}>{member?.avatar_path ? <img src={member.avatar_path} alt="" /> : initials(member)}</div>
}

function RankBadge({ rank }) {
  return rank ? <span className={`rank-badge rank-${rank.slug || 'default'}`}><span className="rank-dot" />{rank.name}</span> : null
}

function Header({ user, onLogout }) {
  const [menu, setMenu] = useState(false)
  return <header className="site-header"><div className="header-inner"><Logo /><nav className="main-nav"><button onClick={() => navigate('/')}>Accueil</button><button onClick={() => navigate('/classement')}>Classement</button><button onClick={() => navigate('/publications')}>Publications</button></nav><div className="header-actions"><button className="icon-button search-trigger" onClick={() => navigate('/recherche')} aria-label="Rechercher">⌕</button>{user ? <div className="user-menu"><button className="user-trigger" onClick={() => setMenu(!menu)}><Avatar member={user} size="xs" /><span>{user.first_name}</span><span className="chevron">⌄</span></button>{menu && <div className="popover account-popover"><button onClick={() => navigate(user.status === 'pending' ? '/espace-en-attente' : '/fil')}>Mon espace</button><button onClick={() => navigate('/parametres')}>Paramètres</button>{user.role === 'admin' && <button onClick={() => navigate('/administration')}>Administration</button>}<button className="danger-link" onClick={onLogout}>Se déconnecter</button></div>}</div> : <><button className="text-button" onClick={() => navigate('/connexion')}>Se connecter</button><button className="primary-button small" onClick={() => navigate('/inscription')}>Rejoindre le réseau</button></>}</div></div></header>
}

function Footer() {
  return <footer className="site-footer"><div><Logo /><p>Le réseau professionnel et académique de l’Institut Universitaire ZTF, Bertoua.</p></div><div className="footer-links"><span>Annuaire officiel</span><span>Charte éthique</span><span>Rectorat de Bertoua</span></div><small>© 2026 PRO-LOOKUP · Accès réservé aux membres habilités</small></footer>
}

function Page({ children, user, onLogout = () => { localStorage.removeItem('prolookup_token'); localStorage.removeItem('prolookup_user'); window.location.assign('/') }, bare = false }) {
  return <div className={bare ? 'app-shell bare' : 'app-shell'}>{!bare && <Header user={user} onLogout={onLogout} />}{children}{!bare && <Footer />}</div>
}

function MemberCard({ member }) {
  return <article className="member-card"><div className="card-top"><Avatar member={member} size="lg" /><RankBadge rank={member.rank} /></div><h3>{member.first_name} {member.last_name}</h3><p className="member-department">{member.department || 'Institut Universitaire ZTF'}</p><p className="member-bio">{member.bio}</p><button className="outline-button full" onClick={() => navigate(`/profil/${member.slug}`)}>Consulter le profil <span>→</span></button></article>
}

function PostCard({ post, onLike }) {
  return <article className="post-card"><div className="post-head"><Avatar member={post.author} size="md" /><div><button className="author-link" onClick={() => navigate(`/profil/${post.author.slug}`)}>{post.author.first_name} {post.author.last_name}</button><div className="post-meta"><RankBadge rank={post.author.rank} /><span>·</span><time>{new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</time></div></div><button className="more-button" aria-label="Actions">•••</button></div><p className="post-content">{post.content}</p><div className="post-footer"><button onClick={() => onLike?.(post)}>♡ Recommander <strong>{post.likes_count || 0}</strong></button><button>◌ Commenter <strong>{post.comments_count || 0}</strong></button><button>↗ Partager</button></div></article>
}

function Home({ members, posts }) {
  const [search, setSearch] = useState('')
  return <Page><main><section className="hero-section"><div className="hero-copy"><p className="eyebrow"><span /> RÉSEAU ACADÉMIQUE OFFICIEL · BERTOUA</p><h1>Les idées qui font avancer <em>notre institut.</em></h1><p className="hero-lead">PRO-LOOKUP relie les enseignants, chercheurs, ingénieurs et étudiants de l’Institut Universitaire ZTF dans un espace de confiance.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate('/inscription')}>Créer mon dossier membre <span>↗</span></button><button className="link-button" onClick={() => navigate('/classement')}>Explorer l’annuaire <span>→</span></button></div></div><div className="hero-visual"><div className="institution-seal">ZTF<span>·</span><small>EXCELLENCE<br />RECHERCHE<br />ENGAGEMENT</small></div><div className="hero-stat stat-one"><strong>{members.length}</strong><span>membres visibles</span></div><div className="hero-stat stat-two"><strong>{posts.length}</strong><span>publications chargées</span></div></div></section><section className="search-band"><div><p className="eyebrow">ANNUAIRE INSTITUTIONNEL</p><h2>Trouvez une expertise, un parcours, une idée.</h2></div><form className="search-form" onSubmit={(event) => { event.preventDefault(); navigate(`/recherche?q=${encodeURIComponent(search)}`) }}><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, département, domaine de recherche..." /><button>Rechercher</button></form></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">LES VOIX DE L’IUZTF</p><h2>Membres à découvrir</h2></div><button className="link-button" onClick={() => navigate('/classement')}>Voir tout l’annuaire →</button></div><div className="member-grid">{members.slice(0, 3).map((member) => <MemberCard key={member.id} member={member} />)}</div>{!members.length && <div className="empty-state">Aucun membre public disponible.</div>}</section><section className="section-block publications-section"><div className="section-heading"><div><p className="eyebrow">RECHERCHE & TRANSMISSION</p><h2>Publications récentes</h2></div><button className="link-button" onClick={() => navigate('/publications')}>Toutes les publications →</button></div><div className="posts-grid">{posts.slice(0, 2).map((post) => <PostCard key={post.id} post={post} />)}</div>{!posts.length && <div className="empty-state">Aucune publication publique disponible.</div>}</section><section className="join-band"><div><p className="eyebrow">UNE COMMUNAUTÉ QUI COMPTE</p><h2>Votre parcours mérite<br /><em>un dossier à sa mesure.</em></h2></div><button className="primary-button" onClick={() => navigate('/inscription')}>Rejoindre PRO-LOOKUP <span>↗</span></button></section></main></Page>
}

function Directory({ members }) {
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('q') || '')
  const [rank, setRank] = useState('')
  const filtered = members.filter((member) => `${member.first_name} ${member.last_name} ${member.department}`.toLowerCase().includes(query.toLowerCase()) && (!rank || member.rank?.slug === rank))
  return <Page><main className="directory-page"><div className="page-intro"><p className="eyebrow">ANNUAIRE OFFICIEL ZTF</p><h1>Classement général<br /><em>& répertoire.</em></h1><p>Explorez les profils des membres habilités de l’Institut Universitaire ZTF.</p></div><div className="directory-toolbar"><div className="input-wrap"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom ou une expertise" /></div><select value={rank} onChange={(event) => setRank(event.target.value)}><option value="">Tous les rangs</option><option value="professeur">Professeur</option><option value="docteur">Docteur</option><option value="ingenieur">Ingénieur</option></select></div><div className="rank-tabs"><button className={!rank ? 'active' : ''} onClick={() => setRank('')}>Tous les profils</button>{['professeur', 'docteur', 'ingenieur', 'chercheur', 'etudiant'].map((item) => <button key={item} className={rank === item ? 'active' : ''} onClick={() => setRank(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div><div className="directory-summary"><strong>{filtered.length}</strong> membres visibles <span>·</span> classés par rang académique</div><div className="member-grid directory-grid">{filtered.map((member) => <MemberCard key={member.id} member={member} />)}</div>{!filtered.length && <div className="empty-state">Aucun membre ne correspond à votre recherche.</div>}</main></Page>
}

function Profile({ slug, members }) {
  const [member, setMember] = useState(() => members.find((item) => item.slug === slug) || null)
  useEffect(() => { request(`/profiles/${slug}`).then(setMember).catch(() => {}) }, [slug])
  if (!member) return <Page><div className="loading-state">Chargement du dossier institutionnel…</div></Page>
  return <Page><main className="profile-page"><div className="profile-hero"><div className="breadcrumb">Annuaire Officiel ZTF / {member.department || 'Dossier'} / Profil</div><div className="profile-identity"><Avatar member={member} size="xl" /><div><RankBadge rank={member.rank} /><h1>{member.first_name} {member.last_name}</h1><p>{member.department || 'Institut Universitaire ZTF'} · Bertoua</p></div><button className="outline-light-button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copier le lien <span>↗</span></button></div></div><div className="profile-layout"><section><div className="profile-tabs"><button className="active">Vue d’ensemble</button><button>Travaux & publications</button><button>Parcours académique</button></div><div className="profile-content"><p className="eyebrow">BIOGRAPHIE</p><h2>Un parcours au service de la connaissance.</h2><p className="profile-bio">{member.bio || 'Ce membre n’a pas encore renseigné sa biographie académique.'}</p><div className="expertise-list"><span>Recherche appliquée</span><span>Innovation</span><span>Transmission</span></div></div></section><aside className="profile-aside"><div className="metric-box"><strong>24</strong><span>Publications indexées</span></div><div className="metric-box"><strong>08</strong><span>Projets collaboratifs</span></div><button className="primary-button full">Se connecter <span>→</span></button></aside></div></main></Page>
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); setError(''); try { const data = await request('/login', { method: 'POST', body: JSON.stringify(form) }); localStorage.setItem('prolookup_token', data.token); onLogin(data.user); navigate(data.user.status === 'pending' ? '/espace-en-attente' : '/fil') } catch (err) { setError(err.message) } }
  return <Page bare><div className="auth-layout"><div className="auth-panel"><Logo /><div className="auth-copy"><p className="eyebrow">ESPACE SÉCURISÉ · IUZTF</p><h1>Votre réseau,<br /><em>vos avancées.</em></h1><p>Retrouvez vos pairs, vos publications et les opportunités de collaboration de l’Institut Universitaire ZTF.</p></div><small>PRO-LOOKUP · Bertoua · 2026</small></div><div className="auth-form-wrap"><button className="back-link" onClick={() => navigate('/')}>← Retour à l’accueil</button><form className="auth-form" onSubmit={submit}><p className="eyebrow">CONNEXION MEMBRE</p><h2>Bon retour parmi nous.</h2><p className="form-intro">Accédez à votre espace académique sécurisé.</p>{error && <div className="form-error">{error}</div>}<label>Email institutionnel<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="prenom.nom@iuztf.cm" /></label><label>Mot de passe<a href="/mot-de-passe-oublie">Mot de passe oublié ?</a><input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Votre mot de passe" /></label><button className="primary-button full">Se connecter <span>→</span></button><div className="form-divider"><span>ou</span></div><button type="button" className="outline-button full">Connexion SSO institutionnelle</button><p className="form-footer">Pas encore de dossier ? <button type="button" onClick={() => navigate('/inscription')}>Créer un profil membre</button></p></form></div></div></Page>
}

function Register({ onLogin }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', password_confirmation: '', department: '', bio: '' })
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const update = (key, value) => setForm({ ...form, [key]: value })
  const submit = async (event) => { event.preventDefault(); setError(''); try { const data = await request('/register', { method: 'POST', body: JSON.stringify(form) }); localStorage.setItem('prolookup_token', data.token); onLogin(data.user); navigate('/espace-en-attente') } catch (err) { setError(err.message) } }
  return <Page bare><div className="register-page"><header className="register-header"><Logo /><span>Dossier d’adhésion sécurisé <b>01 — 05</b></span><button className="back-link" onClick={() => navigate('/connexion')}>Déjà membre ? Se connecter</button></header><div className="register-body"><aside className="register-aside"><p className="eyebrow">DOSSIER MEMBRE IUZTF</p><h1>Votre place dans<br /><em>l’écosystème.</em></h1><p>Chaque dossier est examiné par le secrétariat général avant publication dans l’annuaire officiel.</p><div className="step-list"><span className={step >= 1 ? 'current' : ''}><b>01</b>Identité & affiliation</span><span className={step >= 2 ? 'current' : ''}><b>02</b>Votre compte</span><span><b>03</b>Rang académique</span><span><b>04</b>Parcours & production</span><span><b>05</b>Transmission</span></div></aside><form className="register-form" onSubmit={submit}><p className="eyebrow">ÉTAPE {step} SUR 5</p>{error && <div className="form-error">{error}</div>}{step === 1 && <><h2>Commençons par vous identifier.</h2><p className="form-intro">Utilisez vos informations officielles d’affiliation.</p><div className="two-fields"><label>Prénom<input required value={form.first_name} onChange={(event) => update('first_name', event.target.value)} /></label><label>Nom<input required value={form.last_name} onChange={(event) => update('last_name', event.target.value)} /></label></div><label>Email institutionnel<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="prenom.nom@iuztf.cm" /></label><label>Département ou faculté<input value={form.department} onChange={(event) => update('department', event.target.value)} /></label><button type="button" className="primary-button" onClick={() => setStep(2)}>Continuer <span>→</span></button></>}{step === 2 && <><h2>Sécurisez votre espace.</h2><p className="form-intro">Votre mot de passe doit contenir au moins 8 caractères.</p><label>Mot de passe<input required type="password" value={form.password} onChange={(event) => update('password', event.target.value)} /></label><label>Confirmer le mot de passe<input required type="password" value={form.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} /></label><div className="form-actions"><button type="button" className="link-button" onClick={() => setStep(1)}>← Retour</button><button type="button" className="primary-button" onClick={() => setStep(3)}>Continuer <span>→</span></button></div></>}{step === 3 && <><h2>Présentez votre parcours.</h2><p className="form-intro">Ces informations seront visibles après validation de votre dossier.</p><label>Rang académique<select><option>Choisir un rang</option><option>Professeur</option><option>Docteur</option><option>Ingénieur</option><option>Chercheur</option><option>Étudiant</option></select></label><label>Biographie courte<textarea maxLength="1000" value={form.bio} onChange={(event) => update('bio', event.target.value)} placeholder="Votre domaine d’expertise, vos travaux, vos engagements…" /></label><div className="form-actions"><button type="button" className="link-button" onClick={() => setStep(2)}>← Retour</button><button className="primary-button">Transmettre mon dossier <span>↗</span></button></div></>}</form></div></div></Page>
}

function Feed({ user, members, posts, setPosts }) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const publish = async (event) => { event.preventDefault(); if (!content.trim()) return; try { const body = new FormData(); body.append('content', content); body.append('visibility', 'public'); if (image) body.append('image', image); const data = await request('/posts', { method: 'POST', body }); setPosts([{ ...data.post, author: user, created_at: new Date().toISOString(), comments_count: 0, likes_count: 0 }, ...posts]); setContent(''); setImage(null) } catch (err) { setError(err.message) } }
  return <Page user={user}><main className="feed-page"><div className="feed-grid"><aside className="profile-rail"><div className="rail-card"><Avatar member={user} size="xl" /><h3>{user.first_name} {user.last_name}</h3><p>{user.department || 'Membre IUZTF'}</p><RankBadge rank={user.rank} /><div className="rail-metrics"><span><strong>—</strong>publications</span><span><strong>—</strong>connexions</span></div></div><nav className="rail-nav"><button className="active">▦ Fil d’actualité</button><button onClick={() => navigate('/profil-membre')}>◉ Mon profil</button><button onClick={() => navigate('/mon-reseau')}>♧ Mon réseau</button><button onClick={() => navigate('/notifications')}>◌ Notifications</button></nav></aside><section className="feed-main"><div className="feed-title"><div><p className="eyebrow">ESPACE MEMBRE</p><h1>Votre fil académique.</h1></div><button className="outline-button">Filtrer <span>⌄</span></button></div><form className="composer" onSubmit={publish}><Avatar member={user} size="md" /><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Partagez une avancée, une publication ou une réflexion…" /><div className="composer-actions"><label className="file-trigger">＋ Ajouter un fichier<input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} /></label><span className="file-name">{image?.name || ''}</span><button className="primary-button small">Publier <span>↗</span></button></div></form>{error && <div className="form-error">{error}</div>}<div className="feed-list">{posts.map((post) => <PostCard key={post.id} post={post} onLike={() => {}} />)}{!posts.length && <div className="empty-state">Aucune publication disponible.</div>}</div></section><aside className="feed-aside"><div className="side-module"><p className="eyebrow">À DÉCOUVRIR</p><h3>Pairs recommandés</h3>{members.slice(0, 2).map((member) => <div className="mini-member" key={member.id}><Avatar member={member} size="sm" /><div><strong>{member.first_name} {member.last_name}</strong><small>{member.department}</small></div><button aria-label="Ajouter">＋</button></div>)}{!members.length && <p className="empty-side-state">Aucun membre disponible.</p>}</div><div className="side-module calendar"><p className="eyebrow">AGENDA ACADÉMIQUE</p><h3>Agenda indisponible</h3><p>Les événements seront affichés lorsqu’ils seront fournis par l’API.</p></div></aside></div></main></Page>
}

function Pending({ user }) {
  return <Page user={user}><main className="pending-page"><div className="pending-banner"><span>!</span><div><strong>Votre profil est actuellement en cours de vérification.</strong><p>Il sera visible dans l’annuaire après validation par l’administration.</p></div><span className="status-pill">En attente</span></div><div className="pending-layout"><section><p className="eyebrow">ESPACE PERSONNEL · DOSSIER #PL-2026-0842</p><h1>Votre dossier<br /><em>est entre de bonnes mains.</em></h1><p className="pending-lead">Merci pour votre inscription. Le secrétariat général vérifie actuellement votre affiliation à l’Institut Universitaire ZTF.</p><div className="timeline"><div className="done"><b>01</b><div><strong>Inscription soumise</strong><span>Votre dossier a été reçu le 21 septembre 2026.</span></div></div><div className="current"><b>02</b><div><strong>Contrôle d’affiliation</strong><span>Vérification par le secrétariat général en cours.</span></div></div><div><b>03</b><div><strong>Activation & indexation</strong><span>Votre profil sera alors visible publiquement.</span></div></div></div></section><aside className="private-preview"><p className="eyebrow">APERÇU PRIVÉ</p><div className="preview-identity"><Avatar member={user} size="lg" /><div><h3>{user.first_name} {user.last_name}</h3><span>Profil non publié</span></div></div><div className="locked-field">▣ Annuaire public <span>Verrouillé</span></div><div className="locked-field">▣ Publications <span>Disponible après validation</span></div><button className="outline-button full">Modifier mes informations</button></aside></div></main></Page>
}

function Admin({ user }) {
  const [pending, setPending] = useState([])
  useEffect(() => { request('/admin/users/pending').then(setPending).catch(() => setPending([])) }, [])
  const decide = async (member, action) => { await request(`/admin/users/${member.id}/${action}`, { method: 'POST', body: JSON.stringify(action === 'reject' ? { reason: 'Dossier à compléter.' } : {}) }); setPending(pending.filter((item) => item.id !== member.id)) }
  return <Page user={user}><main className="admin-page"><div className="admin-heading"><div><p className="eyebrow">CONSOLE RECTORAT · ZONE C</p><h1>Tableau de bord<br /><em>administrateur.</em></h1></div><button className="primary-button">＋ Créer un membre</button></div><div className="admin-stats"><div><span>Demandes en attente</span><strong>{pending.length}</strong><small>Source : API</small></div><div><span>Membres actifs</span><strong>—</strong><small>Statistique non fournie par l’API</small></div><div><span>Publications à modérer</span><strong>—</strong><small className="warning">Statistique non fournie par l’API</small></div></div><div className="admin-content"><div className="admin-table-wrap"><div className="table-heading"><div><p className="eyebrow">ARBITRAGE DES DOSSIERS</p><h2>Demandes récentes</h2></div><button className="outline-button">Voir toutes →</button></div><div className="admin-table">{pending.map((member) => <div className="admin-row" key={member.id}><Avatar member={member} size="md" /><div className="admin-member"><strong>{member.first_name} {member.last_name}</strong><span>{member.email || member.department || 'Dossier membre'}</span></div><RankBadge rank={member.rank} /><span className="row-date">Dossier en attente</span><div className="row-actions"><button onClick={() => decide(member, 'approve')} aria-label="Approuver">✓</button><button onClick={() => decide(member, 'reject')} aria-label="Rejeter">×</button><button aria-label="Options">•••</button></div></div>)}{!pending.length && <div className="empty-state">Aucune demande en attente.</div>}</div></div><aside className="admin-side"><p className="eyebrow">SANTÉ DU RÉSEAU</p><h3>Données d’activité indisponibles</h3><p className="empty-side-state">Cette statistique sera affichée lorsque l’API d’administration la fournira.</p></aside></div></main></Page>
}

function Network({ user }) {
  const [connections, setConnections] = useState([])
  useEffect(() => { request('/connections').then(setConnections).catch(() => {}) }, [])
  const incoming = connections.filter((item) => item.addressee_id === user.id && item.status === 'pending')
  return <Page user={user}><main className="directory-page"><div className="page-intro"><p className="eyebrow">ESPACE MEMBRE · MON RÉSEAU</p><h1>Les personnes<br /><em>qui font avancer.</em></h1><p>Retrouvez vos connexions institutionnelles et les invitations reçues.</p></div><div className="rank-tabs"><button className="active">Toutes mes connexions</button><button>Invitations reçues {incoming.length ? `(${incoming.length})` : ''}</button><button>Suggestions</button></div><div className="member-grid directory-grid">{connections.filter((item) => item.status === 'accepted').map((item) => { const member = item.requester_id === user.id ? item.addressee : item.requester; return <MemberCard key={item.id} member={member} /> })}</div>{!connections.length && <div className="empty-state">Votre réseau institutionnel apparaîtra ici après vos premières invitations.</div>}</main></Page>
}

function Notifications({ user }) {
  const [data, setData] = useState({ notifications: { data: [] }, unread_count: 0 })
  useEffect(() => { request('/notifications').then(setData).catch(() => {}) }, [])
  const notifications = data.notifications?.data || []
  const markAll = async () => { await request('/notifications/read-all', { method: 'POST' }); setData({ ...data, unread_count: 0, notifications: { ...data.notifications, data: notifications.map((item) => ({ ...item, read_at: new Date().toISOString() })) } }) }
  return <Page user={user}><main className="directory-page notifications-page"><div className="section-heading"><div><p className="eyebrow">ESPACE MEMBRE · CENTRE D’ACTIVITÉ</p><h1>Vos notifications.</h1><p className="page-subtitle">{data.unread_count} notification{data.unread_count > 1 ? 's' : ''} non lue{data.unread_count > 1 ? 's' : ''}</p></div><button className="outline-button" onClick={markAll}>Tout marquer comme lu</button></div><div className="notification-list">{notifications.map((notification) => <div className={`notification-item ${notification.read_at ? '' : 'unread'}`} key={notification.id}><span className="notification-icon">✦</span><div><strong>{notification.type === 'connection_request' ? 'Nouvelle demande de connexion' : 'Votre réseau a évolué'}</strong><p>{notification.data?.from || 'Une nouvelle activité concerne votre dossier.'}</p><small>{new Date(notification.created_at).toLocaleDateString('fr-FR')}</small></div></div>)}{!notifications.length && <div className="empty-state">Vous êtes à jour. Aucune nouvelle notification.</div>}</div></main></Page>
}

function Settings({ user }) {
  const [form, setForm] = useState({ first_name: user.first_name || '', last_name: user.last_name || '', department: user.department || '', bio: user.bio || '' })
  const [saved, setSaved] = useState(false)
  const save = async (event) => { event.preventDefault(); await request('/profile/me', { method: 'PUT', body: JSON.stringify(form) }); setSaved(true); setTimeout(() => setSaved(false), 2400) }
  return <Page user={user}><main className="settings-page directory-page"><div className="page-intro"><p className="eyebrow">ESPACE PERSONNEL · PARAMÈTRES</p><h1>Votre dossier,<br /><em>à votre image.</em></h1><p>Gérez vos informations publiques et vos préférences de compte.</p></div><div className="settings-layout"><nav className="settings-nav"><button className="active">Profil public</button><button>Compte & sécurité</button><button>Confidentialité</button><button>Notifications</button></nav><form className="settings-form" onSubmit={save}><div className="settings-heading"><div><p className="eyebrow">INFORMATIONS PUBLIQUES</p><h2>Identité académique</h2></div>{saved && <span className="saved-label">✓ Modifications enregistrées</span>}</div><div className="two-fields"><label>Prénom<input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} /></label><label>Nom<input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} /></label></div><label>Département<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label><label>Biographie<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label><button className="primary-button">Enregistrer les modifications <span>→</span></button></form></div></main></Page>
}

function Publications({ posts }) {
  return <Page><main className="directory-page"><div className="page-intro"><p className="eyebrow">RECHERCHE & TRANSMISSION</p><h1>Publications<br /><em>de la communauté.</em></h1><p>Découvrez les travaux, réflexions et avancées partagés par les membres habilités.</p></div><div className="posts-grid">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div></main></Page>
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('prolookup_user') || 'null'))
  const [members, setMembers] = useState([])
  const [posts, setPosts] = useState([])
  useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); request('/profiles?per_page=24').then((data) => setMembers(data.data || [])).catch(() => setMembers([])); request('/posts').then((data) => setPosts(data.posts || [])).catch(() => setPosts([])); return () => window.removeEventListener('popstate', onPopState) }, [])
  const login = (nextUser) => { setUser(nextUser); localStorage.setItem('prolookup_user', JSON.stringify(nextUser)) }
  if (path === '/connexion') return <Login onLogin={login} />
  if (path === '/inscription') return <Register onLogin={login} />
  if (path === '/classement' || path === '/recherche') return <Directory members={members} />
  if (path === '/publications') return <Publications posts={posts} />
  if (path === '/fil' && user) return <Feed user={user} members={members} posts={posts} setPosts={setPosts} />
  if (path === '/espace-en-attente' && user) return <Pending user={user} />
  if (path === '/mon-reseau' && user) return <Network user={user} />
  if (path === '/notifications' && user) return <Notifications user={user} />
  if (path === '/parametres' && user) return <Settings user={user} />
  if (path === '/administration' && user?.role === 'admin') return <Admin user={user} />
  if (path.startsWith('/profil/')) return <Profile slug={path.split('/')[2]} members={members} />
  return <Home members={members} posts={posts} />
}

export default App
