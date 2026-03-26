/**
 * Seed script for Nikolas Petrou SonicJs CMS
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run this script:      npm run seed
 */

const API_URL = process.env.SONICJS_URL || 'http://localhost:8787';

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hello@infront.cy', username: 'admin', firstName: 'Admin', lastName: 'User', password: 'np-admin-2026!' }),
  }).catch(() => {});

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hello@infront.cy', password: 'np-admin-2026!' }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
  return ((await res.json()) as { token: string }).token;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCollectionId(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/collections`, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json()) as { data: Array<{ id: string; name: string }> };
  const col = data.data.find(c => c.name === name);
  if (!col) throw new Error(`Collection not found: ${name}`);
  return col.id;
}

async function create(token: string, colId: string, title: string, slug: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, slug, collectionId: colId, status: 'published', data }),
  });
  if (!res.ok) {
    const err = await res.text();
    if (!err.includes('already exists')) console.error(`  Failed: "${title}" — ${err}`);
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seedSiteSettings(token: string, colId: string) {
  console.log('  site_settings');
  await create(token, colId, 'Nikolas Petrou', 'site-settings', {
    tagline: 'Videographer & Content Creator',
    email: 'hello@nikolaspetrou.com',
    seo_title: 'Nikolas Petrou — Videographer & Content Creator',
    seo_description: 'High-quality video content that engages, inspires, and tells stories worth sharing. Based in Cyprus.',
    instagram_url: 'https://instagram.com/nikolaspetrouu',
    facebook_url: 'https://facebook.com/nikolaspetrou',
    notification_emails: JSON.stringify(['hello@nikolaspetrou.com']),
    nav_items: JSON.stringify([
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Works', href: '/works' },
      { label: 'Contact', href: '/contact' },
    ]),
    nav_cta_label: "Let's talk",
    nav_cta_href: '/contact',
    footer_text: '© 2025 Nikolas Petrou. All rights reserved.',
  });
}

async function seedHero(token: string, colId: string) {
  console.log('  hero');
  await create(token, colId, 'Homepage Hero', 'homepage-hero', {
    eyebrow: 'Videographer · Content Creator',
    heading: 'Stay true to yourself.',
    subheading: 'High-quality video content that engages, inspires, and tells stories worth sharing.',
    cta_text: 'Get in touch',
    cta_href: '/contact',
    secondary_cta_text: 'Watch showreel',
    secondary_cta_href: '/works',
    background_video: '',
    background_poster: '/images/hero-bg.jpg',
  });
}

async function seedAbout(token: string, colId: string) {
  console.log('  about');
  await create(token, colId, 'About Page', 'about-page', {
    heading: 'About Nikolas',
    subheading: 'Videographer and content creator telling stories through film.',
    description: '<p>I create visual content that captures moments and tells stories that move people. Every project is an opportunity to push creative boundaries and deliver real results.</p>',
    hero_image: '/images/about-hero.jpg',
    cta_text: 'Get in touch',
    values_heading: 'What drives me',
    values_description: '<p>Creativity, authenticity, and excellence in every frame.</p>',
  });
}

async function seedProjects(token: string, colId: string) {
  console.log('  projects');
  const projects = [
    { title: 'Golden Hour', slug: 'golden-hour', subtitle: 'A cinematic journey through light and shadow', image: '/images/project-1.jpg', video_url: '', sort_order: 1, featured_in_hero: true, hero_sort_order: 1, description: '<p>A cinematic exploration of light captured during the golden hour. This project showcases the beauty of natural lighting in videography.</p>', client: 'Personal Project', year: '2025', category: 'Cinematic' },
    { title: 'Urban Stories', slug: 'urban-stories', subtitle: 'Street culture and city life', image: '/images/project-2.jpg', video_url: '', sort_order: 2, featured_in_hero: true, hero_sort_order: 2, description: '<p>Capturing the energy and culture of urban life through dynamic video content.</p>', client: 'Urban Magazine', year: '2025', category: 'Documentary' },
    { title: 'Brand Film', slug: 'brand-film', subtitle: 'Visual identity through motion', image: '/images/project-3.jpg', video_url: '', sort_order: 3, featured_in_hero: true, hero_sort_order: 3, description: '<p>A brand film that brings company values to life through powerful visual storytelling.</p>', client: 'Tech Startup', year: '2024', category: 'Commercial' },
    { title: 'Music Video', slug: 'music-video', subtitle: 'Rhythm meets visual art', image: '/images/project-4.jpg', video_url: '', sort_order: 4, featured_in_hero: true, hero_sort_order: 4, description: '<p>A music video combining creative direction with cinematic techniques.</p>', client: 'Independent Artist', year: '2024', category: 'Music Video' },
  ];
  for (const p of projects) {
    const { title, slug, ...data } = p;
    await create(token, colId, title, slug, data);
  }
}

async function seedServices(token: string, colId: string) {
  console.log('  services');
  const services = [
    { title: 'Video Production', slug: 'video-production', description: '<p>End-to-end video production from concept to final cut. Corporate films, brand videos, and promotional content.</p>', tags: JSON.stringify(['Concept Development', 'Filming', 'Post-Production', 'Color Grading']), icon: '🎬', video_url: '', sort_order: 1 },
    { title: 'Content Creation', slug: 'content-creation', description: '<p>Social media content that stops the scroll. Reels, stories, and platform-native video optimised for engagement.</p>', tags: JSON.stringify(['Social Media', 'Reels', 'Stories', 'Platform Strategy']), icon: '📱', video_url: '', sort_order: 2 },
    { title: 'Event Coverage', slug: 'event-coverage', description: '<p>Professional event videography capturing the atmosphere, key moments, and emotions of your event.</p>', tags: JSON.stringify(['Live Events', 'Conferences', 'Weddings', 'Highlights']), icon: '🎤', video_url: '', sort_order: 3 },
  ];
  for (const s of services) {
    const { title, slug, ...data } = s;
    await create(token, colId, title, slug, data);
  }
}

async function seedTestimonials(token: string, colId: string) {
  console.log('  testimonials');
  const testimonials = [
    { title: 'Maria K.', slug: 'maria-k', name: 'Maria K.', role: 'Marketing Director', quote: 'Nikolas captured our brand perfectly. The video exceeded all expectations and drove incredible engagement on our social channels.', video_url: '', image: '/images/testimonial-1.jpg', sort_order: 1 },
    { title: 'Andreas P.', slug: 'andreas-p', name: 'Andreas P.', role: 'Event Organiser', quote: 'Professional, creative, and easy to work with. The event highlight reel was exactly what we needed.', video_url: '', image: '/images/testimonial-2.jpg', sort_order: 2 },
    { title: 'Elena S.', slug: 'elena-s', name: 'Elena S.', role: 'Brand Manager', quote: 'Working with Nikolas was a fantastic experience. He understood our vision immediately and delivered stunning content.', video_url: '', image: '/images/testimonial-3.jpg', sort_order: 3 },
  ];
  for (const t of testimonials) {
    const { title, slug, ...data } = t;
    await create(token, colId, title, slug, data);
  }
}

async function seedReels(token: string, colId: string) {
  console.log('  reels');
  const reels = [
    { title: 'Reel 1', slug: 'reel-1', url: 'https://instagram.com/reel/1', image: '/images/project-1.jpg', date_label: 'Mar 2026', sort_order: 1 },
    { title: 'Reel 2', slug: 'reel-2', url: 'https://instagram.com/reel/2', image: '/images/project-2.jpg', date_label: 'Feb 2026', sort_order: 2 },
    { title: 'Reel 3', slug: 'reel-3', url: 'https://instagram.com/reel/3', image: '/images/project-3.jpg', date_label: 'Jan 2026', sort_order: 3 },
    { title: 'Reel 4', slug: 'reel-4', url: 'https://instagram.com/reel/4', image: '/images/project-4.jpg', date_label: 'Dec 2025', sort_order: 4 },
  ];
  for (const r of reels) {
    const { title, slug, ...data } = r;
    await create(token, colId, title, slug, data);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding Nikolas Petrou CMS at ${API_URL}\n`);

  const token = await getAdminToken();
  console.log('Authenticated\n');

  // Activate Quill editor
  await fetch(`${API_URL}/admin/plugins/quill-editor/toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Cookie: `auth_token=${token}` },
  }).catch(() => {});

  const ids = new Map<string, string>();
  const names = ['site_settings', 'hero', 'about', 'projects', 'services', 'testimonials', 'reels'];
  for (const n of names) ids.set(n, await getCollectionId(token, n));

  console.log('Seeding collections:');
  await seedSiteSettings(token, ids.get('site_settings')!);
  await seedHero(token, ids.get('hero')!);
  await seedAbout(token, ids.get('about')!);
  await seedProjects(token, ids.get('projects')!);
  await seedServices(token, ids.get('services')!);
  await seedTestimonials(token, ids.get('testimonials')!);
  await seedReels(token, ids.get('reels')!);

  // Create editor user for Nikolas
  console.log('\nCreating editor user...');
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nikolaspetrouu@hotmail.com', username: 'nikolas', firstName: 'Nikolas', lastName: 'Petrou', password: 'np-editor-2026!' }),
  }).catch(() => {});

  console.log('\nDone! All collections seeded.\n');
  console.log('Admin:  hello@infront.cy / np-admin-2026!');
  console.log('Editor: nikolaspetrouu@hotmail.com / np-editor-2026!');
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
