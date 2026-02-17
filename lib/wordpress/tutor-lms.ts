/**
 * Servicio para gestión de Tutor LMS
 */

import { wpClient } from './client'

export interface TutorCourse {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  slug: string
  status: string
  link: string
  featured_media: number
  author: number
  date: string
  modified: string
  categories: number[]
  tags: number[]
  meta: any
}

export interface TutorLesson {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  slug: string
  status: string
  link: string
  course_id: number
}

export interface EnrollmentData {
  user_id: number
  course_id: number
}

export interface CourseProgress {
  course_id: number
  user_id: number
  completed_lessons: number
  total_lessons: number
  progress_percentage: number
  is_completed: boolean
}

export class TutorLMSService {
  /**
   * Obtener todos los cursos
   */
  async getCourses(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: 'publish' | 'draft' | 'pending'
    author?: number
  }): Promise<TutorCourse[]> {
    const queryParams = {
      ...params,
      _embed: true, // Incluir datos embebidos
    }

    return wpClient.get<TutorCourse[]>('/wp/v2/courses', queryParams)
  }

  /**
   * Obtener un curso por ID
   */
  async getCourse(courseId: number): Promise<TutorCourse> {
    return wpClient.get<TutorCourse>(`/wp/v2/courses/${courseId}`, { _embed: true })
  }

  /**
   * Obtener lecciones de un curso
   */
  async getCourseLessons(courseId: number): Promise<TutorLesson[]> {
    return wpClient.get<TutorLesson[]>('/tutor/v1/lessons', {
      course_id: courseId,
      per_page: 100,
    })
  }

  /**
   * Matricular un estudiante en un curso
   */
  async enrollStudent(userId: number, courseId: number): Promise<any> {
    return wpClient.post('/tutor/v1/course-enroll', {
      user_id: userId,
      course_id: courseId,
    })
  }

  /**
   * Desmatricular un estudiante de un curso
   */
  async unenrollStudent(userId: number, courseId: number): Promise<any> {
    return wpClient.post('/tutor/v1/course-unenroll', {
      user_id: userId,
      course_id: courseId,
    })
  }

  /**
   * Obtener cursos de un estudiante
   */
  async getStudentCourses(userId: number): Promise<TutorCourse[]> {
    return wpClient.get<TutorCourse[]>('/tutor/v1/enrolled-courses', {
      user_id: userId,
    })
  }

  /**
   * Marcar un curso como completado
   */
  async completeCourse(userId: number, courseId: number): Promise<any> {
    return wpClient.post('/tutor/v1/course-complete', {
      user_id: userId,
      course_id: courseId,
    })
  }

  /**
   * Obtener progreso de un estudiante en un curso
   */
  async getCourseProgress(userId: number, courseId: number): Promise<CourseProgress> {
    return wpClient.get<CourseProgress>('/tutor/v1/course-progress', {
      user_id: userId,
      course_id: courseId,
    })
  }

  /**
   * Obtener todos los estudiantes matriculados en un curso
   */
  async getCourseStudents(courseId: number, params?: {
    page?: number
    per_page?: number
  }): Promise<any[]> {
    return wpClient.get('/tutor/v1/course-students', {
      course_id: courseId,
      ...params,
    })
  }

  /**
   * Verificar si un estudiante está matriculado en un curso
   */
  async isStudentEnrolled(userId: number, courseId: number): Promise<boolean> {
    try {
      const courses = await this.getStudentCourses(userId)
      return courses.some(course => course.id === courseId)
    } catch {
      return false
    }
  }

  /**
   * Obtener estadísticas de un curso
   */
  async getCourseStats(courseId: number): Promise<{
    total_students: number
    completed_students: number
    average_progress: number
  }> {
    return wpClient.get(`/tutor/v1/course-stats/${courseId}`)
  }

  /**
   * Resetear progreso de un estudiante en un curso
   */
  async resetCourseProgress(userId: number, courseId: number): Promise<any> {
    return wpClient.post('/tutor/v1/course-reset', {
      user_id: userId,
      course_id: courseId,
    })
  }

  /**
   * Marcar una lección como completada
   */
  async completeLesson(userId: number, lessonId: number): Promise<any> {
    return wpClient.post('/tutor/v1/lesson-complete', {
      user_id: userId,
      lesson_id: lessonId,
    })
  }

  /**
   * Obtener quizzes de un curso
   */
  async getCourseQuizzes(courseId: number): Promise<any[]> {
    return wpClient.get('/tutor/v1/quizzes', {
      course_id: courseId,
      per_page: 100,
    })
  }

  /**
   * Obtener intentos de quiz de un estudiante
   */
  async getQuizAttempts(userId: number, quizId: number): Promise<any[]> {
    return wpClient.get('/tutor/v1/quiz-attempts', {
      user_id: userId,
      quiz_id: quizId,
    })
  }
}

// Instancia singleton del servicio
export const tutorLMSService = new TutorLMSService()
