export type Semester = {
  id: number
  name: string
  year: number
  courses: Course[]
}

export type Course = {
  courseId: string
  name: string
  description: string
  credits: number
  genEds: GenEd[]
  preReqs: string[];
}

export type GenEd = 
  | "FSAW"
  | "FSPW"
  | "FSMA"
  | "FSOC"
  | "FSAR"
  | "DSNL"
  | "DSNS"
  | "DSHS"
  | "DSHU"
  | "DSSP"
  | "SCIS"
  | "DVUP"
  | "DVCC"

export type CustomServerResponse<T> =
  | { ok: true; message: string; data: T }
  | { ok: false; message: string; data: null }