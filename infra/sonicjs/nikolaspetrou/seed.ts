/**
 * Seed script for Nikolas Petrou SonicJs CMS
 * Content exported from live Directus instance (2026-03-26)
 *
 * Usage:
 *   1. Start the dev server: npm run dev -- --port 8788
 *   2. Run: SONICJS_URL=http://localhost:8788 npm run seed
 */

const API_URL = process.env.SONICJS_URL || 'http://localhost:8788';
const SEED_SECRET = process.env.SEED_SECRET || 'nikolaspetrou-cms-local-dev-secret';

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-seed-secret': SEED_SECRET },
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

// ─── Seed Data (exported from live Directus 2026-03-26) ───────────────────────

async function seedSiteSettings(token: string, colId: string) {
  console.log('  site_settings');
  await create(token, colId, 'Nikolas Petrou', 'site-settings', {
    tagline: 'Videographer & Content Creator',
    email: 'hello@nikolaspetrou.com',
    seo_title: 'Nikolas Petrou — Videographer & Content Creator',
    seo_description: 'Professional videographer and content creator. Cinematic video production, creative direction, and social media content. Based in Cyprus.',
    instagram_url: 'https://instagram.com/nikolaspetrouu',
    facebook_url: 'https://facebook.com/Nikolaspetrouu',
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
    heading: 'Stay true to yourself...',
    subheading: 'Video content that engages, inspires, and tells stories worth sharing.',
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
    heading: 'I tell stories through film.',
    subheading: "I'm Nikolas Petrou — a videographer and content creator focused on crafting cinematic visuals that connect with people.",
    description: '<p>Every project is an opportunity to push creative boundaries. I turn ideas into powerful visual stories that leave a lasting impact and deliver real results.</p>',
    hero_image: '/images/about-hero.jpg',
    cta_text: 'Get in touch',
    values_heading: 'I believe every project deserves the same passion, creativity, and attention to detail — no matter the size.',
    values_description: 'My approach is simple: understand the story, capture it authentically, and edit it to perfection. Every frame matters.',
  });
}

async function seedProjects(token: string, colId: string) {
  console.log('  projects');
  const projects = [
    { title: 'Coastal', slug: 'coastal', subtitle: 'Where Land Meets Sea', video_url: 'https://cdn.pixabay.com/video/2022/08/16/128015-740186542_large.mp4', sort_order: 1, featured_in_hero: true, hero_sort_order: 0, description: '<p>A cinematic exploration of coastlines and the stories they hold. Dramatic cliffs, hidden coves, and the ever-changing light.</p><p>Featuring aerial drone footage and underwater sequences for a tourism campaign.</p>', client: 'Tourism Campaign', year: '2024', category: 'Brand Film' },
    { title: 'Stay True to Yourself', slug: 'stay-true', subtitle: 'Cinematic Self-Expression', video_url: 'https://cdn.pixabay.com/video/2025/07/27/293788_large.mp4', sort_order: 2, featured_in_hero: false, hero_sort_order: 0, description: '<p>A personal project exploring themes of authenticity and self-expression through cinematic visuals.</p><p>The project was entirely self-directed, from concept development through to final color grade and sound design.</p>', client: 'Personal Project', year: '2025', category: 'Personal' },
    { title: 'Aerial Perspectives', slug: 'aerial', subtitle: 'A View From Above', video_url: 'https://cdn.pixabay.com/video/2024/12/13/246462_large.mp4', sort_order: 3, featured_in_hero: false, hero_sort_order: 0, description: "<p>Showcasing the world from a bird's eye view. Aerial footage that reveals patterns, textures, and stories invisible from the ground.</p><p>Shot using FPV and stabilized drone technology in 4K resolution.</p>", client: 'Various Clients', year: '2024', category: 'Commercial' },
    { title: 'Mountain Adventures', slug: 'mountains', subtitle: 'Exploring New Heights', video_url: '/images/pv4.mp4', sort_order: 4, featured_in_hero: false, hero_sort_order: 0, description: '<p>An adventure film documenting mountain expeditions. From pre-dawn starts to summit celebrations, capturing the full emotional arc.</p><p>Created as a brand film for an outdoor equipment company.</p>', client: 'Outdoor Brand', year: '2024', category: 'Brand Film' },
    { title: 'Underwater World', slug: 'underwater', subtitle: 'Beneath the Surface', video_url: 'https://videos.pexels.com/video-files/36473015/15465933_640_360_30fps.mp4', sort_order: 5, featured_in_hero: false, hero_sort_order: 0, description: '<p>Diving beneath the surface to capture the hidden world below with specialized underwater housing and lighting.</p><p>Used across social media campaigns and a mini-documentary about ocean conservation.</p>', client: 'Conservation Foundation', year: '2025', category: 'Documentary' },
    { title: 'Golden Hour', slug: 'golden-hour', subtitle: 'Chasing the Light', video_url: 'https://videos.pexels.com/video-files/36473005/15465944_640_360_30fps.mp4', sort_order: 6, featured_in_hero: false, hero_sort_order: 0, description: '<p>A visual love letter to the golden hour. Compiled from shoots across multiple countries.</p><p>Originally a showreel piece, it became a viral social media hit.</p>', client: 'Personal Project', year: '2025', category: 'Social Media' },
  ];
  for (const p of projects) {
    const { title, slug, ...data } = p;
    await create(token, colId, title, slug, { ...data, image: '', reel_url: '', gallery: JSON.stringify([]) });
  }
}

