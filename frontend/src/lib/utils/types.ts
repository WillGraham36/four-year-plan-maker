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

export type CourseWithSemester = {
  course: Course
  semester: {
    term: Term
    year: number
  }
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

export type Term = "FALL" | "SPRING" | "SUMMER" | "WINTER" | "TRANSFER";


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

export const ACCEPTABLE_ULC_AREAS_SET: Record<string, true> = Object.fromEntries(
  ACCEPTABLE_ULC_AREAS.map(area => [area, true])
);

export const ACCEPTABLE_ULC_AREAS_MAP = new Map(
  ACCEPTABLE_ULC_AREAS.map(area => [area, true])
);

export const termOrder = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

export const ALL_MAJORS = [
  "Accounting",
  "Aerospace Engineering",
  "African American and Africana Studies",
  "Agricultural and Resource Economics",
  "Agricultural Science and Technology",
  "American Studies",
  "Animal Sciences",
  "Anthropology",
  "Arabic Studies",
  "Architecture",
  "Art History",
  "Astronomy",
  "Atmospheric and Oceanic Science",
  "Biochemistry",
  "Biocomputational Engineering",
  "Bioengineering",
  "Biological Sciences",
  "Chemical Engineering",
  "Chemistry",
  "Chinese",
  "Cinema and Media Studies (ENGL)",
  "Cinema and Media Studies (SLLC)",
  "Civil Engineering",
  "Classical Languages and Literatures",
  "Communication",
  "Computer Engineering",
  "Computer Science",
  "Criminology and Criminal Justice",
  "Cyber-Physical Systems Engineering",
  "Dance",
  "Early Childhood/Early Childhood Special Education",
  "Economics",
  "Electrical Engineering",
  "Elementary Education",
  "Elementary/Middle Special Education",
  "English Language and Literature",
  "Environmental Science and Policy",
  "Environmental Science and Technology",
  "Family Health",
  "Fermentation Science",
  "Finance",
  "Fire Protection Engineering",
  "French Language and Literature",
  "Geographical Sciences",
  "Geology",
  "German Studies",
  "Global Health",
  "Government and Politics",
  "Hearing and Speech Sciences",
  "History",
  "Human Development",
  "Immersive Media Design (ARTT)",
  "Immersive Media Design (CMSC)",
  "Individual Studies Program",
  "Information Science",
  "Information Systems",
  "International Business",
  "International Relations",
  "Italian Studies",
  "Japanese",
  "Jewish Studies",
  "Journalism",
  "Kinesiology",
  "Landscape Architecture",
  "Linguistics",
  "Management",
  "Marketing",
  "Materials Science and Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Middle School Education",
  "Music",
  "Neuroscience (BSOS)",
  "Neuroscience (CMNS)",
  "Nutrition and Food Science",
  "Operations Management & Business Analytics",
  "Persian Studies",
  "Philosophy",
  "Philosophy, Politics, and Economics",
  "Physics",
  "Plant Sciences",
  "Psychology",
  "Public Health Practice",
  "Public Health Science",
  "Public Policy",
  "Real Estate and the Built Environment",
  "Religions of the Ancient Middle East",
  "Romance Languages",
  "Russian Language and Literature",
  "Secondary Education - Art",
  "Secondary Education - English",
  "Secondary Education - Mathematics",
  "Secondary Education - Science",
  "Secondary Education - Social Studies",
  "Secondary Education - World Language",
  "Social Data Science (BSOS)",
  "Social Data Science (INFO)",
  "Sociology",
  "Spanish Language, Literatures, and Culture",
  "Studio Art",
  "Supply Chain Management",
  "Technology and Information Design",
  "Theatre",
  "Women, Gender, and Sexuality Studies",
];

export const ALL_MINORS = [
  "Actuarial Mathematics Minor",
  "Advanced Cybersecurity Experience for Students Minor",
  "African Studies Minor",
  "Agricultural Science and Technology Minor",
  "Anti-Black Racism Minor",
  "Arabic Minor",
  "Archaeology Minor (ARTH)",
  "Archaeology Minor (CLAS)",
  "Army Leadership Studies Minor",
  "Art History Minor",
  "Arts Leadership Minor",
  "Asian American Studies Minor",
  "Astronomy Minor",
  "Atmospheric Chemistry Minor",
  "Atmospheric Sciences Minor",
  "Black Women's Studies Minor (ARHU)",
  "Black Women's Studies Minor (BSOS)",
  "Business Analytics Minor",
  "Chinese Language Minor",
  "Classical Mythology Minor",
  "Computational Finance Minor (BMGT)",
  "Computational Finance Minor (CMSC)",
  "Computer Engineering Minor",
  "Computer Science Minor",
  "Construction Project Management Minor (ARCH)",
  "Construction Project Management Minor (ENGR)",
  "Creative Placemaking Minor (ARCH)",
  "Creative Placemaking Minor (ARHU)",
  "Creative Writing Minor",
  "Data Science Minor (CMSC)",
  "Data Science Minor (MATH)",
  "Demography Minor",
  "Digital Storytelling and Poetics Minor",
  "Disability Studies Minor",
  "Earth History Minor",
  "Earth Material Properties Minor",
  "Economics Minor",
  "Education Policy, Equity, and Justice Minor (EDUC)",
  "Education Policy, Equity, and Justice Minor (PLCY)",
  "Entomology Minor",
  "Entrepreneurial Leadership Minor",
  "French Studies Minor",
  "General Business Minor",
  "Geochemistry Minor",
  "Geographic Information Science Minor",
  "Geophysics Minor",
  "German Studies Minor",
  "Global Engineering Leadership Minor",
  "Global Poverty Minor",
  "Global Studies Minor",
  "Global Terrorism Studies Minor",
  "Greek Language and Culture Minor",
  "Hearing and Speech Sciences Minor",
  "Hebrew Studies Minor (JWST)",
  "Hebrew Studies Minor (SLLC)",
  "History and Theory of Architecture Minor",
  "History Minor",
  "Human Development Minor",
  "Humanities, Health, and Medicine Minor",
  "Hydrology Minor",
  "Information Risk Management, Ethics, and Privacy Minor",
  "International Development and Conflict Management Minor",
  "Israel Studies Minor",
  "Italian Language and Culture Minor",
  "Japanese Minor",
  "Jewish Studies Minor",
  "Kinesiology: Biomechanics and Motor Control Minor",
  "Kinesiology: Exercise Physiology Minor",
  "Kinesiology: Sport, Commerce, & Culture Minor",
  "Korean Studies Minor",
  "Landscape Management Minor",
  "Latin American and Caribbean Studies Minor",
  "Latin Language and Literature Minor",
  "Law and Society Minor",
  "Leadership Studies Minor",
  "LGBTQ Studies Minor",
  "Linguistics Minor",
  "Mathematics Minor",
  "Media, Technology and Democracy Minor",
  "Meteorology Minor",
  "Middle East Studies Minor",
  "Military Studies Minor",
  "Music and Culture Minor",
  "Music Performance Minor",
  "Nanoscale Science and Technology Minor",
  "Naval Science Minor",
  "Neuroscience Minor",
  "Nonprofit Leadership and Social Innovation Minor",
  "Nuclear Engineering Minor",
  "Paleobiology Minor (ENTM)",
  "Paleobiology Minor (GEOL)",
  "Persian Studies Minor",
  "Philosophy Minor",
  "Physics Minor",
  "Planetary Sciences Minor (ASTR)",
  "Planetary Sciences Minor (GEOL)",
  "Portuguese and Brazilian Studies Minor",
  "Professional Writing Minor",
  "Project Management Minor",
  "Public Leadership Minor",
  "Quantum Science and Engineering Minor",
  "Real Estate Development Minor",
  "Religious Studies Minor",
  "Remote Sensing of Environmental Change Minor",
  "Rhetoric Minor (COMM)",
  "Rhetoric Minor (ENGL)",
  "Robotics and Autonomous Systems Minor (CMSC)",
  "Robotics and Autonomous Systems Minor (ENGR)",
  "Russian Studies Minor",
  "Science, Technology, Ethics and Policy Minor (ENGR)",
  "Science, Technology, Ethics and Policy Minor (INFO)",
  "Science, Technology, Ethics and Policy Minor (PLCY)",
  "Secondary Education Minor",
  "Sociology Minor",
  "Soil Science Minor",
  "Spanish Minor 1: Literature, Linguistics, and Culture",
  "Spanish Minor 2: Language, Culture, and Professional Contexts",
  "Spanish Minor 3: Heritage Language and Latina/o Culture",
  "Statistics Minor",
  "Surficial Geology Minor",
  "Survey Methodology Minor",
  "Sustainability Studies Minor (AGNR)",
  "Sustainability Studies Minor (PLCY)",
  "Teaching English for Speakers of Other Languages (TESOL) Education Minor",
  "Technology Entrepreneurship and Corporate Innovation Minor",
  "Technology Innovation Leadership Minor",
  "U.S. Latina/o Studies Minor",
];