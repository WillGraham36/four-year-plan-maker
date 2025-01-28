export type Semester = {
  id: number
  name: string
  year: number
  courses: Course[]
}

export type Course = {
  courseID: string
  name: string
  description: string
  credits: number
  genEds: GenEd[]
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