async function seedServices(token: string, colId: string) {
  console.log('  services');
  const services = [
    { title: 'Video Production', slug: 'video-production', description: 'From concept to final cut, I handle the entire production process. Scripting, filming, editing — delivering polished content that tells your story.', tags: JSON.stringify(['Commercials', 'Brand Films', 'Short Films', 'Reels']), icon: '🎬', video_url: 'https://videos.pexels.com/video-files/5544413/5544413-sd_640_360_24fps.mp4', sort_order: 1 },
    { title: 'Creative Direction', slug: 'creative-direction', description: 'I work closely with you to develop unique concepts and visual narratives that resonate with your audience and elevate your brand.', tags: JSON.stringify(['Concept Development', 'Storyboarding', 'Art Direction', 'Brand Identity']), icon: '🎨', video_url: 'https://videos.pexels.com/video-files/6981425/6981425-sd_640_360_25fps.mp4', sort_order: 2 },
    { title: 'Content Creation', slug: 'content-creation', description: 'Professional content for social media, websites, and campaigns. Optimized for engagement and crafted to stand out in crowded feeds.', tags: JSON.stringify(['Social Media', 'Instagram Reels', 'YouTube', 'Campaign Content']), icon: '📱', video_url: 'https://videos.pexels.com/video-files/4232189/4232189-sd_640_360_24fps.mp4', sort_order: 3 },
    { title: 'Aerial & Drone Filming', slug: 'aerial-drone', description: 'Cinematic drone footage that adds depth, scale, and a unique perspective to any project. Breathtaking aerial shots for any occasion.', tags: JSON.stringify(['Drone Cinematography', 'Aerial Shots', 'FPV Filming', 'Landscape']), icon: '🚁', video_url: '', sort_order: 4 },
    { title: 'Post-Production & Editing', slug: 'post-production', description: 'Expert editing, color grading, motion graphics, and sound design. Every frame polished to perfection for maximum impact.', tags: JSON.stringify(['Video Editing', 'Color Grading', 'Motion Graphics', 'Sound Design']), icon: '✂️', video_url: '', sort_order: 5 },
    { title: 'Brand Partnerships', slug: 'brand-partnerships', description: 'Authentic content creation for brands and businesses. Reaching engaged audiences through compelling visual storytelling across platforms.', tags: JSON.stringify(['Sponsored Content', 'Brand Stories', 'UGC', 'Campaign Content']), icon: '🤝', video_url: '', sort_order: 6 },
  ];
  for (const s of services) {
    const { title, slug, ...data } = s;
    await create(token, colId, title, slug, data);
  }
}

async function seedTestimonials(token: string, colId: string) {
  console.log('  testimonials');
  const testimonials = [
    { title: 'Satisfied Client', slug: 'satisfied-client', name: 'Satisfied Client', role: 'Brand Partnership', quote: 'Nikolas has an incredible eye for storytelling. He understood our vision instantly and delivered content that exceeded every expectation.', video_url: 'https://videos.pexels.com/video-files/8336666/8336666-sd_960_506_25fps.mp4', image: '', sort_order: 1 },
    { title: 'Happy Client', slug: 'happy-client', name: 'Happy Client', role: 'Content Campaign', quote: 'Professional, creative, and incredibly easy to work with. The final videos were stunning — exactly what we needed to elevate our brand.', video_url: 'https://videos.pexels.com/video-files/36473005/15465944_640_360_30fps.mp4', image: '', sort_order: 2 },
    { title: 'Returning Client', slug: 'returning-client', name: 'Returning Client', role: 'Ongoing Collaboration', quote: 'The quality of his work speaks for itself. His reels consistently perform well and his attention to detail in every frame is unmatched.', video_url: 'https://videos.pexels.com/video-files/32860581/14006554_640_360_60fps.mp4', image: '', sort_order: 3 },
  ];
  for (const t of testimonials) {
    const { title, slug, ...data } = t;
    await create(token, colId, title, slug, data);
  }
}

