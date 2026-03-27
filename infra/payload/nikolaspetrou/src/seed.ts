/**
 * Seed script for Nikolas Petrou Payload CMS
 * Run: PAYLOAD_URL=http://localhost:3000 npm run seed
 */

const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'hello@infront.cy';
const ADMIN_PASSWORD = 'Inf-cms-NP-2026!';

async function api(method: string, endpoint: string, body?: unknown) {
  const res = await fetch(`${PAYLOAD_URL}/api${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

let token = '';

async function login() {
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    // Try to create the first user
    const createRes = await fetch(`${PAYLOAD_URL}/api/users/first-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Admin', role: 'admin' }),
    });
    if (!createRes.ok) throw new Error('Could not login or create admin user');
    const data = await createRes.json();
    token = data.token;
    return;
  }
  const data = await res.json();
  token = data.token;
}

async function seed() {
  console.log('🌱 Seeding Payload CMS...');
  await login();
  console.log('✓ Authenticated');

  // ── Projects ──
  const projects = [
    { title: 'Coastal', slug: 'coastal', category: 'Videography', year: 2024, video_url: 'https://cdn.pixabay.com/video/2016/05/12/3127-166335864_large.mp4', role: 'Director, Cinematographer', fullDescription: 'A cinematic exploration of coastal landscapes, capturing the raw power and serene beauty of the ocean. Shot across multiple locations over three weeks.', order: 1 },
    { title: 'Stay True to Yourself', slug: 'stay-true', category: 'Creative Direction', year: 2024, video_url: 'https://cdn.pixabay.com/video/2022/11/22/140111-774507949_large.mp4', role: 'Director, Editor', fullDescription: 'A personal documentary following artists who chose authenticity over commercial success. An intimate look at creative integrity.', order: 2 },
    { title: 'Aerial Perspectives', slug: 'aerial-perspectives', category: 'Drone Operation', year: 2024, video_url: 'https://cdn.pixabay.com/video/2024/06/29/218714_large.mp4', role: 'Drone Operator, Director', fullDescription: 'Breathtaking aerial cinematography showcasing landscapes from perspectives only possible with modern drone technology.', order: 3 },
    { title: 'Underwater World', slug: 'underwater-world', category: 'Documentary', year: 2023, video_url: 'https://cdn.pixabay.com/video/2025/04/29/275633_large.mp4', role: 'Director, Cinematographer', fullDescription: 'A deep dive into marine ecosystems, documenting the fragile beauty of underwater life and the conservation efforts to protect it.', order: 4 },
    { title: 'Golden Hour', slug: 'golden-hour', category: 'Brand Content', year: 2023, video_url: 'https://cdn.pixabay.com/video/2022/11/11/138588-770315514_large.mp4', role: 'Director, Colourist', fullDescription: 'A brand film shot entirely during golden hour, capturing the warmth and emotion that natural light brings to visual storytelling.', order: 5 },
  ];

  const existingProjects = await api('GET', '/projects?limit=1');
  if (existingProjects.totalDocs === 0) {
    for (const project of projects) {
      await api('POST', '/projects', project);
    }
    console.log(`✓ ${projects.length} projects created`);
  } else {
    console.log(`⏭ Projects already exist (${existingProjects.totalDocs}), skipping`);
  }

  // ── Services ──
  const services = [
    { title: 'Video Production', description: 'Commercial and documentary filmmaking with cinematic quality. From concept to final delivery.', video_url: 'https://cdn.pixabay.com/video/2024/05/23/213425_large.mp4', order: 1 },
    { title: 'Creative Direction', description: 'Creative direction and visual storytelling. Guiding projects from initial concept through to final cut.', video_url: 'https://cdn.pixabay.com/video/2022/11/22/140111-774507949_large.mp4', order: 2 },
    { title: 'Content Creation', description: 'Brand content planning and social media visual strategies that drive engagement and growth.', video_url: 'https://cdn.pixabay.com/video/2024/06/29/218714_large.mp4', order: 3 },
    { title: 'Post Production', description: 'Color grading, editing, and finishing with meticulous attention to detail and craft.', video_url: 'https://cdn.pixabay.com/video/2025/04/29/275633_large.mp4', order: 4 },
  ];

  const existingServices = await api('GET', '/services?limit=1');
  if (existingServices.totalDocs === 0) {
    for (const service of services) {
      await api('POST', '/services', service);
    }
    console.log(`✓ ${services.length} services created`);
  } else {
    console.log(`⏭ Services already exist (${existingServices.totalDocs}), skipping`);
  }

  // ── Clients ──
  const clients = [
    { name: 'Patagonia', type: 'Brand Campaign', year: 2024, video_url: 'https://cdn.pixabay.com/video/2016/05/12/3127-166335864_large.mp4', order: 1 },
    { name: 'GoPro', type: 'Action Sports Content', year: 2024, video_url: 'https://cdn.pixabay.com/video/2022/11/22/140111-774507949_large.mp4', order: 2 },
    { name: 'Sony', type: 'Product Launch Films', year: 2023, video_url: 'https://cdn.pixabay.com/video/2024/06/29/218714_large.mp4', order: 3 },
    { name: 'DJI', type: 'Aerial Cinematography', year: 2023, video_url: 'https://cdn.pixabay.com/video/2025/04/29/275633_large.mp4', order: 4 },
    { name: 'National Geographic', type: 'Documentary Series', year: 2023, video_url: 'https://cdn.pixabay.com/video/2022/11/11/138588-770315514_large.mp4', order: 5 },
  ];

  const existingClients = await api('GET', '/clients?limit=1');
  if (existingClients.totalDocs === 0) {
    for (const client of clients) {
      await api('POST', '/clients', client);
    }
    console.log(`✓ ${clients.length} clients created`);
  } else {
    console.log(`⏭ Clients already exist (${existingClients.totalDocs}), skipping`);
  }

  // ── Site Settings ──
  await api('POST', '/globals/site-settings', {
    siteName: 'Nikolas Petrou',
    tagline: 'Capturing moments that move.',
    navLinks: [
      { label: 'Works', href: '/works' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    contact: { email: 'hello@nikolaspetrou.com' },
    social: { instagram: 'https://instagram.com/nikolaspetrou', vimeo: 'https://vimeo.com/nikolaspetrou', youtube: 'https://youtube.com/@nikolaspetrou' },
  });
  console.log('✓ Site settings saved');

  // ── Home Sections ──
  await api('POST', '/globals/home-sections', {
    hero: {
      heading: 'Nikolas Petrou',
      subtext: 'Capturing moments that move.',
      video_url: 'https://cdn.pixabay.com/video/2022/08/16/128015-740186542_large.mp4',
    },
    works: { label: '(Selected Works)' },
    horizontalScroll: {
      words: [
        { word: 'Cinematic', videoUrl: 'https://cdn.pixabay.com/video/2016/05/12/3127-166335864_large.mp4' },
        { word: 'Authentic', videoUrl: 'https://cdn.pixabay.com/video/2022/11/22/140111-774507949_large.mp4' },
        { word: 'Visual', videoUrl: 'https://cdn.pixabay.com/video/2024/06/29/218714_large.mp4' },
        { word: 'Stories', videoUrl: 'https://cdn.pixabay.com/video/2025/04/29/275633_large.mp4' },
        { word: 'Capture', videoUrl: 'https://cdn.pixabay.com/video/2022/11/11/138588-770315514_large.mp4' },
        { word: 'Movement', videoUrl: 'https://cdn.pixabay.com/video/2024/05/23/213425_large.mp4' },
        { word: 'Emotion', videoUrl: 'https://cdn.pixabay.com/video/2016/05/12/3127-166335864_large.mp4' },
      ],
    },
    services: { label: '(Services)' },
    clients: { label: '(Selected Clients)' },
    footer: {
      label: '(Get in Touch)',
      ctaLine1: "LET'S",
      ctaLine2: 'WORK',
      ctaLine3: 'TOGETHER',
      video_url: 'https://cdn.pixabay.com/video/2024/05/23/213425_large.mp4',
      email: 'hello@nikolaspetrou.com',
      socialLinks: [
        { label: 'Instagram', href: 'https://instagram.com/nikolaspetrou' },
        { label: 'Vimeo', href: 'https://vimeo.com/nikolaspetrou' },
        { label: 'YouTube', href: 'https://youtube.com/@nikolaspetrou' },
      ],
    },
  });
  console.log('✓ Home sections saved');

  // ── Pages Global ──
  await api('POST', '/globals/pages', {
    about: {
      video_url: 'https://cdn.pixabay.com/video/2022/08/16/128015-740186542_large.mp4',
      directorName: 'Nikolas Petrou',
      location: 'Cyprus',
      specialisations: [
        { text: 'Cinematic Storytelling' },
        { text: 'Aerial Cinematography' },
        { text: 'Brand Content' },
        { text: 'Documentary Film' },
      ],
      bio: "I'm a videographer and content creator with a passion for visual storytelling. Every project begins with understanding the story — then finding the most compelling way to bring it to life.",
      bio2: "With experience across commercial campaigns, documentaries, brand content, and aerial cinematography, I bring a cinematic eye to every frame. From pre-production planning to final colour grade, I'm involved at every stage.",
      stats: [
        { value: '5+', label: 'Years' },
        { value: '50+', label: 'Projects' },
        { value: '20+', label: 'Clients' },
      ],
      process: [
        { title: 'Pre-Production', description: 'Concept, scripting, location scouting' },
        { title: 'Production', description: 'Direction, cinematography, sound' },
        { title: 'Post-Production', description: 'Editing, colour grading, finishing' },
      ],
      equipment: [
        { name: 'Sony FX6' },
        { name: 'DJI Inspire 3' },
        { name: 'DaVinci Resolve' },
      ],
    },
    contact: {
      heading: "Let's\nTalk",
      subtext: "Have a project in mind? I'd love to hear about it. Drop me a message and I'll get back to you within 24 hours.",
      email: 'hello@nikolaspetrou.com',
      location: 'Cyprus',
      socialLinks: [
        { label: 'Instagram', href: 'https://instagram.com/nikolaspetrou' },
        { label: 'Vimeo', href: 'https://vimeo.com/nikolaspetrou' },
        { label: 'YouTube', href: 'https://youtube.com/@nikolaspetrou' },
      ],
      projectTypes: [
        { label: 'Video Production', value: 'video-production' },
        { label: 'Creative Direction', value: 'creative-direction' },
        { label: 'Content Creation', value: 'content-creation' },
        { label: 'Post Production', value: 'post-production' },
        { label: 'Other', value: 'other' },
      ],
      budgetRanges: [
        { label: 'Under €2,000', value: 'under-2k' },
        { label: '€2,000 — €5,000', value: '2k-5k' },
        { label: '€5,000 — €10,000', value: '5k-10k' },
        { label: '€10,000+', value: '10k-plus' },
      ],
    },
    legal: {
      lastUpdated: '2026-03-01',
      privacySections: [
        { title: '1. Information We Collect', body: 'When you use our contact form, we collect your name, email address, and message content. We do not collect any personal information automatically beyond standard server logs.' },
        { title: '2. How We Use Your Information', body: 'Information submitted through the contact form is used solely to respond to your enquiry. We do not sell, share, or distribute your personal information to third parties.' },
        { title: '3. Data Storage', body: 'Contact form submissions are stored securely and retained only for as long as necessary to fulfill the purpose for which they were collected.' },
        { title: '4. Cookies', body: 'This website does not use cookies for tracking or advertising. Essential cookies may be used for site functionality.' },
        { title: '5. Third-Party Services', body: "We use Google Fonts for typography, which may collect usage data according to Google's privacy policy. Video content is hosted on third-party CDNs." },
        { title: '6. Your Rights', body: 'You have the right to request access to, correction of, or deletion of your personal data. Contact us at hello@nikolaspetrou.com for any privacy-related requests.' },
        { title: '7. Contact', body: 'For questions about this privacy policy, contact: hello@nikolaspetrou.com' },
      ],
      termsSections: [
        { title: '1. Services', body: 'Nikolas Petrou provides videography, creative direction, content creation, and post-production services. All project terms, deliverables, and timelines are agreed upon before work begins.' },
        { title: '2. Intellectual Property', body: 'All original content, including videos, photographs, and designs created by Nikolas Petrou remain the intellectual property of Nikolas Petrou unless otherwise agreed in a written contract. Clients receive a licence to use delivered content for agreed purposes.' },
        { title: '3. Payment Terms', body: 'Payment terms are outlined in individual project agreements. A deposit is typically required before work begins, with the balance due upon delivery.' },
        { title: '4. Cancellation', body: 'Either party may cancel a project with written notice. Deposits are non-refundable. Work completed up to the point of cancellation will be invoiced accordingly.' },
        { title: '5. Limitation of Liability', body: 'Nikolas Petrou shall not be liable for any indirect, incidental, or consequential damages arising from the use of services or delivered content.' },
        { title: '6. Website Use', body: 'This website and its content are provided for informational purposes. You may not reproduce, distribute, or create derivative works from any content on this site without prior written consent.' },
        { title: '7. Contact', body: 'For questions about these terms, contact: hello@nikolaspetrou.com' },
      ],
    },
  });
  console.log('✓ Pages global saved');

  console.log('\n🎉 Seed complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
