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
  // 2D array of gen eds
  // e.g. [["FSAW", "FSPW"], ["DSNL", "DSNS"]]
  // Each inner array represents gen-eds that a course can use simultaneously
  // Each seperate inner array represents the OR relationship between the gen-eds
  genEds: GenEd[][]
  preReqs: string[];
}

export type GenEd = 
  | "NONE"
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