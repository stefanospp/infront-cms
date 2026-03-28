/**
 * CMS data layer — tries Payload API first, falls back to hardcoded data.
 * This is the single entry point for all data fetching on the site.
 * Server-only module.
 */

import {
  getCourses as fetchCourses,
  getSubjects as fetchSubjects,
  getSchools as fetchSchools,
  getResources as fetchResources,
  getUniversityExams as fetchUniversityExams,
  getFAQs as fetchFAQs,
  getSiteSettings as fetchSiteSettings,
  getHomeSections as fetchHomeSections,
  type PayloadCourse,
  type PayloadSchool,
  type PayloadFAQ,
  type PayloadUniversityExam,
} from './payload';

// Fallback data imports
import { courses as fallbackCourses, type Course } from './courses';
import { subjectDetails as fallbackSubjects, schoolData as fallbackSchoolData } from './subjects';
import { resources as fallbackResources } from './resources';
import { universityExams as fallbackUniversityExams } from './university';

// ── Courses ──

function mapPayloadCourse(pc: PayloadCourse): Course {
  return {
    slug: pc.slug,
    name: pc.name,
    description: pc.description,
    fullDescription: typeof pc.fullDescription === 'string' ? pc.fullDescription : pc.description,
    dates: pc.dates,
    subject: pc.subject,
    level: pc.level,
    season: pc.season,
    examBoard: pc.examBoard,
    schools: [], // Schools come as IDs from Payload, simplified for now
    classSize: pc.classSize,
    duration: pc.duration,
    schedule: pc.schedule,
    color: pc.color,
    status: pc.status,
    price: pc.price,
    priceNote: pc.priceNote,
    topics: pc.topics?.map((t) => t.topic) || [],
    whatYouGet: pc.whatYouGet?.map((w) => w.item) || [],
  };
}

export async function getCourses(): Promise<Course[]> {
  try {
    const payloadCourses = await fetchCourses();
    return payloadCourses.map(mapPayloadCourse);
  } catch {
    return fallbackCourses;
  }
}

// ── Subjects ──

export async function getSubjects() {
  try {
    const payloadSubjects = await fetchSubjects();
    return payloadSubjects.map((ps) => ({
      slug: ps.slug,
      name: ps.name,
      code: ps.code,
      color: ps.color,
      tagline: ps.tagline,
      fullDescription: typeof ps.fullDescription === 'string' ? ps.fullDescription : ps.tagline,
      levels: ps.levels?.map((l) => ({
        name: l.name,
        examBoards: l.examBoards?.map((b) => b.board) || [],
        topics: l.topics?.map((t) => t.topic) || [],
      })) || [],
      whyStudy: ps.whyStudy?.map((w) => w.reason) || [],
      schools: [], // Simplified
    }));
  } catch {
    return fallbackSubjects;
  }
}

// ── Schools ──

export async function getSchools() {
  try {
    const payloadSchools = await fetchSchools();
    return payloadSchools.map((ps: PayloadSchool) => ({
      name: ps.name,
      location: ps.location,
      examBoards: ps.examBoards,
      subjects: [], // Will be populated by subjects data
      levels: ps.levels || [],
    }));
  } catch {
    return fallbackSchoolData;
  }
}

// ── Resources ──

export async function getResources() {
  try {
    const payloadResources = await fetchResources();
    return payloadResources.map((pr) => ({
      slug: pr.slug,
      name: pr.name,
      description: pr.description,
      subject: pr.subject,
      level: pr.level,
      type: pr.type as any,
      examBoard: pr.examBoard,
      fileType: pr.fileSize ? 'PDF' : undefined,
      fileSize: pr.fileSize,
      url: pr.url,
      date: '',
      color: pr.color,
      status: pr.status,
    }));
  } catch {
    return fallbackResources;
  }
}

// ── University Exams ──

export async function getUniversityExams() {
  try {
    const payloadExams = await fetchUniversityExams();
    return payloadExams.map((pe: PayloadUniversityExam) => ({
      slug: pe.slug,
      name: pe.name,
      shortName: pe.shortName,
      region: pe.region,
      description: pe.description,
      fullDescription: typeof pe.fullDescription === 'string' ? pe.fullDescription : pe.description,
      color: pe.color,
      forWho: pe.forWho,
      sections: pe.sections || [],
      whatWeOffer: pe.whatWeOffer?.map((w) => w.item) || [],
      timeline: pe.timeline,
    }));
  } catch {
    return fallbackUniversityExams;
  }
}

// ── FAQs ──

export async function getFAQs() {
  try {
    const payloadFAQs = await fetchFAQs();
    return payloadFAQs.map((pf: PayloadFAQ) => ({
      question: pf.question,
      answer: pf.answer,
    }));
  } catch {
    // Return hardcoded FAQs from the FAQ component
    return null; // null = use component defaults
  }
}

// ── Site Settings ──

export async function getSiteSettings() {
  try {
    return await fetchSiteSettings();
  } catch {
    return null; // null = use component defaults
  }
}

// ── Home Sections ──

export async function getHomeSections() {
  try {
    return await fetchHomeSections();
  } catch {
    return null; // null = use component defaults
  }
}