async function seedReels(token: string, colId: string) {
  console.log('  reels');
  const reels = [
    { title: 'Reel 1', slug: 'reel-1', url: 'https://www.instagram.com/reel/C14N94RKhK_/', image: '/images/project-1.jpg', date_label: '2 months ago', sort_order: 1 },
    { title: 'Reel 2', slug: 'reel-2', url: 'https://www.instagram.com/reel/DFM7L9Uugq9/', image: '/images/project-2.jpg', date_label: '3 months ago', sort_order: 2 },
    { title: 'Reel 3', slug: 'reel-3', url: 'https://www.instagram.com/reel/CjA5aKVguYE/', image: '/images/project-3.jpg', date_label: '4 months ago', sort_order: 3 },
    { title: 'Reel 4', slug: 'reel-4', url: 'https://www.instagram.com/reel/DDBQo9sTKR0/', image: '/images/project-4.jpg', date_label: '5 months ago', sort_order: 4 },
    { title: 'Reel 5', slug: 'reel-5', url: 'https://www.instagram.com/reel/DB_ZIJTh3Fe/', image: '/images/project-1.jpg', date_label: '6 months ago', sort_order: 5 },
    { title: 'Reel 6', slug: 'reel-6', url: 'https://www.instagram.com/reel/C8Ccm9_Bg-4/', image: '/images/project-2.jpg', date_label: '7 months ago', sort_order: 6 },
  ];
  for (const r of reels) {
    const { title, slug, ...data } = r;
    await create(token, colId, title, slug, data);
  }
}

async function seedFormSettings(token: string, colId: string) {
  console.log('  form_settings');
  await create(token, colId, 'Contact Form', 'contact-form', {
    form_name: 'contact',
    fields: JSON.stringify([
      { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'John Smith' },
      { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'john@example.com' },
      { name: 'phone', label: 'Phone (optional)', type: 'tel', required: false, placeholder: '+357 99 000 000' },
      { name: 'message', label: 'Your message', type: 'textarea', required: true, placeholder: "Tell me about your project..." },
    ]),
    notification_recipients: JSON.stringify(['hello@nikolaspetrou.com']),
    success_message: "Thanks for reaching out! I'll get back to you shortly.",
    error_message: 'Something went wrong. Please try again or email me directly.',
    submit_button_text: 'Send message',
    enable_turnstile: false,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding Nikolas Petrou CMS at ${API_URL}\n`);

  const token = await getAdminToken();
  console.log('Authenticated\n');

  // Activate Quill + Workflow
  await fetch(`${API_URL}/admin/plugins/quill-editor/toggle`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, Cookie: `auth_token=${token}` },
  }).catch(() => {});

  const ids = new Map<string, string>();
  const names = ['site_settings', 'hero', 'about', 'projects', 'services', 'testimonials', 'reels', 'form_settings'];
  for (const n of names) ids.set(n, await getCollectionId(token, n));

  console.log('Seeding collections:');
  await seedSiteSettings(token, ids.get('site_settings')!);
  await seedHero(token, ids.get('hero')!);
  await seedAbout(token, ids.get('about')!);
  await seedProjects(token, ids.get('projects')!);
  await seedServices(token, ids.get('services')!);
  await seedTestimonials(token, ids.get('testimonials')!);
  await seedReels(token, ids.get('reels')!);
  await seedFormSettings(token, ids.get('form_settings')!);

  // Create editor user
  console.log('\nCreating editor user...');
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-seed-secret': SEED_SECRET },
    body: JSON.stringify({ email: 'nikolaspetrouu@hotmail.com', username: 'nikolas', firstName: 'Nikolas', lastName: 'Petrou', password: 'np-editor-2026!' }),
  }).catch(() => {});

  console.log('\nDone! All collections seeded.\n');
  console.log('Admin:  hello@infront.cy / np-admin-2026!');
  console.log('Editor: nikolaspetrouu@hotmail.com / np-editor-2026!');
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
