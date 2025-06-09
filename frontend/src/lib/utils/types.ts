export type Semester = {
  id: number
  name: string
  year: number
  courses: Course[]
}

export type Course = {
  courseId: string
  name: string
  credits: number
  // 2D array of gen eds
  // e.g. [["FSAW", "FSPW"], ["DSNL", "DSNS"]]
  // Each inner array represents gen-eds that a course can use simultaneously
  // Each seperate inner array represents the OR relationship between the gen-eds
  genEds: GenEd[][]
  selectedGenEds?: GenEd[]
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

export type Term = "FALL" | "SPRING" | "SUMMER" | "WINTER";


export const ACCEPTABLE_ULC_AREAS = [
  "AAAS", "AAPS", "AAST", "ABRM", "AGNR", "AGST", "AMSC", "AMST",
  "ANSC", "ANTH", "AOSC", "ARAB", "ARCH", "AREC", "ARHU", "ARMY",
  "ARSC", "ARTH", "ARTT", "ASTR", "BCHM", "BDBA", "BIOE", "BIOI",
  "BIOL", "BIOM", "BIPH", "BISI", "BMGT", "BMIN", "BMSO", "BSCI",
  "BSOS", "BSST", "BUAC", "BUDT", "BUFN", "BULM", "BUMK", "BUSI",
  "BUSM", "BUSO", "CBMG", "CCJS", "CHBE", "CHEM", "CHIN", "CHPH",
  "CHSE", "CINE", "CLAS", "CLFS", "CMLT", "CMNS", "COMM", "CRLN",
  "DANC", "DATA", "ECON", "EDCP", "EDHD", "EDHI", "EDMS", "EDSP",
  "EDUC", "EMBA", "ENAE", "ENAI", "ENBC", "ENCE", "ENCO", "ENEB",
  "ENED", "ENES", "ENFP", "ENGL", "ENMA", "ENME", "ENMT", "ENPM",
  "ENRE", "ENSE", "ENSP", "ENST", "ENTM", "ENTS", "ENVH", "EPIB",
  "FGSM", "FIRE", "FMSC", "FREN", "GBHL", "GEMS", "GEOG", "GEOL",
  "GERS", "GREK", "GVPT", "HACS", "HBUS", "HDCC", "HEBR", "HESI",
  "HESP", "HISP", "HIST", "HLSA", "HLSC", "HLTH", "IDEA", "IMDM",
  "IMMR", "INAG", "INFM", "ISRL", "ITAL", "JAPN", "JOUR", "JWST",
  "KNES", "KORA", "LACS", "LARC", "LATN", "LBSC", "LEAD", "LGBT",
  "LING", "MATH", "MEES", "MIEH", "MITH", "MLAW", "MLSC", "MOCB",
  "MSML", "MUED", "MUSC", "NACS", "NAVY", "NEUR", "NFSC", "NIAS",
  "OURS", "PEER", "PERS", "PHIL", "PHPE", "PHSC", "PHYS", "PLCY",
  "PLSC", "PORT", "PSYC", "RDEV", "RELS", "RUSS", "SLAA", "SLLC",
  "SMLP", "SOCY", "SPAN", "SPHL", "STAT", "SURV", "TDPS", "THET",
  "TLPL", "TLTC", "UMEI", "UNIV", "URSP", "USLT", "VIPS", "VMSC",
  "WEID", "WGSS", "XPER"
];
